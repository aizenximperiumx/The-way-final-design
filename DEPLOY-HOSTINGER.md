# Moving The Way to Hostinger — full step-by-step guide

Follow this top to bottom. Do not skip Part 1 — it is the part that prevents
data loss.

**Time needed:** about 3 hours of work, plus waiting for DNS.
**Risk level:** low, *if* you keep Render running until Part 11.

---

## Part 0 — What you are actually moving

It helps to know what goes where, because most of your system is **not**
moving at all.

| Piece | Where it lives now | After the move |
|---|---|---|
| Website | Render | **Hostinger** |
| App backend (`/api/*`) | Render | **Hostinger** |
| Employee email | (none yet) | **Hostinger** |
| Database, logins, files | Supabase | Supabase — *unchanged* |
| Credential/reset emails | Resend | Resend — *unchanged* |
| The phone apps themselves | on people's phones | on people's phones |

Two important ideas:

1. **You do not "host" a phone app.** The app is installed on the phone. What
   you host is the backend it talks to — `https://theway.ge`. That backend is
   the same Node server that serves your website. One server does both jobs.
2. **Your database is not moving.** Supabase holds students, staff, logins,
   and uploaded files. This whole migration never touches it, which is why
   your data is safe throughout.

---

## Part 1 — Before you buy anything (do not skip)

### 1.1 Ask Hostinger two questions first

Open Hostinger's pre-sales live chat and ask, word for word:

> 1. On the Cloud Startup plan, does a Node.js application stay running
>    continuously, or is it stopped when idle and restarted on the next
>    request?
> 2. Is outbound HTTPS from a Node app unrestricted? My app calls external
>    APIs on every request.

**Why this matters:**

- If the app is **stopped when idle**, your SLA deadline penalties silently
  stop applying. Your website still works perfectly, so nobody notices.
- If **outbound HTTPS is blocked**, nothing works at all — your server cannot
  reach Supabase.

If they answer "always running" and "unrestricted", proceed. If not, see
[Troubleshooting → SLA sweep](#the-sla-sweep-is-not-running).

### 1.2 Save your current DNS records

Open your domain registrar's DNS panel and **screenshot every single record**.
Save the screenshots somewhere safe.

Changing nameservers in Part 4 **erases the entire DNS zone**. You will need
these to rebuild it. Pay special attention to anything mentioning:

- `info.theway.ge` (this is Resend — see below)
- `_dmarc`, `_domainkey`, `resend`, or any `TXT` record

### 1.3 Rescue your applications data ⚠️ MOST IMPORTANT STEP

Your website's application form writes to a file called `applications.jsonl`
on Render's disk. Your dashboards read that file and merge it into what staff
see. **It is live data and it is not in Supabase.**

If you cancel Render without copying it, every existing website application
disappears from your dashboards — with no error message, because the code
treats a missing file as "there are no applications."

**To rescue it:**

1. Go to your Render dashboard → your service → the **Shell** tab
2. Run:

   ```bash
   cat /var/data/theway/applications.jsonl
   ```

3. Select all the output and save it to a file on your computer named
   `applications.jsonl`
4. Count the lines and **write the number down** — you will verify this later:

   ```bash
   wc -l /var/data/theway/applications.jsonl
   ```

If the file does not exist, you have no stored applications yet and can skip
this. Confirm with `ls /var/data/theway/`.

---

## Part 2 — Buy the plan

1. Go to hostinger.com → **Hosting** → **Cloud Hosting**
2. Choose **Cloud Startup** (or higher)
3. **Verify it lists Node.js support before paying.** The cheaper
   Shared/Premium plans run PHP only and *cannot* run your server.
4. During checkout, choose **"I already own a domain"** and enter `theway.ge`

Do not let it register a new domain for you — you already own this one.

---

## Part 3 — Create the employee email accounts

1. In hPanel, go to **Emails** → **Email Accounts**
2. Click **Create email account**
3. Create one per employee:

   ```
   khatia@theway.ge
   mariami@theway.ge
   ```

4. Give each a strong password and send it to that person privately

Employees read their mail at `mail.hostinger.com`, or by adding the account to
Gmail / Outlook / their phone using the IMAP settings hPanel shows.

> These mailboxes will not work until DNS finishes in Part 4. That is normal.

---

## Part 4 — Point the domain at Hostinger

### 4.1 Change nameservers

1. In hPanel find Hostinger's nameservers (usually `ns1.dns-parking.com` and
   `ns2.dns-parking.com`)
2. Log in to your **domain registrar** (where you bought theway.ge)
3. Replace the existing nameservers with Hostinger's
4. Save

Propagation takes anywhere from 15 minutes to 24 hours.

### 4.2 Rebuild your DNS records ⚠️

Once the domain shows up in hPanel → **DNS Zone**, re-add every record from
your Part 1.2 screenshots that Hostinger did not recreate automatically.

**The Resend records are the critical ones.** Your app sends student and staff
credentials from `no-reply@info.theway.ge`. Those records live on the
`info` subdomain and Hostinger will not know about them.

If you lost the screenshots, get the records again from the Resend dashboard →
**Domains** → `info.theway.ge` → it shows exactly what to add.

### 4.3 Verify

- hPanel → DNS Zone: `theway.ge` has MX records pointing at Hostinger mail
- Resend dashboard: `info.theway.ge` still shows **Verified** ✅
- Send a test email to one of the new mailboxes and confirm it arrives

Do not continue until Resend shows Verified.

---

## Part 5 — Build the website on your computer

Your website's Supabase settings get baked in when it is built, so this must
happen on your machine where `.env.local` exists — not on Hostinger.

Open a terminal in the project folder and run:

```bash
npm ci
```

then:

```bash
npm run build
```

**What you should see:** a list of files and `✓ built in ...` at the end.
This creates two folders:

- `dist/` — the built website (~7 MB)
- `build/api/` — your 22 compiled API routes

If the build fails, stop here and fix it. Do not upload a broken build.

---

## Part 5b — Scramble the code (optional)

If you want the uploaded code to be unreadable, build with obfuscation instead
of the plain build:

```bash
npm run build:secure
```

This runs the normal build, then scrambles it:

- `dist/assets/*.js` — the website code (moderate settings, stays fast)
- `build/api/*.js` — your API routes (aggressive)
- `dist-server/server.mjs` — an obfuscated copy of the server

**What this does and does not do:**

- ✅ Turns readable code into `_0x531a97` gibberish. A person who opens the
  files sees nothing meaningful and cannot casually copy your work.
- ❌ It is **not encryption**. A determined developer with time can still
  reverse it. Nothing that runs in a browser can ever be truly secret.
- Your real secrets (Supabase key, Resend key) are never in these files —
  they live in environment variables (Part 8). Those are what actually matter.

**If you use this, change what you upload in Part 6:**

- upload `dist-server/server.mjs` **renamed to `server.mjs`** (not the readable
  root one)
- everything else (`dist/`, `build/api/`) is already scrambled in place

Keep developing with the normal `npm run build`. Only run `build:secure` at the
moment you are about to upload.

---

## Part 6 — Upload the files

In hPanel go to **Files** → **File Manager**, and open the folder for your
Node application (create one, e.g. `theway`).

**Upload exactly these:**

```
server.mjs
package.json
package-lock.json
dist/            (the whole folder)
build/api/       (the whole folder)
```

**Do NOT upload:**

| Do not upload | Why |
|---|---|
| `node_modules/` | huge; the host installs its own |
| `.env.local`, `.env.app` | contains secrets — these go in Part 8 instead |
| `src/` | source code; not needed to run |

Tip: zip the folders on your computer, upload the zip, and extract it in File
Manager. Far faster than uploading thousands of files.

---

## Part 7 — Set up the Node application

hPanel → **Advanced** → **Node.js** → **Create application**:

| Setting | Value |
|---|---|
| Node version | **20** or newer |
| Application root | the folder you uploaded to |
| Startup file | `server.mjs` |
| Application URL | `theway.ge` |

Then click **Run NPM Install** (or in the terminal: `npm ci --omit=dev`).

Do **not** set a port. Your server reads the port from the environment
automatically — Hostinger supplies it.

---

## Part 8 — Environment variables

Still in the Node.js panel, find **Environment variables**.

Open your **Render dashboard → Environment** in another tab and copy the
values across. **Copy and paste — never retype a secret key by hand.**

### Required — nothing works without these

| Variable | What it is |
|---|---|
| `SUPABASE_URL` | looks like `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | the **secret** key (not the publishable one) |
| `DATA_DIR` | see the warning below |

> **`DATA_DIR` — read this.** Your server has a Render-specific default. On
> Hostinger, if you leave this unset it falls back to the system temp folder,
> which gets **wiped without warning** — taking your applications data with it.
>
> Set it to a real folder in your account, for example:
> `/home/uXXXXXXX/theway-data`
>
> (hPanel File Manager shows your real home path at the top.)

### Required for emails to send

| Variable | What it is |
|---|---|
| `RESEND_API_KEY` | sends student/staff credentials and password resets |
| `EMAIL_FROM` | defaults to `The Way <no-reply@info.theway.ge>` |

### Copy over if you have them on Render

`SUPABASE_STORAGE_BUCKET`, `BOOTSTRAP_SECRET`, `PUBLIC_ORIGIN`,
`GOOGLE_WALLET_ISSUER_ID`, `GOOGLE_WALLET_SERVICE_ACCOUNT`,
`FIREBASE_SERVICE_ACCOUNT`, and anything starting with `AUTO_BOOTSTRAP_CEO`.

### Never set these

`RENDER`, `RENDER_SERVICE_ID`, `RENDER_EXTERNAL_HOSTNAME` — they exist only so
the code can detect Render, and they will make the server behave wrongly.

Click **Restart application** after saving.

---

## Part 9 — Restore your applications data

Remember the `applications.jsonl` you rescued in Part 1.3.

1. In File Manager, navigate to the exact folder you set as `DATA_DIR`
2. Create the folder if it does not exist
3. Upload `applications.jsonl` into it
4. Restart the Node application

---

## Part 10 — Test everything

### 10.1 Is the server alive?

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://theway.ge/api/health
```

**You want `401`.** That means the server booted and your API routes loaded.
It asks for a login token, which curl does not have — that is correct.

| Result | Meaning |
|---|---|
| `401` | ✅ working |
| `404` | `build/api/` did not upload — redo Part 6 |
| `502` | app failed to start — check Node panel logs |
| timeout | DNS has not finished, or the app is not running |

### 10.2 Walk through the real features

Tick every one of these off:

- [ ] Website loads at `https://theway.ge` with a padlock (SSL)
- [ ] A student can log in
- [ ] **Existing applications still show in the dashboards** (proves Part 9)
- [ ] Admin can create a student **and that student receives the email**
- [ ] A file upload works
- [ ] An employee can send *and* receive on their `@theway.ge` address

### 10.3 The overnight check

Leave it alone overnight, then open the Node panel logs and look for an SLA
sweep entry.

**No entry = the app is being idled and your SLA penalties are not running.**
See [Troubleshooting](#the-sla-sweep-is-not-running).

---

## Part 11 — Only now, cancel Render

Once every box in 10.2 is ticked and the overnight check passed, you can shut
down the Render service.

Until that moment, Render is your rollback: revert the nameservers and you are
instantly back to a working system.

---

## Part 12 — The phone apps

**Nothing here depends on Hostinger.** Both apps have `https://theway.ge`
written into them, so the moment DNS points at Hostinger, **every already-
installed app follows automatically. No rebuild, no resubmission.**

You only need this Part when you want to give the app to new people.

### Which app is which

| App | Folder | Built with |
|---|---|---|
| Expo app | `theway-mobile/` | EAS Build |
| Capacitor app | this repo | Capacitor + Android Studio |

### Building the Expo app (the APK you started earlier)

```bash
cd "C:\Users\morto\Downloads\theway website\theway-mobile"
```

```bash
eas build --platform android --profile preview
```

Wait ~15 minutes. You get a download link for an `.apk` file.

### Getting it onto a phone

**For your team right now — direct install:**

1. Send the APK link to the phone (WhatsApp, email, anything)
2. Download it on the phone
3. Tap it, and allow **"Install from unknown sources"** when prompted
4. It installs like a normal app

This is the fastest route and needs no store account. Perfect for demoing to
your partner and for staff.

**For the public later — Google Play:**

1. Google Play Console developer account (one-time $25)
2. Build an app bundle instead:
   ```bash
   eas build --platform android --profile production
   ```
3. Upload the `.aab` to Play Console, fill in the store listing, submit

Apple's App Store needs an Apple Developer account ($99/year) and a Mac or EAS
for iOS builds.

### If you ever change the domain

Only then do you need to rebuild. Update the URL in:

- Expo: `theway-mobile/src/lib/config.ts` and `apiBase` in `app.json`
- Capacitor: `src/lib/native.ts`

---

## Troubleshooting

### The website shows a Hostinger placeholder page

DNS has not finished, or the Node app is not running. Check hPanel → Node.js
shows **Running**, and wait longer for DNS.

### `502 Bad Gateway`

The app crashed on startup. Open the Node panel logs. Most common causes:

- `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` missing or wrong
- Node version older than 20
- `npm install` was never run

### Students are not receiving their credential emails

The Resend DNS records were lost in the nameserver change. Go to the Resend
dashboard → Domains → `info.theway.ge` and re-add the records it lists.

This is by far the most common thing to go wrong in this migration.

### Applications are missing from the dashboards

`applications.jsonl` is not where `DATA_DIR` points. Check that the path in
your environment variables matches where you actually uploaded the file, then
restart the app.

### The SLA sweep is not running

The host is idling your Node process. Two fixes:

1. **External cron** (easiest) — use a free service like cron-job.org to hit a
   URL on your site every 15 minutes. That traffic keeps the process awake.
2. **Keep the sweep on Render** — leave a tiny always-on service running just
   for the SLA job, and use Hostinger for the website and email.

### Emails from @theway.ge land in spam

Check hPanel → Emails that SPF and DKIM are enabled for `theway.ge`. If it
keeps happening when writing to outside companies, move employee email to
Google Workspace (~$7/user/month) and keep the website on Hostinger. The two
are independent.

---

## Quick reference

| Thing | Value |
|---|---|
| Build command | `npm run build` |
| Startup file | `server.mjs` |
| Node version | 20+ |
| Upload | `server.mjs`, `package.json`, `package-lock.json`, `dist/`, `build/api/` |
| Must-set env vars | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATA_DIR`, `RESEND_API_KEY` |
| Health check | `401` = healthy |
| Rollback | revert nameservers to the old provider |
