// src/pages/SeriesDetailsPage.js - نسخة كاملة مع حفظ سجل المشاهدة
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import VideoPlayerPro from '../components/VideoPlayerPro';
import { seriesAPI } from '../services/api';
import { 
  FaStar, FaPlus, FaShare, FaCalendarAlt, 
  FaClock, FaFilm, FaClosedCaptioning, 
  FaMicrophoneAlt, FaTv, FaChevronDown, FaChevronUp, FaArrowLeft, FaPlay,
  FaList, FaStepForward, FaCheckCircle
} from 'react-icons/fa';

const SeriesDetailsPage = () => {
  const { id } = useParams();
  const { language, t } = useLanguage();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [expandedSeason, setExpandedSeason] = useState(1);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showHistoryToast, setShowHistoryToast] = useState(false);

  // دالة حفظ المسلسل في سجل المشاهدة
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

  // دالة تشغيل الحلقة مع حفظ السجل
  const handleWatchClick = (episode) => {
    if (series) {
      saveSeriesToHistory(series, episode);
      setSelectedEpisode(episode);
      setShowPlayer(true);
    }
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

  useEffect(() => {
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!user);
    if (user) {
      const userData = JSON.parse(user);
      setInWatchlist(userData.watchlist?.includes(parseInt(id)) || false);
    }
  }, [id]);

  useEffect(() => {
    const loadSeries = async () => {
      setLoading(true);
      try {
        const data = await seriesAPI.getById(id);
        if (data && data.id) {
          setSeries(data);
          if (data.episodes && data.episodes.length > 0) {
            setSelectedEpisode(data.episodes[0]);
          }
        }
      } catch (error) {
        console.error('خطأ في تحميل المسلسل:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSeries();
  }, [id]);

  const toggleWatchlist = () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    let newWatchlist;
    if (inWatchlist) {
      newWatchlist = watchlist.filter(item => item !== parseInt(id));
      setInWatchlist(false);
    } else {
      newWatchlist = [...watchlist, parseInt(id)];
      setInWatchlist(true);
    }
    localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.watchlist = newWatchlist;
    localStorage.setItem('user', JSON.stringify(user));
    const message = inWatchlist ? 'تمت إزالة المسلسل من قائمة المشاهدة' : 'تمت إضافة المسلسل إلى قائمة المشاهدة';
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-fadeIn';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

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
      saveSeriesToHistory(series, nextEpisode);
      setSelectedEpisode(nextEpisode);
      return true;
    }
    return false;
  };

  const goToPreviousEpisode = () => {
    if (!series?.episodes || !selectedEpisode) return false;
    const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id);
    if (currentIndex > 0) {
      const prevEpisode = series.episodes[currentIndex - 1];
      saveSeriesToHistory(series, prevEpisode);
      setSelectedEpisode(prevEpisode);
      return true;
    }
    return false;
  };

  const getPlaylist = () => {
    if (!series?.episodes) return [];
    return series.episodes.map(ep => ({
      id: ep.id,
      title: getEpisodeTitle(ep),
      videoUrl: ep.video_url,
      thumbnail: ep.thumbnail || series.poster,
      duration: ep.duration,
      number: ep.episode_num,
      season: ep.season_num || 1
    }));
  };

  const handlePlaylistItemClick = (item) => {
    const episode = series?.episodes.find(ep => ep.id === item.id);
    if (episode) {
      saveSeriesToHistory(series, episode);
      setSelectedEpisode(episode);
      if (showPlayer) {
        setShowPlayer(false);
        setTimeout(() => setShowPlayer(true), 100);
      }
    }
  };

  const totalEpisodes = series?.episodes?.length || 0;
  const totalSeasons = Object.keys(episodesBySeason()).length;
  const getVideoId = () => {
    if (!series || !selectedEpisode) return null;
    return `${series.id}_ep_${selectedEpisode.id}`;
  };

  const isAnimation = series?.category === 'animation';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
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

  const seasons = episodesBySeason();
  const seasonNumbers = Object.keys(seasons).sort((a, b) => a - b);
  const playlist = getPlaylist();

  return (
    <div className="min-h-screen bg-black">
      {/* إشعار حفظ السجل */}
      {showHistoryToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 animate-fadeIn">
          <FaCheckCircle className="text-white" />
          <span>تم إضافة المسلسل إلى سجل المشاهدة</span>
        </div>
      )}

      <div className={`relative h-[60vh] overflow-hidden ${isAnimation ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50' : ''}`}>
        <img src={series.backdrop || series.poster} alt={getTitle()} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        {isAnimation && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-blue-900/30 pointer-events-none" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container-custom">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getCategoryIcon(series.category)}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${isAnimation ? 'bg-purple-600/50 text-purple-200' : 'bg-red-600/50 text-white'}`}>
                {getCategoryName(series.category)}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <FaTv className="text-red-500" />
              <span className="text-gray-300 text-sm">مسلسل</span>
              <span className="text-gray-500 text-sm">•</span>
              <span className="text-gray-300 text-sm">{totalSeasons} مواسم</span>
              <span className="text-gray-500 text-sm">•</span>
              <span className="text-gray-300 text-sm">{totalEpisodes} حلقات</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">{getTitle()}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-300 text-sm mb-4">
              <span className="flex items-center gap-1"><FaStar className="text-yellow-400" /> {series.rating}/10</span>
              <span className="flex items-center gap-1"><FaCalendarAlt /> {series.year}</span>
              <span className="flex items-center gap-1"><FaFilm /> {series.genre}</span>
            </div>
            <div className="flex gap-3 flex-wrap">
              {selectedEpisode && (
                <button onClick={() => handleWatchClick(selectedEpisode)} className={`${isAnimation ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'} text-white px-6 py-2 rounded-lg flex items-center gap-2 transition`}>
                  <FaPlay /> متابعة المشاهدة
                </button>
              )}
              <button onClick={toggleWatchlist} className={`px-6 py-2 rounded-lg flex items-center gap-2 transition ${inWatchlist ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                <FaPlus /> {inWatchlist ? 'تم الإضافة' : 'أضف لقائمتي'}
              </button>
              <button className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition"><FaShare /></button>
              <button onClick={() => setShowPlaylist(true)} className="bg-purple-600/50 px-4 py-2 rounded-lg hover:bg-purple-600 transition lg:hidden flex items-center gap-2">
                <FaList /> قائمة الحلقات
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className={`${isAnimation ? 'bg-purple-900/30' : 'bg-gray-900/50'} rounded-xl p-6`}>
              <h2 className="text-white text-xl font-bold mb-3 flex items-center gap-2">
                {isAnimation && <span>🎨</span>} القصة
              </h2>
              <p className="text-gray-300 leading-relaxed">{getDescription()}</p>
            </div>
            
            <div className="bg-gray-900/50 rounded-xl p-6">
              <h2 className="text-white text-xl font-bold mb-3">طاقم العمل</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div><p className="text-gray-400">المخرج</p><p className="text-white">{series.director || 'غير محدد'}</p></div>
                <div><p className="text-gray-400">طاقم التمثيل</p><p className="text-white">{series.cast || 'غير محدد'}</p></div>
              </div>
            </div>

            <div className={`${isAnimation ? 'bg-purple-900/30' : 'bg-gray-900/50'} rounded-xl p-6`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white text-xl font-bold flex items-center gap-2"><FaTv /> الحلقات</h2>
                <button onClick={() => setShowPlaylist(true)} className="text-purple-400 text-sm hover:text-purple-300 flex items-center gap-1 lg:hidden">
                  <FaList /> عرض الكل
                </button>
              </div>
              
              {seasonNumbers.length > 0 ? (
                seasonNumbers.map(seasonNum => (
                  <div key={seasonNum} className="mb-4">
                    <button onClick={() => setExpandedSeason(expandedSeason === seasonNum ? null : seasonNum)} className="w-full flex justify-between items-center p-3 bg-gray-800 rounded-lg mb-2 hover:bg-gray-700 transition">
                      <span className="text-white font-semibold">الموسم {seasonNum}</span>
                      {expandedSeason === seasonNum ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                    {expandedSeason === seasonNum && (
                      <div className="space-y-2">
                        {seasons[seasonNum].sort((a, b) => a.episode_num - b.episode_num).map(episode => (
                          <div key={episode.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${selectedEpisode?.id === episode.id ? 'bg-red-600/20 border border-red-500' : 'bg-gray-800/50 hover:bg-gray-800'}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                                <span className="text-red-400 font-bold">{episode.episode_num}</span>
                              </div>
                              <div>
                                <p className="text-white font-medium">{getEpisodeTitle(episode)}</p>
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
          
          <div className="space-y-6">
            <div className={`${isAnimation ? 'bg-purple-900/30' : 'bg-gray-900/50'} rounded-xl p-6`}>
              <h3 className="text-white font-bold mb-3">معلومات إضافية</h3>
              <div className="space-y-2 text-gray-300 text-sm">
                <div className="flex justify-between"><span>الدولة</span><span className="text-white">{series.country || '-'}</span></div>
                <div className="flex justify-between"><span>التصنيف</span><span className="text-white">{series.genre}</span></div>
                <div className="flex justify-between"><span>السنة</span><span className="text-white">{series.year}</span></div>
                <div className="flex justify-between"><span>عدد المواسم</span><span className="text-white">{totalSeasons}</span></div>
                <div className="flex justify-between"><span>عدد الحلقات</span><span className="text-white">{totalEpisodes}</span></div>
                <div className="flex justify-between">
                  <span>النوع</span>
                  <span className={`flex items-center gap-1 ${isAnimation ? 'text-purple-400' : 'text-red-400'}`}>
                    {getCategoryIcon(series.category)} {getCategoryName(series.category)}
                  </span>
                </div>
              </div>
            </div>
            
            {series.episodes && series.episodes.length > 0 && (
              <div className="bg-gray-900/50 rounded-xl p-6">
                <h3 className="text-white font-bold mb-3">أحدث الحلقات</h3>
                <div className="space-y-2">
                  {[...series.episodes].reverse().slice(0, 3).map(ep => (
                    <div key={ep.id} onClick={() => handleWatchClick(ep)} className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700">
                      <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center">
                        <span className="text-red-400 text-sm">{ep.episode_num}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{getEpisodeTitle(ep)}</p>
                        <p className="text-gray-500 text-xs">{ep.duration}</p>
                      </div>
                      <FaPlay className="text-gray-400 text-xs" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={`${isAnimation ? 'bg-purple-900/20' : 'bg-gray-900/50'} rounded-xl overflow-hidden`}>
              <img src={series.poster} alt={getTitle()} className="w-full object-cover" />
              {isAnimation && (
                <div className="p-2 text-center bg-purple-900/30">
                  <span className="text-purple-400 text-xs">🎨 مسلسل رسوم متحركة</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPlayer && selectedEpisode && (
        <div className="fixed inset-0 bg-black z-50">
          <div className="relative h-full">
            <button onClick={() => setShowPlayer(false)} className="absolute top-4 left-4 z-10 bg-black/50 p-2 rounded-full text-white hover:bg-red-600 transition">
              <FaArrowLeft size={24} />
            </button>
            <button onClick={() => setShowPlaylist(true)} className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full text-white hover:bg-red-600 transition lg:hidden">
              <FaList size={20} />
            </button>
            <div className="absolute top-4 left-20 right-20 z-10 bg-black/50 rounded-lg px-3 py-1 text-center">
              <span className="text-white text-sm">{getTitle()} - الحلقة {selectedEpisode.episode_num}: {getEpisodeTitle(selectedEpisode)}</span>
            </div>
            <div className="absolute bottom-24 left-4 right-4 z-10 flex justify-between pointer-events-none">
              <button onClick={goToPreviousEpisode} className={`pointer-events-auto bg-black/50 p-2 rounded-full text-white hover:bg-red-600 transition ${series.episodes?.findIndex(ep => ep.id === selectedEpisode.id) === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={series.episodes?.findIndex(ep => ep.id === selectedEpisode.id) === 0} title="الحلقة السابقة">
                <FaStepForward className="rotate-180" size={20} />
              </button>
              <button onClick={goToNextEpisode} className={`pointer-events-auto bg-black/50 p-2 rounded-full text-white hover:bg-red-600 transition ${series.episodes?.findIndex(ep => ep.id === selectedEpisode.id) === series.episodes?.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={series.episodes?.findIndex(ep => ep.id === selectedEpisode.id) === series.episodes?.length - 1} title="الحلقة التالية">
                <FaStepForward size={20} />
              </button>
            </div>
            <div className="h-full">
              <VideoPlayerPro
                videoUrl={selectedEpisode.video_url}
                title={`${getEpisodeTitle(selectedEpisode)} - ${getTitle()}`}
                subtitles={selectedEpisode.subtitles || []}
                audioTracks={selectedEpisode.audio_tracks || []}
                defaultSubtitle={selectedEpisode.default_subtitle || series.default_subtitle || ''}
                defaultAudio={selectedEpisode.default_audio || series.default_audio || ''}
                autoPlay={true}
                playlist={playlist}
                onPlaylistItemClick={handlePlaylistItemClick}
                videoId={getVideoId()}
                onComplete={() => { const hasNext = goToNextEpisode(); if (!hasNext) setTimeout(() => setShowPlayer(false), 2000); }}
              />
            </div>
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