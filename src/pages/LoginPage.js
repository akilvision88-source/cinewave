// src/pages/LoginPage.js - تسجيل الدخول بنفس النمط الموحّد
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { authAPI } from '../services/api';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle, FaFacebook, FaApple } from 'react-icons/fa';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const remembered = localStorage.getItem('rememberMe');
    const savedEmail = localStorage.getItem('savedEmail');
    if (remembered === 'true' && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    if (!email.trim()) { setError('الرجاء إدخال البريد الإلكتروني'); return false; }
    if (!password.trim()) { setError('الرجاء إدخال كلمة المرور'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('البريد الإلكتروني غير صحيح'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.login(email, password);
      if (response && response.token) {
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('savedEmail', email);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('savedEmail');
        }
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 text-sm';
        toast.textContent = '🎉 تم تسجيل الدخول بنجاح!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
        setTimeout(() => {
          const userRole = localStorage.getItem('userRole');
          if (userRole === 'admin') navigate('/admin');
          else navigate('/');
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'حدث خطأ في تسجيل الدخول';
      if (errorMessage.includes('بيانات غير صحيحة') || errorMessage.includes('Invalid')) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (errorMessage.includes('banned')) {
        setError('هذا الحساب محظور. يرجى التواصل مع الدعم');
      } else {
        setError(errorMessage);
      }
    } finally { setLoading(false); }
  };

  const demoCredentials = [
    { email: 'mohcine@akiltv.com', password: 'Akil1988@', role: 'مدير' },
    { email: 'user@cinewave.com', password: 'user123', role: 'مستخدم' }
  ];

  const fillDemoCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#1f242d] relative flex items-center justify-center py-12 px-4">
      {/* خلفية ديناميكية */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://image.tmdb.org/t/p/original/9l1eZiJHmhr5jIlthMdJN5WYoff.jpg)', filter: 'blur(100px) saturate(1.4) brightness(0.25)', transform: 'scale(1.3)' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1f242d]/95 via-[#1f242d]/80 to-[#1f242d]/95" />
        <motion.div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[150px] opacity-40" style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.6) 0%, transparent 70%)' }} animate={{ x: [0, 100, 0], y: [0, 80, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-[150px] opacity-30" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)' }} animate={{ x: [0, -80, 0], y: [0, -100, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      {/* فاصل أبيض علوي */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 z-10">
        <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/70 shadow-lg shadow-white/40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-md w-full bg-white/[0.04] backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl shadow-black/60"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center mb-4 shadow-2xl shadow-red-600/50 ring-2 ring-white/20">
            <span className="text-white text-3xl font-black">A</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-white via-rose-100 to-red-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(220,38,38,0.5)]">
            {t('auth.login') || 'تسجيل الدخول'}
          </h1>
          <div className="w-20 h-0.5 mx-auto rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent my-3 shadow-lg shadow-red-500/50" />
          <p className="text-gray-300 text-sm">{t('auth.loginSubtitle') || 'مرحباً بك في Akil Tv'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-3 text-red-400 text-sm text-center backdrop-blur-sm">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-gray-300 mb-2 text-sm font-bold">{t('auth.email') || 'البريد الإلكتروني'}</label>
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#21262d] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 transition text-sm"
                placeholder="mohcine@akiltv.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-sm font-bold">{t('auth.password') || 'كلمة المرور'}</label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#21262d] border border-white/10 rounded-xl py-3 pl-11 pr-11 text-white focus:outline-none focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 transition text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
              >
                {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-white/20 text-red-600 focus:ring-red-500 bg-[#21262d]" />
              <span className="text-gray-400 text-xs">تذكرني</span>
            </label>
            <Link to="/forgot-password" className="text-red-500 text-xs hover:text-red-400 transition font-bold">
              {t('auth.forgotPassword') || 'نسيت كلمة المرور؟'}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white py-3 rounded-xl font-bold hover:shadow-2xl hover:shadow-red-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('common.loading') || 'جاري التحميل...'}</span>
              </div>
            ) : (t('auth.login') || 'تسجيل الدخول')}
          </button>
        </form>

        {/* فاصل */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-transparent backdrop-blur-md text-gray-400 text-xs">{t('auth.or') || 'أو'}</span>
          </div>
        </div>

        {/* Social */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button className="flex items-center justify-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition border border-white/10 hover:border-red-500/30">
            <FaGoogle className="text-red-500 text-lg" />
          </button>
          <button className="flex items-center justify-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition border border-white/10 hover:border-blue-500/30">
            <FaFacebook className="text-blue-500 text-lg" />
          </button>
          <button className="flex items-center justify-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition border border-white/10 hover:border-white/30">
            <FaApple className="text-white text-lg" />
          </button>
        </div>

        {/* Demo */}
        <div className="mb-6 p-4 bg-white/[0.03] rounded-2xl border border-white/10">
          <p className="text-gray-500 text-xs text-center mb-2 font-bold">{t('auth.demoCredentials') || 'بيانات تجريبية'}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {demoCredentials.map((cred, i) => (
              <button
                key={i}
                onClick={() => fillDemoCredentials(cred.email, cred.password)}
                className="text-xs px-3 py-1.5 rounded-full transition bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:scale-105"
              >
                {cred.role}: {cred.email}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-400 text-sm">
            {t('auth.noAccount') || 'ليس لديك حساب؟'}{' '}
            <Link to="/register" className="text-red-500 hover:text-red-400 font-bold">{t('auth.register') || 'إنشاء حساب'}</Link>
          </p>
        </div>
      </motion.div>

      {/* فاصل أبيض سفلي */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-4 z-10">
        <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/70 shadow-lg shadow-white/40" />
      </div>
    </div>
  );
};

export default LoginPage;