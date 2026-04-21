import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, ArrowRight, Lock, User, Key } from 'lucide-react';
import logoUrl from '../../1776590293988-019da507-f581-77e9-8281-8d60b280ccd6-removebg-preview.png';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import type { UserRole } from '../store/appStore';

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showTwoFA, setShowTwoFA] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'login' | '2fa'>('login');
  const [twoFACode, setTwoFACode] = useState('');
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const { login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();

  const getHomePath = (role: UserRole) => {
    if (role === 'student') return '/dashboard';
    if (role === 'sales') return '/sales';
    if (role === 'staff') return '/staff';
    return '/admin';
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const user = await login(username, password);
    if (user) {
      if (user.role === 'student') {
        toast.success('Welcome back!');
        navigate(getHomePath(user.role));
      } else {
        setPendingRole(user.role);
        setStep('2fa');
        toast.success('Login step 1 successful! Please enter 2FA code.');
      }
    }
    setLoading(false);
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const ok = await verifyTwoFactor(twoFACode);
      if (ok) {
        toast.success('2FA Verified! Access granted.');
        navigate(getHomePath(pendingRole ?? 'student'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-black/20 overflow-hidden relative">
          {/* Header */}
          <div className="text-center mb-10">
            <img src={logoUrl} alt="The Way" className="mx-auto h-24 w-auto object-contain mb-6" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Student Management Platform</p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'login' ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLoginSubmit}
                className="space-y-6"
              >
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                    Username or Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                      placeholder="e.g. admin"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                      placeholder="********"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500/20" />
                    <span className="text-xs font-bold text-gray-400 group-hover:text-black transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="text-xs font-bold text-amber-600 hover:text-amber-700">Forgot Password?</a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-4 rounded-2xl font-black text-lg hover:bg-amber-500 hover:text-black transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/5 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Login to Portal
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="2fa-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handle2FASubmit}
                className="space-y-6 text-center"
              >
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-6">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-black">Two-Step Verification</h2>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                  Enter the 6-digit code sent to your registered device for <span className="text-black font-bold">@{username}</span>.
                </p>

                <div>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showTwoFA ? 'text' : 'password'}
                      maxLength={6}
                      value={twoFACode}
                      onChange={(e) => setTwoFACode(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 border-none rounded-2xl text-center text-2xl font-black tracking-[10px] focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                      placeholder="000000"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowTwoFA(!showTwoFA)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500 transition-colors"
                      aria-label="Toggle 2FA visibility"
                    >
                      {showTwoFA ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-4 rounded-2xl font-black text-lg hover:bg-amber-500 hover:text-black transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/5 disabled:opacity-50"
                >
                  Verify & Continue
                </button>

                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="text-xs font-black text-gray-400 hover:text-black uppercase tracking-widest transition-colors"
                >
                  Back to login
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Links */}
        <div className="mt-10 flex items-center justify-center gap-8 relative z-10">
          <Link to="/" className="text-gray-500 hover:text-amber-500 font-bold text-xs uppercase tracking-widest transition-colors">Home</Link>
          <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
          <a href="#" className="text-gray-500 hover:text-amber-500 font-bold text-xs uppercase tracking-widest transition-colors">Support</a>
          <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
          <a href="#" className="text-gray-500 hover:text-amber-500 font-bold text-xs uppercase tracking-widest transition-colors">Privacy</a>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;




