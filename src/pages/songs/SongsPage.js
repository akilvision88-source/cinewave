// src/pages/songs/SongsPage.js - نسخة معدلة لعرض الأحدث أولاً
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FaSearch, FaMusic, FaMicrophoneAlt, FaPlay, FaStar, FaTh, FaList, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { artistsAPI } from '../../services/api';

const SongsPage = () => {
  const { language } = useLanguage();
  const [artists, setArtists] = useState([]);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [viewMode, setViewMode] = useState(() => {
    const savedMode = localStorage.getItem('songs_view_mode');
    return savedMode === 'list' ? 'list' : 'grid';
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('songs_current_page');
    return savedPage ? parseInt(savedPage) : 1;
  });
  const [itemsPerPage] = useState(30);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const countryGenres = [
    { id: 'all', label: 'الكل', icon: '🌍', nameAr: 'الكل', nameEn: 'All' },
    { id: 'moroccan', label: 'أغاني مغربية', icon: '🇲🇦', nameAr: 'أغاني مغربية', nameEn: 'Moroccan Songs' },
    { id: 'egyptian', label: 'أغاني مصرية', icon: '🇪🇬', nameAr: 'أغاني مصرية', nameEn: 'Egyptian Songs' },
    { id: 'lebanese', label: 'أغاني لبنانية', icon: '🇱🇧', nameAr: 'أغاني لبنانية', nameEn: 'Lebanese Songs' },
    { id: 'gulf', label: 'أغاني خليجية', icon: '🇸🇦', nameAr: 'أغاني خليجية', nameEn: 'Gulf Songs' },
    { id: 'english', label: 'أغاني إنجليزية', icon: '🇬🇧', nameAr: 'أغاني إنجليزية', nameEn: 'English Songs' },
    { id: 'american', label: 'أغاني أمريكية', icon: '🇺🇸', nameAr: 'أغاني أمريكية', nameEn: 'American Songs' },
    { id: 'indian', label: 'أغاني هندية', icon: '🇮🇳', nameAr: 'أغاني هندية', nameEn: 'Indian Songs' },
    { id: 'turkish', label: 'أغاني تركية', icon: '🇹🇷', nameAr: 'أغاني تركية', nameEn: 'Turkish Songs' },
    { id: 'korean', label: 'أغاني كورية', icon: '🇰🇷', nameAr: 'أغاني كورية', nameEn: 'Korean Songs' },
    { id: 'french', label: 'أغاني فرنسية', icon: '🇫🇷', nameAr: 'أغاني فرنسية', nameEn: 'French Songs' },
    { id: 'spanish', label: 'أغاني إسبانية', icon: '🇪🇸', nameAr: 'أغاني إسبانية', nameEn: 'Spanish Songs' },
    { id: 'italian', label: 'أغاني إيطالية', icon: '🇮🇹', nameAr: 'أغاني إيطالية', nameEn: 'Italian Songs' },
  ];

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('songs_view_mode', mode);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    localStorage.setItem('songs_current_page', page);
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
    
    const favoriteIds = JSON.parse(localStorage.getItem('cinewave_favorite_songs') || '[]');
    setFavoriteCount(favoriteIds.length);
  }, []);

  // فلترة الفنانين
  useEffect(() => {
    let results = [...artists];
    if (searchTerm) {
      results = results.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.nameAr && a.nameAr.includes(searchTerm)) ||
        (a.nameEn && a.nameEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.country && a.country.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (selectedGenre !== 'all') {
      results = results.filter(a => a.country === selectedGenre || a.genre === selectedGenre);
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

  const getGenreLabel = (id) => {
    const genre = countryGenres.find(g => g.id === id);
    if (language === 'ar') return genre?.nameAr || genre?.label;
    return genre?.nameEn || genre?.label;
  };

  const getGenreIcon = (id) => {
    const genre = countryGenres.find(g => g.id === id);
    return genre?.icon || '🎵';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="relative h-[20vh] md:h-[25vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-black" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511671782779-c97d50d27f15?w=1920&h=400&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="relative h-full w-full px-3 sm:px-4 md:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">🎵 الأغاني</h1>
            <p className="text-gray-300 text-sm md:text-base">استمع إلى أحدث الأغاني من جميع أنحاء العالم</p>
          </div>
          <Link to="/favorite-songs" className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-xl hover:bg-yellow-500/30 transition border border-yellow-500/30">
            <FaStar className="text-yellow-400 text-base" />
            <div className="text-right">
              <p className="text-white text-xs font-semibold">المفضلة</p>
              <p className="text-yellow-400 text-[10px]">{favoriteCount} أغنية</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
              <input type="text" placeholder="بحث عن فنان أو بلد..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 pl-10 pr-3 text-white focus:outline-none focus:border-purple-500 text-sm" />
            </div>
            <div className="flex gap-2">
              <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm flex-1">
                {countryGenres.map(genre => (
                  <option key={genre.id} value={genre.id}>
                    {getGenreLabel(genre.id)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}>
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              <button onClick={() => handleViewModeChange('grid')} className={`px-3 py-1.5 rounded-md transition text-sm flex items-center gap-1 ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}><FaTh size={14} /><span className="hidden sm:inline">شبكة</span></button>
              <button onClick={() => handleViewModeChange('list')} className={`px-3 py-1.5 rounded-md transition text-sm flex items-center gap-1 ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}><FaList size={14} /><span className="hidden sm:inline">قائمة</span></button>
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-3">
          <p className="text-gray-500 text-xs">صفحة {currentPage} من {totalPages}</p>
        </div>

        {filteredArtists.length === 0 ? (
          <div className="text-center py-12">
            <FaMusic className="text-gray-700 text-5xl mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد فنانين في هذا التصنيف</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
            {currentArtists.map(artist => <ArtistCard key={artist.id} artist={artist} getGenreIcon={getGenreIcon} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {currentArtists.map(artist => <ArtistListItem key={artist.id} artist={artist} getGenreIcon={getGenreIcon} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 mt-8 mb-4">
            <button onClick={goToPrevPage} disabled={currentPage === 1} className={`p-2 rounded-lg transition ${currentPage === 1 ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-purple-600'}`}><FaChevronRight size={14} /></button>
            {getPageNumbers().map(number => (<button key={number} onClick={() => goToPage(number)} className={`w-8 h-8 rounded-lg transition text-sm ${currentPage === number ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{number}</button>))}
            <button onClick={goToNextPage} disabled={currentPage === totalPages} className={`p-2 rounded-lg transition ${currentPage === totalPages ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-purple-600'}`}><FaChevronLeft size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

const ArtistCard = ({ artist, getGenreIcon }) => {
  return (
    <Link to={`/songs/artist/${artist.id}`} className="group">
      <div className="relative bg-gray-900 rounded-xl overflow-hidden transition-transform duration-300 hover:-translate-y-2">
        <img src={artist.image} alt={artist.name} className="w-full aspect-square object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center"><FaPlay className="text-white text-sm ml-0.5" /></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
          <h3 className="text-white font-bold text-sm line-clamp-1">{artist.name}</h3>
          <div className="flex items-center gap-2 text-gray-400 text-[10px] mt-0.5">
            <span className="text-sm">{getGenreIcon(artist.country || artist.genre)}</span>
            <FaMusic className="text-[9px]" /><span>{artist.songsCount || 0} أغنية</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const ArtistListItem = ({ artist, getGenreIcon }) => {
  return (
    <Link to={`/songs/artist/${artist.id}`} className="block group">
      <div className="flex gap-3 bg-gray-900/50 rounded-lg p-2 hover:bg-gray-800 transition border border-gray-800 hover:border-purple-500/50">
        <img src={artist.image} alt={artist.name} className="w-12 h-12 rounded-full object-cover" />
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm group-hover:text-purple-500 transition">{artist.name}</h3>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 mt-1">
            <span className="flex items-center gap-1"><span className="text-sm">{getGenreIcon(artist.country || artist.genre)}</span><span>{artist.country || artist.genre}</span></span>
            <span className="flex items-center gap-1"><FaMusic className="text-[9px]" /><span>{artist.songsCount || 0} أغنية</span></span>
          </div>
          {artist.bio && <p className="text-gray-500 text-[10px] mt-1 line-clamp-1">{artist.bio}</p>}
          <div className="flex items-center gap-2 mt-2"><button className="bg-purple-600 text-white px-2 py-0.5 rounded text-[10px] hover:bg-purple-700 transition">استماع</button></div>
        </div>
      </div>
    </Link>
  );
};

export default SongsPage;