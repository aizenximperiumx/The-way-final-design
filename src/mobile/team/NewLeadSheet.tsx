import React, { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../../store/appStore';
import { GOLD, NAVY, dim, goldA, card } from '../ui';

/** Capture a lead on the spot — the support rep is often away from a desk. */

const Field: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}> = ({ label, value, onChange, placeholder, type }) => (
  <div className="mb-3">
    <p className="text-[10px] tracking-[1.6px] uppercase font-bold mb-1.5" style={{ color: dim(0.5) }}>{label}</p>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type ?? 'text'}
      className="w-full px-4 rounded-2xl outline-none text-[14.5px]"
      style={{ ...card, height: 46, color: '#fff' }}
    />
  </div>
);

const NewLeadSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const addLead = useAppStore(s => s.addLead);
  const [f, setF] = useState({ name: '', phone: '', email: '', country: '', universityInterested: '', notes: '' });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (v: string) => setF(prev => ({ ...prev, [k]: v }));

  const save = () => {
    if (!f.name.trim() || !f.phone.trim()) return;
    setBusy(true);
    try {
      const { duplicate } = addLead({
        name: f.name.trim(),
        phone: f.phone.trim(),
        email: f.email.trim(),
        country: f.country.trim(),
        universityInterested: f.universityInterested.trim(),
        notes: f.notes.trim(),
      });
      if (duplicate) toast('A lead with these details already existed — check before calling again.', { icon: '⚠️', duration: 6000 });
      else toast.success(`${f.name.trim()} added`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(4,10,20,0.72)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[28px] p-5 max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg,#0D1F3C,#0A1628)',
          borderTop: `1px solid ${goldA(0.2)}`,
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[11px] tracking-[2px] uppercase font-bold" style={{ color: GOLD }}>New lead</p>
            <p className="v3-serif text-[21px] font-black mt-1" style={{ color: '#fff' }}>Add to the book</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X className="w-4 h-4" style={{ color: dim(0.7) }} />
          </button>
        </div>

        <Field label="Name" value={f.name} onChange={set('name')} placeholder="Full name" />
        <Field label="Phone" value={f.phone} onChange={set('phone')} placeholder="+995 …" type="tel" />
        <Field label="Email" value={f.email} onChange={set('email')} placeholder="Optional" type="email" />
        <Field label="Country" value={f.country} onChange={set('country')} placeholder="Where they are" />
        <Field label="Interested in" value={f.universityInterested} onChange={set('universityInterested')} placeholder="University or programme" />

        <div className="mb-3">
          <p className="text-[10px] tracking-[1.6px] uppercase font-bold mb-1.5" style={{ color: dim(0.5) }}>Notes</p>
          <textarea
            value={f.notes}
            onChange={(e) => set('notes')(e.target.value)}
            rows={3}
            placeholder="What was said — write for whoever takes over"
            className="w-full px-4 py-3 rounded-2xl outline-none text-[14px] resize-none"
            style={{ ...card, color: '#fff' }}
          />
        </div>

        <button
          onClick={save}
          disabled={!f.name.trim() || !f.phone.trim() || busy}
          className="w-full mt-2 py-4 rounded-2xl text-[12px] font-black uppercase tracking-[1.5px] flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: GOLD, color: NAVY }}
        >
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving</> : <><UserPlus className="w-4 h-4" /> Add lead</>}
        </button>
      </div>
    </div>
  );
};

export default NewLeadSheet;
