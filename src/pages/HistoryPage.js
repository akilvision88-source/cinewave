// src/pages/HistoryPage.js - نسخة كاملة لجميع أنواع المحتوى
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { 
  FaHistory, FaFilm, FaTv, FaTrash, FaClock, FaPlay, FaEye, 
  FaCalendarAlt, FaStar, FaMusic, FaVideo, FaQuran, FaUser, 
  FaHeadphones, FaMicrophoneAlt, FaBookOpen
} from 'react-icons/fa';
import { moviesAPI, seriesAPI, clipsAPI, songsAPI, recitersAPI } from '../services/api';

const HistoryPage = () => {
  const { language, t } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // تحميل سجل المشاهدة من localStorage
  useEffect(() => {
    loadHistory();
    
    // الاستماع للتحديثات
    const handleHistoryUpdate = () => loadHistory();
    window.addEventListener('historyUpdated', handleHistoryUpdate);
    
    return () => {
      window.removeEventListener('historyUpdated', handleHistoryUpdate);
    };
  }, []);

  const loadHistory = () => {
    const savedHistory = localStorage.getItem('cinewave_watch_history');
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      // ترتيب حسب تاريخ المشاهدة (الأحدث أولاً)
      const sortedHistory = parsedHistory.sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
      setHistory(sortedHistory);
    }
    setLoading(false);
  };

  // إزالة عنصر من السجل
  const removeFromHistory = (id, type) => {
    const updatedHistory = history.filter(item => !(item.id === id && item.type === type));
    setHistory(updatedHistory);
    localStorage.setItem('cinewave_watch_history', JSON.stringify(updatedHistory));
    
    showNotification('تم إزالة العنصر من سجل المشاهدة', 'success');
  };

  // مسح كل السجل
  const clearAllHistory = () => {
    if (window.confirm('هل أنت متأكد من مسح كل سجل المشاهدة؟')) {
      setHistory([]);
      localStorage.setItem('cinewave_watch_history', JSON.stringify([]));
      showNotification('تم مسح سجل المشاهدة بالكامل', 'success');
    }
  };

  const showNotification = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-fadeIn`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // فلترة السجل حسب النوع والبحث
  const filteredHistory = history.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchTerm) {
      const title = item.title || item.title_ar || item.name || '';
      return title.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  // إحصائيات
  const stats = {
    total: history.length,
    movies: history.filter(i => i.type === 'movie').length,
    series: history.filter(i => i.type === 'series').length,
    clips: history.filter(i => i.type === 'clip').length,
    songs: history.filter(i => i.type === 'song').length,
    quran: history.filter(i => i.type === 'quran').length,
    animation: history.filter(i => i.type === 'animation').length
  };

  // تنسيق الوقت
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return date.toLocaleDateString('ar-EG');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="relative h-[25vh] md:h-[30vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-cover bg-center" style={{ 
          backgroundImage: 'url(https://image.tmdb.org/t/p/original/8b8R8l88Qje9dnbOE6PY0QO7Lx9.jpg)',
          filter: 'brightness(0.4)'
        }} />
        <div className="relative h-full w-full px-3 sm:px-4 md:px-6 lg:px-8 flex flex-col justify-center z-20">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FaHistory className="text-red-500 text-2xl md:text-3xl" />
                <h1 className="text-2xl md:text-3xl font-bold text-white">سجل المشاهدة</h1>
              </div>
              <p className="text-gray-300 text-xs sm:text-sm max-w-2xl">
                سجل بجميع المحتويات التي قمت بمشاهدتها (أفلام، مسلسلات، كليبات، أغاني، قرآن)
              </p>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearAllHistory}
                className="flex items-center gap-2 px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition text-sm"
              >
                <FaTrash className="text-sm" />
                <span className="hidden sm:inline">مسح الكل</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="بحث في سجل المشاهدة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-red-500 text-sm"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-6">
          <StatCard label="الكل" count={stats.total} icon={FaHistory} color="gray" />
          <StatCard label="أفلام" count={stats.movies} icon={FaFilm} color="purple" />
          <StatCard label="مسلسلات" count={stats.series} icon={FaTv} color="blue" />
          <StatCard label="كليبات" count={stats.clips} icon={FaVideo} color="red" />
          <StatCard label="أغاني" count={stats.songs} icon={FaMusic} color="green" />
          <StatCard label="القرآن" count={stats.quran} icon={FaQuran} color="emerald" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-800 pb-4">
          <FilterButton label="الكل" value="all" active={filterType === 'all'} count={stats.total} onClick={() => setFilterType('all')} />
          <FilterButton label="أفلام" value="movie" active={filterType === 'movie'} count={stats.movies} icon={FaFilm} onClick={() => setFilterType('movie')} />
          <FilterButton label="مسلسلات" value="series" active={filterType === 'series'} count={stats.series} icon={FaTv} onClick={() => setFilterType('series')} />
          <FilterButton label="كليبات" value="clip" active={filterType === 'clip'} count={stats.clips} icon={FaVideo} onClick={() => setFilterType('clip')} />
          <FilterButton label="أغاني" value="song" active={filterType === 'song'} count={stats.songs} icon={FaMusic} onClick={() => setFilterType('song')} />
          <FilterButton label="القرآن" value="quran" active={filterType === 'quran'} count={stats.quran} icon={FaQuran} onClick={() => setFilterType('quran')} />
          <FilterButton label="رسوم متحركة" value="animation" active={filterType === 'animation'} count={stats.animation} icon={FaStar} onClick={() => setFilterType('animation')} />
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/30 rounded-xl">
            <FaHistory className="text-gray-700 text-6xl mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">لا يوجد سجل مشاهدة</h2>
            <p className="text-gray-400 mb-6">سجل المشاهدة فارغ. ابدأ بمشاهدة بعض المحتويات!</p>
            <Link to="/" className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition inline-flex items-center gap-2">
              <FaPlay className="text-sm" /> استكشف الآن
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item, index) => (
              <HistoryItem 
                key={`${item.type}_${item.id}_${index}`}
                item={item}
                onRemove={removeFromHistory}
                formatTime={formatTime}
                language={language}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// مكون بطاقة الإحصائيات
const StatCard = ({ label, count, icon: Icon, color }) => {
  const colors = {
    gray: 'bg-gray-800 text-gray-400',
    purple: 'bg-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/20 text-blue-400',
    red: 'bg-red-500/20 text-red-400',
    green: 'bg-green-500/20 text-green-400',
    emerald: 'bg-emerald-500/20 text-emerald-400'
  };
  
  return (
    <div className={`${colors[color]} rounded-xl p-2 text-center`}>
      <Icon className="text-lg mx-auto mb-0.5" />
      <p className="text-lg font-bold">{count}</p>
      <p className="text-[10px]">{label}</p>
    </div>
  );
};

// مكون زر الفلترة
const FilterButton = ({ label, value, active, count, icon: Icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm transition ${
        active 
          ? 'bg-red-600 text-white' 
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      {Icon && <Icon className="text-xs" />}
      <span>{label}</span>
      <span className={`text-[10px] px-1 rounded-full ${active ? 'bg-white/20' : 'bg-gray-700'}`}>
        {count}
      </span>
    </button>
  );
};

// مكون عنصر السجل (يدعم جميع الأنواع)
const HistoryItem = ({ item, onRemove, formatTime, language }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const getLink = () => {
    switch(item.type) {
      case 'movie': return `/movie/${item.id}`;
      case 'series': return `/series/${item.id}`;
      case 'clip': return `/clips/artist/${item.artist_id}`;
      case 'song': return `/songs/artist/${item.artist_id}`;
      case 'quran': return `/quran/reciter/${item.reciter_id}`;
      default: return `/movie/${item.id}`;
    }
  };

  const getIcon = () => {
    switch(item.type) {
      case 'movie': return <FaFilm className="text-purple-400" />;
      case 'series': return <FaTv className="text-blue-400" />;
      case 'clip': return <FaVideo className="text-red-400" />;
      case 'song': return <FaMusic className="text-green-400" />;
      case 'quran': return <FaQuran className="text-emerald-400" />;
      default: return <FaHistory className="text-gray-400" />;
    }
  };

  const getTypeText = () => {
    switch(item.type) {
      case 'movie': return 'فيلم';
      case 'series': return 'مسلسل';
      case 'clip': return 'كليب';
      case 'song': return 'أغنية';
      case 'quran': return 'سورة قرآنية';
      default: return 'محتوى';
    }
  };

  const getTitle = () => {
    if (language === 'ar') return item.title_ar || item.title || item.name;
    return item.title || item.name;
  };

  return (
    <div 
      className="bg-gray-900/50 rounded-xl hover:bg-gray-800 transition border border-gray-800 hover:border-red-500/30 overflow-hidden"
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      <div className="flex gap-3 p-3">
        {/* Poster / Thumbnail */}
        <Link to={getLink()} className="flex-shrink-0">
          <img 
            src={item.poster || item.thumbnail || item.cover_image || 'https://via.placeholder.com/120x180?text=No+Image'} 
            alt={getTitle()} 
            className="w-16 h-24 object-cover rounded-lg"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/120x180?text=No+Image'; }}
          />
        </Link>
        
        {/* Info */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <Link to={getLink()}>
                <h3 className="text-white font-semibold text-base hover:text-red-500 transition line-clamp-1">
                  {getTitle()}
                </h3>
              </Link>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                <span className="flex items-center gap-1">
                  {getIcon()}
                  {getTypeText()}
                </span>
                {item.artist_name && (
                  <>
                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                    <span className="flex items-center gap-0.5">
                      <FaMicrophoneAlt className="text-[10px]" />
                      {item.artist_name}
                    </span>
                  </>
                )}
                {item.reciter_name && (
                  <>
                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                    <span className="flex items-center gap-0.5">
                      <FaUser className="text-[10px]" />
                      {item.reciter_name}
                    </span>
                  </>
                )}
                {item.rating && (
                  <>
                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                    <span className="flex items-center gap-0.5">
                      <FaStar className="text-yellow-400 text-[10px]" />
                      {item.rating}
                    </span>
                  </>
                )}
                {item.year && (
                  <>
                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                    <span className="flex items-center gap-0.5">
                      <FaCalendarAlt className="text-[10px]" />
                      {item.year}
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => onRemove(item.id, item.type)}
              className="p-2 text-gray-400 hover:text-red-400 transition"
              title="إزالة من السجل"
            >
              <FaTrash className="text-sm" />
            </button>
          </div>
          
          {/* Progress Bar */}
          {item.progress && item.progress > 0 && item.progress < 100 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                <span>تقدم المشاهدة</span>
                <span>{Math.round(item.progress)}%</span>
              </div>
              <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Watch Time */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <FaClock className="text-[10px]" />
            <span>آخر مشاهدة: {formatTime(item.watchedAt)}</span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            <Link 
              to={getLink()} 
              className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-700 transition flex items-center gap-1"
            >
              <FaPlay className="text-[10px]" /> 
              {item.progress > 0 && item.progress < 100 ? 'متابعة' : 'مشاهدة'}
            </Link>
            {item.type !== 'clip' && item.type !== 'song' && item.type !== 'quran' && (
              <Link 
                to={`/${item.type}/${item.id}`} 
                className="bg-gray-700 text-white px-3 py-1 rounded-lg text-xs hover:bg-gray-600 transition"
              >
                تفاصيل
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Extended Details on Hover */}
      {showDetails && item.description && (
        <div className="px-3 pb-3 pt-0 border-t border-gray-800/50 mt-1">
          <p className="text-gray-400 text-xs line-clamp-2">{item.description}</p>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;