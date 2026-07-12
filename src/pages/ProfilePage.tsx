import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileText, Calendar, GraduationCap, Trophy, Star, Award,
  Mail, KeyRound, Phone, Eye, EyeOff, Loader2, BadgeCheck, AtSign,
  Camera, Trash2, Plus, Pencil, Briefcase, Save, X as CloseIcon,
  ArrowUpRight, Zap, LogOut, UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/appStore';
import { getAvatar, setAvatar, clearAvatar, onAvatarChange, fileToAvatarDataUrl } from '../lib/avatar';
import { STATUS_ORDER, statusMeta, isLeadDue } from '../lib/leads';
import type { LeadStatus } from '../store/appStore';
import { PointsHistory } from '../components/dashboard/PointsHistory';
import { CreateStudentModal } from '../components/dashboard/CreateStudentModal';

const roleMeta: Record<string, { label: string; color: string; bg: string }> = {
  ceo:          { label: 'CEO',          color: 'text-purple-700', bg: 'bg-purple-50'  },
  sales:        { label: 'Sales',        color: 'text-blue-700',   bg: 'bg-blue-50'    },
  ops:          { label: 'Operations',   color: 'text-teal-700',   bg: 'bg-teal-50'    },
  staff:        { label: 'Staff',        color: 'text-amber-700',  bg: 'bg-amber-50'   },
  agency_staff: { label: 'Agency Staff', color: 'text-orange-700', bg: 'bg-orange-50'  },
  student:      { label: 'Student',      color: 'text-green-700',  bg: 'bg-green-50'   },
  agency:       { label: 'Agency',       color: 'text-indigo-700', bg: 'bg-indigo-50'  },
  customer_support: { label: 'Customer Support', color: 'text-rose-700', bg: 'bg-rose-50' },
};

const rankMedal = (rank: number) => {
  if (rank === 1) return { emoji: '🥇', color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200' };
  if (rank === 2) return { emoji: '🥈', color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200'     };
  if (rank === 3) return { emoji: '🥉', color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200'   };
  return { emoji: `#${rank}`, color: 'text-gray-400', bg: 'bg-gray-50 border-gray-100' };
};

// Points rules per role. Staff earn via the automatic SLA engine (PRD §1);
// sales/support/agency earn small activity awards.
const staffEarnRules = [
  { action: 'Translated documents on time', pts: '+2 / +1', icon: FileText },
  { action: 'University approval on time', pts: '+2 / +1', icon: GraduationCap },
  { action: 'Recognition letter on time', pts: '+2 / +1', icon: Star },
  { action: 'Ministry order on time', pts: '+2 / +1', icon: Star },
  { action: 'Visa & residency uploaded (case closed)', pts: '+2', icon: Users },
  { action: 'Deadline passes (automatic)', pts: '−1 / −2', icon: Zap },
];
const activityEarnRules = [
  { action: 'Claim a lead', pts: '+1', icon: Zap },
  { action: 'Approve a student', pts: '+1', icon: Users },
  { action: 'Assign a university', pts: '+1', icon: GraduationCap },
  { action: 'Complete intake (within 24h: +1 extra)', pts: '+1', icon: Star },
];

const Avatar = ({ name, photo, className = '', textClass = 'text-sm' }: { name?: string; photo?: string; className?: string; textClass?: string }) => (
  photo
    ? <img src={photo} alt={name ?? 'avatar'} className={`object-cover ${className}`} />
    : <div className={`bg-amber-100 text-amber-700 font-bold flex items-center justify-center ${textClass} ${className}`}>{name?.charAt(0)?.toUpperCase() ?? '?'}</div>
);

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { users, leads, addLead, updateLead, deleteLead, convertLeadToApplication, changePassword } = useAppStore();

  const isCompetitive = ['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'customer_support'].includes(user?.role ?? '');
  const hasLeads = ['sales', 'customer_support', 'ceo'].includes(user?.role ?? '');
  // Sales + CEO can create student accounts directly from their profile.
  const canCreateStudent = user?.role === 'sales' || user?.role === 'ceo';
  const [createStudentOpen, setCreateStudentOpen] = useState(false);
  const [tab, setTab] = useState<'overview' | 'leaderboard' | 'workspace' | 'account'>(
    user?.role === 'sales' ? 'workspace' : isCompetitive ? 'overview' : 'account'
  );

  // Leads CRM
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [leadEditId, setLeadEditId] = useState<string | null>(null);
  const blankLead = { name: '', phone: '', email: '', country: '', universityInterested: '', notes: '' };
  const [leadDraft, setLeadDraft] = useState(blankLead);
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadConverting, setLeadConverting] = useState<string | null>(null);
  const [noteLeadId, setNoteLeadId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  // Account
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>(() => getAvatar(user?.id));
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatarUrl(getAvatar(user?.id));
    return onAvatarChange(() => setAvatarUrl(getAvatar(user?.id)));
  }, [user?.id]);

  if (!user) return null;

  const meta = roleMeta[user.role] ?? roleMeta.student;
  const peers = users.filter(u => u.role === user.role).sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  const myRank = peers.findIndex(u => u.id === user.id) + 1;
  const maxPoints = peers[0]?.points ?? 1;
  const medal = rankMedal(myRank);
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : '—';

  const canMonitorLeads = user.role === 'customer_support' || user.role === 'ceo';
  const myLeads = leads.filter(l => l.ownerId === user.id);
  const monitoredLeads = canMonitorLeads ? leads.filter(l => l.ownerId !== user.id) : [];
  const dueLeadsCount = myLeads.filter(isLeadDue).length;

  const handleAvatarFile = async (file?: File) => {
    if (!file) return;
    try { setAvatar(user.id, await fileToAvatarDataUrl(file)); toast.success('Photo updated'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not set photo'); }
  };
  const removeAvatar = () => { clearAvatar(user.id); toast.success('Photo removed'); };
  const handleLogout = () => { void logout(); navigate('/login'); };

  const handleChangePassword = async () => {
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    setPwSaving(true);
    try { await changePassword(newPw); toast.success('Password updated'); setNewPw(''); setConfirmPw(''); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update password'); }
    finally { setPwSaving(false); }
  };

  const openAddLead = () => { setLeadEditId(null); setLeadDraft(blankLead); setLeadFormOpen(true); };
  const openEditLead = (l: typeof leads[number]) => {
    setLeadEditId(l.id);
    setLeadDraft({ name: l.name, phone: l.phone, email: l.email, country: l.country, universityInterested: l.universityInterested, notes: l.notes });
    setLeadFormOpen(true);
  };
  const saveLead = () => {
    if (!leadDraft.name.trim() && !leadDraft.phone.trim()) { toast.error('Add at least a name or phone'); return; }
    setLeadSaving(true);
    try {
      if (leadEditId) { updateLead(leadEditId, leadDraft); toast.success('Lead updated'); }
      else { const { duplicate } = addLead(leadDraft); toast.success(duplicate ? 'Lead added — heads up, looks like a possible duplicate' : 'Lead added'); }
      setLeadFormOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save lead'); }
    finally { setLeadSaving(false); }
  };
  const saveNote = () => {
    if (!noteLeadId) return;
    try { updateLead(noteLeadId, { notes: noteDraft }); toast.success('Note saved'); setNoteLeadId(null); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save note'); }
  };
  const removeLead = (l: typeof leads[number]) => {
    if (!window.confirm(`Delete lead "${l.name || l.phone || 'untitled'}"? This cannot be undone.`)) return;
    try { deleteLead(l.id); toast.success('Lead deleted'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete'); }
  };
  const setLeadStatus = (l: typeof leads[number], status: LeadStatus) => {
    try { updateLead(l.id, { status }); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update'); }
  };
  const setLeadFollow = (l: typeof leads[number], followUpDate: string) => {
    try { updateLead(l.id, { followUpDate }); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update'); }
  };
  const convertLead = async (l: typeof leads[number]) => {
    if (!window.confirm(`Convert "${l.name || l.email}" into a real application? It will enter the Sales pipeline.`)) return;
    setLeadConverting(l.id);
    try { await convertLeadToApplication(l.id); toast.success('Lead converted to an application'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not convert'); }
    finally { setLeadConverting(null); }
  };

  const leadsTable = (list: typeof leads, opts: { showOwner?: boolean; canEditFields?: boolean; canDelete?: boolean }) => (
    list.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-gray-200 py-8 text-center">
        <p className="text-sm text-gray-400 font-medium">No leads yet</p>
      </div>
    ) : (
      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400">
              <th className="text-left font-bold px-3 py-2.5">Name</th>
              <th className="text-left font-bold px-3 py-2.5">Phone</th>
              <th className="text-left font-bold px-3 py-2.5">Email</th>
              <th className="text-left font-bold px-3 py-2.5">Country</th>
              <th className="text-left font-bold px-3 py-2.5">University</th>
              <th className="text-left font-bold px-3 py-2.5">Status</th>
              <th className="text-left font-bold px-3 py-2.5">Follow-up</th>
              {opts.showOwner && <th className="text-left font-bold px-3 py-2.5">Rep</th>}
              <th className="text-right font-bold px-3 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50/60">
                <td className="px-3 py-2.5 font-semibold text-gray-900 whitespace-nowrap">{l.name || '—'}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{l.phone || '—'}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{l.email || '—'}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{l.country || '—'}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{l.universityInterested || '—'}</td>
                <td className="px-3 py-2.5">
                  <select value={l.status ?? 'new'} onChange={(e) => setLeadStatus(l, e.target.value as LeadStatus)} className={`text-xs font-semibold rounded-full border px-2 py-1 cursor-pointer focus:outline-none ${statusMeta[l.status ?? 'new'].cls}`}>
                    {STATUS_ORDER.map(s => <option key={s} value={s}>{statusMeta[s].label}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <input type="date" value={l.followUpDate || ''} onChange={(e) => setLeadFollow(l, e.target.value)} className={`text-xs rounded-lg border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${isLeadDue(l) ? 'border-red-300 bg-red-50 text-red-700 font-semibold' : 'border-gray-200 text-gray-600'}`} />
                </td>
                {opts.showOwner && <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{l.ownerName}</td>}
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => { setNoteLeadId(l.id); setNoteDraft(l.notes); }} title="Open notes" className={`p-1.5 rounded-lg border transition-colors ${l.notes ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}>
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    {l.convertedApplicationId ? (
                      <span title="Already converted" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-semibold border border-green-100"><BadgeCheck className="w-3.5 h-3.5" /> App</span>
                    ) : (
                      <button onClick={() => void convertLead(l)} disabled={leadConverting === l.id} title="Convert to application" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-60"><ArrowUpRight className="w-3.5 h-3.5" /> Convert</button>
                    )}
                    {opts.canEditFields && (
                      <button onClick={() => openEditLead(l)} title="Edit lead" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    )}
                    {opts.canDelete && (
                      <button onClick={() => removeLead(l)} title="Delete lead" className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  );

  const tabs: ReadonlyArray<'overview' | 'leaderboard' | 'workspace' | 'account'> =
    user.role === 'student' ? ['account']
      : isCompetitive ? ['overview', 'leaderboard', 'workspace', 'account']
      : ['workspace', 'account'];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-amber-500 to-orange-500" />
        <div className="px-6 sm:px-8 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl overflow-hidden">
                <Avatar name={user.name} photo={avatarUrl} className="w-full h-full" textClass="text-4xl" />
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void handleAvatarFile(e.target.files?.[0]); e.target.value = ''; }} />
              <button onClick={() => avatarInputRef.current?.click()} title="Change photo" className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md ring-2 ring-white hover:bg-amber-600 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
              {isCompetitive && myRank > 0 && myRank <= 3 && <span className="absolute -top-2 -right-2 text-2xl">{medal.emoji}</span>}
            </div>
            {isCompetitive ? (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold ${medal.bg} ${medal.color}`}>
                <Trophy className="w-3.5 h-3.5" />{myRank > 0 ? `Rank #${myRank}` : 'Unranked'}
              </div>
            ) : (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-100 text-sm font-bold ${meta.bg} ${meta.color}`}>
                <BadgeCheck className="w-3.5 h-3.5" />{meta.label}
              </div>
            )}
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</span>
              </div>
            </div>
            {isCompetitive && (
              <div className="text-right shrink-0">
                <div className="text-3xl font-black text-gray-900">{(user.points ?? 0).toLocaleString()}</div>
                <div className="text-xs text-gray-400 font-medium">total points</div>
              </div>
            )}
          </div>

          {/* Create student (Sales + CEO) */}
          {canCreateStudent && (
            <button
              onClick={() => setCreateStudentOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0A1628] px-5 py-2.5 text-sm font-bold text-amber-400 hover:bg-[#132c50] transition-colors"
            >
              <UserPlus className="w-4 h-4" /> Create a student
              <span className="ml-1 hidden sm:inline text-[11px] font-medium text-gray-400">· account + credentials emailed</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-100 px-6 sm:px-8 overflow-x-auto">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`pb-3 pt-3 mr-6 text-sm font-semibold capitalize border-b-2 transition-all whitespace-nowrap ${tab === t ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {t === 'workspace' ? (hasLeads ? 'Leads' : 'Workspace') : t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8">
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-gray-900">{user.points ?? 0}</div>
                <div className="text-[10px] text-gray-400 font-medium mt-0.5 uppercase tracking-wider">My Points</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-gray-900">#{myRank || '—'}</div>
                <div className="text-[10px] text-gray-400 font-medium mt-0.5 uppercase tracking-wider">My Rank</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-gray-900">{peers.length}</div>
                <div className="text-[10px] text-gray-400 font-medium mt-0.5 uppercase tracking-wider">Competitors</div>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">How to earn points</p>
              <div className="space-y-2">
                {(user.role === 'staff' || user.role === 'agency_staff' ? staffEarnRules : activityEarnRules).map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center"><item.icon className="w-3.5 h-3.5 text-amber-600" /></div>
                      <span className="text-sm text-gray-700 font-medium">{item.action}</span>
                    </div>
                    <span className={`text-sm font-bold ${item.pts.startsWith('−') ? 'text-red-500' : 'text-amber-600'}`}>{item.pts}</span>
                  </div>
                ))}
              </div>
              {(user.role === 'staff' || user.role === 'agency_staff') && (
                <p className="mt-2 text-[11px] text-gray-400">
                  Timers depend on the university's speed group. Penalties apply automatically when a deadline passes — the CEO can adjust points manually.
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">My points history</p>
              <div className="rounded-2xl border border-gray-100 overflow-hidden max-h-[420px] overflow-y-auto custom-scrollbar">
                <PointsHistory userId={user.id} limit={50} />
              </div>
            </div>
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="space-y-1.5">
            {peers.length === 0 ? (
              <div className="text-center py-8"><Award className="w-10 h-10 text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">No peers yet</p></div>
            ) : peers.map((u, i) => {
              const rank = i + 1;
              const m = rankMedal(rank);
              const isMe = u.id === user.id;
              const pct = maxPoints > 0 ? ((u.points ?? 0) / maxPoints) * 100 : 0;
              return (
                <div key={u.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isMe ? 'bg-amber-50 border border-amber-200' : 'hover:bg-gray-50'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 border ${m.bg} ${m.color}`}>{rank <= 3 ? m.emoji : rank}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-semibold truncate ${isMe ? 'text-amber-700' : 'text-gray-900'}`}>{u.name} {isMe && <span className="text-[10px] text-amber-500 font-bold">(you)</span>}</p>
                      <span className={`text-sm font-black ml-2 shrink-0 ${isMe ? 'text-amber-700' : 'text-gray-900'}`}>{(u.points ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${isMe ? 'bg-amber-400' : 'bg-gray-300'}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'workspace' && (
          <div className="space-y-5">
            {hasLeads ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-gray-900">My Leads</p>
                      {dueLeadsCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">{dueLeadsCount} follow-up{dueLeadsCount > 1 ? 's' : ''} due</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">WhatsApp &amp; direct prospects you're nurturing — set a status &amp; follow-up date.</p>
                  </div>
                  <button onClick={leadFormOpen ? () => setLeadFormOpen(false) : openAddLead} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors shrink-0">
                    {leadFormOpen ? <><CloseIcon className="w-4 h-4" /> Close</> : <><Plus className="w-4 h-4" /> Add lead</>}
                  </button>
                </div>
                {leadFormOpen && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input value={leadDraft.name} onChange={(e) => setLeadDraft(d => ({ ...d, name: e.target.value }))} placeholder="Name" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                      <input value={leadDraft.phone} onChange={(e) => setLeadDraft(d => ({ ...d, phone: e.target.value }))} placeholder="Phone (WhatsApp)" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                      <input value={leadDraft.email} onChange={(e) => setLeadDraft(d => ({ ...d, email: e.target.value }))} placeholder="Email" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                      <input value={leadDraft.country} onChange={(e) => setLeadDraft(d => ({ ...d, country: e.target.value }))} placeholder="Country" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                      <input value={leadDraft.universityInterested} onChange={(e) => setLeadDraft(d => ({ ...d, universityInterested: e.target.value }))} placeholder="University interested in" className="sm:col-span-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button onClick={() => setLeadFormOpen(false)} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                      <button onClick={saveLead} disabled={leadSaving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-60"><Save className="w-4 h-4" /> {leadEditId ? 'Save changes' : 'Add lead'}</button>
                    </div>
                  </div>
                )}
                {leadsTable(myLeads, { canEditFields: true, canDelete: true })}
                {canMonitorLeads && (
                  <div className="pt-2">
                    <p className="text-sm font-black text-gray-900 mb-2">Sales Leads <span className="text-xs font-medium text-gray-400">· monitoring all reps ({monitoredLeads.length})</span></p>
                    {leadsTable(monitoredLeads, { showOwner: true, canEditFields: false, canDelete: false })}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4"><Briefcase className="w-7 h-7 text-gray-300" /></div>
                <p className="text-sm font-bold text-gray-900">Your {meta.label} workspace</p>
                <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">Role-specific tools will live here. We're rolling these out per role — more coming soon.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'account' && (
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-4">
              <Avatar name={user.name} photo={avatarUrl} className="w-14 h-14 rounded-2xl shrink-0" textClass="text-xl" />
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => avatarInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"><Camera className="w-4 h-4" /> {avatarUrl ? 'Change photo' : 'Add photo'}</button>
                {avatarUrl && <button onClick={removeAvatar} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"><Trash2 className="w-4 h-4" /> Remove</button>}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Account details</p>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {[
                  { icon: BadgeCheck, label: 'Role', value: meta.label },
                  { icon: AtSign, label: 'Username', value: user.username || '—' },
                  { icon: Mail, label: 'Email', value: user.email || '—' },
                  { icon: Phone, label: 'Phone', value: user.phone || '—' },
                  { icon: Calendar, label: 'Member since', value: memberSince },
                  { icon: Star, label: 'Points', value: String(user.points ?? 0) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0"><row.icon className="w-4 h-4 text-amber-600" /></div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{row.label}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3"><KeyRound className="w-4 h-4 text-gray-400" /><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Change password</p></div>
              <div className="space-y-2.5">
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password" autoComplete="new-password" className="w-full pl-3 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all" />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                <input type={showPw ? 'text' : 'password'} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all" />
                <button type="button" onClick={() => void handleChangePassword()} disabled={pwSaving || !newPw || !confirmPw} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all">{pwSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : 'Update password'}</button>
                <p className="text-[11px] text-gray-400">Minimum 8 characters. You'll stay signed in on this device.</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"><LogOut className="w-4 h-4" /> Log out</button>
          </div>
        )}
      </div>

      {/* Lead notes modal */}
      {noteLeadId && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setNoteLeadId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-amber-600" /><p className="text-sm font-bold text-gray-900">Lead notes</p></div>
              <button onClick={() => setNoteLeadId(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><CloseIcon className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={6} autoFocus placeholder="Type notes about this lead — interests, budget, follow-up date, objections…" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none" />
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setNoteLeadId(null)} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={saveNote} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors"><Save className="w-4 h-4" /> Save note</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create student (Sales + CEO; CEO gets the quick-account toggle) */}
      <CreateStudentModal
        open={createStudentOpen}
        onClose={() => setCreateStudentOpen(false)}
        allowQuick={user.role === 'ceo'}
      />
    </div>
  );
};

export default ProfilePage;
