import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FaTv, FaStar, FaSearch, FaTh, FaList, FaChevronLeft, FaChevronRight, FaCalendarAlt } from 'react-icons/fa';
import { seriesAPI } from '../services/api';

const SeriesPage = () => {
  const { language, t } = useLanguage();
  const location = useLocation();
  const [allSeries, setAllSeries] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [viewMode, setViewMode] = useState(() => {
    const savedMode = localStorage.getItem('series_view_mode');
    return savedMode === 'list' ? 'list' : 'grid';
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('series_current_page');
    return savedPage ? parseInt(savedPage) : 1;
  });
  const [itemsPerPage] = useState(30);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // تصنيفات المسلسلات (للشريط العلوي)
  const categories = [
    { id: 'all', name: 'الكل', nameEn: 'All', icon: '🎬', path: '/series' },
    { id: 'arabic', name: 'مسلسلات عربية', nameEn: 'Arabic Series', icon: '🇸🇦', path: '/series/arabic' },
    { id: 'foreign', name: 'مسلسلات أجنبية', nameEn: 'Foreign Series', icon: '🌍', path: '/series/foreign' },
    { id: 'indian', name: 'مسلسلات هندية', nameEn: 'Indian Series', icon: '🇮🇳', path: '/series/indian' },
    { id: 'turkish', name: 'مسلسلات تركية', nameEn: 'Turkish Series', icon: '🇹🇷', path: '/series/turkish' },
    { id: 'korean', name: 'مسلسلات كورية', nameEn: 'Korean Series', icon: '🇰🇷', path: '/series/korean' },
  ];

  const genres = ['all', 'Drame', 'Action', 'Comédie', 'Romance', 'Science-Fiction', 'Thriller', 'Crime', 'Fantastique', 'Horreur'];
  const years = ['all', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015'];

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('series_view_mode', mode);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    localStorage.setItem('series_current_page', page);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // تحميل جميع المسلسلات من جميع التصنيفات
  useEffect(() => {
    const loadAllSeries = async () => {
      setLoading(true);
      try {
        const categoriesList = ['arabic', 'foreign', 'indian', 'turkish', 'korean'];
        const allSeriesPromises = categoriesList.map(cat => seriesAPI.getByCategory(cat));
        const results = await Promise.all(allSeriesPromises);
        const combined = results.flat();
        setAllSeries(combined);
        setFilteredSeries(combined);
      } catch (error) {
        console.error('خطأ في تحميل المسلسلات:', error);
        setAllSeries([]);
        setFilteredSeries([]);
      } finally {
        setLoading(false);
      }
    };
    loadAllSeries();
  }, []);

  // تحديث التصنيف المحدد من URL
  useEffect(() => {
    const currentPath = location.pathname;
    const category = categories.find(c => c.path === currentPath);
    if (category && category.id !== 'all') {
      setSelectedCategory(category.id);
    } else {
      setSelectedCategory('all');
    }
  }, [location.pathname]);

  // فلترة النتائج
  useEffect(() => {
    let results = [...allSeries];
    
    if (selectedCategory !== 'all') {
      results = results.filter(s => s.category === selectedCategory);
    }
    
    if (searchTerm) {
      results = results.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.titleAr && s.titleAr.includes(searchTerm))
      );
    }
    
    if (selectedGenre !== 'all') {
      results = results.filter(s => s.genre === selectedGenre);
    }
    
    if (selectedYear !== 'all') {
      results = results.filter(s => s.year?.toString() === selectedYear);
    }
    
    setFilteredSeries(results);
    handlePageChange(1);
  }, [searchTerm, selectedGenre, selectedYear, selectedCategory, allSeries]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSeries = filteredSeries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSeries.length / itemsPerPage);

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
    <div className="min-h-screen bg-black">
      {/* Hero Section صغير - ممتد بالكامل */}
      <div className="relative h-[20vh] md:h-[25vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-cover bg-center" style={{ 
          backgroundImage: 'url(https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg)',
          filter: 'brightness(0.4)'
        }} />
        <div className="relative h-full w-full px-3 sm:px-4 md:px-6 lg:px-8 flex flex-col justify-center z-20">
          <div className="flex items-center gap-2 mb-1">
            <FaTv className="text-red-500 text-xl md:text-2xl" />
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {language === 'ar' ? 'المسلسلات' : 'Series'}
            </h1>
          </div>
          <p className="text-gray-300 text-xs sm:text-sm max-w-2xl">
            {language === 'ar' ? 'استمتع بمشاهدة أحدث وأفضل المسلسلات من جميع أنحاء العالم' : 'Enjoy watching the latest and best series from around the world'}
          </p>
        </div>
      </div>

      {/* شريط التصنيفات العلوي - ممتد بالكامل */}
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

      {/* المحتوى الرئيسي - ممتد بالكامل مع مسافات جانبية بسيطة */}
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

        {/* عدد المسلسلات والصفحات */}
        <div className="flex justify-between items-center mb-3">
          <p className="text-gray-400 text-sm">{filteredSeries.length} {t('series.seriesCount')}</p>
          <p className="text-gray-500 text-xs">صفحة {currentPage} من {totalPages}</p>
        </div>

        {/* عرض المسلسلات - شبكة ممتدة */}
        {filteredSeries.length === 0 ? (
          <div className="text-center py-12">
            <FaTv className="text-gray-700 text-5xl mx-auto mb-4" />
            <p className="text-gray-500 text-lg">{t('series.noSeries')}</p>
            <p className="text-gray-500 text-sm">{t('series.addFromAdmin')} <Link to="/admin" className="text-red-500 hover:text-red-400">{t('admin.dashboard')}</Link></p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
            {currentSeries.map((serie) => <SeriesCard key={serie.id} serie={serie} getCategoryName={getCategoryName} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {currentSeries.map((serie) => <SeriesListItem key={serie.id} serie={serie} getCategoryName={getCategoryName} />)}
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

// بطاقة المسلسل (عرض شبكي)
const SeriesCard = ({ serie, getCategoryName }) => {
  const { t } = useLanguage();
  return (
    <Link to={`/series/${serie.id}`} className="block group">
      <div className="relative rounded-lg overflow-hidden bg-gray-900">
        <img src={serie.poster} alt={serie.title} className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
          <FaStar className="text-yellow-400 text-[10px]" />
          <span className="text-white text-[10px] font-semibold">{serie.rating || '?'}</span>
        </div>
        {serie.seasons && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <span className="text-white text-[9px]">{serie.seasons} {t('series.seasons')}</span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5">
          <span className="text-white text-[9px]">{getCategoryName(serie.category)}</span>
        </div>
      </div>
      <div className="mt-1">
        <h3 className="text-white font-semibold text-xs line-clamp-1 group-hover:text-red-500 transition">{serie.title}</h3>
        <div className="flex items-center gap-1 text-gray-400 text-[10px] mt-0.5">
          <FaCalendarAlt className="text-[9px]" />
          <span>{serie.year}</span>
          <span className="w-0.5 h-0.5 bg-gray-600 rounded-full"></span>
          <span className="line-clamp-1">{serie.genre}</span>
        </div>
      </div>
    </Link>
  );
};

// عنصر المسلسل (عرض قائمة)
const SeriesListItem = ({ serie, getCategoryName }) => {
  const { t } = useLanguage();
  return (
    <Link to={`/series/${serie.id}`} className="block group">
      <div className="flex gap-3 bg-gray-900/50 rounded-lg p-2 hover:bg-gray-800 transition border border-gray-800 hover:border-red-500/50">
        <img src={serie.poster} alt={serie.title} className="w-14 h-20 object-cover rounded" />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-white font-semibold text-sm group-hover:text-red-500 transition">{serie.title}</h3>
            <span className="bg-gray-800 text-gray-400 text-[9px] px-1.5 py-0.5 rounded-full">{getCategoryName(serie.category)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
            <span className="flex items-center gap-0.5"><FaStar className="text-yellow-400 text-[10px]" /> {serie.rating || '?'}/10</span>
            <span className="flex items-center gap-0.5"><FaCalendarAlt className="text-[10px]" /> {serie.year}</span>
            {serie.seasons && (<span className="flex items-center gap-0.5">{serie.seasons} {t('series.seasons')}</span>)}
            <span>{serie.genre}</span>
          </div>
          <p className="text-gray-500 text-xs mt-1 line-clamp-1">{serie.description || 'لا يوجد وصف متاح لهذا المسلسل'}</p>
        </div>
      </div>
    </Link>
  );
};

export default SeriesPage;