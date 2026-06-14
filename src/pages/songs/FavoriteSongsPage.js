import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FaPlay, FaStar, FaTrash, FaMusic, FaUser } from 'react-icons/fa';
import AudioPlayerPro from '../../components/AudioPlayerPro';
import { songsAPI, artistsAPI } from '../../services/api';

const FavoriteSongsPage = () => {
  const { language, t } = useLanguage();
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [songsData, artistsData] = await Promise.all([
        songsAPI.getFavorites(),
        artistsAPI.getAll()
      ]);
      setFavoriteSongs(songsData);
      setArtists(artistsData);
    } catch (error) {
      console.error('خطأ في تحميل الأغاني المفضلة:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (songId) => {
    try {
      await songsAPI.toggleFavorite(songId);
      await loadData();
      
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-fadeIn';
      toast.textContent = t('songs.removedFromFavorites');
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } catch (error) {
      console.error('خطأ في إزالة من المفضلة:', error);
    }
  };

  const getArtist = (artistId) => {
    return artists.find(a => a.id === artistId);
  };

  const playSong = (song, index) => {
    setSelectedSong(song);
    setCurrentIndex(index);
    setShowPlayer(true);
  };

  const nextSong = () => {
    if (favoriteSongs.length === 0) return;
    const nextIndex = (currentIndex + 1) % favoriteSongs.length;
    setSelectedSong(favoriteSongs[nextIndex]);
    setCurrentIndex(nextIndex);
  };

  const prevSong = () => {
    if (favoriteSongs.length === 0) return;
    const prevIndex = (currentIndex - 1 + favoriteSongs.length) % favoriteSongs.length;
    setSelectedSong(favoriteSongs[prevIndex]);
    setCurrentIndex(prevIndex);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="relative h-[30vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-pink-900/30" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511671782779-c97d50d27f15?w=1920&h=300&fit=crop')] bg-cover bg-center opacity-30" />
        <div className="relative h-full container-custom flex flex-col justify-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-3 flex items-center gap-3">
            <FaStar className="text-yellow-500" /> {t('songs.favoriteSongs')}
          </h1>
          <p className="text-gray-300 text-lg">{favoriteSongs.length} {t('songs.songsInList')}</p>
        </div>
      </div>

      {showPlayer && selectedSong && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <button onClick={() => setShowPlayer(false)} className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-red-600 transition">
              ✕
            </button>
            <AudioPlayerPro
              song={selectedSong}
              artist={getArtist(selectedSong.artistId)}
              playlist={favoriteSongs}
              onPlaylistItemClick={(item) => {
                const index = favoriteSongs.findIndex(s => s.id === item.id);
                setSelectedSong(item);
                setCurrentIndex(index);
              }}
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

      <div className="container-custom py-8">
        {favoriteSongs.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/50 rounded-2xl">
            <FaStar className="text-6xl text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">{t('songs.noFavoriteSongs')}</h2>
            <p className="text-gray-400 mb-6">{t('songs.addSongsToFavorites')}</p>
            <Link to="/songs" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition inline-flex items-center gap-2">
              <FaMusic /> {t('songs.exploreSongs')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {favoriteSongs.map((song, idx) => {
              const artist = getArtist(song.artistId);
              return (
                <div key={song.id} className="bg-gray-900/50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-800 transition cursor-pointer" onClick={() => playSong(song, idx)}>
                  <div className="flex items-center gap-4">
                    {song.coverImage ? (
                      <img src={song.coverImage} alt={song.title} className="w-14 h-14 rounded object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded bg-purple-600/20 flex items-center justify-center">
                        <FaMusic className="text-purple-400 text-2xl" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-white font-semibold text-lg">{song.title}</h3>
                      <div className="flex items-center gap-3 text-gray-500 text-sm mt-1">
                        <span className="flex items-center gap-1">
                          {artist?.image ? (
                            <img src={artist.image} className="w-4 h-4 rounded-full" alt="" />
                          ) : (
                            <FaUser className="text-xs" />
                          )}
                          {artist?.name}
                        </span>
                        <span>🎵 {song.duration}</span>
                        <span>📅 {song.year}</span>
                        <span>🎸 {song.genre}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-500 text-sm flex items-center gap-1">
                      <FaStar /> {t('songs.favorite')}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); removeFromFavorites(song.id); }} className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 transition" title={t('songs.removeFromFavorites')}>
                      <FaTrash />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center hover:bg-purple-700 transition">
                      <FaPlay className="text-white text-sm ml-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

export default FavoriteSongsPage;