// src/pages/clips/ArtistClipsPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FaHeart, FaRegHeart, FaList, FaTimes, FaShare, FaChevronLeft, FaStar, FaRegStar, FaClock, FaCalendarAlt, FaPlay } from 'react-icons/fa';
import VideoPlayer from '../../components/VideoPlayer';
import { artistsAPI, clipsAPI } from '../../services/api';

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
  
  const toastTimeout = useRef(null);

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  const formatYouTubeUrl = (url) => {
    if (!url) return url;
    
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
    
    return url;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [artistData, clipsData] = await Promise.all([
          artistsAPI.getById(artistId),
          clipsAPI.getByArtist(artistId)
        ]);
        setArtist(artistData);
        
        const formattedClips = clipsData.map(clip => ({
          ...clip,
          videoUrl: formatYouTubeUrl(clip.videoUrl)
        }));
        setClips(formattedClips);
        if (formattedClips.length > 0) {
          setCurrentClip(formattedClips[0]);
        }
        
        const favorites = await clipsAPI.getFavorites();
        setFavoriteClips(favorites.map(c => c.id));
        
        const savedLikes = localStorage.getItem(`liked_clips_${artistId}`);
        if (savedLikes) setLikedClips(JSON.parse(savedLikes));
      } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [artistId]);

  useEffect(() => {
    localStorage.setItem(`liked_clips_${artistId}`, JSON.stringify(likedClips));
  }, [likedClips, artistId]);

  const toggleLike = async (clipId) => {
    try {
      const data = await clipsAPI.toggleLike(clipId);
      setLikedClips(data.likes);
      showNotification(likedClips.includes(clipId) ? 'تم إزالة الإعجاب' : 'تم الإعجاب');
    } catch (error) {
      console.error('خطأ في تغيير الإعجاب:', error);
    }
  };

  const toggleFavorite = async (clipId) => {
    try {
      const data = await clipsAPI.toggleFavorite(clipId);
      setFavoriteClips(data.favorites);
      showNotification(favoriteClips.includes(clipId) ? 'تم إزالة من المفضلة' : 'تم إضافة إلى المفضلة');
    } catch (error) {
      console.error('خطأ في تغيير المفضلة:', error);
    }
  };

  const playClip = (clip, index) => {
    const formattedUrl = formatYouTubeUrl(clip.videoUrl);
    const formattedClip = { ...clip, videoUrl: formattedUrl };
    setCurrentClip(formattedClip);
    setCurrentIndex(index);
  };

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
    const formattedUrl = formatYouTubeUrl(nextClipData.videoUrl);
    setCurrentClip({ ...nextClipData, videoUrl: formattedUrl });
    setCurrentIndex(nextOriginalIndex);
  };

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
    const formattedUrl = formatYouTubeUrl(prevClipData.videoUrl);
    setCurrentClip({ ...prevClipData, videoUrl: formattedUrl });
    setCurrentIndex(prevOriginalIndex);
  };

  const displayedClips = showFavoritesOnly ? clips.filter(c => favoriteClips.includes(c.id)) : clips;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!artist) {
    return (
      <div className="flex justify-center items-center h-screen text-white">
        {t('common.notFound')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Header - ممتد */}
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

      {/* Main Content - ممتد */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            {currentClip && (
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
            )}
            
            {currentClip && (
              <div className="mt-4">
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div>
                    <h2 className="text-white text-xl font-bold">{currentClip.title}</h2>
                    <p className="text-gray-400">{artist.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleLike(currentClip.id)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                      {likedClips.includes(currentClip.id) ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                      <span>{likedClips.includes(currentClip.id) ? 'ألغى الإعجاب' : 'إعجاب'}</span>
                    </button>
                    <button onClick={() => toggleFavorite(currentClip.id)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                      {favoriteClips.includes(currentClip.id) ? <FaStar className="text-yellow-500" /> : <FaRegStar />}
                      <span>{favoriteClips.includes(currentClip.id) ? 'مفضلة' : 'أضف للمفضلة'}</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-500 text-sm mt-3">
                  <span className="flex items-center gap-1"><FaPlay /> {currentClip.views?.toLocaleString() || '0'}</span>
                  <span className="flex items-center gap-1"><FaHeart /> {currentClip.likes?.toLocaleString() || '0'}</span>
                  <span className="flex items-center gap-1"><FaClock /> {currentClip.duration}</span>
                  <span className="flex items-center gap-1"><FaCalendarAlt /> {currentClip.year}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Playlist Section */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
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
                    <div key={clip.id} onClick={() => playClip(clip, originalIdx)} className={`flex items-center gap-3 p-3 cursor-pointer transition hover:bg-gray-800 ${currentClip?.id === clip.id ? 'bg-red-600/20 border-r-2 border-red-500' : ''}`}>
                      <div className="relative w-16 h-12 rounded overflow-hidden flex-shrink-0">
                        <img src={clip.thumbnail} alt={clip.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://via.placeholder.com/320x180?text=No+Image'; }} />
                        {currentClip?.id === clip.id && <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center"><FaPlay className="text-white text-xs" /></div>}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium line-clamp-1">{clip.title}</p>
                        <p className="text-gray-500 text-xs">{clip.duration}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); toggleLike(clip.id); }} className="p-1">
                          {likedClips.includes(clip.id) ? <FaHeart className="text-red-500 text-sm" /> : <FaRegHeart className="text-gray-400 text-sm" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(clip.id); }} className="p-1">
                          {favoriteClips.includes(clip.id) ? <FaStar className="text-yellow-500 text-sm" /> : <FaRegStar className="text-gray-400 text-sm" />}
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

      {/* Floating Playlist Toggle for Mobile */}
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
                  <div key={clip.id} onClick={() => { playClip(clip, originalIdx); setShowPlaylist(false); }} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition hover:bg-gray-800 ${currentClip?.id === clip.id ? 'bg-red-600/20' : ''}`}>
                    <img src={clip.thumbnail} alt={clip.title} className="w-12 h-10 object-cover rounded" onError={(e) => { e.target.src = 'https://via.placeholder.com/320x180?text=No+Image'; }} />
                    <div className="flex-1">
                      <p className="text-white text-sm">{clip.title}</p>
                      <p className="text-gray-500 text-xs">{clip.duration}</p>
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