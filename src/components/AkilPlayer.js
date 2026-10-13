import React, { useState, useRef, useEffect } from 'react';
import { 
  FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, FaCompress,
  FaClosedCaptioning, FaBookmark, FaRegBookmark, FaRocket,
  FaThumbsUp, FaThumbsDown, FaTimes, FaCheck
} from 'react-icons/fa';

const AkilPlayer = ({ 
  src,           
  poster,        
  title,         
  autoPlay = false,
  subtitles = [],
  audioTracks = [],
  defaultSubtitle = '',
  defaultAudio = '',
  videoId,
  onEnded,
  onError,
  onComplete
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  // حالة المشغل
  const [playing, setPlaying] = useState(autoPlay);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [selectedSubtitle, setSelectedSubtitle] = useState(defaultSubtitle || null);
  
  // حالة النوافذ المنبثقة
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showMarathonNotification, setShowMarathonNotification] = useState(false);
  
  // بيانات
  const [bookmarks, setBookmarks] = useState([]);
  const [newBookmarkNote, setNewBookmarkNote] = useState('');
  const [marathonMessage, setMarathonMessage] = useState('');
  const [isMarathonMode, setIsMarathonMode] = useState(false);
  const [stats, setStats] = useState({
    likes: Math.floor(Math.random() * 100) + 10,
    dislikes: Math.floor(Math.random() * 10) + 1,
    userLiked: false,
    userDisliked: false
  });

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  let controlsTimeout = useRef(null);

  // تنسيق الرابط
  const encodeVideoUrl = (url) => {
    if (!url) return url;
    try {
      if (!url.startsWith('http') && !url.startsWith('https')) {
        url = 'http://' + url;
      }
      return url;
    } catch {
      return url;
    }
  };

  const cleanSrc = encodeVideoUrl(src);

  // تحميل البيانات المحفوظة
  useEffect(() => {
    if (videoId) {
      const savedBookmarks = localStorage.getItem(`cinewave_bookmarks_${videoId}`);
      if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
    }
  }, [videoId]);

  // التحكم في الفيديو
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };
    
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleEnded = () => {
      setPlaying(false);
      if (onEnded) onEnded();
      if (onComplete) onComplete(videoId);
    };
    const handleError = () => {
      setError('حدث خطأ في تشغيل الفيديو');
      if (onError) onError();
    };
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleVolumeChange = () => {
      setMuted(video.muted);
      setVolume(video.volume);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    if (autoPlay) {
      video.play().catch(() => setIsLoading(false));
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [cleanSrc, autoPlay, onEnded, onError, onComplete, videoId]);

  // إخفاء أشرطة التحكم بعد 3 ثواني
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  // دوال التحكم
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) video.pause();
    else video.play();
  };
  
  const skipForward = () => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.min(video.currentTime + 10, duration);
  };
  
  const skipBackward = () => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.max(video.currentTime - 10, 0);
  };
  
  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !muted;
      setMuted(!muted);
    }
  };
  
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.volume = val;
      setVolume(val);
      if (val === 0) video.muted = true;
      else if (muted) video.muted = false;
    }
  };
  
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!isFullscreen) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  const changeSpeed = (speed) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (video) video.currentTime = parseFloat(e.target.value);
  };

  // دوال الإعجاب
  const handleLike = () => {
    const newStats = { ...stats };
    if (stats.userLiked) {
      newStats.likes--;
      newStats.userLiked = false;
    } else {
      newStats.likes++;
      newStats.userLiked = true;
      if (stats.userDisliked) {
        newStats.dislikes--;
        newStats.userDisliked = false;
      }
    }
    setStats(newStats);
  };

  const handleDislike = () => {
    const newStats = { ...stats };
    if (stats.userDisliked) {
      newStats.dislikes--;
      newStats.userDisliked = false;
    } else {
      newStats.dislikes++;
      newStats.userDisliked = true;
      if (stats.userLiked) {
        newStats.likes--;
        newStats.userLiked = false;
      }
    }
    setStats(newStats);
  };

  // دوال الإشارات المرجعية
  const addBookmark = () => {
    const newBookmark = {
      id: Date.now(),
      time: currentTime,
      timeFormatted: formatTime(currentTime),
      note: newBookmarkNote || `علامة عند ${formatTime(currentTime)}`
    };
    const updated = [...bookmarks, newBookmark].sort((a, b) => a.time - b.time);
    setBookmarks(updated);
    localStorage.setItem(`cinewave_bookmarks_${videoId}`, JSON.stringify(updated));
    setNewBookmarkNote('');
    setShowAddBookmark(false);
    showMessage(`📌 تم إضافة إشارة عند ${formatTime(currentTime)}`);
  };

  const goToBookmark = (time) => {
    const video = videoRef.current;
    if (video) video.currentTime = time;
    setShowBookmarks(false);
  };
  
  const deleteBookmark = (id) => {
    const updated = bookmarks.filter(b => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem(`cinewave_bookmarks_${videoId}`, JSON.stringify(updated));
  };

  // دوال الترجمة
  const changeSubtitle = (lang) => {
    const textTracks = videoRef.current?.textTracks;
    if (textTracks) {
      for (let i = 0; i < textTracks.length; i++) {
        textTracks[i].mode = textTracks[i].language === lang ? 'showing' : 'disabled';
      }
    }
    setSelectedSubtitle(lang);
    setShowSubtitleMenu(false);
  };

  // وضع الماراثون
  const toggleMarathonMode = () => {
    setIsMarathonMode(!isMarathonMode);
    showMessage(!isMarathonMode ? '🎉 وضع الماراثون مفعل!' : 'وضع الماراثون غير مفعل');
  };

  const showMessage = (msg) => {
    setMarathonMessage(msg);
    setShowMarathonNotification(true);
    setTimeout(() => setShowMarathonNotification(false), 2000);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef} 
      className="relative w-full bg-black rounded-xl overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* مؤشر التحميل */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* رسالة الخطأ */}
      {error && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-white text-sm mb-2">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-3 py-1 rounded text-xs">إعادة المحاولة</button>
        </div>
      )}

      {/* إشعار مؤقت */}
      {showMarathonNotification && marathonMessage && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-purple-600 text-white px-3 py-1 rounded-full shadow-lg text-xs whitespace-nowrap">
          {marathonMessage}
        </div>
      )}

      {/* عنوان الفيديو */}
      {title && (
        <div className="absolute top-2 left-2 z-10 bg-black/60 rounded px-2 py-0.5">
          <span className="text-white text-xs">{title}</span>
        </div>
      )}

      {/* نافذة الإشارات المرجعية */}
      {showBookmarks && (
        <div className="absolute top-0 right-0 w-48 bg-black/90 rounded-bl-lg p-2 z-40 text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-white font-bold">📌 الإشارات</span>
            <button onClick={() => setShowBookmarks(false)} className="text-gray-400"><FaTimes size={10} /></button>
          </div>
          {bookmarks.length === 0 ? (
            <p className="text-gray-500 text-center py-1">لا توجد إشارات</p>
          ) : (
            bookmarks.map(b => (
              <div key={b.id} className="bg-gray-800 rounded p-1 mb-1 flex justify-between items-center">
                <button onClick={() => goToBookmark(b.time)} className="text-yellow-400 text-xs">{b.timeFormatted}</button>
                <button onClick={() => deleteBookmark(b.id)} className="text-red-400 text-xs">✕</button>
              </div>
            ))
          )}
        </div>
      )}

      {/* نافذة إضافة إشارة */}
      {showAddBookmark && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 z-50" onClick={() => setShowAddBookmark(false)}>
          <div className="bg-gray-900 rounded-xl max-w-xs w-full p-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-white text-sm font-bold mb-2">📌 إضافة إشارة</h3>
            <p className="text-gray-400 text-xs mb-2">الوقت: <span className="text-yellow-400">{formatTime(currentTime)}</span></p>
            <textarea placeholder="ملاحظة..." value={newBookmarkNote} onChange={e => setNewBookmarkNote(e.target.value)} className="w-full bg-gray-800 rounded p-2 text-white text-xs" rows="2" />
            <div className="flex gap-2 mt-2">
              <button onClick={addBookmark} className="flex-1 bg-yellow-600 text-white py-1 rounded text-xs">حفظ</button>
              <button onClick={() => setShowAddBookmark(false)} className="flex-1 bg-gray-700 text-white py-1 rounded text-xs">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* قائمة الترجمة */}
      {showSubtitleMenu && subtitles.length > 0 && (
        <div className="absolute bottom-14 right-2 bg-gray-800 rounded-lg shadow-xl py-1 z-30 min-w-[100px]">
          <button onClick={() => changeSubtitle(null)} className="w-full text-right px-2 py-1 text-xs text-gray-300 hover:bg-gray-700">إيقاف الترجمة</button>
          {subtitles.map(sub => (
            <button key={sub.lang} onClick={() => changeSubtitle(sub.lang)} className="w-full text-right px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 flex justify-between items-center">
              {sub.label} {selectedSubtitle === sub.lang && <FaCheck className="text-red-500 text-xs" />}
            </button>
          ))}
        </div>
      )}

      {/* قائمة السرعة */}
      {showSpeedMenu && (
        <div className="absolute bottom-14 right-20 bg-gray-800 rounded-lg shadow-xl py-1 z-30 min-w-[55px]">
          {speeds.map(speed => (
            <button key={speed} onClick={() => changeSpeed(speed)} className={`w-full text-right px-2 py-1 text-xs ${playbackSpeed === speed ? 'text-red-500' : 'text-gray-300 hover:bg-gray-700'}`}>
              {speed}x
            </button>
          ))}
        </div>
      )}

      {/* عنصر الفيديو */}
      <video
        ref={videoRef}
        src={cleanSrc}
        poster={poster}
        className="w-full aspect-video"
        playsInline
        preload="auto"
      >
        {/* إضافة الترجمات */}
        {subtitles.map((sub, idx) => (
          <track
            key={idx}
            kind="subtitles"
            label={sub.label}
            srcLang={sub.lang}
            src={sub.url}
            default={sub.lang === defaultSubtitle}
          />
        ))}
      </video>

      {/* شريط التحكم المخصص */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* شريط التقدم */}
        <div className="mb-1">
          <input 
            type="range" 
            min="0" 
            max={duration} 
            step="0.1" 
            value={currentTime} 
            onChange={handleSeek} 
            className="w-full h-1 bg-gray-600 rounded-lg cursor-pointer" 
            style={{ background: `linear-gradient(to right, #e50914 ${progress}%, #4b5563 ${progress}%)` }} 
          />
          <div className="flex justify-between text-white text-[10px] mt-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex items-center justify-between flex-wrap gap-1">
          <div className="flex items-center gap-1">
            <button onClick={togglePlay} className="text-white hover:text-red-500 p-1">{playing ? <FaPause size={14} /> : <FaPlay size={14} />}</button>
            <button onClick={skipBackward} className="text-white hover:text-red-500 p-1 text-xs">◀◀ 10</button>
            <button onClick={skipForward} className="text-white hover:text-red-500 p-1 text-xs">10 ▶▶</button>
            
            <div className="flex items-center gap-1">
              <button onClick={toggleMute} className="text-white hover:text-red-500 p-1">{muted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}</button>
              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="w-12 h-1 bg-gray-600 rounded cursor-pointer" />
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* زر الإعجاب */}
            <button onClick={handleLike} className={`p-1 ${stats.userLiked ? 'text-green-500' : 'text-white hover:text-green-500'}`}><FaThumbsUp size={12} /></button>
            
            {/* زر الإشارات المرجعية */}
            <button onClick={() => setShowBookmarks(!showBookmarks)} className="text-white hover:text-yellow-500 p-1"><FaBookmark size={12} /></button>
            <button onClick={() => setShowAddBookmark(true)} className="text-white hover:text-yellow-500 p-1"><FaRegBookmark size={12} /></button>
            
            {/* زر وضع الماراثون */}
            <button onClick={toggleMarathonMode} className={`p-1 ${isMarathonMode ? 'text-purple-500' : 'text-white hover:text-purple-500'}`}><FaRocket size={12} /></button>
            
            {/* زر السرعة */}
            <div className="relative">
              <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="text-white hover:text-red-500 px-1 py-1 text-xs">{playbackSpeed}x</button>
            </div>

            {/* زر الترجمة */}
            {subtitles.length > 0 && (
              <button onClick={() => setShowSubtitleMenu(!showSubtitleMenu)} className="text-white hover:text-red-500 p-1"><FaClosedCaptioning size={14} /></button>
            )}

            {/* زر ملء الشاشة */}
            <button onClick={toggleFullscreen} className="text-white hover:text-red-500 p-1">{isFullscreen ? <FaCompress size={14} /> : <FaExpand size={14} />}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AkilPlayer;