import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, 
  FaCompress, FaBackward, FaForward, FaRedoAlt, FaRandom,
  FaHeart, FaRegHeart, FaShare, FaDownload, FaList, FaTimes,
  FaMicrophoneAlt, FaCalendarAlt, FaClock, FaStar, FaRegStar
} from 'react-icons/fa';

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

  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeout = useRef(null);
  const animationRef = useRef(null);

  // تحميل حالة الإعجاب
  useEffect(() => {
    if (songId) {
      const liked = localStorage.getItem(`liked_song_${songId}`);
      setIsLiked(liked === 'true');
    }
  }, [songId]);

  // التحقق من حالة المفضلة
  useEffect(() => {
    if (songId) {
      const favorites = JSON.parse(localStorage.getItem('cinewave_favorite_songs') || '[]');
      setIsFavorited(favorites.includes(songId));
    }
  }, [songId]);

  const handleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    localStorage.setItem(`liked_song_${songId}`, newLiked);
    
    // إشعار قصير
    const message = newLiked ? 'تم إضافة إعجاب' : 'تم إزالة الإعجاب';
    showToast(message);
  };

  // إضافة/إزالة من المفضلة
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
    
    // استدعاء دالة الـ callback إذا وجدت
    if (onFavoriteToggle) onFavoriteToggle(!isFavorited);
    
    // إشعار قصير
    const message = isFavorited ? 'تم إزالة الأغنية من المفضلة' : 'تم إضافة الأغنية إلى المفضلة';
    showToast(message);
  };

  // دالة عرض الإشعار
  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-fadeIn';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
    setIsLoading(false);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
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
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (currentTime / duration) * 100;

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

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  if (!song) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 text-center">
        <p className="text-gray-500">اختر أغنية للاستماع</p>
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
      <div className="relative p-6 pb-20 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex items-center gap-4">
          <img 
            src={song.coverImage || artist?.image} 
            alt={song.title} 
            className="w-24 h-24 rounded-2xl shadow-2xl object-cover"
          />
          <div className="flex-1">
            <h2 className="text-white text-2xl font-bold">{song.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <img src={artist?.image} alt={artist?.name} className="w-5 h-5 rounded-full object-cover" />
              <p className="text-gray-400">{artist?.name}</p>
            </div>
            <div className="flex items-center gap-3 text-gray-500 text-xs mt-2">
              <span className="flex items-center gap-1"><FaCalendarAlt /> {song.year}</span>
              <span className="flex items-center gap-1"><FaClock /> {song.duration}</span>
              <span className="flex items-center gap-1"><FaMicrophoneAlt /> {song.genre}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {/* زر الإعجاب */}
            <button onClick={handleLike} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition" title={isLiked ? 'إزالة الإعجاب' : 'إعجاب'}>
              {isLiked ? <FaHeart className="text-red-500 text-xl" /> : <FaRegHeart className="text-white text-xl" />}
            </button>
            {/* زر المفضلة */}
            <button onClick={handleFavorite} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition" title={isFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}>
              {isFavorited ? <FaStar className="text-yellow-500 text-xl" /> : <FaRegStar className="text-white text-xl" />}
            </button>
            <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition">
              <FaShare className="text-white text-xl" />
            </button>
            <button onClick={() => setShowPlaylist(!showPlaylist)} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition">
              <FaList className="text-white text-xl" />
            </button>
          </div>
        </div>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={song.audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        autoPlay={autoPlay}
      />

      {/* Visualizer / Waveform */}
      <div className="px-6 py-4">
        <div className="relative">
          <div className="h-20 flex items-center justify-center gap-1">
            {[...Array(60)].map((_, i) => (
              <div 
                key={i}
                className="w-1 bg-purple-500 rounded-full transition-all duration-75"
                style={{ 
                  height: playing ? `${Math.random() * 40 + 10}px` : '10px',
                  opacity: playing ? 0.7 : 0.3
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-3">
        <input
          type="range"
          min="0"
          max={duration}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #e50914 ${progress}%, #374151 ${progress}%)`
          }}
        />
        <div className="flex justify-between text-gray-400 text-xs mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className={`px-6 pb-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-50'}`}>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => onPrev?.()} className="text-gray-400 hover:text-white transition p-2">
            <FaBackward size={20} />
          </button>
          <button onClick={skipBackward} className="text-gray-400 hover:text-white transition p-2">
            <FaBackward size={16} className="opacity-70" />
            <span className="text-xs ml-1">10</span>
          </button>
          <button onClick={togglePlay} className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition shadow-lg transform hover:scale-105">
            {playing ? <FaPause className="text-white text-2xl" /> : <FaPlay className="text-white text-2xl ml-1" />}
          </button>
          <button onClick={skipForward} className="text-gray-400 hover:text-white transition p-2">
            <span className="text-xs mr-1">10</span>
            <FaForward size={16} className="opacity-70" />
          </button>
          <button onClick={() => onNext?.()} className="text-gray-400 hover:text-white transition p-2">
            <FaForward size={20} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 mt-4">
          <button onClick={toggleRepeat} className={`transition p-1 ${repeat ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}>
            <FaRedoAlt size={14} />
          </button>
          <button onClick={toggleShuffle} className={`transition p-1 ${shuffle ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}>
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
              className="w-24 h-1 bg-gray-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Lyrics Section */}
      {showLyrics && song.lyrics && (
        <div className="border-t border-gray-800 p-6 max-h-96 overflow-y-auto bg-black/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold text-lg">📝 كلمات الأغنية</h3>
            <button onClick={() => setShowLyrics(false)} className="text-gray-400 hover:text-white">
              <FaTimes />
            </button>
          </div>
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">{song.lyrics}</p>
        </div>
      )}

      {song.lyrics && !showLyrics && (
        <div className="px-6 pb-4">
          <button onClick={() => setShowLyrics(true)} className="text-purple-400 text-sm hover:text-purple-300">
            📝 عرض كلمات الأغنية
          </button>
        </div>
      )}

      {/* Playlist Sidebar */}
      {showPlaylist && playlist.length > 0 && (
        <div className="absolute top-0 right-0 w-80 h-full bg-black/95 z-50 overflow-y-auto border-l border-gray-800">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">🎵 قائمة التشغيل</h3>
              <button onClick={() => setShowPlaylist(false)} className="text-gray-400 hover:text-white">
                <FaTimes />
              </button>
            </div>
            <div className="space-y-2">
              {playlist.map((item, idx) => {
                const isItemFavorited = JSON.parse(localStorage.getItem('cinewave_favorite_songs') || '[]').includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => onPlaylistItemClick?.(item)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${song.id === item.id ? 'bg-red-600/20 border border-red-500' : 'hover:bg-gray-800'}`}
                  >
                    <img src={item.coverImage} alt={item.title} className="w-10 h-10 rounded object-cover" />
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{item.title}</p>
                      <p className="text-gray-500 text-xs">{item.duration}</p>
                    </div>
                    {isItemFavorited && <FaStar className="text-yellow-500 text-xs" />}
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

export default AudioPlayerPro;