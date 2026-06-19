// src/pages/series/KoreanSeries.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FaStar, FaSearch, FaTv, FaClock, FaCalendarAlt, FaTh, FaList, FaHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { seriesAPI } from '../../services/api';

const KoreanSeries = () => {
  const { language, t } = useLanguage();
  const [series, setSeries] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [viewMode, setViewMode] = useState(() => {
    const savedMode = localStorage.getItem('koreanseries_view_mode');
    return savedMode === 'list' ? 'list' : 'grid';
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('koreanseries_current_page');
    return savedPage ? parseInt(savedPage) : 1;
  });
  // ✅ تغيير عدد المسلسلات في الصفحة إلى 40
  const [itemsPerPage] = useState(40);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const genres = ['all', 'Romance', 'Drame', 'Thriller', 'Comédie', 'Action', 'Fantastique', 'Horreur'];
  const years = ['all', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010'];

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('koreanseries_view_mode', mode);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    localStorage.setItem('koreanseries_current_page', page);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadSeries = async () => {
      setLoading(true);
      try {
        const data = await seriesAPI.getByCategory('korean');
        setSeries(data);
        setFilteredSeries(data);
      } catch (error) {
        console.error('خطأ في تحميل المسلسلات:', error);
        setSeries([]);
        setFilteredSeries([]);
      } finally {
        setLoading(false);
      }
    };
    loadSeries();
  }, []);

  useEffect(() => {
    let results = [...series];
    if (searchTerm) results = results.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()) || (s.titleAr && s.titleAr.includes(searchTerm)));
    if (selectedGenre !== 'all') results = results.filter(s => s.genre === selectedGenre);
    if (selectedYear !== 'all') results = results.filter(s => s.year?.toString() === selectedYear);
    setFilteredSeries(results);
    handlePageChange(1);
  }, [searchTerm, selectedGenre, selectedYear, series]);

  const getTitle = (serie) => {
    if (language === 'ar') return serie.titleAr || serie.title;
    return serie.title;
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="relative h-[20vh] md:h-[25vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://image.tmdb.org/t/p/original/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg)', filter: 'brightness(0.4)' }} />
        <div className="relative h-full container-custom flex items-center z-20">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">مسلسلات كورية</h1>
            <p className="text-gray-300 text-sm md:text-base max-w-2xl mt-1">{t('series.koreanSeriesDescription')}</p>
          </div>
        </div>
      </div>

      <div className="container-custom py-4">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder={t('search.placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 pl-10 pr-3 text-white focus:outline-none focus:border-red-500 text-sm" />
            </div>
            <div className="flex gap-2">
              <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm flex-1">
                {genres.map(g => (<option key={g} value={g}>{g === 'all' ? t('common.allGenres') : g}</option>))}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                {years.map(y => (<option key={y} value={y}>{y === 'all' ? t('common.allYears') : y}</option>))}
              </select>
            </div>
          </div>
          <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}>
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              <button onClick={() => handleViewModeChange('grid')} className={`px-3 py-1.5 rounded-md transition text-sm flex items-center gap-1 ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}><FaTh size={14} /><span className="hidden sm:inline">شبكة</span></button>
              <button onClick={() => handleViewModeChange('list')} className={`px-3 py-1.5 rounded-md transition text-sm flex items-center gap-1 ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}><FaList size={14} /><span className="hidden sm:inline">قائمة</span></button>
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-3">
          <p className="text-gray-500 text-xs">صفحة {currentPage} من {totalPages}</p>
        </div>

        {filteredSeries.length === 0 ? (
          <div className="text-center py-12">
            <FaTv className="text-gray-700 text-5xl mx-auto mb-4" />
            <p className="text-gray-500 text-lg">{t('series.noSeries')}</p>
            <p className="text-gray-500">{t('series.addFromAdmin')} <Link to="/admin" className="text-red-500 hover:text-red-400">{t('admin.dashboard')}</Link></p>
          </div>
        ) : viewMode === 'grid' ? (
          // ✅ 2 أعمدة على الهواتف، 5+ أعمدة على الشاشات الكبيرة
          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-8 gap-2 sm:gap-3">
            {currentSeries.map((serie) => <SeriesCard key={serie.id} serie={serie} getTitle={getTitle} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {currentSeries.map((serie) => <SeriesListItem key={serie.id} serie={serie} getTitle={getTitle} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 mt-8 mb-4">
            <button onClick={goToPrevPage} disabled={currentPage === 1} className={`p-2 rounded-lg transition ${currentPage === 1 ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-red-600'}`}><FaChevronRight /></button>
            {getPageNumbers().map(number => (<button key={number} onClick={() => goToPage(number)} className={`w-8 h-8 rounded-lg transition text-sm ${currentPage === number ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{number}</button>))}
            <button onClick={goToNextPage} disabled={currentPage === totalPages} className={`p-2 rounded-lg transition ${currentPage === totalPages ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-red-600'}`}><FaChevronLeft /></button>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ Series Card Component - مصغر مع إخفاء التصنيف على الهواتف
const SeriesCard = ({ serie, getTitle }) => {
  const { t } = useLanguage();
  return (
    <Link to={`/series/${serie.id}`} className="block group">
      <div className="relative rounded-lg overflow-hidden bg-gray-900">
        <img src={serie.poster} alt={serie.title} className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        {/* ✅ تقييم أصغر */}
        <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm rounded-full px-1 py-0.5 flex items-center gap-0.5">
          <FaStar className="text-yellow-400 text-[8px] xs:text-[10px]" />
          <span className="text-white text-[8px] xs:text-[10px] font-semibold">{serie.rating || '?'}</span>
        </div>
        {serie.seasons && (
          <div className="absolute top-1 right-1 bg-black/70 backdrop-blur-sm rounded-full px-1 py-0.5">
            <span className="text-white text-[7px] xs:text-[9px]">{serie.seasons} {t('series.seasons')}</span>
          </div>
        )}
        {/* ✅ التصنيف يظهر فقط على الشاشات الكبيرة (sm: وما فوق) */}
        <div className="absolute bottom-1 left-1 bg-black/70 backdrop-blur-sm rounded-full px-1 py-0.5 hidden sm:block">
          <span className="text-white text-[6px] xs:text-[8px]">كوري</span>
        </div>
      </div>
      <div className="mt-0.5 xs:mt-1">
        <h3 className="text-white font-semibold text-[9px] xs:text-[11px] sm:text-[12px] leading-tight line-clamp-1 group-hover:text-red-500 transition">{getTitle(serie)}</h3>
        <div className="flex items-center gap-0.5 text-gray-400 text-[7px] xs:text-[9px] mt-0.5">
          <FaCalendarAlt className="text-[6px] xs:text-[8px]" />
          <span>{serie.year}</span>
          <span className="w-0.5 h-0.5 bg-gray-600 rounded-full"></span>
          <span className="line-clamp-1 text-[6px] xs:text-[8px]">{serie.genre}</span>
        </div>
      </div>
    </Link>
  );
};

// Series List Item Component (يبقى كما هو)
const SeriesListItem = ({ serie, getTitle }) => {
  const { t } = useLanguage();
  return (
    <Link to={`/series/${serie.id}`} className="block group">
      <div className="flex gap-3 bg-gray-900/50 rounded-lg p-2 hover:bg-gray-800 transition border border-gray-800 hover:border-red-500/50">
        <img src={serie.poster} alt={serie.title} className="w-14 h-20 object-cover rounded" />
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm group-hover:text-red-500 transition">{getTitle(serie)}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
            <span className="flex items-center gap-0.5"><FaStar className="text-yellow-400 text-[10px]" /> {serie.rating || '?'}/10</span>
            <span className="flex items-center gap-0.5"><FaCalendarAlt className="text-[10px]" /> {serie.year}</span>
            {serie.seasons && (<span className="flex items-center gap-0.5"><FaTv className="text-[10px]" /> {serie.seasons} {t('series.seasons')}</span>)}
            <span>{serie.genre}</span>
          </div>
          <p className="text-gray-500 text-xs mt-1 line-clamp-1">{serie.description || 'لا يوجد وصف متاح لهذا المسلسل'}</p>
          <div className="flex items-center gap-2 mt-2"><button className="bg-red-600 text-white px-3 py-0.5 rounded text-xs hover:bg-red-700 transition">مشاهدة</button><button className="text-gray-400 hover:text-red-500 transition"><FaHeart size={12} /></button></div>
        </div>
      </div>
    </Link>
  );
};

export default KoreanSeries;