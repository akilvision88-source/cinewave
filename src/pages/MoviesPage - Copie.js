import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FaFilm, FaStar, FaSearch, FaTh, FaList, FaChevronLeft, FaChevronRight, FaCalendarAlt, FaPlay } from 'react-icons/fa';
import { moviesAPI } from '../services/api';

const MoviesPage = () => {
  const { language, t } = useLanguage();
  const location = useLocation();
  const [allMovies, setAllMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [viewMode, setViewMode] = useState(() => {
    const savedMode = localStorage.getItem('movies_view_mode');
    return savedMode === 'list' ? 'list' : 'grid';
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('movies_current_page');
    return savedPage ? parseInt(savedPage) : 1;
  });
  const [itemsPerPage] = useState(40);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const categories = [
    { id: 'all', name: 'الكل', nameEn: 'All', icon: '🎬', path: '/movies' },
    { id: 'arabwood', name: 'أفلام عربية', nameEn: 'Arabwood', icon: '🇸🇦', path: '/movies/arabwood' },
    { id: 'hollywood', name: 'أفلام هوليود', nameEn: 'Hollywood', icon: '🇺🇸', path: '/movies/hollywood' },
    { id: 'bollywood', name: 'أفلام بوليوود', nameEn: 'Bollywood', icon: '🇮🇳', path: '/movies/bollywood' },
    { id: 'european', name: 'أفلام أوروبية', nameEn: 'European', icon: '🇪🇺', path: '/movies/european' },
    { id: 'asian', name: 'أفلام آسيوية', nameEn: 'Asian', icon: '🇯🇵', path: '/movies/asian' },
  ];

  const genres = ['all', 'Action', 'Drame', 'Comédie', 'Romance', 'Science-Fiction', 'Thriller', 'Horreur', 'Crime', 'Fantastique'];

  const years = ['all', ...Array.from({ length: 2027 - 1900 + 1 }, (_, i) => (2027 - i).toString())];

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('movies_view_mode', mode);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    localStorage.setItem('movies_current_page', page);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadAllMovies = async () => {
      setLoading(true);
      try {
        const categoriesList = ['arabwood', 'hollywood', 'bollywood', 'european', 'asian'];
        const allMoviesPromises = categoriesList.map(cat => moviesAPI.getByCategory(cat));
        const results = await Promise.all(allMoviesPromises);
        const combined = results.flat();
        setAllMovies(combined);
        setFilteredMovies(combined);
      } catch (error) {
        console.error('خطأ في تحميل الأفلام:', error);
        setAllMovies([]);
        setFilteredMovies([]);
      } finally {
        setLoading(false);
      }
    };
    loadAllMovies();
  }, []);

  useEffect(() => {
    const currentPath = location.pathname;
    const category = categories.find(c => c.path === currentPath);
    if (category && category.id !== 'all') {
      setSelectedCategory(category.id);
    } else {
      setSelectedCategory('all');
    }
  }, [location.pathname]);

  useEffect(() => {
    let results = [...allMovies];

    if (selectedCategory !== 'all') {
      results = results.filter(m => m.category === selectedCategory);
    }

    if (searchTerm) {
      results = results.filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.titleAr && m.titleAr.includes(searchTerm))
      );
    }

    if (selectedGenre !== 'all') {
      results = results.filter(m => m.genre === selectedGenre);
    }

    if (selectedYear !== 'all') {
      results = results.filter(m => m.year?.toString() === selectedYear);
    }

    results.sort((a, b) => {
      const yearA = parseInt(a.year) || 0;
      const yearB = parseInt(b.year) || 0;
      return yearB - yearA;
    });

    setFilteredMovies(results);
    handlePageChange(1);
  }, [searchTerm, selectedGenre, selectedYear, selectedCategory, allMovies]);

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
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black">
      {/* Hero Section - صورة أوضح */}
      <div className="relative h-[22vh] md:h-[28vh] w-full overflow-hidden">
        {/* ✅ تقليل التعتيم: from-black/70 via-black/40 إلى شفافية أخف */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent z-10" />
        <div className="absolute inset-0 bg-cover bg-center" style={{
          backgroundImage: 'url(http://192.168.11.88/data/Movies/header.jpg)',
          filter: 'brightness(0.7) contrast(1.1) saturate(1.2)' // ✅ صورة أوضح وأكثر حيوية
        }} />
        <div className="relative h-full w-full px-4 sm:px-6 md:px-8 lg:px-10 flex flex-col justify-center z-20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-600/20 rounded-xl backdrop-blur-sm border border-red-600/30">
              <FaFilm className="text-red-500 text-xl md:text-2xl" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-lg">
              {language === 'ar' ? 'الأفلام' : 'Movies'}
            </h1>
          </div>
          <p className="text-gray-200 text-xs sm:text-sm max-w-2xl leading-relaxed drop-shadow-md">
            {language === 'ar' ? 'استمتع بمشاهدة أحدث وأفضل الأفلام من جميع أنحاء العالم' : 'Enjoy watching the latest and best movies from around the world'}
          </p>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800/50 shadow-lg shadow-black/50">
        <div className="relative overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 py-3 px-4 sm:px-6 md:px-8 lg:px-10">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={category.path}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap ${
                  location.pathname === category.path
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-600/40 scale-105'
                    : 'bg-gray-900/80 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-800'
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
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6">

        {/* Filters Section */}
        <div className="bg-gray-900/40 border border-gray-800/50 rounded-2xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
                <input
                  type="text"
                  placeholder={t('search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-950/80 border border-gray-800 rounded-xl py-2.5 pl-11 pr-4 text-white focus:outline-none focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 text-sm transition-all"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="bg-gray-950/80 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm flex-1 focus:outline-none focus:border-red-500/70 transition-all cursor-pointer"
                >
                  {genres.map(g => (
                    <option key={g} value={g}>
                      {g === 'all' ? t('common.allGenres') : g}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-gray-950/80 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/70 transition-all cursor-pointer"
                >
                  {years.map(y => (
                    <option key={y} value={y}>
                      {y === 'all' ? t('common.allYears') : y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={`flex ${isMobile ? 'justify-center' : 'justify-between'} items-center`}>
              <p className="text-gray-400 text-sm hidden sm:block">
                <span className="text-white font-semibold">{filteredMovies.length}</span> {t('movies.moviesCount')}
              </p>
              <div className="flex gap-1 bg-gray-950/80 rounded-xl p-1 border border-gray-800">
                <button
                  onClick={() => handleViewModeChange('grid')}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 text-sm flex items-center gap-2 ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-600/30'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                  title="عرض شبكي"
                >
                  <FaTh size={14} />
                  <span className="hidden sm:inline font-medium">شبكة</span>
                </button>
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 text-sm flex items-center gap-2 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-600/30'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                  title="عرض قائمة"
                >
                  <FaList size={14} />
                  <span className="hidden sm:inline font-medium">قائمة</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center mb-5 px-1">
          <p className="text-gray-400 text-sm sm:hidden">
            <span className="text-white font-semibold">{filteredMovies.length}</span> {t('movies.moviesCount')}
          </p>
          {totalPages > 1 && (
            <p className="text-gray-500 text-xs">
              صفحة <span className="text-white font-semibold">{currentPage}</span> من <span className="text-white font-semibold">{totalPages}</span>
            </p>
          )}
        </div>

        {/* Movies Grid/List */}
        {filteredMovies.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-gray-800/50">
            <FaFilm className="text-gray-700 text-6xl mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium mb-1">{t('movies.noMovies')}</p>
            <p className="text-gray-500 text-sm">
              {t('movies.addFromAdmin')} <Link to="/admin" className="text-red-500 hover:text-red-400 underline">{t('admin.dashboard')}</Link>
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-5">
            {currentMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} getCategoryName={getCategoryName} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {currentMovies.map((movie) => (
              <MovieListItem key={movie.id} movie={movie} getCategoryName={getCategoryName} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10 mb-6">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className={`p-2.5 rounded-xl transition-all duration-300 ${
                currentPage === 1
                  ? 'bg-gray-900 text-gray-700 cursor-not-allowed border border-gray-800'
                  : 'bg-gray-900 text-white hover:bg-red-600 border border-gray-800 hover:border-red-500'
              }`}
            >
              <FaChevronRight size={14} />
            </button>

            {getPageNumbers().map(number => (
              <button
                key={number}
                onClick={() => goToPage(number)}
                className={`w-10 h-10 rounded-xl transition-all duration-300 text-sm font-medium ${
                  currentPage === number
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-600/40 scale-105'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-800'
                }`}
              >
                {number}
              </button>
            ))}

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`p-2.5 rounded-xl transition-all duration-300 ${
                currentPage === totalPages
                  ? 'bg-gray-900 text-gray-700 cursor-not-allowed border border-gray-800'
                  : 'bg-gray-900 text-white hover:bg-red-600 border border-gray-800 hover:border-red-500'
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

/* ✅ بطاقة الفيلم - بدون زر إضافة للقائمة */
const MovieCard = ({ movie, getCategoryName }) => {
  return (
    <Link to={`/movie/${movie.id}`} className="block group">
      <div className="relative rounded-xl overflow-hidden bg-gray-900 shadow-lg shadow-black/50 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-red-600/20 group-hover:-translate-y-1">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />

          {/* ✅ زر Play زجاجي أنيق */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl shadow-black/50 transform scale-50 group-hover:scale-100 transition-transform duration-500">
                <FaPlay className="text-white text-lg sm:text-xl ml-1 drop-shadow-lg" />
              </div>
            </div>
          </div>

          {/* Rating Badge */}
          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md rounded-lg px-2 py-1 flex items-center gap-1 border border-white/10">
            <FaStar className="text-yellow-400 text-[10px]" />
            <span className="text-white text-[10px] font-bold">{movie.rating || '?'}</span>
          </div>

          {/* Category Badge */}
          <div className="absolute bottom-2 left-2 bg-red-600/90 backdrop-blur-md rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <span className="text-white text-[9px] font-medium">{getCategoryName(movie.category)}</span>
          </div>
        </div>
      </div>

      {/* Movie Info */}
      <div className="mt-2.5 px-1">
        <h3 className="text-white font-semibold text-xs sm:text-sm leading-tight line-clamp-1 group-hover:text-red-500 transition-colors duration-300">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 text-gray-500 text-[10px] sm:text-xs mt-1">
          <span className="flex items-center gap-1">
            <FaCalendarAlt className="text-[9px]" />
            {movie.year}
          </span>
          <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
          <span className="line-clamp-1">{movie.genre}</span>
        </div>
      </div>
    </Link>
  );
};

/* ✅ عنصر القائمة - بدون زر إضافة للقائمة */
const MovieListItem = ({ movie, getCategoryName }) => {
  return (
    <Link to={`/movie/${movie.id}`} className="block group">
      <div className="flex gap-4 bg-gray-900/40 rounded-xl p-3 hover:bg-gray-900/80 transition-all duration-300 border border-gray-800/50 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-600/10">
        <div className="relative overflow-hidden rounded-lg">
          <img src={movie.poster} alt={movie.title} className="w-16 h-24 object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            {/* زر Play زجاجي في القائمة */}
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
              <FaPlay className="text-white text-sm ml-0.5" />
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-white font-semibold text-sm group-hover:text-red-500 transition-colors line-clamp-1">{movie.title}</h3>
            <span className="bg-gray-800 text-gray-400 text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap border border-gray-700">{getCategoryName(movie.category)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-400 mt-1.5">
            <span className="flex items-center gap-1"><FaStar className="text-yellow-400 text-[10px]" /> {movie.rating || '?'}/10</span>
            <span className="flex items-center gap-1"><FaCalendarAlt className="text-[10px]" /> {movie.year}</span>
            <span className="text-gray-500">{movie.genre}</span>
          </div>
          <p className="text-gray-500 text-xs mt-2 line-clamp-1">{movie.description || 'لا يوجد وصف متاح لهذا الفيلم'}</p>
          <div className="flex items-center gap-2 mt-2.5">
            <button className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-1 rounded-lg text-xs hover:from-red-500 hover:to-red-400 transition-all duration-300 shadow-lg shadow-red-600/20 flex items-center gap-1.5">
              <FaPlay size={10} />
              مشاهدة
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MoviesPage;