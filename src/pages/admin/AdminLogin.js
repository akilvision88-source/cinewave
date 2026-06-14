// src/pages/admin/AdminLogin.js - نسخة محلية
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import localDB from '../../services/localDB';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // جلب المستخدمين من قاعدة البيانات المحلية
      const users = await localDB.getAll('users');
      
      // البحث عن المستخدم
      const user = users.find(u => u.email === email && u.password === password);
      
      if (!user) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        setLoading(false);
        return;
      }
      
      // التحقق من أن المستخدم له صلاحيات المشرف
      if (user.role !== 'admin') {
        setError('ليس لديك صلاحيات الدخول إلى لوحة التحكم');
        setLoading(false);
        return;
      }
      
      if (user.status === 'banned') {
        setError('هذا الحساب محظور');
        setLoading(false);
        return;
      }

      // حفظ بيانات المصادقة (بدون توكن)
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userPlan', user.plan);
      
      setLoading(false);
      navigate('/admin');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'حدث خطأ في تسجيل الدخول');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-800">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-red-600 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 mt-2">تسجيل الدخول إلى لوحة التحكم</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-400 mb-2">البريد الإلكتروني</label>
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 text-white focus:outline-none focus:border-red-500" 
                placeholder="mohcine@akiltv.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">كلمة المرور</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-10 text-white focus:outline-none focus:border-red-500" 
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري تسجيل الدخول...</span>
              </div>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-4">
          بيانات الدخول: mohcine@akiltv.com / Akil1988@
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;