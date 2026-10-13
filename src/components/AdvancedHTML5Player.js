// src/components/AdvancedHTML5Player.js - النسخة الكاملة النهائية
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, 
  FaCompress, FaRedoAlt, FaClosedCaptioning, FaTimes, FaCheck, 
  FaFont, FaSave, FaUndo, FaBookmark, FaChartLine, FaCog, FaFilm,
  FaStepForward, FaStepBackward, FaArrowLeft, FaList, FaEyeSlash, FaEye
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// ========== ثوابت ==========
const API_BASE = 'http://192.168.11.88:5000';
const EPISODE_DRAWER_TIMEOUT = 10000; // 10 ثوانٍ

// ========== دوال مساعدة ==========
const requestFullscreen = (element) => {
  if (!element) return Promise.reject('No element provided');
  if (element.requestFullscreen) return element.requestFullscreen();
  if (element.webkitRequestFullscreen) return element.webkitRequestFullscreen();
  if (element.mozRequestFullScreen) return element.mozRequestFullScreen();
  if (element.msRequestFullscreen) return element.msRequestFullscreen();
  return Promise.reject('Fullscreen API not supported');
};

const showShortcutToast = (message) => {
  const existingToast = document.querySelector('.keyboard-shortcut-toast');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = 'keyboard-shortcut-toast fixed top-24 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-xl z-[200] text-sm animate-fadeInUp border border-purple-500/30';
  toast.innerHTML = `<div class="flex items-center gap-2"><span class="text-purple-400">⌨️</span><span>${message}</span></div>`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('animate-fadeOutDown');
    setTimeout(() => toast.remove(), 300);
  }, 1500);
};

const detectH265Support = () => {
  try {
    const video = document.createElement('video');
    const canPlayHvc1 = video.canPlayType('video/mp4; codecs="hvc1"') !== '';
    const canPlayHev1 = video.canPlayType('video/mp4; codecs="hev1"') !== '';
    return canPlayHvc1 || canPlayHev1;
  } catch {
    return false;
  }
};

// ✅ استخدم API endpoint لجلب الترجمات (يتجاوز CORS تماماً)
const resolveSubtitleUrl = (url) => {
  if (!url) return '';
  
  // استخرج المسار النظيف
  let cleanPath = url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      cleanPath = parsed.pathname;
    } catch (e) {
      cleanPath = url;
    }
  }
  
  // إزالة /data من البداية
  cleanPath = cleanPath.replace(/^\/data\//, '').replace(/^data\//, '').replace(/^\/+/, '');
  
  // ✅ استخدم API endpoint
  return `${API_BASE}/api/subtitle?url=${encodeURIComponent(cleanPath)}`;
};

// ✅ تحويل SRT إلى VTT
const convertSRTToVTT = (srtContent) => {
  let vtt = 'WEBVTT\n\n';
  const converted = srtContent
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  
  const lines = converted.split('\n');
  const output = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^\d+$/.test(line) && i + 1 < lines.length && lines[i + 1].includes('-->')) {
      continue;
    }
    output.push(lines[i]);
  }
  
  vtt += output.join('\n');
  return vtt;
};

// ============================================================
// مكون Thumbnail لكل حلقة
// ============================================================
const EpisodeThumbnail = ({ episode, isCurrent }) => {
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const epNumber = episode.episode_num || '?';
  
  useEffect(() => {
    if (!episode) return;
    
    if (episode.thumbnail) {
      setThumbnail(episode.thumbnail);
      setLoading(false);
      return;
    }
    
    if (episode.poster) {
      setThumbnail(episode.poster);
      setLoading(false);
      return;
    }
    
    const cacheKey = `ep_thumb_${episode.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setThumbnail(cached);
      setLoading(false);
      return;
    }
    
    const videoUrl = episode.video_url || episode.videoUrl;
    if (!videoUrl) {
      setError(true);
      setLoading(false);
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
          const fullUrl = data.thumbnail.startsWith('http') 
            ? data.thumbnail 
            : `${API_BASE}${data.thumbnail}`;
          setThumbnail(fullUrl);
          localStorage.setItem(cacheKey, fullUrl);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    
    return () => { cancelled = true; };
  }, [episode]);
  
  return (
    <div className="flex-shrink-0 w-24 h-14 rounded-md overflow-hidden bg-gray-700 relative">
      {thumbnail && !error ? (
        <img 
          src={thumbnail} 
          alt={`الحلقة ${epNumber}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          {loading ? (
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-gray-500 text-lg">📺</span>
          )}
        </div>
      )}
      
      <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold z-10 ${
        isCurrent ? 'bg-white text-red-600' : 'bg-black/70 text-white'
      }`}>
        {epNumber}
      </div>
      
      {isCurrent && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <FaPlay className="text-red-600 text-[8px] ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// المكون الرئيسي
// ============================================================
const AdvancedHTML5Player = ({ 
  videoUrl, 
  title, 
  subtitles = [],
  audioTracks = [],
  defaultSubtitle = '',
  autoPlay = true,
  poster = '',
  startTime = 0,
  onEnded,
  onError,
  videoId,
  className = "",
  onExitFullscreen,
  onProgress,
  episodes = [],
  currentEpisodeId = null,
  onEpisodeChange = null,
  contentType = 'movie',
  watermark = { text: 'Akil-TV', enabled: true }
}) => {
  
  // ========== REFS ==========
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeout = useRef(null);
  const subtitleTrackRef = useRef(null);
  const lastCueIndexRef = useRef(0);
  const autoplayAttemptRef = useRef(false);
  const h265FixAppliedRef = useRef(false);
  const startTimeAppliedRef = useRef(false);
  const episodeDrawerTimeoutRef = useRef(null);
  
  // ========== STATES ==========
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [repeat, setRepeat] = useState(false);
  const [hasAutoPlayStarted, setHasAutoPlayStarted] = useState(false);
  const [autoplayFailed, setAutoplayFailed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [canPlayH265] = useState(detectH265Support());
  
  const [fillMode, setFillMode] = useState(() => localStorage.getItem('cinewave_fill_mode') || 'contain');
  const [autoFillOnFullscreen, setAutoFillOnFullscreen] = useState(() => localStorage.getItem('cinewave_auto_fill_fullscreen') === 'true');
  
  const [showEpisodesDrawer, setShowEpisodesDrawer] = useState(false);
  
  const [showWatermark, setShowWatermark] = useState(() => {
    const saved = localStorage.getItem('cinewave_show_watermark');
    return saved !== null ? saved === 'true' : true;
  });
  
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [currentSubtitleText, setCurrentSubtitleText] = useState('');
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  const [subtitleLoadError, setSubtitleLoadError] = useState(false);
  
  const [subtitleSettings, setSubtitleSettings] = useState({
    fontSize: 18, fontColor: '#FFFFFF',
    fontFamily: 'Cairo, Tahoma, Arial, sans-serif',
    textShadow: '1px 1px 2px black',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backgroundPadding: '6px 14px', borderRadius: '10px',
    bottomPosition: 80, fontWeight: 'normal', fontStyle: 'normal'
  });
  
  const [tempSubtitleSettings, setTempSubtitleSettings] = useState({ ...subtitleSettings });
  
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [newBookmarkNote, setNewBookmarkNote] = useState('');
  
  const [showStats, setShowStats] = useState(false);
  const [stats] = useState({ views: Math.floor(Math.random() * 10000) + 1000 });

  // ========== فحص الحلقات ==========
  const isSeries = contentType === 'series';
  const hasEpisodes = Array.isArray(episodes) && episodes.length > 0;
  const showEpisodesButton = isSeries && hasEpisodes && typeof onEpisodeChange === 'function';
  
  const sortedEpisodes = useMemo(() => {
    if (!hasEpisodes) return [];
    return [...episodes].sort((a, b) => {
      const seasonA = a.season_num || 1;
      const seasonB = b.season_num || 1;
      if (seasonA !== seasonB) return seasonA - seasonB;
      return (a.episode_num || 0) - (b.episode_num || 0);
    });
  }, [episodes, hasEpisodes]);

  const currentEpisodeIndex = useMemo(() => {
    if (!currentEpisodeId || !sortedEpisodes.length) return -1;
    return sortedEpisodes.findIndex(ep => ep.id === currentEpisodeId);
  }, [currentEpisodeId, sortedEpisodes]);

  const hasNextEpisode = currentEpisodeIndex !== -1 && currentEpisodeIndex < sortedEpisodes.length - 1;
  const hasPrevEpisode = currentEpisodeIndex > 0;

  // ========== الإغلاق التلقائي لقائمة الحلقات ==========
  useEffect(() => {
    if (showEpisodesDrawer) {
      if (episodeDrawerTimeoutRef.current) clearTimeout(episodeDrawerTimeoutRef.current);
      episodeDrawerTimeoutRef.current = setTimeout(() => {
        setShowEpisodesDrawer(false);
        showShortcutToast('⏱️ تم إغلاق قائمة الحلقات تلقائياً');
      }, EPISODE_DRAWER_TIMEOUT);
    } else {
      if (episodeDrawerTimeoutRef.current) {
        clearTimeout(episodeDrawerTimeoutRef.current);
        episodeDrawerTimeoutRef.current = null;
      }
    }
    return () => {
      if (episodeDrawerTimeoutRef.current) clearTimeout(episodeDrawerTimeoutRef.current);
    };
  }, [showEpisodesDrawer]);

  const refreshDrawerTimer = useCallback(() => {
    if (!showEpisodesDrawer) return;
    if (episodeDrawerTimeoutRef.current) clearTimeout(episodeDrawerTimeoutRef.current);
    episodeDrawerTimeoutRef.current = setTimeout(() => {
      setShowEpisodesDrawer(false);
      showShortcutToast('⏱️ تم إغلاق قائمة الحلقات تلقائياً');
    }, EPISODE_DRAWER_TIMEOUT);
  }, [showEpisodesDrawer]);

  // ========== HELPERS ==========
  const formatTime = useCallback((seconds) => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ========== الترجمة ==========
  const updateSubtitleText = useCallback((time) => {
    const cues = subtitleTrackRef.current;
    if (!cues || !selectedSubtitle || cues.length === 0) {
      setCurrentSubtitleText('');
      return;
    }
    
    let i = lastCueIndexRef.current;
    if (i >= cues.length || i < 0 || cues[i].start > time || (i > 0 && cues[i - 1].end > time)) {
      i = 0;
    }
    
    while (i < cues.length && cues[i].end < time) i++;
    lastCueIndexRef.current = i;
    
    if (i < cues.length && time >= cues[i].start && time <= cues[i].end) {
      setCurrentSubtitleText(cues[i].text);
    } else {
      setCurrentSubtitleText('');
    }
  }, [selectedSubtitle]);

  const parseVTTTime = (timeStr) => {
    const parts = timeStr.split(':');
    let hours = 0, minutes = 0, seconds = 0;
    if (parts.length === 3) {
      hours = parseInt(parts[0]) || 0;
      minutes = parseInt(parts[1]) || 0;
      seconds = parseFloat(parts[2].replace(',', '.')) || 0;
    } else if (parts.length === 2) {
      minutes = parseInt(parts[0]) || 0;
      seconds = parseFloat(parts[1].replace(',', '.')) || 0;
    } else {
      seconds = parseFloat(timeStr.replace(',', '.')) || 0;
    }
    return hours * 3600 + minutes * 60 + seconds;
  };

  const parseVTT = (vttContent) => {
    const cues = [];
    const lines = vttContent.split('\n');
    let currentCue = null;
    let isReadingCue = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '' || line.startsWith('WEBVTT') || line.startsWith('NOTE') || line.startsWith('STYLE')) continue;
      
      if (line.includes('-->')) {
        if (currentCue && currentCue.text) cues.push(currentCue);
        const times = line.split('-->');
        if (times.length === 2) {
          currentCue = {
            start: parseVTTTime(times[0].trim()),
            end: parseVTTTime(times[1].trim().split(' ')[0]),
            text: ''
          };
          isReadingCue = true;
        }
      } else if (isReadingCue && currentCue && line) {
        const cleanLine = line.replace(/<[^>]*>/g, '');
        if (cleanLine) {
          currentCue.text += (currentCue.text ? '\n' : '') + cleanLine;
        }
      }
    }
    if (currentCue && currentCue.text) cues.push(currentCue);
    return cues;
  };

  // ✅ تحميل الترجمة عبر API الجديد
  const loadSubtitleTrack = async (subtitle) => {
    if (!subtitle) {
      setCurrentSubtitleText('');
      setSubtitleLoadError(false);
      return;
    }
    
    const rawUrl = resolveSubtitleUrl(subtitle.url);
    
    console.log('📥 [Subtitle] تحميل من:', rawUrl);
    console.log('📥 [Subtitle] التفاصيل:', subtitle);
    
    setSubtitleLoadError(false);
    lastCueIndexRef.current = 0;
    
    try {
      let vttContent = '';
      let fetchSuccess = false;
      
      // ✅ المحاولة 1: fetch
      try {
        const response = await fetch(rawUrl, {
          mode: 'cors',
          headers: { 'Accept': 'text/vtt, text/plain, */*' },
          credentials: 'omit'
        });
        
        console.log('📥 [Subtitle] استجابة fetch:', response.status);
        
        if (response.ok) {
          vttContent = await response.text();
          fetchSuccess = true;
          console.log('📥 [Subtitle] طول المحتوى:', vttContent.length);
        }
      } catch (fetchError) {
        console.warn('⚠️ [Subtitle] fetch فشل:', fetchError.message);
      }
      
      // ✅ المحاولة 2: XMLHttpRequest
      if (!fetchSuccess) {
        console.log('🔄 [Subtitle] محاولة عبر XHR...');
        vttContent = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', rawUrl, true);
          xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
              if (xhr.status === 200 || xhr.status === 0) {
                resolve(xhr.responseText);
              } else {
                reject(new Error(`XHR HTTP ${xhr.status}`));
              }
            }
          };
          xhr.onerror = () => reject(new Error('XHR failed'));
          xhr.send();
        });
      }
      
      if (!vttContent || vttContent.trim().length === 0) {
        throw new Error('ملف الترجمة فارغ');
      }
      
      let processedContent = vttContent;
      if (!vttContent.trim().startsWith('WEBVTT')) {
        console.log('🔄 [Subtitle] تحويل من SRT إلى VTT...');
        processedContent = convertSRTToVTT(vttContent);
      }
      
      const cues = parseVTT(processedContent);
      console.log('📥 [Subtitle] عدد الإطارات:', cues.length);
      
      if (cues.length === 0) {
        throw new Error('لا توجد إطارات صالحة');
      }
      
      subtitleTrackRef.current = cues;
      
      if (videoRef.current) {
        updateSubtitleText(videoRef.current.currentTime);
      }
      
      showShortcutToast(`✅ تم تحميل الترجمة (${cues.length} إطار)`);
      
    } catch (error) {
      console.error('❌ [Subtitle] خطأ:', error);
      console.error('   الرابط:', rawUrl);
      setSubtitleLoadError(true);
      setCurrentSubtitleText('');
      showShortcutToast(`⚠️ تعذر تحميل الترجمة`);
    }
  };

  useEffect(() => {
    if (selectedSubtitle && subtitleTrackRef.current && videoRef.current) {
      const t = videoRef.current.currentTime;
      updateSubtitleText(t);
    }
  }, [selectedSubtitle, updateSubtitleText]);

  // ========== ملء الشاشة ==========
  const toggleFillMode = useCallback(() => {
    setFillMode(prev => {
      const next = prev === 'contain' ? 'cover' : 'contain';
      showShortcutToast(next === 'cover' ? '🔍 تكبير لملء الشاشة' : '📐 الحفاظ على النسبة');
      return next;
    });
  }, []);

  // ========== التشغيل ==========
  const playWithFullscreen = useCallback(async () => {
    const videoElement = videoRef.current;
    const containerElement = containerRef.current;
    if (!videoElement) return;
    
    try {
      await videoElement.play();
      
      if (!h265FixAppliedRef.current && videoElement.readyState >= 2) {
        h265FixAppliedRef.current = true;
        const originalTime = videoElement.currentTime;
        videoElement.currentTime = originalTime + 0.001;
      }
      
      setPlaying(true);
      setHasAutoPlayStarted(true);
      setAutoplayFailed(false);
      setIsLoading(false);
      
      if (containerElement && !document.fullscreenElement) {
        try {
          await requestFullscreen(containerElement);
          setFullscreen(true);
        } catch (e) {
          console.log('تعذر ملء الشاشة:', e.message);
        }
      }
    } catch (error) {
      console.log('فشل التشغيل:', error);
      setAutoplayFailed(true);
      setIsLoading(false);
    }
  }, []);

  // ========== أحداث الفيديو ==========
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setIsLoading(false);
      
      if (startTime > 0 && startTime < dur && !startTimeAppliedRef.current) {
        startTimeAppliedRef.current = true;
        videoRef.current.currentTime = startTime;
        setCurrentTime(startTime);
        showShortcutToast(`⏯️ استئناف من ${formatTime(startTime)}`);
      }
    }
  }, [startTime, formatTime]);
  
  const handleCanPlay = useCallback(() => setIsLoading(false), []);
  const handleWaiting = useCallback(() => setIsLoading(true), []);
  const handlePlaying = useCallback(() => {
    setIsLoading(false);
    setAutoplayFailed(false);
    setPlaying(true);
  }, []);
  
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const t = videoRef.current.currentTime;
      setCurrentTime(t);
      updateSubtitleText(t);
      if (onProgress) onProgress(t, videoRef.current.duration);
    }
  }, [updateSubtitleText, onProgress]);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    
    if (isSeries && sortedEpisodes.length > 0 && onEpisodeChange && hasNextEpisode) {
      const nextEpisode = sortedEpisodes[currentEpisodeIndex + 1];
      const epNumber = nextEpisode.episode_num || (currentEpisodeIndex + 2);
      showShortcutToast(`▶️ الانتقال إلى الحلقة ${epNumber}...`);
      setTimeout(() => onEpisodeChange(nextEpisode), 1500);
      return;
    }
    
    if (isSeries && !hasNextEpisode && sortedEpisodes.length > 0) {
      showShortcutToast('🏁 انتهى المسلسل');
    }
    
    if (repeat && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    } else if (onEnded) {
      onEnded();
    }
  }, [repeat, onEnded, isSeries, sortedEpisodes, currentEpisodeIndex, hasNextEpisode, onEpisodeChange]);
  
  const handleError = useCallback((e) => {
    console.error('❌ Video error:', e);
    setIsLoading(false);
    setAutoplayFailed(true);
    if (onError) onError(e);
  }, [onError]);

  // ========== الخروج من ملء الشاشة ==========
  const handleExitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.webkitFullscreenElement) await document.webkitExitFullscreen();
      else if (document.mozFullScreenElement) await document.mozCancelFullScreen();
      else if (document.msFullscreenElement) await document.msExitFullscreen();
      setFullscreen(false);
      if (onExitFullscreen) onExitFullscreen();
    } catch (error) {
      console.log('خطأ في الخروج من ملء الشاشة:', error);
    }
  }, [onExitFullscreen]);

  // ========== أدوات التحكم ==========
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      playWithFullscreen();
    }
  }, [playing, playWithFullscreen]);
  
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  }, [muted]);
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setMuted(newVolume === 0);
    }
  };
  
  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
      lastCueIndexRef.current = 0;
      updateSubtitleText(seekTime);
    }
  };
  
  const skipForward = () => {
    if (videoRef.current) {
      const newTime = Math.min(currentTime + 10, duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      lastCueIndexRef.current = 0;
      updateSubtitleText(newTime);
    }
  };
  
  const skipBackward = () => {
    if (videoRef.current) {
      const newTime = Math.max(currentTime - 10, 0);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      lastCueIndexRef.current = 0;
      updateSubtitleText(newTime);
    }
  };
  
  const goToPreviousEpisode = useCallback(() => {
    if (!hasPrevEpisode || !onEpisodeChange) return;
    const prevEpisode = sortedEpisodes[currentEpisodeIndex - 1];
    const epNumber = prevEpisode.episode_num || currentEpisodeIndex;
    showShortcutToast(`⏮️ الحلقة السابقة: ${epNumber}`);
    onEpisodeChange(prevEpisode);
  }, [hasPrevEpisode, onEpisodeChange, sortedEpisodes, currentEpisodeIndex]);

  const goToNextEpisode = useCallback(() => {
    if (!hasNextEpisode || !onEpisodeChange) return;
    const nextEpisode = sortedEpisodes[currentEpisodeIndex + 1];
    const epNumber = nextEpisode.episode_num || (currentEpisodeIndex + 2);
    showShortcutToast(`⏭️ الحلقة التالية: ${epNumber}`);
    onEpisodeChange(nextEpisode);
  }, [hasNextEpisode, onEpisodeChange, sortedEpisodes, currentEpisodeIndex]);
  
  const changeSpeed = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
    setShowSpeedMenu(false);
  };
  
  const toggleRepeat = () => {
    if (videoRef.current) {
      videoRef.current.loop = !repeat;
      setRepeat(!repeat);
    }
  };
  
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!fullscreen) {
      requestFullscreen(container).catch(() => {});
      setFullscreen(true);
    } else {
      handleExitFullscreen();
    }
  };
  
  const changeSubtitle = (sub) => {
    if (sub) {
      setSelectedSubtitle(sub.lang);
      loadSubtitleTrack(sub);
    } else {
      setSelectedSubtitle(null);
      setCurrentSubtitleText('');
      setSubtitleLoadError(false);
      subtitleTrackRef.current = null;
    }
    setShowSubtitleMenu(false);
  };
  
  const saveSubtitleSettings = () => {
    setSubtitleSettings(tempSubtitleSettings);
    localStorage.setItem('cinewave_subtitle_settings', JSON.stringify(tempSubtitleSettings));
    setShowSubtitleSettings(false);
    showShortcutToast('✅ تم حفظ إعدادات الترجمة');
  };
  
  const resetSubtitleSettings = () => {
    const defaultSettings = {
      fontSize: 18, fontColor: '#FFFFFF',
      fontFamily: 'Cairo, Tahoma, Arial, sans-serif',
      textShadow: '1px 1px 2px black',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backgroundPadding: '6px 14px', borderRadius: '10px',
      bottomPosition: 80, fontWeight: 'normal', fontStyle: 'normal'
    };
    setTempSubtitleSettings(defaultSettings);
    setSubtitleSettings(defaultSettings);
    localStorage.setItem('cinewave_subtitle_settings', JSON.stringify(defaultSettings));
    setShowSubtitleSettings(false);
    showShortcutToast('🔄 تم إعادة تعيين الإعدادات');
  };
  
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
    showShortcutToast(`📌 تمت إضافة إشارة عند ${formatTime(currentTime)}`);
  };
  
  const deleteBookmark = (id) => {
    const updated = bookmarks.filter(b => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem(`cinewave_bookmarks_${videoId}`, JSON.stringify(updated));
  };
  
  const goToBookmark = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      setShowBookmarks(false);
      lastCueIndexRef.current = 0;
      updateSubtitleText(time);
      showShortcutToast(`⏰ الانتقال إلى ${formatTime(time)}`);
    }
  };
  
  const toggleEpisodesDrawer = useCallback(() => {
    if (!showEpisodesButton) return;
    setShowEpisodesDrawer(prev => !prev);
  }, [showEpisodesButton]);
  
  const handleEpisodeClick = useCallback((episode) => {
    if (!episode || !onEpisodeChange) return;
    if (episode.id === currentEpisodeId) {
      showShortcutToast('⚠️ هذه الحلقة الحالية');
      return;
    }
    onEpisodeChange(episode);
    setShowEpisodesDrawer(false);
    showShortcutToast(`▶️ ${episode.title || `الحلقة ${episode.episode_num}`}`);
  }, [onEpisodeChange, currentEpisodeId]);
  
  const toggleWatermark = useCallback(() => {
    setShowWatermark(prev => {
      const next = !prev;
      localStorage.setItem('cinewave_show_watermark', next.toString());
      showShortcutToast(next ? '👁️ إظهار الشعار' : '🚫 إخفاء الشعار');
      return next;
    });
  }, []);
  
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 2500);
  };
  
  const handleMouseLeave = () => setShowControls(false);

  // ========== اختصارات ==========
  const skipForwardCustom = (seconds) => {
    if (videoRef.current) {
      const newTime = Math.min(currentTime + seconds, duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      lastCueIndexRef.current = 0;
      updateSubtitleText(newTime);
    }
  };
  
  const skipBackwardCustom = (seconds) => {
    if (videoRef.current) {
      const newTime = Math.max(currentTime - seconds, 0);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      lastCueIndexRef.current = 0;
      updateSubtitleText(newTime);
    }
  };

  const handleKeyboardShortcuts = useCallback((e) => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
    
    if (e.key === 'Escape') {
      e.preventDefault();
      if (showEpisodesDrawer) { setShowEpisodesDrawer(false); return; }
      if (fullscreen) handleExitFullscreen();
      setShowSubtitleMenu(false);
      setShowSpeedMenu(false);
      setShowSettingsMenu(false);
      setShowStats(false);
      setShowBookmarks(false);
      setShowSubtitleSettings(false);
      showShortcutToast('❌ إغلاق القوائم');
      if (onExitFullscreen) onExitFullscreen();
      return;
    }
    
    const preventDefaultKeys = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
      'f', 'F', 'm', 'M', 'l', 'L', 'c', 'C', 's', 'S', 'b', 'B', 'r', 'R', 
      'i', 'I', 'k', 'K', 'g', 'G', 'z', 'Z', 'e', 'E', 'w', 'W', 'n', 'N', 'p', 'P'];
    
    if (preventDefaultKeys.includes(e.key) || (e.key >= '1' && e.key <= '9')) {
      e.preventDefault();
    }
    
    if (e.key === ' ' || e.key === 'Space') {
      togglePlay();
      showShortcutToast('⏯️ ' + (playing ? 'إيقاف مؤقت' : 'تشغيل'));
    }
    else if (e.key === 'ArrowRight') {
      if (e.shiftKey) { skipForwardCustom(30); showShortcutToast('⏩ تقدم 30 ثانية'); }
      else { skipForwardCustom(5); showShortcutToast('⏩ تقدم 5 ثواني'); }
    }
    else if (e.key === 'ArrowLeft') {
      if (e.shiftKey) { skipBackwardCustom(30); showShortcutToast('⏪ رجوع 30 ثانية'); }
      else { skipBackwardCustom(5); showShortcutToast('⏪ رجوع 5 ثواني'); }
    }
    else if (e.key === 'ArrowUp') {
      const nv = Math.min(volume + 0.1, 1);
      setVolume(nv);
      if (videoRef.current) {
        videoRef.current.volume = nv;
        if (nv > 0 && muted) { videoRef.current.muted = false; setMuted(false); }
      }
      showShortcutToast(`🔊 الصوت: ${Math.round(nv * 100)}%`);
    }
    else if (e.key === 'ArrowDown') {
      const nv = Math.max(volume - 0.1, 0);
      setVolume(nv);
      if (videoRef.current) {
        videoRef.current.volume = nv;
        if (nv === 0) { videoRef.current.muted = true; setMuted(true); }
      }
      showShortcutToast(`🔉 الصوت: ${Math.round(nv * 100)}%`);
    }
    else if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
      showShortcutToast(fullscreen ? '📱 خروج من ملء الشاشة' : '📺 ملء الشاشة');
    }
    else if (e.key === 'z' || e.key === 'Z') {
      toggleFillMode();
    }
    else if (e.key === 'e' || e.key === 'E') {
      if (showEpisodesButton) {
        toggleEpisodesDrawer();
        showShortcutToast(!showEpisodesDrawer ? '📺 عرض الحلقات' : '📺 إخفاء الحلقات');
      }
    }
    else if (e.key === 'w' || e.key === 'W') {
      if (watermark?.enabled) toggleWatermark();
    }
    else if (e.key === 'm' || e.key === 'M') {
      toggleMute();
      showShortcutToast(muted ? '🔊 إلغاء كتم الصوت' : '🔇 كتم الصوت');
    }
    else if (e.key === 'l' || e.key === 'L') {
      toggleRepeat();
      showShortcutToast(repeat ? '🔄 إيقاف التكرار' : '🔄 تفعيل التكرار');
    }
    else if (e.key === 'g' || e.key === 'G') {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        setCurrentTime(0);
        lastCueIndexRef.current = 0;
        updateSubtitleText(0);
        showShortcutToast('⏪ بداية الفيديو');
      }
    }
    else if (e.key >= '1' && e.key <= '9') {
      const percentage = parseInt(e.key) * 10;
      const jumpTime = (percentage / 100) * duration;
      if (videoRef.current && !isNaN(jumpTime)) {
        videoRef.current.currentTime = jumpTime;
        setCurrentTime(jumpTime);
        lastCueIndexRef.current = 0;
        updateSubtitleText(jumpTime);
        showShortcutToast(`🎯 الانتقال إلى ${percentage}%`);
      }
    }
    else if (e.key === 'c' || e.key === 'C') {
      if (subtitles.length > 0) {
        if (selectedSubtitle) { changeSubtitle(null); showShortcutToast('🔤 إيقاف الترجمة'); }
        else {
          const sub = subtitles.find(s => (s.lang || s.language) === defaultSubtitle) || subtitles[0];
          changeSubtitle({
            lang: sub.lang || sub.language,
            label: sub.label,
            url: sub.url,
            default: sub.default || sub.is_default
          });
          showShortcutToast(`🔤 تشغيل الترجمة (${sub.label})`);
        }
      }
    }
    else if (e.key === 's' || e.key === 'S') {
      if (subtitles.length > 0) {
        setShowSubtitleSettings(true);
        showShortcutToast('⚙️ إعدادات الترجمة');
      }
    }
    else if (e.key === 'b' || e.key === 'B') {
      setShowAddBookmark(true);
      showShortcutToast(`📌 إضافة إشارة عند ${formatTime(currentTime)}`);
    }
    else if (e.key === 'i' || e.key === 'I') {
      setShowStats(!showStats);
      showShortcutToast(showStats ? '📊 إخفاء الإحصائيات' : '📊 عرض الإحصائيات');
    }
    else if (e.key === 'k' || e.key === 'K') {
      setShowBookmarks(!showBookmarks);
      showShortcutToast(showBookmarks ? '🔖 إخفاء الإشارات' : '🔖 عرض الإشارات');
    }
    else if (e.key === 'n' || e.key === 'N') {
      if (hasNextEpisode) goToNextEpisode();
    }
    else if (e.key === 'p' || e.key === 'P') {
      if (hasPrevEpisode) goToPreviousEpisode();
    }
  }, [playing, volume, muted, fullscreen, repeat, selectedSubtitle, currentTime, duration, 
      showStats, showBookmarks, subtitles, defaultSubtitle, togglePlay, toggleMute, 
      toggleFullscreen, toggleRepeat, changeSubtitle, handleExitFullscreen, onExitFullscreen,
      toggleFillMode, showEpisodesDrawer, showEpisodesButton, toggleEpisodesDrawer, 
      isSeries, hasEpisodes, onEpisodeChange, watermark, toggleWatermark, formatTime,
      hasNextEpisode, hasPrevEpisode, goToNextEpisode, goToPreviousEpisode]);

  const keyboardHandlerRef = useRef(handleKeyboardShortcuts);
  useEffect(() => {
    keyboardHandlerRef.current = handleKeyboardShortcuts;
  }, [handleKeyboardShortcuts]);

  useEffect(() => {
    const handler = (e) => keyboardHandlerRef.current(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest('.player-menu') || e.target.closest('.player-menu-btn')) return;
      setShowSpeedMenu(false);
      setShowSubtitleMenu(false);
      setShowSettingsMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const savedSettings = localStorage.getItem('cinewave_subtitle_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSubtitleSettings(parsed);
        setTempSubtitleSettings(parsed);
      } catch (e) {}
    }
    
    const savedSpeed = localStorage.getItem('cinewave_playback_speed');
    if (savedSpeed) setPlaybackSpeed(parseFloat(savedSpeed));
    
    const savedVolume = localStorage.getItem('cinewave_volume');
    if (savedVolume) setVolume(parseFloat(savedVolume));
    
    const savedMuted = localStorage.getItem('cinewave_muted');
    if (savedMuted === 'true') setMuted(true);
    
    if (videoId) {
      const savedBookmarks = localStorage.getItem(`cinewave_bookmarks_${videoId}`);
      if (savedBookmarks) {
        try { setBookmarks(JSON.parse(savedBookmarks)); } catch (e) {}
      }
    }
  }, [videoId]);

  useEffect(() => { localStorage.setItem('cinewave_playback_speed', playbackSpeed.toString()); }, [playbackSpeed]);
  useEffect(() => { localStorage.setItem('cinewave_volume', volume.toString()); localStorage.setItem('cinewave_muted', muted.toString()); }, [volume, muted]);
  useEffect(() => { localStorage.setItem('cinewave_fill_mode', fillMode); }, [fillMode]);
  useEffect(() => { localStorage.setItem('cinewave_auto_fill_fullscreen', autoFillOnFullscreen.toString()); }, [autoFillOnFullscreen]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    h265FixAppliedRef.current = false;
    autoplayAttemptRef.current = false;
    startTimeAppliedRef.current = false;
    setHasAutoPlayStarted(false);
    setPlaying(false);
    setIsLoading(true);
    setCurrentTime(0);
    setDuration(0);
    lastCueIndexRef.current = 0;
    subtitleTrackRef.current = null;
    
    video.load();
    
    if (autoPlay) {
      setTimeout(() => { playWithFullscreen(); }, 300);
    }
  }, [videoUrl, autoPlay, playWithFullscreen]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [handleLoadedMetadata, handleCanPlay, handleWaiting, handlePlaying, handleTimeUpdate, handleEnded, handleError]);

  useEffect(() => {
    if (autoPlay && videoRef.current && !hasAutoPlayStarted && !autoplayAttemptRef.current) {
      autoplayAttemptRef.current = true;
      playWithFullscreen();
    }
  }, [autoPlay, hasAutoPlayStarted, playWithFullscreen]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handler = () => {
      const isFs = !!document.fullscreenElement;
      setFullscreen(isFs);
      if (autoFillOnFullscreen) {
        if (isFs && fillMode === 'contain') setFillMode('cover');
        else if (!isFs && fillMode === 'cover') setFillMode('contain');
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [autoFillOnFullscreen, fillMode]);

  useEffect(() => {
    if (subtitles.length > 0 && !selectedSubtitle) {
      const normalizedSubtitles = subtitles.map(s => ({
        lang: s.lang || s.language,
        label: s.label,
        url: s.url,
        default: s.default || s.is_default
      }));
      
      let subToSelect = defaultSubtitle 
        ? normalizedSubtitles.find(s => s.lang === defaultSubtitle || s.default) 
        : null;
      if (!subToSelect) subToSelect = normalizedSubtitles[0];
      
      if (subToSelect) {
        setSelectedSubtitle(subToSelect.lang);
        loadSubtitleTrack(subToSelect);
      }
    }
  }, [subtitles, defaultSubtitle, selectedSubtitle]);

  // ========== RENDER ==========
  return (
    <div 
      ref={containerRef}
      className="relative bg-black overflow-hidden group w-full rounded-2xl shadow-2xl"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={toggleFullscreen}
    >
      <button
        onClick={handleExitFullscreen}
        className="absolute top-4 left-4 z-30 bg-black/60 backdrop-blur-sm p-2 rounded-full text-white hover:bg-red-600 transition-all duration-200 hover:scale-110 flex items-center gap-2"
        title="العودة (Esc)"
      >
        <FaArrowLeft className="text-lg" />
        <span className="hidden sm:inline text-sm">العودة</span>
      </button>

      <AnimatePresence>
        {watermark?.enabled && showWatermark && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute z-30 pointer-events-none select-none"
            style={{ top: '20px', right: '24px' }}
          >
            <div className="flex items-baseline leading-none" style={{ fontFamily: 'Arial Black, Impact, sans-serif', letterSpacing: '-0.5px' }}>
              <span className="font-black text-lg" style={{ color: '#FFFFFF', textShadow: '2px 2px 4px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,1)' }}>Akil</span>
              <span className="font-black text-lg ml-0.5" style={{ color: '#FF4500', textShadow: '2px 2px 4px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,1)' }}>TV</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!canPlayH265 && videoUrl && (videoUrl.includes('hvc1') || videoUrl.includes('hev1') || videoUrl.includes('h265')) && (
        <div className="absolute top-16 right-3 z-30 bg-yellow-600/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs max-w-[60%]">
          ⚠️ قد لا يعمل هذا الفيديو (H.265) في متصفحك
        </div>
      )}

      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        className={`w-full transition-all duration-300 ${fillMode === 'cover' ? 'object-cover' : 'object-contain'}`}
        style={{ 
          aspectRatio: fullscreen ? 'auto' : '16 / 9',
          height: fullscreen ? '100vh' : 'auto',
          maxHeight: fullscreen ? '100vh' : 'none',
          backgroundColor: '#000'
        }}
        onClick={togglePlay}
        autoPlay={autoPlay}
        playsInline
        preload="auto"
      />
      
      <AnimatePresence>
        {currentSubtitleText && !subtitleLoadError && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute left-0 right-0 text-center pointer-events-none z-10"
            style={{ bottom: `${subtitleSettings.bottomPosition}px` }}
          >
            <div
              className="inline-block max-w-[85%] mx-auto text-center backdrop-blur-sm shadow-lg"
              style={{
                fontSize: `${subtitleSettings.fontSize}px`,
                color: subtitleSettings.fontColor,
                fontFamily: subtitleSettings.fontFamily,
                textShadow: subtitleSettings.textShadow,
                backgroundColor: subtitleSettings.backgroundColor,
                padding: subtitleSettings.backgroundPadding,
                borderRadius: subtitleSettings.borderRadius,
                fontWeight: subtitleSettings.fontWeight,
                fontStyle: subtitleSettings.fontStyle,
                lineHeight: '1.5',
                whiteSpace: 'pre-line',
                wordBreak: 'break-word'
              }}
            >
              {currentSubtitleText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center z-20 backdrop-blur-sm">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FaFilm className="text-red-500 text-2xl animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {autoplayFailed && !playing && !isLoading && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-md">
            <button onClick={playWithFullscreen}
              className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-xl shadow-red-500/30">
              <FaPlay className="text-white text-3xl ml-1" />
            </button>
            <p className="text-gray-300 text-sm mt-4">انقر للتشغيل</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEpisodesDrawer && showEpisodesButton && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 z-40"
              onClick={() => setShowEpisodesDrawer(false)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute top-0 right-0 h-full w-full sm:w-80 bg-gray-900/95 backdrop-blur-md z-50 flex flex-col border-l border-gray-700"
              onMouseEnter={refreshDrawerTimer}
              onMouseMove={refreshDrawerTimer}
              onTouchStart={refreshDrawerTimer}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-red-600/20 to-transparent">
                <div className="flex items-center gap-2">
                  <FaList className="text-red-500" />
                  <h3 className="text-white font-bold">الحلقات</h3>
                  <span className="text-xs bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full">
                    {sortedEpisodes.length}
                  </span>
                </div>
                <button onClick={() => setShowEpisodesDrawer(false)}
                  className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition">
                  <FaTimes size={16} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2" onScroll={refreshDrawerTimer}>
                {sortedEpisodes.map((ep, index) => {
                  const isCurrent = ep.id === currentEpisodeId;
                  const epNumber = ep.episode_num || index + 1;
                  
                  return (
                    <button
                      key={ep.id || index}
                      onClick={() => handleEpisodeClick(ep)}
                      className={`w-full text-right p-2 rounded-lg mb-2 transition-all flex items-center gap-3 group ${
                        isCurrent 
                          ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-500/30' 
                          : 'bg-gray-800/60 hover:bg-gray-700/80'
                      }`}
                    >
                      <EpisodeThumbnail episode={ep} isCurrent={isCurrent} />
                      
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold ${isCurrent ? 'text-white' : 'text-gray-200'}`}>
                          الحلقة {epNumber}
                        </div>
                        {isCurrent && (
                          <div className="text-[10px] text-white/80 mt-0.5 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            قيد التشغيل
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div className="p-3 border-t border-gray-700 text-center">
                <span className="text-[10px] text-gray-500">
                  ⏱️ تُغلق تلقائياً بعد 10 ثوانٍ · اضغط <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">E</kbd> للإغلاق الفوري
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <motion.div 
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-20 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        initial={{ y: -100 }} animate={{ y: showControls ? 0 : -100 }} transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 pl-16 sm:pl-20">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <FaFilm className="text-white text-lg" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-white font-bold text-base sm:text-lg line-clamp-1">{title || 'CineWave Player'}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              <span className="w-1 h-1 bg-gray-500 rounded-full" />
              <span>{playbackSpeed}x</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setShowStats(!showStats)} className="player-menu-btn p-2 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-red-600 transition-all">
              <FaChartLine size={16} />
            </button>
            <button onClick={() => setShowBookmarks(!showBookmarks)} className="player-menu-btn p-2 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-yellow-600 transition-all">
              <FaBookmark size={14} />
            </button>
            <button onClick={() => setShowSettingsMenu(!showSettingsMenu)} className="player-menu-btn p-2 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-purple-600 transition-all">
              <FaCog size={16} />
            </button>
          </div>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {!playing && !isLoading && showControls && !autoplayFailed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            onClick={togglePlay}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-2xl shadow-red-500/40 z-20"
          >
            <FaPlay className="text-white text-3xl ml-1" />
          </motion.button>
        )}
      </AnimatePresence>
      
      <motion.div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 z-20 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        initial={{ y: 100 }} animate={{ y: showControls ? 0 : 100 }} transition={{ duration: 0.3 }}
      >
        <div className="relative mb-3">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-600 rounded-full appearance-none cursor-pointer transition-all hover:h-3"
            style={{ background: `linear-gradient(to right, #e50914 ${progress}%, #4b5563 ${progress}%)` }}
          />
          <div className="flex justify-between text-white/70 text-xs mt-1.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg shadow-red-500/30">
              {playing ? <FaPause className="text-white text-lg" /> : <FaPlay className="text-white text-lg ml-0.5" />}
            </button>
            
            {showEpisodesButton ? (
              <>
                <button 
                  onClick={goToPreviousEpisode} 
                  disabled={!hasPrevEpisode}
                  className={`p-2 rounded-lg transition-all ${
                    !hasPrevEpisode 
                      ? 'text-white/30 cursor-not-allowed' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  title={hasPrevEpisode ? 'الحلقة السابقة (P)' : 'لا توجد حلقة سابقة'}
                >
                  <FaStepBackward size={16} />
                </button>
                <button 
                  onClick={goToNextEpisode} 
                  disabled={!hasNextEpisode}
                  className={`p-2 rounded-lg transition-all ${
                    !hasNextEpisode 
                      ? 'text-white/30 cursor-not-allowed' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  title={hasNextEpisode ? 'الحلقة التالية (N)' : 'لا توجد حلقة تالية'}
                >
                  <FaStepForward size={16} />
                </button>
              </>
            ) : (
              <>
                <button onClick={skipBackward} className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all">
                  <FaStepBackward size={16} />
                </button>
                <button onClick={skipForward} className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all">
                  <FaStepForward size={16} />
                </button>
              </>
            )}
            
            <button onClick={toggleRepeat} className={`p-2 rounded-lg transition-all ${repeat ? 'text-red-500 bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
              <FaRedoAlt size={14} />
            </button>
            <div className="relative" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
              <button onClick={toggleMute} className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all">
                {muted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
              </button>
              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-gray-800 rounded-xl shadow-xl">
                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange}
                      className="w-24 h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, #e50914 ${volume * 100}%, #4b5563 ${volume * 100}%)` }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {isMobile && (
            <div className="text-white/80 text-sm font-mono">{formatTime(currentTime)} / {formatTime(duration)}</div>
          )}
          
          <div className="flex items-center gap-1.5">
            {showEpisodesButton && (
              <button
                onClick={toggleEpisodesDrawer}
                className={`player-menu-btn px-3 py-2 rounded-lg backdrop-blur-sm text-sm font-bold transition-all flex items-center gap-2 border-2 ${
                  showEpisodesDrawer 
                    ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-500/50' 
                    : 'bg-white/15 text-white hover:bg-red-600 border-white/20 hover:border-red-400'
                }`}
                title="قائمة الحلقات (E)"
              >
                <FaList size={16} />
                <span>الحلقات</span>
                <span className="bg-red-500 text-white text-[10px] rounded-full px-2 py-0.5 font-bold min-w-[20px] text-center">
                  {sortedEpisodes.length}
                </span>
              </button>
            )}
            
            <div className="relative">
              <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="player-menu-btn px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/20 transition-all">
                {playbackSpeed}x
              </button>
              <AnimatePresence>
                {showSpeedMenu && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="player-menu absolute bottom-full right-0 mb-2 bg-gray-800 rounded-xl shadow-xl py-1 z-30 min-w-[90px]">
                    {speeds.map(speed => (
                      <button key={speed} onClick={() => changeSpeed(speed)}
                        className={`w-full text-right px-3 py-2 text-sm transition-all ${playbackSpeed === speed ? 'text-red-500 bg-white/5' : 'text-gray-300 hover:bg-white/5'}`}>
                        {speed}x
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {subtitles.length > 0 && (
              <div className="relative">
                <button onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
                  className={`player-menu-btn p-2 rounded-lg transition-all flex items-center gap-1 ${selectedSubtitle ? 'text-red-500 bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
                  <FaClosedCaptioning size={16} />
                </button>
                <AnimatePresence>
                  {showSubtitleMenu && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="player-menu absolute bottom-full right-0 mb-2 bg-gray-800 rounded-xl shadow-xl py-1 z-30 min-w-[180px] max-h-[300px] overflow-y-auto">
                      <button onClick={() => changeSubtitle(null)}
                        className={`w-full text-right px-3 py-2 text-sm transition-all ${!selectedSubtitle ? 'text-red-500 bg-white/5' : 'text-gray-300 hover:bg-white/5'}`}>
                        <span className="flex items-center gap-2">
                          {!selectedSubtitle && <FaCheck className="text-red-500 text-xs" />}
                          إيقاف الترجمة
                        </span>
                      </button>
                      {subtitles.map((sub, idx) => {
                        const subLang = sub.lang || sub.language;
                        const subLabel = sub.label || subLang;
                        const isSelected = selectedSubtitle === subLang;
                        return (
                          <button 
                            key={subLang || idx} 
                            onClick={() => changeSubtitle({
                              lang: subLang,
                              label: subLabel,
                              url: sub.url,
                              default: sub.default || sub.is_default
                            })}
                            className={`w-full text-right px-3 py-2 text-sm transition-all flex justify-between items-center ${isSelected ? 'text-red-500 bg-white/5' : 'text-gray-300 hover:bg-white/5'}`}
                          >
                            <span>{subLabel}</span>
                            {isSelected && <FaCheck className="text-red-500 text-xs" />}
                          </button>
                        );
                      })}
                      <div className="border-t border-gray-700 my-1" />
                      <button onClick={() => { setShowSubtitleMenu(false); setShowSubtitleSettings(true); }}
                        className="w-full text-right px-3 py-2 text-sm text-purple-400 hover:bg-white/5 flex items-center gap-2">
                        <FaFont size={12} /> إعدادات الترجمة
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {watermark?.enabled && (
              <button onClick={toggleWatermark}
                className={`p-2 rounded-lg transition-all ${showWatermark ? 'text-red-500 bg-white/10' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                title={showWatermark ? 'إخفاء الشعار (W)' : 'إظهار الشعار (W)'}>
                {showWatermark ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
              </button>
            )}
            
            <button onClick={toggleFillMode}
              className={`p-2 rounded-lg transition-all ${fillMode === 'cover' ? 'text-red-500 bg-white/10' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              title={fillMode === 'cover' ? 'الحفاظ على النسبة (Z)' : 'تكبير لملء الشاشة (Z)'}>
              {fillMode === 'cover' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 4h6v2H6v4H4V4zm10 0h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zm14 0h2v6h-6v-2h4v-4z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z"/>
                </svg>
              )}
            </button>
            
            <button onClick={toggleFullscreen} className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all">
              {fullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
            </button>
          </div>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {showStats && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="player-menu absolute top-20 right-4 bg-gray-900/95 backdrop-blur-md rounded-xl p-4 z-30 border border-gray-700 shadow-xl min-w-[200px]">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-bold text-sm">📊 الإحصائيات</h3>
              <button onClick={() => setShowStats(false)} className="text-gray-400 hover:text-white"><FaTimes size={12} /></button>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-400"><span>👁️ المشاهدات</span><span className="text-white">{stats.views.toLocaleString()}</span></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showBookmarks && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="player-menu absolute top-20 right-4 bg-gray-900/95 backdrop-blur-md rounded-xl p-4 z-30 border border-gray-700 shadow-xl min-w-[200px] max-h-[300px] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-bold text-sm">📌 الإشارات</h3>
              <button onClick={() => setShowBookmarks(false)} className="text-gray-400 hover:text-white"><FaTimes size={12} /></button>
            </div>
            {bookmarks.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-2">لا توجد إشارات</p>
            ) : (
              bookmarks.map(b => (
                <div key={b.id} className="flex justify-between items-center py-1 border-b border-gray-800 last:border-0">
                  <button onClick={() => goToBookmark(b.time)} className="text-yellow-400 text-xs hover:text-yellow-300">⏰ {b.timeFormatted}</button>
                  <button onClick={() => deleteBookmark(b.id)} className="text-red-400 hover:text-red-300 text-xs"><FaTimes size={10} /></button>
                </div>
              ))
            )}
            <button onClick={() => setShowAddBookmark(true)} className="w-full mt-2 text-purple-400 text-xs hover:text-purple-300 border-t border-gray-800 pt-2">
              ➕ إضافة إشارة
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showSettingsMenu && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="player-menu absolute top-20 right-4 bg-gray-900/95 backdrop-blur-md rounded-xl p-3 z-30 border border-gray-700 shadow-xl min-w-[240px]">
            <h3 className="text-white font-bold text-sm mb-2 px-1">⚙️ الإعدادات</h3>
            <label className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:bg-white/5 cursor-pointer rounded">
              <input type="checkbox" checked={autoFillOnFullscreen} onChange={(e) => setAutoFillOnFullscreen(e.target.checked)} className="accent-red-500" />
              <span>تكبير تلقائي في ملء الشاشة</span>
            </label>
            {watermark?.enabled && (
              <label className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:bg-white/5 cursor-pointer rounded">
                <input type="checkbox" checked={showWatermark} onChange={toggleWatermark} className="accent-red-500" />
                <span>إظهار شعار Akil-TV</span>
              </label>
            )}
            <div className="border-t border-gray-700 my-1" />
            <button onClick={() => { setShowSettingsMenu(false); setShowSubtitleSettings(true); }}
              className="w-full text-right px-2 py-2 text-sm text-gray-300 hover:bg-white/5 rounded flex items-center gap-2">
              <FaFont size={12} /> إعدادات الترجمة
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showAddBookmark && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowAddBookmark(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-white font-bold text-lg mb-2">📌 إضافة إشارة</h3>
              <p className="text-gray-400 text-sm mb-3">الوقت: <span className="text-yellow-400">{formatTime(currentTime)}</span></p>
              <textarea placeholder="ملاحظة (اختياري)" value={newBookmarkNote} onChange={(e) => setNewBookmarkNote(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm resize-none h-20" />
              <div className="flex gap-2 mt-3">
                <button onClick={addBookmark} className="flex-1 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition">حفظ</button>
                <button onClick={() => setShowAddBookmark(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showSubtitleSettings && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowSubtitleSettings(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-white font-bold text-lg mb-3">⚙️ إعدادات الترجمة</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-sm">📏 حجم الخط</label>
                  <input type="range" min="12" max="65" value={tempSubtitleSettings.fontSize}
                    onChange={(e) => setTempSubtitleSettings({...tempSubtitleSettings, fontSize: parseInt(e.target.value)})} className="w-full" />
                  <span className="text-purple-400 text-xs">{tempSubtitleSettings.fontSize}px</span>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">📍 الموضع</label>
                  <input type="range" min="40" max="150" value={tempSubtitleSettings.bottomPosition}
                    onChange={(e) => setTempSubtitleSettings({...tempSubtitleSettings, bottomPosition: parseInt(e.target.value)})} className="w-full" />
                  <span className="text-purple-400 text-xs">{tempSubtitleSettings.bottomPosition}px</span>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">🎨 لون الخط</label>
                  <div className="flex gap-2 mt-1">
                    {['#FFFFFF', '#FFD700', '#00FF00', '#00BFFF', '#FF4444', '#FFA500'].map(color => (
                      <button key={color} onClick={() => setTempSubtitleSettings({...tempSubtitleSettings, fontColor: color})}
                        className={`w-8 h-8 rounded-full border-2 ${tempSubtitleSettings.fontColor === color ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={saveSubtitleSettings} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">
                  <FaSave className="inline mr-1" /> حفظ
                </button>
                <button onClick={resetSubtitleSettings} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition">
                  <FaUndo className="inline mr-1" /> إعادة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedHTML5Player;