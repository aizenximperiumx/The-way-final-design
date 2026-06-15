import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { KeyRound, LogOut, Mail, Phone, BadgeCheck, Gift, ChevronRight, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/appStore';
import { getAvatar } from '../lib/avatar';
import logoUrl from '../../1776590293988-019da507-f581-77e9-8281-8d60b280ccd6-removebg-preview.png';
import MobileLayout from './MobileLayout';

const MobileProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const { changePassword } = useAppStore();
  const navigate = useNavigate();
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) return null;
  const avatar = getAvatar(user.id);
  const memberId = (user.username || user.id).toUpperCase();
  const qrValue = `theway:student:${user.id}`;

  const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,168,0,0.14)' };

  const savePw = async () => {
    if (newPw.length < 8) { toast.error('At least 8 characters'); return; }
    setSaving(true);
    try { await changePassword(newPw); toast.success('Password updated'); setNewPw(''); setPwOpen(false); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update'); }
    finally { setSaving(false); }
  };

  const doLogout = () => { void logout(); navigate('/app'); };

  return (
    <MobileLayout title="Profile">
      {/* Digital Student ID card */}
      <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(140deg, #122244, #0A1628)', border: '1px solid rgba(245,168,0,0.3)' }}>
        <div className="px-5 pt-5 flex items-center justify-between">
          <img src={logoUrl} alt="The Way" className="h-7 w-auto object-contain" />
          <span className="text-[9px] tracking-[2px] uppercase font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(245,168,0,0.15)', color: 'var(--v3-yellow)' }}>Student</span>
        </div>
        <div className="px-5 py-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-black shrink-0" style={{ background: 'rgba(245,168,0,0.15)', color: 'var(--v3-yellow)' }}>
            {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="v3-serif text-[20px] font-bold truncate" style={{ color: 'var(--v3-white)' }}>{user.name}</p>
            <p className="text-[11px] tracking-[1px] mt-0.5" style={{ color: 'rgba(245,240,232,0.55)' }}>ID · {memberId}</p>
          </div>
        </div>
        {/* QR strip */}
        <div className="px-5 pb-5 flex items-center gap-4">
          <div className="bg-white rounded-2xl p-2.5 shrink-0">
            <QRCodeSVG value={qrValue} size={92} bgColor="#ffffff" fgColor="#0A1628" level="M" />
          </div>
          <div>
            <p className="text-[12px] font-bold" style={{ color: 'var(--v3-white)' }}>Your member QR</p>
            <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'rgba(245,240,232,0.55)' }}>
              Show this at partner stores & services for student discounts and benefits.
            </p>
          </div>
        </div>
      </div>

      {/* Perks placeholder */}
      <div className="mt-4 rounded-2xl p-5" style={card}>
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4" style={{ color: 'var(--v3-yellow)' }} />
          <p className="text-[10px] tracking-[2px] uppercase font-bold" style={{ color: 'rgba(245,240,232,0.55)' }}>Your perks</p>
        </div>
        <p className="text-[13px] mt-2" style={{ color: 'rgba(245,240,232,0.6)' }}>
          Partner discounts at supermarkets and more are coming soon — your QR above is your key.
        </p>
        <div className="mt-3 flex gap-2">
          {['Supermarkets', 'Transport', 'Cafés', 'More'].map(t => (
            <span key={t} className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(245,168,0,0.12)' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Account details */}
      <p className="mt-6 mb-3 text-[11px] tracking-[2px] uppercase font-bold" style={{ color: 'rgba(245,240,232,0.5)' }}>Account</p>
      <div className="rounded-2xl overflow-hidden" style={card}>
        {[
          { icon: BadgeCheck, label: 'Username', value: user.username || '—' },
          { icon: Mail, label: 'Email', value: user.email || '—' },
          { icon: Phone, label: 'Phone', value: user.phone || '—' },
        ].map((r, i) => (
          <div key={r.label} className="flex items-center gap-3 px-4 py-3.5" style={{ borderTop: i ? '1px solid rgba(245,168,0,0.1)' : 'none' }}>
            <r.icon className="w-4 h-4 shrink-0" style={{ color: 'var(--v3-yellow)' }} />
            <span className="text-[12px] flex-1" style={{ color: 'rgba(245,240,232,0.5)' }}>{r.label}</span>
            <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--v3-white)' }}>{r.value}</span>
          </div>
        ))}
      </div>

      {/* Change password */}
      <button onClick={() => setPwOpen(v => !v)} className="mt-3 w-full rounded-2xl px-4 py-4 flex items-center gap-3" style={card}>
        <KeyRound className="w-4 h-4" style={{ color: 'var(--v3-yellow)' }} />
        <span className="text-[14px] font-semibold flex-1 text-left" style={{ color: 'var(--v3-white)' }}>Change password</span>
        <ChevronRight className={`w-4 h-4 transition-transform ${pwOpen ? 'rotate-90' : ''}`} style={{ color: 'rgba(245,240,232,0.4)' }} />
      </button>
      {pwOpen && (
        <div className="mt-2 rounded-2xl p-4" style={card}>
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="New password (min 8 chars)"
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,168,0,0.18)', color: 'var(--v3-white)' }}
          />
          <button onClick={() => void savePw()} disabled={saving} className="mt-3 w-full py-3 rounded-xl text-[13px] font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update password'}
          </button>
        </div>
      )}

      {/* Privacy + logout */}
      <div className="mt-3 flex items-center gap-2 px-1">
        <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'rgba(245,240,232,0.35)' }} />
        <p className="text-[11px]" style={{ color: 'rgba(245,240,232,0.35)' }}>Your data is private and used only for your enrollment.</p>
      </div>
      <button onClick={doLogout} className="mt-3 mb-2 w-full rounded-2xl py-4 flex items-center justify-center gap-2 text-[14px] font-bold" style={{ background: 'rgba(244,67,54,0.1)', color: '#FF8A80', border: '1px solid rgba(244,67,54,0.2)' }}>
        <LogOut className="w-4 h-4" /> Log out
      </button>
    </MobileLayout>
  );
};

export default MobileProfile;
