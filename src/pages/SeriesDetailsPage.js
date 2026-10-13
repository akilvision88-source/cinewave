// src/pages/SeriesDetailsPage.js - النسخة الكاملة بنفس النمط الموحّد
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import AdvancedHTML5Player from '../components/AdvancedHTML5Player';
import { seriesAPI, watchlistAPI } from '../services/api';
import { motion } from 'framer-motion';
import {
  FaStar, FaShare, FaCalendarAlt,
  FaClock, FaFilm, FaArrowLeft, FaPlay, FaList, FaStepForward,
  FaCheckCircle, FaCheck, FaClosedCaptioning, FaHeadphones,
  FaGlobe, FaInfoCircle, FaUsers, FaUserTie,
  FaMapMarkerAlt, FaTag, FaHeart, FaRegHeart,
  FaWhatsapp, FaFacebookF, FaInstagram, FaLink, FaTimes,
  FaSearch
} from 'react-icons/fa';

// ============================================================
// ثوابت
// ============================================================
const API_BASE = 'http://192.168.11.88:5000';

const getFullVideoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('/data') || url.startsWith('/api')) return `${API_BASE}${url}`;
  if (url.startsWith('data/')) return `${API_BASE}/${url}`;
  if (url.startsWith('http')) return url;
  return `${API_BASE}/${url}`;
};

// ============================================================
// localStorage Helpers
// ============================================================
const LAST_EPISODE_KEY = (seriesId) => `cinewave_last_episode_${seriesId}`;
const PROGRESS_KEY = (seriesId, episodeId) => `cinewave_progress_series_${seriesId}_ep_${episodeId}`;

const saveLastWatchedEpisode = (seriesId, episode) => {
  try {
    if (!seriesId || !episode) return;
    localStorage.setItem(LAST_EPISODE_KEY(seriesId), JSON.stringify({
      episodeId: episode.id,
      seasonNum: episode.season_num || 1,
      episodeNum: episode.episode_num,
      title: episode.title,
      watchedAt: new Date().toISOString(),
    }));
  } catch (e) { console.error(e); }
};

const getLastWatchedEpisode = (seriesId) => {
  try {
    const raw = localStorage.getItem(LAST_EPISODE_KEY(seriesId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const saveEpisodeProgress = (seriesId, episodeId, currentTime, duration, percent) => {
  try {
    if (!seriesId || !episodeId || !duration) return;
    localStorage.setItem(PROGRESS_KEY(seriesId, episodeId), JSON.stringify({
      currentTime, duration, percent,
      savedAt: new Date().toISOString()
    }));
  } catch (e) { console.error(e); }
};

const getEpisodeProgress = (seriesId, episodeId) => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY(seriesId, episodeId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const USER_RATING_KEY = (seriesId) => `cinewave_user_rating_${seriesId}`;
const saveUserRating = (seriesId, rating) => { try { localStorage.setItem(USER_RATING_KEY(seriesId), String(rating)); } catch {} };
const getUserRating = (seriesId) => { try { const v = localStorage.getItem(USER_RATING_KEY(seriesId)); return v ? parseInt(v) : 0; } catch { return 0; } };

const WATCHED_KEY = (seriesId) => `cinewave_watched_${seriesId}`;
const saveWatchedEpisodes = (seriesId, watchedIds) => { try { localStorage.setItem(WATCHED_KEY(seriesId), JSON.stringify(watchedIds)); } catch {} };
const getWatchedEpisodes = (seriesId) => { try { const raw = localStorage.getItem(WATCHED_KEY(seriesId)); return raw ? JSON.parse(raw) : []; } catch { return []; } };

// ============================================================
// AutoVideoThumbnail
// ============================================================
const AutoVideoThumbnail = ({ videoUrl, episodeId, fallback, alt, className }) => {
  const [thumbnail, setThumbnail] = useState(fallback);

  useEffect(() => {
    if (!videoUrl) return;
    const cacheKey = `thumb_ep_${episodeId || 'unknown'}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setThumbnail(cached); return; }

    let cancelled = false;
    fetch(`${API_BASE}/api/thumbnail-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl }),
    })
      .then(res => res.json())
      .then(data => {
        if (cancelled || !data.thumbnail) return;
        const fullUrl = `${API_BASE}${data.thumbnail}`;
        setThumbnail(fullUrl);
        localStorage.setItem(cacheKey, fullUrl);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [videoUrl, episodeId]);

  return (
    <img
      src={thumbnail}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => { if (fallback && e.target.src !== fallback) e.target.src = fallback; }}
    />
  );
};

// ============================================================
// EpisodeCard
// ============================================================
const EpisodeCard = ({
  episode, index, isSelected, isLastWatched, isWatched,
  series, onWatch, onToggleWatched, getEpisodeTitle, episodeProgress
}) => {
  const fullUrl = getFullVideoUrl(episode.video_url);
  const progressPercent = episodeProgress?.percent || 0;
  const hasProgress = progressPercent > 1 && progressPercent < 98;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.4) }}
      onClick={() => onWatch(episode)}
      className={`group/ep relative flex flex-col rounded-2xl cursor-pointer transition-all duration-300 border overflow-hidden ${
        isSelected
          ? 'bg-gradient-to-b from-red-600/30 to-red-600/5 border-red-500/60 shadow-lg shadow-red-600/30'
          : isWatched
          ? 'bg-gradient-to-b from-emerald-600/15 to-emerald-600/5 border-emerald-500/30'
          : isLastWatched
          ? 'bg-gradient-to-b from-purple-600/20 to-purple-600/5 border-purple-500/40'
          : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 hover:border-white/20 hover:shadow-lg hover:shadow-black/40'
      }`}
    >
      <div className="relative w-full aspect-video overflow-hidden bg-[#0d1015]">
        <AutoVideoThumbnail
          videoUrl={fullUrl}
          episodeId={episode.id}
          fallback={episode.thumbnail || series.poster}
          alt={getEpisodeTitle(episode)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover/ep:scale-110 ${
            isWatched && !isSelected ? 'opacity-70' : ''
          }`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover/ep:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/50 scale-0 group-hover/ep:scale-100 transition-transform duration-300">
            <FaPlay className="text-white text-xs ml-0.5" />
          </div>
        </div>

        <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-md rounded-lg px-2 py-0.5 border border-white/20 z-10">
          <span className="text-white text-[10px] font-bold">EP {episode.episode_num}</span>
        </div>

        {isSelected && (
          <div className="absolute top-1.5 right-1.5 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[9px] font-bold rounded-full px-2 py-0.5 flex items-center gap-1 z-10">
            <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
            قيد التشغيل
          </div>
        )}
        {!isSelected && isLastWatched && (
          <div className="absolute top-1.5 right-1.5 bg-purple-600 text-white text-[9px] font-bold rounded-full px-2 py-0.5 flex items-center gap-1 z-10">
            <FaCheckCircle className="text-[8px]" />
            مؤخراً
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onToggleWatched(episode.id); }}
          className={`absolute bottom-1.5 right-1.5 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border shadow-md ${
            isWatched
              ? 'bg-emerald-600 border-emerald-400 hover:bg-emerald-700 scale-100'
              : 'bg-black/70 border-white/20 hover:bg-emerald-600 opacity-0 group-hover/ep:opacity-100 scale-90'
          }`}
          title={isWatched ? 'إزالة من المشاهد' : 'وضع علامة كمشاهد'}
        >
          <FaCheck className={`text-[10px] ${isWatched ? 'text-white' : 'text-gray-300'}`} />
        </button>

        {hasProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
            <div className="h-full bg-gradient-to-r from-red-600 to-rose-500" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between">
        <h3 className={`text-xs font-bold line-clamp-2 leading-tight transition-colors ${
          isSelected ? 'text-red-400' : 'text-white group-hover/ep:text-red-400'
        }`} title={getEpisodeTitle(episode)}>
          {getEpisodeTitle(episode)}
        </h3>
        <div className="flex items-center gap-2 text-gray-500 text-[10px] mt-2 flex-wrap">
          <span className="font-mono font-bold">S{episode.season_num || 1}E{episode.episode_num}</span>
          {episode.duration && (
            <>
              <span className="w-1 h-1 bg-gray-600 rounded-full" />
              <span className="flex items-center gap-1"><FaClock className="text-[8px]" />{episode.duration}</span>
            </>
          )}
          {hasProgress && (
            <>
              <span className="w-1 h-1 bg-gray-600 rounded-full" />
              <span className="text-red-400 font-bold">{Math.round(progressPercent)}%</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================
// UserRating
// ============================================================
const UserRating = ({ initialRating, onRate }) => {
  const [rating, setRating] = useState(initialRating || 0);
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-300 text-xs font-bold hidden sm:inline">تقييمك :</span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => { setRating(star); onRate(star); }}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-125 focus:outline-none"
          >
            <FaStar className={`text-base transition-colors ${
              star <= (hover || rating)
                ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]'
                : 'text-gray-600 hover:text-yellow-300'
            }`} />
          </button>
        ))}
      </div>
      {rating > 0 && <span className="text-yellow-400 text-xs font-black">{rating}/5</span>}
    </div>
  );
};

// ============================================================
// SeriesProgress
// ============================================================
const SeriesProgress = ({ watchedCount, totalEpisodes }) => {
  if (totalEpisodes === 0) return null;
  const percent = Math.round((watchedCount / totalEpisodes) * 100);

  return (
    <div className="mt-3 w-full max-w-md">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-gray-200 text-xs font-bold flex items-center gap-1.5">
          <FaCheckCircle className="text-emerald-400 text-[11px]" />
          {watchedCount}/{totalEpisodes} حلقة مشاهدَة
        </span>
        <span className="text-emerald-400 text-xs font-black">{percent}%</span>
      </div>
      <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 rounded-full shadow-lg shadow-emerald-500/40"
        />
      </div>
    </div>
  );
};

// ============================================================
// FilterPills
// ============================================================
const FilterPills = ({ activeFilter, setActiveFilter, counts }) => {
  const filters = [
    { key: 'all', label: 'الكل', color: 'from-red-500 to-rose-600' },
    { key: 'unwatched', label: 'غير مشاهد', color: 'from-gray-500 to-gray-700' },
    { key: 'watched', label: 'مشاهد', color: 'from-emerald-500 to-teal-600' },
    { key: 'current', label: 'الحالي', color: 'from-purple-500 to-fuchsia-600' },
  ];

  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {filters.map((f) => {
        const isActive = activeFilter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs transition-all duration-300 ${
              isActive
                ? `bg-gradient-to-br ${f.color} text-white shadow-lg shadow-red-600/30 scale-105`
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <span>{f.label}</span>
            <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${
              isActive ? 'bg-white/25 text-white' : 'bg-black/40 text-gray-400'
            }`}>
              {counts[f.key] || 0}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ============================================================
// Recommendations
// ============================================================
const Recommendations = ({ series, language }) => {
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilar = async () => {
      if (!series?.id) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/series/${series.id}/similar`);
        if (res.ok) {
          const data = await res.json();
          setSimilar(Array.isArray(data) ? data.slice(0, 12) : []);
        } else {
          const fallbackRes = await fetch(`${API_BASE}/api/series?category=${series.category}&limit=13`);
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            const list = Array.isArray(data) ? data : data.series || [];
            setSimilar(list.filter(s => s.id !== series.id).slice(0, 12));
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchSimilar();
  }, [series?.id, series?.category]);

  const getTitle = (s) => {
    if (language === 'ar') return s.title_ar || s.title;
    if (language === 'fr') return s.title_fr || s.title;
    return s.title;
  };

  if (loading) {
    return (
      <section className="bg-white/[0.03] rounded-2xl p-5 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
            <FaFilm className="text-white text-xs" />
          </div>
          <h2 className="text-white text-base font-bold">مسلسلات مشابهة</h2>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (similar.length === 0) return null;

  return (
    <section className="bg-white/[0.03] rounded-2xl p-5 border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
          <FaFilm className="text-white text-sm" />
        </div>
        <div>
          <h2 className="text-white text-lg font-bold">مسلسلات مشابهة</h2>
          <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-transparent rounded-full mt-1" />
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
        {similar.map((s) => (
          <Link
            key={s.id}
            to={`/series/${s.id}`}
            className="group relative rounded-lg overflow-hidden bg-[#151515] border border-white/5 hover:border-red-500/50 transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-lg hover:shadow-black/50"
          >
            <div className="aspect-[2/3] overflow-hidden">
              <img src={s.poster} alt={getTitle(s)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
            <div className="absolute bottom-0 left-0 right-0 p-1.5">
              <p className="text-white text-[10px] font-bold line-clamp-2 leading-tight">{getTitle(s)}</p>
              {s.rating && (
                <p className="text-yellow-400 text-[9px] font-bold mt-0.5 flex items-center gap-0.5">
                  <FaStar className="text-[7px]" /> {s.rating}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

// ============================================================
// InfoModal
// ============================================================
const InfoModal = ({ isOpen, onClose, series, selectedEpisode, totalSeasons, totalEpisodes, lastWatched }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#21262d] rounded-2xl max-w-2xl w-full border border-white/10 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-emerald-900/40 to-teal-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <FaInfoCircle className="text-white text-sm" />
            </div>
            <div>
              <h3 className="text-white text-lg font-bold">معلومات إضافية</h3>
              <p className="text-gray-400 text-xs">تفاصيل المسلسل</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition"><FaTimes /></button>
        </div>

        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto">
          <InfoModalCard icon={<FaMapMarkerAlt />} label="البلد" value={series.country || '—'} color="from-blue-500 to-cyan-600" />
          <InfoModalCard icon={<FaTag />} label="التصنيف" value={series.genre || '—'} color="from-pink-500 to-rose-600" />
          <InfoModalCard icon={<FaCalendarAlt />} label="السنة" value={series.year || '—'} color="from-orange-500 to-amber-600" />
          <InfoModalCard icon={<FaList />} label="المواسم" value={totalSeasons} color="from-purple-500 to-violet-600" />
          <InfoModalCard icon={<FaPlay />} label="الحلقات" value={totalEpisodes} color="from-red-500 to-rose-600" />
          <InfoModalCard icon={<FaHeadphones />} label="الصوت" value={selectedEpisode?.audio_tracks?.length || 0} color="from-emerald-500 to-teal-600" />
          <InfoModalCard icon={<FaClosedCaptioning />} label="الترجمات" value={selectedEpisode?.subtitles?.length || 0} color="from-indigo-500 to-blue-600" />
          <InfoModalCard icon={<FaStar />} label="التقييم" value={`${series.rating || '—'}/10`} color="from-yellow-500 to-amber-600" />
          <InfoModalCard icon={<FaUserTie />} label="المخرج" value={series.director || '—'} color="from-teal-500 to-cyan-600" />
        </div>

        {lastWatched && (
          <div className="px-5 pb-3">
            <div className="bg-purple-600/10 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-1">
                <FaCheckCircle className="text-purple-400 text-xs" />
                <p className="text-purple-400 text-xs uppercase tracking-wide font-semibold">آخر حلقة مشاهدَة</p>
              </div>
              <p className="text-white text-sm font-bold">
                الموسم {lastWatched.seasonNum} · الحلقة {lastWatched.episodeNum}
                {lastWatched.title && ` — ${lastWatched.title}`}
              </p>
            </div>
          </div>
        )}

        {series.cast && (
          <div className="px-5 pb-5">
            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <FaUsers className="text-purple-400 text-xs" />
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">الممثلون</p>
              </div>
              <p className="text-white text-sm leading-relaxed">{series.cast}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoModalCard = ({ icon, label, value, color }) => (
  <div className="group relative bg-black/30 hover:bg-black/50 rounded-xl p-3 border border-white/5 hover:border-white/15 transition-all duration-300 overflow-hidden">
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
    <div className="relative flex flex-col items-center text-center gap-1.5">
      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
        <span className="text-white text-xs">{icon}</span>
      </div>
      <p className="text-gray-400 text-[10px] uppercase tracking-wide font-semibold">{label}</p>
      <p className="text-white text-xs font-bold truncate w-full" title={value}>{value}</p>
    </div>
  </div>
);

// ============================================================
// SeriesDetailsPage الرئيسي
// ============================================================
const SeriesDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showHistoryToast, setShowHistoryToast] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [expandedSeason, setExpandedSeason] = useState(1);
  const [isToggling, setIsToggling] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: 'success' });

  const [lastWatchedId, setLastWatchedId] = useState(null);
  const [lastWatchedInfo, setLastWatchedInfo] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [watchedEpisodes, setWatchedEpisodes] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [resumeTime, setResumeTime] = useState(0);
  const [episodeProgressMap, setEpisodeProgressMap] = useState({});

  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const lastSavedRef = useRef(0);
  const selectedEpisodeRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => { selectedEpisodeRef.current = selectedEpisode; }, [selectedEpisode]);
  useEffect(() => { seriesRef.current = series; }, [series]);

  const showToast = (message, type = 'success') => {
    setToastMessage({ text: message, type });
    setTimeout(() => setToastMessage({ text: '', type: 'success' }), 2500);
  };

  const handleProgress = useCallback((currentTime, duration) => {
    if (!duration || duration <= 0 || currentTime <= 0) return;
    currentTimeRef.current = currentTime;
    durationRef.current = duration;
    const percent = (currentTime / duration) * 100;
    const currentSecond = Math.floor(currentTime);
    if (currentSecond - lastSavedRef.current >= 5 && percent > 1 && percent < 98) {
      lastSavedRef.current = currentSecond;
      const s = seriesRef.current;
      const ep = selectedEpisodeRef.current;
      if (s && ep) {
        saveEpisodeProgress(s.id, ep.id, currentTime, duration, percent);
        setEpisodeProgressMap(prev => ({ ...prev, [ep.id]: { currentTime, duration, percent } }));
      }
    }
  }, []);

  useEffect(() => {
    if (!series?.episodes) return;
    const map = {};
    series.episodes.forEach(ep => {
      const p = getEpisodeProgress(series.id, ep.id);
      if (p && p.percent > 1 && p.percent < 98) map[ep.id] = p;
    });
    setEpisodeProgressMap(map);
  }, [series]);

  const saveSeriesToHistory = (seriesData, episodeData) => {
    try {
      const history = localStorage.getItem('cinewave_watch_history');
      let historyArray = history ? JSON.parse(history) : [];
      const type = seriesData.category === 'animation' ? 'animation' : 'series';
      const historyItem = {
        id: seriesData.id, type,
        title: seriesData.title,
        title_ar: seriesData.title_ar || seriesData.title,
        poster: seriesData.poster,
        year: seriesData.year, rating: seriesData.rating, genre: seriesData.genre,
        season: episodeData.season_num, episode: episodeData.episode_num,
        episode_title: episodeData.title,
        progress: 0,
        watchedAt: new Date().toISOString(),
      };
      historyArray = historyArray.filter(item => !(item.id === seriesData.id && item.type === type));
      historyArray.unshift(historyItem);
      localStorage.setItem('cinewave_watch_history', JSON.stringify(historyArray.slice(0, 100)));
      setShowHistoryToast(true);
      setTimeout(() => setShowHistoryToast(false), 2000);
      window.dispatchEvent(new Event('historyUpdated'));
    } catch (error) { console.error(error); }
  };

  const toggleWatched = (episodeId) => {
    setWatchedEpisodes(prev => {
      const next = prev.includes(episodeId) ? prev.filter(x => x !== episodeId) : [...prev, episodeId];
      if (series?.id) saveWatchedEpisodes(series.id, next);
      return next;
    });
  };

  const markAsWatched = (episodeId) => {
    setWatchedEpisodes(prev => {
      if (prev.includes(episodeId)) return prev;
      const next = [...prev, episodeId];
      if (series?.id) saveWatchedEpisodes(series.id, next);
      return next;
    });
  };

  const handleWatchClick = (episode) => {
    if (!series) return;
    const fullVideoUrl = getFullVideoUrl(episode.video_url);
    const ep = { ...episode, video_url: fullVideoUrl };
    const progress = getEpisodeProgress(series.id, episode.id);
    if (progress && progress.percent > 1 && progress.percent < 98) setResumeTime(progress.currentTime);
    else setResumeTime(0);
    saveSeriesToHistory(series, ep);
    saveLastWatchedEpisode(series.id, ep);
    markAsWatched(episode.id);
    setLastWatchedId(episode.id);
    setLastWatchedInfo(getLastWatchedEpisode(series.id));
    setSelectedEpisode(ep);
    setShowPlayer(true);
    lastSavedRef.current = 0;
    currentTimeRef.current = 0;
    durationRef.current = 0;
  };

  const handleEpisodeChange = useCallback((episode) => {
    if (!episode || !seriesRef.current) return;
    const ct = currentTimeRef.current, d = durationRef.current;
    const currentEp = selectedEpisodeRef.current;
    if (currentEp && d > 0 && ct > 0) {
      const percent = (ct / d) * 100;
      if (percent > 1 && percent < 98) saveEpisodeProgress(seriesRef.current.id, currentEp.id, ct, d, percent);
    }
    const fullVideoUrl = getFullVideoUrl(episode.video_url);
    const ep = { ...episode, video_url: fullVideoUrl };
    const progress = getEpisodeProgress(seriesRef.current.id, episode.id);
    if (progress && progress.percent > 1 && progress.percent < 98) setResumeTime(progress.currentTime);
    else setResumeTime(0);
    saveSeriesToHistory(seriesRef.current, ep);
    saveLastWatchedEpisode(seriesRef.current.id, ep);
    markAsWatched(episode.id);
    setLastWatchedId(episode.id);
    setLastWatchedInfo(getLastWatchedEpisode(seriesRef.current.id));
    setSelectedEpisode(ep);
    lastSavedRef.current = 0;
    currentTimeRef.current = 0;
    durationRef.current = 0;
  }, []);

  const handleUserRate = (value) => {
    setUserRating(value);
    if (series?.id) saveUserRating(series.id, value);
    showToast(`✅ قمت بتقييم ${value}/5`);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!token || !!user);
  }, []);

  useEffect(() => {
    const check = async () => {
      if (isAuthenticated && id) {
        try {
          const result = await watchlistAPI.isInWatchlist(parseInt(id), 'series');
          setInWatchlist(!!result?.exists);
        } catch (error) { console.error(error); }
      }
    };
    check();
  }, [isAuthenticated, id]);

  const toggleWatchlist = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (isToggling) return;
    setIsToggling(true);
    try {
      if (inWatchlist) {
        await watchlistAPI.removeFromWatchlist(parseInt(id), 'series');
        setInWatchlist(false);
        showToast('✅ تمت الإزالة من المفضلة');
      } else {
        await watchlistAPI.addToWatchlist(parseInt(id), 'series');
        setInWatchlist(true);
        showToast('✅ تمت الإضافة إلى المفضلة');
      }
    } catch (error) { showToast('❌ حدث خطأ', 'error'); }
    finally { setIsToggling(false); }
  };

  useEffect(() => {
    const loadSeries = async () => {
      setLoading(true);
      try {
        const data = await seriesAPI.getById(id);
        if (data?.id) {
          const lastWatched = getLastWatchedEpisode(data.id);
          let initialEpisode = null;
          if (lastWatched?.episodeId && data.episodes?.length > 0) {
            initialEpisode = data.episodes.find(ep => ep.id === lastWatched.episodeId);
          }
          if (!initialEpisode && data.episodes?.length > 0) initialEpisode = data.episodes[0];
          if (initialEpisode) {
            const fullVideoUrl = getFullVideoUrl(initialEpisode.video_url);
            setSelectedEpisode({ ...initialEpisode, video_url: fullVideoUrl });
            setExpandedSeason(initialEpisode.season_num || 1);
          }
          if (lastWatched?.episodeId) {
            setLastWatchedId(lastWatched.episodeId);
            setLastWatchedInfo(lastWatched);
          }
          setUserRating(getUserRating(data.id));
          setWatchedEpisodes(getWatchedEpisodes(data.id));
          setSeries(data);
        }
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    loadSeries();
  }, [id]);

  const getTitle = () => {
    if (!series) return '';
    if (language === 'ar') return series.title_ar || series.title;
    if (language === 'fr') return series.title_fr || series.title;
    return series.title;
  };

  const getDescription = () => {
    if (!series) return '';
    if (language === 'ar') return series.description_ar || series.description;
    if (language === 'fr') return series.description_fr || series.description;
    return series.description;
  };

  const getEpisodeTitle = (episode) => {
    if (language === 'ar') return episode.title_ar || episode.title;
    if (language === 'fr') return episode.title_fr || episode.title;
    return episode.title;
  };

  const getCategoryIcon = (category) => {
    const icons = { arabic: '🇸🇦', foreign: '🌍', indian: '🇮🇳', turkish: '🇹🇷', korean: '🇰🇷', animation: '🎨' };
    return icons[category] || '📺';
  };

  const getCategoryName = (category) => {
    const names = {
      arabic: language === 'ar' ? 'مسلسلات عربية' : 'Arabic Series',
      foreign: language === 'ar' ? 'مسلسلات أجنبية' : 'Foreign Series',
      indian: language === 'ar' ? 'مسلسلات هندية' : 'Indian Series',
      turkish: language === 'ar' ? 'مسلسلات تركية' : 'Turkish Series',
      korean: language === 'ar' ? 'مسلسلات كورية' : 'Korean Series',
      animation: language === 'ar' ? 'رسوم متحركة' : 'Animation Series',
    };
    return names[category] || category;
  };

  const episodesBySeason = () => {
    if (!series?.episodes) return {};
    const seasons = {};
    series.episodes.forEach(ep => {
      const sn = ep.season_num || 1;
      if (!seasons[sn]) seasons[sn] = [];
      seasons[sn].push(ep);
    });
    return seasons;
  };

  const goToNextEpisode = () => {
    if (!series?.episodes || !selectedEpisode) return false;
    const idx = series.episodes.findIndex(ep => ep.id === selectedEpisode.id);
    if (idx < series.episodes.length - 1) { handleEpisodeChange(series.episodes[idx + 1]); return true; }
    return false;
  };

  const goToPreviousEpisode = () => {
    if (!series?.episodes || !selectedEpisode) return false;
    const idx = series.episodes.findIndex(ep => ep.id === selectedEpisode.id);
    if (idx > 0) { handleEpisodeChange(series.episodes[idx - 1]); return true; }
    return false;
  };

  const totalEpisodes = series?.episodes?.length || 0;
  const totalSeasons = Object.keys(episodesBySeason()).length;
  const watchedCount = watchedEpisodes.length;

  const formatSubtitlesForPlayer = () => {
    if (!selectedEpisode?.subtitles) return [];
    return selectedEpisode.subtitles.map(s => ({ lang: s.language, label: s.label, url: s.url, default: !!s.is_default }));
  };

  const formatAudioTracksForPlayer = () => {
    if (!selectedEpisode?.audio_tracks) return [];
    return selectedEpisode.audio_tracks.map(t => ({ lang: t.language, label: t.label, url: t.url, default: !!t.is_default }));
  };

  const seasons = episodesBySeason();
  const seasonNumbers = Object.keys(seasons).sort((a, b) => a - b);
  const hasAudioTracks = selectedEpisode?.audio_tracks?.length > 0;
  const hasSubtitles = selectedEpisode?.subtitles?.length > 0;

  const filteredEpisodes = useMemo(() => {
    const list = (seasons[expandedSeason] || []).slice().sort((a, b) => a.episode_num - b.episode_num);
    if (activeFilter === 'all') return list;
    if (activeFilter === 'watched') return list.filter(ep => watchedEpisodes.includes(ep.id));
    if (activeFilter === 'unwatched') return list.filter(ep => !watchedEpisodes.includes(ep.id));
    if (activeFilter === 'current') return list.filter(ep => ep.id === selectedEpisode?.id);
    return list;
  }, [seasons, expandedSeason, activeFilter, watchedEpisodes, selectedEpisode?.id]);

  const filterCounts = useMemo(() => {
    const list = seasons[expandedSeason] || [];
    return {
      all: list.length,
      watched: list.filter(ep => watchedEpisodes.includes(ep.id)).length,
      unwatched: list.filter(ep => !watchedEpisodes.includes(ep.id)).length,
      current: list.filter(ep => ep.id === selectedEpisode?.id).length,
    };
  }, [seasons, expandedSeason, watchedEpisodes, selectedEpisode?.id]);

  const getShareUrl = () => window.location.href;
  const getShareTitle = () => getTitle();
  const shareViaWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(`${getShareTitle()} - ${getShareUrl()}`)}`, '_blank'); setShowShareMenu(false); };
  const shareViaFacebook = () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`, '_blank', 'width=600,height=400'); setShowShareMenu(false); };
  const shareViaInstagram = async () => {
    try { await navigator.clipboard.writeText(`${getShareTitle()} - ${getShareUrl()}`); showToast('✅ تم نسخ الرابط'); setTimeout(() => window.open('https://www.instagram.com/', '_blank'), 800); }
    catch { showToast('❌ فشل النسخ', 'error'); }
    setShowShareMenu(false);
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(getShareUrl()); showToast('✅ تم نسخ الرابط'); }
    catch { showToast('❌ فشل النسخ', 'error'); }
    setShowShareMenu(false);
  };
  const shareNative = async () => {
    if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      try { await navigator.share({ title: getShareTitle(), text: `شاهد ${getShareTitle()} على Akil Tv`, url: getShareUrl() }); setShowShareMenu(false); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    setShowShareMenu(!showShareMenu);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1f242d]">
        <div className="relative h-[45vh] md:h-[55vh] bg-white/5 animate-pulse" />
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 space-y-6">
          <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-32 bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1f242d]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4"><span className="text-4xl">📺</span></div>
          <h1 className="text-2xl font-bold text-white mb-2">المسلسل غير موجود</h1>
          <p className="text-gray-400 mb-6">لم يتم العثور على المسلسل</p>
          <Link to="/series" className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2 rounded-lg hover:scale-105 transition">العودة إلى المسلسلات</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f242d] relative">
      {showHistoryToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2">
          <FaCheckCircle /> <span>تمت الإضافة إلى السجل</span>
        </div>
      )}
      {toastMessage.text && (
        <div className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[60] text-white px-4 py-2 rounded-full shadow-lg text-sm ${toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toastMessage.text}
        </div>
      )}

      {showPlayer ? (
        <div className="fixed inset-0 bg-black z-50">
          <div className="relative h-full">
            <button
              onClick={() => {
                const ct = currentTimeRef.current, d = durationRef.current;
                const s = seriesRef.current, ep = selectedEpisodeRef.current;
                if (s && ep && d > 0 && ct > 0) {
                  const percent = (ct / d) * 100;
                  if (percent > 1 && percent < 98) saveEpisodeProgress(s.id, ep.id, ct, d, percent);
                }
                setShowPlayer(false);
              }}
              className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-red-600 transition flex items-center gap-2 border border-white/20"
            >
              <FaArrowLeft size={18} /> <span className="text-sm hidden sm:inline">العودة</span>
            </button>
            <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md rounded-lg px-3 py-1 border border-white/20">
              <span className="text-white text-sm">{getTitle()} - حلقة {selectedEpisode?.episode_num}</span>
            </div>
            <div className="h-full flex items-center justify-center p-4">
              <div className="w-full max-w-6xl">
                {selectedEpisode && (
                  <AdvancedHTML5Player
                    videoUrl={selectedEpisode.video_url}
                    poster={selectedEpisode.thumbnail || series.poster}
                    title={`${getEpisodeTitle(selectedEpisode)} - ${getTitle()}`}
                    artist={series.title}
                    autoPlay={true}
                    startTime={resumeTime}
                    subtitles={formatSubtitlesForPlayer()}
                    audioTracks={formatAudioTracksForPlayer()}
                    defaultSubtitle={selectedEpisode?.default_subtitle || ''}
                    defaultAudio={selectedEpisode?.default_audio || ''}
                    videoId={`${series.id}_ep_${selectedEpisode.id}`}
                    episodes={series.episodes || []}
                    currentEpisodeId={selectedEpisode?.id || null}
                    onEpisodeChange={handleEpisodeChange}
                    contentType="series"
                    onProgress={handleProgress}
                    onEnded={() => { const hasNext = goToNextEpisode(); if (!hasNext) setTimeout(() => setShowPlayer(false), 2000); }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* HERO */}
          <div className="relative h-[45vh] sm:h-[50vh] md:h-[55vh] lg:h-[60vh] w-full overflow-hidden bg-[#0d1015]">
            <img src={series.backdrop || series.poster} alt={getTitle()} className="absolute inset-0 w-full h-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f242d] via-[#1f242d]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d1015]/85 via-[#0d1015]/40 to-transparent" />

            <button onClick={() => navigate(-1)} className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 bg-black/60 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-red-600 transition-all duration-300 flex items-center gap-2 border border-white/20 hover:scale-105">
              <FaArrowLeft size={18} /> <span className="text-sm hidden sm:inline">العودة</span>
            </button>

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-12">
              <div className="flex gap-4 sm:gap-6 items-end">
                <div className="hidden md:block flex-shrink-0">
                  <div className="relative">
                    <img src={series.poster} alt={getTitle()} className="w-32 lg:w-40 aspect-[2/3] object-cover rounded-2xl shadow-2xl shadow-black/80 ring-1 ring-white/10" />
                    {watchedCount > 0 && (
                      <div className="absolute -bottom-2 left-0 right-0 h-1.5 bg-black/80 rounded-full overflow-hidden border border-white/10">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${(watchedCount / totalEpisodes) * 100}%` }} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl sm:text-2xl">{getCategoryIcon(series.category)}</span>
                    <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold">{getCategoryName(series.category)}</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 leading-[1.05] tracking-tight drop-shadow-2xl line-clamp-2">{getTitle()}</h1>
                  <div className="w-16 h-0.5 bg-gradient-to-r from-red-600 to-transparent rounded-full mb-3" />
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                    <span className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-yellow-500/30"><FaStar className="text-yellow-400 text-xs" /><span className="text-white text-xs font-bold">{series.rating}/10</span></span>
                    <span className="flex items-center gap-1 text-gray-200 text-xs"><FaCalendarAlt className="text-[10px]" />{series.year}</span>
                    <span className="hidden sm:flex items-center gap-1 text-gray-200 text-xs"><FaFilm className="text-[10px]" />{series.genre}</span>
                    <span className="flex items-center gap-1 text-gray-200 text-xs"><FaList className="text-[10px]" />{totalSeasons} مواسم</span>
                    <span className="flex items-center gap-1 text-gray-200 text-xs"><FaPlay className="text-[10px]" />{totalEpisodes} حلقة</span>
                  </div>
                  <div className="mb-3"><UserRating initialRating={userRating} onRate={handleUserRate} /></div>

                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {selectedEpisode && (
                      <button onClick={() => handleWatchClick(selectedEpisode)} className="group relative bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg shadow-red-600/40 text-sm">
                        <FaPlay className="text-xs" />
                        <span>{lastWatchedInfo ? `متابعة من S${lastWatchedInfo.seasonNum}E${lastWatchedInfo.episodeNum}` : (t('movie.watch') || 'شاهد الآن')}</span>
                      </button>
                    )}
                    <button onClick={toggleWatchlist} disabled={isToggling} className={`px-4 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all duration-300 text-sm disabled:opacity-50 hover:scale-105 ${inWatchlist ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/40' : 'bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20'}`}>
                      {inWatchlist ? <FaHeart className="text-xs" /> : <FaRegHeart className="text-xs" />}
                      <span className="hidden sm:inline">{inWatchlist ? 'في المفضلة' : 'إضافة للمفضلة'}</span>
                    </button>
                    <button onClick={() => setShowInfoModal(true)} className="bg-emerald-600/40 backdrop-blur-md hover:bg-emerald-600 text-white p-2.5 rounded-full transition-all duration-300 border border-emerald-500/30 hover:scale-105" title="معلومات">
                      <FaInfoCircle className="text-xs" />
                    </button>
                    <div className="relative">
                      <button onClick={shareNative} className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-2.5 rounded-full transition-all duration-300 border border-white/20 hover:scale-105"><FaShare className="text-xs" /></button>
                      {showShareMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 bg-[#21262d] rounded-2xl p-2 shadow-2xl border border-white/10 min-w-[230px]">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-2">
                              <span className="text-white text-xs font-bold">مشاركة</span>
                              <button onClick={() => setShowShareMenu(false)} className="text-gray-400 hover:text-white"><FaTimes className="text-xs" /></button>
                            </div>
                            <button onClick={shareViaWhatsApp} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg"><FaWhatsapp className="text-white text-sm" /></div>
                              <span className="text-white text-sm font-semibold">واتساب</span>
                            </button>
                            <button onClick={shareViaFacebook} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg"><FaFacebookF className="text-white text-sm" /></div>
                              <span className="text-white text-sm font-semibold">فيسبوك</span>
                            </button>
                            <button onClick={shareViaInstagram} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 flex items-center justify-center shadow-lg"><FaInstagram className="text-white text-sm" /></div>
                              <span className="text-white text-sm font-semibold">إنستغرام</span>
                            </button>
                            <button onClick={copyLink} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition border-t border-white/10 mt-1 pt-2.5">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-lg border border-white/10"><FaLink className="text-white text-sm" /></div>
                              <span className="text-white text-sm font-semibold">نسخ الرابط</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {(hasAudioTracks || hasSubtitles) && (
                      <button onClick={() => setShowLanguages(true)} className="bg-purple-600/40 backdrop-blur-md hover:bg-purple-600 text-white px-4 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all duration-300 text-sm border border-purple-500/30 hover:scale-105">
                        <FaGlobe className="text-xs" /> <span className="hidden sm:inline">اللغات</span>
                        <span className="bg-purple-500 text-white text-[10px] rounded-full px-1.5">{(selectedEpisode?.audio_tracks?.length || 0) + (selectedEpisode?.subtitles?.length || 0)}</span>
                      </button>
                    )}
                  </div>

                  {watchedCount > 0 && <SeriesProgress watchedCount={watchedCount} totalEpisodes={totalEpisodes} />}

                  {lastWatchedInfo && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1.5 text-xs text-purple-200">
                      <FaCheckCircle className="text-purple-400 text-[10px]" />
                      <span>آخر مشاهدة: S{lastWatchedInfo.seasonNum}E{lastWatchedInfo.episodeNum}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* فاصل أبيض */}
          <div className="relative w-full flex items-center justify-center py-4">
            <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/70 shadow-lg shadow-white/40" />
          </div>

          {/* المحتوى */}
          <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 space-y-6 md:space-y-8">
            <section className="bg-white/[0.03] rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg"><FaInfoCircle className="text-white text-sm" /></div>
                <div>
                  <h2 className="text-white text-lg sm:text-xl md:text-2xl font-bold">{t('movie.synopsis') || 'القصة'}</h2>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-transparent rounded-full mt-1" />
                </div>
              </div>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{getDescription() || 'لا يوجد وصف متاح'}</p>
            </section>

            <section className="bg-white/[0.03] rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg"><FaList className="text-white text-sm" /></div>
                  <div>
                    <h2 className="text-white text-lg sm:text-xl md:text-2xl font-bold">الحلقات</h2>
                    <div className="w-12 h-0.5 bg-gradient-to-r from-yellow-600 to-transparent rounded-full mt-1" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="bg-white/5 border border-white/10 rounded-full px-2.5 py-1">{totalSeasons} مواسم</span>
                  <span className="bg-white/5 border border-white/10 rounded-full px-2.5 py-1">{totalEpisodes} حلقة</span>
                </div>
              </div>

              {seasonNumbers.length > 0 ? (
                <>
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {seasonNumbers.map(sn => {
                      const isActive = expandedSeason === sn;
                      const count = seasons[sn]?.length || 0;
                      const hasLW = seasons[sn]?.some(ep => ep.id === lastWatchedId);
                      return (
                        <button
                          key={sn}
                          onClick={() => setExpandedSeason(sn)}
                          className={`flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${
                            isActive
                              ? 'bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/40 scale-105'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                          }`}
                        >
                          <FaList className="text-xs" />
                          <span>الموسم {sn}</span>
                          <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-black/30 text-gray-400'}`}>{count}</span>
                          {hasLW && !isActive && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />}
                        </button>
                      );
                    })}
                  </div>

                  <FilterPills activeFilter={activeFilter} setActiveFilter={setActiveFilter} counts={filterCounts} />

                  {filteredEpisodes.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {filteredEpisodes.map((episode, index) => (
                        <EpisodeCard
                          key={episode.id}
                          episode={episode}
                          index={index}
                          isSelected={selectedEpisode?.id === episode.id}
                          isLastWatched={lastWatchedId === episode.id}
                          isWatched={watchedEpisodes.includes(episode.id)}
                          series={series}
                          onWatch={handleWatchClick}
                          onToggleWatched={toggleWatched}
                          getEpisodeTitle={getEpisodeTitle}
                          episodeProgress={episodeProgressMap[episode.id]}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-black/20 rounded-xl border border-white/5">
                      <FaSearch className="text-gray-600 text-4xl mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">لا توجد حلقات في هذا الفلتر</p>
                      <button onClick={() => setActiveFilter('all')} className="mt-3 text-xs text-red-400 hover:text-red-300 font-semibold">عرض كل الحلقات</button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-black/20 rounded-xl border border-white/5">
                  <FaList className="text-gray-600 text-4xl mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">لا توجد حلقات متاحة</p>
                </div>
              )}
            </section>

            <Recommendations series={series} language={language} />

            <section className="bg-white/[0.03] rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg"><FaUsers className="text-white text-sm" /></div>
                <div>
                  <h2 className="text-white text-lg sm:text-xl md:text-2xl font-bold">طاقم العمل</h2>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-blue-600 to-transparent rounded-full mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2"><FaUserTie className="text-yellow-400 text-xs" /><p className="text-gray-400 text-xs uppercase tracking-wide">المخرج</p></div>
                  <p className="text-white text-sm font-semibold">{series.director || 'غير محدد'}</p>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2"><FaUsers className="text-purple-400 text-xs" /><p className="text-gray-400 text-xs uppercase tracking-wide">الممثلون</p></div>
                  <p className="text-white text-sm font-semibold line-clamp-3">{series.cast || 'غير محدد'}</p>
                </div>
              </div>
            </section>

            {(hasAudioTracks || hasSubtitles) && (
              <section className="bg-white/[0.03] rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg"><FaGlobe className="text-white text-sm" /></div>
                  <div>
                    <h2 className="text-white text-lg sm:text-xl md:text-2xl font-bold">اللغات والترجمات</h2>
                    <div className="w-12 h-0.5 bg-gradient-to-r from-purple-600 to-transparent rounded-full mt-1" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  {hasAudioTracks && (
                    <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                      <h3 className="text-purple-400 text-sm font-semibold mb-3 flex items-center gap-2"><FaHeadphones /> المسارات الصوتية <span className="text-[10px] bg-purple-600/30 px-2 py-0.5 rounded-full">{selectedEpisode?.audio_tracks?.length}</span></h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedEpisode?.audio_tracks?.map((track, idx) => (
                          <span key={idx} className={`px-3 py-1 rounded-full text-xs font-semibold ${track.is_default ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-gray-300 border border-white/10'}`}>
                            {track.label} {track.is_default && '✓'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {hasSubtitles && (
                    <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                      <h3 className="text-blue-400 text-sm font-semibold mb-3 flex items-center gap-2"><FaClosedCaptioning /> الترجمات <span className="text-[10px] bg-blue-600/30 px-2 py-0.5 rounded-full">{selectedEpisode?.subtitles?.length}</span></h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedEpisode?.subtitles?.map((sub, idx) => (
                          <span key={idx} className={`px-3 py-1 rounded-full text-xs font-semibold ${sub.is_default ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-gray-300 border border-white/10'}`}>
                            {sub.label} {sub.is_default && '✓'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </>
      )}

      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} series={series} selectedEpisode={selectedEpisode} totalSeasons={totalSeasons} totalEpisodes={totalEpisodes} lastWatched={lastWatchedInfo} />

      {showLanguages && selectedEpisode && (hasAudioTracks || hasSubtitles) && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLanguages(false)}>
          <div className="bg-[#21262d] rounded-2xl max-w-md w-full p-6 border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white text-xl font-bold">اللغات والترجمات</h3>
              <button onClick={() => setShowLanguages(false)} className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">&times;</button>
            </div>
            {hasAudioTracks && (
              <div className="mb-5">
                <h4 className="text-purple-400 font-semibold mb-3 flex items-center gap-2"><FaHeadphones /> المسارات الصوتية</h4>
                <div className="space-y-2">
                  {selectedEpisode?.audio_tracks?.map((track, idx) => (
                    <div key={idx} className={`rounded-lg p-3 flex items-center justify-between ${track.is_default ? 'bg-emerald-600/20 border border-emerald-500/30' : 'bg-white/5 border border-white/10'}`}>
                      <div><p className="text-white text-sm font-semibold">{track.label}</p><p className="text-gray-500 text-xs">{track.language}</p></div>
                      {track.is_default && <span className="text-emerald-400 text-xs font-bold">افتراضي</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hasSubtitles && (
              <div>
                <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2"><FaClosedCaptioning /> الترجمات</h4>
                <div className="space-y-2">
                  {selectedEpisode?.subtitles?.map((sub, idx) => (
                    <div key={idx} className={`rounded-lg p-3 flex items-center justify-between ${sub.is_default ? 'bg-emerald-600/20 border border-emerald-500/30' : 'bg-white/5 border border-white/10'}`}>
                      <div><p className="text-white text-sm font-semibold">{sub.label}</p><p className="text-gray-500 text-xs">{sub.language}</p></div>
                      {sub.is_default && <span className="text-emerald-400 text-xs font-bold">افتراضي</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeriesDetailsPage;