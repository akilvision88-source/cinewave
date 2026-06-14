// src/pages/LoginPage.js - نسخة متكاملة مع MySQL
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { authAPI } from '../services/api';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle, FaFacebook, FaApple } from 'react-icons/fa';

const LoginPage = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email.trim()) {
      setError('الرجاء إدخال البريد الإلكتروني');
      return false;
    }
    if (!password.trim()) {
      setError('الرجاء إدخال كلمة المرور');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('البريد الإلكتروني غير صحيح');
      return false;
    }
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
        // AuthAPI يقوم تلقائياً بحفظ البيانات في localStorage
        
        // حفظ تذكرني
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('savedEmail', email);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('savedEmail');
        }
        
        console.log('✅ تم تسجيل الدخول بنجاح:', response.user?.email);
        
        // إظهار رسالة نجاح
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 text-sm animate-fadeIn';
        toast.textContent = '🎉 تم تسجيل الدخول بنجاح! جاري التحويل...';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
        
        // التوجيه حسب الدور
        setTimeout(() => {
          const userRole = localStorage.getItem('userRole');
          if (userRole === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 1500);
      }
    } catch (err) {
      console.error('❌ خطأ في تسجيل الدخول:', err);
      const errorMessage = err.response?.data?.message || err.message || 'حدث خطأ في تسجيل الدخول';
      
      // رسائل خطأ مفهومة
      if (errorMessage.includes('بيانات غير صحيحة') || errorMessage.includes('Invalid')) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (errorMessage.includes('banned')) {
        setError('هذا الحساب محظور. يرجى التواصل مع الدعم');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // تحميل البريد الإلكتروني المحفوظ (تذكرني)
  React.useEffect(() => {
    const remembered = localStorage.getItem('rememberMe');
    const savedEmail = localStorage.getItem('savedEmail');
    if (remembered === 'true' && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // بيانات تجريبية للمساعدة (للمطورين فقط)
  const demoCredentials = [
    { email: 'mohcine@akiltv.com', password: 'Akil1988@', role: 'مدير', color: 'purple' },
    { email: 'user@cinewave.com', password: 'user123', role: 'مستخدم', color: 'blue' }
  ];

  const fillDemoCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-red-600 to-red-500 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{t('auth.login')}</h1>
          <p className="text-gray-400 mt-2">{t('auth.loginSubtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center">
              ⚠️ {error}
            </div>
          )}

          {/* البريد الإلكتروني */}
          <div>
            <label className="block text-gray-400 mb-2 text-sm">{t('auth.email')}</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-3 text-white focus:outline-none focus:border-red-500 transition text-sm" 
                placeholder="mohcine@akiltv.com"
              />
            </div>
          </div>

          {/* كلمة المرور */}
          <div>
            <label className="block text-gray-400 mb-2 text-sm">{t('auth.password')}</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-10 text-white focus:outline-none focus:border-red-500 transition text-sm" 
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition"
              >
                {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
              </button>
            </div>
          </div>

          {/* تذكرني ونسيت كلمة المرور */}
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                className="w-4 h-4 rounded border-gray-600 text-red-600 focus:ring-red-500"
              />
              <span className="text-gray-400 text-xs">تذكرني</span>
            </label>
            <Link to="/forgot-password" className="text-red-500 text-xs hover:text-red-400 transition">
              {t('auth.forgotPassword')}
            </Link>
          </div>

          {/* زر تسجيل الدخول */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/30 transition disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('common.loading')}</span>
              </div>
            ) : (
              t('auth.login')
            )}
          </button>
        </form>

        {/* فصل بصري */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-500">{t('auth.or')}</span>
          </div>
        </div>

        {/* أزرار تسجيل الدخول الاجتماعي */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button className="flex items-center justify-center gap-2 p-2 bg-gray-800 rounded-xl hover:bg-gray-700 transition">
            <FaGoogle className="text-red-500 text-xl" />
          </button>
          <button className="flex items-center justify-center gap-2 p-2 bg-gray-800 rounded-xl hover:bg-gray-700 transition">
            <FaFacebook className="text-blue-600 text-xl" />
          </button>
          <button className="flex items-center justify-center gap-2 p-2 bg-gray-800 rounded-xl hover:bg-gray-700 transition">
            <FaApple className="text-white text-xl" />
          </button>
        </div>

        {/* بيانات تسجيل الدخول التجريبية */}
        <div className="mb-6 p-4 bg-gray-800/50 rounded-xl">
          <p className="text-gray-500 text-xs text-center mb-2">{t('auth.demoCredentials')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {demoCredentials.map((cred, index) => (
              <button
                key={index}
                onClick={() => fillDemoCredentials(cred.email, cred.password)}
                className={`text-xs px-3 py-1 rounded-full transition ${
                  cred.color === 'purple' 
                    ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' 
                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                }`}
              >
                {cred.role}: {cred.email}
              </button>
            ))}
          </div>
        </div>

        {/* رابط إنشاء حساب */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-red-500 hover:text-red-400 font-semibold">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;