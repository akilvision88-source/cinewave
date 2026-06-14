import React, { useState } from 'react';
import { FaDownload, FaUpload, FaDatabase, FaTrash, FaSave, FaFileExport, FaFileImport, FaShieldAlt } from 'react-icons/fa';

const AdminBackup = () => {
  const [loading, setLoading] = useState(false);
  const [backupInfo, setBackupInfo] = useState(null);

  // قائمة جميع مفاتيح التخزين
  const storageKeys = [
    'cinewave_arabwood', 'cinewave_hollywood', 'cinewave_bollywood', 'cinewave_european', 'cinewave_asian',
    'cinewave_arabicseries', 'cinewave_foreignseries', 'cinewave_indianseries', 'cinewave_turkishseries', 'cinewave_koreanseries',
    'cinewave_channels', 'cinewave_songs', 'cinewave_song_artists', 'cinewave_users', 'cinewave_comments',
    'cinewave_reciters', 'cinewave_artists', 'cinewave_notifications', 'watchlist', 'user', 'language'
  ];

  const exportAllData = () => {
    setLoading(true);
    
    const allData = {};
    storageKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        allData[key] = JSON.parse(data);
      }
    });
    
    allData._exportInfo = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      totalItems: Object.keys(allData).length
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinewave_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setLoading(false);
    alert('✅ تم تصدير جميع البيانات بنجاح!');
  };

  const exportSelectedData = (selectedKeys) => {
    setLoading(true);
    
    const selectedData = {};
    selectedKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        selectedData[key] = JSON.parse(data);
      }
    });
    
    const dataStr = JSON.stringify(selectedData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinewave_selected_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setLoading(false);
    alert('✅ تم تصدير البيانات المحددة بنجاح!');
  };

  const importData = (event) => {
    setLoading(true);
    
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        let importedCount = 0;
        for (const [key, value] of Object.entries(importedData)) {
          if (key !== '_exportInfo') {
            localStorage.setItem(key, JSON.stringify(value));
            importedCount++;
          }
        }
        
        alert(`✅ تم استيراد ${importedCount} عنصر بنجاح! يرجى تحديث الصفحة.`);
        setBackupInfo({ importedCount, date: new Date().toISOString() });
      } catch (error) {
        alert('❌ خطأ في قراءة الملف. تأكد من أنه ملف JSON صالح.');
      }
      setLoading(false);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearAllData = () => {
    if (window.confirm('⚠️ تحذير: هذا الإجراء سيمسح جميع البيانات نهائياً! هل أنت متأكد؟')) {
      if (window.confirm('تأكيد نهائي: هل تريد حقاً حذف كل شيء؟')) {
        storageKeys.forEach(key => {
          localStorage.removeItem(key);
        });
        alert('🗑️ تم مسح جميع البيانات. سيتم إعادة تحميل الصفحة.');
        window.location.reload();
      }
    }
  };

  const getStorageSize = () => {
    let total = 0;
    storageKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) total += data.length;
    });
    return (total / 1024).toFixed(2);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FaDatabase className="text-purple-400" /> النسخ الاحتياطي
        </h2>
        <div className="text-gray-400 text-sm">
          حجم البيانات: {getStorageSize()} KB
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* تصدير البيانات */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaFileExport className="text-green-400 text-2xl" />
            <h3 className="text-white text-lg font-bold">تصدير البيانات</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            قم بتصدير جميع بيانات المنصة إلى ملف JSON للاحتفاظ بنسخة احتياطية.
          </p>
          <div className="space-y-3">
            <button 
              onClick={exportAllData} 
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <FaDownload /> تصدير جميع البيانات
            </button>
          </div>
        </div>

        {/* استيراد البيانات */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaFileImport className="text-blue-400 text-2xl" />
            <h3 className="text-white text-lg font-bold">استيراد البيانات</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            قم باستيراد بيانات من ملف نسخ احتياطي سابق.
          </p>
          <label className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer">
            <FaUpload /> استيراد ملف JSON
            <input type="file" accept=".json" onChange={importData} className="hidden" />
          </label>
        </div>

        {/* حذف البيانات */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaTrash className="text-red-400 text-2xl" />
            <h3 className="text-white text-lg font-bold">مسح البيانات</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            ⚠️ تحذير: هذا الإجراء سيمسح جميع البيانات نهائياً. تأكد من وجود نسخة احتياطية.
          </p>
          <button 
            onClick={clearAllData} 
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
          >
            <FaTrash /> مسح جميع البيانات
          </button>
        </div>

        {/* معلومات إضافية */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaShieldAlt className="text-purple-400 text-2xl" />
            <h3 className="text-white text-lg font-bold">نصائح هامة</h3>
          </div>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>• قم بعمل نسخة احتياطية قبل إجراء أي تغييرات كبيرة</li>
            <li>• يُنصح بعمل نسخة احتياطية أسبوعياً</li>
            <li>• يمكن استخدام ملفات JSON للترحيل بين الخوادم</li>
            <li>• تأكد من سلامة ملف الاستيراد قبل رفعه</li>
          </ul>
          {backupInfo && (
            <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
              <p className="text-green-400 text-xs">آخر استيراد: {new Date(backupInfo.date).toLocaleString()}</p>
              <p className="text-green-400 text-xs">عدد العناصر المستوردة: {backupInfo.importedCount}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBackup;