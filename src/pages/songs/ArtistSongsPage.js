import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import AudioPlayerPro from '../../components/AudioPlayerPro';
import { artistsAPI, songsAPI } from '../../services/api';
import { FaArrowLeft, FaPlay, FaClock, FaCalendarAlt, FaMicrophoneAlt, FaStar, FaRegStar } from 'react-icons/fa';

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

  const isSongFavorited = (songId) => {
    return favoriteSongs.includes(songId);
  };

  const toggleFavorite = async (songId, e) => {
    e.stopPropagation();
    
    try {
      const data = await songsAPI.toggleFavorite(songId);
      setFavoriteSongs(data.favorites);
      localStorage.setItem('cinewave_favorite_songs', JSON.stringify(data.favorites));
      
      const message = favoriteSongs.includes(songId) ? t('songs.removedFromFavorites') : t('songs.addedToFavorites');
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-fadeIn';
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } catch (error) {
      console.error('خطأ في تحديث المفضلة:', error);
    }
  };

  const playSong = (song, index) => {
    setCurrentSong(song);
    setCurrentIndex(index);
    setShowPlayer(true);
  };

  const nextSong = () => {
    if (songs.length === 0) return;
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSong(songs[nextIndex]);
    setCurrentIndex(nextIndex);
  };

  const prevSong = () => {
    if (songs.length === 0) return;
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentSong(songs[prevIndex]);
    setCurrentIndex(prevIndex);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!artist) {
    return (
      <div className="flex justify-center items-center h-screen text-white">
        {t('common.notFound')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="relative h-[30vh] overflow-hidden">
        <img src={artist.image} alt={artist.name} className="w-full h-full object-cover filter brightness-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <Link to="/songs" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4">
            <FaArrowLeft /> {t('common.backToArtists')}
          </Link>
          <div className="flex items-center gap-4 justify-between flex-wrap">
            <div className="flex items-center gap-4">
              <img src={artist.image} alt={artist.name} className="w-24 h-24 rounded-2xl object-cover border-4 border-purple-500" />
              <div>
                <h1 className="text-4xl font-bold text-white">{artist.name}</h1>
                <p className="text-gray-400 mt-1">{artist.genre} • {artist.songsCount} {t('songs.songs')}</p>
                <p className="text-gray-500 text-sm mt-2 max-w-2xl">{artist.bio}</p>
              </div>
            </div>
            <Link to="/favorite-songs" className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition">
              <FaStar className="text-yellow-400" />
              <span className="hidden sm:inline">{t('songs.favorites')}</span>
              <span className="bg-yellow-500/30 px-1.5 py-0.5 rounded-full text-xs">{favoriteSongs.length}</span>
            </Link>
          </div>
        </div>
      </div>

      {showPlayer && currentSong && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <button onClick={() => setShowPlayer(false)} className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-red-600 transition">
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

      <div className="container-custom py-8">
        <h2 className="text-2xl font-bold text-white mb-6">🎵 {t('songs.allSongs')}</h2>
        <div className="space-y-3">
          {songs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">{t('songs.noSongs')}</div>
          ) : (
            songs.map((song, idx) => {
              const isFav = isSongFavorited(song.id);
              return (
                <div key={song.id} className="bg-gray-900/50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-800 transition cursor-pointer" onClick={() => playSong(song, idx)}>
                  <div className="flex items-center gap-4">
                    <img src={song.coverImage} alt={song.title} className="w-12 h-12 rounded object-cover" />
                    <div>
                      <h3 className="text-white font-semibold">{song.title}</h3>
                      <div className="flex items-center gap-3 text-gray-500 text-xs mt-1">
                        <span className="flex items-center gap-1"><FaClock /> {song.duration}</span>
                        <span className="flex items-center gap-1"><FaCalendarAlt /> {song.year}</span>
                        <span className="flex items-center gap-1"><FaMicrophoneAlt /> {song.genre}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm">{song.plays?.toLocaleString()} {t('songs.plays')}</span>
                    <button onClick={(e) => toggleFavorite(song.id, e)} className={`p-2 rounded-lg transition ${isFav ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`} title={isFav ? t('songs.removeFromFavorites') : t('songs.addToFavorites')}>
                      {isFav ? <FaStar className="text-yellow-400" /> : <FaRegStar />}
                    </button>
                    <button className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center hover:bg-purple-700 transition">
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