// src/pages/MyListPage.js - قائمتي بنفس النمط الموحّد
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  FaPlay, FaTrash, FaFilm, FaTv, FaMusic, FaStar, FaEye, FaBookmark,
  FaSearch, FaTimes, FaTh, FaList, FaChevronLeft, FaChevronRight,
  FaExclamationTriangle, FaCalendarAlt, FaClock, FaPlus, FaCheck,
  FaShareAlt, FaWhatsapp, FaFacebookF, FaTelegramPlane, FaTwitter, FaLink,
  FaQuran, FaVideo
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { watchlistAPI } from '../services/api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DEMO_POSTERS = [
  'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dnbOE6PY0QO7Lx9.jpg',
  'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
  'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg',
  'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
];
const getDemoPoster = (i) => DEMO_POSTERS[i % DEMO_POSTERS.length];

const isValidThumbnail = (u) => {
  if (!u || typeof u !== 'string') return false;
  const t = u.trim();
  if (!t) return false;
  if (/placeholder\.com|via\.placeholder/i.test(t)) return false;
  return /^(https?:|\/|data:image\/)/i.test(t);
};
const fixUrl = (u) => {
  if (!u || typeof u !== 'string') return null;
  const t = u.trim();
  if (!t) return null;
  return t.startsWith('/') ? `${API_BASE}${t}` : t;
};
const extractYear = (it) => {
  if (!it) return null;
  const c = [it.release_date, it.first_air_date, it.air_date, it.year, it.release_year];
  for (const v of c) {
    if (!v) continue;
    const n = parseInt(v);
    if (!isNaN(n) && n >= 1900 && n <= 2100) return n;
    const d = new Date(v);
    const y = d.getFullYear();
    if (!isNaN(y) && y >= 1900 && y <= 2100) return y;
  }
  return null;
};

// ============================================================
// 🎴 WatchlistCard
// ============================================================
const WatchlistCard = ({ item, type = 'movie', index = 0, onRemove }) => {
  const navigate = useNavigate();
  const hoverTimerRef = useRef(null);
  const shareRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const itemId = item.item_id || item.id || index;
  const title = item.title_ar || item.titleAr || item.title || 'عنوان غير معروف';
  const realType = item.item_type || type;

  const meta = useMemo(() => {
    const rating = item.vote_average || item.rating || item.imdb_rating || null;
    const year = extractYear(item);
    const duration = item.runtime ? `${item.runtime} د` :
      (item.number_of_seasons ? `${item.number_of_seasons} مواسم` : null);
    let genres = [];
    if (Array.isArray(item.genres)) genres = item.genres.map(g => typeof g === 'string' ? g : g?.name).filter(Boolean);
    else if (typeof item.genre === 'string') genres = item.genre.split(',').map(s => s.trim()).filter(Boolean);
    return { rating, duration, year, genres: genres.slice(0, 2) };
  }, [item]);

  const posterSrc = useMemo(() => {
    const f = fixUrl(item.poster) || fixUrl(item.backdrop);
    return isValidThumbnail(f) ? f : getDemoPoster(index);
  }, [item, index]);
  const backdropSrc = useMemo(() => {
    const f = fixUrl(item.backdrop) || fixUrl(item.poster);
    return isValidThumbnail(f) ? f : getDemoPoster(index);
  }, [item, index]);

  const linkPath = realType === 'series' ? `/series/${itemId}` : `/movie/${itemId}`;
  const watchPath = realType === 'series' ? `/watch/series/${itemId}` : `/watch/${itemId}`;
  const shareUrl = useMemo(() => typeof window === 'undefined' ? '' : `${window.location.origin}${linkPath}`, [linkPath]);
  const shareText = useMemo(() => `شاهد "${title}" على موقعنا`, [title]);

  useEffect(() => {
    if (!showShare) return;
    const h = (e) => { if (shareRef.current && !shareRef.current.contains(e.target)) setShowShare(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showShare]);

  const onEnter = () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); hoverTimerRef.current = setTimeout(() => setIsHovered(true), 180); };
  const onLeave = () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); setIsHovered(false); setTimeout(() => { if (shareRef.current && !shareRef.current.matches(':hover')) setShowShare(false); }, 200); };
  useEffect(() => () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); }, []);

  const goWatch = (e) => { e.preventDefault(); e.stopPropagation(); navigate(watchPath); };

  const shareLinks = useMemo(() => {
    const u = encodeURIComponent(shareUrl), t = encodeURIComponent(shareText);
    return {
      whatsapp: `https://wa.me/?text=${t}%20${u}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      telegram: `https://t.me/share/url?url=${u}&text=${t}`,
      twitter: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    };
  }, [shareUrl, shareText]);
  const openShare = (p) => (e) => { e.preventDefault(); e.stopPropagation(); window.open(shareLinks[p], '_blank', 'noopener,noreferrer,width=600,height=500'); };
  const copyLink = async (e) => {
    e.preventDefault(); e.stopPropagation();
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { const ta = document.createElement('textarea'); ta.value = shareUrl; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  const handleRemove = (e) => { e.preventDefault(); e.stopPropagation(); onRemove(itemId, realType); };

  return (
    <div onMouseEnter={onEnter} onMouseLeave={onLeave} className="relative" style={{ zIndex: isHovered ? 40 : 1 }}>
      <motion.div animate={{ scale: isHovered ? 1.05 : 1, y: isHovered ? -4 : 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="origin-center" style={{ transformOrigin: 'center top' }}>
        <Link to={linkPath} className="block relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#151515] border border-white/5 hover:border-white/20 shadow-lg shadow-black/40 transition-colors duration-300">
          <div className="relative aspect-[2/3] sm:aspect-video overflow-hidden">
            <img src={posterSrc} alt={title} className="absolute inset-0 w-full h-full object-cover sm:hidden" loading="lazy" onError={(e) => { if (e.currentTarget.src !== getDemoPoster(index)) e.currentTarget.src = getDemoPoster(index); }} />
            <img src={backdropSrc} alt={title} className="absolute inset-0 w-full h-full object-cover hidden sm:block" loading="lazy" onError={(e) => { if (e.currentTarget.src !== getDemoPoster(index)) e.currentTarget.src = getDemoPoster(index); }} />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
          </div>
        </Link>

        <div className="flex items-center justify-between gap-1 mt-1.5 px-1 sm:hidden">
          {meta.year ? (<span className="text-gray-300 text-[10px] font-bold bg-white/5 px-1.5 py-0.5 rounded-md border border-white/10">{meta.year}</span>) : <span />}
          {meta.rating && (<span className="flex items-center gap-0.5 text-yellow-400 text-[10px] font-bold bg-black/40 px-1.5 py-0.5 rounded-md border border-yellow-500/30"><FaStar className="text-[8px]" />{Number(meta.rating).toFixed(1)}</span>)}
        </div>

        <AnimatePresence>
          {isHovered && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="overflow-visible border border-white/10 border-t-0 rounded-b-2xl sm:rounded-b-3xl -mt-2 shadow-2xl shadow-black/70 relative" style={{ backgroundColor: '#21262d' }}>
              <div className="p-2.5 sm:p-3.5 space-y-2 sm:space-y-3">
                <Link to={linkPath} className="block"><h3 className="text-white text-xs sm:text-sm font-bold line-clamp-1 hover:text-red-400 transition-colors">{title}</h3></Link>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-[10px] sm:text-[11px] text-gray-300 font-semibold">
                  {meta.rating && (<span className="flex items-center gap-0.5 sm:gap-1 text-yellow-400"><FaStar className="text-[9px] sm:text-[10px]" />{Number(meta.rating).toFixed(1)}</span>)}
                  {meta.duration && (<span className="flex items-center gap-0.5 sm:gap-1"><FaClock className="text-[9px] sm:text-[10px]" />{meta.duration}</span>)}
                  {meta.year && (<span className="flex items-center gap-0.5 sm:gap-1"><FaCalendarAlt className="text-[9px] sm:text-[10px]" />{meta.year}</span>)}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 pt-1">
                  <button type="button" onClick={goWatch} aria-label="تشغيل" className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-md sm:rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200 active:scale-95 shadow-md"><FaPlay className="text-[9px] sm:text-[11px] ml-0.5" /></button>
                  <button type="button" onClick={handleRemove} aria-label="إزالة" className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-md sm:rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white transition-all duration-200 active:scale-95">
                    <FaTrash className="text-[9px] sm:text-[11px]" />
                  </button>
                  <div className="relative" ref={shareRef}>
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowShare(s => !s); }} aria-label="مشاركة" className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-md sm:rounded-lg bg-white/5 border border-white/15 text-white hover:bg-white/10 hover:border-white/25 transition-all duration-200 active:scale-95"><FaShareAlt className="text-[9px] sm:text-[11px]" /></button>
                    <AnimatePresence>
                      {showShare && (
                        <motion.div initial={{ opacity: 0, y: 8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.9 }} transition={{ duration: 0.2 }} className="absolute bottom-10 sm:bottom-12 left-0 z-50 p-1.5 sm:p-2 rounded-xl border border-white/10 shadow-2xl shadow-black/80 flex items-center gap-1 sm:gap-1.5" style={{ backgroundColor: '#21262d' }} onClick={(e) => e.stopPropagation()}>
                          <button type="button" onClick={openShare('whatsapp')} aria-label="واتساب" className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-all duration-200 active:scale-90"><FaWhatsapp className="text-sm sm:text-base" /></button>
                          <button type="button" onClick={openShare('facebook')} aria-label="فيسبوك" className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-[#1877F2]/15 hover:bg-[#1877F2] text-[#1877F2] hover:text-white transition-all duration-200 active:scale-90"><FaFacebookF className="text-xs sm:text-sm" /></button>
                          <button type="button" onClick={openShare('telegram')} aria-label="تيليجرام" className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-[#229ED9]/15 hover:bg-[#229ED9] text-[#229ED9] hover:text-white transition-all duration-200 active:scale-90"><FaTelegramPlane className="text-xs sm:text-sm" /></button>
                          <button type="button" onClick={openShare('twitter')} aria-label="تويتر" className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white text-white hover:text-black transition-all duration-200 active:scale-90"><FaTwitter className="text-xs sm:text-sm" /></button>
                          <button type="button" onClick={copyLink} aria-label="نسخ" className={`w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg transition-all duration-200 active:scale-90 ${copied ? 'bg-emerald-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>{copied ? <FaCheck className="text-[10px] sm:text-xs" /> : <FaLink className="text-[10px] sm:text-xs" />}</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// ============================================================
// 🎬 MyListPage الرئيسي
// ============================================================
const MyListPage = () => {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('mylist_view_mode') || 'grid');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const itemsPerPage = 40;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const auth = localStorage.getItem('isAuthenticated') === 'true';
    if (!token || !auth) { navigate('/login'); return; }
    setIsAuthenticated(true);
    loadWatchlist();
  }, [navigate]);

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);

  const loadWatchlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const data = await watchlistAPI.getWatchlist();
      setWatchlist(data);
    } catch (error) {
      console.error('خطأ:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
        return;
      }
      setError(error.message || 'فشل تحميل القائمة');
      setWatchlist([]);
    } finally { setLoading(false); }
  };

  const removeFromWatchlist = async (itemId, itemType) => {
    try {
      await watchlistAPI.removeFromWatchlist(itemId, itemType);
      await loadWatchlist();
    } catch (error) {
      console.error('خطأ:', error);
    }
  };

  const getTypeLabel = (type) => {
    const labels = { movie: 'فيلم', series: 'مسلسل', clip: 'كليب', song: 'أغنية', quran: 'قرآن', animation: 'رسوم متحركة' };
    return labels[type] || 'محتوى';
  };

  const filtered = watchlist.filter(item => {
    if (filterType !== 'all' && item.item_type !== filterType) return false;
    if (searchTerm) {
      const title = (item.title || item.title_ar || '').toLowerCase();
      return title.includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const stats = {
    total: watchlist.length,
    movie: watchlist.filter(i => i.item_type === 'movie').length,
    series: watchlist.filter(i => i.item_type === 'series').length,
    clip: watchlist.filter(i => i.item_type === 'clip').length,
    song: watchlist.filter(i => i.item_type === 'song').length,
    quran: watchlist.filter(i => i.item_type === 'quran').length,
    animation: watchlist.filter(i => i.item_type === 'animation').length,
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const getPages = () => {
    const a = []; const mv = isMobile ? 3 : 5;
    let s = Math.max(1, currentPage - Math.floor(mv / 2));
    let e = Math.min(totalPages, s + mv - 1);
    if (e - s + 1 < mv) s = Math.max(1, e - mv + 1);
    for (let i = s; i <= e; i++) a.push(i);
    return a;
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-[#1f242d]"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!isAuthenticated) return <div className="flex justify-center items-center h-screen bg-[#1f242d]"><div className="text-center"><FaBookmark className="text-6xl mx-auto mb-4 text-gray-500 opacity-30" /><h3 className="text-white text-xl font-bold mb-2">يرجى تسجيل الدخول</h3><Link to="/login" className="inline-block bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2 rounded-lg">تسجيل الدخول</Link></div></div>;

  return (
    <div className="min-h-screen bg-[#1f242d] relative">
      {/* Hero */}
      <div className="relative h-[22vh] md:h-[28vh] w-full overflow-hidden bg-[#0d1015]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://image.tmdb.org/t/p/original/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f242d]/70 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1015]/85 via-[#0d1015]/50 to-[#0d1015]/85" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1015]/50 via-transparent to-transparent" />

        <div className="relative h-full w-full px-4 sm:px-8 md:px-12 lg:px-16 flex flex-col items-center justify-center text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center">
                <FaBookmark className="text-red-500 text-lg sm:text-xl" />
              </div>
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-br from-white via-rose-100 to-red-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(220,38,38,0.5)]">قائمتي</h1>
            </div>
            <div className="w-20 sm:w-28 h-0.5 sm:h-1 rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent mb-2 sm:mb-3 shadow-lg shadow-red-500/50" />
            <p className="text-gray-200 text-xs xs:text-sm sm:text-base max-w-xl leading-relaxed drop-shadow-lg">{stats.total} عنصر في قائمتك</p>
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
            { key: 'all', label: 'الكل', count: stats.total, icon: <FaBookmark />, color: 'text-gray-300' },
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

        {/* بحث + عرض */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
            <input type="text" placeholder="بحث في قائمتي..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full bg-[#21262d] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white focus:outline-none focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 text-sm transition-all" />
          </div>
          <div className={`flex ${isMobile ? 'justify-center' : ''} gap-2`}>
            <div className="flex gap-1 bg-[#21262d] rounded-xl p-1 border border-white/10">
              <button onClick={() => { setViewMode('grid'); localStorage.setItem('mylist_view_mode', 'grid'); }} className={`px-4 py-2 rounded-lg transition-all duration-300 text-sm flex items-center gap-2 ${viewMode === 'grid' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><FaTh size={14} /><span className="hidden sm:inline font-medium">شبكة</span></button>
              <button onClick={() => { setViewMode('list'); localStorage.setItem('mylist_view_mode', 'list'); }} className={`px-4 py-2 rounded-lg transition-all duration-300 text-sm flex items-center gap-2 ${viewMode === 'list' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><FaList size={14} /><span className="hidden sm:inline font-medium">قائمة</span></button>
            </div>
          </div>
        </div>

        {error && (<div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 mb-6 flex items-center justify-between"><div className="flex items-center gap-2 text-red-400 text-sm"><FaExclamationTriangle /> {error}</div><button onClick={loadWatchlist} className="text-white bg-red-600 px-4 py-1 rounded-lg text-sm">إعادة المحاولة</button></div>)}

        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.03] rounded-2xl border border-white/10">
            <FaBookmark className="text-gray-600 text-6xl mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium mb-1">{watchlist.length === 0 ? 'قائمتك فارغة' : 'لا توجد نتائج'}</p>
            <p className="text-gray-500 text-sm mb-4">{watchlist.length === 0 ? 'لم تقم بإضافة أي محتوى بعد' : 'حاول تعديل البحث'}</p>
            <Link to="/" className="inline-block bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2 rounded-lg hover:scale-105 transition">استكشف المحتوى</Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
            {paginated.map((item, i) => (<WatchlistCard key={item.id} item={item} index={i} onRemove={removeFromWatchlist} />))}
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((item) => (
              <Link key={item.id} to={item.item_type === 'series' ? `/series/${item.item_id}` : `/movie/${item.item_id}`} className="block group">
                <div className="flex gap-4 bg-white/[0.03] rounded-2xl p-3 hover:bg-white/[0.06] transition-all duration-300 border border-white/5 hover:border-red-500/40">
                  <div className="relative overflow-hidden rounded-xl flex-shrink-0">
                    <img src={item.poster || getDemoPoster(0)} alt={item.title} className="w-16 h-24 object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm group-hover:text-red-400 transition line-clamp-1">{item.title || item.title_ar}</h3>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-400 mt-1.5">
                      <span className="text-red-400">{getTypeLabel(item.item_type)}</span>
                      {item.rating > 0 && (<span className="flex items-center gap-1"><FaStar className="text-yellow-400 text-[10px]" />{item.rating}</span>)}
                    </div>
                    <div className="flex items-center gap-2 mt-2.5">
                      <button onClick={(e) => { e.preventDefault(); removeFromWatchlist(item.item_id, item.item_type); }} className="bg-red-600/20 border border-red-500/40 text-red-400 px-3 py-1 rounded-lg text-xs hover:bg-red-600 hover:text-white transition flex items-center gap-1"><FaTrash size={9} />إزالة</button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`p-2.5 rounded-xl ${currentPage === 1 ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-white/5 text-white hover:bg-red-600'}`}><FaChevronRight size={14} /></button>
            {getPages().map(n => (<button key={n} onClick={() => setCurrentPage(n)} className={`w-10 h-10 rounded-xl text-sm font-medium ${currentPage === n ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{n}</button>))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`p-2.5 rounded-xl ${currentPage === totalPages ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-white/5 text-white hover:bg-red-600'}`}><FaChevronLeft size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyListPage;