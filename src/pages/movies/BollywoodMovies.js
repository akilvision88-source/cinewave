// src/pages/movies/BollywoodMovies.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FaStar, FaSearch, FaFilm, FaClock, FaCalendarAlt, FaTh, FaList, FaHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { moviesAPI } from '../../services/api';

const BollywoodMovies = () => {
  const { language, t } = useLanguage();
  const location = useLocation();
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [viewMode, setViewMode] = useState(() => {
    const savedMode = localStorage.getItem('bollywood_view_mode');
    return savedMode === 'list' ? 'list' : 'grid';
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('bollywood_current_page');
    return savedPage ? parseInt(savedPage) : 1;
  });
  // ✅ تغيير عدد الأفلام في الصفحة إلى 40
  const [itemsPerPage] = useState(40);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ========== تصنيفات الأفلام (الشريط العلوي) ==========
  const categories = [
    { id: 'all', name: 'الكل', nameEn: 'All', icon: '🎬', path: '/movies' },
    { id: 'arabwood', name: 'أفلام عربية', nameEn: 'Arabwood', icon: '🇸🇦', path: '/movies/arabwood' },
    { id: 'hollywood', name: 'أفلام هوليود', nameEn: 'Hollywood', icon: '🇺🇸', path: '/movies/hollywood' },
    { id: 'bollywood', name: 'أفلام بوليوود', nameEn: 'Bollywood', icon: '🇮🇳', path: '/movies/bollywood' },
    { id: 'european', name: 'أفلام أوروبية', nameEn: 'European', icon: '🇪🇺', path: '/movies/european' },
    { id: 'asian', name: 'أفلام آسيوية', nameEn: 'Asian', icon: '🇯🇵', path: '/movies/asian' },
  ];

  const genres = ['all', 'Action', 'Drame', 'Comédie', 'Romance', 'Thriller', 'Musical'];
  const years = ['all', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010'];

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('bollywood_view_mode', mode);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    localStorage.setItem('bollywood_current_page', page);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // تحميل أفلام بوليوود فقط
  useEffect(() => {
    const loadMovies = async () => {
      setLoading(true);
      try {
        const data = await moviesAPI.getByCategory('bollywood');
        setMovies(data);
        setFilteredMovies(data);
      } catch (error) {
        console.error('خطأ في تحميل أفلام بوليوود:', error);
        setMovies([]);
        setFilteredMovies([]);
      } finally {
        setLoading(false);
      }
    };
    loadMovies();
  }, []);

  useEffect(() => {
    handlePageChange(1);
  }, [searchTerm, selectedGenre, selectedYear]);

  useEffect(() => {
    let results = [...movies];
    if (searchTerm) {
      results = results.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()) || (m.titleAr && m.titleAr.includes(searchTerm)));
    }
    if (selectedGenre !== 'all') {
      results = results.filter(m => m.genre === selectedGenre);
    }
    if (selectedYear !== 'all') {
      results = results.filter(m => m.year?.toString() === selectedYear);
    }
    setFilteredMovies(results);
  }, [searchTerm, selectedGenre, selectedYear, movies]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMovies = filteredMovies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);

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

  const getCategoryIcon = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.icon || '🎬';
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    if (cat) {
      return language === 'ar' ? cat.name : cat.nameEn;
    }
    return categoryId;
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
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://image.tmdb.org/t/p/original/74xTEARUx3IxJdIoUqPZwSq7I0K.jpg)', filter: 'brightness(0.4)' }} />
        <div className="relative h-full w-full px-3 sm:px-4 md:px-6 lg:px-8 flex items-center z-20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🇮🇳</span>
              <h1 className="text-2xl md:text-3xl font-bold text-white">أفلام بوليوود</h1>
            </div>
            <p className="text-gray-300 text-sm md:text-base max-w-2xl">أفضل أفلام بوليوود</p>
          </div>
        </div>
      </div>

      {/* ========== شريط التصنيفات العلوي ========== */}
      <div className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
        <div className="relative overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 py-2 px-3 sm:px-4 md:px-6 lg:px-8">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={category.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  location.pathname === category.path
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="text-sm">{category.icon}</span>
                <span>{language === 'ar' ? category.name : category.nameEn}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4">
        {/* Search and Filters */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder={t('search.placeholder')} 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 pl-10 pr-3 text-white focus:outline-none focus:border-red-500 text-sm" 
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={selectedGenre} 
                onChange={(e) => setSelectedGenre(e.target.value)} 
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm flex-1"
              >
                {genres.map(g => (<option key={g} value={g}>{g === 'all' ? t('common.allGenres') : g}</option>))}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)} 
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                {years.map(y => (<option key={y} value={y}>{y === 'all' ? t('common.allYears') : y}</option>))}
              </select>
            </div>
          </div>
          
          {/* View Mode Buttons */}
          <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}>
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`px-3 py-1.5 rounded-md transition text-sm flex items-center gap-1 ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
              >
                <FaTh size={14} />
                <span className="hidden sm:inline">شبكة</span>
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`px-3 py-1.5 rounded-md transition text-sm flex items-center gap-1 ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
              >
                <FaList size={14} />
                <span className="hidden sm:inline">قائمة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page Info */}
        <div className="flex justify-end mb-3">
          <p className="text-gray-500 text-xs">صفحة {currentPage} من {totalPages}</p>
        </div>

        {/* Movies Display */}
        {filteredMovies.length === 0 ? (
          <div className="text-center py-12">
            <FaFilm className="text-gray-700 text-5xl mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد أفلام بوليوود حالياً</p>
            <p className="text-gray-500 text-sm">يمكنك إضافة أفلام جديدة من لوحة التحكم</p>
          </div>
        ) : viewMode === 'grid' ? (
          // ✅ 2 أعمدة على الهواتف، 5+ أعمدة على الشاشات الكبيرة
          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-8 gap-2 sm:gap-3">
            {currentMovies.map((movie) => (
              <MovieCard 
                key={movie.id} 
                movie={movie} 
                getCategoryIcon={getCategoryIcon} 
                getCategoryName={getCategoryName} 
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {currentMovies.map((movie) => (
              <MovieListItem 
                key={movie.id} 
                movie={movie} 
                getCategoryIcon={getCategoryIcon} 
                getCategoryName={getCategoryName} 
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 mt-8 mb-4">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition ${
                currentPage === 1 
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                  : 'bg-gray-800 text-white hover:bg-red-600'
              }`}
            >
              <FaChevronRight size={14} />
            </button>
            
            {getPageNumbers().map(number => (
              <button
                key={number}
                onClick={() => goToPage(number)}
                className={`w-8 h-8 rounded-lg transition text-sm ${
                  currentPage === number
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {number}
              </button>
            ))}
            
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition ${
                currentPage === totalPages 
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                  : 'bg-gray-800 text-white hover:bg-red-600'
              }`}
            >
              <FaChevronLeft size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ Movie Card Component (Grid View) - مصغر مع إخفاء التصنيف على الهواتف
const MovieCard = ({ movie, getCategoryIcon, getCategoryName }) => (
  <Link to={`/movie/${movie.id}`} className="block group">
    <div className="relative rounded-lg overflow-hidden bg-gray-900">
      <img 
        src={movie.poster} 
        alt={movie.title} 
        className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105" 
        loading="lazy"
      />
      {/* ✅ تقييم أصغر */}
      <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm rounded-full px-1 py-0.5 flex items-center gap-0.5">
        <FaStar className="text-yellow-400 text-[8px] xs:text-[10px]" />
        <span className="text-white text-[8px] xs:text-[10px] font-semibold">{movie.rating || '?'}</span>
      </div>
      {movie.duration && (
        <div className="absolute top-1 right-1 bg-black/70 backdrop-blur-sm rounded-full px-1 py-0.5">
          <FaClock className="text-gray-400 text-[7px] xs:text-[9px] inline ml-0.5" />
          <span className="text-white text-[7px] xs:text-[9px]">{movie.duration}</span>
        </div>
      )}
      {/* ✅ التصنيف يظهر فقط على الشاشات الكبيرة (sm: وما فوق) */}
      <div className="absolute bottom-1 left-1 bg-black/70 backdrop-blur-sm rounded-full px-1 py-0.5 hidden sm:block">
        <span className="text-white text-[6px] xs:text-[8px]">{getCategoryIcon(movie.category)} {getCategoryName(movie.category)}</span>
      </div>
    </div>
    <div className="mt-0.5 xs:mt-1">
      <h3 className="text-white font-semibold text-[9px] xs:text-[11px] sm:text-[12px] leading-tight line-clamp-1 group-hover:text-red-500 transition">{movie.title}</h3>
      <div className="flex items-center gap-0.5 text-gray-400 text-[7px] xs:text-[9px] mt-0.5">
        <FaCalendarAlt className="text-[6px] xs:text-[8px]" />
        <span>{movie.year}</span>
        <span className="w-0.5 h-0.5 bg-gray-600 rounded-full"></span>
        <span className="line-clamp-1 text-[6px] xs:text-[8px]">{movie.genre}</span>
      </div>
    </div>
  </Link>
);

// Movie List Item Component (يبقى كما هو)
const MovieListItem = ({ movie, getCategoryIcon, getCategoryName }) => (
  <Link to={`/movie/${movie.id}`} className="block group">
    <div className="flex gap-3 bg-gray-900/50 rounded-lg p-2 hover:bg-gray-800 transition border border-gray-800 hover:border-red-500/50">
      <img 
        src={movie.poster} 
        alt={movie.title} 
        className="w-14 h-20 object-cover rounded" 
      />
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h3 className="text-white font-semibold text-sm group-hover:text-red-500 transition">{movie.title}</h3>
          <span className="bg-gray-800 text-gray-400 text-[9px] px-1.5 py-0.5 rounded-full">
            {getCategoryIcon(movie.category)} {getCategoryName(movie.category)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
          <span className="flex items-center gap-0.5">
            <FaStar className="text-yellow-400 text-[10px]" /> {movie.rating || '?'}/10
          </span>
          <span className="flex items-center gap-0.5">
            <FaCalendarAlt className="text-[10px]" /> {movie.year}
          </span>
          {movie.duration && (
            <span className="flex items-center gap-0.5">
              <FaClock className="text-[10px]" /> {movie.duration}
            </span>
          )}
          <span>{movie.genre}</span>
        </div>
        <p className="text-gray-500 text-xs mt-1 line-clamp-1">{movie.description || 'لا يوجد وصف متاح لهذا الفيلم'}</p>
        <div className="flex items-center gap-2 mt-2">
          <button className="bg-red-600 text-white px-3 py-0.5 rounded text-xs hover:bg-red-700 transition">
            مشاهدة
          </button>
          <button className="text-gray-400 hover:text-red-500 transition">
            <FaHeart size={12} />
          </button>
        </div>
      </div>
    </div>
  </Link>
);

export default BollywoodMovies;