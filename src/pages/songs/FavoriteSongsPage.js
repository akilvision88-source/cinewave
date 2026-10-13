// src/pages/songs/FavoriteSongsPage.js - المفضلة بنفس النمط الموحّد
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FaPlay, FaStar, FaTrash, FaMusic, FaUser, FaHeart, FaRegHeart, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import AudioPlayerPro from '../../components/AudioPlayerPro';
import { songsAPI, artistsAPI } from '../../services/api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const FavoriteSongsPage = () => {
  const { language, t } = useLanguage();
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [songsData, artistsData] = await Promise.all([
        songsAPI.getFavorites(),
        artistsAPI.getAll(),
      ]);
      setFavoriteSongs(songsData);
      setArtists(artistsData);
    } catch (error) {
      console.error('خطأ في تحميل الأغاني المفضلة:', error);
    } finally { setLoading(false); }
  };

  const removeFromFavorites = async (songId) => {
    try {
      await songsAPI.toggleFavorite(songId);
      await loadData();
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg text-sm';
      toast.textContent = '✅ تمت الإزالة من المفضلة';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } catch (error) { console.error('خطأ:', error); }
  };

  const getArtist = (artistId) => artists.find(a => a.id === artistId);
  const playSong = (song, index) => { setSelectedSong(song); setCurrentIndex(index); setShowPlayer(true); };
  const nextSong = () => { if (favoriteSongs.length === 0) return; const n = (currentIndex + 1) % favoriteSongs.length; setSelectedSong(favoriteSongs[n]); setCurrentIndex(n); };
  const prevSong = () => { if (favoriteSongs.length === 0) return; const p = (currentIndex - 1 + favoriteSongs.length) % favoriteSongs.length; setSelectedSong(favoriteSongs[p]); setCurrentIndex(p); };

  if (loading) return <div className="flex justify-center items-center h-screen bg-[#1f242d]"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

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
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center"><FaHeart className="text-red-500 text-lg sm:text-xl" /></div>
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-br from-white via-rose-100 to-red-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(220,38,38,0.5)]">الأغاني المفضلة</h1>
            </div>
            <div className="w-20 sm:w-28 h-0.5 sm:h-1 rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent mb-2 sm:mb-3 shadow-lg shadow-red-500/50" />
            <p className="text-gray-200 text-xs xs:text-sm sm:text-base max-w-xl leading-relaxed drop-shadow-lg">{favoriteSongs.length} أغنية في المفضلة</p>
          </motion.div>
        </div>
      </div>

      {/* فاصل أبيض */}
      <div className="relative w-full flex items-center justify-center py-4">
        <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/70 shadow-lg shadow-white/40" />
      </div>

      {/* المشغل */}
      {showPlayer && selectedSong && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl relative">
            <button onClick={() => setShowPlayer(false)} className="absolute top-0 right-0 text-white bg-black/50 p-2 rounded-full hover:bg-red-600 transition z-10"><FaTimes /></button>
            <AudioPlayerPro
              song={selectedSong}
              artist={getArtist(selectedSong.artistId)}
              playlist={favoriteSongs}
              onPlaylistItemClick={(item) => { const i = favoriteSongs.findIndex(s => s.id === item.id); setSelectedSong(item); setCurrentIndex(i); }}
              onNext={nextSong}
              onPrev={prevSong}
              autoPlay={true}
              songId={selectedSong.id}
              isFavorited={true}
              onFavoriteToggle={() => loadData()}
            />
          </div>
        </div>
      )}

      {/* المحتوى */}
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 py-6">
        {favoriteSongs.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.03] rounded-2xl border border-white/10">
            <FaHeart className="text-gray-600 text-6xl mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium mb-2">لا توجد أغاني مفضلة</p>
            <p className="text-gray-500 text-sm mb-4">أضف أغاني إلى المفضلة لتظهر هنا</p>
            <Link to="/songs" className="inline-block bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2 rounded-lg hover:scale-105 transition"><FaMusic className="inline mr-2" size={12} /> استكشف الأغاني</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {favoriteSongs.map((song, idx) => {
              const artist = getArtist(song.artistId);
              return (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                  className="bg-white/[0.03] rounded-2xl p-3 sm:p-4 flex items-center justify-between hover:bg-white/[0.06] transition-all duration-300 cursor-pointer border border-white/5 hover:border-red-500/40 group"
                  onClick={() => playSong(song, idx)}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                      {song.coverImage ? (
                        <img src={song.coverImage} alt={song.title} className="w-full h-full rounded-xl object-cover border border-white/10" onError={(e) => { e.target.src = 'https://via.placeholder.com/56x56/1f242d/666666?text=🎵'; }} />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-red-600/30 to-rose-600/30 flex items-center justify-center border border-white/10">
                          <FaMusic className="text-red-400 text-lg" />
                        </div>
                      )}
                      <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <FaPlay className="text-white text-sm ml-0.5" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold text-sm sm:text-base truncate group-hover:text-red-400 transition">{song.title}</h3>
                      <div className="flex items-center gap-2 sm:gap-3 text-gray-500 text-xs mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          {artist?.image ? (<img src={artist.image} className="w-4 h-4 rounded-full object-cover" alt="" />) : (<FaUser size={10} />)}
                          <span className="truncate">{artist?.name}</span>
                        </span>
                        {song.duration && <span className="hidden sm:block">🎵 {song.duration}</span>}
                        {song.year && <span className="hidden sm:block">📅 {song.year}</span>}
                        {song.genre && <span className="hidden sm:block text-gray-600">• {song.genre}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <span className="hidden sm:flex text-yellow-500 text-xs items-center gap-1 px-2 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/30">
                      <FaStar size={9} /> مفضلة
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFromFavorites(song.id); }}
                      className="p-2 rounded-lg transition bg-red-600/15 text-red-400 hover:bg-red-600 hover:text-white"
                      title="إزالة من المفضلة"
                    >
                      <FaTrash className="text-xs sm:text-sm" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); playSong(song, idx); }}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-red-600 to-rose-600 flex items-center justify-center hover:scale-110 transition shadow-lg shadow-red-600/30"
                    >
                      <FaPlay className="text-white text-xs sm:text-sm ml-0.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoriteSongsPage;