import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Eye, EyeOff, Lock, User, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import logoUrl from '../../1776590293988-019da507-f581-77e9-8281-8d60b280ccd6-removebg-preview.png';

const MobileLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = await login(username.trim(), password);
    setLoading(false);
    if (user) {
      toast.success('Welcome back!');
      navigate(user.role === 'student' ? '/app/home' : '/app/home');
    }
  };

  return (
    <div className="v3 min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0A1628, #0D1F3C)' }}>
      <div className="px-6 flex items-center" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
        <button onClick={() => navigate('/app')} className="p-2 -ml-2" style={{ color: 'rgba(245,240,232,0.7)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 px-7 flex flex-col justify-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <img src={logoUrl} alt="The Way" className="h-12 w-auto object-contain" />
        <h1 className="v3-serif mt-7 text-[32px] font-black" style={{ color: 'var(--v3-white)' }}>
          Welcome <em className="italic" style={{ color: 'var(--v3-yellow)' }}>back</em>
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: 'rgba(245,240,232,0.6)' }}>
          Sign in with the account your advisor gave you.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="block text-[10px] tracking-[2px] uppercase font-bold mb-2" style={{ color: 'rgba(245,240,232,0.45)' }}>Username or Email</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'rgba(245,240,232,0.4)' }} />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 text-[15px] rounded-2xl outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,168,0,0.15)', color: 'var(--v3-white)' }}
                placeholder="your username"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] tracking-[2px] uppercase font-bold mb-2" style={{ color: 'rgba(245,240,232,0.45)' }}>Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'rgba(245,240,232,0.4)' }} />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-4 text-[15px] rounded-2xl outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,168,0,0.15)', color: 'var(--v3-white)' }}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(245,240,232,0.5)' }}>
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="v3-btn-fx w-full px-8 py-4 mt-2 text-[12px] tracking-[2px] uppercase font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)', borderRadius: 14 }}
          >
            {loading ? <span className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <a href="https://wa.me/995571009550" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center gap-2 text-[13px] font-semibold self-center" style={{ color: 'rgba(245,240,232,0.6)' }}>
          <MessageCircle className="w-4 h-4" /> Trouble signing in? Contact your advisor
        </a>
      </div>
    </div>
  );
};

export default MobileLogin;
