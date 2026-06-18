// src/pages/clips/ArtistClipsPage.js - نسخة كاملة مع الاتصال بقاعدة البيانات
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FaHeart, FaRegHeart, FaList, FaTimes, FaShare, FaChevronLeft, FaStar, FaRegStar, FaClock, FaCalendarAlt, FaPlay, FaVideo } from 'react-icons/fa';
import VideoPlayer from '../../components/VideoPlayer';
import { artistsAPI, clipsAPI, watchlistAPI } from '../../services/api';

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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  
  const toastTimeout = useRef(null);

  // ========== دالة عرض الإشعار ==========
  const showNotification = (message, type = 'success') => {
    setToastMessage(message);
    setShowToast(true);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  // ========== التحقق من حالة تسجيل الدخول ==========
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!token || !!user);
  }, []);

  // ========== دالة استخراج الصورة المصغرة ==========
  const getThumbnailFromUrl = async (url, clipId) => {
    if (!url) return 'https://via.placeholder.com/320x180?text=No+Image';
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = null;
      if (url.includes('youtu.be')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      } else if (url.includes('watch?v=')) {
        videoId = url.split('watch?v=')[1]?.split('&')[0];
      } else if (url.includes('embed/')) {
        videoId = url.split('embed/')[1]?.split('?')[0];
      }
      if (videoId) {
        videoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    }
    
    if (url.includes('/data/') || url.endsWith('.mp4') || url.endsWith('.mkv')) {
      const thumbnail = await extractThumbnailFromVideo(url, clipId);
      if (thumbnail) return thumbnail;
      return 'https://via.placeholder.com/320x180?text=Video';
    }
    
    return 'https://via.placeholder.com/320x180?text=No+Image';
  };

  // ========== دالة استخراج صورة من الفيديو ==========
  const extractThumbnailFromVideo = (videoUrl, clipId) => {
    return new Promise((resolve) => {
      if (!videoUrl) {
        resolve(null);
        return;
      }
      
      const savedThumbnail = localStorage.getItem(`clip_thumbnail_${clipId}`);
      if (savedThumbnail) {
        resolve(savedThumbnail);
        return;
      }
      
      const video = document.createElement('video');
      video.crossOrigin = 'Anonymous';
      video.src = videoUrl;
      video.muted = true;
      video.currentTime = 5;
      
      video.addEventListener('loadeddata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
        localStorage.setItem(`clip_thumbnail_${clipId}`, thumbnailUrl);
        video.pause();
        video.src = '';
        resolve(thumbnailUrl);
      });
      
      video.addEventListener('error', () => {
        console.error('فشل في استخراج الصورة من الفيديو');
        resolve(null);
      });
      
      video.load();
      
      setTimeout(() => {
        if (video.readyState < 2) {
          resolve(null);
        }
      }, 5000);
    });
  };

  // ========== دالة تنسيق رابط الفيديو ==========
  const formatYouTubeUrl = (url) => {
    if (!url) return '';
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = null;
      if (url.includes('youtu.be')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      } else if (url.includes('watch?v=')) {
        videoId = url.split('watch?v=')[1]?.split('&')[0];
      } else if (url.includes('embed/')) {
        videoId = url.split('embed/')[1]?.split('?')[0];
      }
      if (videoId) {
        videoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    }
    
    if (url.endsWith('.mp4') || url.endsWith('.mkv') || url.includes('.mp4') || url.includes('/data/')) {
      return url;
    }
    
    return url;
  };

  // ========== تحميل البيانات ==========
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log('🔄 جلب بيانات الفنان:', artistId);
        const [artistData, clipsData] = await Promise.all([
          artistsAPI.getById(artistId),
          clipsAPI.getByArtist(artistId)
        ]);
        
        console.log('✅ تم جلب الفنان:', artistData?.name);
        console.log('✅ تم جلب الكليبات:', clipsData.length);
        setArtist(artistData);
        
        const formattedClips = [];
        for (const clip of clipsData) {
          const videoUrl = formatYouTubeUrl(clip.video_url || clip.videoUrl);
          const thumbnail = await getThumbnailFromUrl(videoUrl, clip.id);
          
          formattedClips.push({
            ...clip,
            videoUrl: videoUrl,
            title: clip.title || clip.title_ar,
            thumbnail: clip.thumbnail || thumbnail,
          });
        }
        
        console.log('📋 الكليبات بعد التنسيق:', formattedClips);
        setClips(formattedClips);
        
        if (formattedClips.length > 0) {
          console.log('✅ تعيين currentClip:', formattedClips[0]);
          setCurrentClip(formattedClips[0]);
        }
        
        const savedFavorites = localStorage.getItem('cinewave_favorite_clips');
        if (savedFavorites) {
          setFavoriteClips(JSON.parse(savedFavorites));
        }
        
        const savedLikes = localStorage.getItem(`liked_clips_${artistId}`);
        if (savedLikes) setLikedClips(JSON.parse(savedLikes));
        
      } catch (error) {
        console.error('❌ خطأ في تحميل البيانات:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (artistId) {
      loadData();
    }
  }, [artistId]);

  // ========== تتبع currentClip ==========
  useEffect(() => {
    console.log('🎬 currentClip تغير:', currentClip);
    if (currentClip) {
      console.log('📹 رابط الفيديو:', currentClip.videoUrl);
      console.log('📹 عنوان الكليب:', currentClip.title);
      setVideoError(false);
    }
  }, [currentClip]);

  // ========== حفظ الإعجابات ==========
  useEffect(() => {
    localStorage.setItem(`liked_clips_${artistId}`, JSON.stringify(likedClips));
  }, [likedClips, artistId]);

  // ========== تبديل الإعجاب ==========
  const toggleLike = async (clipId) => {
    try {
      const newLikedClips = likedClips.includes(clipId) 
        ? likedClips.filter(id => id !== clipId)
        : [...likedClips, clipId];
      setLikedClips(newLikedClips);
      showNotification(likedClips.includes(clipId) ? 'تم إزالة الإعجاب' : 'تم الإعجاب');
    } catch (error) {
      console.error('خطأ في تغيير الإعجاب:', error);
    }
  };

  // ========== تبديل المفضلة ==========
  const toggleFavorite = async (clipId) => {
    try {
      let newFavorites;
      if (favoriteClips.includes(clipId)) {
        newFavorites = favoriteClips.filter(id => id !== clipId);
        showNotification('تم إزالة من المفضلة');
      } else {
        newFavorites = [...favoriteClips, clipId];
        showNotification('تم إضافة إلى المفضلة');
      }
      setFavoriteClips(newFavorites);
      localStorage.setItem('cinewave_favorite_clips', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('خطأ في تغيير المفضلة:', error);
    }
  };

  // ========== تشغيل الكليب ==========
  const playClip = (clip, index) => {
    console.log('🎬 تشغيل الكليب:', clip.title);
    console.log('🎬 الرابط:', clip.videoUrl);
    setCurrentClip(clip);
    setCurrentIndex(index);
    setVideoError(false);
  };

  // ========== الكليب التالي ==========
  const nextClip = () => {
    let playlist = showFavoritesOnly ? clips.filter(c => favoriteClips.includes(c.id)) : clips;
    if (playlist.length === 0) return;
    
    let nextOriginalIndex = (currentIndex + 1) % clips.length;
    if (showFavoritesOnly && !favoriteClips.includes(clips[nextOriginalIndex].id)) {
      const nextFavoriteIndex = clips.findIndex((c, idx) => idx > currentIndex && favoriteClips.includes(c.id));
      if (nextFavoriteIndex !== -1) {
        nextOriginalIndex = nextFavoriteIndex;
      } else {
        nextOriginalIndex = clips.findIndex(c => favoriteClips.includes(c.id));
      }
    }
    const nextClipData = clips[nextOriginalIndex];
    setCurrentClip(nextClipData);
    setCurrentIndex(nextOriginalIndex);
  };

  // ========== الكليب السابق ==========
  const prevClip = () => {
    let playlist = showFavoritesOnly ? clips.filter(c => favoriteClips.includes(c.id)) : clips;
    if (playlist.length === 0) return;
    
    let prevOriginalIndex = (currentIndex - 1 + clips.length) % clips.length;
    if (showFavoritesOnly && !favoriteClips.includes(clips[prevOriginalIndex].id)) {
      const prevFavoriteIndex = clips.findIndex((c, idx) => idx < currentIndex && favoriteClips.includes(c.id));
      if (prevFavoriteIndex !== -1) {
        prevOriginalIndex = prevFavoriteIndex;
      } else {
        for (let i = clips.length - 1; i >= 0; i--) {
          if (favoriteClips.includes(clips[i].id)) {
            prevOriginalIndex = i;
            break;
          }
        }
      }
    }
    const prevClipData = clips[prevOriginalIndex];
    setCurrentClip(prevClipData);
    setCurrentIndex(prevOriginalIndex);
  };

  // ========== إضافة/إزالة من قائمة المشاهدة (لقائمة المشاهدة العامة) ==========
  const toggleWatchlist = async (clip) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    
    if (isToggling) return;
    setIsToggling(true);
    
    try {
      // نستخدم watchlistAPI لإضافة/إزالة الكليب من قائمة المشاهدة
      const itemId = clip.id;
      const itemType = 'clip';
      
      // التحقق من وجود الكليب في القائمة
      const result = await watchlistAPI.isInWatchlist(itemId, itemType);
      
      if (result.exists) {
        await watchlistAPI.removeFromWatchlist(itemId, itemType);
        showNotification('✅ تم إزالة الكليب من قائمة المشاهدة');
      } else {
        await watchlistAPI.addToWatchlist(itemId, itemType);
        showNotification('✅ تم إضافة الكليب إلى قائمة المشاهدة');
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث قائمة المشاهدة:', error);
      showNotification('❌ حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  const displayedClips = showFavoritesOnly ? clips.filter(c => favoriteClips.includes(c.id)) : clips;

  // ========== LOADING ==========
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // ========== ARTIST NOT FOUND ==========
  if (!artist) {
    return (
      <div className="flex justify-center items-center h-screen text-white">
        <div className="text-center">
          <FaVideo className="text-6xl text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">الفنان غير موجود</h2>
          <Link to="/clips" className="text-red-500 hover:text-red-400">العودة إلى الفنانين</Link>
        </div>
      </div>
    );
  }

  // ========== NO CLIPS ==========
  if (clips.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <div className="bg-gradient-to-r from-gray-900 to-black sticky top-0 z-20 border-b border-gray-800">
          <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4">
            <Link to="/clips" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
              <FaChevronLeft /> العودة للفنانين
            </Link>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <img src={artist.image} alt={artist.name} className="w-32 h-32 rounded-full object-cover mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">{artist.name}</h1>
          <p className="text-gray-400 mb-6">لا توجد كليبات لهذا الفنان حالياً</p>
          <Link to="/clips" className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">
            استكشاف فنانين آخرين
          </Link>
        </div>
      </div>
    );
  }

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-black">
      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* ====== HEADER ====== */}
      <div className="bg-gradient-to-r from-gray-900 to-black sticky top-0 z-20 border-b border-gray-800">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/clips" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
              <FaChevronLeft /> العودة للفنانين
            </Link>
            <Link to="/favorite-clips" className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition">
              <FaStar className="text-yellow-400" />
              <span className="hidden sm:inline">مفضلاتي</span>
              <span className="bg-yellow-500/30 px-1.5 py-0.5 rounded-full text-xs">{favoriteClips.length}</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <img src={artist.image} alt={artist.name} className="w-10 h-10 rounded-full object-cover" />
            <div>
              <h1 className="text-white font-bold">{artist.name}</h1>
              <p className="text-gray-500 text-xs">{clips.length} كليب</p>
            </div>
          </div>
        </div>
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ====== VIDEO PLAYER ====== */}
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
                
                <div className="mt-4">
                  <div className="flex justify-between items-start flex-wrap gap-3">
                    <div>
                      <h2 className="text-white text-xl font-bold">{currentClip.title}</h2>
                      <p className="text-gray-400">{artist.name}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => toggleLike(currentClip.id)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                        {likedClips.includes(currentClip.id) ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                        <span>{likedClips.includes(currentClip.id) ? 'ألغى الإعجاب' : 'إعجاب'}</span>
                      </button>
                      <button onClick={() => toggleFavorite(currentClip.id)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                        {favoriteClips.includes(currentClip.id) ? <FaStar className="text-yellow-500" /> : <FaRegStar />}
                        <span>{favoriteClips.includes(currentClip.id) ? 'مفضلة' : 'أضف للمفضلة'}</span>
                      </button>
                      {/* ✅ زر إضافة إلى قائمة المشاهدة */}
                      <button 
                        onClick={() => toggleWatchlist(currentClip)} 
                        disabled={isToggling}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600/50 rounded-full hover:bg-purple-600 transition disabled:opacity-50"
                      >
                        <FaList className="text-white" />
                        <span>قائمتي</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-500 text-sm mt-3 flex-wrap">
                    <span className="flex items-center gap-1"><FaPlay /> {currentClip.views?.toLocaleString() || '0'}</span>
                    <span className="flex items-center gap-1"><FaHeart /> {currentClip.likes?.toLocaleString() || '0'}</span>
                    <span className="flex items-center gap-1"><FaClock /> {currentClip.duration || 'غير محدد'}</span>
                    <span className="flex items-center gap-1"><FaCalendarAlt /> {currentClip.year || 'غير محدد'}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-900 rounded-xl aspect-video flex flex-col items-center justify-center border border-gray-800">
                <FaVideo className="text-gray-700 text-5xl mb-3" />
                <p className="text-gray-500">اختر كليباً من القائمة</p>
              </div>
            )}
          </div>
          
          {/* ====== PLAYLIST ====== */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-white font-semibold">قائمة التشغيل ({displayedClips.length})</h3>
                <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`px-2 py-1 rounded-lg text-xs transition ${showFavoritesOnly ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>
                  {showFavoritesOnly ? '⭐ المفضلة فقط' : 'كل الكليبات'}
                </button>
              </div>
              <button className="text-gray-400 hover:text-white"><FaShare /></button>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {displayedClips.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {showFavoritesOnly ? 'لا توجد كليبات في المفضلة' : 'لا توجد كليبات'}
                </div>
              ) : (
                displayedClips.map((clip, idx) => {
                  const originalIdx = clips.findIndex(c => c.id === clip.id);
                  return (
                    <div 
                      key={clip.id} 
                      onClick={() => playClip(clip, originalIdx)} 
                      className={`flex items-center gap-3 p-3 cursor-pointer transition hover:bg-gray-800 ${currentClip?.id === clip.id ? 'bg-red-600/20 border-r-2 border-red-500' : ''}`}
                    >
                      <div className="relative w-16 h-12 rounded overflow-hidden flex-shrink-0 bg-gray-800">
                        <img 
                          src={clip.thumbnail} 
                          alt={clip.title} 
                          className="w-full h-full object-cover" 
                          onError={(e) => { 
                            e.target.src = 'https://via.placeholder.com/320x180?text=No+Image';
                          }} 
                        />
                        {currentClip?.id === clip.id && (
                          <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                            <FaPlay className="text-white text-xs" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium line-clamp-1">{clip.title}</p>
                        <p className="text-gray-500 text-xs">{clip.duration || 'غير محدد'}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); toggleLike(clip.id); }} className="p-1">
                          {likedClips.includes(clip.id) ? <FaHeart className="text-red-500 text-sm" /> : <FaRegHeart className="text-gray-400 text-sm" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(clip.id); }} className="p-1">
                          {favoriteClips.includes(clip.id) ? <FaStar className="text-yellow-500 text-sm" /> : <FaRegStar className="text-gray-400 text-sm" />}
                        </button>
                        {/* ✅ زر إضافة إلى قائمة المشاهدة في القائمة الجانبية */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleWatchlist(clip); }} 
                          disabled={isToggling}
                          className="p-1 text-purple-400 hover:text-purple-300 disabled:opacity-50"
                        >
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

      {/* ====== FLOATING PLAYLIST TOGGLE ====== */}
      {!showPlaylist && displayedClips.length > 0 && (
        <button onClick={() => setShowPlaylist(true)} className="fixed bottom-20 right-4 z-30 bg-red-600 w-12 h-12 rounded-full flex items-center justify-center shadow-lg lg:hidden">
          <FaList className="text-white" />
        </button>
      )}

      {showPlaylist && (
        <div className="fixed inset-0 bg-black/90 z-40 lg:hidden" onClick={() => setShowPlaylist(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-900">
              <h3 className="text-white font-bold">قائمة التشغيل</h3>
              <button onClick={() => setShowPlaylist(false)} className="text-gray-400"><FaTimes /></button>
            </div>
            <div className="p-3">
              {displayedClips.map((clip, idx) => {
                const originalIdx = clips.findIndex(c => c.id === clip.id);
                return (
                  <div 
                    key={clip.id} 
                    onClick={() => { playClip(clip, originalIdx); setShowPlaylist(false); }} 
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition hover:bg-gray-800 ${currentClip?.id === clip.id ? 'bg-red-600/20' : ''}`}
                  >
                    <img 
                      src={clip.thumbnail} 
                      alt={clip.title} 
                      className="w-12 h-10 object-cover rounded bg-gray-800" 
                      onError={(e) => { 
                        e.target.src = 'https://via.placeholder.com/320x180?text=No+Image';
                      }} 
                    />
                    <div className="flex-1">
                      <p className="text-white text-sm">{clip.title}</p>
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

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ArtistClipsPage;