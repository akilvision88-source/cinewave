// src/components/AdvancedHTML5Player.js - نسخة مصححة
import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, 
  FaCompress, FaBackward, FaForward, FaRedoAlt,
  FaClosedCaptioning, FaTimes, FaCheck, FaFont, FaSave, FaUndo,
  FaLanguage, FaList, FaRocket, FaEye, FaThumbsUp, FaThumbsDown, 
  FaBookmark, FaRegBookmark, FaChartLine, FaCog, FaFilm,
  FaHeart, FaRegHeart, FaShare, FaDownload, FaStepForward, FaStepBackward
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// ========== UTILITY FUNCTIONS ==========

const convertToRawUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (url.trim() === '') return url;
  
  if (url.includes('github.com') && url.includes('/blob/')) {
    let rawUrl = url
      .replace('github.com', 'raw.githubusercontent.com')
      .replace('/blob/', '/');
    
    if (!rawUrl.startsWith('https')) {
      rawUrl = 'https://' + rawUrl.replace(/^https?:\/\//, '');
    }
    return rawUrl;
  }
  
  if (url.includes('gist.github.com')) {
    let rawUrl = url.replace('gist.github.com', 'gist.githubusercontent.com');
    if (!rawUrl.endsWith('/raw')) rawUrl = rawUrl + '/raw';
    return rawUrl;
  }
  
  return url;
};

const parseVTT = (vttContent) => {
  const cues = [];
  const lines = vttContent.split('\n');
  let currentCue = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === 'WEBVTT') continue;
    if (line === '') continue;
    
    if (line.includes('-->')) {
      const times = line.split('-->');
      const startTime = parseVTTTime(times[0].trim());
      const endTime = parseVTTTime(times[1].trim());
      currentCue = { start: startTime, end: endTime, text: '' };
      cues.push(currentCue);
    } else if (currentCue && line !== '') {
      currentCue.text += (currentCue.text ? '\n' : '') + line;
    }
  }
  return cues;
};

const parseVTTTime = (timeStr) => {
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  } else if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(timeStr);
};

const AdvancedHTML5Player = ({ 
  videoUrl, 
  title, 
  subtitles = [],
  audioTracks = [],
  defaultSubtitle = '',
  defaultAudio = '',
  autoPlay = true,
  poster = '',
  onEnded,
  onError,
  videoId,
  className = ""
}) => {
  
  // ========== REFS ==========
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeout = useRef(null);
  const subtitleTrackRef = useRef(null);
  const currentAudioRef = useRef(null);
  const progressBarRef = useRef(null);
  
  // ========== STATES ==========
  const [playing, setPlaying] = useState(autoPlay);
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
  const autoplayAttemptRef = useRef(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  // الترجمات
  const [selectedSubtitle, setSelectedSubtitle] = useState(defaultSubtitle || null);
  const [currentSubtitleText, setCurrentSubtitleText] = useState('');
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  
  // إعدادات الترجمة
  const [subtitleSettings, setSubtitleSettings] = useState({
    fontSize: 18,
    fontColor: '#FFFFFF',
    fontFamily: 'Cairo, Tahoma, Arial, sans-serif',
    textShadow: '1px 1px 2px black',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backgroundPadding: '6px 14px',
    borderRadius: '10px',
    bottomPosition: 80,
    fontWeight: 'normal',
    fontStyle: 'normal'
  });
  
  const [tempSubtitleSettings, setTempSubtitleSettings] = useState({ ...subtitleSettings });
  
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  
  // الإشارات المرجعية
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [newBookmarkNote, setNewBookmarkNote] = useState('');
  
  // الإحصائيات
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState({
    views: Math.floor(Math.random() * 10000) + 1000,
    likes: Math.floor(Math.random() * 500) + 50,
    dislikes: Math.floor(Math.random() * 50) + 5,
    userLiked: false,
    userDisliked: false,
    watchTime: 0
  });
  
  const [isMarathonMode, setIsMarathonMode] = useState(false);
  const [marathonMessage, setMarathonMessage] = useState('');
  const [showMarathonNotification, setShowMarathonNotification] = useState(false);
  
  // ========== HELPER FUNCTIONS ==========
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const updateSubtitleText = (time) => {
    if (!subtitleTrackRef.current || !selectedSubtitle) {
      setCurrentSubtitleText('');
      return;
    }
    const activeCue = subtitleTrackRef.current.find(
      cue => time >= cue.start && time <= cue.end
    );
    setCurrentSubtitleText(activeCue ? activeCue.text : '');
  };
  
  const loadSubtitleTrack = async (subtitle) => {
    if (!subtitle || !videoRef.current) {
      setCurrentSubtitleText('');
      return;
    }
    
    const rawUrl = convertToRawUrl(subtitle.url);
    
    try {
      const response = await fetch(rawUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const vttContent = await response.text();
      const cues = parseVTT(vttContent);
      subtitleTrackRef.current = cues;
      if (videoRef.current) updateSubtitleText(videoRef.current.currentTime);
    } catch (error) {
      console.error('Error loading subtitle:', error);
      setCurrentSubtitleText('');
    }
  };
  
  // ========== VIDEO EVENTS ==========
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
      console.log('✅ Video loaded, duration:', videoRef.current.duration);
    }
  };
  
  const handleCanPlay = () => {
    console.log('✅ Video can play');
    setIsLoading(false);
  };
  
  const handleWaiting = () => {
    console.log('⏳ Video buffering...');
    setIsLoading(true);
  };
  
  const handlePlaying = () => {
    console.log('▶️ Video playing');
    setIsLoading(false);
    setAutoplayFailed(false);
  };
  
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      updateSubtitleText(videoRef.current.currentTime);
    }
  };
  
  const handleEnded = () => {
    setPlaying(false);
    if (repeat && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    } else if (onEnded) {
      onEnded();
    }
  };
  
  const handleError = (e) => {
    console.error('❌ Video error:', e);
    setIsLoading(false);
    setAutoplayFailed(true);
    if (onError) onError(e);
  };
  
  // ========== AUTO PLAY ==========
  const attemptAutoPlay = async () => {
    if (!videoRef.current || autoplayAttemptRef.current) return;
    autoplayAttemptRef.current = true;
    
    try {
      await videoRef.current.play();
      setPlaying(true);
      setHasAutoPlayStarted(true);
      setAutoplayFailed(false);
      setIsLoading(false);
    } catch (error) {
      console.log('Auto-play failed:', error);
      setAutoplayFailed(true);
      setIsLoading(false);
    }
  };
  
  // ========== CONTROLS ==========
  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) videoRef.current.pause();
      else videoRef.current.play();
      setPlaying(!playing);
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };
  
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
    }
  };
  
  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(currentTime + 10, duration);
    }
  };
  
  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(currentTime - 10, 0);
    }
  };
  
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
      container.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };
  
  const changeSubtitle = (sub) => {
    if (sub) {
      setSelectedSubtitle(sub.lang);
      loadSubtitleTrack(sub);
    } else {
      setSelectedSubtitle(null);
      setCurrentSubtitleText('');
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
      fontSize: 18,
      fontColor: '#FFFFFF',
      fontFamily: 'Cairo, Tahoma, Arial, sans-serif',
      textShadow: '1px 1px 2px black',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backgroundPadding: '6px 14px',
      borderRadius: '10px',
      bottomPosition: 80,
      fontWeight: 'normal',
      fontStyle: 'normal'
    };
    setTempSubtitleSettings(defaultSettings);
    setSubtitleSettings(defaultSettings);
    localStorage.setItem('cinewave_subtitle_settings', JSON.stringify(defaultSettings));
    setShowSubtitleSettings(false);
    showShortcutToast('🔄 تم إعادة تعيين إعدادات الترجمة');
  };
  
  const handleLike = () => {
    setStats(prev => ({
      ...prev,
      likes: prev.userLiked ? prev.likes - 1 : prev.likes + 1,
      userLiked: !prev.userLiked,
      userDisliked: false
    }));
  };
  
  const handleDislike = () => {
    setStats(prev => ({
      ...prev,
      dislikes: prev.userDisliked ? prev.dislikes - 1 : prev.dislikes + 1,
      userDisliked: !prev.userDisliked,
      userLiked: false
    }));
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
      showShortcutToast(`⏰ الانتقال إلى ${formatTime(time)}`);
    }
  };
  
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 2500);
  };
  
  const handleMouseLeave = () => {
    setShowControls(false);
  };
  
  // ========== KEYBOARD SHORTCUTS ==========
  const skipForwardCustom = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(currentTime + seconds, duration);
    }
  };
  
  const skipBackwardCustom = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(currentTime - seconds, 0);
    }
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
  
  const handleKeyboardShortcuts = (e) => {
    const preventDefaultKeys = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'f', 'F', 'm', 'M', 'l', 'L', 'c', 'C', 's', 'S', 'b', 'B', 'r', 'R', 'i', 'I', 'k', 'K', 'g', 'G', 'Escape'];
    
    if (preventDefaultKeys.includes(e.key) || e.key === ' ' || (e.key >= '1' && e.key <= '9')) {
      e.preventDefault();
    }
    
    if (e.key === ' ' || e.key === 'Space') {
      togglePlay();
      showShortcutToast('⏯️ ' + (playing ? 'إيقاف مؤقت' : 'تشغيل'));
    }
    else if (e.key === 'ArrowRight') {
      if (e.shiftKey) {
        skipForwardCustom(30);
        showShortcutToast('⏩ تقدم 30 ثانية');
      } else if (e.ctrlKey) {
        const skipAmount = duration * 0.1;
        skipForwardCustom(skipAmount);
        showShortcutToast(`⏩ تقدم ${Math.round(skipAmount)} ثانية (10%)`);
      } else {
        skipForwardCustom(5);
        showShortcutToast('⏩ تقدم 5 ثواني');
      }
    }
    else if (e.key === 'ArrowLeft') {
      if (e.shiftKey) {
        skipBackwardCustom(30);
        showShortcutToast('⏪ رجوع 30 ثانية');
      } else if (e.ctrlKey) {
        const skipAmount = duration * 0.1;
        skipBackwardCustom(skipAmount);
        showShortcutToast(`⏪ رجوع ${Math.round(skipAmount)} ثانية (10%)`);
      } else {
        skipBackwardCustom(5);
        showShortcutToast('⏪ رجوع 5 ثواني');
      }
    }
    else if (e.key === 'ArrowUp') {
      const newVolume = Math.min(volume + 0.1, 1);
      setVolume(newVolume);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
        if (newVolume > 0 && muted) {
          videoRef.current.muted = false;
          setMuted(false);
        }
      }
      showShortcutToast(`🔊 رفع الصوت: ${Math.round(newVolume * 100)}%`);
    }
    else if (e.key === 'ArrowDown') {
      const newVolume = Math.max(volume - 0.1, 0);
      setVolume(newVolume);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
        if (newVolume === 0) {
          videoRef.current.muted = true;
          setMuted(true);
        }
      }
      showShortcutToast(`🔉 خفض الصوت: ${Math.round(newVolume * 100)}%`);
    }
    else if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
      showShortcutToast(fullscreen ? '📱 خروج من ملء الشاشة' : '📺 ملء الشاشة');
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
        showShortcutToast('⏪ بداية الفيديو');
      }
    }
    else if (e.key === 'End') {
      if (videoRef.current) {
        videoRef.current.currentTime = duration;
        setCurrentTime(duration);
        showShortcutToast('⏩ نهاية الفيديو');
      }
    }
    else if (e.key >= '1' && e.key <= '9') {
      const percentage = parseInt(e.key) * 10;
      const jumpTime = (percentage / 100) * duration;
      if (videoRef.current && !isNaN(jumpTime)) {
        videoRef.current.currentTime = jumpTime;
        setCurrentTime(jumpTime);
        showShortcutToast(`🎯 الانتقال إلى ${percentage}%`);
      }
    }
    else if (e.key === 'c' || e.key === 'C') {
      if (subtitles.length > 0) {
        if (selectedSubtitle) {
          changeSubtitle(null);
          showShortcutToast('🔤 إيقاف الترجمة');
        } else {
          const defaultSub = subtitles.find(s => s.lang === defaultSubtitle) || subtitles[0];
          changeSubtitle(defaultSub);
          showShortcutToast(`🔤 تشغيل الترجمة (${defaultSub.label})`);
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
      showShortcutToast(`📌 إضافة إشارة مرجعية عند ${formatTime(currentTime)}`);
    }
    else if (e.key === 'r' || e.key === 'R') {
      setIsMarathonMode(!isMarathonMode);
      showShortcutToast(isMarathonMode ? '🏃 إيقاف وضع الماراثون' : '🏃 تفعيل وضع الماراثون');
    }
    else if (e.key === 'i' || e.key === 'I') {
      setShowStats(!showStats);
      showShortcutToast(showStats ? '📊 إخفاء الإحصائيات' : '📊 عرض الإحصائيات');
    }
    else if (e.key === 'k' || e.key === 'K') {
      setShowBookmarks(!showBookmarks);
      showShortcutToast(showBookmarks ? '🔖 إخفاء الإشارات' : '🔖 عرض الإشارات');
    }
    else if (e.key === 'Escape') {
      setShowSubtitleMenu(false);
      setShowSpeedMenu(false);
      setShowAudioMenu(false);
      setShowSettingsMenu(false);
      setShowStats(false);
      setShowBookmarks(false);
      setShowSubtitleSettings(false);
      showShortcutToast('❌ إغلاق القوائم');
    }
  };
  
  // ========== LOAD SAVED SETTINGS FROM LOCALSTORAGE ==========
  useEffect(() => {
    // تحميل إعدادات الترجمة المحفوظة
    const savedSettings = localStorage.getItem('cinewave_subtitle_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSubtitleSettings(parsed);
        setTempSubtitleSettings(parsed);
        console.log('✅ تم تحميل إعدادات الترجمة:', parsed);
      } catch (e) {
        console.error('خطأ في تحميل إعدادات الترجمة:', e);
      }
    }
    
    // تحميل اللغة المفضلة للترجمة
    const savedSubtitleLang = localStorage.getItem('cinewave_selected_subtitle_lang');
    if (savedSubtitleLang && subtitles.length > 0) {
      const savedSub = subtitles.find(s => s.lang === savedSubtitleLang);
      if (savedSub) {
        setSelectedSubtitle(savedSubtitleLang);
        loadSubtitleTrack(savedSub);
        console.log('✅ تم تحميل الترجمة المحفوظة:', savedSubtitleLang);
      }
    }
    
    // تحميل سرعة التشغيل المحفوظة
    const savedSpeed = localStorage.getItem('cinewave_playback_speed');
    if (savedSpeed) {
      const speed = parseFloat(savedSpeed);
      setPlaybackSpeed(speed);
      if (videoRef.current) {
        videoRef.current.playbackRate = speed;
      }
    }
    
    // تحميل مستوى الصوت المحفوظ
    const savedVolume = localStorage.getItem('cinewave_volume');
    const savedMuted = localStorage.getItem('cinewave_muted');
    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      setVolume(vol);
      if (videoRef.current) {
        videoRef.current.volume = vol;
      }
    }
    if (savedMuted === 'true') {
      setMuted(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  }, []);
  
  // ========== SAVE SETTINGS TO LOCALSTORAGE ==========
  useEffect(() => {
    if (subtitleSettings) {
      localStorage.setItem('cinewave_subtitle_settings', JSON.stringify(subtitleSettings));
    }
  }, [subtitleSettings]);
  
  useEffect(() => {
    if (selectedSubtitle) {
      localStorage.setItem('cinewave_selected_subtitle_lang', selectedSubtitle);
    } else {
      localStorage.removeItem('cinewave_selected_subtitle_lang');
    }
  }, [selectedSubtitle]);
  
  useEffect(() => {
    localStorage.setItem('cinewave_playback_speed', playbackSpeed.toString());
  }, [playbackSpeed]);
  
  useEffect(() => {
    localStorage.setItem('cinewave_volume', volume.toString());
    localStorage.setItem('cinewave_muted', muted.toString());
  }, [volume, muted]);
  
  // ========== محاولة التشغيل التلقائي ==========
  useEffect(() => {
    if (autoPlay && videoRef.current && !hasAutoPlayStarted) {
      attemptAutoPlay();
    }
  }, [autoPlay]);
  
  // ========== EFFECTS ==========
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    const handleFullscreenChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  useEffect(() => {
    if (defaultSubtitle && subtitles.length > 0 && !selectedSubtitle) {
      const defaultSub = subtitles.find(s => s.lang === defaultSubtitle);
      if (defaultSub) changeSubtitle(defaultSub);
    }
  }, [defaultSubtitle, subtitles]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [playing, volume, muted, fullscreen, repeat, selectedSubtitle, currentTime, duration, showStats, showBookmarks, isMarathonMode]);
  
  // إضافة مستمعي الأحداث للفيديو
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
  }, [videoUrl]);
  
  // ========== RENDER ==========
  return (
    <div 
      ref={containerRef}
      className="relative bg-black overflow-hidden group w-full rounded-2xl shadow-2xl"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={toggleFullscreen}
    >
      {/* VIDEO ELEMENT */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        className="w-full aspect-video"
        onClick={togglePlay}
        autoPlay={autoPlay}
        playsInline
        preload="auto"
      />
      
      {/* SUBTITLE DISPLAY */}
      <AnimatePresence>
        {currentSubtitleText && (
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
      
      {/* LOADING SPINNER */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center z-20 backdrop-blur-sm"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FaFilm className="text-red-500 text-2xl animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* AUTO-PLAY FAILED BUTTON */}
      <AnimatePresence>
        {autoplayFailed && !playing && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-md"
          >
            <button
              onClick={attemptAutoPlay}
              className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-xl shadow-red-500/30"
            >
              <FaPlay className="text-white text-3xl ml-1" />
            </button>
            <p className="text-gray-300 text-sm mt-4">انقر للتشغيل</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* TOP BAR */}
      <motion.div 
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-20 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        initial={{ y: -100 }}
        animate={{ y: showControls ? 0 : -100 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaFilm className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg line-clamp-1">{title || 'CineWave Player'}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                <span className="w-1 h-1 bg-gray-500 rounded-full" />
                <span>{playbackSpeed}x</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setShowStats(!showStats)} className="p-2 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-red-600 transition-all">
              <FaChartLine size={16} />
            </button>
            <button onClick={() => setShowBookmarks(!showBookmarks)} className="p-2 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-yellow-600 transition-all">
              <FaBookmark size={14} />
            </button>
            <button onClick={() => setShowSettingsMenu(!showSettingsMenu)} className="p-2 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-purple-600 transition-all">
              <FaCog size={16} />
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* CENTER PLAY BUTTON */}
      <AnimatePresence>
        {!playing && !isLoading && showControls && !autoplayFailed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={togglePlay}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-2xl shadow-red-500/40 z-20"
          >
            <FaPlay className="text-white text-3xl ml-1" />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* BOTTOM CONTROLS BAR */}
      <motion.div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 z-20 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        initial={{ y: 100 }}
        animate={{ y: showControls ? 0 : 100 }}
        transition={{ duration: 0.3 }}
      >
        {/* PROGRESS BAR */}
        <div className="relative mb-3 group/progress">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-600 rounded-full appearance-none cursor-pointer transition-all hover:h-3"
            style={{
              background: `linear-gradient(to right, #e50914 ${progress}%, #4b5563 ${progress}%)`
            }}
          />
          <div className="flex justify-between text-white/70 text-xs mt-1.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* MAIN CONTROLS ROW - باقي الكود كما هو */}
        <div className="flex items-center justify-between">
          {/* LEFT GROUP */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={togglePlay} 
              className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg shadow-red-500/30"
            >
              {playing ? <FaPause className="text-white text-lg" /> : <FaPlay className="text-white text-lg ml-0.5" />}
            </button>
            
            <button onClick={skipBackward} className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all">
              <FaStepBackward size={16} />
              <span className="text-[10px] ml-0.5">10</span>
            </button>
            
            <button onClick={skipForward} className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all">
              <span className="text-[10px] mr-0.5">10</span>
              <FaStepForward size={16} />
            </button>
            
            <button 
              onClick={toggleRepeat} 
              className={`p-2 rounded-lg transition-all ${repeat ? 'text-red-500 bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
            >
              <FaRedoAlt size={14} />
            </button>
            
            {/* VOLUME CONTROL */}
            <div 
              className="relative"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button onClick={toggleMute} className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all">
                {muted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
              </button>
              
              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-gray-800 rounded-xl shadow-xl"
                  >
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #e50914 ${volume * 100}%, #4b5563 ${volume * 100}%)`
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* CENTER GROUP - Time Display (Mobile) */}
          {isMobile && (
            <div className="text-white/80 text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          )}
          
          {/* RIGHT GROUP */}
          <div className="flex items-center gap-1.5">
            {/* Speed Button */}
            <div className="relative">
              <button 
                onClick={() => setShowSpeedMenu(!showSpeedMenu)} 
                className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/20 transition-all"
              >
                {playbackSpeed}x
              </button>
              <AnimatePresence>
                {showSpeedMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-xl shadow-xl py-1 z-30 min-w-[90px]"
                  >
                    {speeds.map(speed => (
                      <button 
                        key={speed} 
                        onClick={() => changeSpeed(speed)} 
                        className={`w-full text-right px-3 py-2 text-sm transition-all ${playbackSpeed === speed ? 'text-red-500 bg-white/5' : 'text-gray-300 hover:bg-white/5'}`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Subtitles Button */}
            {subtitles.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setShowSubtitleMenu(!showSubtitleMenu)} 
                  className={`p-2 rounded-lg transition-all ${selectedSubtitle ? 'text-red-500 bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                  <FaClosedCaptioning size={16} />
                </button>
                <AnimatePresence>
                  {showSubtitleMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-xl shadow-xl py-1 z-30 min-w-[160px]"
                    >
                      <button onClick={() => changeSubtitle(null)} className="w-full text-right px-3 py-2 text-sm text-gray-300 hover:bg-white/5">
                        إيقاف الترجمة
                      </button>
                      {subtitles.map(sub => (
                        <button key={sub.lang} onClick={() => changeSubtitle(sub)} className="w-full text-right px-3 py-2 text-sm text-gray-300 hover:bg-white/5 flex justify-between items-center">
                          <span>{sub.label}</span>
                          {selectedSubtitle === sub.lang && <FaCheck className="text-red-500 text-xs" />}
                        </button>
                      ))}
                      <div className="border-t border-gray-700 my-1" />
                      <button onClick={() => { setShowSubtitleMenu(false); setShowSubtitleSettings(true); }} className="w-full text-right px-3 py-2 text-sm text-purple-400 hover:bg-white/5">
                        ⚙️ إعدادات الترجمة
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {/* Like/Dislike Buttons */}
            <button onClick={handleLike} className={`p-2 rounded-lg transition-all ${stats.userLiked ? 'text-green-500 bg-white/10' : 'text-white/60 hover:text-green-500 hover:bg-white/10'}`}>
              <FaThumbsUp size={14} />
            </button>
            <button onClick={handleDislike} className={`p-2 rounded-lg transition-all ${stats.userDisliked ? 'text-red-500 bg-white/10' : 'text-white/60 hover:text-red-500 hover:bg-white/10'}`}>
              <FaThumbsDown size={14} />
            </button>
            
            {/* Fullscreen Button */}
            <button 
              onClick={toggleFullscreen} 
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
            >
              {fullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* باقي المودالات (STATS PANEL, BOOKMARKS PANEL, ADD BOOKMARK MODAL, SUBTITLE SETTINGS MODAL) - تبقى كما هي دون تغيير */}
    </div>
  );
};

export default AdvancedHTML5Player;