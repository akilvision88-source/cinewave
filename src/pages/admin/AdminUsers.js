// src/pages/admin/AdminUsers.js - نسخة تستخدم API
import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaBan, FaCheckCircle, FaSearch, FaUser, FaEnvelope, FaCalendarAlt, FaPlus, FaTimes, FaSave } from 'react-icons/fa';
import { adminAPI } from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    plan: 'free',
    status: 'active'
  });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // تحميل المستخدمين من API
  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('خطأ في تحميل المستخدمين:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // إضافة مستخدم جديد عبر API
  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddError('');
    
    if (!newUser.name || !newUser.email || !newUser.password) {
      setAddError('الرجاء ملء جميع الحقول');
      return;
    }
    
    if (newUser.password.length < 6) {
      setAddError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    
    setAddLoading(true);
    
    try {
      await adminAPI.addUser(newUser);
      showNotification('✅ تم إضافة المستخدم بنجاح');
      setShowAddModal(false);
      resetNewUserForm();
      loadUsers(); // إعادة تحميل القائمة
    } catch (error) {
      console.error('خطأ في إضافة المستخدم:', error);
      setAddError(error.response?.data?.message || 'حدث خطأ في إضافة المستخدم');
    } finally {
      setAddLoading(false);
    }
  };

  const resetNewUserForm = () => {
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'user',
      plan: 'free',
      status: 'active'
    });
  };

  // تحديث مستخدم
  const updateUser = async (userId, updates) => {
    try {
      await adminAPI.updateUser(userId, updates);
      showNotification('✅ تم تحديث المستخدم بنجاح');
      loadUsers();
    } catch (error) {
      console.error('خطأ في تحديث المستخدم:', error);
      showNotification('❌ حدث خطأ في تحديث المستخدم');
    }
  };

  // حذف مستخدم
  const deleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (user?.email === 'mohcine@akiltv.com') {
      showNotification('❌ لا يمكن حذف المستخدم الرئيسي');
      return;
    }
    
    if (window.confirm(`هل أنت متأكد من حذف المستخدم "${user?.name}"؟`)) {
      try {
        await adminAPI.deleteUser(userId);
        showNotification('✅ تم حذف المستخدم بنجاح');
        loadUsers();
      } catch (error) {
        console.error('خطأ في حذف المستخدم:', error);
        showNotification('❌ حدث خطأ في حذف المستخدم');
      }
    }
  };

  const showNotification = (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-fadeIn';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // فلترة المستخدمين
  useEffect(() => {
    let results = [...users];
    if (searchTerm) {
      results = results.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterRole !== 'all') {
      results = results.filter(u => u.role === filterRole);
    }
    if (filterStatus !== 'all') {
      results = results.filter(u => u.status === filterStatus);
    }
    setFilteredUsers(results);
  }, [searchTerm, filterRole, filterStatus, users]);

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': 
        return <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">👑 مدير</span>;
      case 'premium': 
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">⭐ مميز</span>;
      default: 
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30">👤 عادي</span>;
    }
  };

  const getStatusBadge = (status) => {
    return status === 'active' 
      ? <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">🟢 نشط</span>
      : <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">🔴 محظور</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-900 rounded-xl">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            👥 إدارة المستخدمين
            <span className="text-sm bg-gray-800 px-2 py-1 rounded-full text-gray-400">{users.length} مستخدم</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">إضافة وتعديل وحذف المستخدمين والتحكم في صلاحياتهم</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="bg-gradient-to-r from-green-600 to-green-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-lg shadow-green-600/20"
        >
          <FaPlus className="text-sm" /> 
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
          <input 
            type="text" 
            placeholder="بحث باسم أو بريد إلكتروني..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-red-500 transition" 
          />
        </div>
        <select 
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value)} 
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
        >
          <option value="all">جميع الأدوار</option>
          <option value="admin">مدير</option>
          <option value="premium">مميز</option>
          <option value="user">عادي</option>
        </select>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)} 
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
        >
          <option value="all">جميع الحالات</option>
          <option value="active">نشط</option>
          <option value="banned">محظور</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800 rounded-xl">
              <th className="px-4 py-3 text-right text-white text-sm rounded-tr-xl">المستخدم</th>
              <th className="px-4 py-3 text-right text-white text-sm">البريد الإلكتروني</th>
              <th className="px-4 py-3 text-right text-white text-sm">الدور</th>
              <th className="px-4 py-3 text-right text-white text-sm">تاريخ التسجيل</th>
              <th className="px-4 py-3 text-right text-white text-sm">الحالة</th>
              <th className="px-4 py-3 text-right text-white text-sm rounded-tl-xl">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-gray-500">
                  <FaUser className="text-5xl mx-auto mb-3 opacity-30" />
                  <p>لا توجد نتائج مطابقة للبحث</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-600/30 rounded-full flex items-center justify-center">
                        <FaUser className="text-red-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{user.name}</p>
                        <p className="text-gray-500 text-xs">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-300 text-sm">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-400 text-sm flex items-center gap-1">
                      <FaCalendarAlt className="text-gray-600 text-xs" />
                      {user.created_at?.split('T')[0] || '?'}
                    </p>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setSelectedUser(user); setShowUserModal(true); }} 
                        className="p-2 bg-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-all duration-200"
                        title="تفاصيل"
                      >
                        <FaEdit className="text-sm" />
                      </button>
                      <button 
                        onClick={() => updateUser(user.id, { status: user.status === 'active' ? 'banned' : 'active' })} 
                        className={`p-2 rounded-lg transition-all duration-200 ${user.status === 'active' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                        title={user.status === 'active' ? 'حظر المستخدم' : 'إلغاء الحظر'}
                      >
                        {user.status === 'active' ? <FaBan className="text-sm" /> : <FaCheckCircle className="text-sm" />}
                      </button>
                      <button 
                        onClick={() => deleteUser(user.id)} 
                        className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 transition-all duration-200"
                        title="حذف"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowUserModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold flex items-center gap-2">
                <FaUser className="text-blue-400" /> تفاصيل المستخدم
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-white text-2xl transition">&times;</button>
            </div>
            <div className="p-6 text-center">
              <div className="w-24 h-24 mx-auto bg-red-600/30 rounded-full flex items-center justify-center mb-4">
                <FaUser className="text-red-400 text-4xl" />
              </div>
              <h4 className="text-white text-xl font-bold">{selectedUser.name}</h4>
              <p className="text-gray-400 text-sm mt-1">{selectedUser.email}</p>
              
              <div className="mt-4 pt-3 border-t border-gray-800 flex justify-center gap-3">
                <span className="text-sm text-gray-400">الدور:</span>
                {getRoleBadge(selectedUser.role)}
                <span className="text-sm text-gray-400 mx-2">|</span>
                <span className="text-sm text-gray-400">الحالة:</span>
                {getStatusBadge(selectedUser.status)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold flex items-center gap-2">
                <FaPlus className="text-green-400" /> إضافة مستخدم جديد
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white text-2xl transition">&times;</button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {addError && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center">
                  ⚠️ {addError}
                </div>
              )}
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">الاسم الكامل</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-green-500 transition"
                  placeholder="أحمد محمد"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-green-500 transition"
                  placeholder="ahmed@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">كلمة المرور</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-green-500 transition"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">الدور</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="user">👤 مستخدم عادي</option>
                    <option value="premium">⭐ مستخدم مميز</option>
                    <option value="admin">👑 مدير</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">الحالة</label>
                  <select
                    value={newUser.status}
                    onChange={(e) => setNewUser({...newUser, status: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="active">🟢 نشط</option>
                    <option value="banned">🔴 محظور</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">الباقة</label>
                <select
                  value={newUser.plan}
                  onChange={(e) => setNewUser({...newUser, plan: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-green-500"
                >
                  <option value="free">مجاني</option>
                  <option value="standard">قياسي</option>
                  <option value="premium">مميز</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><FaSave /> إضافة المستخدم</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all duration-300"
                >
                  <FaTimes className="inline ml-1" /> إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;