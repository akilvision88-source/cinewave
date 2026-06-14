// src/pages/quran/RecitersPage.js - نسخة معدلة لعرض الأحدث أولاً
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FaSearch, FaMicrophoneAlt, FaPlay, FaStar } from 'react-icons/fa';
import { recitersAPI } from '../../services/api';

const RecitersPage = () => {
  const { language } = useLanguage();
  const [reciters, setReciters] = useState([]);
  const [filteredReciters, setFilteredReciters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [favoriteRecitersCount, setFavoriteRecitersCount] = useState(0);

  // تحميل القراء من API (مرتبة حسب الأحدث)
  useEffect(() => {
    const loadReciters = async () => {
      setLoading(true);
      try {
        const data = await recitersAPI.getAll();
        // ترتيب القراء حسب الأحدث (الأحدث أولاً)
        const sortedReciters = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setReciters(sortedReciters);
        setFilteredReciters(sortedReciters);
      } catch (error) {
        console.error('خطأ في تحميل القراء:', error);
        setReciters([]);
        setFilteredReciters([]);
      } finally {
        setLoading(false);
      }
    };
    loadReciters();
    
    const loadFavoritesCount = async () => {
      try {
        const favorites = await recitersAPI.getFavorites();
        setFavoriteRecitersCount(favorites.length);
      } catch (error) {
        console.error('خطأ في تحميل المفضلين:', error);
      }
    };
    loadFavoritesCount();
  }, []);

  // فلترة القراء
  useEffect(() => {
    let results = [...reciters];
    if (searchTerm) {
      results = results.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.nameEn && r.nameEn.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredReciters(results);
  }, [searchTerm, reciters]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="relative h-[40vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1584551246679-258d75b1a3e8?w=1920&h=400&fit=crop)', filter: 'brightness(0.3)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="relative h-full w-full px-3 sm:px-4 md:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-3">🕌 القرآن الكريم</h1>
            <p className="text-gray-300 text-sm sm:text-base md:text-lg">استمع إلى تلاوات أشهر قراء العالم الإسلامي</p>
          </div>
          <Link to="/favorite-reciters" className="flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition border border-green-500/30">
            <FaStar className="text-green-400 text-lg sm:text-xl" />
            <div className="text-right">
              <p className="text-white text-xs sm:text-sm font-semibold">المفضلون</p>
              <p className="text-green-400 text-[10px] sm:text-xs">{favoriteRecitersCount} قارئ</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm sm:text-base" />
            <input type="text" placeholder="بحث عن قارئ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500 text-sm sm:text-base" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5">
          {filteredReciters.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">لا توجد قراء</div>
          ) : (
            filteredReciters.map(reciter => (
              <Link key={reciter.id} to={`/quran/reciter/${reciter.id}`} className="group">
                <div className="relative bg-gray-900 rounded-xl overflow-hidden transition-transform duration-300 hover:-translate-y-2">
                  <img src={reciter.image} alt={reciter.name} className="w-full aspect-square object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-full flex items-center justify-center"><FaPlay className="text-white text-base sm:text-xl ml-0.5" /></div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black to-transparent">
                    <h3 className="text-white font-bold text-sm sm:text-lg line-clamp-1">{reciter.name}</h3>
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-400 text-[10px] sm:text-sm mt-0.5 sm:mt-1">
                      <FaMicrophoneAlt className="text-[8px] sm:text-xs" />
                      <span>{reciter.surahsCount} سورة</span>
                      <span className="text-gray-600">•</span>
                      <span className="line-clamp-1">{reciter.country}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RecitersPage;