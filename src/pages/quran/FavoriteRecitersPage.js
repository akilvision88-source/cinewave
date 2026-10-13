import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FaStar, FaTrash, FaMicrophoneAlt, FaPlay, FaChevronLeft } from 'react-icons/fa';
import { recitersAPI } from '../../services/api';

const FavoriteRecitersPage = () => {
  const { language } = useLanguage();
  const [favoriteReciters, setFavoriteReciters] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      try {
        const data = await recitersAPI.getFavorites();
        setFavoriteReciters(data);
      } catch (error) {
        console.error('خطأ في تحميل القراء المفضلين:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFavorites();
  }, []);

  const removeFromFavorites = async (reciterId) => {
    try {
      await recitersAPI.toggleFavorite(reciterId);
      const updated = favoriteReciters.filter(r => r.id !== reciterId);
      setFavoriteReciters(updated);
      showNotification('تم إزالة القارئ من المفضلين');
    } catch (error) {
      console.error('خطأ في إزالة من المفضلين:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (favoriteReciters.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h1 className="text-2xl font-bold text-white mb-2">لا توجد قراء مفضلين</h1>
          <p className="text-gray-400 mb-6">أضف القراء المفضلين من صفحة القراء</p>
          <Link to="/quran" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
            استكشف القراء
          </Link>
        </div>
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

      <div className="bg-gradient-to-r from-gray-900 to-black sticky top-0 z-20 border-b border-gray-800">
        <div className="container-custom py-4 flex justify-between items-center">
          <Link to="/quran" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <FaChevronLeft /> العودة للقراء
          </Link>
          <div className="flex items-center gap-2">
            <FaStar className="text-green-500" />
            <h1 className="text-white font-bold text-lg">القراء المفضلون</h1>
            <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full">{favoriteReciters.length}</span>
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {favoriteReciters.map(reciter => (
            <div key={reciter.id} className="relative bg-gray-900 rounded-xl overflow-hidden group">
              <Link to={`/quran/reciter/${reciter.id}`}>
                <img src={reciter.image} alt={reciter.name} className="w-full aspect-square object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <FaPlay className="text-white text-xl ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                  <h3 className="text-white font-bold text-lg">{reciter.name}</h3>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <FaMicrophoneAlt className="text-xs" />
                    <span>{reciter.surahsCount} سورة</span>
                    <span className="text-gray-600">•</span>
                    <span>{reciter.country}</span>
                  </div>
                </div>
              </Link>
              <button onClick={() => removeFromFavorites(reciter.id)} className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-red-600/80 transition z-10">
                <FaTrash className="text-red-400 text-sm" />
              </button>
            </div>
          ))}
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

export default FavoriteRecitersPage;