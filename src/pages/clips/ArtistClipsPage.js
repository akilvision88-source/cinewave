// src/pages/clips/ArtistClipsPage.js - كليبات فنان بنفس النمط الموحّد
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  FaHeart, FaRegHeart, FaList, FaTimes, FaShare, FaArrowLeft,
  FaStar, FaRegStar, FaClock, FaCalendarAlt, FaPlay, FaVideo,
  FaWhatsapp, FaFacebookF, FaTelegramPlane, FaTwitter, FaLink,
  FaPlus, FaCheck
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import VideoPlayer from '../../components/VideoPlayer';
import { artistsAPI, clipsAPI, watchlistAPI } from '../../services/api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LOCAL_PLACEHOLDER_16_9 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMzIwIDE4MCI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMxYTFhMWEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iIzY2NjY2NiIgZm9udC1zaXplPSIxNCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4=';

const isValidThumbnail = (url) => {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (!t) return false;
  if (/placeholder\.com|via\.placeholder/i.test(t)) return false;
  return /^(https?:|\/|data:image\/)/i.test(t);
};

// ============================================================
// ✅ AutoClipThumbnail
// ============================================================
const AutoClipThumbnail = ({ clip, fallback, alt, className }) => {
  const initialThumb = isValidThumbnail(clip.thumbnail) ? clip.thumbnail : fallback;
  const [thumbnail, setThumbnail] = useState(initialThumb);
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { setShouldLoad(true); observer.disconnect(); }
      });
    }, { rootMargin: '200px' });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isValidThumbnail(clip.thumbnail)) { setThumbnail(clip.thumbnail); return; }
    const videoUrl = clip.video_url || clip.videoUrl;
    if (!videoUrl || !shouldLoad) return;
    const cacheKey = `thumb_clip_${clip.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached && isValidThumbnail(cached)) { setThumbnail(cached); return; }

    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      let videoId = null;
      if (videoUrl.includes('youtu.be')) videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
      else if (videoUrl.includes('watch?v=')) videoId = videoUrl.split('watch?v=')[1]?.split('&')[0];
      else if (videoUrl.includes('embed/')) videoId = videoUrl.split('embed/')[1]?.split('?')[0];
      if (videoId) {
        videoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
        const ytThumb = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        setThumbnail(ytThumb);
        localStorage.setItem(cacheKey, ytThumb);
      }
      return;
    }

    let cancelled = false;
    fetch(`${API_BASE}/api/thumbnail-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl }),
    })
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (data.thumbnail) {
          const fullUrl = `${API_BASE}${data.thumbnail}`;
          setThumbnail(fullUrl);
          localStorage.setItem(cacheKey, fullUrl);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [clip.id, clip.video_url, clip.videoUrl, clip.thumbnail, shouldLoad]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <img src={thumbnail} alt={alt} className={className} loading="lazy"
        onError={(e) => { if (fallback && e.target.src !== fallback) e.target.src = fallback; }} />
    </div>
  );
};

// ============================================================
// 🎬 ArtistClipsPage
// ============================================================
const ArtistClipsPage = () => {
  const { artistId } = useParams();
  const { language, t } = useLanguage();
  const [artist, setArtist] = useState(null);
  const [clips, setClips] = useState([]);
  const [currentClip, setCurrentClip] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedClips, setLikedClips] = useState([]);
  const [favoriteClips, setFavoriteClips] = useState([]);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const toastTimeout = useRef(null);

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setShowToast(false), 2000);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!token || !!user);
  }, []);

  const formatYouTubeUrl = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = null;
      if (url.includes('youtu.be')) videoId = url.split('youtu.be/')[1]?.split('?')[0];
      else if (url.includes('watch?v=')) videoId = url.split('watch?v=')[1]?.split('&')[0];
      else if (url.includes('embed/')) videoId = url.split('embed/')[1]?.split('?')[0];
      if (videoId) { videoId = videoId.replace(/[^a-zA-Z0-9_-]/g, ''); return `https://www.youtube.com/watch?v=${videoId}`; }
    }
    return url;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [artistData, clipsData] = await Promise.all([
          artistsAPI.getById(artistId),
          clipsAPI.getByArtist(artistId),
        ]);
        setArtist(artistData);
        const formatted = clipsData.map(clip => ({
          ...clip,
          videoUrl: formatYouTubeUrl(clip.video_url || clip.videoUrl),
          title: clip.title || clip.title_ar,
          thumbnail: clip.thumbnail,
        }));
        setClips(formatted);
        if (formatted.length > 0) setCurrentClip(formatted[0]);

        const savedFav = localStorage.getItem('cinewave_favorite_clips');
        if (savedFav) setFavoriteClips(JSON.parse(savedFav));
        const savedLikes = localStorage.getItem(`liked_clips_${artistId}`);
        if (savedLikes) setLikedClips(JSON.parse(savedLikes));
      } catch (e) { console.error('خطأ:', e); }
      finally { setLoading(false); }
    };
    if (artistId) loadData();
  }, [artistId]);

  useEffect(() => { localStorage.setItem(`liked_clips_${artistId}`, JSON.stringify(likedClips)); }, [likedClips, artistId]);

  const toggleLike = (clipId) => {
    const newLiked = likedClips.includes(clipId) ? likedClips.filter(id => id !== clipId) : [...likedClips, clipId];
    setLikedClips(newLiked);
    showNotification(likedClips.includes(clipId) ? 'تم إزالة الإعجاب' : 'تم الإعجاب ❤️');
  };

  const toggleFavorite = (clipId) => {
    let newFav;
    if (favoriteClips.includes(clipId)) { newFav = favoriteClips.filter(id => id !== clipId); showNotification('تمت الإزالة من المفضلة'); }
    else { newFav = [...favoriteClips, clipId]; showNotification('تمت الإضافة للمفضلة ⭐'); }
    setFavoriteClips(newFav);
    localStorage.setItem('cinewave_favorite_clips', JSON.stringify(newFav));
    window.dispatchEvent(new Event('favoritesUpdated'));
  };

  const playClip = (clip, index) => { setCurrentClip(clip); setCurrentIndex(index); };
  const nextClip = () => { if (clips.length === 0) return; const n = (currentIndex + 1) % clips.length; setCurrentClip(clips[n]); setCurrentIndex(n); };
  const prevClip = () => { if (clips.length === 0) return; const p = (currentIndex - 1 + clips.length) % clips.length; setCurrentClip(clips[p]); setCurrentIndex(p); };

  const toggleWatchlist = async (clip) => {
    if (!isAuthenticated) { window.location.href = '/login'; return; }
    if (isToggling) return;
    setIsToggling(true);
    try {
      const result = await watchlistAPI.isInWatchlist(clip.id, 'clip');
      if (result.exists) { await watchlistAPI.removeFromWatchlist(clip.id, 'clip'); showNotification('✅ تمت الإزالة من قائمة المشاهدة'); }
      else { await watchlistAPI.addToWatchlist(clip.id, 'clip'); showNotification('✅ تمت الإضافة إلى قائمة المشاهدة'); }
    } catch (error) { console.error('خطأ:', error); showNotification('❌ حدث خطأ'); }
    finally { setIsToggling(false); }
  };

  const displayedClips = showFavoritesOnly ? clips.filter(c => favoriteClips.includes(c.id)) : clips;

  if (loading) return <div className="flex justify-center items-center h-screen bg-[#1f242d]"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!artist) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1f242d]">
        <div className="text-center">
          <FaVideo className="text-6xl text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">الفنان غير موجود</h2>
          <Link to="/clips" className="text-red-400 hover:text-red-300">العودة إلى الفنانين</Link>
        </div>
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="min-h-screen bg-[#1f242d]">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-4">
          <Link to="/clips" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"><FaArrowLeft /> العودة للفنانين</Link>
        </div>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <img src={artist.image} alt={artist.name} className="w-32 h-32 rounded-full object-cover mb-6 border-2 border-red-500/50" />
          <h1 className="text-2xl font-bold text-white mb-2">{artist.name}</h1>
          <p className="text-gray-400 mb-6">لا توجد كليبات لهذا الفنان حالياً</p>
          <Link to="/clips" className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2 rounded-lg hover:scale-105 transition">استكشاف فنانين آخرين</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f242d] relative">
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#21262d] text-white px-6 py-3 rounded-xl shadow-lg border border-white/10">
          {toastMessage}
        </div>
      )}

      {/* Hero */}
      <div className="relative h-[35vh] md:h-[45vh] w-full overflow-hidden bg-[#0d1015]">
        <img src={artist.image} alt={artist.name} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.target.src = 'https://via.placeholder.com/1920x600/1f242d/666666?text=Artist'; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f242d] via-[#1f242d]/70 to-[#0d1015]/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1015]/85 via-[#0d1015]/50 to-transparent" />

        <div className="relative h-full w-full px-4 sm:px-6 md:px-8 lg:px-12 flex items-end pb-6 md:pb-10">
          <div className="w-full max-w-6xl mx-auto">
            <Link to="/clips" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition text-sm"><FaArrowLeft /> العودة إلى الفنانين</Link>
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              <img src={artist.image} alt={artist.name} className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-2xl object-cover border-2 border-red-500/50 shadow-2xl" onError={(e) => { e.target.src = 'https://via.placeholder.com/128x128/1f242d/666666?text=🎵'; }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎬</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold">فنان</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-2 leading-tight drop-shadow-2xl line-clamp-1">{artist.name}</h1>
                <div className="w-16 h-0.5 bg-gradient-to-r from-red-600 to-transparent rounded-full mb-2" />
                <p className="text-gray-300 text-xs sm:text-sm">{clips.length} كليب</p>
              </div>
              <Link to="/favorite-clips" className="flex items-center gap-2 px-3 py-2 bg-yellow-500/15 text-yellow-400 rounded-xl hover:bg-yellow-500/25 transition border border-yellow-500/30">
                <FaStar className="text-yellow-400 text-sm" />
                <div className="text-right">
                  <p className="text-white text-xs font-semibold">مفضلاتي</p>
                  <p className="text-yellow-400 text-[10px]">{favoriteClips.length} كليب</p>
                </div>
              </Link>
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
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* المشغل */}
          <div className="lg:col-span-2">
            {currentClip ? (
              <>
                <VideoPlayer
                  videoUrl={currentClip.videoUrl}
                  title={currentClip.title}
                  artist={artist?.name}
                  isLiked={likedClips.includes(currentClip.id)}
                  isFavorite={favoriteClips.includes(currentClip.id)}
                  onLike={() => toggleLike(currentClip.id)}
                  onFavorite={() => toggleFavorite(currentClip.id)}
                  onNext={nextClip}
                  onPrev={prevClip}
                  hasNext={displayedClips.length > 1}
                  hasPrev={displayedClips.length > 1}
                  autoPlay={true}
                />

                <div className="mt-4 bg-white/[0.03] rounded-2xl p-4 border border-white/10">
                  <div className="flex justify-between items-start flex-wrap gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-white text-lg sm:text-xl font-bold line-clamp-1">{currentClip.title}</h2>
                      <p className="text-gray-400 text-sm">{artist.name}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => toggleLike(currentClip.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 ${likedClips.includes(currentClip.id) ? 'bg-red-600 text-white' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}>
                        {likedClips.includes(currentClip.id) ? <FaHeart /> : <FaRegHeart />}
                        <span className="hidden sm:inline text-xs">{likedClips.includes(currentClip.id) ? 'أعجبني' : 'إعجاب'}</span>
                      </button>
                      <button onClick={() => toggleFavorite(currentClip.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 ${favoriteClips.includes(currentClip.id) ? 'bg-yellow-500 text-white' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}>
                        {favoriteClips.includes(currentClip.id) ? <FaStar /> : <FaRegStar />}
                        <span className="hidden sm:inline text-xs">{favoriteClips.includes(currentClip.id) ? 'مفضلة' : 'أضف'}</span>
                      </button>
                      <button onClick={() => toggleWatchlist(currentClip)} disabled={isToggling} className="flex items-center gap-2 px-4 py-2 bg-purple-600/50 rounded-full hover:bg-purple-600 transition-all duration-300 hover:scale-105 disabled:opacity-50">
                        <FaList className="text-white text-xs" />
                        <span className="hidden sm:inline text-xs">قائمتي</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-500 text-xs mt-3 flex-wrap">
                    <span className="flex items-center gap-1"><FaPlay size={10} /> {currentClip.views?.toLocaleString() || '0'}</span>
                    <span className="flex items-center gap-1"><FaHeart size={10} /> {currentClip.likes?.toLocaleString() || '0'}</span>
                    <span className="flex items-center gap-1"><FaClock size={10} /> {currentClip.duration || 'غير محدد'}</span>
                    <span className="flex items-center gap-1"><FaCalendarAlt size={10} /> {currentClip.year || 'غير محدد'}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white/[0.03] rounded-2xl aspect-video flex flex-col items-center justify-center border border-white/10">
                <FaVideo className="text-gray-700 text-5xl mb-3" />
                <p className="text-gray-500">اختر كليباً من القائمة</p>
              </div>
            )}
          </div>

          {/* قائمة التشغيل */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 bg-white/[0.02] border-b border-white/10 flex justify-between items-center gap-2 flex-wrap">
              <h3 className="text-white font-bold text-sm">قائمة التشغيل ({displayedClips.length})</h3>
              <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${showFavoritesOnly ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                {showFavoritesOnly ? '⭐ المفضلة' : 'كل الكليبات'}
              </button>
            </div>
            <div className="max-h-[500px] overflow-y-auto scrollbar-hide">
              {displayedClips.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">{showFavoritesOnly ? 'لا توجد كليبات مفضلة' : 'لا توجد كليبات'}</div>
              ) : (
                displayedClips.map((clip) => {
                  const originalIdx = clips.findIndex(c => c.id === clip.id);
                  const isActive = currentClip?.id === clip.id;
                  return (
                    <div
                      key={clip.id}
                      onClick={() => playClip(clip, originalIdx)}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-all duration-300 border-l-4 ${isActive ? 'bg-gradient-to-r from-red-600/20 to-transparent border-red-500' : 'border-transparent hover:bg-white/[0.04]'}`}
                    >
                      <div className="relative w-16 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#0d1015] border border-white/10">
                        <AutoClipThumbnail clip={clip} fallback={LOCAL_PLACEHOLDER_16_9} alt={clip.title} className="w-full h-full object-cover" />
                        {isActive && (
                          <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                            <FaPlay className="text-white text-xs" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-gray-200'}`}>{clip.title}</p>
                        <p className="text-gray-500 text-xs">{clip.duration || 'غير محدد'}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); toggleLike(clip.id); }} className="p-1">
                          {likedClips.includes(clip.id) ? <FaHeart className="text-red-500 text-xs" /> : <FaRegHeart className="text-gray-400 text-xs" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(clip.id); }} className="p-1">
                          {favoriteClips.includes(clip.id) ? <FaStar className="text-yellow-500 text-xs" /> : <FaRegStar className="text-gray-400 text-xs" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(clip); }} disabled={isToggling} className="p-1 text-purple-400 hover:text-purple-300 disabled:opacity-50">
                          <FaList className="text-xs" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* زر القائمة على الجوال */}
      {!showPlaylist && displayedClips.length > 0 && (
        <button onClick={() => setShowPlaylist(true)} className="fixed bottom-20 right-4 z-30 bg-gradient-to-r from-red-600 to-rose-600 w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-red-600/40 lg:hidden">
          <FaList className="text-white" />
        </button>
      )}

      {showPlaylist && (
        <div className="fixed inset-0 bg-black/90 z-40 lg:hidden" onClick={() => setShowPlaylist(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-[#21262d] rounded-t-3xl max-h-[70vh] overflow-y-auto border-t border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#21262d]">
              <h3 className="text-white font-bold">قائمة التشغيل</h3>
              <button onClick={() => setShowPlaylist(false)} className="text-gray-400 hover:text-white"><FaTimes /></button>
            </div>
            <div className="p-3">
              {displayedClips.map((clip) => {
                const originalIdx = clips.findIndex(c => c.id === clip.id);
                return (
                  <div key={clip.id} onClick={() => { playClip(clip, originalIdx); setShowPlaylist(false); }} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition hover:bg-white/5 ${currentClip?.id === clip.id ? 'bg-red-600/20 border border-red-500/30' : ''}`}>
                    <div className="w-12 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#0d1015] border border-white/10">
                      <AutoClipThumbnail clip={clip} fallback={LOCAL_PLACEHOLDER_16_9} alt={clip.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{clip.title}</p>
                      <p className="text-gray-500 text-xs">{clip.duration || 'غير محدد'}</p>
                    </div>
                    <FaPlay className="text-gray-400 text-xs" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistClipsPage;