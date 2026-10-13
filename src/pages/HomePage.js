// src/pages/HomePage.js - Akil Tv Hero + بطاقات موحدة
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  FaPlay, FaInfoCircle, FaChevronLeft, FaChevronRight,
  FaFire, FaTv, FaFilm, FaArrowRight,
  FaMusic, FaMagic, FaPlus, FaCheck,
  FaStar, FaClock, FaCalendarAlt,
  FaShareAlt, FaWhatsapp, FaFacebookF, FaTelegramPlane,
  FaTwitter, FaLink, FaBookOpen, FaMicrophone
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { moviesAPI, seriesAPI, clipsAPI } from '../services/api';

// ============================================================
// ✅ إعدادات عامة
// ============================================================
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const DEBUG = process.env.NODE_ENV === 'development';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

// ✅ رابط خلفية Hero الجديد
const HERO_IMAGE_URL = 'http://192.168.11.88/data/Movies/hero.jpg';

const warn = (...args) => { if (DEBUG) console.warn(...args); };

const LOCAL_PLACEHOLDER_16_9 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NDAiIGhlaWdodD0iMzYwIiB2aWV3Qm94PSIwIDAgNjQwIDM2MCI+PHJlY3Qgd2lkdGg9IjY0MCIgaGVpZ2h0PSIzNjAiIGZpbGw9IiMxYTFhMWEiLz48L3N2Zz4=';

const DEMO_POSTERS = [
  'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dnbOE6PY0QO7Lx9.jpg',
  'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
  'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg',
  'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
];

const getDemoPoster = (index) => DEMO_POSTERS[index % DEMO_POSTERS.length];

const extractYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const isValidThumbnail = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/placeholder\.com|via\.placeholder/i.test(trimmed)) return false;
  return /^(https?:|\/|data:image\/)/i.test(trimmed);
};

const fixUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('/') ? `${API_BASE}${trimmed}` : trimmed;
};

const readCache = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.url || !data?.ts) return null;
    if (Date.now() - data.ts > CACHE_TTL) { localStorage.removeItem(key); return null; }
    return isValidThumbnail(data.url) ? data.url : null;
  } catch { return null; }
};

const writeCache = (key, url) => {
  try { localStorage.setItem(key, JSON.stringify({ url, ts: Date.now() })); } catch {}
};

const sortByCreatedAtDesc = (arr) =>
  [...arr].sort((a, b) => {
    const dateA = new Date(a?.created_at || 0).getTime() || 0;
    const dateB = new Date(b?.created_at || 0).getTime() || 0;
    return dateB - dateA;
  });

const extractLatestEpisodes = (series, limit = 12) => {
  const all = [];
  series.slice(0, 20).forEach((s) => {
    if (!s) return;
    const processEpisodes = (eps, seasonNum) => {
      if (!Array.isArray(eps)) return;
      eps.forEach((ep) => {
        all.push({
          ...ep,
          _seriesId: s.id,
          _seriesTitleAr: s.title_ar || s.titleAr || s.title,
          _seriesPoster: s.poster,
          _seriesBackdrop: s.backdrop,
          _seasonNumber: seasonNum || s.season_number,
          _ts: new Date(ep?.created_at || 0).getTime() || 0,
        });
      });
    };
    if (Array.isArray(s.seasons)) s.seasons.forEach(season => processEpisodes(season?.episodes, season.season_number || season.number));
    if (Array.isArray(s.episodes)) processEpisodes(s.episodes, s.season_number);
  });
  return all.sort((a, b) => b._ts - a._ts).slice(0, limit).map(({ _ts, ...ep }) => ep);
};

// ============================================================
// 🎬 استخراج صورة مصغّرة للكليب
// ============================================================
const getClipThumbnail = (clip, index) => {
  if (!clip) return getDemoPoster(index);

  const thumbnailFields = [
    clip.thumbnail, clip.thumbnail_url, clip.thumbnailUrl,
    clip.thumb, clip.image, clip.image_url,
    clip.cover, clip.cover_url, clip.cover_image,
    clip.artwork_url, clip.artworkUrl, clip.artwork,
    clip.poster_url, clip.preview_image,
  ];

  for (const field of thumbnailFields) {
    if (isValidThumbnail(field)) {
      const fixed = fixUrl(field);
      if (fixed) return fixed;
    }
  }

  const videoUrl = clip.video_url || clip.videoUrl || clip.url || clip.youtube_url || clip.link;
  if (videoUrl) {
    const ytId = extractYouTubeId(videoUrl);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
  }

  if (clip.youtube_id || clip.yt_id) {
    return `https://img.youtube.com/vi/${clip.youtube_id || clip.yt_id}/maxresdefault.jpg`;
  }

  return getDemoPoster(index);
};

// ============================================================
// 🌌 خلفية سينمائية ديناميكية
// ============================================================
const AmbientBackground = ({ movies = [] }) => {
  const ambientImages = useMemo(() => {
    const pool = [];
    movies.slice(0, 6).forEach((m) => {
      const img = fixUrl(m.backdrop) || fixUrl(m.poster);
      if (isValidThumbnail(img)) pool.push(img);
    });
    return pool.length > 0 ? pool : [getDemoPoster(0)];
  }, [movies]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (ambientImages.length <= 1) return;
    const timer = setInterval(() => setActiveIndex((p) => (p + 1) % ambientImages.length), 8000);
    return () => clearInterval(timer);
  }, [ambientImages.length]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#1f242d]">
      <AnimatePresence mode="sync">
        {ambientImages[activeIndex] && (
          <motion.div
            key={activeIndex}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${ambientImages[activeIndex]})`,
              filter: 'blur(120px) saturate(1.2) brightness(0.2)',
              transform: 'scale(1.2)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-[#1f242d]/90 via-[#1f242d]/60 to-[#1f242d]" />
    </div>
  );
};

// ============================================================
// 🎴 MinimalCard
// ============================================================
const MinimalCard = ({ item, type = 'movie', index = 0, accent = 'red' }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const itemId = item.id || item._seriesId || index;
  const hoverTimerRef = useRef(null);
  const cardRef = useRef(null);
  const shareRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isFavorite, setIsFavorite] = useState(() => {
    try { return localStorage.getItem(`fav_${type}_${itemId}`) === 'true'; } catch { return false; }
  });

  const accents = {
    red: { play: 'bg-red-600 hover:bg-red-700' },
    blue: { play: 'bg-blue-600 hover:bg-blue-700' },
    purple: { play: 'bg-purple-600 hover:bg-purple-700' },
    green: { play: 'bg-emerald-600 hover:bg-emerald-700' },
    pink: { play: 'bg-pink-600 hover:bg-pink-700' },
    amber: { play: 'bg-amber-600 hover:bg-amber-700' },
  };
  const a = accents[accent] || accents.red;

  const title = item.title_ar || item.titleAr || item.title || item._seriesTitleAr || 'عنوان غير معروف';

  const meta = useMemo(() => {
    const rating = item.vote_average || item.rating || item.imdb_rating || null;

    const yearSource = item.release_date || item.first_air_date || item.air_date || item.created_at;
    const year = yearSource ? new Date(yearSource).getFullYear() : null;

    let duration = null;
    if (type === 'movie' && item.runtime) duration = `${item.runtime} د`;
    else if (type === 'series' && item.number_of_seasons) duration = `${item.number_of_seasons} مواسم`;
    else if (type === 'episode' && item.runtime) duration = `${item.runtime} د`;
    else if ((type === 'clip' || type === 'song') && item.duration) duration = `${Math.round(item.duration)} د`;

    let genres = [];
    if (Array.isArray(item.genres)) {
      genres = item.genres.map(g => (typeof g === 'string' ? g : g?.name)).filter(Boolean);
    } else if (typeof item.genre === 'string') {
      genres = item.genre.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(item.genre)) {
      genres = item.genre;
    }

    return { rating, duration, year, genres: genres.slice(0, 2) };
  }, [item, type]);

  // ✅ الأولوية للـ backdrop (أفقي 16:9) للأفلام والمسلسلات والرسوم المتحركة والحلقات
  const imageSrc = useMemo(() => {
    if (type === 'clip' || type === 'song') return getClipThumbnail(item, index);

    if (type === 'movie' || type === 'series' || type === 'animation' || type === 'episode') {
      const backdrop =
        fixUrl(item.backdrop) ||
        fixUrl(item.backdrop_url) ||
        fixUrl(item.backdrop_path) ||
        fixUrl(item._seriesBackdrop);
      if (isValidThumbnail(backdrop)) return backdrop;
    }

    const fixed = fixUrl(item.poster) || fixUrl(item._seriesPoster) || fixUrl(item.backdrop);
    return isValidThumbnail(fixed) ? fixed : getDemoPoster(index);
  }, [item, type, index]);

  const getFallbackImage = useCallback(() => {
    const poster = fixUrl(item.poster) || fixUrl(item._seriesPoster);
    if (isValidThumbnail(poster)) return poster;
    return getDemoPoster(index);
  }, [item, index]);

  const artistName = (type === 'clip' || type === 'song')
    ? (item.artist_name || item.artist || item.artistName)
    : null;

  const linkPath = type === 'episode' ? `/series/${item._seriesId}/episode/${item.id}`
    : (type === 'clip' || type === 'song') ? `/clip/${item.id}`
    : (type === 'series' || type === 'animation') ? `/series/${item.id}`
    : type === 'quran' ? `/quran/${item.id}`
    : `/movie/${item.id}`;

  const watchPath = type === 'episode' ? `/watch/${item._seriesId}/episode/${item.id}`
    : (type === 'clip' || type === 'song') ? `/watch/clip/${item.id}`
    : (type === 'series' || type === 'animation') ? `/watch/series/${item.id}`
    : type === 'quran' ? `/watch/quran/${item.id}`
    : `/watch/${item.id}`;

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${linkPath}`;
  }, [linkPath]);

  const shareText = useMemo(() => `شاهد "${title}" على موقعنا`, [title]);

  useEffect(() => {
    if (!showShare) return;
    const handler = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) setShowShare(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showShare]);

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setIsHovered(true), 180);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsHovered(false);
    setTimeout(() => {
      if (shareRef.current && !shareRef.current.matches(':hover')) setShowShare(false);
    }, 200);
  };

  useEffect(() => () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); }, []);

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isFavorite;
    setIsFavorite(next);
    try { localStorage.setItem(`fav_${type}_${itemId}`, String(next)); } catch {}
  };

  const handleWatch = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(watchPath);
  };

  const shareLinks = useMemo(() => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    return {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    };
  }, [shareUrl, shareText]);

  const openShare = (platform) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(shareLinks[platform], '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const handleCopyLink = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="flex-shrink-0 w-[46vw] sm:w-[300px] md:w-[340px] lg:w-[380px] relative"
      style={{ zIndex: isHovered ? 40 : 1 }}
    >
      <motion.div
        animate={{ scale: isHovered ? 1.08 : 1, y: isHovered ? -6 : 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="origin-center"
        style={{ transformOrigin: 'center top' }}
      >
        <Link
          to={linkPath}
          className="block relative rounded-2xl overflow-hidden bg-[#151515] border border-white/5 hover:border-white/20 shadow-lg shadow-black/40 transition-colors duration-300"
        >
          <div className="relative aspect-video overflow-hidden">
            <img
              src={imageSrc}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const currentSrc = e.currentTarget.src;
                const fallbackPoster = getFallbackImage();

                if (fallbackPoster && currentSrc !== fallbackPoster) {
                  e.currentTarget.src = fallbackPoster;
                  return;
                }
                if (currentSrc.includes('maxresdefault.jpg')) {
                  e.currentTarget.src = currentSrc.replace('maxresdefault.jpg', 'hqdefault.jpg');
                  return;
                }
                if (currentSrc.includes('hqdefault.jpg')) {
                  e.currentTarget.src = currentSrc.replace('hqdefault.jpg', 'mqdefault.jpg');
                  return;
                }
                if (currentSrc !== getDemoPoster(index)) {
                  e.currentTarget.src = getDemoPoster(index);
                }
              }}
            />

            <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

            {(type === 'clip' || type === 'song') && artistName && (
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-gradient-to-r from-emerald-600 to-teal-600 backdrop-blur-md rounded-md sm:rounded-lg px-1.5 sm:px-2.5 py-0.5 sm:py-1 border border-white/20 z-10 shadow-lg">
                <span className="text-white text-[8px] sm:text-[10px] font-black line-clamp-1">{artistName}</span>
              </div>
            )}

            {(type === 'clip' || type === 'song') && (
              <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-black/70 backdrop-blur-md rounded-md sm:rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 border border-white/20 z-10 shadow-lg flex items-center gap-1">
                <FaPlay className="text-red-500 text-[6px] sm:text-[8px]" />
                <span className="text-white text-[7px] sm:text-[9px] font-black">فيديو</span>
              </div>
            )}
          </div>
        </Link>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-visible border border-white/10 border-t-0 rounded-b-2xl -mt-2 shadow-2xl shadow-black/70 relative"
              style={{ backgroundColor: '#21262d' }}
            >
              <div className="p-2.5 sm:p-3.5 space-y-2 sm:space-y-3">
                <Link to={linkPath} className="block">
                  <h3 className="text-white text-xs sm:text-sm font-bold line-clamp-1 hover:text-red-400 transition-colors">
                    {title}
                  </h3>
                </Link>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-[10px] sm:text-[11px] text-gray-300 font-semibold">
                  {meta.rating && (
                    <span className="flex items-center gap-0.5 sm:gap-1 text-yellow-400">
                      <FaStar className="text-[9px] sm:text-[10px]" />
                      {Number(meta.rating).toFixed(1)}
                    </span>
                  )}
                  {meta.duration && (
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <FaClock className="text-[9px] sm:text-[10px]" />
                      {meta.duration}
                    </span>
                  )}
                  {meta.year && (
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <FaCalendarAlt className="text-[9px] sm:text-[10px]" />
                      {meta.year}
                    </span>
                  )}
                  {meta.genres.length > 0 && (
                    <span className="hidden sm:flex items-center gap-1.5">
                      {meta.genres.map((g, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] text-gray-300 font-semibold">
                          {g}
                        </span>
                      ))}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleWatch}
                    aria-label="تشغيل"
                    className={`w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-md sm:rounded-lg ${a.play} text-white transition-all duration-200 active:scale-95 shadow-md`}
                  >
                    <FaPlay className="text-[9px] sm:text-[11px] ml-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={toggleFavorite}
                    className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold border transition-all duration-200 active:scale-95 ${
                      isFavorite
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-white/5 border-white/15 text-white hover:bg-white/10 hover:border-white/25'
                    }`}
                  >
                    {isFavorite ? <FaCheck className="text-[9px] sm:text-[10px]" /> : <FaPlus className="text-[9px] sm:text-[10px]" />}
                    <span className="hidden xs:inline">{isFavorite ? 'في القائمة' : 'إضافة'}</span>
                  </button>

                  <div className="relative" ref={shareRef}>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowShare(s => !s); }}
                      aria-label="مشاركة"
                      className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-md sm:rounded-lg bg-white/5 border border-white/15 text-white hover:bg-white/10 hover:border-white/25 transition-all duration-200 active:scale-95"
                    >
                      <FaShareAlt className="text-[9px] sm:text-[11px]" />
                    </button>

                    <AnimatePresence>
                      {showShare && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          className="absolute bottom-10 sm:bottom-12 left-0 z-50 p-1.5 sm:p-2 rounded-xl border border-white/10 shadow-2xl shadow-black/80 flex items-center gap-1 sm:gap-1.5"
                          style={{ backgroundColor: '#21262d' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button type="button" onClick={openShare('whatsapp')} aria-label="واتساب" className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-all duration-200 active:scale-90">
                            <FaWhatsapp className="text-sm sm:text-base" />
                          </button>
                          <button type="button" onClick={openShare('facebook')} aria-label="فيسبوك" className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-[#1877F2]/15 hover:bg-[#1877F2] text-[#1877F2] hover:text-white transition-all duration-200 active:scale-90">
                            <FaFacebookF className="text-xs sm:text-sm" />
                          </button>
                          <button type="button" onClick={openShare('telegram')} aria-label="تيليجرام" className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-[#229ED9]/15 hover:bg-[#229ED9] text-[#229ED9] hover:text-white transition-all duration-200 active:scale-90">
                            <FaTelegramPlane className="text-xs sm:text-sm" />
                          </button>
                          <button type="button" onClick={openShare('twitter')} aria-label="تويتر" className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white text-white hover:text-black transition-all duration-200 active:scale-90">
                            <FaTwitter className="text-xs sm:text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCopyLink}
                            aria-label="نسخ الرابط"
                            className={`w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg transition-all duration-200 active:scale-90 ${
                              copied ? 'bg-emerald-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                          >
                            {copied ? <FaCheck className="text-[10px] sm:text-xs" /> : <FaLink className="text-[10px] sm:text-xs" />}
                          </button>
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
// ✅ CarouselRow — أزرار صغيرة وشفافة
// ============================================================
const CarouselRow = ({ items, accent = 'red', type = 'movie' }) => {
  const scrollRef = useRef(null);

  const scroll = useCallback((dir) => {
    if (!scrollRef.current) return;
    const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
    const scrollAmount = 1200;
    const delta = dir === 'left' ? -scrollAmount : scrollAmount;
    scrollRef.current.scrollBy({ left: isRTL ? -delta : delta, behavior: 'smooth' });
  }, []);

  if (!items?.length) return null;

  return (
    <div className="relative group/row py-2">
      {/* زر التمرير الأيسر */}
      <button
        type="button"
        onClick={() => scroll('left')}
        className="absolute left-0 sm:-left-2 md:-left-6 top-1/2 -translate-y-1/2 z-20 
                   w-7 h-7 sm:w-9 sm:h-9 md:w-12 md:h-12 
                   rounded-full bg-black/25 hover:bg-red-600/90 
                   backdrop-blur-sm text-white/60 hover:text-white 
                   border border-white/10 hover:border-red-500 
                   transition-all duration-300 
                   flex items-center justify-center 
                   shadow-md shadow-black/30
                   opacity-40 sm:opacity-0 md:opacity-0 
                   group-hover/row:opacity-100 active:scale-90"
        aria-label="تمرير لليسار"
      >
        <FaChevronLeft className="text-[9px] sm:text-[11px] md:text-sm" />
      </button>

      <div
        ref={scrollRef}
        className="flex flex-nowrap gap-2 md:gap-3 overflow-x-auto pb-6 pt-2 px-2 md:px-4 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((item, index) => (
          <MinimalCard
            key={item.id || item._seriesId || `${type}-${index}`}
            item={item}
            type={type}
            index={index}
            accent={accent}
          />
        ))}
      </div>

      {/* زر التمرير الأيمن */}
      <button
        type="button"
        onClick={() => scroll('right')}
        className="absolute right-0 sm:-right-2 md:-right-6 top-1/2 -translate-y-1/2 z-20 
                   w-7 h-7 sm:w-9 sm:h-9 md:w-12 md:h-12 
                   rounded-full bg-black/25 hover:bg-red-600/90 
                   backdrop-blur-sm text-white/60 hover:text-white 
                   border border-white/10 hover:border-red-500 
                   transition-all duration-300 
                   flex items-center justify-center 
                   shadow-md shadow-black/30
                   opacity-40 sm:opacity-0 md:opacity-0 
                   group-hover/row:opacity-100 active:scale-90"
        aria-label="تمرير لليمين"
      >
        <FaChevronRight className="text-[9px] sm:text-[11px] md:text-sm" />
      </button>
    </div>
  );
};

// ============================================================
// ✅ Section Header
// ============================================================
const Section = ({ title, viewAll, icon, accent = 'red', count, children }) => {
  const { t } = useLanguage();
  const accents = {
    red: { grad: 'from-red-500 to-rose-600', text: 'text-red-500', bg: 'bg-red-500/10' },
    blue: { grad: 'from-blue-500 to-cyan-600', text: 'text-blue-500', bg: 'bg-blue-500/10' },
    purple: { grad: 'from-purple-500 to-fuchsia-600', text: 'text-purple-500', bg: 'bg-purple-500/10' },
    green: { grad: 'from-emerald-500 to-teal-600', text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  };
  const a = accents[accent] || accents.red;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="relative mb-6 md:mb-8"
    >
      <div className="flex items-end justify-between mb-3 px-2">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${a.bg} flex items-center justify-center`}>
            <span className={`text-lg ${a.text}`}>{icon}</span>
          </div>
          <div>
            <h2 className="text-white text-xl md:text-2xl font-black tracking-tight flex items-center gap-3">
              {title}
              {count !== undefined && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-gray-400 text-[10px] font-bold">
                  {count}
                </span>
              )}
            </h2>
            <div className={`h-0.5 w-12 rounded-full bg-gradient-to-r ${a.grad} mt-1.5`} />
          </div>
        </div>

        {viewAll && (
          <Link
            to={viewAll}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold transition-all duration-300"
          >
            <span>{t('common.seeAll') || 'عرض الكل'}</span>
            <FaArrowRight className="text-[10px] group-hover:-translate-x-1 transition-transform duration-300 rtl:rotate-180" />
          </Link>
        )}
      </div>
      {children}
    </motion.section>
  );
};

// ============================================================
// 🎬 Static Hero — Akil Tv في الوسط (خلفية جديدة)
// ============================================================
const StaticHero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-[#0d1015]">
      <div className="relative h-[28vh] xs:h-[30vh] sm:h-[32vh] md:h-[35vh] lg:h-[38vh] w-full overflow-hidden">

        {/* ✅ خلفية Hero الجديدة من الرابط */}
        <img
          src={HERO_IMAGE_URL}
          alt="Akil Tv"
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="eager"
          fetchpriority="high"
          onError={(e) => {
            // fallback في حال فشل تحميل الصورة
            e.currentTarget.style.display = 'none';
          }}
        />

        {/* طبقات تعتيم */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f242d]/70 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1015]/85 via-[#0d1015]/50 to-[#0d1015]/85" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1015]/50 via-transparent to-transparent" />

        {/* المحتوى في الوسط */}
        <div className="relative h-full w-full px-4 sm:px-8 md:px-12 lg:px-16 flex flex-col items-center justify-center text-center">

          {/* Akil Tv */}
          <motion.h1
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-2 sm:mb-3"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #ffe4e4 40%, #ff6b6b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 4px 20px rgba(220, 38, 38, 0.5))',
            }}
          >
            Akil Tv
          </motion.h1>

          {/* خط مضيء */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-20 sm:w-28 h-0.5 sm:h-1 rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent mb-3 sm:mb-4 shadow-lg shadow-red-500/50"
          />

          {/* السطر الوصفي */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-gray-200 text-xs xs:text-sm sm:text-base md:text-lg max-w-xl sm:max-w-2xl leading-relaxed drop-shadow-lg"
          >
            عالمك الخاص من الأفلام والمسلسلات والكليبات بجودة عالية
          </motion.p>

        </div>

        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 80px)',
          }}
        />

      </div>
    </section>
  );
};

// ============================================================
// ✅ AutoClipThumbnail
// ============================================================
const AutoClipThumbnail = ({ clip, fallback, alt, className }) => {
  const initialThumb = useMemo(() => {
    if (isValidThumbnail(clip.thumbnail)) return clip.thumbnail;
    if (isValidThumbnail(clip.artwork_url)) return clip.artwork_url;
    return fallback;
  }, [clip.thumbnail, clip.artwork_url, fallback]);

  const [thumbnail, setThumbnail] = useState(initialThumb);
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) { setShouldLoad(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (isValidThumbnail(clip.thumbnail)) { setThumbnail(clip.thumbnail); return; }
    if (isValidThumbnail(clip.artwork_url)) { setThumbnail(clip.artwork_url); return; }
    const videoUrl = clip.video_url || clip.videoUrl;
    if (!videoUrl || !shouldLoad) return;

    const cacheKey = `thumb_clip_${clip.id}`;
    const cached = readCache(cacheKey);
    if (cached) { setThumbnail(cached); return; }

    const ytId = extractYouTubeId(videoUrl);
    if (ytId) {
      const maxres = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
      const hq = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      const probe = new Image();
      probe.onload = () => {
        if (cancelled) return;
        if (probe.naturalWidth > 200) { setThumbnail(maxres); writeCache(cacheKey, maxres); }
        else { setThumbnail(hq); writeCache(cacheKey, hq); }
      };
      probe.onerror = () => { if (!cancelled) { setThumbnail(hq); writeCache(cacheKey, hq); } };
      probe.src = maxres;
      return () => { cancelled = true; };
    }

    fetch(`${API_BASE}/api/thumbnail-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.thumbnail) return;
        const fullUrl = data.thumbnail.startsWith('http') ? data.thumbnail : `${API_BASE}${data.thumbnail}`;
        setThumbnail(fullUrl);
        writeCache(cacheKey, fullUrl);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [clip.id, clip.video_url, clip.videoUrl, clip.thumbnail, clip.artwork_url, shouldLoad]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <img
        src={thumbnail}
        alt={alt || ''}
        className={className}
        loading="lazy"
        decoding="async"
        onError={(e) => { if (fallback && e.currentTarget.src !== fallback) e.currentTarget.src = fallback; }}
      />
    </div>
  );
};

// ============================================================
// 🎴 ClipCard
// ============================================================
const ClipCard = ({ clip }) => {
  const artistName = clip.artist_name || clip.artist || clip.artistName;

  return (
    <Link to={`/clip/${clip.id}`} className="block group/card">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-white/[0.12] to-white/[0.03] p-[1.5px] transition-all duration-500 group-hover/card:from-emerald-500/50 group-hover/card:to-teal-500/50 shadow-lg shadow-black/50 group-hover/card:shadow-2xl group-hover/card:shadow-emerald-600/30">
        <div className="relative rounded-2xl overflow-hidden bg-[#0a0a0a]">
          <div className="relative overflow-hidden">
            <AutoClipThumbnail
              clip={clip}
              fallback={LOCAL_PLACEHOLDER_16_9}
              alt={clip.title}
              className="w-full aspect-video object-cover transition-all duration-700 group-hover/card:scale-110 group-hover/card:brightness-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover/card:opacity-95 transition-opacity duration-500" />
            <div className="absolute inset-0 -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12" />

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-400">
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-emerald-400/50 animate-ping" />
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/60 ring-2 ring-white/40">
                  <FaPlay className="text-white text-base sm:text-lg ml-1" />
                </div>
              </div>
            </div>

            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1.5 z-10">
              <div className="bg-black/80 backdrop-blur-xl rounded-full px-2 sm:px-3 py-1 sm:py-1.5 border border-emerald-500/50 flex items-center gap-1 shadow-lg">
                <FaMusic className="text-emerald-400 text-[8px] sm:text-[9px]" />
                <span className="text-white text-[8px] sm:text-[10px] font-black">Music</span>
              </div>
            </div>

            {clip.duration && (
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/80 backdrop-blur-xl rounded-full px-2 sm:px-3 py-1 sm:py-1.5 border border-white/25 z-10 shadow-lg">
                <span className="text-white text-[8px] sm:text-[10px] font-black">{clip.duration}</span>
              </div>
            )}

            {artistName && (
              <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-gradient-to-r from-emerald-600 to-teal-600 backdrop-blur-xl rounded-full px-2 sm:px-3 py-1 sm:py-1.5 border border-white/30 z-10 shadow-lg">
                <span className="text-white text-[8px] sm:text-[10px] font-black line-clamp-1">{artistName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2 sm:mt-3 px-1">
        <h3 className="text-white font-bold text-xs sm:text-sm line-clamp-1 group-hover/card:text-emerald-400 transition-colors duration-300">
          {clip.title}
        </h3>
        <p className="text-gray-400 text-[10px] sm:text-[11px] mt-1 line-clamp-1 font-semibold">
          {clip.genre || 'Music'}
        </p>
      </div>
    </Link>
  );
};

// ============================================================
// ✅ ScrollButton + ScrollableRow — أزرار صغيرة وشفافة
// ============================================================
const ScrollButton = ({ direction, onClick }) => {
  const Icon = direction === 'left' ? FaChevronLeft : FaChevronRight;
  const pos = direction === 'left' ? 'left-0 sm:-left-2 md:-left-4' : 'right-0 sm:-right-2 md:-right-4';

  return (
    <motion.button
      type="button"
      aria-label={`scroll ${direction}`}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`absolute ${pos} top-1/2 -translate-y-1/2 z-20 
                  w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 
                  rounded-full bg-black/25 hover:bg-red-600/90 
                  backdrop-blur-sm text-white/60 hover:text-white 
                  border border-white/10 hover:border-red-500 
                  transition-all duration-300 
                  flex items-center justify-center 
                  shadow-md shadow-black/30
                  opacity-40 sm:opacity-0 
                  group-hover/row:opacity-100 active:scale-90`}
    >
      <Icon className="text-[9px] sm:text-[11px] md:text-sm" />
    </motion.button>
  );
};

const ScrollableRow = ({ items, renderItem, itemWidth }) => {
  const scrollRef = useRef(null);
  const scroll = useCallback((dir) => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -500 : 500, behavior: 'smooth' });
  }, []);

  if (!items?.length) return null;

  return (
    <div className="relative group/row">
      <ScrollButton direction="left" onClick={() => scroll('left')} />
      <div ref={scrollRef} className="flex gap-2 md:gap-3 overflow-x-auto pb-6 scrollbar-hide scroll-smooth">
        {items.map((item, index) => (
          <motion.div
            key={item.id ?? index}
            className={`flex-shrink-0 ${itemWidth}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.5, ease: 'easeOut' }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </div>
      <ScrollButton direction="right" onClick={() => scroll('right')} />
    </div>
  );
};

// ============================================================
// ✅ Skeleton
// ============================================================
const HomeSkeleton = () => (
  <div className="min-h-screen bg-[#1f242d]">
    <div className="relative h-[28vh] xs:h-[30vh] sm:h-[32vh] md:h-[35vh] lg:h-[38vh] w-full bg-white/5 animate-pulse" />
    <div className="w-full px-4 sm:px-8 md:px-12 py-10 space-y-10">
      {[1, 2, 3, 4, 5, 6].map((s) => (
        <div key={s}>
          <div className="h-6 w-48 bg-white/10 rounded mb-4 animate-pulse" />
          <div className="flex gap-2 md:gap-3 overflow-hidden">
            {[1, 2, 3, 4].map((c) => (
              <div key={c} className="flex-shrink-0 w-[46vw] sm:w-[300px] aspect-video bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// ✅ المكون الرئيسي HomePage
// ============================================================
const HomePage = () => {
  const [latestMovies, setLatestMovies] = useState([]);
  const [latestSeries, setLatestSeries] = useState([]);
  const [latestAnimation, setLatestAnimation] = useState([]);
  const [latestClips, setLatestClips] = useState([]);
  const [latestSongs, setLatestSongs] = useState([]);
  const [latestQuran, setLatestQuran] = useState([]);
  const [latestSeriesEpisodes, setLatestSeriesEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    const safe = (fn) => fn().catch((e) => { warn('API error:', e?.message || e); return []; });

    const loadAllData = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        Promise.all(['arabwood', 'hollywood', 'bollywood'].map((c) => safe(() => moviesAPI.getByCategory(c)))),
        Promise.all(['arabic', 'foreign', 'turkish'].map((c) => safe(() => seriesAPI.getByCategory(c)))),
        safe(() => moviesAPI.getByCategory('animation')),
        safe(() => seriesAPI.getByCategory('animation')),
        safe(() => clipsAPI.getAll()),
        safe(() => clipsAPI.getByCategory ? clipsAPI.getByCategory('songs') : Promise.resolve([])),
        safe(() => clipsAPI.getByCategory ? clipsAPI.getByCategory('quran') : Promise.resolve([])),
      ]);

      if (!mounted || controller.signal.aborted) return;
      const valueOf = (r) => (r.status === 'fulfilled' ? r.value : []);

      const rawMovies = valueOf(results[0]).flat().filter(Boolean);
      const rawSeries = valueOf(results[1]).flat().filter(Boolean);
      const rawMoviesAnimation = valueOf(results[2]).filter(Boolean);
      const rawSeriesAnimation = valueOf(results[3]).filter(Boolean);
      const rawClips = valueOf(results[4]).filter(Boolean);
      const rawSongs = valueOf(results[5]).filter(Boolean);
      const rawQuran = valueOf(results[6]).filter(Boolean);

      setLatestMovies(sortByCreatedAtDesc(rawMovies).slice(0, 12));
      setLatestSeries(sortByCreatedAtDesc(rawSeries).slice(0, 12));
      setLatestAnimation(sortByCreatedAtDesc([...rawMoviesAnimation, ...rawSeriesAnimation]).slice(0, 12));
      setLatestClips(sortByCreatedAtDesc(rawClips).slice(0, 12));
      setLatestSongs(sortByCreatedAtDesc(rawSongs).slice(0, 12));
      setLatestQuran(sortByCreatedAtDesc(rawQuran).slice(0, 12));
      setLatestSeriesEpisodes(extractLatestEpisodes(rawSeries, 12));
      setLoading(false);
    };

    loadAllData();
    return () => { mounted = false; controller.abort(); };
  }, []);

  if (loading) return <HomeSkeleton />;

  return (
    <div className="min-h-screen bg-[#1f242d] relative selection:bg-red-500/30 selection:text-white">
      <AmbientBackground movies={latestMovies} />

      <div className="relative z-10">
        {/* ✅ Hero Akil Tv */}
        <StaticHero />

        {/* ✅ فاصل أبيض في الوسط */}
        <div className="relative w-full flex items-center justify-center py-4 sm:py-5">
          <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/70 shadow-lg shadow-white/40" />
        </div>

        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 pb-8 md:pb-12 pt-2 space-y-4 md:space-y-6">

          {latestMovies.length > 0 && (
            <Section title="أحدث الأفلام" viewAll="/movies" icon={<FaFilm />} accent="red" count={latestMovies.length}>
              <CarouselRow items={latestMovies} type="movie" accent="red" />
            </Section>
          )}

          {latestSeries.length > 0 && (
            <Section title="أحدث المسلسلات" viewAll="/series" icon={<FaTv />} accent="blue" count={latestSeries.length}>
              <CarouselRow items={latestSeries} type="series" accent="blue" />
            </Section>
          )}

          {latestSeriesEpisodes.length > 0 && (
            <Section title="حلقات جديدة" viewAll="/series" icon={<FaPlay />} accent="blue" count={latestSeriesEpisodes.length}>
              <CarouselRow items={latestSeriesEpisodes} type="episode" accent="blue" />
            </Section>
          )}

          {latestAnimation.length > 0 && (
            <Section title="رسوم متحركة" viewAll="/animation" icon={<FaMagic />} accent="purple" count={latestAnimation.length}>
              <CarouselRow items={latestAnimation} type="animation" accent="purple" />
            </Section>
          )}

          {latestClips.length > 0 && (
            <Section title="أحدث الكليبات" viewAll="/clips" icon={<FaMusic />} accent="green" count={latestClips.length}>
              <ScrollableRow
                items={latestClips}
                itemWidth="w-[46vw] sm:w-[260px] md:w-[300px] lg:w-[340px]"
                renderItem={(clip) => <ClipCard clip={clip} />}
              />
            </Section>
          )}

          {latestSongs.length > 0 && (
            <Section title="أحدث الأغاني" viewAll="/songs" icon={<FaMicrophone />} accent="green" count={latestSongs.length}>
              <ScrollableRow
                items={latestSongs}
                itemWidth="w-[46vw] sm:w-[260px] md:w-[300px] lg:w-[340px]"
                renderItem={(clip) => <ClipCard clip={clip} />}
              />
            </Section>
          )}

          {latestQuran.length > 0 && (
            <Section title="القرآن الكريم" viewAll="/quran" icon={<FaBookOpen />} accent="green" count={latestQuran.length}>
              <CarouselRow items={latestQuran} type="quran" accent="amber" />
            </Section>
          )}

        </div>

        <footer className="border-t border-white/5 py-8 text-center text-gray-500 text-sm mt-8">
          <p>© 2026 جميع الحقوق محفوظة. Akil Tv</p>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;