// src/App.js - نسخة معدلة بدون localDB
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Sidebar from './components/Layout/Sidebar';
import MobileNav from './components/Layout/MobileNav';

// الصفحات الرئيسية
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import SeriesPage from './pages/SeriesPage';
import MovieDetailsPage from './pages/MovieDetailsPage';
import SeriesDetailsPage from './pages/SeriesDetailsPage';
import WatchPage from './pages/WatchPage';
import SearchPage from './pages/SearchPage';
import TrendingPage from './pages/TrendingPage';
import ChannelsPage from './pages/ChannelsPage';
import AnimationPage from './pages/AnimationPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SubscriptionPlansPage from './pages/SubscriptionPlansPage';
import PlaylistManager from './components/PlaylistManager';

// صفحات الأفلام
import ArabwoodMovies from './pages/movies/ArabwoodMovies';
import HollywoodMovies from './pages/movies/HollywoodMovies';
import BollywoodMovies from './pages/movies/BollywoodMovies';
import EuropeanMovies from './pages/movies/EuropeanMovies';
import AsianMovies from './pages/movies/AsianMovies';

// صفحات المسلسلات
import ArabicSeries from './pages/series/ArabicSeries';
import ForeignSeries from './pages/series/ForeignSeries';
import IndianSeries from './pages/series/IndianSeries';
import TurkishSeries from './pages/series/TurkishSeries';
import KoreanSeries from './pages/series/KoreanSeries';

// صفحات الأغاني
import SongsPage from './pages/songs/SongsPage';
import ArtistSongsPage from './pages/songs/ArtistSongsPage';
import FavoriteSongsPage from './pages/songs/FavoriteSongsPage';

// صفحات الكليبات
import ArtistsPage from './pages/clips/ArtistsPage';
import ArtistClipsPage from './pages/clips/ArtistClipsPage';
import FavoriteClipsPage from './pages/clips/FavoriteClipsPage';

// صفحات القرآن
import RecitersPage from './pages/quran/RecitersPage';
import ReciterDetailsPage from './pages/quran/ReciterDetailsPage';
import FavoriteRecitersPage from './pages/quran/FavoriteRecitersPage';

// صفحات المشرف
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdvancedStatistics from './pages/admin/AdvancedStatistics';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isReady, setIsReady] = useState(true); // ✅ دائماً true لأننا نستخدم API
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location, isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل المنصة...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-black">
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        {isMobile && <MobileNav onMenuToggle={toggleSidebar} />}
        
        <main className={`transition-all duration-300 ${
          !isMobile && isSidebarOpen ? 'lg:ml-64' : !isMobile ? 'lg:ml-20' : ''
        }`}>
          <Routes>
            {/* الصفحات الرئيسية */}
            <Route path="/" element={<HomePage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/series" element={<SeriesPage />} />
            <Route path="/movie/:id" element={<MovieDetailsPage />} />
            <Route path="/series/:id" element={<SeriesDetailsPage />} />
            <Route path="/watch/:id" element={<WatchPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/channels" element={<ChannelsPage />} />
            <Route path="/animation" element={<AnimationPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
            <Route path="/playlists" element={<PlaylistManager />} />
            
            {/* صفحات تصنيفات الأفلام */}
            <Route path="/movies/arabwood" element={<ArabwoodMovies />} />
            <Route path="/movies/hollywood" element={<HollywoodMovies />} />
            <Route path="/movies/bollywood" element={<BollywoodMovies />} />
            <Route path="/movies/european" element={<EuropeanMovies />} />
            <Route path="/movies/asian" element={<AsianMovies />} />
            
            {/* صفحات تصنيفات المسلسلات */}
            <Route path="/series/arabic" element={<ArabicSeries />} />
            <Route path="/series/foreign" element={<ForeignSeries />} />
            <Route path="/series/indian" element={<IndianSeries />} />
            <Route path="/series/turkish" element={<TurkishSeries />} />
            <Route path="/series/korean" element={<KoreanSeries />} />
            
            {/* صفحات الأغاني */}
            <Route path="/songs" element={<SongsPage />} />
            <Route path="/songs/artist/:artistId" element={<ArtistSongsPage />} />     
            <Route path="/favorite-songs" element={<FavoriteSongsPage />} />  
            
            {/* صفحات الكليبات */}
            <Route path="/clips" element={<ArtistsPage />} />
            <Route path="/clips/artist/:artistId" element={<ArtistClipsPage />} />
            <Route path="/favorite-clips" element={<FavoriteClipsPage />} />
            
            {/* صفحات القرآن */}
            <Route path="/quran" element={<RecitersPage />} />
            <Route path="/quran/reciter/:reciterId" element={<ReciterDetailsPage />} />
            <Route path="/favorite-reciters" element={<FavoriteRecitersPage />} />
            
            {/* صفحات المشرف */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path="/admin/statistics" element={<AdvancedStatistics />} />
          </Routes>
        </main>
      </div>
    </LanguageProvider>
  );
}

export default App;