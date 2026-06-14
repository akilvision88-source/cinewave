import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import MovieCard from '../components/UI/MovieCard';
import { FaFire, FaStar, FaSearch, FaTh, FaList, FaChevronLeft, FaChevronRight, FaClock, FaCalendarAlt, FaFilm } from 'react-icons/fa';
import { moviesAPI } from '../services/api';

const TrendingPage = () => {
  const { language, t } = useLanguage();
  const [trending, setTrending] = useState([]);
  const [filteredTrending, setFilteredTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [viewMode, setViewMode] = useState(() => {
    const savedMode = localStorage.getItem('trending_view_mode');
    return savedMode === 'list' ? 'list' : 'grid';
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(30);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const genres = ['all', 'Action', 'Drame', 'Comédie', 'Romance', 'Science-Fiction', 'Thriller', 'Horreur', 'Crime', 'Fantastique'];
  const years = ['all', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015'];

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('trending_view_mode', mode);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // تحميل البيانات من API
  useEffect(() => {
    const loadTrending = async () => {
      setLoading(true);
      try {
        // تحميل جميع الأفلام من جميع التصنيفات
        const categoriesList = ['arabwood', 'hollywood', 'bollywood', 'european', 'asian', 'animation'];
        const allMoviesPromises = categoriesList.map(cat => moviesAPI.getByCategory(cat));
        const moviesResults = await Promise.all(allMoviesPromises);
        const allMovies = moviesResults.flat();
        
        // ترتيب حسب المشاهدات (الأكثر مشاهدة أولاً)
        const sortedByViews = [...allMovies].sort((a, b) => (b.views || 0) - (a.views || 0));
        setTrending(sortedByViews);
        setFilteredTrending(sortedByViews);
      } catch (error) {
        console.error('خطأ في تحميل قائمة الأكثر مشاهدة:', error);
        setTrending([]);
        setFilteredTrending([]);
      } finally {
        setLoading(false);
      }
    };
    loadTrending();
  }, []);

  // فلترة النتائج
  useEffect(() => {
    let results = [...trending];
    
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
    setFilteredTrending(results);
    setCurrentPage(1);
  }, [searchTerm, selectedGenre, selectedYear, trending]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMovies = filteredTrending.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTrending.length / itemsPerPage);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section - ممتد بالكامل */}
      <div className="relative h-[20vh] md:h-[25vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-cover bg-center" style={{ 
          backgroundImage: 'url(https://image.tmdb.org/t/p/original/8b8R8l88Qje9dnbOE6PY0QO7Lx9.jpg)',
          filter: 'brightness(0.4)'
        }} />
        <div className="relative h-full w-full px-3 sm:px-4 md:px-6 lg:px-8 flex items-center z-20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FaFire className="text-orange-500 text-2xl md:text-3xl" />
              <h1 className="text-2xl md:text-3xl font-bold text-white">{t('nav.trending')}</h1>
            </div>
            <p className="text-gray-300 text-xs sm:text-sm max-w-2xl">
              {language === 'ar' ? 'الأكثر مشاهدة والأعلى تقييماً على المنصة' : 'Most viewed and highest rated on the platform'}
            </p>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي - ممتد بالكامل */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4">
        {/* شريط البحث والفلترة */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
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
                {genres.map(g => (
                  <option key={g} value={g}>
                    {g === 'all' ? t('common.allGenres') : g}
                  </option>
                ))}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)} 
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                {years.map(y => (
                  <option key={y} value={y}>
                    {y === 'all' ? t('common.allYears') : y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* أزرار تبديل العرض */}
          <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}>
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`px-3 py-1.5 rounded-md transition text-sm flex items-center gap-1 ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                title="عرض شبكي"
              >
                <FaTh size={14} />
                <span className="hidden sm:inline">شبكة</span>
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`px-3 py-1.5 rounded-md transition text-sm flex items-center gap-1 ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                title="عرض قائمة"
              >
                <FaList size={14} />
                <span className="hidden sm:inline">قائمة</span>
              </button>
            </div>
          </div>
        </div>

        {/* عدد الأفلام والصفحات */}
        <div className="flex justify-between items-center mb-3">
          <p className="text-gray-400 text-sm">{filteredTrending.length} {t('movies.moviesCount')}</p>
          <p className="text-gray-500 text-xs">صفحة {currentPage} من {totalPages}</p>
        </div>

        {/* عرض الأفلام - شبكة ممتدة */}
        {filteredTrending.length === 0 ? (
          <div className="text-center py-12">
            <FaFire className="text-gray-700 text-5xl mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد أفلام في قائمة الأكثر مشاهدة</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
            {currentMovies.map((movie, index) => (
              <div key={movie.id} className="relative">
                <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-gradient-to-br from-red-600 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">#{indexOfFirstItem + index + 1}</span>
                </div>
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {currentMovies.map((movie, index) => (
              <div key={movie.id} className="flex items-center gap-3 bg-gray-900/50 rounded-lg p-2 hover:bg-gray-800 transition border border-gray-800 hover:border-red-500/50">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">#{indexOfFirstItem + index + 1}</span>
                </div>
                <img src={movie.poster} alt={movie.title} className="w-14 h-20 object-cover rounded" />
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm group-hover:text-red-500 transition">{movie.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                    <span className="flex items-center gap-0.5"><FaStar className="text-yellow-400 text-[10px]" /> {movie.rating || '?'}/10</span>
                    <span className="flex items-center gap-0.5"><FaCalendarAlt className="text-[10px]" /> {movie.year}</span>
                    {movie.duration && (<span className="flex items-center gap-0.5"><FaClock className="text-[10px]" /> {movie.duration}</span>)}
                    <span>{movie.genre}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1 line-clamp-1">{movie.description || 'لا يوجد وصف متاح لهذا الفيلم'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Link to={`/watch/${movie.id}`} className="bg-red-600 text-white px-3 py-0.5 rounded text-xs hover:bg-red-700 transition">مشاهدة</Link>
                  </div>
                </div>
              </div>
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

export default TrendingPage;