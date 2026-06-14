import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { 
  FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, 
  FaCompress, FaBackward, FaForward, FaRedoAlt, FaRandom,
  FaHeart, FaRegHeart, FaShare, FaDownload, FaExternalLinkAlt,
  FaClosedCaptioning, FaCog, FaAngleDown, FaAngleUp, FaImage
} from 'react-icons/fa';

const VideoPlayer = ({ 
  videoUrl, 
  title, 
  artist, 
  onLike, 
  onFavorite, 
  isLiked = false,
  isFavorite = false,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
  autoPlay = true,
  className = ""
}) => {
  const [playing, setPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [thumbnail, setThumbnail] = useState(null);
  const [isExtractingThumbnail, setIsExtractingThumbnail] = useState(false);
  
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeout = useRef(null);
  const thumbnailCanvasRef = useRef(null);

  // تنسيق رابط YouTube
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

  // استخراج الصورة المصغرة من YouTube
  const extractYouTubeThumbnail = (url) => {
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
    return null;
  };

  // استخراج الصورة المصغرة من Vimeo
  const extractVimeoThumbnail = async (url) => {
    try {
      const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0];
      if (vimeoId) {
        const response = await fetch(`https://vimeo.com/api/v2/video/${vimeoId}.json`);
        const data = await response.json();
        if (data[0]?.thumbnail_large) {
          return data[0].thumbnail_large;
        }
      }
    } catch (error) {
      console.error('Error fetching Vimeo thumbnail:', error);
    }
    return null;
  };

  // استخراج الصورة المصغرة من رابط مباشر (محاولة أخذ لقطة من الفيديو)
  const extractDirectVideoThumbnail = () => {
    // نستخدم وهم مؤقت للفيديو المباشر
    return null;
  };

  // الحصول على الصورة المصغرة تلقائياً
  const getAutoThumbnail = async (url) => {
    setIsExtractingThumbnail(true);
    
    let thumbnailUrl = null;
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      thumbnailUrl = extractYouTubeThumbnail(url);
    } else if (url.includes('vimeo.com')) {
      thumbnailUrl = await extractVimeoThumbnail(url);
    } else {
      thumbnailUrl = extractDirectVideoThumbnail();
    }
    
    if (thumbnailUrl) {
      setThumbnail(thumbnailUrl);
    }
    
    setIsExtractingThumbnail(false);
  };

  // عند تحميل الرابط، نحاول استخراج الصورة المصغرة
  useEffect(() => {
    if (videoUrl) {
      getAutoThumbnail(videoUrl);
    }
  }, [videoUrl]);

  const formattedUrl = formatYouTubeUrl(videoUrl);

  // إخفاء أزرار التحكم بعد 3 ثواني
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  // معالج التحميل
  const handleVideoStart = () => {
    setHasStartedPlaying(true);
    setIsLoading(false);
    setIsBuffering(false);
    setError(false);
  };

  const handleVideoPlay = () => {
    if (!hasStartedPlaying) {
      setHasStartedPlaying(true);
      setIsLoading(false);
    }
    setIsBuffering(false);
  };

  const handleBuffer = () => {
    if (hasStartedPlaying) {
      setIsBuffering(true);
    } else {
      setIsLoading(true);
    }
  };

  const handleBufferEnd = () => {
    setIsBuffering(false);
    setIsLoading(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
    setIsBuffering(false);
  };

  const handleProgress = (state) => {
    setPlayed(state.played);
    if (state.played > 0 && !hasStartedPlaying) {
      setHasStartedPlaying(true);
      setIsLoading(false);
    }
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  const handleEnded = () => {
    if (repeat) {
      playerRef.current.seekTo(0);
      setPlaying(true);
    } else if (onNext && hasNext) {
      onNext();
    }
  };

  // التحكم في المشغل
  const togglePlay = () => setPlaying(!playing);
  const toggleMute = () => setMuted(!muted);
  const toggleRepeat = () => setRepeat(!repeat);
  const toggleShuffle = () => setShuffle(!shuffle);
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setMuted(newVolume === 0);
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    playerRef.current.seekTo(seekTime);
    setPlayed(seekTime);
  };

  const skipForward = () => {
    playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10);
  };

  const skipBackward = () => {
    playerRef.current.seekTo(playerRef.current.getCurrentTime() - 10);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!fullscreen) {
      container.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const openInNewTab = () => {
    window.open(formattedUrl, '_blank');
  };

  const changePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  useEffect(() => {
    const handleFullscreenChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // إعادة تعيين التحميل عند تغيير الرابط
  useEffect(() => {
    setIsLoading(true);
    setHasStartedPlaying(false);
    setError(false);
    setPlayed(0);
    setDuration(0);
    setPlaying(autoPlay);
    setThumbnail(null);
  }, [videoUrl, autoPlay]);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-xl overflow-hidden group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* الصورة المصغرة أثناء التحميل */}
      {(isLoading || isExtractingThumbnail) && !hasStartedPlaying && thumbnail && (
        <div className="absolute inset-0 z-5">
          <img src={thumbnail} alt={title} className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-400 text-sm">جاري تحميل الفيديو...</p>
            </div>
          </div>
        </div>
      )}

      {/* مؤشر التحميل */}
      {isLoading && !hasStartedPlaying && !thumbnail && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-400 text-sm">جاري تحميل الفيديو...</p>
          </div>
        </div>
      )}

      {/* مؤشر التخزين المؤقت */}
      {isBuffering && hasStartedPlaying && !error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* رسالة الخطأ */}
      {error && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20">
          <div className="text-red-500 text-5xl mb-3">⚠️</div>
          <p className="text-white text-lg mb-2">حدث خطأ في تحميل الفيديو</p>
          <p className="text-gray-400 text-sm mb-4">تأكد من صحة رابط الفيديو</p>
          <button 
            onClick={() => { setError(false); setIsLoading(true); setHasStartedPlaying(false); setPlaying(true); }}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* مشغل الفيديو */}
      <ReactPlayer
        ref={playerRef}
        url={formattedUrl}
        playing={playing && !error}
        volume={volume}
        muted={muted}
        playbackRate={playbackRate}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onEnded={handleEnded}
        onError={handleError}
        onReady={handleVideoStart}
        onPlay={handleVideoPlay}
        onStart={handleVideoStart}
        onBuffer={handleBuffer}
        onBufferEnd={handleBufferEnd}
        width="100%"
        height="100%"
        className="aspect-video"
        config={{
          youtube: {
            playerVars: { 
              modestbranding: 1, 
              rel: 0, 
              controls: 0,
              enablejsapi: 1,
              origin: window.location.origin
            }
          },
          vimeo: {
            playerOptions: { controls: false, byline: false, portrait: false, title: false }
          },
          dailymotion: {
            params: { 'ui-logo': false, 'controls': false }
          },
          file: {
            attributes: { controlsList: 'nodownload' }
          }
        }}
      />

      {/* أزرار التحكم */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 transition-opacity duration-300 z-10 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* شريط التقدم */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={played}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #e50914 ${played * 100}%, #4b5563 ${played * 100}%)`
            }}
          />
          <div className="flex justify-between text-white text-xs mt-1">
            <span>{formatTime(played * duration)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* الصف السفلي من الأزرار */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {/* تشغيل/إيقاف */}
            <button onClick={togglePlay} className="text-white hover:text-red-500 transition p-1">
              {playing ? <FaPause size={18} /> : <FaPlay size={18} />}
            </button>

            {/* رجوع 10 ثواني */}
            <button onClick={skipBackward} className="text-white hover:text-red-500 transition p-1">
              <FaBackward size={16} />
            </button>

            {/* تقدم 10 ثواني */}
            <button onClick={skipForward} className="text-white hover:text-red-500 transition p-1">
              <FaForward size={16} />
            </button>

            {/* تكرار */}
            <button onClick={toggleRepeat} className={`transition p-1 ${repeat ? 'text-red-500' : 'text-white hover:text-red-500'}`}>
              <FaRedoAlt size={14} />
            </button>

            {/* خلط */}
            <button onClick={toggleShuffle} className={`transition p-1 ${shuffle ? 'text-red-500' : 'text-white hover:text-red-500'}`}>
              <FaRandom size={14} />
            </button>

            {/* التحكم في الصوت */}
            <div className="flex items-center gap-2 ml-2">
              <button onClick={toggleMute} className="text-white hover:text-red-500 transition p-1">
                {muted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* إعجاب */}
            {onLike && (
              <button onClick={onLike} className="text-white hover:text-red-500 transition p-1">
                {isLiked ? <FaHeart className="text-red-500" size={18} /> : <FaRegHeart size={18} />}
              </button>
            )}

            {/* زر الانتقال بين الكليبات */}
            {onPrev && hasPrev && (
              <button onClick={onPrev} className="text-white hover:text-red-500 transition px-2 py-1 text-sm">
                السابق
              </button>
            )}
            {onNext && hasNext && (
              <button onClick={onNext} className="text-white hover:text-red-500 transition px-2 py-1 text-sm">
                التالي
              </button>
            )}

            {/* سرعة التشغيل */}
            <div className="relative">
              <button onClick={() => setShowSettings(!showSettings)} className="text-white hover:text-red-500 transition p-1">
                <FaCog size={16} />
              </button>
              {showSettings && (
                <div className="absolute bottom-10 right-0 bg-gray-800 rounded-lg shadow-xl py-1 z-30 min-w-[120px]">
                  <div className="px-3 py-2 text-gray-400 text-xs border-b border-gray-700">سرعة التشغيل</div>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`w-full text-right px-3 py-1 text-sm ${playbackRate === rate ? 'text-red-500' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* فتح في نافذة جديدة */}
            <button onClick={openInNewTab} className="text-white hover:text-red-500 transition p-1" title="فتح في علامة تبويب جديدة">
              <FaExternalLinkAlt size={14} />
            </button>

            {/* ملء الشاشة */}
            <button onClick={toggleFullscreen} className="text-white hover:text-red-500 transition p-1">
              {fullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
            </button>
          </div>
        </div>

        {/* معلومات الفيديو */}
        {(title || artist) && (
          <div className="mt-2 text-white text-sm">
            {title && <p className="font-semibold">{title}</p>}
            {artist && <p className="text-gray-400 text-xs">{artist}</p>}
          </div>
        )}
      </div>

      {/* زر التشغيل في المنتصف */}
      {!playing && showControls && !isLoading && !error && !hasStartedPlaying && (
        <button
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-red-600/90 rounded-full flex items-center justify-center hover:bg-red-600 transition hover:scale-110 z-10"
        >
          <FaPlay className="text-white text-2xl ml-1" />
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;