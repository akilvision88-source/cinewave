// src/pages/songs/ArtistSongsPage.js - أغاني الفنان بنفس النمط الموحّد
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import AudioPlayerPro from '../../components/AudioPlayerPro';
import { artistsAPI, songsAPI, watchlistAPI } from '../../services/api';
import { FaArrowLeft, FaPlay, FaClock, FaCalendarAlt, FaMicrophoneAlt, FaStar, FaRegStar, FaList, FaMusic } from 'react-icons/fa';
import { motion } from 'framer-motion';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ArtistSongsPage = () => {
  const { artistId } = useParams();
  const { language, t } = useLanguage();
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!token || !!user);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [artistData, songsData] = await Promise.all([
          artistsAPI.getById(artistId),
          songsAPI.getByArtist(artistId),
        ]);
        setArtist(artistData);
        setSongs(songsData);
        if (songsData.length > 0) setCurrentSong(songsData[0]);
      } catch (error) { console.error('خطأ:', error); }
      finally { setLoading(false); }
    };
    loadData();
    const favorites = JSON.parse(localStorage.getItem('cinewave_favorite_songs') || '[]');
    setFavoriteSongs(favorites);
  }, [artistId]);

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-24 left-1/2 -translate-x-1/2 z-50 text-white px-4 py-2 rounded-full shadow-lg text-sm ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  const isSongFavorited = (songId) => favoriteSongs.includes(songId);

  const toggleFavorite = async (songId, e) => {
    e.stopPropagation();
    try {
      const data = await songsAPI.toggleFavorite(songId);
      setFavoriteSongs(data.favorites);
      localStorage.setItem('cinewave_favorite_songs', JSON.stringify(data.favorites));
      showToast(favoriteSongs.includes(songId) ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة إلى المفضلة');
    } catch (error) {
      console.error('خطأ:', error);
      showToast('❌ حدث خطأ', 'error');
    }
  };

  const toggleWatchlist = async (song, e) => {
    e.stopPropagation();
    if (!isAuthenticated) { window.location.href = '/login'; return; }
    if (isToggling) return;
    setIsToggling(true);
    try {
      const result = await watchlistAPI.isInWatchlist(song.id, 'song');
      if (result.exists) {
        await watchlistAPI.removeFromWatchlist(song.id, 'song');
        showToast('✅ تمت الإزالة من قائمة المشاهدة');
      } else {
        await watchlistAPI.addToWatchlist(song.id, 'song');
        showToast('✅ تمت الإضافة إلى قائمة المشاهدة');
      }
    } catch (error) {
      console.error('خطأ:', error);
      showToast('❌ حدث خطأ', 'error');
    } finally { setIsToggling(false); }
  };

  const playSong = (song, index) => { setCurrentSong(song); setCurrentIndex(index); setShowPlayer(true); };
  const nextSong = () => { if (songs.length === 0) return; const n = (currentIndex + 1) % songs.length; setCurrentSong(songs[n]); setCurrentIndex(n); };
  const prevSong = () => { if (songs.length === 0) return; const p = (currentIndex - 1 + songs.length) % songs.length; setCurrentSong(songs[p]); setCurrentIndex(p); };

  if (loading) return <div className="flex justify-center items-center h-screen bg-[#1f242d]"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!artist) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1f242d]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">الفنان غير موجود</h2>
          <Link to="/songs" className="text-red-400 hover:text-red-300">العودة إلى الأغاني</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f242d] relative">
      {/* Hero */}
      <div className="relative h-[35vh] md:h-[45vh] w-full overflow-hidden bg-[#0d1015]">
        <img src={artist.image} alt={artist.name} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.target.src = 'https://via.placeholder.com/1920x600/1f242d/666666?text=Artist'; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f242d] via-[#1f242d]/70 to-[#0d1015]/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1015]/85 via-[#0d1015]/50 to-transparent" />

        <div className="relative h-full w-full px-4 sm:px-6 md:px-8 lg:px-12 flex items-end pb-6 md:pb-10">
          <div className="w-full max-w-6xl mx-auto">
            <Link to="/songs" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition text-sm"><FaArrowLeft /> العودة إلى الفنانين</Link>
            <div className="flex items-center gap-4 sm:gap-6">
              <img src={artist.image} alt={artist.name} className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-2xl object-cover border-2 border-red-500/50 shadow-2xl" onError={(e) => { e.target.src = 'https://via.placeholder.com/128x128/1f242d/666666?text=🎵'; }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎤</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold">فنان</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-2 leading-tight drop-shadow-2xl line-clamp-1">{artist.name}</h1>
                <div className="w-16 h-0.5 bg-gradient-to-r from-red-600 to-transparent rounded-full mb-2" />
                <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 max-w-2xl">{artist.genre || 'موسيقى'} • {songs.length} أغنية</p>
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

      {/* المشغل */}
      {showPlayer && currentSong && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl relative">
            <button onClick={() => setShowPlayer(false)} className="absolute top-0 right-0 text-white bg-black/50 p-2 rounded-full hover:bg-red-600 transition z-10">✕</button>
            <AudioPlayerPro
              song={currentSong}
              artist={artist}
              playlist={songs}
              onPlaylistItemClick={(item) => { const i = songs.findIndex(s => s.id === item.id); setCurrentSong(item); setCurrentIndex(i); }}
              onNext={nextSong}
              onPrev={prevSong}
              autoPlay={true}
              songId={currentSong.id}
              isFavorited={isSongFavorited(currentSong.id)}
              onFavoriteToggle={() => { setFavoriteSongs(JSON.parse(localStorage.getItem('cinewave_favorite_songs') || '[]')); }}
            />
          </div>
        </div>
      )}

      {/* قائمة الأغاني */}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center"><FaMusic className="text-red-500" /></div>
          <div>
            <h2 className="text-white text-xl font-bold flex items-center gap-2">🎵 كل الأغاني <span className="text-gray-500 text-sm font-normal">({songs.length})</span></h2>
            <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-transparent rounded-full mt-1" />
          </div>
        </div>

        {songs.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.03] rounded-2xl border border-white/10">
            <FaMusic className="text-gray-600 text-6xl mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium">لا توجد أغاني</p>
          </div>
        ) : (
          <div className="space-y-3">
            {songs.map((song, idx) => {
              const isFav = isSongFavorited(song.id);
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
                      <img src={song.cover_image || song.coverImage || artist.image} alt={song.title} className="w-full h-full rounded-xl object-cover border border-white/10" onError={(e) => { e.target.src = 'https://via.placeholder.com/56x56/1f242d/666666?text=🎵'; }} />
                      <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <FaPlay className="text-white text-sm ml-0.5" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold text-sm sm:text-base truncate group-hover:text-red-400 transition">{song.title || song.title_ar}</h3>
                      <div className="flex items-center gap-2 sm:gap-3 text-gray-500 text-xs mt-1 flex-wrap">
                        {song.duration && <span className="flex items-center gap-1"><FaClock size={10} /> {song.duration}</span>}
                        {song.year && <span className="flex items-center gap-1"><FaCalendarAlt size={10} /> {song.year}</span>}
                        {song.genre && <span className="flex items-center gap-1 hidden sm:flex"><FaMicrophoneAlt size={10} /> {song.genre}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <button onClick={(e) => toggleWatchlist(song, e)} disabled={isToggling} className="p-2 rounded-lg transition bg-purple-600/15 text-purple-400 hover:bg-purple-600/30 disabled:opacity-50" title="إضافة إلى قائمتي">
                      <FaList className="text-xs sm:text-sm" />
                    </button>
                    <button onClick={(e) => toggleFavorite(song.id, e)} className={`p-2 rounded-lg transition ${isFav ? 'bg-yellow-500/15 text-yellow-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`} title={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}>
                      {isFav ? <FaStar className="text-xs sm:text-sm" /> : <FaRegStar className="text-xs sm:text-sm" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); playSong(song, idx); }} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-red-600 to-rose-600 flex items-center justify-center hover:scale-110 transition shadow-lg shadow-red-600/30">
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

export default ArtistSongsPage;