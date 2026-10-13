// src/pages/HistoryPage.js - سجل المشاهدة بنفس النمط الموحّد
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  FaHistory, FaFilm, FaTv, FaTrash, FaClock, FaPlay,
  FaCalendarAlt, FaStar, FaMusic, FaVideo, FaQuran, FaUser,
  FaMicrophoneAlt, FaSearch, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const HistoryPage = () => {
  const { language, t } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadHistory();
    const handleHistoryUpdate = () => loadHistory();
    window.addEventListener('historyUpdated', handleHistoryUpdate);
    return () => window.removeEventListener('historyUpdated', handleHistoryUpdate);
  }, []);

  const loadHistory = () => {
    const saved = localStorage.getItem('cinewave_watch_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      const sorted = parsed.sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
      setHistory(sorted);
    }
    setLoading(false);
  };

  const removeFromHistory = (id, type) => {
    const updated = history.filter(item => !(item.id === id && item.type === type));
    setHistory(updated);
    localStorage.setItem('cinewave_watch_history', JSON.stringify(updated));
    showNotification('✅ تم إزالة العنصر من السجل');
  };

  const clearAllHistory = () => {
    if (window.confirm('هل أنت متأكد من مسح كل سجل المشاهدة؟')) {
      setHistory([]);
      localStorage.setItem('cinewave_watch_history', JSON.stringify([]));
      showNotification('✅ تم مسح السجل بالكامل');
    }
  };

  const showNotification = (msg) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg text-sm z-50';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

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

  const getLink = (item) => {
    switch (item.type) {
      case 'movie': return `/movie/${item.id}`;
      case 'series': return `/series/${item.id}`;
      case 'clip': return `/clip/${item.id}`;
      case 'song': return `/song/${item.id}`;
      case 'quran': return `/quran/${item.id}`;
      case 'animation': return `/movie/${item.id}`;
      default: return `/movie/${item.id}`;
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'movie': return <FaFilm className="text-red-400" />;
      case 'series': return <FaTv className="text-blue-400" />;
      case 'clip': return <FaVideo className="text-emerald-400" />;
      case 'song': return <FaMusic className="text-pink-400" />;
      case 'quran': return <FaQuran className="text-amber-400" />;
      case 'animation': return <FaStar className="text-purple-400" />;
      default: return <FaHistory className="text-gray-400" />;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'movie': return 'فيلم';
      case 'series': return 'مسلسل';
      case 'clip': return 'كليب';
      case 'song': return 'أغنية';
      case 'quran': return 'قرآن';
      case 'animation': return 'رسوم متحركة';
      default: return 'محتوى';
    }
  };

  const filtered = history.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchTerm) {
      const title = (item.title || item.title_ar || item.name || '').toLowerCase();
      return title.includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const stats = {
    total: history.length,
    movie: history.filter(i => i.type === 'movie').length,
    series: history.filter(i => i.type === 'series').length,
    clip: history.filter(i => i.type === 'clip').length,
    song: history.filter(i => i.type === 'song').length,
    quran: history.filter(i => i.type === 'quran').length,
    animation: history.filter(i => i.type === 'animation').length,
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  if (loading) return <div className="flex justify-center items-center h-screen bg-[#1f242d]"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#1f242d] relative">
      {/* Hero */}
      <div className="relative h-[22vh] md:h-[28vh] w-full overflow-hidden bg-[#0d1015]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://image.tmdb.org/t/p/original/8b8R8l88Qje9dnbOE6PY0QO7Lx9.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f242d]/70 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1015]/85 via-[#0d1015]/50 to-[#0d1015]/85" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1015]/50 via-transparent to-transparent" />
        <div className="relative h-full w-full px-4 sm:px-8 md:px-12 lg:px-16 flex flex-col items-center justify-center text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center"><FaHistory className="text-red-500 text-lg sm:text-xl" /></div>
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-br from-white via-rose-100 to-red-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(220,38,38,0.5)]">سجل المشاهدة</h1>
            </div>
            <div className="w-20 sm:w-28 h-0.5 sm:h-1 rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent mb-2 sm:mb-3 shadow-lg shadow-red-500/50" />
            <p className="text-gray-200 text-xs xs:text-sm sm:text-base max-w-xl leading-relaxed drop-shadow-lg">جميع المحتوى الذي شاهدته مؤخراً</p>
          </motion.div>
        </div>
      </div>

      <div className="relative w-full flex items-center justify-center py-4">
        <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/70 shadow-lg shadow-white/40" />
      </div>

      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 py-6">
        {/* إحصائيات */}
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mb-6">
          {[
            { key: 'all', label: 'الكل', count: stats.total, icon: <FaHistory />, color: 'text-gray-300' },
            { key: 'movie', label: 'أفلام', count: stats.movie, icon: <FaFilm />, color: 'text-red-400' },
            { key: 'series', label: 'مسلسلات', count: stats.series, icon: <FaTv />, color: 'text-blue-400' },
            { key: 'clip', label: 'كليبات', count: stats.clip, icon: <FaVideo />, color: 'text-emerald-400' },
            { key: 'song', label: 'أغاني', count: stats.song, icon: <FaMusic />, color: 'text-pink-400' },
            { key: 'quran', label: 'قرآن', count: stats.quran, icon: <FaQuran />, color: 'text-amber-400' },
            { key: 'animation', label: 'رسوم', count: stats.animation, icon: <FaStar />, color: 'text-purple-400' },
          ].map((s) => (
            <button key={s.key} onClick={() => { setFilterType(s.key); setCurrentPage(1); }} className={`rounded-xl p-3 text-center transition-all duration-300 border ${filterType === s.key ? 'bg-white/10 border-white/30 scale-105' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'}`}>
              <div className={`text-lg mx-auto mb-1 ${s.color}`}>{s.icon}</div>
              <p className="text-white text-lg font-bold">{s.count}</p>
              <p className="text-gray-500 text-[10px]">{s.label}</p>
            </button>
          ))}
        </div>

        {/* بحث */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
            <input type="text" placeholder="بحث في السجل..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#21262d] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white focus:outline-none focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 text-sm transition-all" />
          </div>
          {history.length > 0 && (
            <button onClick={clearAllHistory} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/15 text-red-400 rounded-xl hover:bg-red-600/25 transition border border-red-500/30 text-sm font-bold">
              <FaTrash size={12} /> مسح الكل
            </button>
          )}
        </div>

        {/* السجل */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.03] rounded-2xl border border-white/10">
            <FaHistory className="text-gray-600 text-6xl mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium mb-1">لا يوجد سجل مشاهدة</p>
            <p className="text-gray-500 text-sm mb-4">ابدأ بمشاهدة بعض المحتوى!</p>
            <Link to="/" className="inline-block bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2 rounded-lg hover:scale-105 transition"><FaPlay className="inline mr-2" size={12} /> استكشف الآن</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((item, idx) => (
              <div key={`${item.type}_${item.id}_${idx}`} className="flex gap-4 bg-white/[0.03] rounded-2xl p-3 hover:bg-white/[0.06] transition-all duration-300 border border-white/5 hover:border-red-500/40 group">
                <Link to={getLink(item)} className="flex-shrink-0">
                  <img src={item.poster || item.thumbnail || 'https://via.placeholder.com/120x180/1a1a2e/ffffff?text=🎬'} alt={item.title} className="w-16 h-24 object-cover rounded-xl" onError={(e) => { e.target.src = 'https://via.placeholder.com/120x180/1a1a2e/ffffff?text=🎬'; }} />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <Link to={getLink(item)}><h3 className="text-white font-semibold text-sm group-hover:text-red-400 transition line-clamp-1">{item.title || item.title_ar}</h3></Link>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1">{getIcon(item.type)} {getTypeText(item.type)}</span>
                        {item.rating && (<><span className="w-1 h-1 bg-gray-600 rounded-full"></span><span className="flex items-center gap-1"><FaStar className="text-yellow-400 text-[10px]" />{item.rating}</span></>)}
                        {item.year && (<><span className="w-1 h-1 bg-gray-600 rounded-full"></span><span className="flex items-center gap-1"><FaCalendarAlt className="text-[10px]" />{item.year}</span></>)}
                      </div>
                    </div>
                    <button onClick={() => removeFromHistory(item.id, item.type)} className="p-2 text-gray-500 hover:text-red-400 transition flex-shrink-0" title="إزالة"><FaTrash size={12} /></button>
                  </div>
                  {item.progress > 0 && item.progress < 100 && (
                    <div className="mt-2">
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-600 to-rose-500" style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="text-gray-500 text-xs flex items-center gap-1"><FaClock size={10} /> {formatTime(item.watchedAt)}</span>
                    <Link to={getLink(item)} className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-3 py-1 rounded-lg text-xs hover:scale-105 transition flex items-center gap-1"><FaPlay size={9} /> {item.progress > 0 && item.progress < 100 ? 'متابعة' : 'مشاهدة'}</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`p-2.5 rounded-xl ${currentPage === 1 ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-white/5 text-white hover:bg-red-600'}`}><FaChevronRight size={14} /></button>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              let n;
              if (totalPages <= 5) n = i + 1;
              else if (currentPage <= 3) n = i + 1;
              else if (currentPage >= totalPages - 2) n = totalPages - 4 + i;
              else n = currentPage - 2 + i;
              return (
                <button key={i} onClick={() => setCurrentPage(n)} className={`w-10 h-10 rounded-xl text-sm font-medium ${currentPage === n ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{n}</button>
              );
            })}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`p-2.5 rounded-xl ${currentPage === totalPages ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-white/5 text-white hover:bg-red-600'}`}><FaChevronLeft size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;