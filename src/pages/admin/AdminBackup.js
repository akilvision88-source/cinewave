// src/pages/admin/AdminBackup.js
import React, { useState, useEffect } from 'react';
import { 
  FaDownload, FaUpload, FaDatabase, FaTrash, FaSave, 
  FaFileExport, FaFileImport, FaShieldAlt, FaSyncAlt,
  FaCheckCircle, FaExclamationTriangle, FaServer,
  FaTable, FaClock, FaUser, FaFilm, FaTv, FaMusic
} from 'react-icons/fa';
import { backupAPI } from '../../services/api';

const AdminBackup = () => {
  const [loading, setLoading] = useState(false);
  const [backupInfo, setBackupInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [backupHistory, setBackupHistory] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [exporting, setExporting] = useState(false);

  // ========== قائمة الجداول في قاعدة البيانات ==========
  const tables = [
    { id: 'movies', label: '🎬 الأفلام', count: 0 },
    { id: 'series', label: '📺 المسلسلات', count: 0 },
    { id: 'episodes', label: '📼 الحلقات', count: 0 },
    { id: 'channels', label: '📡 القنوات', count: 0 },
    { id: 'artists', label: '🎤 الفنانين', count: 0 },
    { id: 'songs', label: '🎵 الأغاني', count: 0 },
    { id: 'clips', label: '🎬 الكليبات', count: 0 },
    { id: 'reciters', label: '🕌 القراء', count: 0 },
    { id: 'surahs', label: '📖 السور', count: 0 },
    { id: 'users', label: '👥 المستخدمين', count: 0 },
    { id: 'comments', label: '💬 التعليقات', count: 0 },
    { id: 'user_favorites', label: '⭐ المفضلة', count: 0 },
    { id: 'user_likes', label: '❤️ الإعجابات', count: 0 },
    { id: 'watch_history', label: '📊 سجل المشاهدة', count: 0 }
  ];

  // ========== تحميل إحصائيات قاعدة البيانات ==========
  const loadStats = async () => {
    try {
      const data = await backupAPI.getStats();
      setStats(data);
      
      // تحديث عدد السجلات في كل جدول
      const updatedTables = tables.map(table => {
        const count = data[table.id] || 0;
        return { ...table, count };
      });
      setSelectedTables(updatedTables);
      
      console.log('✅ تم تحميل إحصائيات قاعدة البيانات:', data);
    } catch (error) {
      console.error('❌ خطأ في تحميل الإحصائيات:', error);
    }
  };

  // ========== تحميل سجل النسخ الاحتياطي ==========
  const loadBackupHistory = async () => {
    try {
      const history = await backupAPI.getHistory();
      setBackupHistory(history);
    } catch (error) {
      console.error('❌ خطأ في تحميل سجل النسخ الاحتياطي:', error);
    }
  };

  useEffect(() => {
    loadStats();
    loadBackupHistory();
  }, []);

  // ========== تصدير جميع البيانات ==========
  const exportAllData = async () => {
    if (!window.confirm('هل تريد تصدير جميع البيانات من قاعدة البيانات؟')) return;
    
    setExporting(true);
    try {
      const data = await backupAPI.exportAll();
      
      // تحويل البيانات إلى JSON
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cinewave_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      // تسجيل عملية التصدير
      await backupAPI.logBackup('export', 'all', Object.keys(data).length);
      await loadBackupHistory();
      
      alert('✅ تم تصدير جميع البيانات بنجاح!');
    } catch (error) {
      console.error('❌ خطأ في تصدير البيانات:', error);
      alert('❌ حدث خطأ في تصدير البيانات: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  // ========== تصدير جداول محددة ==========
  const exportSelectedTables = async () => {
    const selected = selectedTables.filter(t => t.selected).map(t => t.id);
    if (selected.length === 0) {
      alert('الرجاء اختيار جدول واحد على الأقل للتصدير');
      return;
    }
    
    setExporting(true);
    try {
      const data = await backupAPI.exportTables(selected);
      
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cinewave_backup_${selected.join('_')}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      await backupAPI.logBackup('export', selected.join(','), Object.keys(data).length);
      await loadBackupHistory();
      
      alert(`✅ تم تصدير ${selected.length} جدول بنجاح!`);
    } catch (error) {
      console.error('❌ خطأ في تصدير البيانات:', error);
      alert('❌ حدث خطأ في تصدير البيانات: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  // ========== استيراد البيانات ==========
  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!window.confirm('⚠️ تحذير: استيراد البيانات سيستبدل البيانات الموجودة. هل أنت متأكد؟')) {
      event.target.value = '';
      return;
    }
    
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // التحقق من صحة البيانات
        if (!importedData.tables || typeof importedData.tables !== 'object') {
          throw new Error('تنسيق الملف غير صحيح');
        }
        
        const result = await backupAPI.importData(importedData);
        
        alert(`✅ تم استيراد ${result.importedCount} سجل بنجاح!`);
        setBackupInfo({ 
          importedCount: result.importedCount, 
          date: new Date().toISOString() 
        });
        
        // تحديث الإحصائيات
        await loadStats();
        await loadBackupHistory();
        await backupAPI.logBackup('import', 'all', result.importedCount);
        
      } catch (error) {
        console.error('❌ خطأ في استيراد البيانات:', error);
        alert('❌ حدث خطأ في استيراد البيانات: ' + error.message);
      }
      setLoading(false);
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  // ========== مسح جميع البيانات ==========
  const clearAllData = async () => {
    if (!window.confirm('⚠️ تحذير: هذا الإجراء سيمسح جميع البيانات من قاعدة البيانات نهائياً! هل أنت متأكد؟')) return;
    if (!window.confirm('تأكيد نهائي: هل تريد حقاً حذف كل شيء؟')) return;
    
    setLoading(true);
    try {
      await backupAPI.clearAll();
      alert('🗑️ تم مسح جميع البيانات بنجاح');
      await loadStats();
      await loadBackupHistory();
      await backupAPI.logBackup('clear', 'all', 0);
    } catch (error) {
      console.error('❌ خطأ في مسح البيانات:', error);
      alert('❌ حدث خطأ في مسح البيانات: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== استعادة نسخة احتياطية ==========
  const restoreBackup = async (backupId) => {
    if (!window.confirm('⚠️ هل تريد استعادة هذه النسخة الاحتياطية؟ سيتم استبدال البيانات الحالية.')) return;
    
    setLoading(true);
    try {
      const result = await backupAPI.restoreBackup(backupId);
      alert(`✅ تم استعادة ${result.restoredCount} سجل بنجاح!`);
      await loadStats();
      await loadBackupHistory();
    } catch (error) {
      console.error('❌ خطأ في استعادة النسخة:', error);
      alert('❌ حدث خطأ في استعادة النسخة: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== الحصول على حجم قاعدة البيانات ==========
  const getDatabaseSize = () => {
    if (!stats) return '0 MB';
    const sizeInMB = (stats.totalSize || 0) / (1024 * 1024);
    return sizeInMB > 1 ? `${sizeInMB.toFixed(2)} MB` : `${(stats.totalSize / 1024).toFixed(2)} KB`;
  };

  // ========== تبديل اختيار الجدول ==========
  const toggleTableSelection = (tableId) => {
    setSelectedTables(prev => 
      prev.map(table => 
        table.id === tableId ? { ...table, selected: !table.selected } : table
      )
    );
  };

  // ========== تحديد/إلغاء تحديد الكل ==========
  const toggleAllTables = () => {
    const allSelected = selectedTables.every(t => t.selected);
    setSelectedTables(prev => 
      prev.map(table => ({ ...table, selected: !allSelected }))
    );
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <FaDatabase className="text-purple-400" /> النسخ الاحتياطي
        </h2>
        <div className="flex items-center gap-3 text-gray-400 text-sm flex-wrap">
          <span className="flex items-center gap-1">
            <FaServer className="text-purple-400" /> 
            حجم البيانات: {getDatabaseSize()}
          </span>
          <span className="flex items-center gap-1">
            <FaTable className="text-blue-400" /> 
            {stats?.totalRecords || 0} سجل
          </span>
          <button 
            onClick={loadStats} 
            className="text-gray-500 hover:text-white transition p-1"
            title="تحديث الإحصائيات"
          >
            <FaSyncAlt className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.users || 0}</div>
            <div className="text-gray-500 text-xs">👥 مستخدمين</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.movies || 0}</div>
            <div className="text-gray-500 text-xs">🎬 أفلام</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.series || 0}</div>
            <div className="text-gray-500 text-xs">📺 مسلسلات</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.songs || 0}</div>
            <div className="text-gray-500 text-xs">🎵 أغاني</div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* ====== تصدير البيانات ====== */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaFileExport className="text-green-400 text-2xl" />
            <h3 className="text-white text-lg font-bold">تصدير البيانات</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            قم بتصدير بيانات قاعدة البيانات إلى ملف JSON للاحتفاظ بنسخة احتياطية.
          </p>
          
          {/* اختيار الجداول */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">اختر الجداول للتصدير:</span>
              <button 
                onClick={toggleAllTables}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                {selectedTables.every(t => t.selected) ? 'إلغاء الكل' : 'تحديد الكل'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
              {selectedTables.map(table => (
                <label key={table.id} className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer hover:bg-gray-700/30 p-1 rounded">
                  <input 
                    type="checkbox" 
                    checked={table.selected || false}
                    onChange={() => toggleTableSelection(table.id)}
                    className="w-3 h-3 accent-purple-500"
                  />
                  <span>{table.label}</span>
                  <span className="text-gray-500 text-xs">({table.count || 0})</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={exportAllData} 
              disabled={exporting}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {exporting ? <FaSyncAlt className="animate-spin" /> : <FaDownload />}
              {exporting ? 'جاري التصدير...' : 'تصدير جميع البيانات'}
            </button>
            <button 
              onClick={exportSelectedTables} 
              disabled={exporting}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {exporting ? <FaSyncAlt className="animate-spin" /> : <FaFileExport />}
              {exporting ? 'جاري التصدير...' : 'تصدير الجداول المحددة'}
            </button>
          </div>
        </div>

        {/* ====== استيراد البيانات ====== */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaFileImport className="text-blue-400 text-2xl" />
            <h3 className="text-white text-lg font-bold">استيراد البيانات</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            قم باستيراد بيانات من ملف نسخ احتياطي سابق. سيتم استبدال البيانات الموجودة.
          </p>
          <label className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
            {loading ? <FaSyncAlt className="animate-spin" /> : <FaUpload />}
            {loading ? 'جاري الاستيراد...' : 'استيراد ملف JSON'}
            <input type="file" accept=".json" onChange={importData} className="hidden" disabled={loading} />
          </label>
          
          {backupInfo && (
            <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
              <p className="text-green-400 text-xs flex items-center gap-1">
                <FaCheckCircle /> آخر استيراد: {new Date(backupInfo.date).toLocaleString()}
              </p>
              <p className="text-green-400 text-xs">عدد السجلات المستوردة: {backupInfo.importedCount}</p>
            </div>
          )}
        </div>

        {/* ====== سجل النسخ الاحتياطي ====== */}
        <div className="bg-gray-800 rounded-xl p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <FaClock className="text-purple-400 text-2xl" />
            <h3 className="text-white text-lg font-bold">سجل النسخ الاحتياطي</h3>
            <span className="text-gray-500 text-sm">({backupHistory.length})</span>
          </div>
          
          {backupHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-4 text-sm">لا توجد سجلات للنسخ الاحتياطي</p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {backupHistory.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition">
                  <div>
                    <p className="text-white text-sm">
                      {item.type === 'export' ? '📤 تصدير' : 
                       item.type === 'import' ? '📥 استيراد' : 
                       item.type === 'clear' ? '🗑️ مسح' : '🔄 استعادة'}
                      {' - '}
                      <span className="text-gray-400">{item.tables}</span>
                    </p>
                    <p className="text-gray-500 text-xs">
                      {item.records} سجل • {new Date(item.date).toLocaleString()}
                    </p>
                  </div>
                  {item.type === 'export' && (
                    <button 
                      onClick={() => restoreBackup(item.id)}
                      className="text-purple-400 hover:text-purple-300 text-sm px-2 py-1 border border-purple-400/30 rounded"
                    >
                      استعادة
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ====== حذف البيانات ====== */}
        <div className="bg-gray-800 rounded-xl p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <FaTrash className="text-red-400 text-2xl" />
            <h3 className="text-white text-lg font-bold">مسح البيانات</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-gray-400 text-sm">
                ⚠️ تحذير: هذا الإجراء سيمسح جميع البيانات من قاعدة البيانات نهائياً. 
                تأكد من وجود نسخة احتياطية قبل المتابعة.
              </p>
            </div>
            <button 
              onClick={clearAllData} 
              disabled={loading}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              {loading ? <FaSyncAlt className="animate-spin" /> : <FaTrash />}
              {loading ? 'جاري المسح...' : 'مسح جميع البيانات'}
            </button>
          </div>
        </div>

        {/* ====== نصائح هامة ====== */}
        <div className="bg-gray-800 rounded-xl p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <FaShieldAlt className="text-purple-400 text-2xl" />
            <h3 className="text-white text-lg font-bold">نصائح هامة</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <ul className="text-gray-400 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                قم بعمل نسخة احتياطية قبل إجراء أي تغييرات كبيرة
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                يُنصح بعمل نسخة احتياطية يومياً
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                يمكن استخدام ملفات JSON للترحيل بين الخوادم
              </li>
            </ul>
            <ul className="text-gray-400 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                تأكد من سلامة ملف الاستيراد قبل رفعه
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                احتفظ بنسخة احتياطية خارجية على جهازك
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                عند الاستعادة، سيتم استبدال البيانات الحالية
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ تأكد من وجود هذا السطر في نهاية الملف
export default AdminBackup;