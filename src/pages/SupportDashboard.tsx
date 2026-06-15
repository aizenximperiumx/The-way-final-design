import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search, Plus, Pencil, Trash2, FileText, Save, X, Users,
  Phone, Mail, Globe, GraduationCap, StickyNote, UserCircle2,
  CalendarClock, Send, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppStore, type Lead, type LeadStatus } from '../store/appStore';
import { STATUS_ORDER, statusMeta, isLeadDue as isDue } from '../lib/leads';

const blankLead = { name: '', phone: '', email: '', country: '', universityInterested: '', notes: '' };

const SupportDashboard: React.FC = () => {
  const { user } = useAuth();
  const { leads, users, addLead, updateLead, deleteLead, convertLeadToApplication } = useAppStore();
  const [converting, setConverting] = useState<string | null>(null);

  const [tab, setTab] = useState<'team' | 'mine'>('team');
  const [query, setQuery] = useState('');
  const [repFilter, setRepFilter] = useState('all');

  // Add / edit lead
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState(blankLead);
  const [saving, setSaving] = useState(false);

  // Notes card
  const [noteLeadId, setNoteLeadId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const salesReps = useMemo(() => users.filter(u => u.role === 'sales'), [users]);
  const salesRepIds = useMemo(() => new Set(salesReps.map(r => r.id)), [salesReps]);

  const myLeads = useMemo(() => leads.filter(l => l.ownerId === user?.id), [leads, user?.id]);
  const teamLeads = useMemo(() => leads.filter(l => salesRepIds.has(l.ownerId)), [leads, salesRepIds]);

  const filterList = (list: Lead[]) => {
    const q = query.trim().toLowerCase();
    return list.filter(l => {
      if (repFilter !== 'all' && l.ownerId !== repFilter) return false;
      if (!q) return true;
      return [l.name, l.phone, l.email, l.country, l.universityInterested].some(v => v && v.toLowerCase().includes(q));
    });
  };

  const visibleTeam = filterList(teamLeads);
  const visibleMine = useMemo(() => {
    const q = query.trim().toLowerCase();
    return myLeads.filter(l => !q || [l.name, l.phone, l.email, l.country, l.universityInterested].some(v => v && v.toLowerCase().includes(q)));
  }, [myLeads, query]);

  const openAdd = () => { setEditId(null); setDraft(blankLead); setFormOpen(true); };
  const openEdit = (l: Lead) => {
    setEditId(l.id);
    setDraft({ name: l.name, phone: l.phone, email: l.email, country: l.country, universityInterested: l.universityInterested, notes: l.notes });
    setFormOpen(true);
  };
  const save = () => {
    if (!draft.name.trim() && !draft.phone.trim()) { toast.error('Add at least a name or phone'); return; }
    setSaving(true);
    try {
      if (editId) { updateLead(editId, draft); toast.success('Lead updated'); }
      else { const { duplicate } = addLead(draft); toast.success(duplicate ? 'Lead added — possible duplicate' : 'Lead added'); }
      setFormOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save'); }
    finally { setSaving(false); }
  };
  const saveNote = () => {
    if (!noteLeadId) return;
    try { updateLead(noteLeadId, { notes: noteDraft }); toast.success('Note saved'); setNoteLeadId(null); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save note'); }
  };
  const remove = (l: Lead) => {
    if (!window.confirm(`Delete lead "${l.name || l.phone || 'untitled'}"?`)) return;
    try { deleteLead(l.id); toast.success('Lead deleted'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete'); }
  };
  const setStatus = (l: Lead, status: LeadStatus) => {
    try { updateLead(l.id, { status }); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update'); }
  };
  const setFollowUp = (l: Lead, followUpDate: string) => {
    try { updateLead(l.id, { followUpDate }); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update'); }
  };
  const convert = async (l: Lead) => {
    if (!window.confirm(`Convert "${l.name || l.email}" into a real application? It will appear in the Sales pipeline.`)) return;
    setConverting(l.id);
    try { await convertLeadToApplication(l.id); toast.success('Lead converted to an application'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not convert'); }
    finally { setConverting(null); }
  };

  // Follow-ups due today or overdue (across everything this user can see).
  const dueLeads = useMemo(
    () => [...myLeads, ...teamLeads].filter(isDue).sort((a, b) => (a.followUpDate || '').localeCompare(b.followUpDate || '')),
    [myLeads, teamLeads],
  );

  const repName = (id: string) => users.find(u => u.id === id)?.name ?? 'Unknown';

  const stats = [
    { label: 'My Leads', value: myLeads.length, icon: UserCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Team Leads', value: teamLeads.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Follow-ups Due', value: dueLeads.length, icon: CalendarClock, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Leads w/ Notes', value: [...teamLeads, ...myLeads].filter(l => l.notes.trim()).length, icon: StickyNote, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const list = tab === 'team' ? visibleTeam : visibleMine;

  const LeadCards = ({ items, mine }: { items: Lead[]; mine: boolean }) => (
    items.length === 0 ? (
      <div className="py-16 text-center">
        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-300"><Search className="w-6 h-6" /></div>
        <p className="text-sm font-semibold text-gray-900">No leads here</p>
        <p className="text-sm text-gray-400 mt-0.5">{mine ? 'Add your first lead to get started.' : 'Sales reps have not logged any leads yet.'}</p>
      </div>
    ) : (
      <>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400">
                <th className="text-left font-bold px-4 py-3">Name</th>
                <th className="text-left font-bold px-4 py-3">Phone</th>
                <th className="text-left font-bold px-4 py-3">Email</th>
                <th className="text-left font-bold px-4 py-3">Country</th>
                <th className="text-left font-bold px-4 py-3">University</th>
                <th className="text-left font-bold px-4 py-3">Status</th>
                <th className="text-left font-bold px-4 py-3">Follow-up</th>
                {!mine && <th className="text-left font-bold px-4 py-3">Rep</th>}
                <th className="text-right font-bold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{l.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{l.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{l.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{l.country || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{l.universityInterested || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={l.status ?? 'new'}
                      onChange={(e) => setStatus(l, e.target.value as LeadStatus)}
                      className={`text-xs font-semibold rounded-full border px-2.5 py-1 cursor-pointer focus:outline-none ${statusMeta[l.status ?? 'new'].cls}`}
                    >
                      {STATUS_ORDER.map(s => <option key={s} value={s}>{statusMeta[s].label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="date"
                      value={l.followUpDate || ''}
                      onChange={(e) => setFollowUp(l, e.target.value)}
                      className={`text-xs rounded-lg border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${isDue(l) ? 'border-red-300 bg-red-50 text-red-700 font-semibold' : 'border-gray-200 text-gray-600'}`}
                    />
                  </td>
                  {!mine && <td className="px-4 py-3 whitespace-nowrap"><span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{repName(l.ownerId)}</span></td>}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setNoteLeadId(l.id); setNoteDraft(l.notes); }} title="Notes" className={`p-1.5 rounded-lg border transition-colors ${l.notes ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}><FileText className="w-3.5 h-3.5" /></button>
                      {l.convertedApplicationId ? (
                        <span title="Already converted" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-semibold border border-green-100"><CheckCircle2 className="w-3.5 h-3.5" /> App</span>
                      ) : (
                        <button onClick={() => void convert(l)} disabled={converting === l.id} title="Convert to application" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-60"><Send className="w-3.5 h-3.5" /> Convert</button>
                      )}
                      {mine && <button onClick={() => openEdit(l)} title="Edit" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Pencil className="w-3.5 h-3.5" /></button>}
                      {mine && <button onClick={() => remove(l)} title="Delete" className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-50">
          {items.map((l) => (
            <div key={l.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{l.name || 'Untitled lead'}</p>
                  {!mine && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold mt-1">{repName(l.ownerId)}</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setNoteLeadId(l.id); setNoteDraft(l.notes); }} className={`p-2 rounded-lg border ${l.notes ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-white text-gray-400 border-gray-200'}`}><FileText className="w-4 h-4" /></button>
                  {mine && <button onClick={() => openEdit(l)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><Pencil className="w-4 h-4" /></button>}
                  {mine && <button onClick={() => remove(l)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-gray-500">
                {l.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-gray-400" />{l.phone}</span>}
                {l.email && <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-400" />{l.email}</span>}
                {l.country && <span className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-gray-400" />{l.country}</span>}
                {l.universityInterested && <span className="flex items-center gap-1.5"><GraduationCap className="w-3 h-3 text-gray-400" />{l.universityInterested}</span>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select value={l.status ?? 'new'} onChange={(e) => setStatus(l, e.target.value as LeadStatus)} className={`text-xs font-semibold rounded-full border px-2.5 py-1 ${statusMeta[l.status ?? 'new'].cls}`}>
                  {STATUS_ORDER.map(s => <option key={s} value={s}>{statusMeta[s].label}</option>)}
                </select>
                <input type="date" value={l.followUpDate || ''} onChange={(e) => setFollowUp(l, e.target.value)} className={`text-xs rounded-lg border px-2 py-1 ${isDue(l) ? 'border-red-300 bg-red-50 text-red-700 font-semibold' : 'border-gray-200 text-gray-600'}`} />
                {l.convertedApplicationId ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-semibold border border-green-100"><CheckCircle2 className="w-3.5 h-3.5" /> Converted</span>
                ) : (
                  <button onClick={() => void convert(l)} disabled={converting === l.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-60"><Send className="w-3.5 h-3.5" /> Convert</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    )
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Support Desk</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor the sales team's leads and manage your own.</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm self-start md:self-auto">
          <Plus className="w-4 h-4" /> Add lead
        </button>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className={`w-9 h-9 ${s.bg} ${s.color} rounded-lg flex items-center justify-center mb-3`}><s.icon className="w-4 h-4" /></div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </section>

      {/* Follow-ups due today / overdue */}
      {dueLeads.length > 0 && (
        <section className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-red-100 bg-red-50/60 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-red-600" />
            <p className="text-sm font-bold text-red-700">Follow-ups due ({dueLeads.length})</p>
            <span className="text-xs text-red-500/80">today or overdue</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto custom-scrollbar">
            {dueLeads.map((l) => (
              <div key={l.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-50/60">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{l.name || l.phone || 'Untitled lead'}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {l.phone || l.email || '—'}{l.ownerId !== user?.id ? ` · ${repName(l.ownerId)}` : ''} · due {l.followUpDate}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusMeta[l.status ?? 'new'].cls}`}>{statusMeta[l.status ?? 'new'].label}</span>
                  <button onClick={() => { setNoteLeadId(l.id); setNoteDraft(l.notes); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 border border-gray-200" title="Open notes"><FileText className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setFollowUp(l, '')} className="text-xs font-semibold text-gray-500 hover:text-green-600 px-2 py-1 rounded-lg hover:bg-green-50" title="Clear follow-up (mark handled)">Done</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main panel */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
            <button onClick={() => setTab('team')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === 'team' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Team Leads ({teamLeads.length})</button>
            <button onClick={() => setTab('mine')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === 'mine' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>My Leads ({myLeads.length})</button>
          </div>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search leads…" className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none" />
          </div>
          {tab === 'team' && (
            <select value={repFilter} onChange={(e) => setRepFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500/20 outline-none shrink-0">
              <option value="all">All reps</option>
              {salesReps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          )}
        </div>
        <LeadCards items={list} mine={tab === 'mine'} />
      </section>

      {/* Add / edit lead modal */}
      <AnimatePresence>
        {formOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setFormOpen(false)} />
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 8 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">{editId ? 'Edit lead' : 'Add lead'}</p>
                <button onClick={() => setFormOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 grid sm:grid-cols-2 gap-3">
                <input value={draft.name} onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Name" className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                <input value={draft.phone} onChange={(e) => setDraft(d => ({ ...d, phone: e.target.value }))} placeholder="Phone (WhatsApp)" className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                <input value={draft.email} onChange={(e) => setDraft(d => ({ ...d, email: e.target.value }))} placeholder="Email" className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                <input value={draft.country} onChange={(e) => setDraft(d => ({ ...d, country: e.target.value }))} placeholder="Country" className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                <input value={draft.universityInterested} onChange={(e) => setDraft(d => ({ ...d, universityInterested: e.target.value }))} placeholder="University interested in" className="sm:col-span-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
              </div>
              <div className="px-5 pb-5 flex justify-end gap-2">
                <button onClick={() => setFormOpen(false)} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 disabled:opacity-60"><Save className="w-4 h-4" /> {editId ? 'Save changes' : 'Add lead'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes card */}
      <AnimatePresence>
        {noteLeadId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setNoteLeadId(null)} />
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 8 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-amber-600" /><p className="text-sm font-bold text-gray-900">Lead notes</p></div>
                <button onClick={() => setNoteLeadId(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5">
                <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={6} autoFocus placeholder="Interests, budget, follow-up date, objections…" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none" />
                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => setNoteLeadId(null)} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                  <button onClick={saveNote} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-bold hover:bg-amber-700"><Save className="w-4 h-4" /> Save note</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportDashboard;
