// src/pages/clips/FavoriteClipsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { 
  FaHeart, FaRegHeart, FaList, FaTimes, FaShare, FaTrash, 
  FaChevronLeft, FaStar, FaRegStar, FaClock, FaCalendarAlt, 
  FaPlay, FaUser, FaVideo, FaMusic, FaEye, FaBookmark 
} from 'react-icons/fa';
import { clipsAPI } from '../../services/api';

const FavoriteClipsPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClip, setSelectedClip] = useState(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await clipsAPI.getFavorites();
      setFavorites(data);
      console.log('✅ تم تحميل المفضلة:', data.length);
    } catch (error) {
      console.error('❌ خطأ في تحميل المفضلة:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (clipId) => {
    if (!window.confirm('هل أنت متأكد من إزالة هذا الكليب من المفضلة؟')) return;
    try {
      await clipsAPI.toggleFavorite(clipId);
      await loadFavorites();
    } catch (error) {
      console.error('❌ خطأ في إزالة المفضلة:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل المفضلة...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        <p>حدث خطأ: {error}</p>
        <button onClick={loadFavorites} className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/clips" className="text-gray-400 hover:text-white transition">
            <FaChevronLeft className="text-xl" />
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaHeart className="text-red-500" />
            {t('favoriteClips') || 'الكليبات المفضلة'}
          </h1>
          <span className="text-gray-500 text-sm">({favorites.length})</span>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <FaHeart className="text-6xl mx-auto mb-4 opacity-30" />
            <p className="text-lg">لا توجد كليبات مفضلة</p>
            <Link to="/clips" className="text-purple-400 hover:text-purple-300 transition">
              استكشف الكليبات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favorites.map((clip) => (
              <div key={clip.id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500/50 transition group">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-800">
                  <img 
                    src={clip.thumbnail || 'https://via.placeholder.com/320x180/1a1a2e/ffffff?text=🎵'} 
                    alt={clip.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/320x180/1a1a2e/ffffff?text=🎵';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button 
                      onClick={() => setSelectedClip(clip)}
                      className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition transform hover:scale-110"
                    >
                      <FaPlay className="text-white text-xl ml-1" />
                    </button>
                  </div>
                  <button 
                    onClick={() => removeFromFavorites(clip.id)}
                    className="absolute top-2 right-2 p-2 bg-black/60 rounded-full hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                    title="إزالة من المفضلة"
                  >
                    <FaTrash className="text-red-400 text-sm" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-white font-medium truncate">{clip.title || clip.title_ar}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {clip.artist_image ? (
                      <img src={clip.artist_image} alt={clip.artist_name} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <FaUser className="text-gray-500 text-xs" />
                    )}
                    <p className="text-gray-400 text-sm truncate">{clip.artist_name || 'فنان'}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-gray-500 text-xs">
                    <span className="flex items-center gap-1"><FaEye size={10} /> {clip.views || 0}</span>
                    <span className="flex items-center gap-1"><FaHeart size={10} /> {clip.likes || 0}</span>
                    <span className="flex items-center gap-1"><FaClock size={10} /> {clip.duration || '0:00'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Player Modal */}
      {selectedClip && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50" onClick={() => setSelectedClip(null)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white font-bold">{selectedClip.title}</h3>
              <button onClick={() => setSelectedClip(null)} className="text-gray-400 hover:text-white">
                <FaTimes className="text-xl" />
              </button>
            </div>
            <div className="p-4">
              <video 
                src={selectedClip.video_url} 
                controls 
                autoPlay 
                className="w-full rounded-lg"
                poster={selectedClip.thumbnail}
              />
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaUser className="text-gray-400" />
                  <span className="text-gray-300">{selectedClip.artist_name}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                  <span><FaEye className="inline mr-1" /> {selectedClip.views || 0}</span>
                  <span><FaHeart className="inline mr-1 text-red-400" /> {selectedClip.likes || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ تأكد من وجود هذا السطر في نهاية الملف
export default FavoriteClipsPage;