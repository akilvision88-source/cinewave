import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FaPlay, FaPause, FaHeart, FaRegHeart, FaList, FaTimes, FaShare, FaChevronLeft, FaStar, FaRegStar, FaClock, FaHeadphones } from 'react-icons/fa';
import VideoPlayer from '../../components/VideoPlayer';
import { recitersAPI } from '../../services/api';

const ReciterDetailsPage = () => {
  const { reciterId } = useParams();
  const { language } = useLanguage();
  const [reciter, setReciter] = useState(null);
  const [surahs, setSurahs] = useState([]);
  const [currentSurah, setCurrentSurah] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favoriteReciters, setFavoriteReciters] = useState([]);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const toastTimeout = useRef(null);

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  // تنسيق رابط YouTube للقرآن
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

  // تحميل بيانات القارئ والسور
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await recitersAPI.getById(reciterId);
        setReciter(data);
        
        const formattedSurahs = (data.surahs || []).map(surah => ({
          ...surah,
          audioUrl: formatYouTubeUrl(surah.audioUrl)
        }));
        setSurahs(formattedSurahs);
        if (formattedSurahs.length > 0) {
          setCurrentSurah(formattedSurahs[0]);
        }
      } catch (error) {
        console.error('خطأ في تحميل بيانات القارئ:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
    const loadFavorites = async () => {
      try {
        const favorites = await recitersAPI.getFavorites();
        setFavoriteReciters(favorites);
      } catch (error) {
        console.error('خطأ في تحميل المفضلين:', error);
      }
    };
    loadFavorites();
  }, [reciterId]);

  const toggleFavoriteReciter = async () => {
    try {
      const data = await recitersAPI.toggleFavorite(reciterId);
      setFavoriteReciters(data.favorites);
      showNotification(favoriteReciters.includes(parseInt(reciterId)) ? 'تم إزالة القارئ من المفضلين' : 'تم إضافة القارئ إلى المفضلين');
    } catch (error) {
      console.error('خطأ في تغيير المفضلة:', error);
    }
  };

  const playSurah = (surah, index) => {
    setCurrentSurah(surah);
    setCurrentIndex(index);
  };

  const nextSurah = () => {
    if (surahs.length === 0) return;
    let nextIndex = (currentIndex + 1) % surahs.length;
    setCurrentIndex(nextIndex);
    setCurrentSurah(surahs[nextIndex]);
  };

  const prevSurah = () => {
    if (surahs.length === 0) return;
    let prevIndex = (currentIndex - 1 + surahs.length) % surahs.length;
    setCurrentIndex(prevIndex);
    setCurrentSurah(surahs[prevIndex]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!reciter) {
    return (
      <div className="flex justify-center items-center h-screen text-white">
        القارئ غير موجود
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Header - ممتد بالكامل */}
      <div className="bg-gradient-to-r from-gray-900 to-black sticky top-0 z-20 border-b border-gray-800">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/quran" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
              <FaChevronLeft /> العودة للقراء
            </Link>
            <Link to="/favorite-reciters" className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition">
              <FaStar className="text-green-400" />
              <span className="hidden sm:inline">المفضلون</span>
              <span className="bg-green-500/30 px-1.5 py-0.5 rounded-full text-xs">{favoriteReciters.length}</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <img src={reciter.image} alt={reciter.name} className="w-10 h-10 rounded-full object-cover" />
            <div>
              <h1 className="text-white font-bold">{reciter.name}</h1>
              <p className="text-gray-500 text-xs">{reciter.country}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - ممتد بالكامل */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Audio Player Section */}
          <div className="lg:col-span-2">
            {currentSurah && (
              <div className="bg-gradient-to-br from-green-900/30 to-black rounded-xl p-4 sm:p-6 border border-green-500/30">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-green-600/20 rounded-full flex items-center justify-center mb-3">
                    <FaHeadphones className="text-green-400 text-2xl sm:text-3xl" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">سورة {currentSurah.name}</h2>
                  <p className="text-gray-400 text-sm sm:text-base">{currentSurah.verses} آية</p>
                </div>
                
                <VideoPlayer
                  videoUrl={currentSurah.audioUrl}
                  title={`سورة ${currentSurah.name}`}
                  artist={reciter.name}
                  onNext={nextSurah}
                  onPrev={prevSurah}
                  hasNext={surahs.length > 1}
                  hasPrev={surahs.length > 1}
                  autoPlay={false}
                />
              </div>
            )}
            
            {/* Current Surah Info */}
            {currentSurah && (
              <div className="mt-4">
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div>
                    <h2 className="text-white text-lg sm:text-xl font-bold">سورة {currentSurah.name}</h2>
                    <p className="text-gray-400 text-sm">{reciter.name}</p>
                  </div>
                  <button onClick={toggleFavoriteReciter} className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition text-sm sm:text-base">
                    {favoriteReciters.includes(parseInt(reciterId)) ? <FaStar className="text-green-500 text-sm sm:text-base" /> : <FaRegStar className="text-sm sm:text-base" />}
                    <span>{favoriteReciters.includes(parseInt(reciterId)) ? 'مفضل' : 'أضف للمفضلين'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Playlist Section - قائمة السور */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                <FaList className="text-green-400" /> قائمة السور ({surahs.length})
              </h3>
              <button className="text-gray-400 hover:text-white"><FaShare /></button>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {surahs.map((surah, idx) => (
                <div key={surah.id} onClick={() => playSurah(surah, idx)} className={`flex items-center gap-3 p-3 cursor-pointer transition hover:bg-gray-800 ${currentSurah?.id === surah.id ? 'bg-green-600/20 border-r-2 border-green-500' : ''}`}>
                  <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center">
                    <span className="text-green-400 text-xs sm:text-sm font-bold">{surah.number}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-xs sm:text-sm font-medium">{surah.name}</p>
                    <p className="text-gray-500 text-[10px] sm:text-xs">{surah.duration} • {surah.verses} آية</p>
                  </div>
                  <FaPlay className={`text-[10px] sm:text-xs ${currentSurah?.id === surah.id ? 'text-green-400' : 'text-gray-400'}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ReciterDetailsPage;