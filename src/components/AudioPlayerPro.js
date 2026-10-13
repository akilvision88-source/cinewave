// src/components/AudioPlayerPro.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, 
  FaCompress, FaBackward, FaForward, FaRedoAlt, FaRandom,
  FaHeart, FaRegHeart, FaShare, FaDownload, FaList, FaTimes,
  FaMicrophoneAlt, FaCalendarAlt, FaClock, FaStar, FaRegStar,
  FaSyncAlt, FaMusic  // ✅ إضافة FaMusic هنا
} from 'react-icons/fa';
import { songsAPI } from '../services/api';

const AudioPlayerPro = ({ 
  song,
  artist,
  playlist = [],
  onPlaylistItemClick,
  onNext,
  onPrev,
  autoPlay = true,
  songId,
  isFavorited: initialIsFavorited = false,
  onFavoriteToggle
}) => {
  const [playing, setPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeout = useRef(null);
  const animationRef = useRef(null);

  // ========== تحميل حالة الإعجاب والمفضلة ==========
  useEffect(() => {
    if (songId) {
      const liked = localStorage.getItem(`liked_song_${songId}`);
      setIsLiked(liked === 'true');
      
      const favorites = JSON.parse(localStorage.getItem('cinewave_favorite_songs') || '[]');
      setIsFavorited(favorites.includes(songId));
    }
  }, [songId]);

  // ========== معالجة خطأ الصوت ==========
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleError = (e) => {
        console.error('❌ خطأ في تشغيل الصوت:', e);
        setError('تعذر تشغيل الأغنية. قد يكون الرابط غير صحيح أو غير متاح.');
        setIsLoading(false);
      };
      audio.addEventListener('error', handleError);
      return () => audio.removeEventListener('error', handleError);
    }
  }, [song]);

  // ========== الحصول على رابط الصوت بشكل صحيح ==========
  const getAudioUrl = () => {
    if (!song) return null;
    // دعم كلا التنسيقين: audio_url و audioUrl
    return song.audio_url || song.audioUrl || null;
  };

  // ========== التحقق من وجود رابط صحيح ==========
  useEffect(() => {
    const audioUrl = getAudioUrl();
    if (!audioUrl) {
      setError('لا يوجد رابط للأغنية');
      setIsLoading(false);
    } else {
      setError(null);
    }
  }, [song]);

  const handleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    localStorage.setItem(`liked_song_${songId}`, newLiked);
    showToast(newLiked ? '❤️ تم إضافة إعجاب' : '💔 تم إزالة الإعجاب');
  };

  const handleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('cinewave_favorite_songs') || '[]');
    let newFavorites;
    
    if (isFavorited) {
      newFavorites = favorites.filter(id => id !== songId);
    } else {
      newFavorites = [...favorites, songId];
    }
    
    localStorage.setItem('cinewave_favorite_songs', JSON.stringify(newFavorites));
    setIsFavorited(!isFavorited);
    
    if (onFavoriteToggle) onFavoriteToggle(!isFavorited);
    showToast(isFavorited ? '⭐ تم إزالة من المفضلة' : '⭐ تم إضافة إلى المفضلة');
  };

  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-fadeIn';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    if (repeat) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (onNext) {
      onNext();
    }
  };

  const togglePlay = () => {
    if (error) {
      setError(null);
      setIsLoading(true);
      try {
        const audioUrl = getAudioUrl();
        if (audioUrl) {
          audioRef.current.src = audioUrl;
          audioRef.current.load();
          audioRef.current.play();
          setPlaying(true);
        }
      } catch (err) {
        console.error('❌ خطأ في التشغيل:', err);
        setError('تعذر تشغيل الأغنية');
        setIsLoading(false);
      }
      return;
    }

    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const toggleMute = () => {
    setMuted(!muted);
    audioRef.current.muted = !muted;
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    setMuted(newVolume === 0);
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const skipForward = () => {
    audioRef.current.currentTime += 10;
  };

  const skipBackward = () => {
    audioRef.current.currentTime -= 10;
  };

  const toggleRepeat = () => {
    setRepeat(!repeat);
    audioRef.current.loop = !repeat;
  };

  const toggleShuffle = () => {
    setShuffle(!shuffle);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // تحديث التقدم بشكل مستمر
  useEffect(() => {
    const updateProgress = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
      animationRef.current = requestAnimationFrame(updateProgress);
    };
    if (playing) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [playing]);

  // إعادة تشغيل الصوت عند تغيير الأغنية
  useEffect(() => {
    if (song && audioRef.current) {
      const audioUrl = getAudioUrl();
      if (audioUrl) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        setIsLoading(true);
        setError(null);
        setCurrentTime(0);
        if (autoPlay) {
          audioRef.current.play().catch(err => {
            console.warn('⚠️ تعذر التشغيل التلقائي:', err);
            setPlaying(false);
            setIsLoading(false);
          });
        }
      }
    }
  }, [song]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  // الحصول على اسم الفنان
  const getArtistName = () => {
    if (artist) {
      return artist.name || artist.name_ar || 'فنان';
    }
    if (song && song.artist_name) {
      return song.artist_name;
    }
    return 'فنان';
  };

  // الحصول على صورة الفنان
  const getArtistImage = () => {
    if (artist && artist.image) return artist.image;
    if (song && song.artist_image) return song.artist_image;
    return null;
  };

  // الحصول على غلاف الأغنية
  const getCoverImage = () => {
    if (song) {
      return song.cover_image || song.coverImage || song.cover || getArtistImage() || 'https://via.placeholder.com/400x400/1a1a2e/ffffff?text=🎵';
    }
    return 'https://via.placeholder.com/400x400/1a1a2e/ffffff?text=🎵';
  };

  // الحصول على عنوان الأغنية
  const getSongTitle = () => {
    if (!song) return 'اختر أغنية';
    return song.title || song.title_ar || song.title_en || 'بدون عنوان';
  };

  if (!song) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 text-center">
        <div className="text-gray-500">
          <FaMusic className="text-5xl mx-auto mb-3 opacity-50" />
          <p>اختر أغنية للاستماع</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Header with artist info */}
      <div className="relative p-6 pb-4 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex items-center gap-4">
          <img 
            src={getCoverImage()} 
            alt={getSongTitle()} 
            className="w-24 h-24 rounded-2xl shadow-2xl object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x400/1a1a2e/ffffff?text=🎵';
            }}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-white text-xl sm:text-2xl font-bold truncate">{getSongTitle()}</h2>
            <div className="flex items-center gap-2 mt-1">
              {getArtistImage() ? (
                <img src={getArtistImage()} alt={getArtistName()} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <FaMicrophoneAlt className="text-purple-400 text-xs" />
              )}
              <p className="text-gray-400 text-sm truncate">{getArtistName()}</p>
            </div>
            <div className="flex items-center gap-3 text-gray-500 text-xs mt-2 flex-wrap">
              {song.year && (
                <span className="flex items-center gap-1"><FaCalendarAlt size={10} /> {song.year}</span>
              )}
              {song.duration && (
                <span className="flex items-center gap-1"><FaClock size={10} /> {song.duration}</span>
              )}
              {song.genre && (
                <span className="flex items-center gap-1"><FaMicrophoneAlt size={10} /> {song.genre}</span>
              )}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button 
              onClick={handleLike} 
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition" 
              title={isLiked ? 'إزالة الإعجاب' : 'إعجاب'}
            >
              {isLiked ? <FaHeart className="text-red-500 text-lg sm:text-xl" /> : <FaRegHeart className="text-white text-lg sm:text-xl" />}
            </button>
            <button 
              onClick={handleFavorite} 
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition" 
              title={isFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            >
              {isFavorited ? <FaStar className="text-yellow-500 text-lg sm:text-xl" /> : <FaRegStar className="text-white text-lg sm:text-xl" />}
            </button>
            <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition">
              <FaShare className="text-white text-lg sm:text-xl" />
            </button>
            {playlist.length > 0 && (
              <button 
                onClick={() => setShowPlaylist(!showPlaylist)} 
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition"
              >
                <FaList className="text-white text-lg sm:text-xl" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={getAudioUrl() || undefined}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={(e) => {
          console.error('❌ خطأ في الصوت:', e);
          setError('تعذر تشغيل الأغنية');
          setIsLoading(false);
        }}
        preload="metadata"
      />

      {/* Visualizer */}
      <div className="px-6 py-2">
        <div className="relative">
          <div className="h-16 flex items-center justify-center gap-0.5">
            {[...Array(40)].map((_, i) => (
              <div 
                key={i}
                className="w-1 bg-purple-500 rounded-full transition-all duration-75"
                style={{ 
                  height: playing && !isLoading ? `${Math.random() * 30 + 10}px` : '8px',
                  opacity: playing && !isLoading ? 0.7 : 0.3
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-6 py-2">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-2 text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                setIsLoading(true);
                const audioUrl = getAudioUrl();
                if (audioUrl) {
                  audioRef.current.src = audioUrl;
                  audioRef.current.load();
                  audioRef.current.play().catch(() => setIsLoading(false));
                }
              }}
              className="mt-1 text-white text-xs bg-red-600 px-3 py-1 rounded hover:bg-red-700"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && !error && (
        <div className="px-6 py-1 text-center">
          <FaSyncAlt className="animate-spin text-purple-400 text-lg mx-auto" />
        </div>
      )}

      {/* Progress Bar */}
      <div className="px-6 mb-2">
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          disabled={isLoading || !!error}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
          style={{
            background: duration > 0 ? `linear-gradient(to right, #e50914 ${progress}%, #374151 ${progress}%)` : '#374151'
          }}
        />
        <div className="flex justify-between text-gray-400 text-xs mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className={`px-6 pb-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-50'}`}>
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <button 
            onClick={() => onPrev?.()} 
            className="text-gray-400 hover:text-white transition p-2 disabled:opacity-30"
            disabled={!onPrev || isLoading}
          >
            <FaBackward size={18} />
          </button>
          <button 
            onClick={skipBackward} 
            className="text-gray-400 hover:text-white transition p-2 disabled:opacity-30"
            disabled={isLoading || !!error}
          >
            <FaBackward size={14} className="opacity-70" />
            <span className="text-xs ml-1">10</span>
          </button>
          <button 
            onClick={togglePlay} 
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition shadow-lg transform hover:scale-105 disabled:opacity-50"
            disabled={isLoading && !error}
          >
            {isLoading && !error ? 
              <FaSyncAlt className="text-white text-xl animate-spin" /> :
              playing ? <FaPause className="text-white text-xl sm:text-2xl" /> : <FaPlay className="text-white text-xl sm:text-2xl ml-1" />
            }
          </button>
          <button 
            onClick={skipForward} 
            className="text-gray-400 hover:text-white transition p-2 disabled:opacity-30"
            disabled={isLoading || !!error}
          >
            <span className="text-xs mr-1">10</span>
            <FaForward size={14} className="opacity-70" />
          </button>
          <button 
            onClick={() => onNext?.()} 
            className="text-gray-400 hover:text-white transition p-2 disabled:opacity-30"
            disabled={!onNext || isLoading}
          >
            <FaForward size={18} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-4 mt-3">
          <button 
            onClick={toggleRepeat} 
            className={`transition p-1 ${repeat ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}
          >
            <FaRedoAlt size={14} />
          </button>
          <button 
            onClick={toggleShuffle} 
            className={`transition p-1 ${shuffle ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}
          >
            <FaRandom size={14} />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-gray-500 hover:text-white transition p-1">
              {muted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-24 h-1 bg-gray-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Lyrics Section */}
      {song.lyrics && (
        <>
          {showLyrics ? (
            <div className="border-t border-gray-800 p-6 max-h-80 overflow-y-auto bg-black/50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold text-lg">📝 كلمات الأغنية</h3>
                <button onClick={() => setShowLyrics(false)} className="text-gray-400 hover:text-white">
                  <FaTimes />
                </button>
              </div>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line text-sm">{song.lyrics}</p>
            </div>
          ) : (
            <div className="px-6 pb-3">
              <button 
                onClick={() => setShowLyrics(true)} 
                className="text-purple-400 text-sm hover:text-purple-300 transition"
              >
                📝 عرض كلمات الأغنية
              </button>
            </div>
          )}
        </>
      )}

      {/* Playlist Sidebar */}
      {showPlaylist && playlist.length > 0 && (
        <div className="absolute top-0 right-0 w-72 sm:w-80 h-full bg-black/95 z-50 overflow-y-auto border-l border-gray-800">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">🎵 قائمة التشغيل</h3>
              <button onClick={() => setShowPlaylist(false)} className="text-gray-400 hover:text-white">
                <FaTimes />
              </button>
            </div>
            <div className="space-y-2">
              {playlist.map((item) => {
                const isItemFavorited = JSON.parse(localStorage.getItem('cinewave_favorite_songs') || '[]').includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => onPlaylistItemClick?.(item)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${song?.id === item.id ? 'bg-red-600/20 border border-red-500' : 'hover:bg-gray-800'}`}
                  >
                    <img 
                      src={item.cover_image || item.coverImage || 'https://via.placeholder.com/40x40/1a1a2e/ffffff?text=🎵'} 
                      alt={item.title} 
                      className="w-10 h-10 rounded object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/40x40/1a1a2e/ffffff?text=🎵';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.title || item.title_ar}</p>
                      <p className="text-gray-500 text-xs truncate">{item.artist_name || item.duration || ''}</p>
                    </div>
                    {isItemFavorited && <FaStar className="text-yellow-500 text-xs flex-shrink-0" />}
                    {song?.id === item.id && <FaPlay className="text-red-500 text-xs flex-shrink-0" />}
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

export default AudioPlayerPro;