import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import VideoPlayerPro from '../components/VideoPlayerPro';
import { 
  FaStar, FaPlus, FaShare, FaCalendarAlt, 
  FaClock, FaFilm, FaArrowLeft, FaPlay
} from 'react-icons/fa';

const MovieDetailsPage = () => {
  const { id } = useParams();
  const { language } = useLanguage();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    const findMovie = () => {
      const categories = [
        'cinewave_arabwood', 'cinewave_hollywood', 'cinewave_bollywood',
        'cinewave_european', 'cinewave_asian'
      ];
      
      for (const category of categories) {
        const data = localStorage.getItem(category);
        if (data) {
          const movies = JSON.parse(data);
          const found = movies.find(m => m.id === parseInt(id));
          if (found) {
            setMovie(found);
            break;
          }
        }
      }
      setLoading(false);
    };
    
    findMovie();
    
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    setInWatchlist(watchlist.includes(parseInt(id)));
  }, [id]);

  const toggleWatchlist = () => {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    if (inWatchlist) {
      const newWatchlist = watchlist.filter(item => item !== parseInt(id));
      localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
      setInWatchlist(false);
    } else {
      watchlist.push(parseInt(id));
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
      setInWatchlist(true);
    }
  };

  const getTitle = () => {
    if (language === 'ar') return movie.titleAr || movie.title;
    if (language === 'fr') return movie.titleFr || movie.title;
    return movie.title;
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!movie) return <div className="flex justify-center items-center h-screen text-white">الفيلم غير موجود</div>;

  return (
    <div className="min-h-screen bg-black">
      {showPlayer ? (
        <div className="fixed inset-0 bg-black z-50">
          <div className="relative h-full">
            <button onClick={() => setShowPlayer(false)} className="absolute top-4 left-4 z-10 bg-black/50 p-2 rounded-full text-white hover:bg-red-600 transition">
              <FaArrowLeft size={24} />
            </button>
            <div className="h-full flex items-center justify-center p-4">
              <div className="w-full max-w-6xl">
                <VideoPlayerPro
                  videoUrl={movie.videoUrl}
                  title={getTitle()}
                  subtitles={movie.subtitles || []}
                  autoPlay={true}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative h-[60vh] overflow-hidden">
            <img src={movie.backdrop || movie.poster} alt={getTitle()} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="container-custom">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">{getTitle()}</h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-300 text-sm mb-4">
                  <span className="flex items-center gap-1"><FaStar className="text-yellow-400" /> {movie.rating}/10</span>
                  <span className="flex items-center gap-1"><FaCalendarAlt /> {movie.year}</span>
                  <span className="flex items-center gap-1"><FaClock /> {movie.duration}</span>
                  <span className="flex items-center gap-1"><FaFilm /> {movie.genre}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowPlayer(true)} className="bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition">
                    <FaPlay /> تشغيل
                  </button>
                  <button onClick={toggleWatchlist} className={`px-6 py-2 rounded-lg flex items-center gap-2 transition ${inWatchlist ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    <FaPlus /> {inWatchlist ? 'تم الإضافة' : 'أضف لقائمتي'}
                  </button>
                  <button className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition"><FaShare /></button>
                </div>
              </div>
            </div>
          </div>

          <div className="container-custom py-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-gray-900/50 rounded-xl p-6">
                  <h2 className="text-white text-xl font-bold mb-3">القصة</h2>
                  <p className="text-gray-300 leading-relaxed">{movie.description}</p>
                </div>
                
                <div className="bg-gray-900/50 rounded-xl p-6">
                  <h2 className="text-white text-xl font-bold mb-3">طاقم العمل</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><p className="text-gray-400">المخرج</p><p className="text-white">{movie.director || 'غير محدد'}</p></div>
                    <div><p className="text-gray-400">طاقم التمثيل</p><p className="text-white">{movie.cast || 'غير محدد'}</p></div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-900/50 rounded-xl p-6">
                  <h3 className="text-white font-bold mb-3">معلومات إضافية</h3>
                  <div className="space-y-2 text-gray-300 text-sm">
                    <div className="flex justify-between"><span>الدولة</span><span className="text-white">{movie.country || '-'}</span></div>
                    <div className="flex justify-between"><span>التصنيف</span><span className="text-white">{movie.genre}</span></div>
                    <div className="flex justify-between"><span>السنة</span><span className="text-white">{movie.year}</span></div>
                    <div className="flex justify-between"><span>المدة</span><span className="text-white">{movie.duration}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MovieDetailsPage;