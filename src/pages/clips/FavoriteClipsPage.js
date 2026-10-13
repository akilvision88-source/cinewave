// src/pages/clips/FavoriteClipsPage.js - الكليبات المفضلة بنفس النمط الموحّد
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  FaHeart, FaPlay, FaTrash, FaStar, FaUser, FaVideo,
  FaEye, FaClock, FaTimes, FaArrowLeft, FaMusic, FaList
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { clipsAPI } from '../../services/api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const FavoriteClipsPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClip, setSelectedClip] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const { t } = useLanguage();

  useEffect(() => { loadFavorites(); }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await clipsAPI.getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('خطأ:', error);
      setError(error.message);
    } finally { setLoading(false); }
  };

  const removeFromFavorites = async (clipId) => {
    try {
      await clipsAPI.toggleFavorite(clipId);
      await loadFavorites();
      setShowConfirmDelete(null);
    } catch (error) { console.error('خطأ:', error); }
  };

  const showToast = (msg) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg text-sm';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-[#1f242d]"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1f242d]">
        <div className="text-center">
          <p className="text-red-400 mb-4">حدث خطأ: {error}</p>
          <button onClick={loadFavorites} className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2 rounded-lg hover:scale-105 transition">إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f242d] relative">
      {/* Hero */}
      <div className="relative h-[22vh] md:h-[28vh] w-full overflow-hidden bg-[#0d1015]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1511671782779-c97d50d27f15?w=1920&h=400&fit=crop)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f242d]/70 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1015]/85 via-[#0d1015]/50 to-[#0d1015]/85" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1015]/50 via-transparent to-transparent" />

        <div className="relative h-full w-full px-4 sm:px-8 md:px-12 lg:px-16 flex flex-col items-center justify-center text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center"><FaStar className="text-red-500 text-lg sm:text-xl" /></div>
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-br from-white via-rose-100 to-red-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(220,38,38,0.5)]">الكليبات المفضلة</h1>
            </div>
            <div className="w-20 sm:w-28 h-0.5 sm:h-1 rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent mb-2 sm:mb-3 shadow-lg shadow-red-500/50" />
            <p className="text-gray-200 text-xs xs:text-sm sm:text-base max-w-xl leading-relaxed drop-shadow-lg">{favorites.length} كليب في المفضلة</p>
          </motion.div>
        </div>
      </div>

      {/* فاصل أبيض */}
      <div className="relative w-full flex items-center justify-center py-4">
        <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/70 shadow-lg shadow-white/40" />
      </div>

      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 py-6">
        <div className="mb-6">
          <Link to="/clips" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition text-sm">
            <FaArrowLeft /> العودة إلى الكليبات
          </Link>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.03] rounded-2xl border border-white/10">
            <FaStar className="text-gray-600 text-6xl mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium mb-2">لا توجد كليبات مفضلة</p>
            <p className="text-gray-500 text-sm mb-4">أضف كليبات إلى المفضلة لتظهر هنا</p>
            <Link to="/clips" className="inline-block bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2 rounded-lg hover:scale-105 transition"><FaVideo className="inline mr-2" size={12} /> استكشف الكليبات</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {favorites.map((clip) => (
              <motion.div
                key={clip.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-[#151515] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/5 hover:border-red-500/40 transition-all duration-300 group"
              >
                <div className="relative aspect-video bg-[#0d1015]">
                  <img
                    src={clip.thumbnail || 'https://via.placeholder.com/320x180/1f242d/666666?text=🎵'}
                    alt={clip.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/320x180/1f242d/666666?text=🎵'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button
                      onClick={() => setSelectedClip(clip)}
                      className="w-14 h-14 bg-gradient-to-r from-red-600 to-rose-600 rounded-full flex items-center justify-center hover:scale-110 transition shadow-2xl shadow-red-600/50"
                    >
                      <FaPlay className="text-white text-lg ml-0.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => setShowConfirmDelete(clip)}
                    className="absolute top-3 right-3 p-2 bg-black/70 backdrop-blur-md rounded-full hover:bg-red-600 transition opacity-0 group-hover:opacity-100 border border-white/20"
                    title="إزالة من المفضلة"
                  >
                    <FaTrash className="text-red-400 group-hover:text-white text-xs" />
                  </button>
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-md rounded-lg border border-white/20 flex items-center gap-1">
                    <FaClock className="text-red-400 text-[9px]" />
                    <span className="text-white text-[10px] font-bold">{clip.duration || '0:00'}</span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-red-400 transition">{clip.title || clip.title_ar}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {clip.artist_image ? (
                      <img src={clip.artist_image} alt={clip.artist_name} className="w-6 h-6 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-red-600/20 flex items-center justify-center border border-white/10">
                        <FaUser className="text-red-400 text-[9px]" />
                      </div>
                    )}
                    <p className="text-gray-400 text-xs truncate">{clip.artist_name || 'فنان'}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-gray-500 text-xs">
                    <span className="flex items-center gap-1"><FaEye size={10} /> {clip.views || 0}</span>
                    <span className="flex items-center gap-1"><FaHeart size={10} /> {clip.likes || 0}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* مشغل الفيديو */}
      <AnimatePresence>
        {selectedClip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedClip(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#21262d] rounded-2xl max-w-3xl w-full border border-white/10 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-bold text-sm truncate">{selectedClip.title}</h3>
                  <p className="text-gray-400 text-xs mt-0.5">{selectedClip.artist_name}</p>
                </div>
                <button onClick={() => setSelectedClip(null)} className="text-gray-400 hover:text-white p-1 flex-shrink-0"><FaTimes /></button>
              </div>
              <div className="p-4">
                <video
                  src={selectedClip.video_url}
                  controls
                  autoPlay
                  className="w-full rounded-xl"
                  poster={selectedClip.thumbnail}
                />
                <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-gray-400 text-xs" />
                    <span className="text-gray-300 text-sm">{selectedClip.artist_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 text-xs">
                    <span><FaEye className="inline mr-1" size={10} /> {selectedClip.views || 0}</span>
                    <span><FaHeart className="inline mr-1 text-red-400" size={10} /> {selectedClip.likes || 0}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* تأكيد الحذف */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
            onClick={() => setShowConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#21262d] rounded-2xl max-w-md w-full p-6 border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center border border-red-500/40">
                  <FaTrash className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">إزالة من المفضلة</h3>
                  <p className="text-gray-400 text-xs">هذا الإجراء لا يمكن التراجع عنه</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-6">هل أنت متأكد من إزالة "{showConfirmDelete.title}" من المفضلة؟</p>
              <div className="flex gap-3">
                <button onClick={() => removeFromFavorites(showConfirmDelete.id)} className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white py-2.5 rounded-lg hover:scale-105 transition font-bold text-sm">نعم، إزالة</button>
                <button onClick={() => setShowConfirmDelete(null)} className="flex-1 bg-white/5 text-white py-2.5 rounded-lg hover:bg-white/10 transition border border-white/10 font-bold text-sm">إلغاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FavoriteClipsPage;