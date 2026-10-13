// src/pages/AnimationPage.js - رسوم متحركة بنفس النمط الموحّد
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  FaStar, FaSearch, FaFilm, FaTv, FaCalendarAlt, FaTh, FaList,
  FaChevronLeft, FaChevronRight, FaPlay, FaClock, FaPlus, FaCheck,
  FaShareAlt, FaWhatsapp, FaFacebookF, FaTelegramPlane, FaTwitter, FaLink
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { moviesAPI, seriesAPI } from '../services/api';

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
// 🎴 AnimationCard
// ============================================================
const AnimationCard = ({ item, type = 'movie', index = 0 }) => {
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
// 📋 AnimationListItem
// ============================================================
const AnimationListItem = ({ item, type = 'movie' }) => {
  const title = item.title_ar || item.titleAr || item.title || 'بدون عنوان';
  const rating = item.vote_average || item.rating || item.imdb_rating || '?';
  const year = extractYear(item) || '';
  const imageSrc = (() => { const f = fixUrl(item.poster) || fixUrl(item.backdrop); return isValidThumbnail(f) ? f : getDemoPoster(0); })();
  const linkPath = type === 'series' ? `/series/${item.id}` : `/movie/${item.id}`;
  return (
    <Link to={linkPath} className="block group">
      <div className="flex gap-4 bg-white/[0.03] rounded-2xl p-3 hover:bg-white/[0.06] transition-all duration-300 border border-white/5 hover:border-red-500/40">
        <div className="relative overflow-hidden rounded-xl flex-shrink-0">
          <img src={imageSrc} alt={title} className="w-16 h-24 object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"><div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center"><FaPlay className="text-white text-sm ml-0.5" /></div></div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm group-hover:text-red-400 transition-colors line-clamp-1">{title}</h3>
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-400 mt-1.5">
            <span className="flex items-center gap-1"><FaStar className="text-yellow-400 text-[10px]" />{rating}/10</span>
            {year && <span className="flex items-center gap-1"><FaCalendarAlt className="text-[10px]" />{year}</span>}
            {item.genre && <span className="text-gray-500">{item.genre}</span>}
          </div>
          <p className="text-gray-500 text-xs mt-2 line-clamp-1">{item.description || 'لا يوجد وصف متاح'}</p>
          <div className="flex items-center gap-2 mt-2.5"><button className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-1 rounded-lg text-xs shadow-lg shadow-red-600/20 flex items-center gap-1.5"><FaPlay size={10} />مشاهدة</button></div>
        </div>
      </div>
    </Link>
  );
};

// ============================================================
// 🎬 المكوّن الرئيسي
// ============================================================
const AnimationPage = () => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('animation_view_mode') === 'list' ? 'list' : 'grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(40);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const movieGenres = ['all', 'Animation', 'Family', 'Adventure', 'Comedy', 'Fantasy', 'Action', 'Musical', 'Drama', 'Science-Fiction'];
  const seriesGenres = ['all', 'Animation', 'Family', 'Adventure', 'Comedy', 'Fantasy', 'Action', 'Drama', 'Kids'];
  const years = ['all', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010'];

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [moviesData, seriesData] = await Promise.all([
          moviesAPI.getByCategory('animation').catch(() => []),
          seriesAPI.getByCategory('animation').catch(() => []),
        ]);
        const sortedMovies = [...moviesData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const sortedSeries = [...seriesData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setMovies(sortedMovies); setFilteredMovies(sortedMovies);
        setSeries(sortedSeries); setFilteredSeries(sortedSeries);
      } catch (e) { console.error(e); setMovies([]); setSeries([]); setFilteredMovies([]); setFilteredSeries([]); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    if (activeTab === 'movies') {
      let r = [...movies];
      if (searchTerm) r = r.filter(m => m.title?.toLowerCase().includes(searchTerm.toLowerCase()) || (m.title_ar && m.title_ar.includes(searchTerm)));
      if (selectedGenre !== 'all') r = r.filter(m => m.genre === selectedGenre);
      if (selectedYear !== 'all') r = r.filter(m => extractYear(m)?.toString() === selectedYear);
      setFilteredMovies(r);
    } else {
      let r = [...series];
      if (searchTerm) r = r.filter(s => s.title?.toLowerCase().includes(searchTerm.toLowerCase()) || (s.title_ar && s.title_ar.includes(searchTerm)));
      if (selectedGenre !== 'all') r = r.filter(s => s.genre === selectedGenre);
      if (selectedYear !== 'all') r = r.filter(s => extractYear(s)?.toString() === selectedYear);
      setFilteredSeries(r);
    }
  }, [searchTerm, selectedGenre, selectedYear, activeTab, movies, series]);

  const currentData = activeTab === 'movies' ? filteredMovies : filteredSeries;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = currentData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(currentData.length / itemsPerPage);

  const changePage = (p) => { setCurrentPage(p); localStorage.setItem('animation_current_page', p); };
  const goTo = (p) => { changePage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goNext = () => { if (currentPage < totalPages) { changePage(currentPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const goPrev = () => { if (currentPage > 1) { changePage(currentPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const getPages = () => { const a = []; const mv = isMobile ? 3 : 5; let s = Math.max(1, currentPage - Math.floor(mv / 2)); let e = Math.min(totalPages, s + mv - 1); if (e - s + 1 < mv) s = Math.max(1, e - mv + 1); for (let i = s; i <= e; i++) a.push(i); return a; };

  if (loading) return <div className="flex justify-center items-center h-screen bg-[#1f242d]"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

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
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center text-2xl">🎨</div>
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-br from-white via-rose-100 to-red-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(220,38,38,0.5)]">الرسوم المتحركة</h1>
            </div>
            <div className="w-20 sm:w-28 h-0.5 sm:h-1 rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent mb-2 sm:mb-3 shadow-lg shadow-red-500/50" />
            <p className="text-gray-200 text-xs xs:text-sm sm:text-base max-w-xl leading-relaxed drop-shadow-lg">استمتع بأجمل أفلام ومسلسلات الرسوم المتحركة</p>
          </motion.div>
        </div>
      </div>

      <div className="relative w-full flex items-center justify-center py-4">
        <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/70 shadow-lg shadow-white/40" />
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-[#1f242d]/95 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/30">
        <div className="relative overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 py-3 px-4 sm:px-8 md:px-12 lg:px-16">
            <button onClick={() => { setActiveTab('movies'); setSelectedGenre('all'); setSearchTerm(''); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap ${activeTab === 'movies' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/40 scale-105' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'}`}>
              <FaFilm className="text-sm" />
              <span>أفلام ({filteredMovies.length})</span>
            </button>
            <button onClick={() => { setActiveTab('series'); setSelectedGenre('all'); setSearchTerm(''); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap ${activeTab === 'series' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/40 scale-105' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'}`}>
              <FaTv className="text-sm" />
              <span>مسلسلات ({filteredSeries.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 py-6">
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
                <input type="text" placeholder={t('search.placeholder') || 'ابحث...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#21262d] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white focus:outline-none focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 text-sm transition-all" />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className="bg-[#21262d] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-white text-sm w-full sm:flex-1 md:w-auto focus:outline-none focus:border-red-500/70 transition-all cursor-pointer min-w-0">
                  {(activeTab === 'movies' ? movieGenres : seriesGenres).map(g => (<option key={g} value={g} className="bg-[#21262d]">{g === 'all' ? (t('common.allGenres') || 'كل الأنواع') : g}</option>))}
                </select>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-[#21262d] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-white text-sm w-full sm:w-auto focus:outline-none focus:border-red-500/70 transition-all cursor-pointer min-w-0">
                  {years.map(y => (<option key={y} value={y} className="bg-[#21262d]">{y === 'all' ? (t('common.allYears') || 'كل السنوات') : y}</option>))}
                </select>
              </div>
            </div>
            <div className={`flex ${isMobile ? 'justify-center' : 'justify-between'} items-center`}>
              <p className="text-gray-400 text-sm hidden sm:block"><span className="text-white font-semibold">{currentData.length}</span> {activeTab === 'movies' ? 'فيلم' : 'مسلسل'}</p>
              <div className="flex gap-1 bg-[#21262d] rounded-xl p-1 border border-white/10">
                <button onClick={() => { setViewMode('grid'); localStorage.setItem('animation_view_mode', 'grid'); }} className={`px-4 py-2 rounded-lg transition-all duration-300 text-sm flex items-center gap-2 ${viewMode === 'grid' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><FaTh size={14} /><span className="hidden sm:inline font-medium">شبكة</span></button>
                <button onClick={() => { setViewMode('list'); localStorage.setItem('animation_view_mode', 'list'); }} className={`px-4 py-2 rounded-lg transition-all duration-300 text-sm flex items-center gap-2 ${viewMode === 'list' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><FaList size={14} /><span className="hidden sm:inline font-medium">قائمة</span></button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-5 px-1">
          <p className="text-gray-400 text-sm sm:hidden"><span className="text-white font-semibold">{currentData.length}</span> {activeTab === 'movies' ? 'فيلم' : 'مسلسل'}</p>
          {totalPages > 1 && (<p className="text-gray-500 text-xs">صفحة <span className="text-white font-semibold">{currentPage}</span> من <span className="text-white font-semibold">{totalPages}</span></p>)}
        </div>

        {currentData.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.03] rounded-2xl border border-white/10">
            <FaFilm className="text-gray-600 text-6xl mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium mb-1">لا يوجد محتوى حالياً</p>
            <p className="text-gray-500 text-sm">أضف من لوحة التحكم</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
            {currentItems.map((item, i) => (<AnimationCard key={item.id} item={item} type={activeTab === 'movies' ? 'movie' : 'series'} index={i} />))}
          </div>
        ) : (
          <div className="space-y-3">{currentItems.map((item) => (<AnimationListItem key={item.id} item={item} type={activeTab === 'movies' ? 'movie' : 'series'} />))}</div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10 mb-6">
            <button onClick={goPrev} disabled={currentPage === 1} className={`p-2.5 rounded-xl transition-all duration-300 ${currentPage === 1 ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5' : 'bg-white/5 text-white hover:bg-red-600 border border-white/10 hover:border-red-500'}`}><FaChevronRight size={14} /></button>
            {getPages().map(n => (<button key={n} onClick={() => goTo(n)} className={`w-10 h-10 rounded-xl transition-all duration-300 text-sm font-medium ${currentPage === n ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/40 scale-105' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'}`}>{n}</button>))}
            <button onClick={goNext} disabled={currentPage === totalPages} className={`p-2.5 rounded-xl transition-all duration-300 ${currentPage === totalPages ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5' : 'bg-white/5 text-white hover:bg-red-600 border border-white/10 hover:border-red-500'}`}><FaChevronLeft size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimationPage;