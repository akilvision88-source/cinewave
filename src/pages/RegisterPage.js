// src/pages/RegisterPage.js - إنشاء حساب بنفس النمط الموحّد
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { authAPI } from '../services/api';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUser, FaGoogle, FaFacebook, FaApple } from 'react-icons/fa';
import { motion } from 'framer-motion';

const RegisterPage = () => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!name.trim()) { setError('الرجاء إدخال الاسم الكامل'); return false; }
    if (!email.trim()) { setError('الرجاء إدخال البريد الإلكتروني'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('البريد الإلكتروني غير صحيح'); return false; }
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return false; }
    if (password !== confirmPassword) { setError('كلمة المرور غير متطابقة'); return false; }
    if (!agreeTerms) { setError('يجب الموافقة على شروط الاستخدام'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.register(name, email, password);
      if (response && response.token) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 text-sm';
        toast.textContent = '🎉 تم إنشاء الحساب بنجاح!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
        setTimeout(() => {
          const userRole = localStorage.getItem('userRole');
          if (userRole === 'admin') navigate('/admin');
          else navigate('/');
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'حدث خطأ في إنشاء الحساب';
      if (errorMessage.includes('Duplicate entry') || errorMessage.includes('email')) {
        setError('البريد الإلكتروني مستخدم بالفعل');
      } else if (errorMessage.includes('password')) {
        setError('كلمة المرور غير صالحة');
      } else {
        setError(errorMessage);
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#1f242d] relative flex items-center justify-center py-12 px-4">
      {/* خلفية ديناميكية */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg)', filter: 'blur(100px) saturate(1.4) brightness(0.25)', transform: 'scale(1.3)' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1f242d]/95 via-[#1f242d]/80 to-[#1f242d]/95" />
        <motion.div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[150px] opacity-40" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)' }} animate={{ x: [0, -100, 0], y: [0, 80, 0] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full blur-[150px] opacity-30" style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.6) 0%, transparent 70%)' }} animate={{ x: [0, 80, 0], y: [0, -100, 0] }} transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }} />
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
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-600 via-rose-600 to-red-600 flex items-center justify-center mb-4 shadow-2xl shadow-purple-600/50 ring-2 ring-white/20">
            <span className="text-white text-3xl font-black">A</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-white via-rose-100 to-red-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(220,38,38,0.5)]">
            {t('auth.register') || 'إنشاء حساب'}
          </h1>
          <div className="w-20 h-0.5 mx-auto rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent my-3 shadow-lg shadow-red-500/50" />
          <p className="text-gray-300 text-sm">{t('auth.registerSubtitle') || 'انضم إلى Akil Tv مجاناً'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-3 text-red-400 text-sm text-center backdrop-blur-sm">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-gray-300 mb-2 text-sm font-bold">{t('auth.fullName') || 'الاسم الكامل'}</label>
            <div className="relative">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#21262d] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition text-sm"
                placeholder={t('auth.namePlaceholder') || 'أحمد محمد'}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-sm font-bold">{t('auth.email') || 'البريد الإلكتروني'}</label>
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#21262d] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition text-sm"
                placeholder="example@email.com"
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
                className="w-full bg-[#21262d] border border-white/10 rounded-xl py-3 pl-11 pr-11 text-white focus:outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition text-sm"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition">
                {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-1.5">6 أحرف على الأقل</p>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-sm font-bold">{t('auth.confirmPassword') || 'تأكيد كلمة المرور'}</label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-[#21262d] border border-white/10 rounded-xl py-3 pl-11 pr-11 text-white focus:outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition text-sm"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition">
                {showConfirmPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-white/20 text-purple-600 focus:ring-purple-500 bg-[#21262d]"
            />
            <label htmlFor="terms" className="text-gray-400 text-xs leading-relaxed">
              {t('auth.agreeTerms') || 'أوافق على'}{' '}
              <Link to="/terms" className="text-purple-400 hover:text-purple-300 font-bold">شروط الاستخدام</Link>
              {' و '}
              <Link to="/privacy" className="text-purple-400 hover:text-purple-300 font-bold">سياسة الخصوصية</Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 via-rose-600 to-red-600 hover:from-purple-700 hover:via-rose-700 hover:to-red-700 text-white py-3 rounded-xl font-bold hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('common.loading') || 'جاري التحميل...'}</span>
              </div>
            ) : (t('auth.register') || 'إنشاء حساب')}
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

        <div className="text-center">
          <p className="text-gray-400 text-sm">
            {t('auth.hasAccount') || 'لديك حساب بالفعل؟'}{' '}
            <Link to="/login" className="text-purple-500 hover:text-purple-400 font-bold">{t('auth.login') || 'تسجيل الدخول'}</Link>
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

export default RegisterPage;