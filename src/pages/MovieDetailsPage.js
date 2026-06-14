// src/pages/MovieDetailsPage.js - نسخة كاملة مع حفظ سجل المشاهدة
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import AdvancedHTML5Player from '../components/AdvancedHTML5Player';
import { moviesAPI, subtitlesAPI, audioTracksAPI } from '../services/api';
import { 
  FaStar, FaPlus, FaShare, FaCalendarAlt, 
  FaClock, FaFilm, FaArrowLeft, FaPlay, FaMicrophoneAlt, FaClosedCaptioning,
  FaLanguage, FaHeadphones, FaCheckCircle
} from 'react-icons/fa';

const MovieDetailsPage = () => {
  const { id } = useParams();
  const { language, t } = useLanguage();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [subtitles, setSubtitles] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);
  const [showLanguages, setShowLanguages] = useState(false);
  const [showHistoryToast, setShowHistoryToast] = useState(false);

  // دالة حفظ الفيلم في سجل المشاهدة
  const saveToWatchHistory = (movieData) => {
    try {
      console.log('💾 حفظ فيلم في سجل المشاهدة:', movieData.title);
      
      // جلب السجل الحالي
      let history = localStorage.getItem('cinewave_watch_history');
      let historyArray = history ? JSON.parse(history) : [];
      
      // إنشاء عنصر السجل
      const historyItem = {
        id: movieData.id,
        type: 'movie',
        title: movieData.title,
        title_ar: movieData.title_ar || movieData.title,
        poster: movieData.poster,
        year: movieData.year,
        rating: movieData.rating,
        duration: movieData.duration,
        genre: movieData.genre,
        description: movieData.description || movieData.description_ar,
        progress: 0,
        watchedAt: new Date().toISOString()
      };
      
      // إزالة أي عنصر مكرر
      const existingIndex = historyArray.findIndex(item => item.id === movieData.id && item.type === 'movie');
      if (existingIndex !== -1) {
        historyArray.splice(existingIndex, 1);
      }
      
      // إضافة في البداية
      historyArray.unshift(historyItem);
      
      // الاحتفاظ بآخر 100 عنصر
      const trimmedHistory = historyArray.slice(0, 100);
      localStorage.setItem('cinewave_watch_history', JSON.stringify(trimmedHistory));
      
      console.log('✅ تم حفظ الفيلم في السجل:', movieData.title);
      console.log('📋 عدد العناصر في السجل:', trimmedHistory.length);
      
      // إظهار إشعار
      setShowHistoryToast(true);
      setTimeout(() => setShowHistoryToast(false), 2000);
      
      // إرسال حدث للتحديث
      window.dispatchEvent(new Event('historyUpdated'));
      window.dispatchEvent(new Event('storage'));
      
      return true;
    } catch (error) {
      console.error('❌ خطأ في حفظ سجل المشاهدة:', error);
      return false;
    }
  };

  // دالة تشغيل الفيلم مع حفظ السجل
  const handleWatchClick = () => {
    if (movie) {
      saveToWatchHistory(movie);
      setShowPlayer(true);
    }
  };

  // التحقق من حالة تسجيل الدخول
  useEffect(() => {
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!user);
    
    if (user) {
      const userData = JSON.parse(user);
      setInWatchlist(userData.watchlist?.includes(parseInt(id)) || false);
    }
  }, [id]);

  // تحميل بيانات الفيلم والترجمات والمسارات الصوتية
  useEffect(() => {
    const loadMovie = async () => {
      setLoading(true);
      try {
        console.log('🔍 جاري البحث عن الفيلم بالمعرف:', id);
        
        // جلب الفيلم من API
        let movieData = await moviesAPI.getById(id);
        
        if (movieData && movieData.id) {
          console.log('✅ تم العثور على الفيلم:', movieData.title);
          setMovie(movieData);
          
          // جلب الترجمات والمسارات الصوتية بشكل منفصل
          const [subtitlesData, audioTracksData] = await Promise.all([
            subtitlesAPI.getByMovie(id),
            audioTracksAPI.getByMovie(id)
          ]);
          
          setSubtitles(subtitlesData);
          setAudioTracks(audioTracksData);
          console.log(`📝 تم تحميل ${subtitlesData.length} ترجمة و ${audioTracksData.length} مسار صوتي`);
        } else {
          console.log('❌ لم يتم العثور على الفيلم بالمعرف:', id);
        }
      } catch (error) {
        console.error('❌ خطأ في تحميل الفيلم:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadMovie();
    }
  }, [id]);

  // إضافة/إزالة من قائمة المشاهدة
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
    
    // تحديث user object
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.watchlist = newWatchlist;
    localStorage.setItem('user', JSON.stringify(user));
    
    const message = inWatchlist ? 'تمت إزالة الفيلم من قائمة المشاهدة' : 'تمت إضافة الفيلم إلى قائمة المشاهدة';
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-fadeIn';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const getTitle = () => {
    if (!movie) return '';
    if (language === 'ar') return movie.title_ar || movie.title;
    if (language === 'fr') return movie.title_fr || movie.title;
    return movie.title;
  };

  const getDescription = () => {
    if (!movie) return '';
    if (language === 'ar') return movie.description_ar || movie.description;
    if (language === 'fr') return movie.description_fr || movie.description;
    return movie.description;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      arabwood: '🇸🇦',
      hollywood: '🇺🇸',
      bollywood: '🇮🇳',
      european: '🇪🇺',
      asian: '🇯🇵',
      animation: '🎨'
    };
    return icons[category] || '🎬';
  };

  const getCategoryName = (category) => {
    const names = {
      arabwood: language === 'ar' ? 'أفلام عربية' : 'Arabwood',
      hollywood: language === 'ar' ? 'أفلام هوليود' : 'Hollywood',
      bollywood: language === 'ar' ? 'أفلام بوليوود' : 'Bollywood',
      european: language === 'ar' ? 'أفلام أوروبية' : 'European',
      asian: language === 'ar' ? 'أفلام آسيوية' : 'Asian',
      animation: language === 'ar' ? 'رسوم متحركة' : 'Animation'
    };
    return names[category] || category;
  };

  const getDefaultSubtitle = () => {
    if (!subtitles.length) return '';
    const defaultSub = subtitles.find(s => s.is_default);
    return defaultSub ? defaultSub.language : subtitles[0]?.language || '';
  };

  const getDefaultAudio = () => {
    if (!audioTracks.length) return '';
    const defaultTrack = audioTracks.find(t => t.is_default);
    return defaultTrack ? defaultTrack.language : audioTracks[0]?.language || '';
  };

  // تنسيق الترجمات للمشغل
  const formatSubtitlesForPlayer = () => {
    return subtitles.map(sub => ({
      lang: sub.language,
      label: sub.label,
      url: sub.url,
      default: sub.is_default
    }));
  };

  // تنسيق المسارات الصوتية للمشغل
  const formatAudioTracksForPlayer = () => {
    return audioTracks.map(track => ({
      lang: track.language,
      label: track.label,
      url: track.url,
      default: track.is_default
    }));
  };

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
  
  if (!movie) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">🎬</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">الفيلم غير موجود</h1>
          <p className="text-gray-400 mb-6">لم يتم العثور على الفيلم الذي تبحث عنه</p>
          <Link to="/movies" className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">
            العودة إلى الأفلام
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* إشعار حفظ السجل */}
      {showHistoryToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 animate-fadeIn">
          <FaCheckCircle className="text-white" />
          <span>تم إضافة الفيلم إلى سجل المشاهدة</span>
        </div>
      )}

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
              <span className="text-white text-sm">{getTitle()}</span>
            </div>
            
            <div className="h-full flex items-center justify-center p-4">
              <div className="w-full max-w-6xl">
                <AdvancedHTML5Player
                  videoUrl={movie.video_url}
                  poster={movie.poster}
                  title={getTitle()}
                  autoPlay={true}
                  subtitles={formatSubtitlesForPlayer()}
                  audioTracks={formatAudioTracksForPlayer()}
                  defaultSubtitle={getDefaultSubtitle()}
                  defaultAudio={getDefaultAudio()}
                  videoId={movie.id}
                  onEnded={() => console.log('Video ended')}
                  onError={(error) => console.error('Player error:', error)}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] w-full overflow-hidden">
            <img 
              src={movie.backdrop || movie.poster} 
              alt={getTitle()} 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
              <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{getCategoryIcon(movie.category)}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-red-600/50 text-white">
                    {getCategoryName(movie.category)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-2 max-w-4xl">{getTitle()}</h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-300 text-xs sm:text-sm mb-4">
                  <span className="flex items-center gap-1">
                    <FaStar className="text-yellow-400 text-sm" /> {movie.rating}/10
                  </span>
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt /> {movie.year}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaClock /> {movie.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaFilm /> {movie.genre}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {/* زر المشاهدة المعدل */}
                  <button 
                    onClick={handleWatchClick} 
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-lg flex items-center gap-2 transition text-sm sm:text-base"
                  >
                    <FaPlay className="text-sm sm:text-base" /> {t('movie.watch')}
                  </button>
                  <button 
                    onClick={toggleWatchlist} 
                    className={`px-4 py-2 sm:px-6 sm:py-2 rounded-lg flex items-center gap-2 transition text-sm sm:text-base ${inWatchlist ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    <FaPlus /> {inWatchlist ? t('movie.added') : t('movie.addToList')}
                  </button>
                  <button className="bg-gray-700 px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-600 transition">
                    <FaShare />
                  </button>
                  <button 
                    onClick={() => setShowLanguages(!showLanguages)} 
                    className="bg-purple-600/50 px-3 py-2 rounded-lg hover:bg-purple-600 transition flex items-center gap-2"
                  >
                    <FaLanguage /> اللغات والترجمات
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* باقي الكود كما هو - Details Section, etc. */}
          <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              <div className="md:col-span-2 space-y-4 sm:space-y-6">
                <div className="bg-gray-900/50 rounded-xl p-4 sm:p-6">
                  <h2 className="text-white text-lg sm:text-xl font-bold mb-2 sm:mb-3">{t('movie.synopsis')}</h2>
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{getDescription() || 'لا يوجد وصف متاح لهذا الفيلم'}</p>
                </div>
                
                <div className="bg-gray-900/50 rounded-xl p-4 sm:p-6">
                  <h2 className="text-white text-lg sm:text-xl font-bold mb-2 sm:mb-3">{t('movie.cast')}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">{t('movie.director')}</p>
                      <p className="text-white text-sm sm:text-base">{movie.director || t('common.notSpecified')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{t('movie.castMembers')}</p>
                      <p className="text-white text-sm sm:text-base">{movie.cast || t('common.notSpecified')}</p>
                    </div>
                  </div>
                </div>

                {(subtitles.length > 0 || audioTracks.length > 0) && (
                  <div className="bg-gray-900/50 rounded-xl p-4 sm:p-6">
                    <h2 className="text-white text-lg sm:text-xl font-bold mb-2 sm:mb-3 flex items-center gap-2">
                      <FaLanguage /> اللغات والترجمات
                    </h2>
                    
                    {audioTracks.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-purple-400 text-sm font-semibold mb-2 flex items-center gap-1">
                          <FaHeadphones /> المسارات الصوتية ({audioTracks.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {audioTracks.map((track, idx) => (
                            <span key={idx} className={`px-2 py-1 rounded-full text-xs ${track.is_default ? 'bg-green-600/50 text-green-200' : 'bg-gray-700 text-gray-300'}`}>
                              {track.label} {track.is_default && '(افتراضي)'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {subtitles.length > 0 && (
                      <div>
                        <h3 className="text-blue-400 text-sm font-semibold mb-2 flex items-center gap-1">
                          <FaClosedCaptioning /> الترجمات ({subtitles.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {subtitles.map((sub, idx) => (
                            <span key={idx} className={`px-2 py-1 rounded-full text-xs ${sub.is_default ? 'bg-green-600/50 text-green-200' : 'bg-gray-700 text-gray-300'}`}>
                              {sub.label} {sub.is_default && '(افتراضي)'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-gray-900/50 rounded-xl p-4 sm:p-6">
                  <h3 className="text-white text-base sm:text-lg font-bold mb-2 sm:mb-3">{t('common.additionalInfo')}</h3>
                  <div className="space-y-2 text-gray-300 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span>{t('movie.country')}</span>
                      <span className="text-white">{movie.country || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('movie.genre')}</span>
                      <span className="text-white">{movie.genre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('movie.year')}</span>
                      <span className="text-white">{movie.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('movie.duration')}</span>
                      <span className="text-white">{movie.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>المسارات الصوتية</span>
                      <span className="text-white">{audioTracks.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الترجمات</span>
                      <span className="text-white">{subtitles.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-900/50 rounded-xl overflow-hidden">
                  <img src={movie.poster} alt={getTitle()} className="w-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Languages Modal for Mobile */}
      {showLanguages && (subtitles.length > 0 || audioTracks.length > 0) && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowLanguages(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-xl font-bold">اللغات والترجمات</h3>
              <button onClick={() => setShowLanguages(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            {audioTracks.length > 0 && (
              <div className="mb-4">
                <h4 className="text-purple-400 font-semibold mb-2">🎧 المسارات الصوتية</h4>
                {audioTracks.map((track, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-lg p-2 mb-2">
                    <p className="text-white text-sm">{track.label}</p>
                    <p className="text-gray-500 text-xs">{track.language}</p>
                  </div>
                ))}
              </div>
            )}
            
            {subtitles.length > 0 && (
              <div>
                <h4 className="text-blue-400 font-semibold mb-2">📝 الترجمات</h4>
                {subtitles.map((sub, idx) => (
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

export default MovieDetailsPage;