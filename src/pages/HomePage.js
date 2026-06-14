// src/pages/HomePage.js - نسخة معدلة لاستخدام API
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FaPlay, FaInfoCircle, FaChevronLeft, FaChevronRight, FaStar, FaFire, FaTv, FaFilm, FaCalendarAlt, FaClock, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import MovieCard from '../components/UI/MovieCard';
import { moviesAPI, seriesAPI } from '../services/api';

const HomePage = () => {
  const { language, t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularSeries, setPopularSeries] = useState([]);
  const [latestReleases, setLatestReleases] = useState([]);
  const [featuredSlides, setFeaturedSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const autoplayRef = useRef(null);

  const defaultSlides = [
    { id: 1, title: 'Dune: Part Two', titleAr: 'Dune: الجزء الثاني', backdrop: 'https://image.tmdb.org/t/p/original/8b8R8l88Qje9dnbOE6PY0QO7Lx9.jpg', rating: 8.8, year: 2024, duration: '2h 46min', genre: 'Science-Fiction', description: 'Paul Atreides unit à Chani et aux Fremen pour se venger.' },
    { id: 2, title: 'Oppenheimer', titleAr: 'أوبنهايمر', backdrop: 'https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', rating: 8.5, year: 2023, duration: '3h 00min', genre: 'Drame', description: 'L\'histoire du père de la bombe atomique.' },
  ];

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        // تحميل جميع الأفلام من جميع التصنيفات
        const categoriesList = ['arabwood', 'hollywood', 'bollywood', 'european', 'asian', 'animation'];
        const allMoviesPromises = categoriesList.map(cat => moviesAPI.getByCategory(cat));
        const moviesResults = await Promise.all(allMoviesPromises);
        const allMovies = moviesResults.flat();
        
        // تحميل جميع المسلسلات
        const seriesCategoriesList = ['arabic', 'foreign', 'indian', 'turkish', 'korean', 'animation'];
        const allSeriesPromises = seriesCategoriesList.map(cat => seriesAPI.getByCategory(cat));
        const seriesResults = await Promise.all(allSeriesPromises);
        const allSeries = seriesResults.flat();
        
        // ترتيب حسب تاريخ الإضافة (أحدث الإصدارات)
        const sortedByDate = [...allMovies].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setLatestReleases(sortedByDate.slice(0, 12));
        
        // الأعلى تقييماً (أفلام شعبية)
        const sortedByRating = [...allMovies].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setPopularMovies(sortedByRating.slice(0, 12));
        
        // المسلسلات الشعبية
        const seriesByRating = [...allSeries].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setPopularSeries(seriesByRating.slice(0, 12));
        
        // الأكثر مشاهدة (ترند)
        const trendingByViews = [...allMovies].sort((a, b) => (b.views || 0) - (a.views || 0));
        setTrending(trendingByViews.slice(0, 12));
        
        // شرائح الـ Hero (أحدث 5 أفلام)
        const heroSlides = sortedByDate.slice(0, 5).map(movie => ({
          id: movie.id,
          title: movie.title,
          titleFr: movie.title_fr || movie.title,
          titleAr: movie.title_ar || movie.title,
          backdrop: movie.backdrop || movie.poster,
          rating: movie.rating || 0,
          year: movie.year,
          duration: movie.duration,
          genre: movie.genre,
          description: movie.description || 'لا يوجد وصف متاح'
        }));
        
        setFeaturedSlides(heroSlides.length > 0 ? heroSlides : defaultSlides);
        
      } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        setFeaturedSlides(defaultSlides);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, []);

  useEffect(() => {
    if (autoplay && featuredSlides.length > 0) {
      autoplayRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredSlides.length);
      }, 5000);
    }
    return () => clearInterval(autoplayRef.current);
  }, [autoplay, featuredSlides.length]);

  const nextSlide = () => {
    setAutoplay(false);
    setCurrentSlide((prev) => (prev + 1) % featuredSlides.length);
    setTimeout(() => setAutoplay(true), 10000);
  };
  
  const prevSlide = () => {
    setAutoplay(false);
    setCurrentSlide((prev) => (prev - 1 + featuredSlides.length) % featuredSlides.length);
    setTimeout(() => setAutoplay(true), 10000);
  };

  const getTitle = (slide) => {
    if (language === 'ar') return slide.titleAr || slide.title;
    if (language === 'fr') return slide.titleFr || slide.title;
    return slide.title;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-black">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 text-sm">جاري تحميل المنصة...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Slider - باقي الكود كما هو */}
      <div className="relative h-[60vh] md:h-[75vh] lg:h-[85vh] w-full overflow-hidden">
        <AnimatePresence mode="wait">
          {featuredSlides.length > 0 && featuredSlides.map((slide, index) => (
            index === currentSlide && (
              <motion.div key={slide.id} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${slide.backdrop})` }} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              </motion.div>
            )
          ))}
        </AnimatePresence>

        <div className="relative h-full w-full px-3 sm:px-4 md:px-6 lg:px-8 flex items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="max-w-2xl">
            {featuredSlides[currentSlide] && (
              <>
                <span className="inline-block px-3 py-1 bg-red-600/80 backdrop-blur-sm rounded-full text-white text-xs font-semibold mb-3">{featuredSlides[currentSlide].genre}</span>
                <h1 className="text-3xl xs:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-3 leading-tight">{getTitle(featuredSlides[currentSlide])}</h1>
                <div className="flex flex-wrap items-center gap-3 sm:gap-5 mb-4">
                  <div className="flex items-center gap-1"><FaStar className="text-yellow-400 text-sm" /><span className="text-white font-semibold text-sm">{featuredSlides[currentSlide].rating}/10</span></div>
                  <div className="flex items-center gap-1"><FaCalendarAlt className="text-gray-400 text-sm" /><span className="text-gray-300 text-sm">{featuredSlides[currentSlide].year}</span></div>
                  {featuredSlides[currentSlide].duration && (<div className="flex items-center gap-1"><FaClock className="text-gray-400 text-sm" /><span className="text-gray-300 text-sm">{featuredSlides[currentSlide].duration}</span></div>)}
                </div>
                <p className="text-gray-300 text-sm sm:text-base md:text-lg mb-5 line-clamp-2 sm:line-clamp-3">{featuredSlides[currentSlide].description}</p>
                <div className="flex flex-wrap gap-3">
                  <Link to={`/watch/${featuredSlides[currentSlide].id}`} className="group bg-red-600 text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-red-700 transition-all duration-300 hover:scale-105"><FaPlay className="text-sm" /><span>{t('movie.watch')}</span></Link>
                  <Link to={`/movie/${featuredSlides[currentSlide].id}`} className="group bg-white/10 backdrop-blur-sm text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-white/20 transition-all duration-300"><FaInfoCircle /><span>{t('common.details')}</span><FaArrowRight className="text-sm opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /></Link>
                </div>
              </>
            )}
          </motion.div>
        </div>

        {featuredSlides.length > 1 && (
          <>
            <button onClick={prevSlide} className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-red-600 transition-all duration-300 flex items-center justify-center z-10"><FaChevronLeft className="text-lg" /></button>
            <button onClick={nextSlide} className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-red-600 transition-all duration-300 flex items-center justify-center z-10"><FaChevronRight className="text-lg" /></button>
          </>
        )}

        {featuredSlides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {featuredSlides.map((_, i) => (<button key={i} onClick={() => { setAutoplay(false); setCurrentSlide(i); setTimeout(() => setAutoplay(true), 10000); }} className={`h-1 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-red-600' : 'w-4 bg-white/50 hover:bg-white/80'}`} />))}
          </div>
        )}
      </div>

      {/* أقسام المحتوى */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-10 space-y-10 md:space-y-14">
        
        {trending.length > 0 && (
          <Section title={t('home.trending')} viewAll="/trending" icon={<FaFire className="text-orange-500" />}>
            <MovieRow movies={trending} />
          </Section>
        )}

        {latestReleases.length > 0 && (
          <Section title="أحدث الإصدارات" viewAll="/movies" icon={<FaFilm className="text-red-500" />}>
            <MovieRow movies={latestReleases} />
          </Section>
        )}

        {popularMovies.length > 0 && (
          <Section title={t('home.popularMovies')} viewAll="/movies" icon={<FaFilm className="text-blue-500" />}>
            <MovieRow movies={popularMovies} />
          </Section>
        )}

        {popularSeries.length > 0 && (
          <Section title={t('home.popularSeries')} viewAll="/series" icon={<FaTv className="text-green-500" />}>
            <SeriesRow series={popularSeries} />
          </Section>
        )}
      </div>
    </div>
  );
};

// مكون القسم
const Section = ({ title, viewAll, children, icon }) => {
  const { t } = useLanguage();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <h2 className="text-white text-lg sm:text-xl md:text-2xl font-bold">{title}</h2>
        </div>
        {viewAll && (
          <Link to={viewAll} className="group flex items-center gap-1 text-red-500 hover:text-red-400 text-xs sm:text-sm transition-all">
            <span>{t('common.seeAll')}</span>
            <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
      {children}
    </motion.div>
  );
};

// صف الأفلام
const MovieRow = ({ movies }) => {
  const scrollRef = useRef(null);
  const scroll = (direction) => { 
    if (scrollRef.current) { 
      scrollRef.current.scrollBy({ left: direction === 'left' ? -350 : 350, behavior: 'smooth' }); 
    } 
  };
  if (!movies || movies.length === 0) return null;
  
  return (
    <div className="relative group">
      <button onClick={() => scroll('left')} className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/60 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 hover:scale-110 hidden md:flex items-center justify-center">
        <FaChevronLeft className="text-sm md:text-base" />
      </button>
      <div ref={scrollRef} className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {movies.map((movie, index) => (
          <motion.div key={movie.id} className="flex-shrink-0 w-[130px] xs:w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
            <MovieCard movie={movie} />
          </motion.div>
        ))}
      </div>
      <button onClick={() => scroll('right')} className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/60 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 hover:scale-110 hidden md:flex items-center justify-center">
        <FaChevronRight className="text-sm md:text-base" />
      </button>
    </div>
  );
};

// صف المسلسلات
const SeriesRow = ({ series }) => {
  const scrollRef = useRef(null);
  const scroll = (direction) => { 
    if (scrollRef.current) { 
      scrollRef.current.scrollBy({ left: direction === 'left' ? -350 : 350, behavior: 'smooth' }); 
    } 
  };
  if (!series || series.length === 0) return null;
  
  return (
    <div className="relative group">
      <button onClick={() => scroll('left')} className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/60 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 hover:scale-110 hidden md:flex items-center justify-center">
        <FaChevronLeft className="text-sm md:text-base" />
      </button>
      <div ref={scrollRef} className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {series.map((serie, index) => (
          <motion.div key={serie.id} className="flex-shrink-0 w-[130px] xs:w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
            <SeriesCard serie={serie} />
          </motion.div>
        ))}
      </div>
      <button onClick={() => scroll('right')} className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/60 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 hover:scale-110 hidden md:flex items-center justify-center">
        <FaChevronRight className="text-sm md:text-base" />
      </button>
    </div>
  );
};

// بطاقة المسلسل
const SeriesCard = ({ serie }) => {
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

export default HomePage;