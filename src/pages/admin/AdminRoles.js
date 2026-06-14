import React, { useState, useEffect } from 'react';
import { FaUserShield, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaKey, FaLock, FaUnlock } from 'react-icons/fa';

const AdminRoles = () => {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserRoleModal, setShowUserRoleModal] = useState(false);

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

  useEffect(() => {
    loadRoles();
    loadUsers();
  }, []);

  const loadRoles = () => {
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

  const loadUsers = () => {
    const saved = localStorage.getItem('cinewave_users');
    if (saved) {
      setUsers(JSON.parse(saved));
    } else {
      const defaultUsers = [
        { id: 1, name: 'أحمد المدير', email: 'admin@cinewave.com', role: 1, status: 'active' },
        { id: 2, name: 'محمد المحتوى', email: 'content@cinewave.com', role: 2, status: 'active' },
      ];
      setUsers(defaultUsers);
      localStorage.setItem('cinewave_users', JSON.stringify(defaultUsers));
    }
  };

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
    }
  };

  const updateUserRole = (userId, roleId) => {
    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, role: roleId } : u
    );
    setUsers(updatedUsers);
    localStorage.setItem('cinewave_users', JSON.stringify(updatedUsers));
    setShowUserRoleModal(false);
  };

  const togglePermission = (permId) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || 'غير محدد';
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FaUserShield className="text-purple-400" /> إدارة الصلاحيات والأدوار
        </h2>
        <button 
          onClick={() => { setEditingRole(null); setRoleForm({ name: '', permissions: [] }); setShowRoleModal(true); }} 
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
        >
          <FaPlus /> إضافة دور جديد
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* قائمة الأدوار */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3">📋 الأدوار المتاحة</h3>
          <div className="space-y-2">
            {roles.map(role => (
              <div key={role.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div>
                  <p className="text-white font-medium">{role.name}</p>
                  <p className="text-gray-500 text-xs">{role.permissions.length} صلاحية</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditingRole(role); setRoleForm({ name: role.name, permissions: [...role.permissions] }); setShowRoleModal(true); }} 
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <FaEdit />
                  </button>
                  {!role.isDefault && (
                    <button onClick={() => deleteRole(role.id)} className="text-red-400 hover:text-red-300">
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* قائمة المستخدمين */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3">👥 تعيين الأدوار للمستخدمين</h3>
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div>
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-gray-500 text-xs">{user.email}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {user.status === 'active' ? 'نشط' : 'محظور'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 text-sm">{getRoleName(user.role)}</span>
                  <button 
                    onClick={() => { setSelectedUser(user); setShowUserRoleModal(true); }} 
                    className="p-2 bg-purple-600/20 rounded-lg text-purple-400 hover:bg-purple-600/30"
                  >
                    <FaKey />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* مودال إضافة/تعديل دور */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowRoleModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-900">
              <h3 className="text-white text-xl font-bold">{editingRole ? 'تعديل' : 'إضافة'} دور</h3>
              <button onClick={() => setShowRoleModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-5">
              <input 
                type="text" 
                placeholder="اسم الدور (مثال: مدير محتوى)" 
                value={roleForm.name} 
                onChange={(e) => setRoleForm({...roleForm, name: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white mb-4" 
              />
              
              <h4 className="text-white font-bold mb-3">الصلاحيات</h4>
              {Object.entries(permissionsByCategory).map(([category, perms]) => (
                <div key={category} className="mb-4">
                  <h5 className="text-purple-400 text-sm mb-2">{category}</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map(perm => (
                      <label key={perm.id} className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
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
              
              <div className="flex gap-3 mt-4">
                <button onClick={handleRoleSubmit} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                  حفظ
                </button>
                <button onClick={() => setShowRoleModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال تعيين دور للمستخدم */}
      {showUserRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowUserRoleModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-white text-xl font-bold">تعيين دور لـ {selectedUser.name}</h3>
            </div>
            <div className="p-5">
              <div className="space-y-2">
                {roles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => updateUserRole(selectedUser.id, role.id)}
                    className={`w-full text-right p-3 rounded-lg transition ${selectedUser.role === role.id ? 'bg-purple-600/20 border border-purple-500' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    <p className="text-white font-medium">{role.name}</p>
                    <p className="text-gray-500 text-xs">{role.permissions.length} صلاحية</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowUserRoleModal(false)} className="w-full mt-4 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoles;