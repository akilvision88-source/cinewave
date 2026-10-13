// src/pages/clips/ArtistsPage.js - كل الفنانين (كليبات) بنفس النمط الموحّد
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  FaSearch, FaMusic, FaMicrophoneAlt, FaPlay, FaStar,
  FaTh, FaList, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { artistsAPI } from '../../services/api';

const ArtistsPage = () => {
  const { language } = useLanguage();

  const HEADER_IMAGE = 'https://images.unsplash.com/photo-1511671782779-c97d50d27f15?w=1920&h=400&fit=crop';

  const [artists, setArtists] = useState([]);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [favoriteClipsCount, setFavoriteClipsCount] = useState(0);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('artists_view_mode') === 'list' ? 'list' : 'grid');
  const [currentPage, setCurrentPage] = useState(() => parseInt(localStorage.getItem('artists_current_page')) || 1);
  const [itemsPerPage] = useState(30);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const genres = ['all', 'pop', 'rock', 'rap', 'classical', 'jazz', 'arabic', 'indian', 'turkish'];

  const handleViewModeChange = (mode) => { setViewMode(mode); localStorage.setItem('artists_view_mode', mode); };
  const handlePageChange = (page) => { setCurrentPage(page); localStorage.setItem('artists_current_page', page); };

  const updateFavoriteCount = useCallback(() => {
    const saved = localStorage.getItem('cinewave_favorite_clips');
    setFavoriteClipsCount(saved ? JSON.parse(saved).length : 0);
  }, []);

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);

  useEffect(() => {
    const loadArtists = async () => {
      setLoading(true);
      try {
        const data = await artistsAPI.getAll();
        const sorted = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setArtists(sorted);
        setFilteredArtists(sorted);
      } catch (error) {
        console.error('خطأ:', error);
        setArtists([]); setFilteredArtists([]);
      } finally { setLoading(false); }
    };
    loadArtists();
    updateFavoriteCount();

    const handleStorage = (e) => { if (e.key === 'cinewave_favorite_clips') updateFavoriteCount(); };
    const handleFavoritesUpdate = () => updateFavoriteCount();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    const interval = setInterval(updateFavoriteCount, 3000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
      clearInterval(interval);
    };
  }, [updateFavoriteCount]);

  useEffect(() => {
    let results = [...artists];
    if (searchTerm) {
      results = results.filter(a =>
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.name_en && a.name_en.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (selectedGenre !== 'all') results = results.filter(a => a.genre === selectedGenre);
    setFilteredArtists(results);
    handlePageChange(1);
  }, [searchTerm, selectedGenre, artists]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentArtists = filteredArtists.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredArtists.length / itemsPerPage);

  const goTo = (p) => { handlePageChange(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goNext = () => { if (currentPage < totalPages) { handlePageChange(currentPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const goPrev = () => { if (currentPage > 1) { handlePageChange(currentPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const getPages = () => { const a = []; const mv = isMobile ? 3 : 5; let s = Math.max(1, currentPage - Math.floor(mv / 2)); let e = Math.min(totalPages, s + mv - 1); if (e - s + 1 < mv) s = Math.max(1, e - mv + 1); for (let i = s; i <= e; i++) a.push(i); return a; };

  const getGenreLabel = (g) => {
    const map = { all: 'الكل', pop: 'بوب', rock: 'روك', rap: 'راب', classical: 'كلاسيكي', jazz: 'جاز', arabic: 'عربي', indian: 'هندي', turkish: 'تركي' };
    return map[g] || g;
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-[#1f242d]"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#1f242d] relative">
      {/* Hero */}
      <div className="relative h-[22vh] md:h-[28vh] w-full overflow-hidden bg-[#0d1015]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HEADER_IMAGE})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f242d]/70 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1015]/85 via-[#0d1015]/50 to-[#0d1015]/85" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1015]/50 via-transparent to-transparent" />

        <div className="relative h-full w-full px-4 sm:px-8 md:px-12 lg:px-16 flex flex-col items-center justify-center text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center"><FaMusic className="text-red-500 text-lg sm:text-xl" /></div>
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-br from-white via-rose-100 to-red-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(220,38,38,0.5)]">الكليبات</h1>
            </div>
            <div className="w-20 sm:w-28 h-0.5 sm:h-1 rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent mb-2 sm:mb-3 shadow-lg shadow-red-500/50" />
            <p className="text-gray-200 text-xs xs:text-sm sm:text-base max-w-xl leading-relaxed drop-shadow-lg">أحدث وأجمل الكليبات العربية والعالمية</p>
          </motion.div>
        </div>
      </div>

      {/* فاصل أبيض */}
      <div className="relative w-full flex items-center justify-center py-4">
        <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/70 shadow-lg shadow-white/40" />
      </div>

      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 py-6">
        {/* زر المفضلة */}
        <div className="flex justify-end mb-4">
          <Link to="/favorite-clips" className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/15 text-yellow-400 rounded-xl hover:bg-yellow-500/25 transition border border-yellow-500/30">
            <FaStar className="text-yellow-400" />
            <div className="text-right">
              <p className="text-white text-xs font-bold">مفضلاتي</p>
              <p className="text-yellow-400 text-[10px]">{favoriteClipsCount} كليب</p>
            </div>
          </Link>
        </div>

        {/* الفلاتر */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
                <input type="text" placeholder="ابحث عن فنان..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#21262d] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white focus:outline-none focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 text-sm transition-all" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {genres.map(g => (
                <button key={g} onClick={() => setSelectedGenre(g)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${selectedGenre === g ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/40 scale-105' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'}`}>
                  {getGenreLabel(g)}
                </button>
              ))}
            </div>
            <div className={`flex ${isMobile ? 'justify-center' : 'justify-between'} items-center`}>
              <p className="text-gray-400 text-sm hidden sm:block"><span className="text-white font-semibold">{filteredArtists.length}</span> فنان</p>
              <div className="flex gap-1 bg-[#21262d] rounded-xl p-1 border border-white/10">
                <button onClick={() => handleViewModeChange('grid')} className={`px-4 py-2 rounded-lg transition-all duration-300 text-sm flex items-center gap-2 ${viewMode === 'grid' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><FaTh size={14} /><span className="hidden sm:inline font-medium">شبكة</span></button>
                <button onClick={() => handleViewModeChange('list')} className={`px-4 py-2 rounded-lg transition-all duration-300 text-sm flex items-center gap-2 ${viewMode === 'list' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><FaList size={14} /><span className="hidden sm:inline font-medium">قائمة</span></button>
              </div>
            </div>
          </div>
        </div>

        {filteredArtists.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.03] rounded-2xl border border-white/10">
            <FaMusic className="text-gray-600 text-6xl mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium">لا توجد فنانين</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
            {currentArtists.map(artist => <ArtistCard key={artist.id} artist={artist} getGenreLabel={getGenreLabel} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {currentArtists.map(artist => <ArtistListItem key={artist.id} artist={artist} getGenreLabel={getGenreLabel} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10 mb-6">
            <button onClick={goPrev} disabled={currentPage === 1} className={`p-2.5 rounded-xl transition-all duration-300 ${currentPage === 1 ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5' : 'bg-white/5 text-white hover:bg-red-600 border border-white/10 hover:border-red-500'}`}><FaChevronRight size={14} /></button>
            {getPages().map(n => (<button key={n} onClick={() => goTo(n)} className={`w-10 h-10 rounded-xl transition-all duration-300 text-sm font-medium ${currentPage === n ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/40 scale-105' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'}`}>{n}</button>))}
            <button onClick={goNext} disabled={currentPage === totalPages} className={`p-2.5 rounded-xl transition-all duration-300 ${currentPage === totalPages ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5' : 'bg-white/5 text-white hover:bg-red-600 border border-white/10 hover:border-red-500'}`}><FaChevronLeft size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

const ArtistCard = ({ artist, getGenreLabel }) => (
  <Link to={`/clips/artist/${artist.id}`} className="group block">
    <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#151515] border border-white/5 hover:border-red-500/40 shadow-lg shadow-black/40 transition-all duration-500 hover:-translate-y-1">
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={artist.image || 'https://via.placeholder.com/300x375/1f242d/666666?text=Artist'}
          alt={artist.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/300x375/1f242d/666666?text=Artist'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-red-500/50 blur-xl scale-150 animate-pulse" />
            <div className="relative w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-500">
              <FaPlay className="text-white text-lg ml-0.5" />
            </div>
          </div>
        </div>

        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center gap-1">
          <FaMusic className="text-red-400 text-[9px]" />
          <span className="text-white text-[9px] font-bold">{artist.songs_count || 0}</span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-red-300 transition">{artist.name}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <FaMicrophoneAlt className="text-red-300 text-[10px]" />
            <span className="text-gray-300 text-[10px] line-clamp-1">{getGenreLabel(artist.genre) || ''}</span>
          </div>
        </div>
      </div>
    </div>
  </Link>
);

const ArtistListItem = ({ artist, getGenreLabel }) => (
  <Link to={`/clips/artist/${artist.id}`} className="block group">
    <div className="flex gap-4 bg-white/[0.03] rounded-2xl p-3 hover:bg-white/[0.06] transition-all duration-300 border border-white/5 hover:border-red-500/40">
      <div className="relative w-16 h-16 flex-shrink-0">
        <img src={artist.image || 'https://via.placeholder.com/64x64/1f242d/666666?text=🎵'} alt={artist.name} className="w-full h-full rounded-xl object-cover border border-white/10" onError={(e) => { e.target.src = 'https://via.placeholder.com/64x64/1f242d/666666?text=🎵'; }} />
        <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <FaPlay className="text-white text-sm" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold text-sm group-hover:text-red-400 transition line-clamp-1">{artist.name}</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1.5">
          <span className="flex items-center gap-1"><FaMusic className="text-[9px]" /><span>{artist.songs_count || 0} كليب</span></span>
          <span className="flex items-center gap-1"><FaMicrophoneAlt className="text-[9px]" /><span>{getGenreLabel(artist.genre)}</span></span>
        </div>
        {artist.bio && <p className="text-gray-500 text-xs mt-1 line-clamp-1">{artist.bio}</p>}
      </div>
    </div>
  </Link>
);

export default ArtistsPage;