// src/pages/AnimationPage.js - نسخة كاملة مع ترتيب الأحدث أولاً
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FaStar, FaSearch, FaFilm, FaTv, FaClock, FaCalendarAlt, FaTh, FaList, FaHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { moviesAPI, seriesAPI } from '../services/api';

const AnimationPage = () => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [viewMode, setViewMode] = useState(() => {
    const savedMode = localStorage.getItem('animation_view_mode');
    return savedMode === 'list' ? 'list' : 'grid';
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(30);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const movieGenres = ['all', 'Animation', 'Family', 'Adventure', 'Comedy', 'Fantasy', 'Action', 'Musical', 'Drama', 'Science-Fiction'];
  const seriesGenres = ['all', 'Animation', 'Family', 'Adventure', 'Comedy', 'Fantasy', 'Action', 'Drama', 'Kids'];

  const years = ['all', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010', '2009', '2008', '2007', '2006', '2005'];

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('animation_view_mode', mode);
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

  // تحميل البيانات من API مع ترتيب حسب الأحدث
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [moviesData, seriesData] = await Promise.all([
          moviesAPI.getByCategory('animation'),
          seriesAPI.getByCategory('animation')
        ]);
        
        // ترتيب الأفلام حسب الأحدث (الأحدث أولاً)
        const sortedMovies = [...moviesData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        // ترتيب المسلسلات حسب الأحدث (الأحدث أولاً)
        const sortedSeries = [...seriesData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        setMovies(sortedMovies);
        setFilteredMovies(sortedMovies);
        setSeries(sortedSeries);
        setFilteredSeries(sortedSeries);
        
        console.log(`📊 تم تحميل ${sortedMovies.length} فيلم و ${sortedSeries.length} مسلسل (مرتبة من الأحدث إلى الأقدم)`);
      } catch (error) {
        console.error('خطأ في تحميل بيانات الرسوم المتحركة:', error);
        setMovies([]);
        setSeries([]);
        setFilteredMovies([]);
        setFilteredSeries([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // فلترة النتائج
  useEffect(() => {
    if (activeTab === 'movies') {
      let results = [...movies];
      if (searchTerm) {
        results = results.filter(m => 
          m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (m.title_ar && m.title_ar.includes(searchTerm))
        );
      }
      if (selectedGenre !== 'all') {
        results = results.filter(m => m.genre === selectedGenre);
      }
      if (selectedYear !== 'all') {
        results = results.filter(m => m.year?.toString() === selectedYear);
      }
      setFilteredMovies(results);
    } else {
      let results = [...series];
      if (searchTerm) {
        results = results.filter(s => 
          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.title_ar && s.title_ar.includes(searchTerm))
        );
      }
      if (selectedGenre !== 'all') {
        results = results.filter(s => s.genre === selectedGenre);
      }
      if (selectedYear !== 'all') {
        results = results.filter(s => s.year?.toString() === selectedYear);
      }
      setFilteredSeries(results);
    }
    setCurrentPage(1);
  }, [searchTerm, selectedGenre, selectedYear, activeTab, movies, series]);

  const currentData = activeTab === 'movies' ? filteredMovies : filteredSeries;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = currentData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(currentData.length / itemsPerPage);

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
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">جاري تحميل الرسوم المتحركة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[25vh] md:h-[30vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/70 via-black/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-cover bg-center" style={{ 
          backgroundImage: 'url(https://image.tmdb.org/t/p/original/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg)',
          filter: 'brightness(0.3)'
        }} />
        <div className="relative h-full w-full px-3 sm:px-4 md:px-6 lg:px-8 flex items-center z-20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">🎨</span>
              <h1 className="text-2xl md:text-3xl font-bold text-white">الرسوم المتحركة</h1>
            </div>
            <p className="text-gray-300 text-sm md:text-base max-w-2xl">
              استمتع بمشاهدة أجمل أفلام ومسلسلات الرسوم المتحركة والأنيميشن من جميع أنحاء العالم
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4">
        {/* Tabs */}
        <div className="flex gap-2 md:gap-3 mb-4 border-b border-gray-800 pb-2">
          <button
            onClick={() => { setActiveTab('movies'); setSelectedGenre('all'); setSearchTerm(''); }}
            className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 md:gap-2 ${
              activeTab === 'movies'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FaFilm className="text-xs md:text-sm" />
            <span className="hidden sm:inline">أفلام الرسوم المتحركة</span>
            <span className="sm:hidden">أفلام</span>
            <span className="bg-white/20 text-white text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 rounded-full ml-0.5 md:ml-1">{filteredMovies.length}</span>
          </button>
          <button
            onClick={() => { setActiveTab('series'); setSelectedGenre('all'); setSearchTerm(''); }}
            className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 md:gap-2 ${
              activeTab === 'series'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FaTv className="text-xs md:text-sm" />
            <span className="hidden sm:inline">مسلسلات الرسوم المتحركة</span>
            <span className="sm:hidden">مسلسلات</span>
            <span className="bg-white/20 text-white text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 rounded-full ml-0.5 md:ml-1">{filteredSeries.length}</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm md:text-base" />
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
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 md:px-3 py-2 text-white text-xs md:text-sm flex-1"
              >
                {(activeTab === 'movies' ? movieGenres : seriesGenres).map(g => (
                  <option key={g} value={g}>
                    {g === 'all' ? t('common.allGenres') : g}
                  </option>
                ))}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)} 
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 md:px-3 py-2 text-white text-xs md:text-sm"
              >
                {years.map(y => (
                  <option key={y} value={y}>
                    {y === 'all' ? t('common.allYears') : y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* View Mode Buttons */}
          <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}>
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md transition text-xs md:text-sm flex items-center gap-1 ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                title="عرض شبكي"
              >
                <FaTh size={12} />
                <span className="hidden sm:inline">شبكة</span>
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md transition text-xs md:text-sm flex items-center gap-1 ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                title="عرض قائمة"
              >
                <FaList size={12} />
                <span className="hidden sm:inline">قائمة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Count and Page Info */}
        <div className="flex justify-between items-center mb-3">
          <p className="text-gray-400 text-xs md:text-sm">{currentData.length} {activeTab === 'movies' ? 'فيلم' : 'مسلسل'}</p>
          <p className="text-gray-500 text-[10px] md:text-xs">صفحة {currentPage} من {totalPages}</p>
        </div>

        {/* Content Display */}
        {currentData.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 rounded-xl">
            {activeTab === 'movies' ? (
              <FaFilm className="text-gray-700 text-5xl mx-auto mb-4" />
            ) : (
              <FaTv className="text-gray-700 text-5xl mx-auto mb-4" />
            )}
            <p className="text-gray-500 text-base md:text-lg">لا توجد {activeTab === 'movies' ? 'أفلام' : 'مسلسلات'} رسوم متحركة</p>
            <p className="text-gray-500 text-xs md:text-sm mt-2">يمكنك إضافة {activeTab === 'movies' ? 'أفلام' : 'مسلسلات'} جديدة من لوحة التحكم</p>
            <Link to="/admin" className="inline-block mt-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition">
              الذهاب للوحة التحكم
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 md:gap-3">
            {currentItems.map((item) => (
              activeTab === 'movies' 
                ? <MovieCard key={item.id} movie={item} />
                : <SeriesCard key={item.id} series={item} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {currentItems.map((item) => (
              activeTab === 'movies' 
                ? <MovieListItem key={item.id} movie={item} />
                : <SeriesListItem key={item.id} series={item} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 mt-8 mb-4">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className={`p-1.5 md:p-2 rounded-lg transition ${
                currentPage === 1 
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                  : 'bg-gray-800 text-white hover:bg-red-600'
              }`}
            >
              <FaChevronRight size={isMobile ? 12 : 14} />
            </button>
            
            {getPageNumbers().map(number => (
              <button
                key={number}
                onClick={() => goToPage(number)}
                className={`w-6 h-6 md:w-8 md:h-8 rounded-lg transition text-xs md:text-sm ${
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
              className={`p-1.5 md:p-2 rounded-lg transition ${
                currentPage === totalPages 
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                  : 'bg-gray-800 text-white hover:bg-red-600'
              }`}
            >
              <FaChevronLeft size={isMobile ? 12 : 14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Movie Card (Grid View)
const MovieCard = ({ movie }) => {
  return (
    <Link to={`/movie/${movie.id}`} className="block group">
      <div className="relative rounded-lg overflow-hidden bg-gray-900">
        <img 
          src={movie.poster} 
          alt={movie.title} 
          className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105" 
          loading="lazy"
        />
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
          <FaStar className="text-yellow-400 text-[10px]" />
          <span className="text-white text-[10px] font-semibold">{movie.rating || '?'}</span>
        </div>
        {movie.duration && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <FaClock className="text-gray-400 text-[10px] inline ml-0.5" />
            <span className="text-white text-[10px]">{movie.duration}</span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-purple-600/80 backdrop-blur-sm rounded-full px-1.5 py-0.5">
          <span className="text-white text-[9px]">🎨 رسوم متحركة</span>
        </div>
      </div>
      <div className="mt-1">
        <h3 className="text-white font-semibold text-xs line-clamp-1 group-hover:text-red-500 transition">{movie.title}</h3>
        <div className="flex items-center gap-1 text-gray-400 text-[10px] mt-0.5">
          <FaCalendarAlt className="text-[9px]" />
          <span>{movie.year}</span>
          <span className="w-0.5 h-0.5 bg-gray-600 rounded-full"></span>
          <span className="line-clamp-1">{movie.genre}</span>
        </div>
      </div>
    </Link>
  );
};

// Series Card (Grid View)
const SeriesCard = ({ series }) => {
  const { t } = useLanguage();
  return (
    <Link to={`/series/${series.id}`} className="block group">
      <div className="relative rounded-lg overflow-hidden bg-gray-900">
        <img 
          src={series.poster} 
          alt={series.title} 
          className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105" 
          loading="lazy"
        />
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
          <FaStar className="text-yellow-400 text-[10px]" />
          <span className="text-white text-[10px] font-semibold">{series.rating || '?'}</span>
        </div>
        {series.seasons && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <span className="text-white text-[9px]">{series.seasons} {t('series.seasons')}</span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-purple-600/80 backdrop-blur-sm rounded-full px-1.5 py-0.5">
          <span className="text-white text-[9px]">🎨 رسوم متحركة</span>
        </div>
      </div>
      <div className="mt-1">
        <h3 className="text-white font-semibold text-xs line-clamp-1 group-hover:text-red-500 transition">{series.title}</h3>
        <div className="flex items-center gap-1 text-gray-400 text-[10px] mt-0.5">
          <FaCalendarAlt className="text-[9px]" />
          <span>{series.year}</span>
          <span className="w-0.5 h-0.5 bg-gray-600 rounded-full"></span>
          <span className="line-clamp-1">{series.genre}</span>
        </div>
      </div>
    </Link>
  );
};

// Movie List Item
const MovieListItem = ({ movie }) => {
  return (
    <Link to={`/movie/${movie.id}`} className="block group">
      <div className="flex gap-3 bg-gray-900/50 rounded-lg p-2 hover:bg-gray-800 transition border border-gray-800 hover:border-red-500/50">
        <img src={movie.poster} alt={movie.title} className="w-14 h-20 object-cover rounded" />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-white font-semibold text-sm group-hover:text-red-500 transition">{movie.title}</h3>
            <span className="bg-purple-600/50 text-purple-200 text-[9px] px-1.5 py-0.5 rounded-full">🎨 رسوم متحركة</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
            <span className="flex items-center gap-0.5"><FaStar className="text-yellow-400 text-[10px]" /> {movie.rating || '?'}/10</span>
            <span className="flex items-center gap-0.5"><FaCalendarAlt className="text-[10px]" /> {movie.year}</span>
            {movie.duration && (<span className="flex items-center gap-0.5"><FaClock className="text-[10px]" /> {movie.duration}</span>)}
            <span>{movie.genre}</span>
          </div>
          <p className="text-gray-500 text-xs mt-1 line-clamp-1">{movie.description || 'لا يوجد وصف متاح لهذا الفيلم'}</p>
          <div className="flex items-center gap-2 mt-2">
            <button className="bg-red-600 text-white px-3 py-0.5 rounded text-xs hover:bg-red-700 transition">مشاهدة</button>
            <button className="text-gray-400 hover:text-red-500 transition"><FaHeart size={12} /></button>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Series List Item
const SeriesListItem = ({ series }) => {
  const { t } = useLanguage();
  return (
    <Link to={`/series/${series.id}`} className="block group">
      <div className="flex gap-3 bg-gray-900/50 rounded-lg p-2 hover:bg-gray-800 transition border border-gray-800 hover:border-red-500/50">
        <img src={series.poster} alt={series.title} className="w-14 h-20 object-cover rounded" />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-white font-semibold text-sm group-hover:text-red-500 transition">{series.title}</h3>
            <span className="bg-purple-600/50 text-purple-200 text-[9px] px-1.5 py-0.5 rounded-full">🎨 رسوم متحركة</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
            <span className="flex items-center gap-0.5"><FaStar className="text-yellow-400 text-[10px]" /> {series.rating || '?'}/10</span>
            <span className="flex items-center gap-0.5"><FaCalendarAlt className="text-[10px]" /> {series.year}</span>
            {series.seasons && (<span className="flex items-center gap-0.5">{series.seasons} {t('series.seasons')}</span>)}
            <span>{series.genre}</span>
          </div>
          <p className="text-gray-500 text-xs mt-1 line-clamp-1">{series.description || 'لا يوجد وصف متاح لهذا المسلسل'}</p>
          <div className="flex items-center gap-2 mt-2">
            <button className="bg-red-600 text-white px-3 py-0.5 rounded text-xs hover:bg-red-700 transition">مشاهدة</button>
            <button className="text-gray-400 hover:text-red-500 transition"><FaHeart size={12} /></button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AnimationPage;