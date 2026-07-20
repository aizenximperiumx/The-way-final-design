#!/usr/bin/env node
// =============================================================
// Reconcile CEO accounts — end up with EXACTLY the CEOs you declare.
//
// Fixes "too many / conflicting CEO accounts": audits every account that
// currently has role=ceo (in auth app_metadata OR the profiles table), then
// makes the desired two the only ones left.
//
// SECRETS: read from env ONLY, never hardcoded — same rule as server.mjs.
// Needs the SERVICE ROLE key (the anon key in .env.local cannot do this).
//
// Usage (PowerShell):
//   $env:SUPABASE_URL="https://xxxx.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="<service role / sb_secret_ key>"
//   $env:CEO1_EMAIL="..."; $env:CEO1_USERNAME="..."; $env:CEO1_PASSWORD="..."; $env:CEO1_NAME="..."
//   $env:CEO2_EMAIL="..."; $env:CEO2_USERNAME="..."; $env:CEO2_PASSWORD="..."; $env:CEO2_NAME="..."
//
//   node scripts/reconcile-ceos.mjs                 # DRY RUN — shows the plan, changes nothing
//   node scripts/reconcile-ceos.mjs --apply         # apply, demoting extra CEOs to 'staff'
//   node scripts/reconcile-ceos.mjs --apply --delete-extras   # apply, DELETING extra CEOs
//
// demote (default) = account keeps existing, just loses CEO access. Reversible.
// delete           = auth user removed; profiles row cascades away. IRREVERSIBLE,
//                    and app_state (applications/chat/appointments) may still
//                    reference that user id, leaving orphaned records.
// =============================================================

const APPLY = process.argv.includes('--apply');
const DELETE_EXTRAS = process.argv.includes('--delete-extras');
const FORCE_DELETE_RENAMED = process.argv.includes('--force-delete-renamed');
const FORCE_NEW_EMAIL = process.argv.includes('--force-new-email');
const DEMOTE_ROLE = 'staff';

const env = process.env;
const SUPABASE_URL = String(env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const SERVICE_KEY = String(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || '').trim();

const fail = (msg) => { console.error(`\n✗ ${msg}\n`); process.exit(1); };

if (!SUPABASE_URL || !/^https?:\/\//i.test(SUPABASE_URL)) fail('SUPABASE_URL missing/invalid (must be https://xxxx.supabase.co).');
if (!SERVICE_KEY) fail('SUPABASE_SERVICE_ROLE_KEY missing. The anon key will NOT work — this needs the secret service role key.');
if (SERVICE_KEY.startsWith('sb_publishable_')) fail('That is the publishable (public) key. Use the SECRET service role key.');

// Desired CEOs, from env only.
// CEO*_EMAIL is OPTIONAL: if omitted, the script resolves the email from the
// EXISTING account that already owns CEO*_USERNAME. That is almost always what
// you want — it keeps the real account (and its history) and just resets the
// password/role, instead of creating an empty duplicate under a new domain.
const desired = [];
for (const n of [1, 2]) {
  const password = String(env[`CEO${n}_PASSWORD`] || '').trim();
  const username = String(env[`CEO${n}_USERNAME`] || '').trim();
  if (!password || !username) continue;
  desired.push({
    email: String(env[`CEO${n}_EMAIL`] || '').trim().toLowerCase(), // may be '' → resolve by username
    password,
    username,
    name: String(env[`CEO${n}_NAME`] || '').trim(),
  });
}
if (desired.length === 0) fail('No desired CEOs defined. Set CEO1_USERNAME + CEO1_PASSWORD (and CEO2_*). CEO*_EMAIL is optional.');

// ---- Supabase helpers (mirrors server.mjs key handling) ----
const authHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
const pgCandidates = (() => {
  const isJwt = SERVICE_KEY.startsWith('eyJ') && SERVICE_KEY.split('.').length === 3;
  if (isJwt) return [{ apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }];
  if (SERVICE_KEY.startsWith('sb_secret_')) return [{ apikey: SERVICE_KEY }, { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }];
  return [{ apikey: SERVICE_KEY }];
})();

const fetchJson = async (url, init = {}) => {
  const r = await fetch(url, init);
  const text = await r.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  return { ok: r.ok, status: r.status, text, json };
};

const pg = async (url, init = {}) => {
  let last = await fetchJson(url, { ...init, headers: { ...(init.headers || {}), ...pgCandidates[0] } });
  for (let i = 1; i < pgCandidates.length; i += 1) {
    if (last.ok || (last.status !== 401 && last.status !== 403)) return last;
    last = await fetchJson(url, { ...init, headers: { ...(init.headers || {}), ...pgCandidates[i] } });
  }
  return last;
};

const listAllAuthUsers = async () => {
  const all = [];
  for (let page = 1; page <= 25; page += 1) {
    const r = await fetchJson(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=200`, { headers: authHeaders });
    if (!r.ok) fail(`Could not list auth users (HTTP ${r.status}). ${String(r.text).slice(0, 200)}`);
    const users = Array.isArray(r.json) ? r.json : (Array.isArray(r.json?.users) ? r.json.users : []);
    all.push(...users);
    if (users.length < 200) break;
  }
  return all;
};

const upsertProfile = async (id, patch) => {
  const read = await pg(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=id&limit=1`);
  if (read.ok && Array.isArray(read.json) && read.json.length > 0) {
    return pg(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });
  }
  return pg(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ id, ...patch }),
  });
};

// ---- audit ----
const main = async () => {
  console.log(`\n${APPLY ? '=== APPLY MODE — changes WILL be written ===' : '=== DRY RUN — nothing will be changed ==='}`);
  console.log(`Project: ${SUPABASE_URL}\n`);

  const users = await listAllAuthUsers();
  const profRes = await pg(`${SUPABASE_URL}/rest/v1/profiles?select=id,username,role,name,email`);
  if (!profRes.ok) fail(`Could not read profiles (HTTP ${profRes.status}). ${String(profRes.text).slice(0, 200)}`);
  const profiles = Array.isArray(profRes.json) ? profRes.json : [];
  const profById = new Map(profiles.map((p) => [p.id, p]));

  const roleOf = (u) => {
    const appRole = u?.app_metadata?.role;
    const profRole = profById.get(u.id)?.role;
    return { appRole: appRole || '', profRole: profRole || '' };
  };
  const isCeo = (u) => { const { appRole, profRole } = roleOf(u); return appRole === 'ceo' || profRole === 'ceo'; };

  // ---- resolve each desired CEO to a REAL existing account where possible ----
  // Priority: explicit CEO*_EMAIL that already exists > account owning the
  // username > explicit CEO*_EMAIL (create new) > fail.
  console.log('--- RESOLVING DESIRED ACCOUNTS ---');
  const userByEmail = new Map(users.map((u) => [String(u.email || '').toLowerCase(), u]));
  const findByUsername = (uname) => {
    const target = uname.toLowerCase();
    const prof = profiles.find((p) => String(p.username || '').toLowerCase() === target);
    if (prof) { const u = users.find((x) => x.id === prof.id); if (u) return u; }
    return users.find((u) => String(u?.app_metadata?.username || u?.user_metadata?.username || '').toLowerCase() === target);
  };
  for (const d of desired) {
    const byEmail = d.email ? userByEmail.get(d.email) : null;
    const byName = findByUsername(d.username);
    if (byEmail) {
      console.log(`  "${d.username}" → ${d.email} (existing account matched by email)`);
    } else if (byName) {
      const realEmail = String(byName.email || '').toLowerCase();
      if (d.email && d.email !== realEmail) {
        console.log(`  ⚠ "${d.username}" already exists as ${realEmail}, but you asked for ${d.email}.`);
        console.log(`     Using the EXISTING account (${realEmail}) so its history is preserved.`);
        console.log(`     To instead force a brand-new account, set CEO*_EMAIL and pass --force-new-email.`);
      } else {
        console.log(`  "${d.username}" → ${realEmail} (resolved from existing username)`);
      }
      if (!FORCE_NEW_EMAIL) d.email = realEmail;
    } else if (d.email) {
      console.log(`  "${d.username}" → ${d.email} (no existing account — will be CREATED)`);
    } else {
      fail(`No account owns username "${d.username}" and no CEO*_EMAIL was given. Set the email explicitly to create it.`);
    }
  }
  console.log('');

  const currentCeos = users.filter(isCeo);
  const desiredEmails = new Set(desired.map((d) => d.email));

  console.log(`--- CURRENT CEO ACCOUNTS (${currentCeos.length}) ---`);
  if (currentCeos.length === 0) console.log('  (none)');
  for (const u of currentCeos) {
    const p = profById.get(u.id);
    const { appRole, profRole } = roleOf(u);
    const keep = desiredEmails.has(String(u.email || '').toLowerCase());
    console.log(`  ${keep ? 'KEEP  ' : 'EXTRA '} ${u.email}`);
    console.log(`         username=${p?.username ?? '(no profile)'}  auth.role=${appRole || '-'}  profile.role=${profRole || '-'}  id=${u.id}`);
  }

  // username collisions (profiles.username is UNIQUE — the usual "conflict")
  console.log(`\n--- USERNAME COLLISIONS for desired usernames ---`);
  let collisions = 0;
  for (const d of desired) {
    const holders = profiles.filter((p) => String(p.username || '').toLowerCase() === d.username.toLowerCase());
    for (const h of holders) {
      const holderUser = users.find((u) => u.id === h.id);
      const holderEmail = String(holderUser?.email || '').toLowerCase();
      if (holderEmail !== d.email) {
        collisions += 1;
        console.log(`  ⚠ username "${d.username}" is held by ${holderEmail || h.id} (role=${h.role}) — wanted for ${d.email}`);
      }
    }
  }
  if (collisions === 0) console.log('  none');

  const allExtras = currentCeos.filter((u) => !desiredEmails.has(String(u.email || '').toLowerCase()));

  // SAFETY: an "extra" whose username matches a desired username is almost
  // certainly the SAME PERSON under an older email. Deleting it would destroy
  // the real account (and its history) while we create an empty new one.
  // These are never auto-deleted; they are demoted unless --force-delete-renamed.
  const desiredUsernames = new Set(desired.map((d) => d.username.toLowerCase()));
  const sameNameOf = (u) => {
    const un = String(profById.get(u.id)?.username || u?.app_metadata?.username || '').toLowerCase();
    return un && desiredUsernames.has(un) ? un : '';
  };
  const suspect = allExtras.filter((u) => sameNameOf(u));
  const extras = allExtras.filter((u) => !sameNameOf(u));

  if (suspect.length > 0) {
    console.log(`\n--- ⚠ LIKELY THE SAME PERSON UNDER AN OLD EMAIL (${suspect.length}) ---`);
    for (const u of suspect) {
      console.log(`  ⚠ ${u.email} has username "${sameNameOf(u)}" — which you asked to assign to a NEW @theway.ge account.`);
      console.log(`     This is probably the REAL account with its history. It will be DEMOTED, not deleted.`);
      console.log(`     If you truly want it gone, re-run with --force-delete-renamed.`);
    }
    console.log(`  → Consider instead: set CEO*_EMAIL to "${suspect[0].email}" to keep the existing account.`);
  }

  console.log(`\n--- PLAN ---`);
  for (const d of desired) {
    const existing = users.find((u) => String(u.email || '').toLowerCase() === d.email);
    console.log(`  ${existing ? 'UPDATE' : 'CREATE'} ceo  ${d.email}  (username=${d.username}${d.name ? `, name=${d.name}` : ''})${existing ? ' — reset password + force role=ceo' : ''}`);
  }
  for (const u of suspect) {
    console.log(`  ${FORCE_DELETE_RENAMED ? 'DELETE (forced)' : `DEMOTE→${DEMOTE_ROLE} (protected)`}  ${u.email}  id=${u.id}`);
  }
  for (const u of extras) {
    console.log(`  ${DELETE_EXTRAS ? 'DELETE' : `DEMOTE→${DEMOTE_ROLE}`}  ${u.email}  id=${u.id}`);
  }
  if (allExtras.length === 0) console.log('  (no extra CEOs to remove)');
  console.log(`\n  Result: exactly ${desired.length} CEO account(s).`);

  if (!APPLY) {
    console.log('\nDry run only. Re-run with --apply to execute.');
    if (extras.length > 0 && !DELETE_EXTRAS) console.log(`Extras would be DEMOTED to '${DEMOTE_ROLE}' (reversible). Add --delete-extras to remove them entirely (irreversible).`);
    return;
  }

  console.log('\n--- EXECUTING ---');

  // 1) Free up usernames held by accounts that should not have them.
  for (const d of desired) {
    const holders = profiles.filter((p) => String(p.username || '').toLowerCase() === d.username.toLowerCase());
    for (const h of holders) {
      const holderUser = users.find((u) => u.id === h.id);
      const holderEmail = String(holderUser?.email || '').toLowerCase();
      if (holderEmail !== d.email) {
        const freed = `${h.username}_old_${h.id.slice(0, 6)}`;
        const r = await upsertProfile(h.id, { username: freed });
        console.log(`  ${r.ok ? '✓' : '✗'} freed username "${h.username}" → "${freed}" (was ${holderEmail || h.id})`);
      }
    }
  }

  // 2) Create/repair the desired CEOs.
  for (const d of desired) {
    const existing = users.find((u) => String(u.email || '').toLowerCase() === d.email);
    const meta = {
      app_metadata: { role: 'ceo', username: d.username },
      user_metadata: { username: d.username, ...(d.name ? { name: d.name } : {}) },
    };
    let id = existing?.id || '';
    if (id) {
      const r = await fetchJson(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: d.password, email_confirm: true, ...meta }),
      });
      console.log(`  ${r.ok ? '✓' : '✗'} updated auth user ${d.email}${r.ok ? '' : ` — ${String(r.text).slice(0, 160)}`}`);
    } else {
      const r = await fetchJson(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: d.email, password: d.password, email_confirm: true, ...meta }),
      });
      id = r.ok && typeof r.json?.id === 'string' ? r.json.id : '';
      console.log(`  ${id ? '✓' : '✗'} created auth user ${d.email}${id ? '' : ` — ${String(r.text).slice(0, 160)}`}`);
      if (!id) continue;
    }
    const p = await upsertProfile(id, { username: d.username, role: 'ceo', email: d.email, ...(d.name ? { name: d.name } : {}) });
    console.log(`  ${p.ok ? '✓' : '✗'} profile role=ceo username=${d.username} for ${d.email}${p.ok ? '' : ` — ${String(p.text).slice(0, 160)}`}`);
  }

  // 3) Remove/demote the extras. Protected (same-username) accounts are only
  //    deleted when explicitly forced; otherwise they are demoted.
  const toProcess = [
    ...extras.map((u) => ({ u, del: DELETE_EXTRAS })),
    ...suspect.map((u) => ({ u, del: DELETE_EXTRAS && FORCE_DELETE_RENAMED })),
  ];
  for (const { u, del: shouldDelete } of toProcess) {
    if (shouldDelete) {
      const r = await fetchJson(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(u.id)}`, { method: 'DELETE', headers: authHeaders });
      console.log(`  ${r.ok ? '✓' : '✗'} DELETED ${u.email}${r.ok ? '' : ` — ${String(r.text).slice(0, 160)}`}`);
    } else {
      const a = await fetchJson(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(u.id)}`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_metadata: { role: DEMOTE_ROLE } }),
      });
      const p = await upsertProfile(u.id, { role: DEMOTE_ROLE });
      console.log(`  ${a.ok && p.ok ? '✓' : '✗'} demoted ${u.email} → ${DEMOTE_ROLE}`);
    }
  }

  // 4) Verify.
  const after = await listAllAuthUsers();
  const afterProf = await pg(`${SUPABASE_URL}/rest/v1/profiles?select=id,username,role`);
  const afterById = new Map((Array.isArray(afterProf.json) ? afterProf.json : []).map((p) => [p.id, p]));
  const stillCeo = after.filter((u) => u?.app_metadata?.role === 'ceo' || afterById.get(u.id)?.role === 'ceo');
  console.log(`\n--- VERIFY ---`);
  for (const u of stillCeo) console.log(`  ceo: ${u.email}  username=${afterById.get(u.id)?.username ?? '-'}`);
  console.log(`\n${stillCeo.length === desired.length ? '✓' : '✗'} ${stillCeo.length} CEO account(s) remain (wanted ${desired.length}).`);
};

main().catch((e) => fail(e instanceof Error ? e.stack || e.message : String(e)));
