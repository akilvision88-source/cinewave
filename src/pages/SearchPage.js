// src/pages/SearchPage.js - بحث موحّد مع نفس تصميم الصفحات الأخرى
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  FaFilm, FaTv, FaSearch, FaStar, FaCalendarAlt, FaPlay,
  FaSpinner, FaClock, FaPlus, FaCheck, FaShareAlt,
  FaWhatsapp, FaFacebookF, FaTelegramPlane, FaTwitter, FaLink
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { moviesAPI, seriesAPI, searchAPI } from '../services/api';

// ============================================================
// ✅ إعدادات عامة
// ============================================================
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DEMO_POSTERS = [
  'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dnbOE6PY0QO7Lx9.jpg',
  'https://image.tmdb.org/t/p/w500/8V6mWEReuy4Of61Lnj5Xj704m8.jpg',
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
  const c = [it.release_date, it.first_air_date, it.air_date, it.releaseDate, it.year, it.release_year];
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
// 🎴 SearchResultCard
// ============================================================
const SearchResultCard = ({ item, type = 'movie', index = 0 }) => {
  const navigate = useNavigate();
  const hoverTimerRef = useRef(null);
  const shareRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const itemId = item.id || index;
  const [isFavorite, setIsFavorite] = useState(() => {
    try { return localStorage.getItem(`fav_${type}_${itemId}`) === 'true'; } catch { return false; }
  });

  const title = item.title_ar || item.titleAr || item.title || 'عنوان غير معروف';

  const meta = useMemo(() => {
    const rating = item.vote_average || item.rating || item.imdb_rating || null;
    const year = extractYear(item);
    const duration = item.runtime ? `${item.runtime} د` :
      (item.number_of_seasons ? `${item.number_of_seasons} مواسم` : null);
    let genres = [];
    if (Array.isArray(item.genres)) genres = item.genres.map(g => typeof g === 'string' ? g : g?.name).filter(Boolean);
    else if (typeof item.genre === 'string') genres = item.genre.split(',').map(s => s.trim()).filter(Boolean);
    else if (Array.isArray(item.genre)) genres = item.genre;
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

  const linkPath = type === 'series' ? `/series/${item.id}` : `/movie/${item.id}`;
  const watchPath = type === 'series' ? `/watch/series/${item.id}` : `/watch/${item.id}`;
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

  const toggleFav = (e) => { e.preventDefault(); e.stopPropagation(); const n = !isFavorite; setIsFavorite(n); try { localStorage.setItem(`fav_${type}_${itemId}`, String(n)); } catch {} };
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

        {/* السنة والتقييم — على الهاتف فقط */}
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
                  {meta.genres.length > 0 && (<span className="hidden sm:flex items-center gap-1.5">{meta.genres.map((g, i) => (<span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] text-gray-300 font-semibold">{g}</span>))}</span>)}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 pt-1">
                  <button type="button" onClick={goWatch} aria-label="تشغيل" className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-md sm:rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200 active:scale-95 shadow-md"><FaPlay className="text-[9px] sm:text-[11px] ml-0.5" /></button>
                  <button type="button" onClick={toggleFav} className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold border transition-all duration-200 active:scale-95 ${isFavorite ? 'bg-red-600 border-red-600 text-white' : 'bg-white/5 border-white/15 text-white hover:bg-white/10 hover:border-white/25'}`}>
                    {isFavorite ? <FaCheck className="text-[9px] sm:text-[10px]" /> : <FaPlus className="text-[9px] sm:text-[10px]" />}
                    <span className="hidden xs:inline">{isFavorite ? 'في القائمة' : 'إضافة'}</span>
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
// 🔍 SearchPage
// ============================================================
const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { language, t } = useLanguage();
  const [results, setResults] = useState({ movies: [], series: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults({ movies: [], series: [] });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const searchResults = await searchAPI.searchAll(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        try {
          const [movies, series] = await Promise.all([
            moviesAPI.search(query).catch(() => []),
            seriesAPI.search(query).catch(() => []),
          ]);
          setResults({ movies, series });
        } catch {
          setResults({ movies: [], series: [] });
        }
      } finally {
        setLoading(false);
      }
    };
    performSearch();
  }, [query]);

  const totalResults = results.movies.length + results.series.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1f242d]">
        <div className="text-center">
          <FaSpinner className="text-red-500 text-4xl animate-spin mx-auto mb-4" />
          <p className="text-gray-400">جاري البحث...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f242d] relative">
      {/* Hero */}
      <div className="relative h-[22vh] md:h-[28vh] w-full overflow-hidden bg-[#0d1015]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://image.tmdb.org/t/p/original/9l1eZiJHmhr5jIlthMdJN5WYoff.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f242d]/70 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1015]/85 via-[#0d1015]/50 to-[#0d1015]/85" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1015]/50 via-transparent to-transparent" />

        <div className="relative h-full w-full px-4 sm:px-8 md:px-12 lg:px-16 flex flex-col items-center justify-center text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center">
                <FaSearch className="text-red-500 text-lg sm:text-xl" />
              </div>
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-br from-white via-rose-100 to-red-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(220,38,38,0.5)]">
                البحث
              </h1>
            </div>
            <div className="w-20 sm:w-28 h-0.5 sm:h-1 rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent mb-2 sm:mb-3 shadow-lg shadow-red-500/50" />
            <p className="text-gray-200 text-xs xs:text-sm sm:text-base max-w-xl leading-relaxed drop-shadow-lg">
              نتائج البحث عن: <span className="text-red-400 font-bold">"{query}"</span>
            </p>
            <p className="text-gray-400 text-xs mt-1">{totalResults} {t('search.results') || 'نتيجة'}</p>
          </motion.div>
        </div>
      </div>

      {/* فاصل أبيض */}
      <div className="relative w-full flex items-center justify-center py-4">
        <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/70 shadow-lg shadow-white/40" />
      </div>

      {/* Tabs */}
      {totalResults > 0 && (
        <div className="sticky top-0 z-30 bg-[#1f242d]/95 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/30">
          <div className="relative overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 py-3 px-4 sm:px-8 md:px-12 lg:px-16">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/40 scale-105'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                <span className="text-sm">🔍</span>
                <span>الكل ({totalResults})</span>
              </button>
              <button
                onClick={() => setActiveTab('movies')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'movies'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/40 scale-105'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                <FaFilm className="text-sm" />
                <span>أفلام ({results.movies.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('series')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'series'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/40 scale-105'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                <FaTv className="text-sm" />
                <span>مسلسلات ({results.series.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 py-6">
        {totalResults === 0 ? (
          <div className="text-center py-20 bg-white/[0.03] rounded-2xl border border-white/10">
            <FaSearch className="text-gray-600 text-6xl mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium mb-1">لم يتم العثور على نتائج لـ "{query}"</p>
            <p className="text-gray-500 text-sm">حاول استخدام كلمات مفتاحية أخرى</p>
          </div>
        ) : (
          <>
            {/* Movies */}
            {(activeTab === 'all' || activeTab === 'movies') && results.movies.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <FaFilm className="text-red-500 text-lg" />
                  </div>
                  <div>
                    <h2 className="text-white text-xl md:text-2xl font-black tracking-tight">أفلام</h2>
                    <div className="h-0.5 w-12 rounded-full bg-gradient-to-r from-red-500 to-rose-600 mt-1" />
                  </div>
                  <span className="text-gray-400 text-sm">({results.movies.length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
                  {results.movies.map((movie, i) => (
                    <SearchResultCard key={movie.id} item={movie} type="movie" index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Series */}
            {(activeTab === 'all' || activeTab === 'series') && results.series.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FaTv className="text-blue-500 text-lg" />
                  </div>
                  <div>
                    <h2 className="text-white text-xl md:text-2xl font-black tracking-tight">مسلسلات</h2>
                    <div className="h-0.5 w-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 mt-1" />
                  </div>
                  <span className="text-gray-400 text-sm">({results.series.length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
                  {results.series.map((serie, i) => (
                    <SearchResultCard key={serie.id} item={serie} type="series" index={i} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;