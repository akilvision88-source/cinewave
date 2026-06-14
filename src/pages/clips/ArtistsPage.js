// src/pages/clips/ArtistsPage.js - نسخة معدلة لعرض الأحدث أولاً
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FaSearch, FaMusic, FaMicrophoneAlt, FaPlay, FaStar, FaTh, FaList, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { artistsAPI, clipsAPI } from '../../services/api';

const ArtistsPage = () => {
  const { language, t } = useLanguage();
  const [artists, setArtists] = useState([]);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [favoriteClipsCount, setFavoriteClipsCount] = useState(0);
  const [viewMode, setViewMode] = useState(() => {
    const savedMode = localStorage.getItem('artists_view_mode');
    return savedMode === 'list' ? 'list' : 'grid';
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('artists_current_page');
    return savedPage ? parseInt(savedPage) : 1;
  });
  const [itemsPerPage] = useState(30);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const genres = ['all', 'pop', 'rock', 'rap', 'classical', 'jazz', 'arabic', 'indian', 'turkish'];

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('artists_view_mode', mode);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    localStorage.setItem('artists_current_page', page);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // تحميل الفنانين من API (مرتبة حسب الأحدث)
  useEffect(() => {
    const loadArtists = async () => {
      setLoading(true);
      try {
        const data = await artistsAPI.getAll();
        // ترتيب الفنانين حسب الأحدث (الأحدث أولاً)
        const sortedArtists = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setArtists(sortedArtists);
        setFilteredArtists(sortedArtists);
      } catch (error) {
        console.error('خطأ في تحميل الفنانين:', error);
        setArtists([]);
        setFilteredArtists([]);
      } finally {
        setLoading(false);
      }
    };
    loadArtists();
    
    const loadFavorites = async () => {
      try {
        const favorites = await clipsAPI.getFavorites();
        setFavoriteClipsCount(favorites.length);
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };
    loadFavorites();
  }, []);

  // فلترة الفنانين
  useEffect(() => {
    let results = [...artists];
    if (searchTerm) {
      results = results.filter(a => 
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.name_en && a.name_en.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (selectedGenre !== 'all') {
      results = results.filter(a => a.genre === selectedGenre);
    }
    setFilteredArtists(results);
    handlePageChange(1);
  }, [searchTerm, selectedGenre, artists]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentArtists = filteredArtists.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredArtists.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    handlePageChange(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisible = isMobile ? 3 : 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const getGenreLabel = (genreId) => {
    const genreMap = {
      'all': 'الكل',
      'pop': 'بوب',
      'rock': 'روك',
      'rap': 'راب',
      'classical': 'كلاسيكي',
      'jazz': 'جاز',
      'arabic': 'عربي',
      'indian': 'هندي',
      'turkish': 'تركي'
    };
    return genreMap[genreId] || genreId;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[20vh] md:h-[25vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1511671782779-c97d50d27f15?w=1920&h=400&fit=crop)', filter: 'brightness(0.3)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="relative h-full w-full px-3 sm:px-4 md:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🎵</span>
              <h1 className="text-xl md:text-2xl font-bold text-white">كليبات</h1>
            </div>
            <p className="text-gray-300 text-xs sm:text-sm">أحدث وأجمل الكليبات العربية والعالمية</p>
          </div>
          <Link to="/favorite-clips" className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-xl hover:bg-yellow-500/30 transition border border-yellow-500/30">
            <FaStar className="text-yellow-400 text-sm" />
            <div className="text-right">
              <p className="text-white text-xs font-semibold">مفضلاتي</p>
              <p className="text-yellow-400 text-[10px]">{favoriteClipsCount} كليب</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-2 mb-3">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="بحث عن فنان..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-lg py-1.5 pl-8 pr-2 text-white focus:outline-none focus:border-red-500 text-xs" />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {genres.map(genre => (
                <button key={genre} onClick={() => setSelectedGenre(genre)} className={`px-2 py-1 rounded-full text-[10px] transition whitespace-nowrap ${selectedGenre === genre ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  {getGenreLabel(genre)}
                </button>
              ))}
            </div>
          </div>
          
          <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}>
            <div className="flex gap-1 bg-gray-800 rounded-lg p-0.5">
              <button onClick={() => handleViewModeChange('grid')} className={`px-2 py-1 rounded-md transition text-xs flex items-center gap-1 ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}><FaTh size={12} /><span className="hidden sm:inline">شبكة</span></button>
              <button onClick={() => handleViewModeChange('list')} className={`px-2 py-1 rounded-md transition text-xs flex items-center gap-1 ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}><FaList size={12} /><span className="hidden sm:inline">قائمة</span></button>
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-2">
          <p className="text-gray-500 text-[10px]">صفحة {currentPage} من {totalPages}</p>
        </div>

        {filteredArtists.length === 0 ? (
          <div className="text-center py-8">
            <FaMusic className="text-gray-700 text-4xl mx-auto mb-2 opacity-50" />
            <p className="text-gray-500 text-sm">لا توجد فنانين</p>
            <p className="text-gray-500 text-xs mt-1">يمكنك إضافة فنانين من لوحة التحكم</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
            {currentArtists.map(artist => <ArtistCard key={artist.id} artist={artist} getGenreLabel={getGenreLabel} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {currentArtists.map(artist => <ArtistListItem key={artist.id} artist={artist} getGenreLabel={getGenreLabel} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 mt-6 mb-3">
            <button onClick={goToPrevPage} disabled={currentPage === 1} className={`p-1.5 rounded-lg transition ${currentPage === 1 ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-red-600'}`}><FaChevronRight size={12} /></button>
            {getPageNumbers().map(number => (<button key={number} onClick={() => goToPage(number)} className={`w-6 h-6 rounded-lg transition text-[11px] ${currentPage === number ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{number}</button>))}
            <button onClick={goToNextPage} disabled={currentPage === totalPages} className={`p-1.5 rounded-lg transition ${currentPage === totalPages ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-red-600'}`}><FaChevronLeft size={12} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

const ArtistCard = ({ artist, getGenreLabel }) => {
  return (
    <Link to={`/clips/artist/${artist.id}`} className="group">
      <div className="relative bg-gray-900 rounded-xl overflow-hidden transition-transform duration-300 hover:-translate-y-2">
        <img src={artist.image || 'https://via.placeholder.com/300x300?text=Artist'} alt={artist.name} className="w-full aspect-square object-cover group-hover:scale-105 transition duration-500" loading="lazy" onError={(e) => { e.target.src = 'https://via.placeholder.com/300x300?text=Artist'; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center"><FaPlay className="text-white text-sm ml-0.5" /></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
          <h3 className="text-white font-bold text-sm line-clamp-1">{artist.name}</h3>
          <div className="flex items-center gap-2 text-gray-400 text-[10px] mt-0.5">
            <FaMusic className="text-[9px]" /><span>{artist.clips_count || 0} كليب</span>
            <FaMicrophoneAlt className="text-[9px] ml-1" /><span>{getGenreLabel(artist.genre)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const ArtistListItem = ({ artist, getGenreLabel }) => {
  return (
    <Link to={`/clips/artist/${artist.id}`} className="block group">
      <div className="flex gap-3 bg-gray-900/50 rounded-lg p-2 hover:bg-gray-800 transition border border-gray-800 hover:border-red-500/50">
        <img src={artist.image || 'https://via.placeholder.com/48x48?text=Artist'} alt={artist.name} className="w-12 h-12 rounded-full object-cover" onError={(e) => { e.target.src = 'https://via.placeholder.com/48x48?text=Artist'; }} />
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm group-hover:text-red-500 transition">{artist.name}</h3>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 mt-1">
            <span className="flex items-center gap-1"><FaMusic className="text-[9px]" /><span>{artist.clips_count || 0} كليب</span></span>
            <span className="flex items-center gap-1"><FaMicrophoneAlt className="text-[9px]" /><span>{getGenreLabel(artist.genre)}</span></span>
          </div>
          {artist.bio && <p className="text-gray-500 text-[10px] mt-1 line-clamp-1">{artist.bio}</p>}
          <div className="flex items-center gap-2 mt-2"><button className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] hover:bg-red-700 transition">مشاهدة الكليبات</button></div>
        </div>
      </div>
    </Link>
  );
};

export default ArtistsPage;