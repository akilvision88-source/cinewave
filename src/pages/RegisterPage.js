// src/pages/RegisterPage.js - نسخة متكاملة مع MySQL
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { authAPI } from '../services/api';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUser, FaGoogle, FaFacebook, FaApple } from 'react-icons/fa';

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
    if (!name.trim()) {
      setError('الرجاء إدخال الاسم الكامل');
      return false;
    }
    if (!email.trim()) {
      setError('الرجاء إدخال البريد الإلكتروني');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('البريد الإلكتروني غير صحيح');
      return false;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    if (password !== confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return false;
    }
    if (!agreeTerms) {
      setError('يجب الموافقة على شروط الاستخدام');
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
      const response = await authAPI.register(name, email, password);
      
      if (response && response.token) {
        // AuthAPI يقوم تلقائياً بحفظ البيانات في localStorage
        console.log('✅ تم إنشاء الحساب بنجاح');
        
        // إظهار رسالة نجاح
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 text-sm animate-fadeIn';
        toast.textContent = '🎉 تم إنشاء الحساب بنجاح! جاري التحويل...';
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
      console.error('❌ خطأ في التسجيل:', err);
      const errorMessage = err.response?.data?.message || err.message || 'حدث خطأ في إنشاء الحساب';
      
      // رسائل خطأ مفهومة
      if (errorMessage.includes('Duplicate entry') || errorMessage.includes('email')) {
        setError('البريد الإلكتروني مستخدم بالفعل');
      } else if (errorMessage.includes('password')) {
        setError('كلمة المرور غير صالحة');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-red-600 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{t('auth.register')}</h1>
          <p className="text-gray-400 mt-2">{t('auth.registerSubtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center">
              ⚠️ {error}
            </div>
          )}

          {/* الاسم الكامل */}
          <div>
            <label className="block text-gray-400 mb-2 text-sm">{t('auth.fullName')}</label>
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-3 text-white focus:outline-none focus:border-purple-500 transition text-sm" 
                placeholder={t('auth.namePlaceholder')}
              />
            </div>
          </div>

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
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-3 text-white focus:outline-none focus:border-purple-500 transition text-sm" 
                placeholder="example@email.com"
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
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-10 text-white focus:outline-none focus:border-purple-500 transition text-sm" 
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
            <p className="text-gray-500 text-xs mt-1">يجب أن تكون كلمة المرور 6 أحرف على الأقل</p>
          </div>

          {/* تأكيد كلمة المرور */}
          <div>
            <label className="block text-gray-400 mb-2 text-sm">{t('auth.confirmPassword')}</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-10 text-white focus:outline-none focus:border-purple-500 transition text-sm" 
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition"
              >
                {showConfirmPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
              </button>
            </div>
          </div>

          {/* الموافقة على الشروط */}
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="terms" 
              checked={agreeTerms} 
              onChange={(e) => setAgreeTerms(e.target.checked)} 
              className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="terms" className="text-gray-400 text-xs">
              {t('auth.agreeTerms')}{' '}
              <Link to="/terms" className="text-purple-400 hover:text-purple-300">شروط الاستخدام</Link>
              {' و '}
              <Link to="/privacy" className="text-purple-400 hover:text-purple-300">سياسة الخصوصية</Link>
            </label>
          </div>

          {/* زر التسجيل */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-red-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('common.loading')}</span>
              </div>
            ) : (
              t('auth.register')
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

        {/* أزرار التسجيل الاجتماعي */}
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

        {/* رابط تسجيل الدخول */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-purple-500 hover:text-purple-400 font-semibold">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;