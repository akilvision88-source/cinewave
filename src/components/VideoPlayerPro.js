import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { 
  FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, 
  FaCompress, FaBackward, FaForward, FaRedoAlt,
  FaClosedCaptioning, FaTimes, FaCheck, FaFont, FaSave, FaUndo,
  FaLanguage, FaList, FaExternalLinkAlt, FaRocket,
  FaEye, FaThumbsUp, FaThumbsDown, FaBookmark, FaRegBookmark, FaClock, FaChartLine
} from 'react-icons/fa';

const VideoPlayerPro = ({ 
  videoUrl, 
  title, 
  subtitles = [],
  audioTracks = [],
  defaultSubtitle = '',
  defaultAudio = '',
  autoPlay = true,
  playlist = [],
  onPlaylistItemClick,
  videoId,
  onComplete,
  introVideoUrl = '/intro.mp4',
  marathonMode = false,
  onMarathonComplete
}) => {
  // حالات التشغيل الأساسية
  const [playing, setPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [repeat, setRepeat] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  
  // وضع الماراثون
  const [isMarathonMode, setIsMarathonMode] = useState(marathonMode);
  const [marathonCountdown, setMarathonCountdown] = useState(0);
  const [marathonMessage, setMarathonMessage] = useState('');
  const [showMarathonNotification, setShowMarathonNotification] = useState(false);
  
  // إحصائيات المشاهدة
  const [stats, setStats] = useState({
    views: 0,
    likes: 0,
    dislikes: 0,
    userLiked: false,
    userDisliked: false,
    watchTime: 0,
    completionRate: 0,
    lastWatched: null
  });
  const [showStats, setShowStats] = useState(false);
  
  // الإشارات المرجعية (Bookmarks)
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [newBookmarkNote, setNewBookmarkNote] = useState('');
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  
  // فيديو المقدمة (Intro)
  const [showIntro, setShowIntro] = useState(true);
  const [introPlaying, setIntroPlaying] = useState(true);
  const [introDuration, setIntroDuration] = useState(0);
  
  // معاينة شريط التقدم
  const [showPreview, setShowPreview] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewPosition, setPreviewPosition] = useState(0);
  
  // قائمة التشغيل
  const [showPlaylist, setShowPlaylist] = useState(false);
  
  // إعدادات الترجمة
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [currentSubtitleText, setCurrentSubtitleText] = useState('');
  
  // حالات الصوت
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState(null);
  const [currentAudioElement, setCurrentAudioElement] = useState(null);
  
  // Refs
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeout = useRef(null);
  const subtitleTrackRef = useRef(null);
  const styleRef = useRef(null);
  const progressBarRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const watchTimeIntervalRef = useRef(null);
  
  // إعدادات الترجمة
  const [subtitleSettings, setSubtitleSettings] = useState({
    fontSize: 18,
    fontColor: '#FFFFFF',
    fontFamily: 'Cairo, Tahoma, Arial, sans-serif',
    textShadow: '1px 1px 2px black',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backgroundPadding: '4px 8px',
    borderRadius: '4px',
    bottomPosition: 75
  });

  const [tempSubtitleSettings, setTempSubtitleSettings] = useState({ ...subtitleSettings });
  const [previewText, setPreviewText] = useState('هذا نص تجريبي لعرض شكل الترجمة');

  // دالة لتشفير رابط الفيديو بشكل صحيح
  const encodeVideoUrl = (url) => {
    if (!url) return url;
    
    try {
      // إذا كان الرابط لا يحتوي على بروتوكول، أضف http://
      if (!url.startsWith('http') && !url.startsWith('ftp') && !url.startsWith('https')) {
        url = 'http://' + url;
      }
      
      // فصل البروتوكول عن باقي الرابط
      const [protocol, ...rest] = url.split('://');
      if (!rest.length) return url;
      
      let path = rest.join('://');
      
      // تقسيم المسار إلى أجزاء
      const parts = path.split('/');
      
      // تشفير كل جزء مع الحفاظ على النقاط
      const encodedParts = parts.map(part => {
        // لا تقم بتشفير إذا كان الجزء يحتوي على % (already encoded)
        if (part.includes('%')) return part;
        // تشفير الجزء
        let encoded = encodeURIComponent(decodeURIComponent(part));
        // إعادة النقاط كما هي
        encoded = encoded.replace(/%2E/g, '.');
        return encoded;
      });
      
      const encodedPath = encodedParts.join('/');
      const encodedUrl = `${protocol}://${encodedPath}`;
      
      console.log('🎬 Original URL:', url);
      console.log('🎬 Encoded URL:', encodedUrl);
      
      return encodedUrl;
    } catch (error) {
      console.error('Error encoding URL:', error);
      return url;
    }
  };

  const cleanVideoUrl = encodeVideoUrl(videoUrl);

  // التحقق من حجم الشاشة ووضعها
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // إعدادات الخطوط والألوان
  const arabicFonts = [
    { name: 'Cairo', value: 'Cairo, Tahoma, Arial, sans-serif' },
    { name: 'Tajawal', value: 'Tajawal, Tahoma, Arial, sans-serif' },
    { name: 'Changa', value: 'Changa, Tahoma, Arial, sans-serif' },
    { name: 'Almarai', value: 'Almarai, Tahoma, Arial, sans-serif' },
    { name: 'Tahoma', value: 'Tahoma, Arial, sans-serif' },
    { name: 'Arial', value: 'Arial, Tahoma, sans-serif' }
  ];

  const fontColors = [
    { name: 'أبيض', value: '#FFFFFF' },
    { name: 'أصفر', value: '#FFD700' },
    { name: 'أخضر', value: '#00FF00' },
    { name: 'أزرق', value: '#00BFFF' },
    { name: 'أحمر', value: '#FF4444' },
    { name: 'برتقالي', value: '#FFA500' },
    { name: 'وردي', value: '#FF69B4' },
    { name: 'رمادي', value: '#CCCCCC' }
  ];

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // تحميل الإحصائيات
  useEffect(() => {
    if (videoId) {
      const savedStats = localStorage.getItem(`cinewave_stats_${videoId}`);
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      } else {
        const defaultStats = {
          views: Math.floor(Math.random() * 10000) + 1000,
          likes: Math.floor(Math.random() * 500) + 50,
          dislikes: Math.floor(Math.random() * 50) + 5,
          userLiked: false,
          userDisliked: false,
          watchTime: 0,
          completionRate: 0,
          lastWatched: new Date().toISOString()
        };
        setStats(defaultStats);
        localStorage.setItem(`cinewave_stats_${videoId}`, JSON.stringify(defaultStats));
      }
    }
  }, [videoId]);

  // تحديث وقت المشاهدة
  useEffect(() => {
    if (showIntro || !playing) return;
    
    watchTimeIntervalRef.current = setInterval(() => {
      setStats(prev => {
        const newWatchTime = prev.watchTime + 1;
        const newCompletionRate = (newWatchTime / duration) * 100;
        const updated = {
          ...prev,
          watchTime: newWatchTime,
          completionRate: Math.min(newCompletionRate, 100)
        };
        localStorage.setItem(`cinewave_stats_${videoId}`, JSON.stringify(updated));
        return updated;
      });
    }, 1000);
    
    return () => {
      if (watchTimeIntervalRef.current) clearInterval(watchTimeIntervalRef.current);
    };
  }, [playing, showIntro, duration, videoId]);

  // تحديث عدد المشاهدات عند بدء التشغيل
  const updateViews = () => {
    if (!videoId || !sessionStorage.getItem(`viewed_${videoId}`)) {
      setStats(prev => {
        const updated = { ...prev, views: prev.views + 1 };
        localStorage.setItem(`cinewave_stats_${videoId}`, JSON.stringify(updated));
        sessionStorage.setItem(`viewed_${videoId}`, 'true');
        return updated;
      });
    }
  };

  // معالجة الإعجاب/عدم الإعجاب
  const handleLike = () => {
    setStats(prev => {
      let newLikes = prev.likes;
      let newDislikes = prev.dislikes;
      
      if (prev.userLiked) {
        newLikes--;
        prev.userLiked = false;
      } else {
        newLikes++;
        if (prev.userDisliked) {
          newDislikes--;
          prev.userDisliked = false;
        }
        prev.userLiked = true;
      }
      
      const updated = { ...prev, likes: newLikes, dislikes: newDislikes };
      localStorage.setItem(`cinewave_stats_${videoId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleDislike = () => {
    setStats(prev => {
      let newLikes = prev.likes;
      let newDislikes = prev.dislikes;
      
      if (prev.userDisliked) {
        newDislikes--;
        prev.userDisliked = false;
      } else {
        newDislikes++;
        if (prev.userLiked) {
          newLikes--;
          prev.userLiked = false;
        }
        prev.userDisliked = true;
      }
      
      const updated = { ...prev, likes: newLikes, dislikes: newDislikes };
      localStorage.setItem(`cinewave_stats_${videoId}`, JSON.stringify(updated));
      return updated;
    });
  };

  // الإشارات المرجعية (Bookmarks)
  useEffect(() => {
    if (videoId) {
      const savedBookmarks = localStorage.getItem(`cinewave_bookmarks_${videoId}`);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    }
  }, [videoId]);

  const addBookmark = () => {
    const newBookmark = {
      id: Date.now(),
      time: currentTime,
      timeFormatted: formatTime(currentTime),
      note: newBookmarkNote || `علامة عند ${formatTime(currentTime)}`,
      createdAt: new Date().toISOString()
    };
    
    const updatedBookmarks = [...bookmarks, newBookmark].sort((a, b) => a.time - b.time);
    setBookmarks(updatedBookmarks);
    localStorage.setItem(`cinewave_bookmarks_${videoId}`, JSON.stringify(updatedBookmarks));
    setNewBookmarkNote('');
    setShowAddBookmark(false);
    
    setMarathonMessage(`📌 تم إضافة إشارة مرجعية عند ${formatTime(currentTime)}`);
    setShowMarathonNotification(true);
    setTimeout(() => setShowMarathonNotification(false), 2000);
  };

  const deleteBookmark = (bookmarkId) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    setBookmarks(updatedBookmarks);
    localStorage.setItem(`cinewave_bookmarks_${videoId}`, JSON.stringify(updatedBookmarks));
  };

  const goToBookmark = (time) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time);
      setCurrentTime(time);
      syncAudioTime(time);
      setShowBookmarks(false);
    }
  };

  // وضع الماراثون
  const toggleMarathonMode = () => {
    setIsMarathonMode(!isMarathonMode);
    setMarathonMessage(!isMarathonMode ? '🎉 وضع الماراثون مفعل! سيتم تشغيل الحلقات تلقائياً' : 'وضع الماراثون غير مفعل');
    setShowMarathonNotification(true);
    setTimeout(() => setShowMarathonNotification(false), 3000);
  };

  const showCountdown = (seconds, nextEpisodeTitle) => {
    setMarathonCountdown(seconds);
    setMarathonMessage(`⏰ الحلقة التالية: ${nextEpisodeTitle} تبدأ بعد ${seconds} ثانية...`);
    setShowMarathonNotification(true);
    
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    countdownIntervalRef.current = setInterval(() => {
      setMarathonCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          setShowMarathonNotification(false);
          return 0;
        }
        setMarathonMessage(`⏰ الحلقة التالية: ${nextEpisodeTitle} تبدأ بعد ${prev - 1} ثانية...`);
        return prev - 1;
      });
    }, 1000);
  };

  // إدارة فيديو المقدمة
  useEffect(() => {
    const introShown = sessionStorage.getItem('intro_shown');
    if (introShown) {
      setShowIntro(false);
      setTimeout(() => {
        setPlaying(true);
        updateViews();
      }, 100);
    }
  }, []);

  const handleIntroLoadedMetadata = () => {
    setIntroDuration(introVideoRef.current?.duration || 0);
  };

  const handleIntroEnded = () => {
    setShowIntro(false);
    setIntroPlaying(false);
    sessionStorage.setItem('intro_shown', 'true');
    setPlaying(true);
    updateViews();
  };

  const skipIntro = () => {
    if (showIntro && introVideoRef.current) {
      introVideoRef.current.pause();
      handleIntroEnded();
    }
  };

  // تكرار الحلقة
  const toggleRepeat = () => {
    setRepeat(!repeat);
  };

  // حفظ التقدم
  const saveProgress = () => {
    if (videoId && duration > 0 && !showIntro && currentTime > 30 && currentTime < duration - 30) {
      localStorage.setItem(`cinewave_resume_${videoId}`, Math.floor(currentTime));
    } else if (currentTime >= duration - 30) {
      localStorage.removeItem(`cinewave_resume_${videoId}`);
      if (onComplete) onComplete(videoId);
    }
  };

  useEffect(() => {
    if (videoId && !showIntro) {
      const savedTime = localStorage.getItem(`cinewave_resume_${videoId}`);
      if (savedTime && parseInt(savedTime) > 30) {
        const shouldResume = window.confirm(`هل تريد الاستئناف من الدقيقة ${Math.floor(parseInt(savedTime) / 60)}؟`);
        if (shouldResume && playerRef.current) {
          playerRef.current.seekTo(parseInt(savedTime));
        }
      }
    }
  }, [videoId, videoUrl, showIntro]);

  useEffect(() => {
    if (showIntro) return;
    const interval = setInterval(() => {
      saveProgress();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentTime, duration, showIntro]);

  // Picture in Picture
  const togglePictureInPicture = async () => {
    if (!playerRef.current || showIntro) return;
    try {
      const videoElement = playerRef.current.getInternalPlayer();
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPictureInPicture(false);
      } else if (videoElement?.requestPictureInPicture) {
        await videoElement.requestPictureInPicture();
        setIsPictureInPicture(true);
      }
    } catch (error) {
      console.error('Picture-in-Picture error:', error);
    }
  };

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showIntro) {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyS') {
          e.preventDefault();
          skipIntro();
        }
        return;
      }
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlay(); break;
        case 'KeyF': e.preventDefault(); toggleFullscreen(); break;
        case 'KeyM': e.preventDefault(); toggleMute(); break;
        case 'ArrowLeft': e.preventDefault(); skipBackward(5); break;
        case 'ArrowRight': e.preventDefault(); skipForward(5); break;
        case 'ArrowUp': e.preventDefault(); 
          const newVolumeUp = Math.min(volume + 0.1, 1); 
          setVolume(newVolumeUp); 
          setMuted(false); 
          break;
        case 'ArrowDown': e.preventDefault(); 
          const newVolumeDown = Math.max(volume - 0.1, 0); 
          setVolume(newVolumeDown); 
          setMuted(newVolumeDown === 0); 
          break;
        case 'KeyL': e.preventDefault(); toggleRepeat(); break;
        case 'KeyP': e.preventDefault(); togglePictureInPicture(); break;
        case 'KeyR': e.preventDefault(); toggleMarathonMode(); break;
        case 'KeyB': e.preventDefault(); setShowAddBookmark(true); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume, playing, fullscreen, repeat, showIntro, isMarathonMode]);

  // دوال مساعدة
  const skipForward = (seconds = 5) => {
    if (!playerRef.current || showIntro) return;
    const newTime = Math.min(currentTime + seconds, duration);
    playerRef.current.seekTo(newTime);
    syncAudioTime(newTime);
  };

  const skipBackward = (seconds = 5) => {
    if (!playerRef.current || showIntro) return;
    const newTime = Math.max(currentTime - seconds, 0);
    playerRef.current.seekTo(newTime);
    syncAudioTime(newTime);
  };

  const handleDoubleClick = () => {
    if (!showIntro) toggleFullscreen();
    else skipIntro();
  };

  const handleWheel = (e) => {
    if (showIntro) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newVolume = Math.min(Math.max(volume + delta, 0), 1);
    setVolume(newVolume);
    setMuted(newVolume === 0);
  };

  // تحميل الإعدادات المحفوظة
  useEffect(() => {
    const saved = localStorage.getItem('subtitle_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSubtitleSettings(parsed);
      setTempSubtitleSettings(parsed);
    }
  }, []);

  // إدارة الترجمة
  useEffect(() => {
    const video = playerRef.current?.getInternalPlayer();
    if (!video || showIntro) return;
    const oldTrack = video.querySelector('track');
    if (oldTrack && video.contains(oldTrack)) video.removeChild(oldTrack);
    if (!selectedSubtitle) {
      setCurrentSubtitleText('');
      return;
    }
    const selectedSub = subtitles.find(s => s.lang === selectedSubtitle);
    if (!selectedSub || !selectedSub.url) {
      setCurrentSubtitleText('');
      return;
    }
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = selectedSub.label;
    track.srclang = selectedSub.lang;
    track.src = selectedSub.url;
    track.default = true;
    track.onload = () => {
      if (video.textTracks && video.textTracks.length > 0) {
        video.textTracks[0].mode = 'hidden';
      }
    };
    video.appendChild(track);
    subtitleTrackRef.current = track;
    const updateSubtitleText = () => {
      if (video.textTracks && video.textTracks.length > 0) {
        const activeCues = video.textTracks[0].activeCues;
        if (activeCues && activeCues.length > 0) {
          setCurrentSubtitleText(activeCues[0].text);
        } else {
          setCurrentSubtitleText('');
        }
      }
    };
    video.addEventListener('timeupdate', updateSubtitleText);
    return () => {
      video.removeEventListener('timeupdate', updateSubtitleText);
      if (subtitleTrackRef.current && video.contains(subtitleTrackRef.current)) {
        video.removeChild(subtitleTrackRef.current);
      }
    };
  }, [selectedSubtitle, subtitles, showIntro]);

  // إخفاء الترجمة الأصلية
  useEffect(() => {
    if (styleRef.current && document.head.contains(styleRef.current)) {
      document.head.removeChild(styleRef.current);
      styleRef.current = null;
    }
    const style = document.createElement('style');
    style.textContent = `video::cue { visibility: hidden !important; }`;
    document.head.appendChild(style);
    styleRef.current = style;
    return () => {
      if (styleRef.current && document.head.contains(styleRef.current)) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, []);

  // إدارة الصوت
  useEffect(() => {
    if (audioTracks && audioTracks.length > 0) {
      let defaultTrack = null;
      if (defaultAudio) {
        defaultTrack = audioTracks.find(t => t.lang === defaultAudio);
      }
      if (!defaultTrack && audioTracks.length > 0) {
        defaultTrack = audioTracks[0];
      }
      setSelectedAudioTrack(defaultTrack);
    }
  }, [audioTracks, defaultAudio]);

  useEffect(() => {
    if (!selectedAudioTrack || !selectedAudioTrack.url || showIntro) return;
    if (currentAudioElement) {
      currentAudioElement.pause();
      currentAudioElement.src = '';
    }
    const audio = new Audio(selectedAudioTrack.url);
    audio.volume = muted ? 0 : volume;
    audio.loop = repeat;
    audio.preload = 'auto';
    const syncAudio = () => {
      if (playerRef.current && !playerRef.current.getInternalPlayer()?.paused) {
        if (Math.abs(audio.currentTime - currentTime) > 0.5) {
          audio.currentTime = currentTime;
        }
        audio.play().catch(e => console.log('Audio play error:', e));
      }
    };
    audio.addEventListener('timeupdate', () => {
      if (playerRef.current && Math.abs(audio.currentTime - currentTime) > 1) {
        audio.currentTime = currentTime;
      }
    });
    audio.addEventListener('play', syncAudio);
    setCurrentAudioElement(audio);
    return () => {
      audio.pause();
      audio.src = '';
      setCurrentAudioElement(null);
    };
  }, [selectedAudioTrack, showIntro]);

  useEffect(() => {
    if (!currentAudioElement || showIntro) return;
    if (playing) {
      currentAudioElement.play().catch(e => console.log('Audio play error:', e));
    } else {
      currentAudioElement.pause();
    }
  }, [playing, currentAudioElement, showIntro]);

  useEffect(() => {
    if (currentAudioElement && !showIntro) {
      currentAudioElement.volume = muted ? 0 : volume;
    }
  }, [volume, muted, currentAudioElement, showIntro]);

  useEffect(() => {
    if (currentAudioElement && !showIntro) {
      currentAudioElement.loop = repeat;
    }
  }, [repeat, currentAudioElement, showIntro]);

  const syncAudioTime = (time) => {
    if (currentAudioElement && !showIntro && Math.abs(currentAudioElement.currentTime - time) > 0.5) {
      currentAudioElement.currentTime = time;
    }
  };

  // دوال التحكم
  const changeAudioTrack = (track) => {
    setSelectedAudioTrack(track);
    setShowAudioMenu(false);
    localStorage.setItem('cinewave_audio_lang', track.lang);
  };

  const changeSubtitle = (sub) => {
    if (sub) {
      setSelectedSubtitle(sub.lang);
    } else {
      setSelectedSubtitle(null);
      setCurrentSubtitleText('');
    }
    setShowSubtitleMenu(false);
  };

  const saveSubtitleSettings = () => {
    setSubtitleSettings({ ...tempSubtitleSettings });
    localStorage.setItem('subtitle_settings', JSON.stringify(tempSubtitleSettings));
    setShowSubtitleSettings(false);
  };

  const resetSubtitleSettings = () => {
    const defaultSettings = {
      fontSize: 18,
      fontColor: '#FFFFFF',
      fontFamily: 'Cairo, Tahoma, Arial, sans-serif',
      textShadow: '1px 1px 2px black',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backgroundPadding: '4px 8px',
      borderRadius: '4px',
      bottomPosition: 75
    };
    setTempSubtitleSettings(defaultSettings);
    setSubtitleSettings(defaultSettings);
    localStorage.setItem('subtitle_settings', JSON.stringify(defaultSettings));
    setShowSubtitleSettings(false);
  };

  // أحداث الفيديو
  const handleProgress = (state) => {
    if (showIntro) return;
    setCurrentTime(state.playedSeconds);
    syncAudioTime(state.playedSeconds);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
    setIsLoading(false);
  };

  const handleEnded = () => {
    if (repeat) {
      playerRef.current.seekTo(0);
      setPlaying(true);
    } else {
      setPlaying(false);
      if (currentAudioElement) currentAudioElement.pause();
      saveProgress();
      
      if (isMarathonMode && onPlaylistItemClick && playlist.length > 0) {
        const currentIndex = playlist.findIndex(item => item.videoUrl === videoUrl);
        if (currentIndex < playlist.length - 1) {
          const nextEpisode = playlist[currentIndex + 1];
          showCountdown(5, nextEpisode.title);
          setTimeout(() => {
            onPlaylistItemClick(nextEpisode);
          }, 5000);
        } else if (onMarathonComplete) {
          setMarathonMessage('🏁 تهانينا! لقد أكملت جميع الحلقات في وضع الماراثون');
          setShowMarathonNotification(true);
          setTimeout(() => setShowMarathonNotification(false), 5000);
          onMarathonComplete();
        }
      }
    }
  };

  const handleError = (e) => {
    console.error('Video error:', e);
    setIsLoading(false);
    setMarathonMessage('⚠️ خطأ في تشغيل الفيديو. تأكد من صحة الرابط.');
    setShowMarathonNotification(true);
    setTimeout(() => setShowMarathonNotification(false), 5000);
  };

  const togglePlay = () => {
    if (showIntro) {
      skipIntro();
      return;
    }
    setPlaying(!playing);
    if (!playing) updateViews();
  };

  const toggleMute = () => setMuted(!muted);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setMuted(newVolume === 0);
  };

  const handleSeek = (e) => {
    if (showIntro) return;
    const seekTime = parseFloat(e.target.value);
    playerRef.current.seekTo(seekTime);
    setCurrentTime(seekTime);
    syncAudioTime(seekTime);
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

  const changeSpeed = (speed) => {
    if (showIntro) return;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

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

  const progress = !showIntro && duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleMouseMove = () => {
    if (showIntro) return;
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Intro video ref
  const introVideoRef = useRef(null);

  // ========== العرض ==========

  if (showIntro && introVideoUrl) {
    return (
      <div 
        ref={containerRef}
        className="relative bg-black rounded-xl overflow-hidden group w-full"
        onDoubleClick={skipIntro}
      >
        <video
          ref={introVideoRef}
          src={introVideoUrl}
          className="w-full aspect-video object-contain"
          onLoadedMetadata={handleIntroLoadedMetadata}
          onEnded={handleIntroEnded}
          autoPlay={true}
          playsInline
        />
        <div className="absolute inset-0 cursor-pointer z-10" onClick={skipIntro} />
        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-black/60 text-white text-[10px] sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full z-20">
          اضغط للتخطي (␣)
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-pulse">
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-red-600 rounded-2xl flex items-center justify-center mb-2 sm:mb-3 shadow-xl">
              <span className="text-white text-2xl sm:text-4xl font-bold">C</span>
            </div>
            <h1 className="text-white text-xl sm:text-2xl font-bold tracking-wider">Cine<span className="text-red-500">Wave</span></h1>
            <p className="text-gray-400 text-[10px] sm:text-sm mt-1 sm:mt-2">شعار المنصة</p>
          </div>
        </div>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="bg-black rounded-xl aspect-video flex items-center justify-center">
        <p className="text-gray-500 text-sm sm:text-base">لا يوجد رابط فيديو</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black overflow-hidden group w-full ${
        isMobile && isLandscape ? 'fixed inset-0 rounded-none z-50' : 'rounded-xl'
      }`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
    >
      {/* إشعار وضع الماراثون */}
      {showMarathonNotification && marathonMessage && (
        <div className="absolute top-16 sm:top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 sm:px-6 py-1.5 sm:py-3 rounded-full shadow-lg animate-bounce text-xs sm:text-base whitespace-nowrap">
          {marathonMessage}
          {marathonCountdown > 0 && (
            <span className="inline-block ml-1 sm:ml-2 w-5 h-5 sm:w-8 sm:h-8 bg-white/20 rounded-full text-center leading-5 sm:leading-8 text-xs sm:text-base">
              {marathonCountdown}
            </span>
          )}
        </div>
      )}

      {/* ReactPlayer */}
      <ReactPlayer
        ref={playerRef}
        url={cleanVideoUrl}
        playing={playing && !showIntro}
        volume={volume}
        muted={muted}
        playbackRate={playbackSpeed}
        width="100%"
        height="100%"
        className="aspect-video"
        onProgress={handleProgress}
        onDuration={handleDuration}
        onEnded={handleEnded}
        onError={handleError}
        onReady={() => {
          setIsLoading(false);
          if (autoPlay) updateViews();
        }}
        config={{
          file: {
            attributes: {
              crossOrigin: 'anonymous',
              controlsList: 'nodownload'
            },
            forceHLS: true,
            forceVideo: true
          }
        }}
      />

      {/* نافذة الإحصائيات - متجاوبة */}
      {showStats && (
        <div className={`absolute ${isMobile ? 'inset-0 rounded-none' : 'top-0 left-0 rounded-br-xl'} bg-black/90 p-3 sm:p-4 z-40 border-r border-b border-gray-700 ${isMobile ? 'w-full h-full overflow-y-auto' : 'w-80'}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-bold flex items-center gap-2 text-sm sm:text-base">
              <FaChartLine className="text-purple-400" /> إحصائيات المشاهدة
            </h3>
            <button onClick={() => setShowStats(false)} className="text-gray-400 hover:text-white">
              <FaTimes />
            </button>
          </div>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">👁️ المشاهدات</span>
              <span className="text-white font-bold">{stats.views.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">👍 الإعجابات</span>
              <span className="text-green-400">{stats.likes.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">👎 عدم الإعجاب</span>
              <span className="text-red-400">{stats.dislikes.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">⏱️ وقت المشاهدة</span>
              <span className="text-white">{formatTime(stats.watchTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">📊 نسبة الإكمال</span>
              <span className="text-white">{Math.round(stats.completionRate)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
              <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${stats.completionRate}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة الإشارات المرجعية - متجاوبة */}
      {showBookmarks && (
        <div className={`absolute ${isMobile ? 'inset-0 rounded-none' : 'top-0 right-0 rounded-bl-xl'} bg-black/90 p-3 sm:p-4 z-40 border-l border-b border-gray-700 ${isMobile ? 'w-full h-full overflow-y-auto' : 'w-80'}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-bold flex items-center gap-2 text-sm sm:text-base">
              <FaBookmark className="text-yellow-400" /> الإشارات المرجعية
            </h3>
            <button onClick={() => setShowBookmarks(false)} className="text-gray-400 hover:text-white">
              <FaTimes />
            </button>
          </div>
          {bookmarks.length === 0 ? (
            <p className="text-gray-500 text-center py-4 text-sm">لا توجد إشارات مرجعية</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {bookmarks.map(bookmark => (
                <div key={bookmark.id} className="bg-gray-800 rounded-lg p-2">
                  <div className="flex justify-between items-center">
                    <button onClick={() => goToBookmark(bookmark.time)} className="flex-1 text-left">
                      <p className="text-yellow-400 font-mono text-xs sm:text-sm">⏰ {bookmark.timeFormatted}</p>
                      <p className="text-white text-xs">{bookmark.note}</p>
                    </button>
                    <button onClick={() => deleteBookmark(bookmark.id)} className="text-red-400 hover:text-red-300 ml-2">
                      <FaTimes size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* نافذة إضافة إشارة مرجعية - متجاوبة */}
      {showAddBookmark && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowAddBookmark(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 sm:p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-lg sm:text-xl font-bold">📌 إضافة إشارة مرجعية</h3>
              <button onClick={() => setShowAddBookmark(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-gray-400 mb-3 text-sm">الوقت الحالي: <span className="text-yellow-400 font-bold">{formatTime(currentTime)}</span></p>
              <textarea
                placeholder="أضف ملاحظة (اختياري)..."
                value={newBookmarkNote}
                onChange={(e) => setNewBookmarkNote(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white resize-none text-sm"
                rows="3"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={addBookmark} className="flex-1 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 text-sm">
                  حفظ الإشارة
                </button>
                <button onClick={() => setShowAddBookmark(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 text-sm">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* معاينة شريط التقدم */}
      {showPreview && duration > 0 && !isMobile && (
        <div 
          className="absolute bg-black/80 rounded-lg p-2 text-center z-40 pointer-events-none"
          style={{ left: `${previewPosition}px`, bottom: '80px', transform: 'translateX(-50%)' }}
        >
          <div className="text-white text-xs sm:text-sm">{formatTime(previewTime)}</div>
        </div>
      )}

      {/* عرض الترجمة */}
      <div 
        className={`absolute left-0 right-0 text-center pointer-events-none z-10 transition-all duration-200 ${currentSubtitleText ? 'opacity-100' : 'opacity-0'}`}
        style={{ bottom: `${subtitleSettings.bottomPosition}px` }}
      >
        <div
          className="inline-block max-w-[90%] sm:max-w-[85%] mx-auto text-center"
          style={{
            fontSize: `${Math.max(12, Math.min(24, subtitleSettings.fontSize))}px`,
            color: subtitleSettings.fontColor,
            fontFamily: subtitleSettings.fontFamily,
            textShadow: subtitleSettings.textShadow,
            backgroundColor: subtitleSettings.backgroundColor,
            padding: subtitleSettings.backgroundPadding,
            borderRadius: subtitleSettings.borderRadius,
            lineHeight: '1.4',
            whiteSpace: 'pre-line'
          }}
        >
          {currentSubtitleText}
        </div>
      </div>

      {/* قائمة التشغيل الجانبية - متجاوبة */}
      {showPlaylist && playlist.length > 0 && (
        <div className={`absolute top-0 right-0 ${isMobile ? 'w-full' : 'w-80'} h-full bg-black/90 z-40 overflow-y-auto border-l border-gray-700`}>
          <div className="p-3 sm:p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-sm sm:text-base">📋 قائمة التشغيل</h3>
              <button onClick={() => setShowPlaylist(false)} className="text-gray-400 hover:text-white">
                <FaTimes />
              </button>
            </div>
            {isMarathonMode && (
              <div className="mb-3 p-2 bg-purple-600/20 rounded-lg text-center">
                <span className="text-purple-400 text-[10px] sm:text-xs">🏃 وضع الماراثون مفعل</span>
              </div>
            )}
            <div className="space-y-2">
              {playlist.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => onPlaylistItemClick?.(item)}
                  className={`flex items-center gap-2 sm:gap-3 p-2 rounded-lg cursor-pointer transition ${videoUrl === item.videoUrl ? 'bg-red-600/20 border border-red-500' : 'hover:bg-gray-800'}`}
                >
                  <img src={item.thumbnail} alt={item.title} className="w-10 h-7 sm:w-12 sm:h-8 object-cover rounded" />
                  <div className="flex-1">
                    <p className="text-white text-xs sm:text-sm line-clamp-1">{item.title}</p>
                    <p className="text-gray-500 text-[10px] sm:text-xs">{item.duration}</p>
                  </div>
                  <FaPlay className="text-gray-400 text-[10px] sm:text-xs" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* مؤشر التحميل */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
          <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* شريط التحكم - متجاوب مع الوضع الأفقي */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent transition-opacity duration-300 z-30 ${
        showControls ? 'opacity-100' : 'opacity-0'
      } ${
        isMobile && isLandscape ? 'p-1' : 'p-2 sm:p-4'
      }`}>
        
        {/* شريط التقدم مع عرض الإشارات المرجعية */}
        <div className={`mb-1 sm:mb-3 relative ${isMobile && isLandscape ? 'mb-0' : ''}`} ref={progressBarRef}>
          <input
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            onMouseMove={() => {}}
            onMouseLeave={() => setShowPreview(false)}
            className={`w-full ${
              isMobile && isLandscape ? 'h-1' : 'h-1.5 sm:h-2'
            } bg-gray-600 rounded-lg appearance-none cursor-pointer`}
            style={{
              background: `linear-gradient(to right, #e50914 ${progress}%, #4b5563 ${progress}%)`
            }}
          />
          {/* علامات الإشارات المرجعية على شريط التقدم */}
          <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none">
            {bookmarks.map(bookmark => (
              <div
                key={bookmark.id}
                className="absolute w-1 h-1.5 sm:h-2 bg-yellow-400 rounded-full"
                style={{ left: `${(bookmark.time / duration) * 100}%` }}
                title={bookmark.note}
              />
            ))}
          </div>
          {!isMobile && (
            <div className="flex justify-between text-white text-[10px] sm:text-xs mt-0.5 sm:mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          )}
        </div>

        {/* أزرار التحكم - مضغوطة في الوضع الأفقي */}
        <div className="flex flex-wrap items-center justify-between gap-0.5 sm:gap-2">
          {/* المجموعة اليمنى */}
          <div className="flex items-center gap-0.5 sm:gap-2">
            <button onClick={togglePlay} className="text-white hover:text-red-500 transition p-0.5 sm:p-1">
              {playing ? <FaPause size={isMobile && isLandscape ? 16 : (isMobile ? 14 : 18)} /> : <FaPlay size={isMobile && isLandscape ? 16 : (isMobile ? 14 : 18)} />}
            </button>
            <button onClick={() => skipBackward(5)} className="text-white hover:text-red-500 transition p-0.5 sm:p-1">
              <FaBackward size={isMobile && isLandscape ? 12 : (isMobile ? 12 : 16)} />
            </button>
            <button onClick={() => skipForward(5)} className="text-white hover:text-red-500 transition p-0.5 sm:p-1">
              <FaForward size={isMobile && isLandscape ? 12 : (isMobile ? 12 : 16)} />
            </button>
            
            {/* وقت التشغيل في الوضع الأفقي */}
            {isMobile && isLandscape && (
              <span className="text-white text-[10px] ml-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}
            
            <button onClick={toggleRepeat} className={`transition p-0.5 sm:p-1 ${repeat ? 'text-red-500' : 'text-white hover:text-red-500'}`}>
              <FaRedoAlt size={isMobile && isLandscape ? 10 : (isMobile ? 10 : 14)} />
            </button>
            
            {/* أزرار الصوت - في الوضع الأفقي فقط */}
            {(isMobile && isLandscape) && (
              <div className="flex items-center gap-1 ml-1">
                <button onClick={toggleMute} className="text-white hover:text-red-500 transition p-0.5">
                  {muted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-12 h-1 bg-gray-600 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* المجموعة اليسرى - أزرار مضغوطة */}
          <div className="flex items-center gap-0.5 sm:gap-2">
            {/* زر الإحصائيات */}
            <button onClick={() => setShowStats(!showStats)} className="text-white hover:text-purple-500 transition p-0.5 sm:p-1">
              <FaChartLine size={isMobile && isLandscape ? 10 : (isMobile ? 12 : 16)} />
            </button>

            {/* زر الإعجاب */}
            <button onClick={handleLike} className={`transition p-0.5 sm:p-1 ${stats.userLiked ? 'text-green-500' : 'text-white hover:text-green-500'}`}>
              <FaThumbsUp size={isMobile && isLandscape ? 10 : (isMobile ? 12 : 14)} />
            </button>

            {/* زر الإشارات المرجعية */}
            <button onClick={() => setShowBookmarks(!showBookmarks)} className="text-white hover:text-yellow-500 transition p-0.5 sm:p-1">
              <FaBookmark size={isMobile && isLandscape ? 10 : (isMobile ? 12 : 14)} />
            </button>

            {/* زر قائمة التشغيل */}
            {playlist.length > 0 && (
              <button onClick={() => setShowPlaylist(!showPlaylist)} className="text-white hover:text-red-500 transition p-0.5 sm:p-1">
                <FaList size={isMobile && isLandscape ? 10 : (isMobile ? 12 : 16)} />
              </button>
            )}

            {/* زر السرعة - للشاشات المتوسطة والكبيرة */}
            {!isMobile && (
              <div className="relative">
                <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="text-white hover:text-red-500 transition px-1 sm:px-2 py-1 text-xs sm:text-sm">
                  {playbackSpeed}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-8 right-0 bg-gray-800 rounded-lg shadow-xl py-1 z-30 min-w-[70px] sm:min-w-[80px]">
                    {speeds.map(speed => (
                      <button key={speed} onClick={() => changeSpeed(speed)} className={`w-full text-right px-2 sm:px-3 py-1 text-xs sm:text-sm ${playbackSpeed === speed ? 'text-red-500' : 'text-gray-300 hover:bg-gray-700'}`}>
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* زر الترجمة - يظهر على جميع الأجهزة */}
            {subtitles.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setShowSubtitleMenu(!showSubtitleMenu)} 
                  className="text-white hover:text-red-500 transition p-0.5 sm:p-1"
                  title="الترجمة"
                >
                  <FaClosedCaptioning size={isMobile && isLandscape ? 12 : (isMobile ? 14 : 18)} />
                </button>
                {showSubtitleMenu && (
                  <div className={`absolute ${isMobile && isLandscape ? 'bottom-6 right-0' : 'bottom-8 right-0'} bg-gray-800 rounded-lg shadow-xl py-1 z-30 min-w-[120px]`}>
                    <button onClick={() => { changeSubtitle(null); setShowSubtitleMenu(false); }} className="w-full text-right px-2 py-1 text-xs text-gray-300 hover:bg-gray-700">
                      إيقاف
                    </button>
                    {subtitles.slice(0, isMobile && isLandscape ? 3 : subtitles.length).map((sub, idx) => (
                      <button key={idx} onClick={() => { changeSubtitle(sub); setShowSubtitleMenu(false); }} className="w-full text-right px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 flex items-center justify-between">
                        <span>{sub.label}</span>
                        {selectedSubtitle === sub.lang && <FaCheck size={8} className="text-red-500" />}
                      </button>
                    ))}
                    <div className="border-t border-gray-700 my-1"></div>
                    <button onClick={() => { setShowSubtitleMenu(false); setShowSubtitleSettings(true); }} className="w-full text-right px-2 py-1 text-xs text-purple-400 hover:bg-gray-700">
                      ⚙️ إعدادات
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* زر إعدادات الترجمة للهواتف */}
            {isMobile && subtitles.length > 0 && (
              <button onClick={() => setShowSubtitleSettings(true)} className="text-white hover:text-purple-500 transition p-0.5 sm:p-1">
                <FaFont size={isMobile && isLandscape ? 9 : 12} />
              </button>
            )}

            {/* زر ملء الشاشة */}
            <button onClick={toggleFullscreen} className="text-white hover:text-red-500 transition p-0.5 sm:p-1">
              {fullscreen ? <FaCompress size={isMobile && isLandscape ? 14 : (isMobile ? 14 : 18)} /> : <FaExpand size={isMobile && isLandscape ? 14 : (isMobile ? 14 : 18)} />}
            </button>
          </div>
        </div>

        {/* معلومات إضافية - مخفية في الوضع الأفقي */}
        {title && !isMobile && !isLandscape && (
          <div className="mt-1 sm:mt-2">
            <p className="text-white text-xs sm:text-sm font-semibold line-clamp-1">{title}</p>
            {repeat && <p className="text-red-500 text-[10px]">🔄 تكرار مفعل</p>}
            {isMarathonMode && <p className="text-purple-400 text-[10px]">🏃 وضع الماراثون</p>}
          </div>
        )}
      </div>

      {/* زر التشغيل في المنتصف - مضغوط للوضع الأفقي */}
      {!playing && !isLoading && showControls && (
        <button 
          onClick={togglePlay} 
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600/80 rounded-full flex items-center justify-center hover:bg-red-600 transition hover:scale-110 z-20 ${
            isMobile && isLandscape ? 'w-10 h-10' : 'w-12 h-12 sm:w-16 sm:h-16'
          }`}
        >
          <FaPlay className={`text-white ${isMobile && isLandscape ? 'text-base' : 'text-lg sm:text-2xl'} ml-0.5`} />
        </button>
      )}

      {/* زر كتم الصوت للهواتف - يظهر في الوضع العمودي فقط */}
      {isMobile && !isLandscape && showControls && !playing && (
        <button onClick={toggleMute} className="absolute bottom-20 right-2 z-20 bg-black/50 p-2 rounded-full text-white hover:bg-red-600 transition">
          {muted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}
        </button>
      )}

      {/* نافذة إعدادات الترجمة - مصغرة للهواتف */}
      {showSubtitleSettings && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 sm:p-4 z-[100]" onClick={() => setShowSubtitleSettings(false)}>
          <div className="bg-gray-900 rounded-xl w-full max-w-sm mx-auto max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* رأس النافذة - مصغر */}
            <div className="p-2 sm:p-3 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
              <h3 className="text-white text-sm sm:text-base font-bold flex items-center gap-1.5">
                <FaClosedCaptioning className="text-purple-400 text-sm" /> 
                <span>إعدادات الترجمة</span>
              </h3>
              <button onClick={() => setShowSubtitleSettings(false)} className="text-gray-400 hover:text-white p-1">
                <FaTimes size={16} />
              </button>
            </div>
            
            <div className="p-2.5 sm:p-4 space-y-3 sm:space-y-4">
              {/* معاينة الترجمة - مصغرة */}
              <div className="bg-gray-800 rounded-lg p-2 text-center">
                <div className="inline-block max-w-full break-words text-center" style={{
                  fontSize: `${Math.max(10, Math.min(20, tempSubtitleSettings.fontSize))}px`,
                  color: tempSubtitleSettings.fontColor,
                  fontFamily: tempSubtitleSettings.fontFamily,
                  textShadow: tempSubtitleSettings.textShadow,
                  backgroundColor: tempSubtitleSettings.backgroundColor,
                  padding: '2px 6px',
                  borderRadius: tempSubtitleSettings.borderRadius,
                }}>
                  {previewText.length > 30 ? previewText.substring(0, 30) + '...' : previewText}
                </div>
              </div>

              {/* حجم الخط - شريط مصغر */}
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-gray-400 text-[11px] sm:text-xs">📏 حجم الخط</label>
                  <span className="text-purple-400 text-[11px] sm:text-xs font-bold">{tempSubtitleSettings.fontSize}px</span>
                </div>
                <input 
                  type="range" 
                  min="12" 
                  max="28" 
                  value={tempSubtitleSettings.fontSize} 
                  onChange={(e) => setTempSubtitleSettings({...tempSubtitleSettings, fontSize: parseInt(e.target.value)})} 
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* موضع الترجمة - شريط مصغر */}
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-gray-400 text-[11px] sm:text-xs">📍 الموضع</label>
                  <span className="text-purple-400 text-[11px] sm:text-xs font-bold">{tempSubtitleSettings.bottomPosition}px</span>
                </div>
                <input 
                  type="range" 
                  min="40" 
                  max="150" 
                  value={tempSubtitleSettings.bottomPosition} 
                  onChange={(e) => setTempSubtitleSettings({...tempSubtitleSettings, bottomPosition: parseInt(e.target.value)})} 
                  className="w-full h-1 bg-gray-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* لون الخط - ألوان مصغرة */}
              <div>
                <label className="text-gray-400 text-[11px] sm:text-xs mb-1 block">🎨 لون الخط</label>
                <div className="flex flex-wrap gap-1.5">
                  {fontColors.slice(0, 6).map(color => (
                    <button 
                      key={color.value} 
                      onClick={() => setTempSubtitleSettings({...tempSubtitleSettings, fontColor: color.value})} 
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border ${tempSubtitleSettings.fontColor === color.value ? 'border-white scale-110' : 'border-transparent'}`} 
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* نوع الخط - قائمة مصغرة */}
              <div>
                <label className="text-gray-400 text-[11px] sm:text-xs mb-0.5 block">✍️ الخط</label>
                <select 
                  value={tempSubtitleSettings.fontFamily} 
                  onChange={(e) => setTempSubtitleSettings({...tempSubtitleSettings, fontFamily: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  {arabicFonts.slice(0, 4).map(font => (
                    <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>{font.name}</option>
                  ))}
                </select>
              </div>

              {/* ظل النص - أزرار مصغرة */}
              <div>
                <label className="text-gray-400 text-[11px] sm:text-xs mb-1 block">🌑 ظل النص</label>
                <div className="flex gap-1.5">
                  {[
                    { value: 'none', label: 'بدون' },
                    { value: '1px 1px 2px black', label: 'خفيف' },
                    { value: '2px 2px 4px black', label: 'متوسط' }
                  ].map(option => (
                    <button 
                      key={option.value} 
                      onClick={() => setTempSubtitleSettings({...tempSubtitleSettings, textShadow: option.value})} 
                      className={`flex-1 px-1.5 py-1 rounded-md text-[10px] sm:text-xs transition ${tempSubtitleSettings.textShadow === option.value ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* خلفية الترجمة - أزرار مصغرة */}
              <div>
                <label className="text-gray-400 text-[11px] sm:text-xs mb-1 block">🎨 الخلفية</label>
                <div className="flex gap-1.5">
                  {[
                    { value: 'rgba(0, 0, 0, 0.7)', label: 'داكنة' },
                    { value: 'rgba(0, 0, 0, 0)', label: 'شفافة' }
                  ].map(option => (
                    <button 
                      key={option.value} 
                      onClick={() => setTempSubtitleSettings({...tempSubtitleSettings, backgroundColor: option.value})} 
                      className={`flex-1 px-1.5 py-1 rounded-md text-[10px] sm:text-xs transition ${tempSubtitleSettings.backgroundColor === option.value ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* أزرار الإجراءات - مصغرة */}
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={saveSubtitleSettings} 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 text-white py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <FaSave size={10} /> حفظ
                </button>
                <button 
                  onClick={resetSubtitleSettings} 
                  className="flex-1 bg-gray-700 text-white py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <FaUndo size={10} /> إعادة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayerPro;