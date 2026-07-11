import React, { useMemo, useState } from 'react';
import { GraduationCap, Wand2, Save, Timer, UserCheck, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../../store/appStore';
import { UNIVERSITIES, DEFAULT_STAFF_ASSIGNMENTS, DEFAULT_SLA_GROUPS, type UniversitySlaGroup } from '../../lib/universities';
import { PointsHistory } from './PointsHistory';
import { DashboardSection } from './ui';

/**
 * CEO-only controls: the configurable university → staff auto-assignment map
 * + SLA speed groups (PRD §9), and the manual points adjustment tool
 * (owner decision 2026-07-10: CEO can give points back after auto-penalties).
 */

const SLA_LABELS: Record<UniversitySlaGroup, string> = {
  fast: 'Fast — 36h / 72h',
  medium: 'Medium — 72h / 96h (late −1)',
  slow: 'Slow — 240h / 280h',
  none: 'No approval timer',
};

export const UniversityAssignmentSettings: React.FC = () => {
  const { users, universityConfig, ceoSetUniversityStaff, ceoSetUniversitySlaGroup } = useAppStore();
  const staff = users.filter(u => u.role === 'staff');

  const assignments = useMemo(() => ({ ...DEFAULT_STAFF_ASSIGNMENTS, ...(universityConfig?.assignments ?? {}) }), [universityConfig]);
  const slaGroups = useMemo(() => ({ ...DEFAULT_SLA_GROUPS, ...(universityConfig?.slaGroups ?? {}) }), [universityConfig]);

  const setStaff = (universityId: string, username: string) => {
    try {
      ceoSetUniversityStaff(universityId, username || null);
      toast.success(username ? `Assigned @${username}` : 'University left unassigned');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save'); }
  };
  const setGroup = (universityId: string, group: UniversitySlaGroup) => {
    try {
      ceoSetUniversitySlaGroup(universityId, group);
      toast.success('SLA group updated');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save'); }
  };

  return (
    <DashboardSection title="University assignments & SLA" icon={GraduationCap}>
      <div className="px-4 sm:px-5 py-3">
        <p className="mb-3 text-xs text-gray-500">
          New students are automatically assigned to the staff member mapped to their university.
          The SLA group controls the University Initial Approval timer.
          {universityConfig?.updatedAt && (
            <span className="text-gray-400"> Last change: {new Date(universityConfig.updatedAt).toLocaleString()} by {universityConfig.updatedByName ?? '—'}.</span>
          )}
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400">
                <th className="px-3 py-2.5 text-left font-bold">University</th>
                <th className="px-3 py-2.5 text-left font-bold">Assigned staff</th>
                <th className="px-3 py-2.5 text-left font-bold">Approval SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {UNIVERSITIES.map((u) => {
                const username = assignments[u.id] ?? '';
                const staffExists = !username || staff.some(s => s.username.toLowerCase() === username.toLowerCase());
                return (
                  <tr key={u.id} className="hover:bg-gray-50/60">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-gray-900">{u.name}</p>
                      {u.shortName && <p className="text-[11px] text-gray-400">{u.shortName}</p>}
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={username}
                        onChange={(e) => setStaff(u.id, e.target.value)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${username ? 'border-gray-200 text-gray-800' : 'border-dashed border-gray-300 text-gray-400'}`}
                      >
                        <option value="">— Unassigned —</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.username}>{s.name} (@{s.username})</option>
                        ))}
                        {!staffExists && <option value={username}>@{username} (not found)</option>}
                      </select>
                      {!staffExists && (
                        <p className="mt-1 text-[10px] font-semibold text-red-500">No staff account with this username — auto-assignment is inactive.</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={slaGroups[u.id] ?? 'none'}
                        onChange={(e) => setGroup(u.id, e.target.value as UniversitySlaGroup)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      >
                        {(Object.keys(SLA_LABELS) as UniversitySlaGroup[]).map(g => (
                          <option key={g} value={g}>{SLA_LABELS[g]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardSection>
  );
};

export const PointsAdjustTool: React.FC = () => {
  const { users, ceoAdjustPoints } = useAppStore();
  const [userId, setUserId] = useState('');
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const eligible = users
    .filter(u => ['staff', 'sales', 'ops', 'agency_staff', 'customer_support', 'agency'].includes(u.role))
    .sort((a, b) => a.name.localeCompare(b.name));
  const selected = users.find(u => u.id === userId);

  const submit = () => {
    const d = Math.trunc(Number(delta));
    if (!userId) { toast.error('Pick a team member'); return; }
    if (!d) { toast.error('Enter a non-zero adjustment, e.g. +2 or -1'); return; }
    if (!reason.trim()) { toast.error('Add a reason — it is shown to the team member'); return; }
    setSaving(true);
    try {
      ceoAdjustPoints(userId, d, reason.trim());
      toast.success(`${d > 0 ? '+' : ''}${d} points → ${selected?.name ?? 'user'}`);
      setDelta(''); setReason('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not adjust points');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardSection title="Points adjustment" icon={Wand2}>
      <div className="px-4 sm:px-5 py-4 space-y-3">
        <p className="text-xs text-gray-500">
          Give points back (or deduct) manually — e.g. after an automatic deadline penalty that wasn't the staff member's fault.
          Every adjustment is recorded in the ledger with your name.
        </p>
        <div className="grid gap-2 sm:grid-cols-[1fr_110px]">
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="">Select team member…</option>
            {eligible.map(u => (
              <option key={u.id} value={u.id}>{u.name} (@{u.username}) — {u.points ?? 0} pts</option>
            ))}
          </select>
          <input
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="+2 / -1"
            inputMode="numeric"
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (shown to the team member)"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
        <button
          onClick={submit}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0A1628] px-5 py-2.5 text-sm font-bold text-amber-400 hover:bg-[#132c50] transition-colors disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> Apply adjustment
        </button>
        {selected && (
          <div className="rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/60 px-4 py-2.5">
              <UserCheck className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-xs font-bold text-gray-700">{selected.name} — points history</p>
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-black text-gray-900"><Star className="h-3 w-3 text-amber-400" /> {selected.points ?? 0}</span>
            </div>
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              <PointsHistory userId={selected.id} limit={30} />
            </div>
          </div>
        )}
      </div>
    </DashboardSection>
  );
};

export const SlaRulesCard: React.FC = () => (
  <DashboardSection title="Performance rules (automatic)" icon={Timer}>
    <div className="px-4 sm:px-5 py-4">
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full min-w-[560px] text-xs">
          <thead>
            <tr className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400">
              <th className="px-3 py-2 text-left font-bold">Stage</th>
              <th className="px-3 py-2 text-left font-bold">+2</th>
              <th className="px-3 py-2 text-left font-bold">+1</th>
              <th className="px-3 py-2 text-left font-bold">Late</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-gray-600">
            <tr><td className="px-3 py-2 font-semibold text-gray-900">Translated Documents</td><td className="px-3 py-2">&lt; 36h</td><td className="px-3 py-2">36–72h</td><td className="px-3 py-2 text-red-500 font-bold">−2</td></tr>
            <tr><td className="px-3 py-2 font-semibold text-gray-900">Uni Approval — fast group</td><td className="px-3 py-2">&lt; 36h</td><td className="px-3 py-2">36–72h</td><td className="px-3 py-2 text-red-500 font-bold">−2</td></tr>
            <tr><td className="px-3 py-2 font-semibold text-gray-900">Uni Approval — medium group</td><td className="px-3 py-2">&lt; 72h</td><td className="px-3 py-2">72–96h</td><td className="px-3 py-2 text-red-500 font-bold">−1</td></tr>
            <tr><td className="px-3 py-2 font-semibold text-gray-900">Uni Approval — slow group</td><td className="px-3 py-2">&lt; 240h</td><td className="px-3 py-2">240–280h</td><td className="px-3 py-2 text-red-500 font-bold">−2</td></tr>
            <tr><td className="px-3 py-2 font-semibold text-gray-900">Recognition Letter <span className="text-gray-400 font-normal">(after permission)</span></td><td className="px-3 py-2">&lt; 216h</td><td className="px-3 py-2">216–240h</td><td className="px-3 py-2 text-red-500 font-bold">−2</td></tr>
            <tr><td className="px-3 py-2 font-semibold text-gray-900">Ministry Order <span className="text-gray-400 font-normal">(after permission)</span></td><td className="px-3 py-2">&lt; 432h</td><td className="px-3 py-2">432–480h</td><td className="px-3 py-2 text-red-500 font-bold">−2</td></tr>
            <tr><td className="px-3 py-2 font-semibold text-gray-900">Visa Required Documents</td><td className="px-3 py-2 text-gray-400" colSpan={3}>No points</td></tr>
            <tr><td className="px-3 py-2 font-semibold text-gray-900">Visa & Residency uploaded</td><td className="px-3 py-2" colSpan={3}><span className="font-bold text-emerald-600">+2</span> and the case closes automatically</td></tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        Penalties apply automatically the moment a deadline passes — checked continuously by the server, even when nobody is online.
      </p>
    </div>
  </DashboardSection>
);
