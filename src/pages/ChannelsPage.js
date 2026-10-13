// src/pages/ChannelsPage.js - قنوات مباشرة مع دعم صوت M3U8 (hls.js) + مزامنة محسّنة
// + المفضلة + آخر مشاهدة + اختصارات + مشاركة + ترتيب + ملء الشاشة بالنقر + تحسين الجوال
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  FaSearch, FaTv, FaExpand, FaCompress, FaPlay, FaPause,
  FaVolumeUp, FaVolumeMute, FaMusic, FaSync,
  FaHeart, FaRegHeart, FaHistory, FaShare, FaCheck
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import Hls from 'hls.js';
import { channelsAPI } from '../services/api';

const ChannelsPage = () => {
  const { language, t } = useLanguage();

  // ============================================================
  // 1️⃣ States
  // ============================================================
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [useSeparateAudio, setUseSeparateAudio] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('favorite_channels') || '[]'); }
    catch { return []; }
  });
  const [recentChannels, setRecentChannels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recent_channels') || '[]'); }
    catch { return []; }
  });
  const [copied, setCopied] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [sortBy, setSortBy] = useState(() =>
    localStorage.getItem('channels_sort') || 'default'
  );
  const [viewCounts, setViewCounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('channel_views') || '{}'); }
    catch { return {}; }
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // ============================================================
  // 2️⃣ Refs
  // ============================================================
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const clickTimeoutRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const touchEndXRef = useRef(null);
  const touchEndYRef = useRef(null);

  // ============================================================
  // 3️⃣ Constants
  // ============================================================
  const categories = [
    { id: 'all', label: 'all', icon: '🌐' },
    { id: 'arabic', label: 'arabic', icon: '🇸🇦' },
    { id: 'foreign', label: 'foreign', icon: '🌍' },
    { id: 'sports', label: 'sports', icon: '⚽' },
    { id: 'movies', label: 'movies', icon: '🎬' },
    { id: 'kids', label: 'kids', icon: '🧸' },
    { id: 'religious', label: 'religious', icon: '🕌' },
    { id: 'news', label: 'news', icon: '📰' },
    { id: 'music', label: 'music', icon: '🎵' },
  ];

  // ============================================================
  // 4️⃣ Helper functions
  // ============================================================
  const getChannelName = useCallback((channel) => {
    if (!channel) return '';
    if (language === 'ar') return channel.nameAr || channel.name_ar || channel.name;
    return channel.name;
  }, [language]);

  // ============================================================
  // 5️⃣ sortedChannels (useMemo) — يجب أن يكون قبل أي useEffect يستخدمه
  // ============================================================
  const sortedChannels = useMemo(() => {
    let list = [...filteredChannels];

    switch (sortBy) {
      case 'name_asc':
        list.sort((a, b) =>
          (getChannelName(a) || '').localeCompare(
            getChannelName(b) || '',
            language === 'ar' ? 'ar' : 'en'
          )
        );
        break;
      case 'name_desc':
        list.sort((a, b) =>
          (getChannelName(b) || '').localeCompare(
            getChannelName(a) || '',
            language === 'ar' ? 'ar' : 'en'
          )
        );
        break;
      case 'category':
        list.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        break;
      case 'most_viewed':
        list.sort((a, b) => (viewCounts[b.id] || 0) - (viewCounts[a.id] || 0));
        break;
      case 'favorites_first':
        list.sort((a, b) => {
          const aFav = favorites.includes(a.id) ? 1 : 0;
          const bFav = favorites.includes(b.id) ? 1 : 0;
          return bFav - aFav;
        });
        break;
      default:
        break;
    }

    return list;
  }, [filteredChannels, sortBy, viewCounts, favorites, language, getChannelName]);

  // ============================================================
  // 6️⃣ useCallbacks
  // ============================================================
  const toggleFavorite = useCallback((channelId, e) => {
    e?.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId];
      localStorage.setItem('favorite_channels', JSON.stringify(next));
      if (navigator.vibrate) navigator.vibrate(30);
      return next;
    });
  }, []);

  const addToRecent = useCallback((channel) => {
    setRecentChannels(prev => {
      const filtered = prev.filter(c => c.id !== channel.id);
      const next = [channel, ...filtered].slice(0, 10);
      localStorage.setItem('recent_channels', JSON.stringify(next));
      return next;
    });
  }, []);

  const incrementView = useCallback((channelId) => {
    setViewCounts(prev => {
      const next = { ...prev, [channelId]: (prev[channelId] || 0) + 1 };
      localStorage.setItem('channel_views', JSON.stringify(next));
      return next;
    });
  }, []);

  const shareChannel = useCallback(async (channel, e) => {
    e?.stopPropagation();
    const url = `${window.location.origin}/channels/${channel.id}`;
    const shareData = {
      title: getChannelName(channel),
      text: `شاهد قناة ${getChannelName(channel)} مباشرة`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {}
  }, [getChannelName]);

  const navigateChannel = useCallback((direction) => {
    const list = sortedChannels;
    if (!list.length || !selectedChannel) return;

    const currentIndex = list.findIndex(c => c.id === selectedChannel.id);
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % list.length;
    } else {
      newIndex = (currentIndex - 1 + list.length) % list.length;
    }

    const newChannel = list[newIndex];
    setSelectedChannel(newChannel);
    setIsPlaying(true);
    incrementView(newChannel.id);
    if (navigator.vibrate) navigator.vibrate(30);
  }, [sortedChannels, selectedChannel, incrementView]);

  const handleChannelClick = useCallback((channel) => {
    const isSameChannel = selectedChannel?.id === channel.id;

    if (isSameChannel) {
      // ✅ نقرة ثانية على نفس القناة → ملء الشاشة مباشرة
      setSelectedChannel(channel);
      setIsPlaying(true);
      incrementView(channel.id);

      setTimeout(() => {
        const container = containerRef.current;
        if (container && !document.fullscreenElement) {
          container.requestFullscreen?.().catch(() => {});
          setIsFullscreen(true);
        }
      }, 300);

      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
      return;
    }

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);

    clickTimeoutRef.current = setTimeout(() => {
      setSelectedChannel(channel);
      setIsPlaying(true);
      incrementView(channel.id);
      clickTimeoutRef.current = null;
    }, 250);
  }, [selectedChannel, incrementView]);

  const handleTouchStart = useCallback((e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchEndXRef.current = null;
    touchEndYRef.current = null;
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEndXRef.current = e.touches[0].clientX;
    touchEndYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    const endX = touchEndXRef.current;
    const endY = touchEndYRef.current;

    if (startX === null || endX === null) return;

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const MIN_SWIPE = 60;

    if (Math.abs(deltaX) < MIN_SWIPE || Math.abs(deltaX) < Math.abs(deltaY)) return;

    if (deltaX > 0) navigateChannel('prev');
    else navigateChannel('next');
  }, [navigateChannel]);

  // ============================================================
  // 7️⃣ Regular functions
  // ============================================================
  const syncAudioWithVideo = () => {
    const player = playerRef.current;
    const audio = audioRef.current;
    if (!player || !audio) return;
    try {
      audio.currentTime = player.getCurrentTime();
      audio.playbackRate = 1.0;
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (e) {}
  };

  const jumpToLive = () => {
    const player = playerRef.current;
    const audio = audioRef.current;
    if (player && audio) {
      try {
        audio.currentTime = hlsRef.current?.liveSyncPosition || player.getCurrentTime();
        if (navigator.vibrate) navigator.vibrate(100);
      } catch (e) {}
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!isFullscreen) {
      container?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const toggleSeparateAudio = () => {
    if (!selectedChannel?.audio_url) return;
    setUseSeparateAudio(!useSeparateAudio);
    setAudioLoaded(false);
    setAudioError(null);
  };

  // ============================================================
  // 8️⃣ useEffects
  // ============================================================

  // تحميل القنوات
  useEffect(() => {
    const loadChannels = async () => {
      setLoading(true);
      try {
        const data = await channelsAPI.getAll();
        setChannels(data);
        setFilteredChannels(data);
      } catch (error) {
        console.error('خطأ في تحميل القنوات:', error);
        setChannels([]);
        setFilteredChannels([]);
      } finally {
        setLoading(false);
      }
    };
    loadChannels();
  }, []);

  // فلترة القنوات
  useEffect(() => {
    let results = [...channels];
    if (searchTerm) {
      results = results.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.name_ar && c.name_ar.includes(searchTerm))
      );
    }
    if (selectedCategory !== 'all') {
      results = results.filter(c => c.category === selectedCategory);
    }
    setFilteredChannels(results);
  }, [searchTerm, selectedCategory, channels]);

  // تفعيل الصوت المنفصل
  useEffect(() => {
    setAudioLoaded(false);
    setAudioError(null);
    setIsPlaying(true);

    if (selectedChannel?.audio_url) {
      setUseSeparateAudio(true);
    } else {
      setUseSeparateAudio(false);
    }
  }, [selectedChannel]);

  // HLS للصوت
  useEffect(() => {
    const audio = audioRef.current;
    const audioUrl = selectedChannel?.audio_url;

    if (!audio || !audioUrl || !useSeparateAudio) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const isHlsUrl = audioUrl.includes('.m3u8');

    if (isHlsUrl && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        liveSyncDurationCount: 1,
        liveMaxLatencyDurationCount: 3,
        liveDurationInfinity: true,
        liveBackBufferLength: 0,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 4,
        fragmentLoadingTimeOut: 10000,
        fragmentLoadingMaxRetry: 6,
        abrEwmaDefaultEstimate: 500000,
        startLevel: -1,
      });

      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (hls.liveSyncPosition) audio.currentTime = hls.liveSyncPosition;
        if (isPlaying) audio.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setAudioError('فشل تحميل الصوت المنفصل');
              hls.destroy();
              break;
          }
        }
      });

      hls.loadSource(audioUrl);
      hls.attachMedia(audio);
    } else if (isHlsUrl && audio.canPlayType('application/vnd.apple.mpegurl')) {
      audio.src = audioUrl;
    } else {
      audio.src = audioUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedChannel?.audio_url, useSeparateAudio]);

  // مزامنة الصوت مع الفيديو
  useEffect(() => {
    if (!useSeparateAudio || !selectedChannel?.audio_url) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      const audio = audioRef.current;
      if (!player || !audio || audio.readyState < 2) return;

      try {
        const videoTime = player.getCurrentTime();
        const audioTime = audio.currentTime;
        const drift = videoTime - audioTime;
        const absDrift = Math.abs(drift);

        if (!isPlaying) {
          if (!audio.paused) audio.pause();
          return;
        }

        if (audio.paused && isPlaying) {
          audio.play().catch(() => {});
          return;
        }

        if (absDrift > 2.0) {
          audio.currentTime = videoTime;
          audio.playbackRate = 1.0;
          if (audio.paused) audio.play().catch(() => {});
        } else if (absDrift > 0.5) {
          audio.playbackRate = drift > 0 ? 1.10 : 0.90;
        } else if (absDrift > 0.15) {
          audio.playbackRate = drift > 0 ? 1.04 : 0.96;
        } else {
          audio.playbackRate = 1.0;
        }
      } catch (e) {}
    }, 150);

    return () => clearInterval(interval);
  }, [useSeparateAudio, selectedChannel, isPlaying]);

  // تشغيل/إيقاف الصوت
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !useSeparateAudio) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, useSeparateAudio, selectedChannel]);

  // مستوى الصوت
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = muted ? 0 : volume;
  }, [volume, muted, useSeparateAudio]);

  // حفظ الترتيب
  useEffect(() => {
    localStorage.setItem('channels_sort', sortBy);
  }, [sortBy]);

  // إضافة لآخر مشاهدة عند اختيار قناة
  useEffect(() => {
    if (selectedChannel) addToRecent(selectedChannel);
  }, [selectedChannel, addToRecent]);

  // تنظيف clickTimeout
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  // إغلاق Drawer عند تكبير الشاشة
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsDrawerOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // منع تمرير الصفحة عند فتح Drawer
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen]);

  // fullscreenchange
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (!selectedChannel) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          setIsPlaying(p => !p);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          setMuted(m => !m);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(v => Math.min(1, v + 0.1));
          setMuted(false);
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(v => Math.max(0, v - 0.1));
          break;
        case 's':
          if (selectedChannel.audio_url) syncAudioWithVideo();
          break;
        case 'l':
          if (selectedChannel.audio_url && useSeparateAudio) jumpToLive();
          break;
        case 'arrowright':
          e.preventDefault();
          navigateChannel('next');
          break;
        case 'arrowleft':
          e.preventDefault();
          navigateChannel('prev');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChannel, useSeparateAudio, navigateChannel]);

  // ============================================================
  // 🎨 renderChannelsList
  // ============================================================
  const renderChannelsList = (closeDrawerOnSelect = false) => {
    let displayChannels = sortedChannels;
    if (showFavorites) {
      displayChannels = sortedChannels.filter(c => favorites.includes(c.id));
    } else if (showRecent) {
      displayChannels = recentChannels;
    }

    if (displayChannels.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">
            {showFavorites ? '⭐ لا توجد قنوات مفضلة' :
             showRecent ? '🕐 لا توجد قنوات حديثة' :
             t('channels.noChannels') || 'لا توجد قنوات'}
          </p>
        </div>
      );
    }

    return displayChannels.map((channel) => {
      const isActive = selectedChannel?.id === channel.id;
      const hasAudio = !!channel.audio_url;
      const isFav = favorites.includes(channel.id);
      const views = viewCounts[channel.id] || 0;

      return (
        <div
          key={channel.id}
          onClick={() => {
            handleChannelClick(channel);
            if (closeDrawerOnSelect) setIsDrawerOpen(false);
          }}
          className={`group flex items-center gap-3 p-3 cursor-pointer transition-all duration-300 border-l-4 min-h-[60px] active:bg-white/[0.06] ${
            isActive
              ? 'bg-gradient-to-r from-red-600/20 to-transparent border-red-500'
              : 'border-transparent hover:bg-white/[0.04]'
          }`}
          title={isActive ? '🖱️ انقر مرة أخرى لملء الشاشة' : 'انقر للتشغيل'}
        >
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-11 h-11 rounded-xl object-contain bg-white/5 p-1 border border-white/10 shrink-0"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/44x44/1f242d/666666?text=TV'; }}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate flex items-center gap-1.5 ${isActive ? 'text-white' : 'text-gray-200'}`}>
              {getChannelName(channel)}
              {hasAudio && <FaMusic className="text-pink-400 text-[10px] shrink-0" />}
            </p>
            <p className="text-gray-500 text-xs flex items-center gap-2">
              <span>{t(`channels.${channel.category}`)}</span>
              {views > 0 && <span className="text-orange-400/70">🔥 {views}</span>}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => toggleFavorite(channel.id, e)}
              className={`p-2 rounded-lg transition-all ${
                isFav
                  ? 'text-red-400 bg-red-500/10'
                  : 'text-gray-500 lg:opacity-0 lg:group-hover:opacity-100 active:text-red-400'
              }`}
              title={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            >
              {isFav ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
            </button>
            <button
              onClick={(e) => shareChannel(channel, e)}
              className="p-2 rounded-lg text-gray-500 lg:opacity-0 lg:group-hover:opacity-100 active:text-blue-400 transition-all"
              title="مشاركة"
            >
              <FaShare size={14} />
            </button>
          </div>

          {isActive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
        </div>
      );
    });
  };

  // ============================================================
  // Loading
  // ============================================================
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1f242d]">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f242d] relative pb-24 lg:pb-0">

      {/* Hero */}
      <div className="relative h-[22vh] md:h-[28vh] w-full overflow-hidden bg-[#0d1015]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f242d]/70 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1015]/85 via-[#0d1015]/50 to-[#0d1015]/85" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1015]/50 via-transparent to-transparent" />

        <div className="relative h-full w-full px-4 sm:px-8 md:px-12 lg:px-16 flex flex-col items-center justify-center text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center">
                <FaTv className="text-red-500 text-lg sm:text-xl" />
              </div>
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-br from-white via-rose-100 to-red-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(220,38,38,0.5)]">
                {t('channels.title') || 'القنوات'}
              </h1>
            </div>
            <div className="w-20 sm:w-28 h-0.5 sm:h-1 rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent mb-2 sm:mb-3 shadow-lg shadow-red-500/50" />
            <p className="text-gray-200 text-xs xs:text-sm sm:text-base max-w-xl leading-relaxed drop-shadow-lg">
              شاهد أفضل القنوات المباشرة بجودة عالية
            </p>
          </motion.div>
        </div>
      </div>

      {/* فاصل */}
      <div className="relative w-full flex items-center justify-center py-4">
        <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/70 shadow-lg shadow-white/40" />
      </div>

      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 py-6">

        {/* بحث وفلاتر */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="text"
                placeholder={t('channels.search') || 'ابحث عن قناة...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#21262d] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white focus:outline-none focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 text-sm transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all duration-300 whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/40 scale-105'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className="hidden xs:inline">{t(`channels.${cat.label}`)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 📱 زر فتح قائمة القنوات (جوال فقط) */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="lg:hidden w-full mb-4 bg-gradient-to-r from-red-600 to-rose-600 active:from-red-700 active:to-rose-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-between transition-all active:scale-[0.98] shadow-lg shadow-red-600/30"
        >
          <span className="flex items-center gap-2">
            <FaTv size={16} />
            <span>قائمة القنوات ({sortedChannels.length})</span>
          </span>
          <span className="text-xl">☰</span>
        </button>

        {/* الشبكة الرئيسية */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* قائمة القنوات — Desktop فقط */}
          <div className="hidden lg:block lg:col-span-1 bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 bg-white/[0.02] border-b border-white/5">
              <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-3">
                <span>📡</span>
                {sortedChannels.length} {t('channels.title') || 'قناة'}
              </h3>

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowFavorites(!showFavorites); setShowRecent(false); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    showFavorites ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <FaHeart size={10} /> المفضلة ({favorites.length})
                </button>
                <button
                  onClick={() => { setShowRecent(!showRecent); setShowFavorites(false); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    showRecent ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <FaHistory size={10} /> الأخيرة ({recentChannels.length})
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-gray-400 text-xs whitespace-nowrap">↕️ ترتيب:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 bg-[#21262d] border border-white/10 rounded-lg py-1.5 px-2 text-white text-xs focus:outline-none focus:border-red-500/70 cursor-pointer"
                >
                  <option value="default">الافتراضي</option>
                  <option value="name_asc">الاسم (أ - ي)</option>
                  <option value="name_desc">الاسم (ي - أ)</option>
                  <option value="category">حسب التصنيف</option>
                  <option value="most_viewed">الأكثر مشاهدة 🔥</option>
                  <option value="favorites_first">المفضلة أولاً ⭐</option>
                </select>
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto scrollbar-hide">
              {renderChannelsList(false)}
            </div>
          </div>

          {/* المشغل */}
          <div className="lg:col-span-2">
            {selectedChannel ? (
              <>
                {!isFullscreen && (
                  <div className="mb-2 text-center hidden lg:block">
                    <p className="text-gray-400 text-xs">
                      💡 انقر على القناة مرة أخرى في القائمة لتشغيلها بملء الشاشة
                    </p>
                  </div>
                )}

                <div
                  ref={containerRef}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="relative bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10"
                >
                  <div className="relative aspect-video">
                    <ReactPlayer
                      ref={playerRef}
                      url={selectedChannel.url}
                      playing={isPlaying}
                      volume={useSeparateAudio ? 0 : volume}
                      muted={useSeparateAudio ? true : muted}
                      width="100%"
                      height="100%"
                      className="react-player"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onReady={() => {
                        setTimeout(() => {
                          const player = playerRef.current;
                          const audio = audioRef.current;
                          if (player && audio) audio.currentTime = player.getCurrentTime();
                        }, 1500);
                      }}
                      config={{
                        file: {
                          forceHLS: true,
                          hlsOptions: {
                            enableWorker: true,
                            lowLatencyMode: true,
                            backBufferLength: 30,
                            maxBufferLength: 10,
                            maxMaxBufferLength: 20,
                            liveSyncDurationCount: 1,
                            liveMaxLatencyDurationCount: 3,
                            liveDurationInfinity: true,
                            liveBackBufferLength: 0,
                          },
                          attributes: {
                            controlsList: 'nodownload',
                            crossOrigin: 'anonymous'
                          }
                        }
                      }}
                    />

                    {selectedChannel.audio_url && useSeparateAudio && (
                      <audio
                        ref={audioRef}
                        autoPlay
                        crossOrigin="anonymous"
                        preload="auto"
                        onLoadedData={() => {
                          setAudioLoaded(true);
                          const player = playerRef.current;
                          if (player && audioRef.current) {
                            audioRef.current.currentTime = player.getCurrentTime();
                          }
                        }}
                        onError={() => {
                          setAudioError('فشل تحميل الصوت المنفصل');
                          setAudioLoaded(false);
                        }}
                      />
                    )}
                  </div>

                  {/* شريط التحكم */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-red-500 transition p-2 bg-black/40 rounded-lg backdrop-blur-sm min-w-[36px] min-h-[36px] flex items-center justify-center">
                          {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
                        </button>
                        <button onClick={() => setMuted(!muted)} className="text-white hover:text-red-500 transition p-2 bg-black/40 rounded-lg backdrop-blur-sm min-w-[36px] min-h-[36px] flex items-center justify-center">
                          {muted ? <FaVolumeMute size={12} /> : <FaVolumeUp size={12} />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                          className="w-16 sm:w-24 h-1 bg-gray-600 rounded-lg cursor-pointer accent-red-500"
                        />

                        {selectedChannel.audio_url && (
                          <button
                            onClick={toggleSeparateAudio}
                            className={`text-white transition p-2 rounded-lg backdrop-blur-sm flex items-center gap-1.5 text-xs min-h-[36px] ${
                              useSeparateAudio
                                ? 'bg-pink-600/80 hover:bg-pink-700'
                                : 'bg-black/40 hover:bg-black/60'
                            }`}
                          >
                            <FaMusic size={10} />
                            <span className="hidden sm:inline">
                              {useSeparateAudio ? 'صوت منفصل' : 'صوت مدمج'}
                            </span>
                            {useSeparateAudio && audioLoaded && !audioError && (
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                            )}
                            {audioError && <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>}
                          </button>
                        )}

                        {selectedChannel.audio_url && useSeparateAudio && (
                          <button
                            onClick={jumpToLive}
                            className="text-white hover:text-red-500 transition p-2 bg-black/40 rounded-lg backdrop-blur-sm flex items-center gap-1 text-xs min-h-[36px]"
                          >
                            <FaSync size={10} />
                            <span className="hidden sm:inline">الحافة الحية</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => shareChannel(selectedChannel, e)}
                          className="text-white hover:text-blue-400 transition p-2 bg-black/40 rounded-lg backdrop-blur-sm min-w-[36px] min-h-[36px] flex items-center justify-center"
                        >
                          {copied ? <FaCheck size={12} className="text-green-400" /> : <FaShare size={12} />}
                        </button>
                        <button onClick={toggleFullscreen} className="text-white hover:text-red-500 transition p-2 bg-black/40 rounded-lg backdrop-blur-sm min-w-[36px] min-h-[36px] flex items-center justify-center">
                          {isFullscreen ? <FaCompress size={12} /> : <FaExpand size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* شارة القناة */}
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/20 max-w-[70%]">
                    <div className="flex items-center gap-2">
                      <img src={selectedChannel.logo} alt="" className="w-5 h-5 rounded shrink-0" />
                      <span className="text-white text-xs font-bold truncate">{getChannelName(selectedChannel)}</span>
                      <span className="text-red-400 text-[10px] animate-pulse shrink-0">● مباشر</span>
                    </div>
                  </div>

                  {/* مؤشر Swipe */}
                  <div className="absolute top-1/2 left-2 right-2 -translate-y-1/2 flex justify-between pointer-events-none opacity-40 lg:hidden">
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/60 text-xs">‹</div>
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/60 text-xs">›</div>
                  </div>
                </div>

                {/* معلومات الصوت المنفصل */}
                {selectedChannel?.audio_url && useSeparateAudio && (
                  <div className={`mt-3 rounded-xl p-3 flex items-center justify-between gap-3 border ${
                    audioError ? 'bg-red-500/10 border-red-500/30' : 'bg-pink-500/10 border-pink-500/30'
                  }`}>
                    <div className={`flex items-center gap-2 text-xs ${audioError ? 'text-red-300' : 'text-pink-300'}`}>
                      <FaMusic />
                      <span>
                        {audioError ? `⚠️ ${audioError}` :
                         audioLoaded ? '✅ الصوت المنفصل يعمل بالتزامن' :
                         '🔄 جاري تحميل الصوت...'}
                      </span>
                    </div>
                    {audioLoaded && !audioError && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={syncAudioWithVideo}
                          className="text-pink-300 hover:text-pink-100 text-xs flex items-center gap-1 bg-pink-500/20 hover:bg-pink-500/30 px-2 py-1 rounded-lg transition"
                        >
                          <FaSync size={10} /> مزامنة
                        </button>
                        <button
                          onClick={jumpToLive}
                          className="text-pink-300 hover:text-pink-100 text-xs flex items-center gap-1 bg-pink-500/20 hover:bg-pink-500/30 px-2 py-1 rounded-lg transition"
                        >
                          ⏭️ Live
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* اختصارات */}
                <div className="mt-3 text-center text-gray-500 text-xs hidden lg:flex flex-wrap justify-center gap-2">
                  <span>⌨️ اختصارات:</span>
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Space</kbd> تشغيل •
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">F</kbd> ملء الشاشة •
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">M</kbd> كتم •
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">←→</kbd> تبديل •
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">S</kbd> مزامنة •
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">L</kbd> Live
                </div>
              </>
            ) : (
              <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl aspect-video flex flex-col items-center justify-center border border-white/10">
                <FaTv className="text-gray-700 text-5xl mb-3" />
                <p className="text-gray-500 text-sm">{t('channels.selectChannel') || 'اختر قناة للبدء'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📱 Drawer جانبي للجوال */}
      {/* ============================================================ */}
      {isDrawerOpen && (
        <>
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
            style={{ animation: 'fadeIn 0.2s ease-out' }}
          />

          <div
            className="lg:hidden fixed top-0 right-0 bottom-0 w-[88%] max-w-md bg-[#1a1f27] z-[101] shadow-2xl flex flex-col rounded-l-2xl"
            style={{ animation: 'slideInRight 0.3s ease-out' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-red-600/10 to-transparent">
              <div className="flex items-center gap-2">
                <FaTv className="text-red-500" />
                <h2 className="text-white font-bold text-base">القنوات</h2>
                <span className="text-gray-400 text-xs">({sortedChannels.length})</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-10 h-10 rounded-full bg-white/5 active:bg-white/10 flex items-center justify-center text-white text-xl transition"
              >
                ✕
              </button>
            </div>

            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input
                  type="text"
                  placeholder="ابحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#21262d] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-red-500/70"
                />
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setShowFavorites(!showFavorites); setShowRecent(false); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    showFavorites ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-300 active:bg-white/10'
                  }`}
                >
                  <FaHeart size={10} /> المفضلة
                </button>
                <button
                  onClick={() => { setShowRecent(!showRecent); setShowFavorites(false); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    showRecent ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300 active:bg-white/10'
                  }`}
                >
                  <FaHistory size={10} /> الأخيرة
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full mt-2 bg-[#21262d] border border-white/10 rounded-lg py-2 px-3 text-white text-xs focus:outline-none focus:border-red-500/70"
              >
                <option value="default">الافتراضي</option>
                <option value="name_asc">الاسم (أ - ي)</option>
                <option value="name_desc">الاسم (ي - أ)</option>
                <option value="category">حسب التصنيف</option>
                <option value="most_viewed">الأكثر مشاهدة 🔥</option>
                <option value="favorites_first">المفضلة أولاً ⭐</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {renderChannelsList(true)}
            </div>

            <div className="p-3 border-t border-white/10 text-center text-gray-500 text-xs">
              👆 اسحب يميناً/يساراً على المشغل للتبديل
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 📱 شريط سفلي ثابت للجوال */}
      {/* ============================================================ */}
      {selectedChannel && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0d1015]/95 backdrop-blur-lg border-t border-white/10 px-3 py-2 z-50 safe-area-bottom">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => navigateChannel('prev')}
              className="flex-1 h-12 rounded-xl bg-white/5 active:bg-white/10 text-white flex items-center justify-center gap-1 text-sm font-bold transition"
            >
              ⏮️ السابق
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-rose-600 active:from-red-700 active:to-rose-700 text-white flex items-center justify-center transition shadow-lg shadow-red-600/40 shrink-0"
            >
              {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} className="ml-0.5" />}
            </button>

            <button
              onClick={() => navigateChannel('next')}
              className="flex-1 h-12 rounded-xl bg-white/5 active:bg-white/10 text-white flex items-center justify-center gap-1 text-sm font-bold transition"
            >
              التالي ⏭️
            </button>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="w-12 h-12 rounded-xl bg-white/5 active:bg-white/10 text-white flex items-center justify-center transition shrink-0 text-lg"
              aria-label="القنوات"
            >
              ☰
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelsPage;