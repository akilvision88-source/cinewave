// src/pages/SeriesDetailsPage.js - نسخة كاملة مع إصلاح روابط الفيديو
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import AdvancedHTML5Player from '../components/AdvancedHTML5Player';
import { seriesAPI, watchlistAPI } from '../services/api';
import { 
  FaStar, FaPlus, FaShare, FaCalendarAlt, 
  FaClock, FaFilm, FaArrowLeft, FaPlay, FaList, FaStepForward, 
  FaCheckCircle, FaLanguage, FaClosedCaptioning, FaHeadphones,
  FaChevronUp, FaChevronDown
} from 'react-icons/fa';

const SeriesDetailsPage = () => {
  const { id } = useParams();
  const { language, t } = useLanguage();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showHistoryToast, setShowHistoryToast] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [expandedSeason, setExpandedSeason] = useState(1);
  const [isToggling, setIsToggling] = useState(false);
  const [playerError, setPlayerError] = useState(null);

  // ========== دالة عرض الإشعار ==========
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 animate-fadeIn ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  // ========== دالة لإكمال رابط الفيديو ==========
  const getFullVideoUrl = (url) => {
    if (!url) return null;
    
    const API_BASE = 'http://192.168.11.88:5000';
    
    // إذا كان الرابط يبدأ بـ /data أو /api
    if (url.startsWith('/data') || url.startsWith('/api')) {
      return `${API_BASE}${url}`;
    }
    
    // إذا كان الرابط يبدأ بـ data/ (بدون slash)
    if (url.startsWith('data/')) {
      return `${API_BASE}/${url}`;
    }
    
    // إذا كان الرابط يبدأ بـ http، استخدمه كما هو
    if (url.startsWith('http')) {
      return url;
    }
    
    // إذا كان الرابط مساراً محلياً
    return `${API_BASE}/${url}`;
  };

  // ========== حفظ المسلسل في سجل المشاهدة ==========
  const saveSeriesToHistory = (seriesData, episodeData) => {
    try {
      console.log('💾 حفظ مسلسل في سجل المشاهدة:', seriesData.title, '- الحلقة:', episodeData.episode_num);
      
      let history = localStorage.getItem('cinewave_watch_history');
      let historyArray = history ? JSON.parse(history) : [];
      
      const historyItem = {
        id: seriesData.id,
        type: seriesData.category === 'animation' ? 'animation' : 'series',
        title: seriesData.title,
        title_ar: seriesData.title_ar || seriesData.title,
        poster: seriesData.poster,
        year: seriesData.year,
        rating: seriesData.rating,
        genre: seriesData.genre,
        season: episodeData.season_num,
        episode: episodeData.episode_num,
        episode_title: episodeData.title,
        progress: 0,
        watchedAt: new Date().toISOString()
      };
      
      const existingIndex = historyArray.findIndex(item => item.id === seriesData.id && item.type === (seriesData.category === 'animation' ? 'animation' : 'series'));
      if (existingIndex !== -1) {
        historyArray.splice(existingIndex, 1);
      }
      
      historyArray.unshift(historyItem);
      localStorage.setItem('cinewave_watch_history', JSON.stringify(historyArray.slice(0, 100)));
      
      console.log('✅ تم حفظ المسلسل في السجل');
      setShowHistoryToast(true);
      setTimeout(() => setShowHistoryToast(false), 2000);
      window.dispatchEvent(new Event('historyUpdated'));
    } catch (error) {
      console.error('خطأ في حفظ السجل:', error);
    }
  };

  // ========== تشغيل الحلقة مع حفظ السجل وإكمال الرابط ==========
  const handleWatchClick = (episode) => {
    if (series) {
      // إكمال رابط الفيديو
      const fullVideoUrl = getFullVideoUrl(episode.video_url);
      const episodeWithFullUrl = { ...episode, video_url: fullVideoUrl };
      
      console.log('📹 عنوان الحلقة:', episode.title);
      console.log('📹 الرابط الأصلي:', episode.video_url);
      console.log('📹 الرابط الكامل:', fullVideoUrl);
      
      saveSeriesToHistory(series, episodeWithFullUrl);
      setSelectedEpisode(episodeWithFullUrl);
      setPlayerError(null);
      setShowPlayer(true);
    }
  };

  // ========== التحقق من حالة تسجيل الدخول ==========
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!token || !!user);
  }, []);

  // ========== التحقق من وجود المسلسل في قائمة المشاهدة ==========
  useEffect(() => {
    const checkWatchlistStatus = async () => {
      if (isAuthenticated && id) {
        try {
          console.log('🔍 التحقق من وجود المسلسل في قائمة المشاهدة:', id);
          const result = await watchlistAPI.isInWatchlist(parseInt(id), 'series');
          setInWatchlist(result.exists);
          console.log('✅ حالة المسلسل في القائمة:', result.exists);
        } catch (error) {
          console.error('❌ خطأ في التحقق من قائمة المشاهدة:', error);
        }
      }
    };
    checkWatchlistStatus();
  }, [isAuthenticated, id]);

  // ========== إضافة/إزالة من قائمة المشاهدة ==========
  const toggleWatchlist = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    
    if (isToggling) return;
    setIsToggling(true);
    
    try {
      if (inWatchlist) {
        await watchlistAPI.removeFromWatchlist(parseInt(id), 'series');
        setInWatchlist(false);
        showToast('✅ تمت إزالة المسلسل من قائمة المشاهدة');
      } else {
        await watchlistAPI.addToWatchlist(parseInt(id), 'series');
        setInWatchlist(true);
        showToast('✅ تمت إضافة المسلسل إلى قائمة المشاهدة');
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث قائمة المشاهدة:', error);
      showToast('❌ حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  // ========== تحميل بيانات المسلسل ==========
  useEffect(() => {
    const loadSeries = async () => {
      setLoading(true);
      try {
        const data = await seriesAPI.getById(id);
        if (data && data.id) {
          console.log('✅ تم تحميل المسلسل:', data.title);
          console.log('📺 عدد الحلقات:', data.episodes?.length || 0);
          
          // معالجة روابط الحلقات
          if (data.episodes && data.episodes.length > 0) {
            data.episodes = data.episodes.map(ep => ({
              ...ep,
              // لا نقوم بإكمال الرابط هنا، بل نتركه كما هو
              // وسيتم إكماله عند النقر على زر التشغيل
            }));
            
            // اختيار أول حلقة بشكل افتراضي
            setSelectedEpisode(data.episodes[0]);
            console.log('📹 الحلقة الأولى:', data.episodes[0].episode_num);
            console.log('📹 رابط الفيديو:', data.episodes[0].video_url);
          }
          
          setSeries(data);
        }
      } catch (error) {
        console.error('خطأ في تحميل المسلسل:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSeries();
  }, [id]);

  // ========== دوال المساعدة ==========
  const getTitle = () => {
    if (!series) return '';
    if (language === 'ar') return series.title_ar || series.title;
    if (language === 'fr') return series.title_fr || series.title;
    return series.title;
  };

  const getDescription = () => {
    if (!series) return '';
    if (language === 'ar') return series.description_ar || series.description;
    if (language === 'fr') return series.description_fr || series.description;
    return series.description;
  };

  const getEpisodeTitle = (episode) => {
    if (language === 'ar') return episode.title_ar || episode.title;
    if (language === 'fr') return episode.title_fr || episode.title;
    return episode.title;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      arabic: '🇸🇦',
      foreign: '🌍',
      indian: '🇮🇳',
      turkish: '🇹🇷',
      korean: '🇰🇷',
      animation: '🎨'
    };
    return icons[category] || '📺';
  };

  const getCategoryName = (category) => {
    const names = {
      arabic: language === 'ar' ? 'مسلسلات عربية' : 'Arabic Series',
      foreign: language === 'ar' ? 'مسلسلات أجنبية' : 'Foreign Series',
      indian: language === 'ar' ? 'مسلسلات هندية' : 'Indian Series',
      turkish: language === 'ar' ? 'مسلسلات تركية' : 'Turkish Series',
      korean: language === 'ar' ? 'مسلسلات كورية' : 'Korean Series',
      animation: language === 'ar' ? 'رسوم متحركة' : 'Animation Series'
    };
    return names[category] || category;
  };

  const episodesBySeason = () => {
    if (!series?.episodes) return {};
    const seasons = {};
    series.episodes.forEach(ep => {
      const seasonNum = ep.season_num || 1;
      if (!seasons[seasonNum]) seasons[seasonNum] = [];
      seasons[seasonNum].push(ep);
    });
    return seasons;
  };

  const goToNextEpisode = () => {
    if (!series?.episodes || !selectedEpisode) return false;
    const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id);
    if (currentIndex < series.episodes.length - 1) {
      const nextEpisode = series.episodes[currentIndex + 1];
      // إكمال رابط الفيديو للحلقة التالية
      const fullVideoUrl = getFullVideoUrl(nextEpisode.video_url);
      const episodeWithFullUrl = { ...nextEpisode, video_url: fullVideoUrl };
      saveSeriesToHistory(series, episodeWithFullUrl);
      setSelectedEpisode(episodeWithFullUrl);
      setPlayerError(null);
      return true;
    }
    return false;
  };

  const goToPreviousEpisode = () => {
    if (!series?.episodes || !selectedEpisode) return false;
    const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id);
    if (currentIndex > 0) {
      const prevEpisode = series.episodes[currentIndex - 1];
      const fullVideoUrl = getFullVideoUrl(prevEpisode.video_url);
      const episodeWithFullUrl = { ...prevEpisode, video_url: fullVideoUrl };
      saveSeriesToHistory(series, episodeWithFullUrl);
      setSelectedEpisode(episodeWithFullUrl);
      setPlayerError(null);
      return true;
    }
    return false;
  };

  const totalEpisodes = series?.episodes?.length || 0;
  const totalSeasons = Object.keys(episodesBySeason()).length;
  const getVideoId = () => {
    if (!series || !selectedEpisode) return null;
    return `${series.id}_ep_${selectedEpisode.id}`;
  };

  const formatSubtitlesForPlayer = () => {
    if (!selectedEpisode?.subtitles) return [];
    return selectedEpisode.subtitles.map(sub => ({
      lang: sub.language,
      label: sub.label,
      url: sub.url,
      default: sub.is_default
    }));
  };

  const formatAudioTracksForPlayer = () => {
    if (!selectedEpisode?.audio_tracks) return [];
    return selectedEpisode.audio_tracks.map(track => ({
      lang: track.language,
      label: track.label,
      url: track.url,
      default: track.is_default
    }));
  };

  const seasons = episodesBySeason();
  const seasonNumbers = Object.keys(seasons).sort((a, b) => a - b);
  const hasAudioTracks = selectedEpisode?.audio_tracks?.length > 0;
  const hasSubtitles = selectedEpisode?.subtitles?.length > 0;

  // ========== LOADING ==========
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }
  
  // ========== NOT FOUND ==========
  if (!series) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">📺</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">المسلسل غير موجود</h1>
          <p className="text-gray-400 mb-6">لم يتم العثور على المسلسل الذي تبحث عنه</p>
          <Link to="/series" className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">
            العودة إلى المسلسلات
          </Link>
        </div>
      </div>
    );
  }

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-black">
      {/* إشعار حفظ السجل */}
      {showHistoryToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 animate-fadeIn">
          <FaCheckCircle className="text-white" />
          <span>تم إضافة المسلسل إلى سجل المشاهدة</span>
        </div>
      )}

      {/* ====== PLAYER ====== */}
      {showPlayer ? (
        <div className="fixed inset-0 bg-black z-50">
          <div className="relative h-full">
            <button 
              onClick={() => setShowPlayer(false)} 
              className="absolute top-4 left-4 z-20 bg-black/50 p-2 rounded-full text-white hover:bg-red-600 transition"
            >
              <FaArrowLeft size={24} />
            </button>
            
            <div className="absolute top-4 right-4 z-20 bg-black/50 rounded-lg px-3 py-1">
              <span className="text-white text-sm">{getTitle()} - الحلقة {selectedEpisode?.episode_num}</span>
            </div>
            
            <div className="absolute bottom-24 left-4 right-4 z-20 flex justify-between pointer-events-none">
              <button 
                onClick={goToPreviousEpisode} 
                className={`pointer-events-auto bg-black/50 p-3 rounded-full text-white hover:bg-red-600 transition ${series.episodes?.findIndex(ep => ep.id === selectedEpisode?.id) === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} 
                disabled={series.episodes?.findIndex(ep => ep.id === selectedEpisode?.id) === 0} 
                title="الحلقة السابقة"
              >
                <FaStepForward className="rotate-180" size={20} />
              </button>
              <button 
                onClick={goToNextEpisode} 
                className={`pointer-events-auto bg-black/50 p-3 rounded-full text-white hover:bg-red-600 transition ${series.episodes?.findIndex(ep => ep.id === selectedEpisode?.id) === series.episodes?.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`} 
                disabled={series.episodes?.findIndex(ep => ep.id === selectedEpisode?.id) === series.episodes?.length - 1} 
                title="الحلقة التالية"
              >
                <FaStepForward size={20} />
              </button>
            </div>
            
            <div className="h-full flex items-center justify-center p-4">
              <div className="w-full max-w-6xl">
                {selectedEpisode && (
                  <AdvancedHTML5Player
                    videoUrl={selectedEpisode.video_url}
                    poster={selectedEpisode.thumbnail || series.poster}
                    title={`${getEpisodeTitle(selectedEpisode)} - ${getTitle()}`}
                    artist={series.title}
                    autoPlay={true}
                    subtitles={formatSubtitlesForPlayer()}
                    audioTracks={formatAudioTracksForPlayer()}
                    defaultSubtitle={selectedEpisode?.default_subtitle || ''}
                    defaultAudio={selectedEpisode?.default_audio || ''}
                    videoId={getVideoId()}
                    onEnded={() => { 
                      const hasNext = goToNextEpisode(); 
                      if (!hasNext) setTimeout(() => setShowPlayer(false), 2000); 
                    }}
                    onError={(error) => {
                      console.error('❌ خطأ في المشغل:', error);
                      setPlayerError('تعذر تشغيل الفيديو. يرجى المحاولة مرة أخرى.');
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ====== HERO SECTION ====== */}
          <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] w-full overflow-hidden">
            <img 
              src={series.backdrop || series.poster} 
              alt={getTitle()} 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
              <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{getCategoryIcon(series.category)}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-red-600/50 text-white">
                    {getCategoryName(series.category)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-2 max-w-4xl">{getTitle()}</h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-300 text-xs sm:text-sm mb-4">
                  <span className="flex items-center gap-1">
                    <FaStar className="text-yellow-400 text-sm" /> {series.rating}/10
                  </span>
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt /> {series.year}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaFilm /> {series.genre}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaList /> {totalSeasons} مواسم
                  </span>
                  <span className="flex items-center gap-1">
                    <FaPlay /> {totalEpisodes} حلقات
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {selectedEpisode && (
                    <button 
                      onClick={() => handleWatchClick(selectedEpisode)} 
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-lg flex items-center gap-2 transition text-sm sm:text-base"
                    >
                      <FaPlay className="text-sm sm:text-base" /> {t('movie.watch')}
                    </button>
                  )}
                  
                  <button 
                    onClick={toggleWatchlist} 
                    disabled={isToggling}
                    className={`px-4 py-2 sm:px-6 sm:py-2 rounded-lg flex items-center gap-2 transition text-sm sm:text-base disabled:opacity-50 ${
                      inWatchlist 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <FaPlus /> {inWatchlist ? t('movie.added') : t('movie.addToList')}
                  </button>
                  
                  <button className="bg-gray-700 px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-600 transition">
                    <FaShare />
                  </button>
                  
                  <button 
                    onClick={() => setShowLanguages(true)} 
                    className="bg-purple-600/50 px-3 py-2 rounded-lg hover:bg-purple-600 transition flex items-center gap-2 text-sm"
                  >
                    <FaLanguage /> اللغات والترجمات
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ====== DETAILS SECTION ====== */}
          <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              <div className="md:col-span-2 space-y-4 sm:space-y-6">
                {/* القصة */}
                <div className="bg-gray-900/50 rounded-xl p-4 sm:p-6">
                  <h2 className="text-white text-lg sm:text-xl font-bold mb-2 sm:mb-3">{t('movie.synopsis')}</h2>
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{getDescription() || 'لا يوجد وصف متاح لهذا المسلسل'}</p>
                </div>
                
                {/* طاقم العمل */}
                <div className="bg-gray-900/50 rounded-xl p-4 sm:p-6">
                  <h2 className="text-white text-lg sm:text-xl font-bold mb-2 sm:mb-3">{t('movie.cast')}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">{t('movie.director')}</p>
                      <p className="text-white text-sm sm:text-base">{series.director || t('common.notSpecified')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{t('movie.castMembers')}</p>
                      <p className="text-white text-sm sm:text-base">{series.cast || t('common.notSpecified')}</p>
                    </div>
                  </div>
                </div>

                {/* اللغات والترجمات */}
                {(hasAudioTracks || hasSubtitles) && (
                  <div className="bg-gray-900/50 rounded-xl p-4 sm:p-6">
                    <h2 className="text-white text-lg sm:text-xl font-bold mb-2 sm:mb-3 flex items-center gap-2">
                      <FaLanguage /> اللغات والترجمات
                    </h2>
                    
                    {hasAudioTracks && (
                      <div className="mb-4">
                        <h3 className="text-purple-400 text-sm font-semibold mb-2 flex items-center gap-1">
                          <FaHeadphones /> المسارات الصوتية ({selectedEpisode?.audio_tracks?.length || 0})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedEpisode?.audio_tracks?.map((track, idx) => (
                            <span key={idx} className={`px-2 py-1 rounded-full text-xs ${track.is_default ? 'bg-green-600/50 text-green-200' : 'bg-gray-700 text-gray-300'}`}>
                              {track.label} {track.is_default && '(افتراضي)'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {hasSubtitles && (
                      <div>
                        <h3 className="text-blue-400 text-sm font-semibold mb-2 flex items-center gap-1">
                          <FaClosedCaptioning /> الترجمات ({selectedEpisode?.subtitles?.length || 0})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedEpisode?.subtitles?.map((sub, idx) => (
                            <span key={idx} className={`px-2 py-1 rounded-full text-xs ${sub.is_default ? 'bg-green-600/50 text-green-200' : 'bg-gray-700 text-gray-300'}`}>
                              {sub.label} {sub.is_default && '(افتراضي)'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* الحلقات */}
                <div className="bg-gray-900/50 rounded-xl p-4 sm:p-6">
                  <h2 className="text-white text-lg sm:text-xl font-bold mb-2 sm:mb-3 flex items-center gap-2">
                    <FaPlay /> الحلقات
                  </h2>
                  
                  {seasonNumbers.length > 0 ? (
                    seasonNumbers.map(seasonNum => (
                      <div key={seasonNum} className="mb-4">
                        <button 
                          onClick={() => setExpandedSeason(expandedSeason === seasonNum ? null : seasonNum)} 
                          className="w-full flex justify-between items-center p-3 bg-gray-800 rounded-lg mb-2 hover:bg-gray-700 transition"
                        >
                          <span className="text-white font-semibold text-sm">الموسم {seasonNum}</span>
                          {expandedSeason === seasonNum ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                        {expandedSeason === seasonNum && (
                          <div className="space-y-2">
                            {seasons[seasonNum].sort((a, b) => a.episode_num - b.episode_num).map(episode => (
                              <div 
                                key={episode.id} 
                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${selectedEpisode?.id === episode.id ? 'bg-red-600/20 border border-red-500' : 'bg-gray-800/50 hover:bg-gray-800'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                                    <span className="text-red-400 font-bold text-sm">{episode.episode_num}</span>
                                  </div>
                                  <div>
                                    <p className="text-white font-medium text-sm">{getEpisodeTitle(episode)}</p>
                                    <div className="flex items-center gap-2 text-xs">
                                      <p className="text-gray-500">{episode.duration}</p>
                                    </div>
                                  </div>
                                </div>
                                <button onClick={() => handleWatchClick(episode)} className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition">
                                  <FaPlay className="text-white text-sm" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">لا توجد حلقات مضافة بعد</div>
                  )}
                </div>
              </div>
              
              {/* ====== SIDEBAR ====== */}
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-gray-900/50 rounded-xl p-4 sm:p-6">
                  <h3 className="text-white text-base sm:text-lg font-bold mb-2 sm:mb-3">{t('common.additionalInfo')}</h3>
                  <div className="space-y-2 text-gray-300 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span>{t('movie.country')}</span>
                      <span className="text-white">{series.country || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('movie.genre')}</span>
                      <span className="text-white">{series.genre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('movie.year')}</span>
                      <span className="text-white">{series.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>عدد المواسم</span>
                      <span className="text-white">{totalSeasons}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>عدد الحلقات</span>
                      <span className="text-white">{totalEpisodes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>المسارات الصوتية</span>
                      <span className="text-white">{selectedEpisode?.audio_tracks?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الترجمات</span>
                      <span className="text-white">{selectedEpisode?.subtitles?.length || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-900/50 rounded-xl overflow-hidden">
                  <img src={series.poster} alt={getTitle()} className="w-full object-cover" />
                </div>

                {/* أحدث الحلقات */}
                {series.episodes && series.episodes.length > 0 && (
                  <div className="bg-gray-900/50 rounded-xl p-4 sm:p-6">
                    <h3 className="text-white text-base sm:text-lg font-bold mb-2 sm:mb-3">أحدث الحلقات</h3>
                    <div className="space-y-2">
                      {[...series.episodes].reverse().slice(0, 3).map(ep => (
                        <div 
                          key={ep.id} 
                          onClick={() => handleWatchClick(ep)} 
                          className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition"
                        >
                          <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center">
                            <span className="text-red-400 text-sm">{ep.episode_num}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm line-clamp-1">{getEpisodeTitle(ep)}</p>
                            <p className="text-gray-500 text-xs">{ep.duration}</p>
                          </div>
                          <FaPlay className="text-gray-400 text-xs" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ====== LANGUAGES MODAL ====== */}
      {showLanguages && selectedEpisode && (hasAudioTracks || hasSubtitles) && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowLanguages(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-xl font-bold">اللغات والترجمات</h3>
              <button onClick={() => setShowLanguages(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            {hasAudioTracks && (
              <div className="mb-4">
                <h4 className="text-purple-400 font-semibold mb-2">🎧 المسارات الصوتية</h4>
                {selectedEpisode?.audio_tracks?.map((track, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-lg p-2 mb-2">
                    <p className="text-white text-sm">{track.label}</p>
                    <p className="text-gray-500 text-xs">{track.language}</p>
                  </div>
                ))}
              </div>
            )}
            
            {hasSubtitles && (
              <div>
                <h4 className="text-blue-400 font-semibold mb-2">📝 الترجمات</h4>
                {selectedEpisode?.subtitles?.map((sub, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-lg p-2 mb-2">
                    <p className="text-white text-sm">{sub.label}</p>
                    <p className="text-gray-500 text-xs">{sub.language}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SeriesDetailsPage;