// src/pages/MovieDetailsPage.js - تفاصيل الفيلم بنفس النمط الموحّد
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import AdvancedHTML5Player from '../components/AdvancedHTML5Player';
import { moviesAPI, subtitlesAPI, audioTracksAPI, watchlistAPI } from '../services/api';
import {
  FaStar, FaPlus, FaShare, FaCalendarAlt,
  FaClock, FaFilm, FaArrowLeft, FaPlay, FaHeadphones, FaClosedCaptioning,
  FaGlobe, FaCheckCircle, FaCheck, FaInfoCircle, FaUsers, FaUserTie,
  FaMapMarkerAlt, FaTag, FaHeart, FaRegHeart,
  FaWhatsapp, FaFacebookF, FaInstagram, FaLink, FaTimes
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const MovieDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [subtitles, setSubtitles] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);
  const [showLanguages, setShowLanguages] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showHistoryToast, setShowHistoryToast] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToastMessage({ text: message, type });
    setTimeout(() => setToastMessage({ text: '', type: 'success' }), 2500);
  };

  const exitFullscreenAndGoBack = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.webkitFullscreenElement) await document.webkitExitFullscreen();
      else if (document.mozFullScreenElement) await document.mozCancelFullScreen();
      else if (document.msFullscreenElement) await document.msExitFullscreen();
    } catch (error) { console.log('خطأ:', error); }
    if (window.history.length > 2) navigate(-1);
    else navigate('/');
  };

  const saveToWatchHistory = (movieData) => {
    if (!movieData || !movieData.id) return false;
    try {
      let history = localStorage.getItem('cinewave_watch_history');
      let historyArray = history ? JSON.parse(history) : [];
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
        watchedAt: new Date().toISOString(),
      };
      historyArray = historyArray.filter(item => !(item.id === movieData.id && item.type === 'movie'));
      historyArray.unshift(historyItem);
      localStorage.setItem('cinewave_watch_history', JSON.stringify(historyArray.slice(0, 100)));
      setShowHistoryToast(true);
      setTimeout(() => setShowHistoryToast(false), 2000);
      window.dispatchEvent(new Event('historyUpdated'));
      window.dispatchEvent(new Event('storage'));
      return true;
    } catch (error) { console.error('خطأ:', error); return false; }
  };

  const handleWatchClick = () => { if (movie) { saveToWatchHistory(movie); setShowPlayer(true); } };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!token || !!user);
  }, []);

  useEffect(() => {
    const check = async () => {
      if (isAuthenticated && id) {
        try {
          const result = await watchlistAPI.isInWatchlist(parseInt(id), 'movie');
          setInWatchlist(!!result?.exists);
        } catch (error) { console.error('watchlist:', error); }
      }
    };
    check();
  }, [isAuthenticated, id]);

  const toggleWatchlist = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (isToggling) return;
    setIsToggling(true);
    try {
      if (inWatchlist) {
        await watchlistAPI.removeFromWatchlist(parseInt(id), 'movie');
        setInWatchlist(false);
        showToast('✅ تمت الإزالة من المفضلة');
      } else {
        await watchlistAPI.addToWatchlist(parseInt(id), 'movie');
        setInWatchlist(true);
        showToast('✅ تمت الإضافة إلى المفضلة');
      }
    } catch (error) {
      console.error('خطأ:', error);
      showToast('❌ حدث خطأ', 'error');
    } finally { setIsToggling(false); }
  };

  useEffect(() => {
    const loadMovie = async () => {
      setLoading(true);
      try {
        const movieData = await moviesAPI.getById(id);
        if (movieData?.id) {
          setMovie(movieData);
          const [subsResult, audioResult] = await Promise.allSettled([
            subtitlesAPI.getByMovie(id),
            audioTracksAPI.getByMovie(id),
          ]);
          setSubtitles(subsResult.status === 'fulfilled' && Array.isArray(subsResult.value) ? subsResult.value : []);
          setAudioTracks(audioResult.status === 'fulfilled' && Array.isArray(audioResult.value) ? audioResult.value : []);
        }
      } catch (error) { console.error('خطأ:', error); }
      finally { setLoading(false); }
    };
    if (id) loadMovie();
  }, [id]);

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
    const icons = { arabwood: '🇸🇦', hollywood: '🇺🇸', bollywood: '🇮🇳', european: '🇪🇺', asian: '🇯🇵', animation: '🎨' };
    return icons[category] || '🎬';
  };

  const getCategoryName = (category) => {
    const names = {
      arabwood: language === 'ar' ? 'أفلام عربية' : 'Arabwood',
      hollywood: language === 'ar' ? 'أفلام هوليود' : 'Hollywood',
      bollywood: language === 'ar' ? 'أفلام بوليوود' : 'Bollywood',
      european: language === 'ar' ? 'أفلام أوروبية' : 'European',
      asian: language === 'ar' ? 'أفلام آسيوية' : 'Asian',
      animation: language === 'ar' ? 'رسوم متحركة' : 'Animation',
    };
    return names[category] || category;
  };

  const getDefaultSubtitle = () => {
    if (!subtitles.length) return undefined;
    const def = subtitles.find(s => s.is_default);
    return def ? def.language : subtitles[0]?.language;
  };

  const getDefaultAudio = () => {
    if (!audioTracks.length) return undefined;
    const def = audioTracks.find(t => t.is_default);
    return def ? def.language : audioTracks[0]?.language;
  };

  const formatSubtitlesForPlayer = () => subtitles.map(sub => ({ lang: sub.language, label: sub.label, url: sub.url, default: !!sub.is_default }));
  const formatAudioTracksForPlayer = () => audioTracks.map(track => ({ lang: track.language, label: track.label, url: track.url, default: !!track.is_default }));

  const getShareUrl = () => window.location.href;
  const getShareTitle = () => getTitle();
  const shareViaWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(`${getShareTitle()} - ${getShareUrl()}`)}`, '_blank'); setShowShareMenu(false); };
  const shareViaFacebook = () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`, '_blank', 'width=600,height=400'); setShowShareMenu(false); };
  const shareViaInstagram = async () => {
    try { await navigator.clipboard.writeText(`${getShareTitle()} - ${getShareUrl()}`); showToast('✅ تم نسخ الرابط'); setTimeout(() => window.open('https://www.instagram.com/', '_blank'), 800); }
    catch { showToast('❌ فشل نسخ الرابط', 'error'); }
    setShowShareMenu(false);
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(getShareUrl()); showToast('✅ تم نسخ الرابط'); }
    catch { showToast('❌ فشل نسخ الرابط', 'error'); }
    setShowShareMenu(false);
  };
  const shareNative = async () => {
    if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      try { await navigator.share({ title: getShareTitle(), text: `شاهد ${getShareTitle()} على CineWave`, url: getShareUrl() }); setShowShareMenu(false); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    setShowShareMenu(!showShareMenu);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1f242d]">
        <div className="relative h-[45vh] md:h-[55vh] bg-white/5 animate-pulse" />
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 space-y-6">
          <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-32 bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1f242d]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4"><span className="text-4xl">🎬</span></div>
          <h1 className="text-2xl font-bold text-white mb-2">الفيلم غير موجود</h1>
          <p className="text-gray-400 mb-6">لم يتم العثور على الفيلم</p>
          <Link to="/movies" className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2 rounded-lg hover:scale-105 transition">العودة إلى الأفلام</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f242d] relative">
      {showHistoryToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2">
          <FaCheckCircle /> <span>تم إضافة الفيلم إلى السجل</span>
        </div>
      )}
      {toastMessage.text && (
        <div className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[60] text-white px-4 py-2 rounded-full shadow-lg text-sm ${toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toastMessage.text}
        </div>
      )}

      {showPlayer ? (
        <div className="fixed inset-0 bg-black z-50">
          <div className="relative h-full">
            <button onClick={exitFullscreenAndGoBack} className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-red-600 transition flex items-center gap-2 border border-white/20">
              <FaArrowLeft size={18} /> <span className="text-sm hidden sm:inline">العودة</span>
            </button>
            <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md rounded-lg px-3 py-1 border border-white/20">
              <span className="text-white text-sm">{getTitle()}</span>
            </div>
            <div className="h-full flex items-center justify-center p-4">
              <div className="w-full max-w-6xl">
                <AdvancedHTML5Player
                  videoUrl={movie.video_url}
                  poster={movie.poster}
                  title={getTitle()}
                  autoPlay={true}
                  autoFullscreen={true}
                  onExitFullscreen={exitFullscreenAndGoBack}
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
          {/* HERO */}
          <div className="relative h-[45vh] sm:h-[50vh] md:h-[55vh] lg:h-[60vh] w-full overflow-hidden bg-[#0d1015]">
            <img src={movie.backdrop || movie.poster} alt={getTitle()} className="absolute inset-0 w-full h-full object-cover object-top" onError={(e) => { e.target.src = 'https://via.placeholder.com/1920x1080/1f242d/666666?text=No+Image'; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f242d] via-[#1f242d]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d1015]/80 via-[#0d1015]/30 to-transparent" />

            <button onClick={() => navigate(-1)} className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 bg-black/60 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-red-600 transition-all duration-300 flex items-center gap-2 border border-white/20 hover:scale-105">
              <FaArrowLeft size={18} /> <span className="text-sm hidden sm:inline">العودة</span>
            </button>

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-12">
              <div className="flex gap-4 sm:gap-6 items-end">
                <div className="hidden md:block flex-shrink-0">
                  <img src={movie.poster} alt={getTitle()} className="w-32 lg:w-40 aspect-[2/3] object-cover rounded-2xl shadow-2xl shadow-black/80 ring-1 ring-white/10" onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450/1f242d/666666?text=No'; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl sm:text-2xl">{getCategoryIcon(movie.category)}</span>
                    <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold">{getCategoryName(movie.category)}</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 leading-[1.05] tracking-tight drop-shadow-2xl line-clamp-2">{getTitle()}</h1>
                  <div className="w-16 h-0.5 bg-gradient-to-r from-red-600 to-transparent rounded-full mb-3" />
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                    <span className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-yellow-500/30"><FaStar className="text-yellow-400 text-xs" /><span className="text-white text-xs font-bold">{movie.rating}/10</span></span>
                    <span className="flex items-center gap-1 text-gray-200 text-xs"><FaCalendarAlt className="text-[10px]" />{movie.year}</span>
                    <span className="flex items-center gap-1 text-gray-200 text-xs"><FaClock className="text-[10px]" />{movie.duration}</span>
                    <span className="hidden sm:flex items-center gap-1 text-gray-200 text-xs"><FaFilm className="text-[10px]" />{movie.genre}</span>
                  </div>
                  <p className="text-gray-300 text-xs sm:text-sm mb-4 line-clamp-2 max-w-2xl leading-relaxed">{getDescription()}</p>

                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <button onClick={handleWatchClick} className="group relative bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg shadow-red-600/40 text-sm">
                      <FaPlay className="text-xs" />
                      <span>{t('movie.watch') || 'شاهد الآن'}</span>
                    </button>
                    <button onClick={toggleWatchlist} disabled={isToggling} className={`group px-4 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all duration-300 text-sm disabled:opacity-50 hover:scale-105 ${inWatchlist ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/40' : 'bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20'}`}>
                      {inWatchlist ? <FaHeart className="text-xs" /> : <FaRegHeart className="text-xs group-hover:text-red-400" />}
                      <span className="hidden sm:inline">{inWatchlist ? 'في المفضلة' : 'إضافة للمفضلة'}</span>
                    </button>
                    <div className="relative">
                      <button onClick={shareNative} className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-2.5 rounded-full transition-all duration-300 border border-white/20 hover:scale-105" aria-label="Share"><FaShare className="text-xs" /></button>
                      {showShareMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 bg-[#21262d] rounded-2xl p-2 shadow-2xl border border-white/10 min-w-[230px]">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-2">
                              <span className="text-white text-xs font-bold">مشاركة</span>
                              <button onClick={() => setShowShareMenu(false)} className="text-gray-400 hover:text-white"><FaTimes className="text-xs" /></button>
                            </div>
                            <button onClick={shareViaWhatsApp} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg"><FaWhatsapp className="text-white text-sm" /></div>
                              <span className="text-white text-sm font-semibold">واتساب</span>
                            </button>
                            <button onClick={shareViaFacebook} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg"><FaFacebookF className="text-white text-sm" /></div>
                              <span className="text-white text-sm font-semibold">فيسبوك</span>
                            </button>
                            <button onClick={shareViaInstagram} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 flex items-center justify-center shadow-lg"><FaInstagram className="text-white text-sm" /></div>
                              <span className="text-white text-sm font-semibold">إنستغرام</span>
                            </button>
                            <button onClick={copyLink} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition border-t border-white/10 mt-1 pt-2.5">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-lg border border-white/10"><FaLink className="text-white text-sm" /></div>
                              <span className="text-white text-sm font-semibold">نسخ الرابط</span>
                            </button>
                          </motion.div>
                        </>
                      )}
                    </div>
                    {(subtitles.length > 0 || audioTracks.length > 0) && (
                      <button onClick={() => setShowLanguages(true)} className="bg-purple-600/40 backdrop-blur-md hover:bg-purple-600 text-white px-4 py-2.5 rounded-full font-bold flex items-center gap-2 transition text-sm border border-purple-500/30 hover:scale-105">
                        <FaGlobe className="text-xs" /> <span className="hidden sm:inline">اللغات</span>
                        <span className="bg-purple-500 text-white text-[10px] rounded-full px-1.5">{subtitles.length + audioTracks.length}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* فاصل أبيض */}
          <div className="relative w-full flex items-center justify-center py-4">
            <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/70 shadow-lg shadow-white/40" />
          </div>

          {/* المحتوى */}
          <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 space-y-6 md:space-y-8">
            <section className="bg-gradient-to-br from-white/[0.04] to-white/[0.02] rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg"><FaInfoCircle className="text-white text-sm" /></div>
                <div>
                  <h2 className="text-white text-lg sm:text-xl md:text-2xl font-bold leading-tight">{t('movie.synopsis') || 'القصة'}</h2>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-transparent rounded-full mt-1" />
                </div>
              </div>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{getDescription() || 'لا يوجد وصف متاح'}</p>
            </section>

            <div className="grid md:grid-cols-3 gap-6">
              <section className="md:col-span-2 bg-gradient-to-br from-white/[0.04] to-white/[0.02] rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg"><FaUsers className="text-white text-sm" /></div>
                  <div>
                    <h2 className="text-white text-lg sm:text-xl md:text-2xl font-bold">{t('movie.cast') || 'طاقم العمل'}</h2>
                    <div className="w-12 h-0.5 bg-gradient-to-r from-blue-600 to-transparent rounded-full mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2"><FaUserTie className="text-yellow-400 text-xs" /><p className="text-gray-400 text-xs uppercase tracking-wide">{t('movie.director') || 'المخرج'}</p></div>
                    <p className="text-white text-sm sm:text-base font-semibold">{movie.director || t('common.notSpecified') || 'غير محدد'}</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2"><FaUsers className="text-purple-400 text-xs" /><p className="text-gray-400 text-xs uppercase tracking-wide">{t('movie.castMembers') || 'الممثلون'}</p></div>
                    <p className="text-white text-sm sm:text-base font-semibold line-clamp-3">{movie.cast || t('common.notSpecified') || 'غير محدد'}</p>
                  </div>
                </div>
              </section>

              <section className="bg-gradient-to-br from-white/[0.04] to-white/[0.02] rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"><FaInfoCircle className="text-white text-sm" /></div>
                  <div>
                    <h2 className="text-white text-lg sm:text-xl font-bold">{t('common.additionalInfo') || 'معلومات إضافية'}</h2>
                    <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-600 to-transparent rounded-full mt-1" />
                  </div>
                </div>
                <div className="space-y-3">
                  <InfoRow icon={<FaMapMarkerAlt />} label={t('movie.country') || 'البلد'} value={movie.country || '—'} />
                  <InfoRow icon={<FaTag />} label={t('movie.genre') || 'التصنيف'} value={movie.genre || '—'} />
                  <InfoRow icon={<FaCalendarAlt />} label={t('movie.year') || 'السنة'} value={movie.year || '—'} />
                  <InfoRow icon={<FaClock />} label={t('movie.duration') || 'المدة'} value={movie.duration || '—'} />
                  <InfoRow icon={<FaHeadphones />} label="مسارات صوتية" value={audioTracks.length} badge />
                  <InfoRow icon={<FaClosedCaptioning />} label="ترجمات" value={subtitles.length} badge />
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      {showLanguages && (subtitles.length > 0 || audioTracks.length > 0) && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLanguages(false)}>
          <div className="bg-[#21262d] rounded-2xl max-w-md w-full p-6 border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white text-xl font-bold">اللغات والترجمات</h3>
              <button onClick={() => setShowLanguages(false)} className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">&times;</button>
            </div>
            {audioTracks.length > 0 && (
              <div className="mb-5">
                <h4 className="text-purple-400 font-semibold mb-3 flex items-center gap-2"><FaHeadphones /> المسارات الصوتية</h4>
                <div className="space-y-2">
                  {audioTracks.map((track, idx) => (
                    <div key={idx} className={`rounded-lg p-3 flex items-center justify-between ${track.is_default ? 'bg-emerald-600/20 border border-emerald-500/30' : 'bg-white/5 border border-white/10'}`}>
                      <div><p className="text-white text-sm font-semibold">{track.label}</p><p className="text-gray-500 text-xs">{track.language}</p></div>
                      {track.is_default && <span className="text-emerald-400 text-xs font-bold">افتراضي</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {subtitles.length > 0 && (
              <div>
                <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2"><FaClosedCaptioning /> الترجمات</h4>
                <div className="space-y-2">
                  {subtitles.map((sub, idx) => (
                    <div key={idx} className={`rounded-lg p-3 flex items-center justify-between ${sub.is_default ? 'bg-emerald-600/20 border border-emerald-500/30' : 'bg-white/5 border border-white/10'}`}>
                      <div><p className="text-white text-sm font-semibold">{sub.label}</p><p className="text-gray-500 text-xs">{sub.language}</p></div>
                      {sub.is_default && <span className="text-emerald-400 text-xs font-bold">افتراضي</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ icon, label, value, badge }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
    <div className="flex items-center gap-2 text-gray-400">
      <span className="text-xs">{icon}</span>
      <span className="text-xs sm:text-sm">{label}</span>
    </div>
    {badge ? (
      <span className="bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-white text-xs font-bold">{value}</span>
    ) : (
      <span className="text-white text-xs sm:text-sm font-semibold text-right max-w-[60%] truncate">{value}</span>
    )}
  </div>
);

export default MovieDetailsPage;