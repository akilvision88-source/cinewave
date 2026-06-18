// src/pages/songs/ArtistSongsPage.js - نسخة كاملة مع الاتصال بقاعدة البيانات
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import AudioPlayerPro from '../../components/AudioPlayerPro';
import { artistsAPI, songsAPI, watchlistAPI } from '../../services/api';
import { FaArrowLeft, FaPlay, FaClock, FaCalendarAlt, FaMicrophoneAlt, FaStar, FaRegStar, FaList } from 'react-icons/fa';

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

  // ========== التحقق من حالة تسجيل الدخول ==========
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!token || !!user);
  }, []);

  // ========== تحميل البيانات ==========
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [artistData, songsData] = await Promise.all([
          artistsAPI.getById(artistId),
          songsAPI.getByArtist(artistId)
        ]);
        setArtist(artistData);
        setSongs(songsData);
        if (songsData.length > 0) {
          setCurrentSong(songsData[0]);
        }
      } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
    const favorites = JSON.parse(localStorage.getItem('cinewave_favorite_songs') || '[]');
    setFavoriteSongs(favorites);
  }, [artistId]);

  // ========== دالة عرض الإشعار ==========
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 animate-fadeIn ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  // ========== التحقق من وجود الأغنية في المفضلة ==========
  const isSongFavorited = (songId) => {
    return favoriteSongs.includes(songId);
  };

  // ========== تبديل المفضلة ==========
  const toggleFavorite = async (songId, e) => {
    e.stopPropagation();
    
    try {
      const data = await songsAPI.toggleFavorite(songId);
      setFavoriteSongs(data.favorites);
      localStorage.setItem('cinewave_favorite_songs', JSON.stringify(data.favorites));
      
      const message = favoriteSongs.includes(songId) ? t('songs.removedFromFavorites') : t('songs.addedToFavorites');
      showToast(message);
    } catch (error) {
      console.error('خطأ في تحديث المفضلة:', error);
      showToast('❌ حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
    }
  };

  // ========== إضافة/إزالة من قائمة المشاهدة ==========
  const toggleWatchlist = async (song, e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    
    if (isToggling) return;
    setIsToggling(true);
    
    try {
      const itemId = song.id;
      const itemType = 'song';
      
      // التحقق من وجود الأغنية في القائمة
      const result = await watchlistAPI.isInWatchlist(itemId, itemType);
      
      if (result.exists) {
        await watchlistAPI.removeFromWatchlist(itemId, itemType);
        showToast('✅ تم إزالة الأغنية من قائمة المشاهدة');
      } else {
        await watchlistAPI.addToWatchlist(itemId, itemType);
        showToast('✅ تم إضافة الأغنية إلى قائمة المشاهدة');
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث قائمة المشاهدة:', error);
      showToast('❌ حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  // ========== تشغيل الأغنية ==========
  const playSong = (song, index) => {
    setCurrentSong(song);
    setCurrentIndex(index);
    setShowPlayer(true);
  };

  // ========== الأغنية التالية ==========
  const nextSong = () => {
    if (songs.length === 0) return;
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSong(songs[nextIndex]);
    setCurrentIndex(nextIndex);
  };

  // ========== الأغنية السابقة ==========
  const prevSong = () => {
    if (songs.length === 0) return;
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentSong(songs[prevIndex]);
    setCurrentIndex(prevIndex);
  };

  // ========== LOADING ==========
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // ========== ARTIST NOT FOUND ==========
  if (!artist) {
    return (
      <div className="flex justify-center items-center h-screen text-white bg-black">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">الفنان غير موجود</h2>
          <Link to="/songs" className="text-purple-400 hover:text-purple-300">العودة إلى الأغاني</Link>
        </div>
      </div>
    );
  }

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-black">
      {/* ====== HEADER ====== */}
      <div className="relative h-[30vh] overflow-hidden">
        <img 
          src={artist.image} 
          alt={artist.name} 
          className="w-full h-full object-cover filter brightness-50" 
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/800x400/1a1a2e/ffffff?text=🎵';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <Link to="/songs" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition">
            <FaArrowLeft /> {t('common.backToArtists')}
          </Link>
          <div className="flex items-center gap-4 justify-between flex-wrap">
            <div className="flex items-center gap-4">
              <img 
                src={artist.image} 
                alt={artist.name} 
                className="w-24 h-24 rounded-2xl object-cover border-4 border-purple-500" 
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/96x96/1a1a2e/ffffff?text=🎵';
                }}
              />
              <div>
                <h1 className="text-4xl font-bold text-white">{artist.name}</h1>
                <p className="text-gray-400 mt-1">{artist.genre} • {songs.length} {t('songs.songs')}</p>
                <p className="text-gray-500 text-sm mt-2 max-w-2xl">{artist.bio}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/favorite-songs" className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition">
                <FaStar className="text-yellow-400" />
                <span className="hidden sm:inline">{t('songs.favorites')}</span>
                <span className="bg-yellow-500/30 px-1.5 py-0.5 rounded-full text-xs">{favoriteSongs.length}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ====== PLAYER ====== */}
      {showPlayer && currentSong && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl relative">
            <button onClick={() => setShowPlayer(false)} className="absolute top-0 right-0 text-white bg-black/50 p-2 rounded-full hover:bg-red-600 transition z-10">
              ✕
            </button>
            <AudioPlayerPro
              song={currentSong}
              artist={artist}
              playlist={songs}
              onPlaylistItemClick={(item) => {
                const index = songs.findIndex(s => s.id === item.id);
                setCurrentSong(item);
                setCurrentIndex(index);
              }}
              onNext={nextSong}
              onPrev={prevSong}
              autoPlay={true}
              songId={currentSong.id}
              isFavorited={isSongFavorited(currentSong.id)}
              onFavoriteToggle={() => {
                setFavoriteSongs(JSON.parse(localStorage.getItem('cinewave_favorite_songs') || '[]'));
              }}
            />
          </div>
        </div>
      )}

      {/* ====== SONGS LIST ====== */}
      <div className="container-custom py-8 px-4 sm:px-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">🎵 {t('songs.allSongs')}</h2>
          <span className="text-gray-500 text-sm">{songs.length} أغنية</span>
        </div>
        
        <div className="space-y-3">
          {songs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">{t('songs.noSongs')}</div>
          ) : (
            songs.map((song, idx) => {
              const isFav = isSongFavorited(song.id);
              return (
                <div 
                  key={song.id} 
                  className="bg-gray-900/50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-800 transition cursor-pointer" 
                  onClick={() => playSong(song, idx)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <img 
                      src={song.cover_image || song.coverImage} 
                      alt={song.title} 
                      className="w-12 h-12 rounded object-cover flex-shrink-0" 
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/48x48/1a1a2e/ffffff?text=🎵';
                      }}
                    />
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold truncate">{song.title || song.title_ar}</h3>
                      <div className="flex items-center gap-3 text-gray-500 text-xs mt-1 flex-wrap">
                        {song.duration && <span className="flex items-center gap-1"><FaClock /> {song.duration}</span>}
                        {song.year && <span className="flex items-center gap-1"><FaCalendarAlt /> {song.year}</span>}
                        {song.genre && <span className="flex items-center gap-1"><FaMicrophoneAlt /> {song.genre}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-gray-500 text-xs hidden sm:inline">{song.plays?.toLocaleString()} {t('songs.plays')}</span>
                    
                    {/* ✅ زر إضافة إلى قائمة المشاهدة */}
                    <button 
                      onClick={(e) => toggleWatchlist(song, e)} 
                      disabled={isToggling}
                      className="p-2 rounded-lg transition bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 disabled:opacity-50"
                      title="إضافة إلى قائمتي"
                    >
                      <FaList className="text-sm" />
                    </button>
                    
                    <button 
                      onClick={(e) => toggleFavorite(song.id, e)} 
                      className={`p-2 rounded-lg transition ${isFav ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`} 
                      title={isFav ? t('songs.removeFromFavorites') : t('songs.addToFavorites')}
                    >
                      {isFav ? <FaStar className="text-yellow-400" /> : <FaRegStar />}
                    </button>
                    
                    <button 
                      className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center hover:bg-purple-700 transition flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); playSong(song, idx); }}
                    >
                      <FaPlay className="text-white text-sm ml-0.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
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

export default ArtistSongsPage;