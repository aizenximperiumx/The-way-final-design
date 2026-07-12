import React, { useMemo, useState } from 'react';
import { UserPlus, X, Loader2, CheckCircle2, Copy, Check, Mail, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../../store/appStore';
import { UNIVERSITY_OPTIONS, getUniversity } from '../../lib/universities';

/**
 * Create a student account directly (Sales + CEO). Fills the student's profile
 * from a form and emails them their credentials automatically. CEO can also
 * flip to "Quick account" — just name + email, no application/details.
 */

type Result = { username: string; password: string; emailSent?: boolean; warning?: string; emailError?: string };

const blank = { name: '', email: '', phone: '', country: '', dob: '', university: '', program: '', studyLevel: '' };

export const CreateStudentModal: React.FC<{
  open: boolean;
  onClose: () => void;
  /** CEO gets the "Quick account (no details)" toggle. */
  allowQuick?: boolean;
}> = ({ open, onClose, allowQuick = false }) => {
  const createStudentAccount = useAppStore(s => s.createStudentAccount);
  const [form, setForm] = useState(blank);
  const [quick, setQuick] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const uniPrograms = useMemo(() => getUniversity(form.university)?.programs ?? [], [form.university]);

  if (!open) return null;
  const set = (k: keyof typeof blank, v: string) => setForm(f => ({ ...f, [k]: v }));

  const close = () => { setForm(blank); setQuick(false); setResult(null); onClose(); };

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Enter the student name'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { toast.error('Enter a valid student email'); return; }
    setSaving(true);
    try {
      const r = await createStudentAccount({
        name: form.name,
        email: form.email,
        ...(quick ? {} : {
          phone: form.phone,
          country: form.country,
          dob: form.dob,
          university: form.university || undefined,
          program: form.program,
          studyLevel: form.studyLevel,
        }),
        withApplication: !quick,
      });
      setResult(r);
      toast.success(r.emailSent ? 'Student created — credentials emailed' : 'Student created');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create student');
    } finally {
      setSaving(false);
    }
  };

  const copy = (label: string, value: string) => {
    navigator.clipboard?.writeText(value).then(() => { setCopied(label); setTimeout(() => setCopied(null), 1500); }).catch(() => {});
  };

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300';
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5';

  return (
    <div className="fixed inset-0 z-[130] p-4 flex items-start justify-center overflow-y-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
      <div className="relative my-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-[#0A1628] to-[#12294a] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/15 text-amber-400">
              <UserPlus className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create a student</h3>
              <p className="text-[11px] text-gray-400">Account is created and credentials emailed automatically</p>
            </div>
          </div>
          <button onClick={close} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {result ? (
          /* ── Success ── */
          <div className="p-6">
            <div className="mb-4 flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <p className="text-lg font-black text-gray-900">Student account created</p>
              <p className={`mt-1 inline-flex items-center gap-1.5 text-sm font-semibold ${result.emailSent ? 'text-emerald-600' : 'text-amber-600'}`}>
                {result.emailSent
                  ? <><Mail className="h-4 w-4" /> Credentials emailed to the student</>
                  : <><AlertTriangle className="h-4 w-4" /> Email not sent — share these manually</>}
              </p>
              {result.warning && <p className="mt-1 text-xs text-gray-400">{result.warning}</p>}
            </div>
            <div className="space-y-2">
              {([['Username', result.username], ['Password', result.password]] as const).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                    <p className="truncate font-mono text-sm font-bold text-gray-900">{value}</p>
                  </div>
                  <button onClick={() => copy(label, value)} className="ml-2 inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 shrink-0">
                    {copied === label ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === label ? 'Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => { setForm(blank); setResult(null); }} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">
                Create another
              </button>
              <button onClick={close} className="flex-1 rounded-xl bg-[#0A1628] px-4 py-2.5 text-sm font-bold text-amber-400 hover:bg-[#132c50]">
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <div className="p-6">
            {allowQuick && (
              <div className="mb-5 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                <button
                  onClick={() => setQuick(false)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${!quick ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                >
                  Full profile
                </button>
                <button
                  onClick={() => setQuick(true)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${quick ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                >
                  Quick account
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelCls}>Full name *</label>
                <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Student's full name" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Student email *</label>
                <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="student@example.com" />
                <p className="mt-1 text-[11px] text-gray-400">Their login credentials are emailed here automatically.</p>
              </div>

              {!quick && (
                <>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+..." />
                  </div>
                  <div>
                    <label className={labelCls}>Country</label>
                    <input className={inputCls} value={form.country} onChange={e => set('country', e.target.value)} placeholder="Country" />
                  </div>
                  <div>
                    <label className={labelCls}>Date of birth</label>
                    <input className={inputCls} type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Study level</label>
                    <select className={inputCls} value={form.studyLevel} onChange={e => set('studyLevel', e.target.value)}>
                      <option value="">Select level</option>
                      <option value="bachelor">Bachelor's</option>
                      <option value="master">Master's</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>University</label>
                    <select className={inputCls} value={form.university} onChange={e => { set('university', e.target.value); set('program', ''); }}>
                      <option value="">Select university (assigns staff automatically)</option>
                      {UNIVERSITY_OPTIONS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Program</label>
                    {uniPrograms.length > 0 ? (
                      <select className={inputCls} value={form.program} onChange={e => set('program', e.target.value)}>
                        <option value="">Select program</option>
                        {uniPrograms.map((p, i) => (
                          <option key={`${p.name}-${i}`} value={p.name}>{p.name} ({p.level === 'bachelor' ? 'BA' : 'MA'} · {p.years}y · {p.price})</option>
                        ))}
                      </select>
                    ) : (
                      <input className={inputCls} value={form.program} onChange={e => set('program', e.target.value)} placeholder="e.g. Medicine" />
                    )}
                  </div>
                </>
              )}
            </div>

            {quick && (
              <p className="mt-4 flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 text-[12px] text-gray-500">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                Quick account creates the login only — no application or case is opened. You can add their details later from the dashboard.
              </p>
            )}

            <button
              onClick={() => void submit()}
              disabled={saving}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white hover:bg-amber-700 transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {saving ? 'Creating…' : 'Create student & email credentials'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateStudentModal;
