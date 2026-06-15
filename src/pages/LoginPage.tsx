import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Lock, User } from 'lucide-react';
import logoUrl from '../../thewaynewlogo-removebg-preview.png';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import type { UserRole } from '../store/appStore';
import { useI18n } from '../lib/i18n';
import LanguageToggle from '../components/LanguageToggle';

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t: tr, dir, fontFamily } = useI18n();
  const navigate = useNavigate();

  const getHomePath = (role: UserRole) => {
    if (role === 'student') return '/dashboard';
    if (role === 'sales') return '/sales';
    if (role === 'ops') return '/ops';
    if (role === 'staff' || role === 'agency_staff') return '/staff';
    if (role === 'agency') return '/agencies';
    if (role === 'ceo') return '/admin';
    return '/';
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const user = await login(username, password);
    if (user) {
      toast.success(tr('Welcome back!', 'مرحباً بعودتك!'));
      navigate(getHomePath(user.role));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans" dir={dir} style={{ fontFamily }}>
      <div className="absolute top-5 right-5 z-20">
        <LanguageToggle variant="dark" />
      </div>
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
            <img src={logoUrl} alt="The Way" className="mx-auto h-16 w-auto object-contain mb-6" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">{tr('Student Management Platform', 'منصة إدارة الطلاب')}</p>
          </div>

          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleLoginSubmit}
            className="space-y-6"
          >
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                    {tr('Username or Email', 'اسم المستخدم أو البريد')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                      placeholder={tr('e.g. admin', 'مثال: admin')}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                    {tr('Password', 'كلمة المرور')}
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

                <div className="flex items-center px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500/20" />
                    <span className="text-xs font-bold text-gray-400 group-hover:text-black transition-colors">{tr('Remember me', 'تذكّرني')}</span>
                  </label>
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
                      {tr('Login to Portal', 'دخول البوابة')}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
          </motion.form>
        </div>

        {/* Footer Links */}
        <div className="mt-10 flex items-center justify-center gap-8 relative z-10">
          <Link to="/" className="text-gray-500 hover:text-amber-500 font-bold text-xs uppercase tracking-widest transition-colors">{tr('Home', 'الرئيسية')}</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;

