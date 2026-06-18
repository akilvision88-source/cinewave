// src/pages/admin/AdminRoles.js
import React, { useState, useEffect } from 'react';
import { 
  FaUserShield, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, 
  FaKey, FaLock, FaUnlock, FaSyncAlt, FaSave, FaUser,
  FaEnvelope, FaCalendarAlt, FaSearch
} from 'react-icons/fa';
import { adminAPI, authAPI } from '../../services/api';

const AdminRoles = () => {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserRoleModal, setShowUserRoleModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // الصلاحيات المتاحة
  const availablePermissions = [
    { id: 'view_dashboard', label: 'مشاهدة لوحة التحكم', category: 'عام' },
    { id: 'manage_movies', label: 'إدارة الأفلام', category: 'المحتوى' },
    { id: 'manage_series', label: 'إدارة المسلسلات', category: 'المحتوى' },
    { id: 'manage_songs', label: 'إدارة الأغاني', category: 'المحتوى' },
    { id: 'manage_channels', label: 'إدارة القنوات', category: 'المحتوى' },
    { id: 'manage_clips', label: 'إدارة الكليبات', category: 'المحتوى' },
    { id: 'manage_reciters', label: 'إدارة القراء', category: 'المحتوى' },
    { id: 'manage_users', label: 'إدارة المستخدمين', category: 'المستخدمين' },
    { id: 'manage_comments', label: 'إدارة التعليقات', category: 'التفاعل' },
    { id: 'view_statistics', label: 'مشاهدة الإحصائيات', category: 'التقارير' },
    { id: 'manage_backup', label: 'إدارة النسخ الاحتياطي', category: 'النظام' },
    { id: 'manage_roles', label: 'إدارة الصلاحيات', category: 'النظام' },
    { id: 'view_logs', label: 'مشاهدة السجلات', category: 'النظام' },
  ];

  // تجميع الصلاحيات حسب الفئة
  const permissionsByCategory = availablePermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

  // ========== LOAD DATA ==========
  const loadUsers = async () => {
    try {
      const data = await adminAPI.getUsers();
      setUsers(data);
      console.log('✅ تم تحميل المستخدمين:', data.length);
      return data;
    } catch (error) {
      console.error('❌ خطأ في تحميل المستخدمين:', error);
      setUsers([]);
      return [];
    }
  };

  const loadRoles = () => {
    // الأدوار يتم تخزينها محلياً لأن قاعدة البيانات لا تحتوي على جدول للأدوار
    const saved = localStorage.getItem('cinewave_roles');
    if (saved) {
      setRoles(JSON.parse(saved));
    } else {
      const defaultRoles = [
        { id: 1, name: 'مدير كامل', permissions: availablePermissions.map(p => p.id), isDefault: true },
        { id: 2, name: 'مدير محتوى', permissions: ['view_dashboard', 'manage_movies', 'manage_series', 'manage_songs', 'manage_channels', 'manage_clips', 'manage_reciters', 'view_statistics'], isDefault: true },
        { id: 3, name: 'مشرف تعليقات', permissions: ['view_dashboard', 'manage_comments'], isDefault: true },
        { id: 4, name: 'مشرف تقارير', permissions: ['view_dashboard', 'view_statistics'], isDefault: true },
      ];
      setRoles(defaultRoles);
      localStorage.setItem('cinewave_roles', JSON.stringify(defaultRoles));
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadRoles()]);
    } catch (error) {
      console.error('❌ خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // ========== ROLE CRUD ==========
  const handleRoleSubmit = () => {
    if (!roleForm.name) {
      alert('الرجاء إدخال اسم الصلاحية');
      return;
    }
    
    const newRole = {
      id: editingRole ? editingRole.id : Date.now(),
      name: roleForm.name,
      permissions: roleForm.permissions,
      isDefault: false
    };
    
    let newRoles;
    if (editingRole) {
      newRoles = roles.map(r => r.id === editingRole.id ? newRole : r);
    } else {
      newRoles = [...roles, newRole];
    }
    
    setRoles(newRoles);
    localStorage.setItem('cinewave_roles', JSON.stringify(newRoles));
    setShowRoleModal(false);
    setEditingRole(null);
    setRoleForm({ name: '', permissions: [] });
    alert(editingRole ? '✅ تم تحديث الدور بنجاح' : '✅ تم إضافة الدور بنجاح');
  };

  const deleteRole = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isDefault) {
      alert('لا يمكن حذف صلاحية افتراضية');
      return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذه الصلاحية؟')) {
      const newRoles = roles.filter(r => r.id !== roleId);
      setRoles(newRoles);
      localStorage.setItem('cinewave_roles', JSON.stringify(newRoles));
      alert('✅ تم حذف الدور بنجاح');
    }
  };

  // ========== USER ROLE UPDATE ==========
  const updateUserRole = async (userId, roleId) => {
    setSaving(true);
    try {
      // جلب بيانات المستخدم الحالية
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error('المستخدم غير موجود');

      // تحديث دور المستخدم عبر API
      await adminAPI.updateUser(userId, {
        name: user.name,
        email: user.email,
        role: getRoleName(roleId).toLowerCase(),
        plan: user.plan || 'free',
        status: user.status || 'active'
      });

      // تحديث القائمة المحلية
      const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, role: roleId } : u
      );
      setUsers(updatedUsers);
      
      setShowUserRoleModal(false);
      alert('✅ تم تحديث دور المستخدم بنجاح');
      
      // إعادة تحميل البيانات للتأكد
      await loadUsers();
    } catch (error) {
      console.error('❌ خطأ في تحديث دور المستخدم:', error);
      alert('❌ حدث خطأ: ' + (error.message || 'فشل في تحديث دور المستخدم'));
    } finally {
      setSaving(false);
    }
  };

  // ========== TOGGLE PERMISSION ==========
  const togglePermission = (permId) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  // ========== HELPERS ==========
  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || 'مستخدم';
  };

  const getRoleIdByName = (roleName) => {
    const role = roles.find(r => r.name === roleName);
    return role?.id || null;
  };

  // ========== FILTER USERS ==========
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ========== LOADING ==========
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
      {/* ====== HEADER ====== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <FaUserShield className="text-purple-400" /> إدارة الصلاحيات والأدوار
          <span className="text-sm text-gray-500 font-normal">({roles.length} دور - {users.length} مستخدم)</span>
        </h2>
        <button 
          onClick={() => { 
            setEditingRole(null); 
            setRoleForm({ name: '', permissions: [] }); 
            setShowRoleModal(true); 
          }} 
          className="bg-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition text-sm sm:text-base"
        >
          <FaPlus /> إضافة دور جديد
        </button>
      </div>

      {/* ====== STATS ====== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{roles.length}</div>
          <div className="text-gray-500 text-xs">👥 أدوار</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{users.filter(u => u.status === 'active').length}</div>
          <div className="text-gray-500 text-xs">✅ مستخدمين نشطين</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{users.filter(u => u.status === 'banned').length}</div>
          <div className="text-gray-500 text-xs">🚫 مستخدمين محظورين</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{availablePermissions.length}</div>
          <div className="text-gray-500 text-xs">🔑 صلاحيات متاحة</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ====== قائمة الأدوار ====== */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3">📋 الأدوار المتاحة</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {roles.length === 0 ? (
              <p className="text-gray-500 text-center py-4">لا توجد أدوار</p>
            ) : (
              roles.map(role => (
                <div key={role.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition">
                  <div>
                    <p className="text-white font-medium">{role.name}</p>
                    <p className="text-gray-500 text-xs">
                      {role.permissions.length} صلاحية
                      {role.isDefault && <span className="text-purple-400 mr-2">• افتراضي</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { 
                        setEditingRole(role); 
                        setRoleForm({ name: role.name, permissions: [...role.permissions] }); 
                        setShowRoleModal(true); 
                      }} 
                      className="text-blue-400 hover:text-blue-300 p-1"
                      title="تعديل"
                    >
                      <FaEdit size={14} />
                    </button>
                    {!role.isDefault && (
                      <button 
                        onClick={() => deleteRole(role.id)} 
                        className="text-red-400 hover:text-red-300 p-1"
                        title="حذف"
                      >
                        <FaTrash size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ====== قائمة المستخدمين ====== */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3">👥 تعيين الأدوار للمستخدمين</h3>
          
          {/* بحث */}
          <div className="relative mb-3">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="بحث عن مستخدم..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 pl-10 pr-3 text-white text-sm focus:outline-none focus:border-purple-500" 
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">لا يوجد مستخدمين</p>
            ) : (
              filteredUsers.map(user => {
                const roleName = getRoleName(user.role);
                return (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FaUser className="text-gray-400 text-xs" />
                        <p className="text-white font-medium text-sm truncate">{user.name}</p>
                      </div>
                      <p className="text-gray-500 text-xs truncate flex items-center gap-1">
                        <FaEnvelope size={10} /> {user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {user.status === 'active' ? '✅ نشط' : '🚫 محظور'}
                        </span>
                        <span className="text-purple-400 text-xs">{roleName}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => { 
                        setSelectedUser(user); 
                        setShowUserRoleModal(true); 
                      }} 
                      className="p-2 bg-purple-600/20 rounded-lg text-purple-400 hover:bg-purple-600/30 transition flex-shrink-0"
                      title="تغيير الدور"
                    >
                      <FaKey size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ====== مودال إضافة/تعديل دور ====== */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowRoleModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold flex items-center gap-2">
                <FaUserShield className="text-purple-400" />
                {editingRole ? 'تعديل' : 'إضافة'} دور
              </h3>
              <button onClick={() => setShowRoleModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-5">
              <input 
                type="text" 
                placeholder="اسم الدور (مثال: مدير محتوى)" 
                value={roleForm.name} 
                onChange={(e) => setRoleForm({...roleForm, name: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm mb-4" 
              />
              
              <h4 className="text-white font-bold mb-3">🔑 الصلاحيات</h4>
              {Object.entries(permissionsByCategory).map(([category, perms]) => (
                <div key={category} className="mb-4">
                  <h5 className="text-purple-400 text-sm mb-2">{category}</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map(perm => (
                      <label key={perm.id} className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer hover:bg-gray-800/50 p-1 rounded">
                        <input 
                          type="checkbox" 
                          checked={roleForm.permissions.includes(perm.id)} 
                          onChange={() => togglePermission(perm.id)} 
                          className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                        />
                        {perm.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-800">
                <button 
                  onClick={handleRoleSubmit} 
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm flex items-center justify-center gap-2"
                >
                  <FaSave /> حفظ
                </button>
                <button 
                  onClick={() => setShowRoleModal(false)} 
                  className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition text-sm"
                >
                  <FaTimes className="inline ml-1" /> إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== مودال تعيين دور للمستخدم ====== */}
      {showUserRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowUserRoleModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-white text-xl font-bold flex items-center gap-2">
                <FaUser className="text-purple-400" />
                تعيين دور لـ {selectedUser.name}
              </h3>
              <p className="text-gray-500 text-sm mt-1">{selectedUser.email}</p>
            </div>
            <div className="p-5">
              <div className="space-y-2">
                {roles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => updateUserRole(selectedUser.id, role.id)}
                    disabled={saving}
                    className={`w-full text-right p-3 rounded-lg transition disabled:opacity-50 ${
                      selectedUser.role === role.id 
                        ? 'bg-purple-600/20 border border-purple-500' 
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">{role.name}</span>
                      {selectedUser.role === role.id && (
                        <FaCheck className="text-purple-400" />
                      )}
                    </div>
                    <p className="text-gray-500 text-xs">{role.permissions.length} صلاحية</p>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setShowUserRoleModal(false)} 
                className="w-full mt-4 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition text-sm"
              >
                <FaTimes className="inline ml-1" /> إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoles;