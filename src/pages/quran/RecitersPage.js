// src/pages/quran/RecitersPage.js - نسخة معدلة بتصميم عصري زجاجي
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FaSearch, FaMicrophoneAlt, FaPlay, FaStar } from 'react-icons/fa';
import { recitersAPI } from '../../services/api';

const RecitersPage = () => {
  const { language } = useLanguage();

  // 🖼️ رابط صورة الهيدر - غيّره من هنا فقط
  const HEADER_IMAGE = 'https://images.unsplash.com/photo-1584551246679-258d75b1a3e8?w=1920&h=400&fit=crop';

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
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: `url(${HEADER_IMAGE})`, filter: 'brightness(0.3)' }} 
        />
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
            <input 
              type="text" 
              placeholder="بحث عن قارئ..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500 text-sm sm:text-base" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5">
          {filteredReciters.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">لا توجد قراء</div>
          ) : (
            filteredReciters.map(reciter => (
              <ReciterCard key={reciter.id} reciter={reciter} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ===== بطاقة القارئ العصرية بتأثير زجاجي (أخضر) ===== */
const ReciterCard = ({ reciter }) => {
  return (
    <Link to={`/quran/reciter/${reciter.id}`} className="group block">
      <div className="relative rounded-2xl overflow-hidden bg-gray-900/60 backdrop-blur-xl border border-white/10 hover:border-green-500/60 transition-all duration-500 hover:shadow-2xl hover:shadow-green-600/40 hover:-translate-y-1">

        {/* الصورة بنسبة ثابتة */}
        <div className="relative w-full aspect-[4/5] overflow-hidden">
          <img
            src={reciter.image || 'https://via.placeholder.com/300x375?text=Reciter'}
            alt={reciter.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x375?text=Reciter'; }}
          />

          {/* طبقة تدرج سفلية دائمة */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          {/* وميض زجاجي علوي */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

          {/* زر التشغيل الزجاجي - يظهر عند المرور */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="relative">
              {/* هالة متوهجة خضراء */}
              <div className="absolute inset-0 rounded-full bg-green-500/40 blur-xl scale-150 animate-pulse" />
              {/* الزر الزجاجي */}
              <div className="relative w-14 h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-500">
                <FaPlay className="text-white text-lg ml-0.5 drop-shadow-lg" />
              </div>
            </div>
          </div>

          {/* شارة عدد السور زجاجية أعلى اليمين */}
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-1">
            <FaMicrophoneAlt className="text-green-300 text-[8px]" />
            <span className="text-white text-[9px] font-medium">{reciter.surahsCount || 0}</span>
          </div>

          {/* اسم القارئ أسفل الصورة */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <h3 className="text-white font-bold text-sm line-clamp-1 drop-shadow-lg group-hover:text-green-300 transition-colors duration-300">
              {reciter.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-gray-300 text-[10px] line-clamp-1">
                {reciter.country || ''}
              </span>
            </div>
          </div>
        </div>

        {/* شريط سفلي زجاجي رقيق */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-green-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </Link>
  );
};

export default RecitersPage;