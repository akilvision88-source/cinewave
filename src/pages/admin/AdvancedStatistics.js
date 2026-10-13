// src/pages/admin/AdvancedStatistics.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaChartLine, FaDownload, FaEye, FaUsers, 
  FaFilm, FaMusic, FaTv, FaChartBar,
  FaSyncAlt, FaUser, FaPlay, FaHeart, FaComment,
  FaBookmark, FaServer, FaDatabase,
  FaQuran, FaBook, FaVideo
} from 'react-icons/fa';
import { statisticsAPI } from '../../services/api';

const AdvancedStatistics = () => {
  const [dateRange, setDateRange] = useState('month');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewsData, setViewsData] = useState([]);

  // ========== LOAD DATA ==========
  const loadAllStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await statisticsAPI.getFullStatistics();
      setStats(data);
      console.log('✅ تم تحميل الإحصائيات الدقيقة:', data);

      const views = await statisticsAPI.getViewsByPeriod(dateRange);
      setViewsData(views);
      console.log('✅ تم تحميل مشاهدات الفترة:', views.length);

    } catch (error) {
      console.error('❌ خطأ في تحميل الإحصائيات:', error);
      setError(error.message || 'فشل في تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadAllStats();
  }, [loadAllStats]);

  // ========== EXPORT FUNCTIONS ==========
  const exportToCSV = () => {
    if (!stats) return;
    
    const data = {
      'إحصائيات المحتوى': stats.content,
      'إحصائيات المستخدمين': stats.users,
      'إحصائيات التفاعل': stats.interaction,
      'المشاهدات': stats.views
    };
    
    let csv = 'البيان,القيمة\n';
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (typeof subValue !== 'object') {
            csv += `${key} - ${subKey},${subValue}\n`;
          }
        });
      }
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistics_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    if (!stats) return;
    const data = {
      exportedAt: new Date().toISOString(),
      dateRange: dateRange,
      statistics: stats,
      viewsData: viewsData
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistics_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ========== FORMAT SIZE ==========
  const formatSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ========== LOADING ==========
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل الإحصائيات الدقيقة...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 text-center">
        <div className="text-red-400 text-4xl mb-4">⚠️</div>
        <h3 className="text-white text-xl font-bold mb-2">حدث خطأ</h3>
        <p className="text-gray-400">{error}</p>
        <button 
          onClick={loadAllStats} 
          className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 text-center">
        <div className="text-gray-500 text-4xl mb-4">📊</div>
        <h3 className="text-white text-xl font-bold mb-2">لا توجد بيانات</h3>
        <p className="text-gray-400">لم يتم العثور على إحصائيات</p>
      </div>
    );
  }

  const { content, users, interaction, views, ratings, database_size } = stats;

  return (
    <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
      {/* ====== HEADER ====== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <FaChartLine className="text-purple-400" /> إحصائيات دقيقة
          <span className="text-sm text-gray-500 font-normal">
            (آخر تحديث: {new Date(stats.last_updated).toLocaleString()})
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)} 
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="week">📅 آخر 7 أيام</option>
            <option value="month">📅 آخر 30 يوماً</option>
            <option value="year">📅 آخر سنة</option>
          </select>
          <button 
            onClick={loadAllStats} 
            className="bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition text-sm flex items-center gap-1"
            title="تحديث"
          >
            <FaSyncAlt className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="flex gap-1">
            <button onClick={exportToCSV} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700 transition">
              <FaDownload size={12} /> CSV
            </button>
            <button onClick={exportToJSON} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700 transition">
              <FaDownload size={12} /> JSON
            </button>
          </div>
        </div>
      </div>

      {/* ====== MAIN STATS CARDS ====== */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-purple-400 text-2xl mb-1">👁️</div>
          <p className="text-gray-500 text-xs">إجمالي المشاهدات</p>
          <p className="text-white text-xl sm:text-2xl font-bold">{views.total.toLocaleString()}</p>
          <p className="text-green-400 text-xs">{views.daily?.length || 0} يوم مسجل</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-blue-400 text-2xl mb-1">👥</div>
          <p className="text-gray-500 text-xs">المستخدمين النشطين</p>
          <p className="text-white text-xl sm:text-2xl font-bold">{users.active.toLocaleString()}</p>
          <p className="text-gray-500 text-xs">من {users.total} إجمالي</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-yellow-400 text-2xl mb-1">⭐</div>
          <p className="text-gray-500 text-xs">المستخدمين المميزين</p>
          <p className="text-white text-xl sm:text-2xl font-bold">{users.premium.toLocaleString()}</p>
          <p className="text-gray-500 text-xs">{(users.premium / users.total * 100 || 0).toFixed(1)}% من الإجمالي</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-green-400 text-2xl mb-1">💾</div>
          <p className="text-gray-500 text-xs">حجم قاعدة البيانات</p>
          <p className="text-white text-xl sm:text-2xl font-bold">{formatSize(database_size)}</p>
          <p className="text-gray-500 text-xs">{Object.keys(content).length} جداول</p>
        </div>
      </div>

      {/* ====== CONTENT STATS ====== */}
      <h3 className="text-white text-sm font-bold mb-3 flex items-center gap-2">
        <FaDatabase className="text-purple-400" /> إحصائيات المحتوى
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-6">
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <FaFilm className="text-purple-400 text-lg mx-auto" />
          <p className="text-gray-500 text-[10px]">أفلام</p>
          <p className="text-white font-bold">{content.movies}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <FaTv className="text-blue-400 text-lg mx-auto" />
          <p className="text-gray-500 text-[10px]">مسلسلات</p>
          <p className="text-white font-bold">{content.series}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <FaPlay className="text-yellow-400 text-lg mx-auto" />
          <p className="text-gray-500 text-[10px]">حلقات</p>
          <p className="text-white font-bold">{content.episodes}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <FaMusic className="text-pink-400 text-lg mx-auto" />
          <p className="text-gray-500 text-[10px]">أغاني</p>
          <p className="text-white font-bold">{content.songs}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <FaUser className="text-green-400 text-lg mx-auto" />
          <p className="text-gray-500 text-[10px]">فنانين</p>
          <p className="text-white font-bold">{content.artists}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <FaQuran className="text-emerald-400 text-lg mx-auto" />
          <p className="text-gray-500 text-[10px]">قراء</p>
          <p className="text-white font-bold">{content.reciters}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <FaBook className="text-indigo-400 text-lg mx-auto" />
          <p className="text-gray-500 text-[10px]">سور</p>
          <p className="text-white font-bold">{content.surahs}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <FaTv className="text-red-400 text-lg mx-auto" />
          <p className="text-gray-500 text-[10px]">قنوات</p>
          <p className="text-white font-bold">{content.channels}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <FaVideo className="text-orange-400 text-lg mx-auto" />
          <p className="text-gray-500 text-[10px]">كليبات</p>
          <p className="text-white font-bold">{content.clips}</p>
        </div>
      </div>

      {/* ====== USER STATS ====== */}
      <h3 className="text-white text-sm font-bold mb-3 flex items-center gap-2">
        <FaUsers className="text-blue-400" /> إحصائيات المستخدمين
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-6">
        <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
          <p className="text-gray-500 text-xs">👥 إجمالي</p>
          <p className="text-white text-lg font-bold">{users.total}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center border border-green-700">
          <p className="text-gray-500 text-xs">✅ نشطين</p>
          <p className="text-green-400 text-lg font-bold">{users.active}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center border border-red-700">
          <p className="text-gray-500 text-xs">🚫 محظورين</p>
          <p className="text-red-400 text-lg font-bold">{users.banned}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center border border-yellow-700">
          <p className="text-gray-500 text-xs">⭐ مميزين</p>
          <p className="text-yellow-400 text-lg font-bold">{users.premium}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center border border-blue-700">
          <p className="text-gray-500 text-xs">📋 ستاندرد</p>
          <p className="text-blue-400 text-lg font-bold">{users.standard}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
          <p className="text-gray-500 text-xs">🆓 مجاني</p>
          <p className="text-gray-400 text-lg font-bold">{users.free}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center border border-purple-700">
          <p className="text-gray-500 text-xs">🛡️ مشرفين</p>
          <p className="text-purple-400 text-lg font-bold">{users.admin}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
          <p className="text-gray-500 text-xs">📊 نسبة المميزين</p>
          <p className="text-yellow-400 text-lg font-bold">{(users.premium / users.total * 100 || 0).toFixed(1)}%</p>
        </div>
      </div>

      {/* ====== INTERACTION STATS ====== */}
      <h3 className="text-white text-sm font-bold mb-3 flex items-center gap-2">
        <FaHeart className="text-red-400" /> إحصائيات التفاعل
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
          <FaComment className="text-blue-400 text-lg mx-auto" />
          <p className="text-gray-500 text-xs">تعليقات</p>
          <p className="text-white text-lg font-bold">{interaction.comments}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
          <FaHeart className="text-red-400 text-lg mx-auto" />
          <p className="text-gray-500 text-xs">إعجابات</p>
          <p className="text-white text-lg font-bold">{interaction.likes}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
          <FaBookmark className="text-yellow-400 text-lg mx-auto" />
          <p className="text-gray-500 text-xs">مفضلة</p>
          <p className="text-white text-lg font-bold">{interaction.favorites}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
          <FaEye className="text-purple-400 text-lg mx-auto" />
          <p className="text-gray-500 text-xs">سجل المشاهدة</p>
          <p className="text-white text-lg font-bold">{interaction.watch_history}</p>
        </div>
      </div>

      {/* ====== RATINGS ====== */}
      {ratings && (
        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-gray-500 text-xs">⭐ متوسط التقييم</p>
              <p className="text-yellow-400 text-2xl font-bold">{ratings.average.toFixed(1)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs">عدد التقييمات</p>
              <p className="text-white text-xl font-bold">{ratings.total}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs">متوسط التقدم</p>
              <p className="text-blue-400 text-xl font-bold">{stats.avg_progress?.toFixed(1) || 0}%</p>
            </div>
          </div>
        </div>
      )}

      {/* ====== TOP CONTENT ====== */}
      <div className="grid md:grid-cols-2 gap-4">
        {views.movies && views.movies.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-4">
            <h4 className="text-white text-sm font-bold mb-3 flex items-center gap-2">
              <FaFilm className="text-purple-400" /> أعلى أفلام مشاهدة
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {views.movies.slice(0, 5).map((movie, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-yellow-400 text-sm font-bold w-5">#{idx + 1}</span>
                    <span className="text-white text-sm truncate">{movie.title || movie.title_ar}</span>
                  </div>
                  <span className="text-purple-400 text-sm font-bold flex-shrink-0">
                    {movie.views || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {views.series && views.series.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-4">
            <h4 className="text-white text-sm font-bold mb-3 flex items-center gap-2">
              <FaTv className="text-blue-400" /> أعلى مسلسلات مشاهدة
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {views.series.slice(0, 5).map((series, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-yellow-400 text-sm font-bold w-5">#{idx + 1}</span>
                    <span className="text-white text-sm truncate">{series.title || series.title_ar}</span>
                  </div>
                  <span className="text-purple-400 text-sm font-bold flex-shrink-0">
                    {series.views || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ====== VIEWS BY TYPE ====== */}
      {views.by_type && views.by_type.length > 0 && (
        <div className="mt-4 bg-gray-800 rounded-xl p-4">
          <h4 className="text-white text-sm font-bold mb-3 flex items-center gap-2">
            <FaChartBar className="text-green-400" /> توزيع المشاهدات حسب النوع
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {views.by_type.map((item, idx) => (
              <div key={idx} className="text-center p-2 bg-gray-700/30 rounded-lg">
                <p className="text-gray-400 text-xs">
                  {item.item_type === 'movie' ? '🎬 فيلم' :
                   item.item_type === 'series' ? '📺 مسلسل' :
                   item.item_type === 'song' ? '🎵 أغنية' :
                   item.item_type === 'clip' ? '🎬 كليب' :
                   item.item_type === 'quran' ? '🕌 قرآن' : item.item_type}
                </p>
                <p className="text-white font-bold">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====== DATABASE INFO ====== */}
      <div className="mt-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
        <h4 className="text-white text-sm font-bold mb-2 flex items-center gap-2">
          <FaServer className="text-purple-400" /> معلومات قاعدة البيانات
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-gray-500 text-xs">📊 إجمالي السجلات</p>
            <p className="text-white font-bold">
              {Object.values(content).reduce((a, b) => a + b, 0) + 
               users.total + interaction.comments + interaction.likes + interaction.favorites + interaction.watch_history}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-xs">💾 حجم البيانات</p>
            <p className="text-white font-bold">{formatSize(database_size)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-xs">📋 عدد الجداول</p>
            <p className="text-white font-bold">14</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-xs">🔄 آخر تحديث</p>
            <p className="text-white font-bold text-xs">{new Date(stats.last_updated).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedStatistics;