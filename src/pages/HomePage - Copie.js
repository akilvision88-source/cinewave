// src/pages/HomePage.js - النسخة السينمائية الاحترافية (Final Edition)
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  FaPlay, FaInfoCircle, FaChevronLeft, FaChevronRight, FaStar,
  FaFire, FaTv, FaFilm, FaCalendarAlt, FaClock, FaArrowRight,
  FaMusic, FaMagic, FaHeart, FaPlus
} from 'react-icons/fa';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { moviesAPI, seriesAPI, clipsAPI } from '../services/api';

// ============================================================
// ✅ إعدادات عامة
// ============================================================
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const DEBUG = process.env.NODE_ENV === 'development';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

const warn = (...args) => { if (DEBUG) console.warn(...args); };

// ============================================================
// ✅ Placeholders
// ============================================================
const LOCAL_PLACEHOLDER_16_9 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NDAiIGhlaWdodD0iMzYwIiB2aWV3Qm94PSIwIDAgNjQwIDM2MCI+PHJlY3Qgd2lkdGg9IjY0MCIgaGVpZ2h0PSIzNjAiIGZpbGw9IiMxYTFhMWEiLz48L3N2Zz4=';

// ============================================================
// 🎬 صور بجودة عالية جداً (4K Backdrops من TMDB)
// ============================================================
const DEMO_MOVIE_IMAGES = [
  { 
    backdrop: 'https://image.tmdb.org/t/p/original/8b8R8l88Qje9dnbOE6PY0QO7Lx9.jpg', 
    poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg' 
  },
  { 
    backdrop: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg', 
    poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dnbOE6PY0QO7Lx9.jpg' 
  },
  { 
    backdrop: 'https://image.tmdb.org/t/p/original/5a4JdoFwll5DRtKNNWCb0EdhNwJ.jpg', 
    poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg' 
  },
  { 
    backdrop: 'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg', 
    poster: 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg' 
  },
  { 
    backdrop: 'https://image.tmdb.org/t/p/original/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg', 
    poster: 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg' 
  },
  { 
    backdrop: 'https://image.tmdb.org/t/p/original/yF1eOkaYvwiORauRCPWznV9xVvi.jpg', 
    poster: 'https://image.tmdb.org/t/p/w500/1X7vow16X7CnCoexXh4H4F2yDJv.jpg' 
  },
  { 
    backdrop: 'https://image.tmdb.org/t/p/original/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', 
    poster: 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg' 
  },
  { 
    backdrop: 'https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg', 
    poster: 'https://image.tmdb.org/t/p/w500/sv1xJUazXeYqALzczSZ3O6nkH75.jpg' 
  },
  { 
    backdrop: 'https://image.tmdb.org/t/p/original/kMgQCy4hIdUyD2nJvHB2qE7kULc.jpg', 
    poster: 'https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg' 
  },
  { 
    backdrop: 'https://image.tmdb.org/t/p/original/8rpDcsfLJypbO6vREc0547VKqEv.jpg', 
    poster: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg' 
  },
  { 
    backdrop: 'https://image.tmdb.org/t/p/original/tmU7GeKVybMWFButWEGl2M4GeiP.jpg', 
    poster: 'https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg' 
  },
  { 
    backdrop: 'https://image.tmdb.org/t/p/original/9l1eZiJHmhr5jIlthMdJN5WYoff.jpg', 
    poster: 'https://image.tmdb.org/t/p/w500/hE24GM7t8mSwQ5tVQxwq5ZBTS8K.jpg' 
  },
];

const DEMO_SERIES_IMAGES = [
  { 
    backdrop: 'https://image.tmdb.org/t/p/original/9faGSFi5jam6pDWGNd0p8JcJgXQ.jpg', 
    poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg' 
  },
  { 
    backdrop: 'https://image.tmdb.org/t/p/original/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg', 
    poster: 'https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg' 
  },
  { 
    backdrop: 'https://image.tmdb.org/t/p/original/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg', 
    poster: 'https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg' 
  },
  { 
    backdrop: 'https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg', 
    poster: 'https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg' 
  },
];

const getDemoMovieImage = (index, type = 'backdrop') => DEMO_MOVIE_IMAGES[index % DEMO_MOVIE_IMAGES.length][type];
const getDemoSeriesImage = (index, type = 'backdrop') => DEMO_SERIES_IMAGES[index % DEMO_SERIES_IMAGES.length][type];

// ============================================================
// ✅ أدوات مساعدة
// ============================================================
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
  if (trimmed.startsWith('/')) return `${API_BASE}${trimmed}`;
  return trimmed;
};

const extractYouTubeId = (url) => {
  if (!url) return null;
  if (url.includes('youtu.be')) return url.split('youtu.be/')[1]?.split('?')[0] || null;
  if (url.includes('watch?v=')) return url.split('watch?v=')[1]?.split('&')[0] || null;
  if (url.includes('embed/')) return url.split('embed/')[1]?.split('?')[0] || null;
  return null;
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
  [...arr].sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));

const extractLatestEpisodes = (series, limit = 12) => {
  const episodes = [];
  series.forEach((s) => {
    if (!s) return;
    if (Array.isArray(s.seasons)) {
      s.seasons.forEach((season) => {
        if (!Array.isArray(season?.episodes)) return;
        season.episodes.forEach((ep) => {
          episodes.push({
            ...ep,
            _seriesId: s.id,
            _seriesTitle: s.title,
            _seriesTitleAr: s.title_ar || s.titleAr || s.title,
            _seriesPoster: s.poster,
            _seriesBackdrop: s.backdrop,
            _seasonNumber: season.season_number || season.number,
          });
        });
      });
    }
    if (Array.isArray(s.episodes)) {
      s.episodes.forEach((ep) => {
        episodes.push({
          ...ep,
          _seriesId: s.id,
          _seriesTitle: s.title,
          _seriesTitleAr: s.title_ar || s.titleAr || s.title,
          _seriesPoster: s.poster,
          _seriesBackdrop: s.backdrop,
          _seasonNumber: s.season_number,
        });
      });
    }
  });
  return sortByCreatedAtDesc(episodes).slice(0, limit);
};

// ============================================================
// 🌌 خلفية سينمائية ديناميكية
// ============================================================
const AmbientBackground = ({ movies = [], series = [] }) => {
  const ambientImages = useMemo(() => {
    const pool = [];
    movies.slice(0, 6).forEach((m, i) => {
      const img = fixUrl(m.backdrop) || fixUrl(m.poster) || getDemoMovieImage(i, 'backdrop');
      if (isValidThumbnail(img)) pool.push(img);
    });
    series.slice(0, 4).forEach((s, i) => {
      const img = fixUrl(s.backdrop) || fixUrl(s.poster) || getDemoSeriesImage(i, 'backdrop');
      if (isValidThumbnail(img)) pool.push(img);
    });
    return pool.slice(0, 6);
  }, [movies, series]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (ambientImages.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((p) => (p + 1) % ambientImages.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [ambientImages.length]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a0a] via-[#0f0a1a] to-[#0a0f1a]" />

      <AnimatePresence mode="sync">
        {ambientImages[activeIndex] && (
          <motion.div
            key={activeIndex}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${ambientImages[activeIndex]})`,
              filter: 'blur(80px) saturate(1.6) brightness(0.4)',
              transform: 'scale(1.3)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

      <motion.div
        className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full blur-[160px] opacity-50"
        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.7) 0%, transparent 70%)' }}
        animate={{ x: [0, 120, 0], y: [0, 80, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full blur-[160px] opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.7) 0%, transparent 70%)' }}
        animate={{ x: [0, -80, 0], y: [0, 100, 0], scale: [1, 1.25, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/4 w-[650px] h-[650px] rounded-full blur-[170px] opacity-35"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.7) 0%, transparent 70%)' }}
        animate={{ x: [0, 140, 0], y: [0, -80, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
        }}
      />

      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/60"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [0, -50, 0], opacity: [0.1, 0.9, 0.1] }}
          transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 4, ease: 'easeInOut' }}
        />
      ))}
    </div>
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
      <img src={thumbnail} alt={alt || ''} className={className} loading="lazy" decoding="async"
        onError={(e) => { if (fallback && e.currentTarget.src !== fallback) e.currentTarget.src = fallback; }} />
    </div>
  );
};

// ============================================================
// 🎴 TiltCard
// ============================================================
const TiltCard = ({ children, className = '' }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 20 });

  const handleMouse = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className={`relative ${className}`}
    >
      {children}
    </motion.div>
  );
};

// ============================================================
// 🎬 زر تمرير
// ============================================================
const ScrollButton = ({ direction, onClick }) => {
  const Icon = direction === 'left' ? FaChevronLeft : FaChevronRight;
  const pos = direction === 'left' ? '-left-4' : '-right-4';
  return (
    <motion.button
      type="button"
      aria-label={`scroll ${direction}`}
      onClick={onClick}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      className={`absolute ${pos} top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/60 backdrop-blur-xl text-white border border-white/20 opacity-0 group-hover/row:opacity-100 transition-all duration-300 hover:bg-red-600 hover:border-red-500 hidden md:flex items-center justify-center shadow-2xl shadow-red-600/30`}
    >
      <Icon className="text-sm md:text-base" />
    </motion.button>
  );
};

// ============================================================
// ✅ ScrollableRow
// ============================================================
const ScrollableRow = ({ items, renderItem, itemWidth }) => {
  const scrollRef = useRef(null);
  const scroll = useCallback((dir) => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -500 : 500, behavior: 'smooth' });
  }, []);

  if (!items?.length) return null;

  return (
    <div className="relative group/row">
      <ScrollButton direction="left" onClick={() => scroll('left')} />
      <div ref={scrollRef} className="flex gap-4 md:gap-5 overflow-x-auto pb-6 scrollbar-hide scroll-smooth">
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
// ✅ Section
// ============================================================
const Section = ({ title, viewAll, children, icon, accent = 'red', count }) => {
  const { t } = useLanguage();
  const accents = {
    red: { grad: 'from-red-500 to-rose-600', glow: 'shadow-red-500/50', text: 'text-red-400', ring: 'ring-red-500/30', aura: 'from-red-500/20' },
    blue: { grad: 'from-blue-500 to-cyan-600', glow: 'shadow-blue-500/50', text: 'text-blue-400', ring: 'ring-blue-500/30', aura: 'from-blue-500/20' },
    purple: { grad: 'from-purple-500 to-fuchsia-600', glow: 'shadow-purple-500/50', text: 'text-purple-400', ring: 'ring-purple-500/30', aura: 'from-purple-500/20' },
    green: { grad: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/50', text: 'text-emerald-400', ring: 'ring-emerald-500/30', aura: 'from-emerald-500/20' },
  };
  const a = accents[accent] || accents.red;

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      <div className={`absolute -inset-x-8 -inset-y-8 bg-gradient-radial ${a.aura} to-transparent blur-3xl opacity-30 pointer-events-none`} />

      <div className="relative flex justify-between items-end mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`absolute inset-0 ${a.glow} blur-2xl opacity-80`} />
            <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${a.grad} flex items-center justify-center shadow-lg ring-1 ${a.ring}`}>
              <span className="text-white text-lg md:text-xl">{icon}</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight drop-shadow-lg">{title}</h2>
              {count !== undefined && (
                <span className={`hidden sm:inline-flex items-center px-3 py-1 bg-white/10 border border-white/20 rounded-full ${a.text} text-[10px] font-bold backdrop-blur-md`}>
                  {count}+
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className={`w-10 h-[3px] rounded-full bg-gradient-to-r ${a.grad}`} />
              <div className="w-3 h-[3px] rounded-full bg-white/30" />
              <div className="w-1.5 h-[3px] rounded-full bg-white/15" />
            </div>
          </div>
        </div>
        {viewAll && (
          <Link to={viewAll} className={`group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.12] backdrop-blur-md border border-white/15 hover:border-white/30 text-gray-200 hover:text-white text-xs sm:text-sm font-semibold transition-all duration-300 hover:shadow-lg ${a.glow}`}>
            <span>{t('common.seeAll')}</span>
            <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
      {children}
    </motion.section>
  );
};

// ============================================================
// 🎞️ Hero Slider - نسخة أقصر (45vh) + صور 4K
// ============================================================
const HeroSlider = ({ movies }) => {
  const { language, t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const slides = useMemo(() => {
    if (!movies?.length) return [];
    return movies.slice(0, 6).map((movie, i) => {
      const backdropFixed = fixUrl(movie.backdrop);
      const posterFixed = fixUrl(movie.poster);

      const backdrop = isValidThumbnail(backdropFixed) ? backdropFixed
        : isValidThumbnail(posterFixed) ? posterFixed
        : getDemoMovieImage(i, 'backdrop');

      const poster = isValidThumbnail(posterFixed) ? posterFixed
        : getDemoMovieImage(i, 'poster');

      return {
        ...movie,
        _backdrop: backdrop,
        _poster: poster,
        _title: language === 'ar' ? (movie.title_ar || movie.titleAr || movie.title)
                : language === 'fr' ? (movie.title_fr || movie.titleFr || movie.title)
                : movie.title,
      };
    });
  }, [movies, language]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => { setCurrent((p) => (p + 1) % slides.length); }, 7000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  useEffect(() => { setCurrent(0); }, [slides.length]);

  const goNext = useCallback(() => setCurrent((p) => (p + 1) % slides.length), [slides.length]);
  const goPrev = useCallback(() => setCurrent((p) => (p - 1 + slides.length) % slides.length), [slides.length]);

  if (!slides.length) return null;
  const slide = slides[current];

  const handleImageError = (slideId) => {
    setImageErrors(prev => ({ ...prev, [slideId]: true }));
  };

  const currentBackdrop = imageErrors[slide.id]
    ? getDemoMovieImage(current, 'backdrop')
    : slide._backdrop;

  return (
    // ✅ الارتفاع تم تصغيره للنصف تقريباً: من 85vh → 45vh
    <div
      className="relative h-[45vh] sm:h-[48vh] md:h-[50vh] lg:h-[52vh] w-full overflow-hidden bg-[#0a0a0a]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ✅ خلفية كاملة بجودة عالية */}
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.id || current}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <img
            src={currentBackdrop}
            alt={slide._title}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            onError={() => handleImageError(slide.id)}
            loading="eager"
            fetchpriority="high"
          />
        </motion.div>
      </AnimatePresence>

      {/* ✅ طبقة تعتيم ذكية */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.15) 65%, transparent 100%),
            linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 15%, transparent 40%)
          `
        }}
      />

      {/* خطوط سينمائية خفيفة */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 80px)'
      }} />

      {/* ===== المحتوى الرئيسي ===== */}
      <div className="relative h-full w-full px-4 sm:px-6 md:px-10 lg:px-16 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

          {/* ---- LEFT: Info ---- */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`info-${slide.id || current}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-8 xl:col-span-7 max-w-2xl"
            >
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-red-600 to-rose-600 rounded-full text-white text-[10px] font-black shadow-lg shadow-red-600/50 ring-1 ring-white/20">
                  <FaFire className="text-[9px]" />
                  {language === 'ar' ? 'الأكثر رواجاً' : language === 'fr' ? 'Tendance' : 'Trending'}
                </span>
                {slide.genre && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 backdrop-blur-xl rounded-full text-white text-[10px] font-bold border border-white/25">
                    {slide.genre}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-full text-yellow-200 text-[10px] font-bold border border-yellow-500/40">
                  <FaStar className="text-yellow-400 text-[9px]" />
                  4K ULTRA HD
                </span>
              </div>

              {/* Title - أصغر قليلاً للتناسب مع الارتفاع الجديد */}
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-3 leading-[0.95] tracking-tighter drop-shadow-2xl">
                {slide._title}
              </h1>

              {/* Accent Line */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-16 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-transparent rounded-full shadow-lg shadow-red-500/50" />
                <div className="w-5 h-1 bg-red-600/60 rounded-full" />
                <div className="w-2.5 h-1 bg-red-600/40 rounded-full" />
                <div className="w-1.5 h-1 bg-red-600/30 rounded-full" />
              </div>

              {/* Meta Pills */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-xl px-3 py-1.5 rounded-full border border-yellow-500/40 shadow-lg">
                  <FaStar className="text-yellow-400 text-xs" />
                  <span className="text-white font-black text-xs">{slide.rating || '8.5'}</span>
                  <span className="text-gray-400 text-[9px] font-medium">/10</span>
                </div>
                {slide.year && (
                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/15">
                    <FaCalendarAlt className="text-[10px] text-red-400" />
                    <span className="text-white text-xs font-bold">{slide.year}</span>
                  </div>
                )}
                {slide.duration && (
                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/15">
                    <FaClock className="text-[10px] text-red-400" />
                    <span className="text-white text-xs font-bold">{slide.duration}</span>
                  </div>
                )}
              </div>

              {/* Description - line-clamp-2 فقط للتناسب */}
              <p className="text-gray-100 text-xs sm:text-sm mb-5 line-clamp-2 max-w-xl leading-relaxed drop-shadow-2xl">
                {slide.description || (language === 'ar' ? 'فيلم سينمائي مذهل بأحداث مثيرة وتشويق لا ينتهي.' : 'Un film incroyable avec des événements passionnants.')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5">
                <Link
                  to={`/watch/${slide.id}`}
                  className="group relative overflow-hidden bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2.5 hover:shadow-2xl hover:shadow-red-600/60 transition-all duration-300 hover:scale-105 ring-1 ring-white/20"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <FaPlay className="text-[10px] ml-0.5" />
                  </span>
                  <span className="relative">{t('movie.watch') || 'شاهد الآن'}</span>
                </Link>
                <Link
                  to={`/movie/${slide.id}`}
                  className="group bg-white/10 backdrop-blur-xl text-white px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2.5 hover:bg-white/20 transition-all duration-300 border border-white/25 hover:border-white/50"
                >
                  <FaInfoCircle className="text-sm" />
                  <span>{t('common.details') || 'التفاصيل'}</span>
                </Link>
                <button
                  type="button"
                  className="group w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl border border-white/25 hover:bg-white/20 hover:border-white/50 flex items-center justify-center transition-all duration-300 hover:scale-105"
                  aria-label="add to list"
                >
                  <FaPlus className="text-white text-xs" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ---- RIGHT: Poster (أصغر للتناسب مع الارتفاع الجديد) ---- */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={`poster-${slide.id || current}`}
                initial={{ opacity: 0, x: 60, rotateY: 20 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                exit={{ opacity: 0, x: -60, rotateY: -20 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="relative flex justify-end"
              >
                <div className="relative group/poster">
                  {/* Glow */}
                  <div className="absolute -inset-6 bg-gradient-to-r from-red-600/50 via-rose-500/40 to-purple-600/50 rounded-[32px] blur-3xl opacity-70 group-hover/poster:opacity-100 transition-opacity duration-700" />

                  {/* Poster Card - أصغر */}
                  <div className="relative w-[200px] xl:w-[240px] aspect-[2/3] rounded-3xl overflow-hidden border-2 border-white/25 shadow-2xl shadow-black/90 transition-transform duration-700 group-hover/poster:scale-[1.03] group-hover/poster:rotate-1">
                    <img
                      src={slide._poster}
                      alt={slide._title}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      onError={(e) => { e.currentTarget.src = getDemoMovieImage(current, 'poster'); }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Rating */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-xl rounded-xl px-2.5 py-1.5 border border-yellow-500/50 shadow-2xl">
                      <FaStar className="text-yellow-400 text-xs" />
                      <span className="text-white text-xs font-black">{slide.rating || '8.5'}</span>
                    </div>

                    {/* 4K Badge */}
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-red-600 to-rose-600 backdrop-blur-xl rounded-xl px-2.5 py-1.5 border border-white/30 shadow-2xl">
                      <span className="text-white text-[10px] font-black tracking-widest">4K</span>
                    </div>

                    {/* Corner Decoration */}
                    <div className="absolute -top-1.5 -left-1.5 w-12 h-12 border-t-4 border-l-4 border-red-500/70 rounded-tl-3xl" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-12 h-12 border-b-4 border-r-4 border-red-500/70 rounded-br-3xl" />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ===== Bottom Navigation Bar ===== */}
      <div className="absolute bottom-3 left-4 right-4 sm:left-8 sm:right-8 md:left-12 md:right-12 lg:left-16 lg:right-16 z-30">
        <div className="bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/15 p-2.5 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            {/* Thumbnails */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
              {slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`go to slide ${i + 1}`}
                  className={`relative flex-shrink-0 w-12 h-8 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    i === current
                      ? 'border-red-500 shadow-lg shadow-red-500/50 scale-110'
                      : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white/50'
                  }`}
                >
                  <img src={s._backdrop} alt="" className="w-full h-full object-cover" />
                  {i === current && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-red-500/40 to-rose-500/40"
                      layoutId="activeSlide"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="hidden sm:block text-white/60 text-[10px] font-bold mr-1 tabular-nums">
                {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
              <button
                onClick={goPrev}
                aria-label="previous slide"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-red-600 border border-white/20 hover:border-red-500 text-white flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <FaChevronLeft className="text-xs" />
              </button>
              <button
                onClick={goNext}
                aria-label="next slide"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-red-600 border border-white/20 hover:border-red-500 text-white flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 🎬 LandscapeMovieCard
// ============================================================
const LandscapeMovieCard = ({ movie, index = 0 }) => {
  const [isLiked, setIsLiked] = useState(false);
  const backdropImage = useMemo(() => {
    const apiBackdrop = fixUrl(movie.backdrop) || fixUrl(movie.poster);
    if (isValidThumbnail(apiBackdrop)) return apiBackdrop;
    return getDemoMovieImage(index, 'backdrop');
  }, [movie.backdrop, movie.poster, index]);

  const movieTitle = movie.title_ar || movie.titleAr || movie.title || 'فيلم';
  const movieGenre = movie.genre || 'Action';
  const movieYear = movie.year || '2024';
  const movieRating = movie.rating || '8.5';
  const movieDuration = movie.duration || '2h 15min';

  return (
    <TiltCard>
      <Link to={`/movie/${movie.id}`} className="block group/movie">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-white/[0.12] to-white/[0.03] p-[1.5px] transition-all duration-500 group-hover/movie:from-red-500/60 group-hover/movie:to-rose-500/60 shadow-lg shadow-black/50 group-hover/movie:shadow-2xl group-hover/movie:shadow-red-600/30">
          <div className="relative rounded-2xl overflow-hidden bg-[#0a0a0a]">
            <div className="relative overflow-hidden">
              <img
                src={backdropImage}
                alt={movieTitle}
                className="w-full aspect-video object-cover transition-all duration-700 group-hover/movie:scale-110 group-hover/movie:brightness-110"
                loading="lazy" decoding="async"
                onError={(e) => { e.currentTarget.src = getDemoMovieImage(index, 'backdrop'); }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-85 group-hover/movie:opacity-95 transition-opacity duration-500" />
              <div className="absolute inset-0 -translate-x-full group-hover/movie:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/movie:opacity-100 transition-all duration-400">
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-red-500/50 animate-ping" />
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-2xl shadow-red-600/60 ring-2 ring-white/40">
                    <FaPlay className="text-white text-lg ml-1" />
                  </div>
                </div>
              </div>

              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-xl rounded-full px-3 py-1.5 border border-yellow-500/50 z-10 shadow-lg">
                <FaStar className="text-yellow-400 text-[10px]" />
                <span className="text-white text-[11px] font-black">{movieRating}</span>
              </div>

              <div className="absolute top-3 right-14 bg-gradient-to-r from-red-600 to-rose-600 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/30 z-10 shadow-lg">
                <span className="text-white text-[10px] font-black tracking-wider">HD</span>
              </div>

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setIsLiked(!isLiked); }}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/80 backdrop-blur-xl border border-white/25 flex items-center justify-center hover:bg-black/95 hover:border-red-500/60 transition-all duration-300 z-10 hover:scale-110"
                aria-label="like"
              >
                <FaHeart className={`text-xs transition-colors ${isLiked ? 'text-red-500' : 'text-white/80'}`} />
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-red-600 to-rose-600 rounded-full text-white text-[9px] font-black shadow-lg">
                    <FaFire className="text-[8px]" />{movieGenre}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/15 backdrop-blur-xl rounded-full text-white text-[9px] font-bold border border-white/25">
                    {movieYear}
                  </span>
                </div>
                <h3 className="text-white font-black text-base md:text-lg line-clamp-1 group-hover/movie:text-red-400 transition-colors duration-300 drop-shadow-lg">
                  {movieTitle}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-gray-200 text-[11px] font-semibold">
                  <span className="flex items-center gap-1"><FaClock className="text-[9px] text-red-400" />{movieDuration}</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full" />
                  <span className="flex items-center gap-1"><FaFilm className="text-[9px] text-red-400" />Movie</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </TiltCard>
  );
};

// ============================================================
// 🎬 LandscapeEpisodeCard
// ============================================================
const LandscapeEpisodeCard = ({ episode, index = 0, accent = 'blue' }) => {
  const accents = {
    blue: { border: 'group-hover/ep:from-blue-500/60 group-hover/ep:to-cyan-500/60', play: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/60', ping: 'bg-blue-400/50', text: 'group-hover/ep:text-blue-400', chip: 'from-blue-600 to-cyan-600' },
    purple: { border: 'group-hover/ep:from-purple-500/60 group-hover/ep:to-fuchsia-500/60', play: 'from-purple-500 to-fuchsia-500', shadow: 'shadow-purple-500/60', ping: 'bg-purple-400/50', text: 'group-hover/ep:text-purple-400', chip: 'from-purple-600 to-fuchsia-600' },
  };
  const a = accents[accent] || accents.blue;

  const image = useMemo(() => {
    if (isValidThumbnail(episode.thumbnail)) return fixUrl(episode.thumbnail);
    if (isValidThumbnail(episode.still_path)) return `https://image.tmdb.org/t/p/original${episode.still_path}`;
    if (isValidThumbnail(episode.backdrop)) return fixUrl(episode.backdrop);
    if (isValidThumbnail(episode._seriesBackdrop)) return fixUrl(episode._seriesBackdrop);
    if (isValidThumbnail(episode._seriesPoster)) return fixUrl(episode._seriesPoster);
    return getDemoSeriesImage(index, 'backdrop');
  }, [episode, index]);

  const seriesTitle = episode._seriesTitleAr || episode._seriesTitle || 'مسلسل';
  const episodeTitle = episode.title_ar || episode.titleAr || episode.title || episode.name || 'حلقة جديدة';
  const epNumber = episode.episode_number || episode.number || index + 1;
  const seasonNumber = episode._seasonNumber || episode.season_number || 1;
  const duration = episode.duration || episode.runtime || '45min';
  const rating = episode.rating || episode.vote_average || '8.0';

  return (
    <TiltCard>
      <Link to={`/series/${episode._seriesId}/episode/${episode.id}`} className="block group/ep">
        <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-b from-white/[0.12] to-white/[0.03] p-[1.5px] transition-all duration-500 ${a.border} shadow-lg shadow-black/50 group-hover/ep:shadow-2xl`}>
          <div className="relative rounded-2xl overflow-hidden bg-[#0a0a0a]">
            <div className="relative overflow-hidden">
              <img
                src={image}
                alt={episodeTitle}
                className="w-full aspect-video object-cover transition-all duration-700 group-hover/ep:scale-110 group-hover/ep:brightness-110"
                loading="lazy" decoding="async"
                onError={(e) => { e.currentTarget.src = getDemoSeriesImage(index, 'backdrop'); }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-85 group-hover/ep:opacity-95 transition-opacity duration-500" />
              <div className="absolute inset-0 -translate-x-full group-hover/ep:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/ep:opacity-100 transition-all duration-400">
                <div className="relative">
                  <span className={`absolute inset-0 rounded-full ${a.ping} animate-ping`} />
                  <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${a.play} flex items-center justify-center shadow-2xl ${a.shadow} ring-2 ring-white/40`}>
                    <FaPlay className="text-white text-lg ml-1" />
                  </div>
                </div>
              </div>

              <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                <div className={`bg-gradient-to-r ${a.chip} backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/30 shadow-lg`}>
                  <span className="text-white text-[10px] font-black tracking-wider">
                    S{String(seasonNumber).padStart(2, '0')} · E{String(epNumber).padStart(2, '0')}
                  </span>
                </div>
              </div>
              <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-xl rounded-full px-3 py-1.5 flex items-center gap-1 border border-yellow-500/50 z-10 shadow-lg">
                <FaStar className="text-yellow-400 text-[10px]" />
                <span className="text-white text-[10px] font-black">{rating}</span>
              </div>

              <div className="absolute bottom-3 right-3 bg-gradient-to-r from-green-500 to-emerald-500 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/30 z-10 shadow-lg flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span className="text-white text-[9px] font-black tracking-wider">NEW</span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-1.5 drop-shadow-lg">
                  {seriesTitle}
                </p>
                <h3 className={`text-white font-black text-base md:text-lg line-clamp-1 transition-colors duration-300 drop-shadow-lg ${a.text}`}>
                  {episodeTitle}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-gray-200 text-[11px] font-semibold">
                  <span className="flex items-center gap-1"><FaTv className="text-[9px]" />Season {seasonNumber}</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full" />
                  <span className="flex items-center gap-1"><FaClock className="text-[9px]" />{duration}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </TiltCard>
  );
};

// ============================================================
// 🎴 SeriesCard
// ============================================================
const SeriesCard = ({ serie, index = 0, accent = 'blue' }) => {
  const { t } = useLanguage();
  const accents = {
    blue: { border: 'group-hover/card:from-blue-500/50 group-hover/card:to-cyan-500/50', play: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/60', ping: 'bg-blue-400/40', text: 'group-hover/card:text-blue-400' },
    purple: { border: 'group-hover/card:from-purple-500/50 group-hover/card:to-fuchsia-500/50', play: 'from-purple-500 to-fuchsia-500', shadow: 'shadow-purple-500/60', ping: 'bg-purple-400/40', text: 'group-hover/card:text-purple-400' },
  };
  const a = accents[accent] || accents.blue;

  const posterImage = useMemo(() => {
    const fixed = fixUrl(serie.poster) || fixUrl(serie.backdrop);
    if (isValidThumbnail(fixed)) return fixed;
    return getDemoSeriesImage(index, 'poster');
  }, [serie.poster, serie.backdrop, index]);

  return (
    <TiltCard>
      <Link to={`/series/${serie.id}`} className="block group/card">
        <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-b from-white/[0.12] to-white/[0.03] p-[1.5px] transition-all duration-500 ${a.border} shadow-lg shadow-black/50 group-hover/card:shadow-2xl`}>
          <div className="relative rounded-2xl overflow-hidden bg-[#0a0a0a]">
            <div className="relative overflow-hidden">
              <img
                src={posterImage}
                alt={serie.title || ''}
                className="w-full aspect-[2/3] object-cover transition-all duration-700 group-hover/card:scale-110 group-hover/card:brightness-110"
                loading="lazy" decoding="async"
                onError={(e) => { e.currentTarget.src = getDemoSeriesImage(index, 'poster'); }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90 group-hover/card:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12" />

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-400">
                <span className={`absolute w-20 h-20 rounded-full ${a.ping} animate-ping`} />
                <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${a.play} flex items-center justify-center shadow-2xl ${a.shadow} ring-2 ring-white/40`}>
                  <FaPlay className="text-white text-lg ml-1" />
                </div>
              </div>

              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-xl rounded-full px-3 py-1.5 flex items-center gap-1 border border-yellow-500/50 z-10 shadow-lg">
                <FaStar className="text-yellow-400 text-[10px]" />
                <span className="text-white text-[10px] font-black">{serie.rating || '?'}</span>
              </div>

              {serie.seasons && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-red-600 to-rose-600 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/30 z-10 shadow-lg">
                  <span className="text-white text-[9px] font-black">
                    {Array.isArray(serie.seasons) ? serie.seasons.length : serie.seasons} {t('series.seasons') || 'مواسم'}
                  </span>
                </div>
              )}

              {serie.genre && (
                <div className="absolute bottom-3 left-3 z-10">
                  <span className="inline-block text-[10px] font-black text-white/95 bg-white/15 backdrop-blur-xl rounded-full px-3 py-1 border border-white/25">
                    {serie.genre}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 px-1">
          <h3 className={`text-white font-bold text-sm line-clamp-1 transition-colors duration-300 ${a.text}`}>
            {serie.title_ar || serie.titleAr || serie.title}
          </h3>
          <div className="flex items-center gap-1.5 text-gray-400 text-[11px] mt-1 font-semibold">
            <FaCalendarAlt className="text-[9px]" />
            <span>{serie.year || '2024'}</span>
          </div>
        </div>
      </Link>
    </TiltCard>
  );
};

// ============================================================
// 🎴 ClipCard
// ============================================================
const ClipCard = ({ clip }) => {
  const artistName = clip.artist_name || clip.artist || clip.artistName;
  return (
    <TiltCard>
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
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/60 ring-2 ring-white/40">
                    <FaPlay className="text-white text-lg ml-1" />
                  </div>
                </div>
              </div>

              <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                <div className="bg-black/80 backdrop-blur-xl rounded-full px-3 py-1.5 border border-emerald-500/50 flex items-center gap-1 shadow-lg">
                  <FaMusic className="text-emerald-400 text-[9px]" />
                  <span className="text-white text-[10px] font-black">Music</span>
                </div>
              </div>

              {clip.duration && (
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/25 z-10 shadow-lg">
                  <span className="text-white text-[10px] font-black">{clip.duration}</span>
                </div>
              )}

              {artistName && (
                <div className="absolute bottom-3 right-3 bg-gradient-to-r from-emerald-600 to-teal-600 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/30 z-10 shadow-lg">
                  <span className="text-white text-[10px] font-black">{artistName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 px-1">
          <h3 className="text-white font-bold text-sm line-clamp-1 group-hover/card:text-emerald-400 transition-colors duration-300">
            {clip.title}
          </h3>
          <p className="text-gray-400 text-[11px] mt-1 line-clamp-1 font-semibold">
            {clip.genre || 'Music'}
          </p>
        </div>
      </Link>
    </TiltCard>
  );
};

// ============================================================
// ✅ Skeleton
// ============================================================
const HomeSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#1a0a0a] via-[#0f0a1a] to-[#0a0f1a]">
    <div className="relative h-[50vh] w-full bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-black/50 animate-pulse" />
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-10 space-y-14">
      {[1, 2, 3, 4, 5, 6].map((s) => (
        <div key={s}>
          <div className="h-6 w-48 bg-white/10 rounded mb-6 animate-pulse" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((c) => (
              <div key={c} className="flex-shrink-0 w-[320px]">
                <div className="aspect-video bg-white/5 rounded-2xl animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// ✅ ثوابت
// ============================================================
const MOVIE_CATEGORIES = ['arabwood', 'hollywood', 'bollywood', 'european', 'asian'];
const SERIES_CATEGORIES = ['arabic', 'foreign', 'indian', 'turkish', 'korean'];

// ============================================================
// ✅ المكوّن الرئيسي
// ============================================================
const HomePage = () => {
  const [latestMovies, setLatestMovies] = useState([]);
  const [latestSeries, setLatestSeries] = useState([]);
  const [latestAnimation, setLatestAnimation] = useState([]);
  const [latestClips, setLatestClips] = useState([]);
  const [latestSeriesEpisodes, setLatestSeriesEpisodes] = useState([]);
  const [latestAnimationEpisodes, setLatestAnimationEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const safe = (fn) => fn().catch((e) => { warn('API error:', e?.message || e); return []; });

    const loadAllData = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        Promise.all(MOVIE_CATEGORIES.map((c) => safe(() => moviesAPI.getByCategory(c)))),
        Promise.all(SERIES_CATEGORIES.map((c) => safe(() => seriesAPI.getByCategory(c)))),
        safe(() => moviesAPI.getByCategory('animation')),
        safe(() => seriesAPI.getByCategory('animation')),
        safe(() => clipsAPI.getAll()),
      ]);

      if (!mounted || controller.signal.aborted) return;
      const valueOf = (r) => (r.status === 'fulfilled' ? r.value : []);

      const allMovies = valueOf(results[0]).flat().filter(Boolean);
      const sortedMovies = sortByCreatedAtDesc(allMovies);

      const allSeries = valueOf(results[1]).flat().filter(Boolean);
      const sortedSeries = sortByCreatedAtDesc(allSeries);

      const animMovies = Array.isArray(valueOf(results[2])) ? valueOf(results[2]) : [];
      const animSeries = Array.isArray(valueOf(results[3])) ? valueOf(results[3]) : [];
      const allAnimation = sortByCreatedAtDesc([...animMovies, ...animSeries].filter(Boolean));

      const clips = Array.isArray(valueOf(results[4])) ? valueOf(results[4]) : [];
      const sortedClips = sortByCreatedAtDesc(clips);

      const seriesEpisodes = extractLatestEpisodes(sortedSeries, 12);
      const animationEpisodes = extractLatestEpisodes(sortByCreatedAtDesc(animSeries.filter(Boolean)), 12);

      if (!mounted || controller.signal.aborted) return;

      setLatestMovies(sortedMovies.slice(0, 12));
      setLatestSeries(sortedSeries.slice(0, 12));
      setLatestAnimation(allAnimation.slice(0, 12));
      setLatestClips(sortedClips.slice(0, 12));
      setLatestSeriesEpisodes(seriesEpisodes);
      setLatestAnimationEpisodes(animationEpisodes);

      setLoading(false);
    };

    loadAllData();
    return () => { mounted = false; controller.abort(); };
  }, []);

  if (loading) return <HomeSkeleton />;

  return (
    <div className="min-h-screen bg-[#0a0510] relative">
      <AmbientBackground movies={latestMovies} series={latestSeries} />

      <div className="relative z-10">
        {latestMovies.length > 0 && <HeroSlider movies={latestMovies} />}

        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-12 md:py-20 space-y-16 md:space-y-24">

          {latestMovies.length > 0 && (
            <Section title="أحدث الأفلام" viewAll="/movies" icon={<FaFilm />} accent="red" count={latestMovies.length}>
              <ScrollableRow
                items={latestMovies}
                itemWidth="w-[300px] xs:w-[320px] sm:w-[360px] md:w-[400px] lg:w-[440px]"
                renderItem={(movie, index) => <LandscapeMovieCard movie={movie} index={index} />}
              />
            </Section>
          )}

          {latestSeries.length > 0 && (
            <Section title="أحدث المسلسلات" viewAll="/series" icon={<FaTv />} accent="blue" count={latestSeries.length}>
              <ScrollableRow
                items={latestSeries}
                itemWidth="w-[140px] xs:w-[150px] sm:w-[170px] md:w-[190px] lg:w-[210px]"
                renderItem={(serie, index) => <SeriesCard serie={serie} index={index} accent="blue" />}
              />
            </Section>
          )}

          {latestSeriesEpisodes.length > 0 && (
            <Section title="أحدث حلقات المسلسلات" viewAll="/series" icon={<FaPlay />} accent="blue" count={latestSeriesEpisodes.length}>
              <ScrollableRow
                items={latestSeriesEpisodes}
                itemWidth="w-[300px] xs:w-[320px] sm:w-[360px] md:w-[400px] lg:w-[440px]"
                renderItem={(episode, index) => (
                  <LandscapeEpisodeCard episode={episode} index={index} accent="blue" />
                )}
              />
            </Section>
          )}

          {latestAnimation.length > 0 && (
            <Section title="أحدث الرسوم المتحركة" viewAll="/animation" icon={<FaMagic />} accent="purple" count={latestAnimation.length}>
              <ScrollableRow
                items={latestAnimation}
                itemWidth="w-[140px] xs:w-[150px] sm:w-[170px] md:w-[190px] lg:w-[210px]"
                renderItem={(item, index) => <SeriesCard serie={item} index={index} accent="purple" />}
              />
            </Section>
          )}

          {latestAnimationEpisodes.length > 0 && (
            <Section title="أحدث حلقات الرسوم المتحركة" viewAll="/animation" icon={<FaPlay />} accent="purple" count={latestAnimationEpisodes.length}>
              <ScrollableRow
                items={latestAnimationEpisodes}
                itemWidth="w-[300px] xs:w-[320px] sm:w-[360px] md:w-[400px] lg:w-[440px]"
                renderItem={(episode, index) => (
                  <LandscapeEpisodeCard episode={episode} index={index} accent="purple" />
                )}
              />
            </Section>
          )}

          {latestClips.length > 0 && (
            <Section title="أحدث الكليبات" viewAll="/clips" icon={<FaMusic />} accent="green" count={latestClips.length}>
              <ScrollableRow
                items={latestClips}
                itemWidth="w-[220px] sm:w-[260px] md:w-[300px] lg:w-[340px]"
                renderItem={(clip) => <ClipCard clip={clip} />}
              />
            </Section>
          )}

          {latestClips.length === 0 && (
            <Section title="أحدث الكليبات" viewAll="/clips" icon={<FaMusic />} accent="green">
              <div className="text-center py-16 bg-white/[0.03] rounded-2xl border border-white/10 backdrop-blur-md">
                <FaMusic className="text-gray-500 text-4xl mx-auto mb-3" />
                <p className="text-gray-400 text-sm">لا توجد كليبات متاحة حالياً</p>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;