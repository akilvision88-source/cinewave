// src/pages/admin/AdminLogin.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaUserCircle, FaUpload, FaTimes } from 'react-icons/fa';
import { authAPI, adminAPI } from '../../services/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  // تحميل قائمة المستخدمين (للمشرفين)
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // محاولة جلب المستخدمين من API
      const data = await adminAPI.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('خطأ في تحميل المستخدمين:', error);
      // بيانات تجريبية في حالة فشل الاتصال
      setUsers([
        { id: 1, name: 'محسن أكيل', email: 'mohcine@akiltv.com', role: 'admin', plan: 'premium', status: 'active', avatar_url: 'https://ui-avatars.com/api/?name=Mohcine+Akil&background=7c3aed&color=fff&size=128' },
        { id: 2, name: 'أبير لوزي', email: 'abir@akiltv.com', role: 'admin', plan: 'premium', status: 'active', avatar_url: 'https://ui-avatars.com/api/?name=Abir+Louzi&background=7c3aed&color=fff&size=128' },
        { id: 3, name: 'حسناء الهاشمي', email: 'hassnaa@akiltv.com', role: 'admin', plan: 'premium', status: 'active', avatar_url: 'https://ui-avatars.com/api/?name=Hassnaa+Elhachachami&background=7c3aed&color=fff&size=128' }
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(email, password);
      
      if (response.user.role !== 'admin') {
        setError('ليس لديك صلاحيات الدخول إلى لوحة التحكم');
        setLoading(false);
        return;
      }
      
      if (response.user.status === 'banned') {
        setError('هذا الحساب محظور');
        setLoading(false);
        return;
      }

      // حفظ بيانات المستخدم مع الصورة
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('userRole', response.user.role);
      localStorage.setItem('userPlan', response.user.plan);
      
      setLoading(false);
      navigate('/admin');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'حدث خطأ في تسجيل الدخول');
      setLoading(false);
    }
  };

  // ========== دوال الصورة الشخصية ==========
  const handleAvatarSelect = (user) => {
    setSelectedUser(user);
    setEmail(user.email);
    setAvatarPreview(user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7c3aed&color=fff&size=128`);
    setShowUserSelector(false);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // التحقق من حجم الملف (حد أقصى 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 2MB');
      return;
    }

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      alert('الرجاء اختيار ملف صورة صالح');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !selectedUser) return;

    setIsUploading(true);
    try {
      // هنا يمكنك رفع الصورة إلى السيرفر
      // هذه مجرد محاكاة - يمكنك استخدام FormData لإرسال الملف
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      formData.append('userId', selectedUser.id);

      // محاكاة رفع الصورة
      await new Promise(resolve => setTimeout(resolve, 1000));

      // تحديث الصورة في الواجهة
      const updatedUsers = users.map(u => 
        u.id === selectedUser.id ? { ...u, avatar_url: avatarPreview } : u
      );
      setUsers(updatedUsers);
      
      alert('✅ تم تحديث الصورة الشخصية بنجاح!');
      setIsUploading(false);
      setAvatarFile(null);
    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
      alert('❌ حدث خطأ في رفع الصورة');
      setIsUploading(false);
    }
  };

  const resetAvatarSelection = () => {
    setSelectedUser(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    setShowUserSelector(false);
  };

  // ========== الحصول على الصورة الافتراضية ==========
  const getDefaultAvatar = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=128`;
  };

  // ========== RENDER ==========
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-800">
        {/* ====== HEADER ====== */}
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-4">
            {selectedUser ? (
              <div className="relative group">
                <img 
                  src={avatarPreview || getDefaultAvatar(selectedUser.name)} 
                  alt={selectedUser.name} 
                  className="w-20 h-20 rounded-full object-cover border-4 border-purple-500"
                />
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition"
                >
                  <FaUpload className="text-white text-xl" />
                </label>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                  className="hidden" 
                />
              </div>
            ) : (
              <div className="w-20 h-20 mx-auto bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-3xl font-bold">C</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 mt-2">تسجيل الدخول إلى لوحة التحكم</p>
        </div>

        {/* ====== ERROR ====== */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm text-center mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ====== SELECT USER ====== */}
          <div>
            <label className="block text-gray-400 mb-2">اختر المستخدم</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserSelector(!showUserSelector)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 text-white text-right flex items-center justify-between hover:border-purple-500 transition"
              >
                <span className="flex items-center gap-2">
                  {selectedUser ? (
                    <>
                      <img 
                        src={selectedUser.avatar_url || getDefaultAvatar(selectedUser.name)} 
                        alt={selectedUser.name} 
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span>{selectedUser.name}</span>
                    </>
                  ) : (
                    <span className="text-gray-500">اختر مستخدم</span>
                  )}
                </span>
                <FaUserCircle className="text-gray-400" />
              </button>
              
              {showUserSelector && (
                <div className="absolute z-10 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {users.filter(u => u.role === 'admin' || u.role === 'premium').map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleAvatarSelect(user)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition text-white text-right"
                    >
                      <img 
                        src={user.avatar_url || getDefaultAvatar(user.name)} 
                        alt={user.name} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-gray-400 text-xs">{user.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {user.role === 'admin' ? 'مشرف' : 'مميز'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ====== EMAIL ====== */}
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

          {/* ====== PASSWORD ====== */}
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

          {/* ====== UPLOAD AVATAR BUTTON ====== */}
          {selectedUser && avatarFile && (
            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-3 border border-purple-500/30">
              <span className="text-sm text-gray-300 flex-1">📷 جاهز للرفع: {avatarFile.name}</span>
              <button
                type="button"
                onClick={uploadAvatar}
                disabled={isUploading}
                className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-1"
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FaUpload />
                )}
                {isUploading ? 'جاري الرفع...' : 'رفع'}
              </button>
              <button
                type="button"
                onClick={() => setAvatarFile(null)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>
          )}

          {/* ====== SUBMIT ====== */}
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

        {/* ====== FOOTER ====== */}
        <div className="mt-4 text-center">
          <p className="text-gray-500 text-xs">
            بيانات الدخول: mohcine@akiltv.com / Akil1988@
          </p>
          {selectedUser && (
            <p className="text-purple-400 text-xs mt-1">
              👤 {selectedUser.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;