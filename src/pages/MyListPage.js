// src/pages/MyListPage.js - نسخة محسنة مع تنسيق احترافي
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaPlay, FaHeart, FaRegHeart, FaTrash, FaClock, 
  FaFilm, FaTv, FaMusic, FaStar, FaEye, FaBookmark,
  FaArrowLeft, FaSearch, FaList, FaTimes, FaSyncAlt,
  FaUser, FaCalendarAlt, FaChevronLeft, FaChevronRight,
  FaExclamationTriangle, FaTh, FaThList
} from 'react-icons/fa';
import { watchlistAPI } from '../services/api';

const MyListPage = () => {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('mylist_view_mode');
    return saved || 'grid';
  });
  const itemsPerPage = 20;

  // ========== التحقق من تسجيل الدخول ==========
  useEffect(() => {
    const token = localStorage.getItem('token');
    const auth = localStorage.getItem('isAuthenticated') === 'true';
    const userData = localStorage.getItem('user');
    
    console.log('🔍 التحقق من تسجيل الدخول:', { token: !!token, auth });
    
    if (!token || !auth) {
      console.log('⚠️ المستخدم غير مسجل، إعادة توجيه إلى تسجيل الدخول');
      navigate('/login');
      return;
    }
    
    setIsAuthenticated(true);
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('❌ خطأ في قراءة بيانات المستخدم:', e);
      }
    }
    
    loadWatchlist();
  }, [navigate]);

  // ========== LOAD WATCHLIST FROM DATABASE ==========
  const loadWatchlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ لا يوجد توكن، إعادة توجيه إلى تسجيل الدخول');
        navigate('/login');
        return;
      }
      
      console.log('📋 جلب قائمة المشاهدة...');
      const data = await watchlistAPI.getWatchlist();
      setWatchlist(data);
      console.log('✅ تم تحميل قائمة المشاهدة من قاعدة البيانات:', data.length);
    } catch (error) {
      console.error('❌ خطأ في تحميل قائمة المشاهدة:', error);
      
      if (error.response?.status === 401) {
        console.log('⚠️ توكن غير صالح، إعادة توجيه إلى تسجيل الدخول');
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      setError(error.message || 'فشل في تحميل قائمة المشاهدة');
      setWatchlist([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // ========== REFRESH ==========
  const refreshWatchlist = async () => {
    setIsRefreshing(true);
    await loadWatchlist();
  };

  // ========== REMOVE FROM WATCHLIST ==========
  const removeFromWatchlist = async (itemId, itemType) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      await watchlistAPI.removeFromWatchlist(itemId, itemType);
      await loadWatchlist();
      setShowRemoveModal(false);
      console.log('✅ تم إزالة العنصر من قائمة المشاهدة');
    } catch (error) {
      console.error('❌ خطأ في إزالة العنصر:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
        return;
      }
      
      alert('❌ حدث خطأ في إزالة العنصر من القائمة');
    }
  };

  // ========== GET ITEM TYPE ICON ==========
  const getTypeIcon = (type) => {
    switch(type) {
      case 'movie': return <FaFilm className="text-purple-400" />;
      case 'series': return <FaTv className="text-blue-400" />;
      case 'song': return <FaMusic className="text-pink-400" />;
      case 'clip': return <FaPlay className="text-orange-400" />;
      case 'animation': return <FaFilm className="text-green-400" />;
      case 'quran': return <FaBookmark className="text-emerald-400" />;
      default: return <FaBookmark className="text-gray-400" />;
    }
  };

  // ========== GET ITEM TYPE LABEL ==========
  const getTypeLabel = (type) => {
    switch(type) {
      case 'movie': return 'فيلم';
      case 'series': return 'مسلسل';
      case 'song': return 'أغنية';
      case 'clip': return 'كليب';
      case 'animation': return 'رسوم متحركة';
      case 'quran': return 'سورة';
      default: return 'محتوى';
    }
  };

  // ========== GET ITEM TYPE COLOR ==========
  const getTypeColor = (type) => {
    switch(type) {
      case 'movie': return 'border-purple-500';
      case 'series': return 'border-blue-500';
      case 'song': return 'border-pink-500';
      case 'clip': return 'border-orange-500';
      case 'animation': return 'border-green-500';
      case 'quran': return 'border-emerald-500';
      default: return 'border-gray-500';
    }
  };

  // ========== GET ITEM TYPE BADGE COLOR ==========
  const getTypeBadgeColor = (type) => {
    switch(type) {
      case 'movie': return 'bg-purple-600/80';
      case 'series': return 'bg-blue-600/80';
      case 'song': return 'bg-pink-600/80';
      case 'clip': return 'bg-orange-600/80';
      case 'animation': return 'bg-green-600/80';
      case 'quran': return 'bg-emerald-600/80';
      default: return 'bg-gray-600/80';
    }
  };

  // ========== FILTER WATCHLIST ==========
  const filteredWatchlist = watchlist.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const title = (item.title || item.title_ar || '').toLowerCase();
    const matchSearch = title.includes(searchLower);
    const matchType = filterType === 'all' || item.item_type === filterType;
    return matchSearch && matchType;
  });

  // ========== PAGINATION ==========
  const totalPages = Math.ceil(filteredWatchlist.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredWatchlist.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ========== FORMAT DATE ==========
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // ========== STATS ==========
  const stats = {
    total: watchlist.length,
    movies: watchlist.filter(i => i.item_type === 'movie').length,
    series: watchlist.filter(i => i.item_type === 'series').length,
    songs: watchlist.filter(i => i.item_type === 'song').length,
    clips: watchlist.filter(i => i.item_type === 'clip').length,
    animation: watchlist.filter(i => i.item_type === 'animation').length,
    quran: watchlist.filter(i => i.item_type === 'quran').length
  };

  // ========== LOADING ==========
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل قائمة المشاهدة...</p>
        </div>
      </div>
    );
  }

  // ========== NOT AUTHENTICATED ==========
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FaBookmark className="text-6xl mx-auto mb-4 text-gray-500 opacity-30" />
          <h3 className="text-white text-xl font-bold mb-2">يرجى تسجيل الدخول</h3>
          <p className="text-gray-400 mb-4">يجب عليك تسجيل الدخول لعرض قائمة المشاهدة</p>
          <Link to="/login" className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* ====== HERO SECTION ====== */}
      <div className="relative h-[25vh] md:h-[30vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/70 via-black/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-cover bg-center" style={{ 
          backgroundImage: 'url(https://image.tmdb.org/t/p/original/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg)',
          filter: 'brightness(0.3)'
        }} />
        <div className="relative h-full w-full px-3 sm:px-4 md:px-6 lg:px-8 flex items-center z-20">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-400 hover:text-white transition p-2 hover:bg-gray-800 rounded-lg bg-black/50">
              <FaArrowLeft className="text-xl" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FaBookmark className="text-purple-400 text-3xl" />
                <h1 className="text-2xl md:text-3xl font-bold text-white">قائمتي</h1>
              </div>
              <p className="text-gray-300 text-sm md:text-base">
                {user && `مرحباً ${user.name} • `}
                <span className="text-purple-400">{stats.total}</span> عنصر في قائمتك
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4">
        {/* ====== STATS ====== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 mb-6">
          <div className="bg-gray-800/50 rounded-xl p-2 md:p-3 text-center border border-gray-700">
            <p className="text-gray-500 text-[10px] md:text-xs">📚 إجمالي</p>
            <p className="text-white text-lg md:text-xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-2 md:p-3 text-center border border-purple-700">
            <p className="text-gray-500 text-[10px] md:text-xs">🎬 أفلام</p>
            <p className="text-purple-400 text-lg md:text-xl font-bold">{stats.movies}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-2 md:p-3 text-center border border-blue-700">
            <p className="text-gray-500 text-[10px] md:text-xs">📺 مسلسلات</p>
            <p className="text-blue-400 text-lg md:text-xl font-bold">{stats.series}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-2 md:p-3 text-center border border-pink-700">
            <p className="text-gray-500 text-[10px] md:text-xs">🎵 أغاني</p>
            <p className="text-pink-400 text-lg md:text-xl font-bold">{stats.songs}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-2 md:p-3 text-center border border-orange-700">
            <p className="text-gray-500 text-[10px] md:text-xs">🎬 كليبات</p>
            <p className="text-orange-400 text-lg md:text-xl font-bold">{stats.clips}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-2 md:p-3 text-center border border-green-700">
            <p className="text-gray-500 text-[10px] md:text-xs">🎨 رسوم متحركة</p>
            <p className="text-green-400 text-lg md:text-xl font-bold">{stats.animation + stats.quran}</p>
          </div>
        </div>

        {/* ====== FILTERS & VIEW MODE ====== */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm md:text-base" />
            <input 
              type="text" 
              placeholder="بحث في قائمتي..." 
              value={searchTerm} 
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }} 
              className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 pl-10 pr-3 text-white focus:outline-none focus:border-purple-500 text-sm" 
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={filterType} 
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }} 
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="all">📂 الكل</option>
              <option value="movie">🎬 أفلام</option>
              <option value="series">📺 مسلسلات</option>
              <option value="song">🎵 أغاني</option>
              <option value="clip">🎬 كليبات</option>
              <option value="animation">🎨 رسوم متحركة</option>
              <option value="quran">🕌 قرآن</option>
            </select>
            <button 
              onClick={() => { setSearchTerm(''); setFilterType('all'); setCurrentPage(1); }} 
              className="bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition text-sm"
            >
              <FaTimes className="inline mr-1" /> إعادة تعيين
            </button>
          </div>
        </div>

        {/* ====== VIEW MODE TOGGLE ====== */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-400 text-sm">{filteredWatchlist.length} عنصر</p>
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => { setViewMode('grid'); localStorage.setItem('mylist_view_mode', 'grid'); }}
              className={`px-3 py-1.5 rounded-md transition text-sm flex items-center gap-1 ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            >
              <FaTh size={12} /> شبكة
            </button>
            <button
              onClick={() => { setViewMode('list'); localStorage.setItem('mylist_view_mode', 'list'); }}
              className={`px-3 py-1.5 rounded-md transition text-sm flex items-center gap-1 ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            >
              <FaThList size={12} /> قائمة
            </button>
          </div>
        </div>

        {/* ====== ERROR ====== */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400">
              <FaExclamationTriangle className="text-lg" />
              <p>{error}</p>
            </div>
            <button 
              onClick={refreshWatchlist} 
              className="text-white bg-red-600 px-4 py-1 rounded-lg text-sm hover:bg-red-700 transition"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* ====== CONTENT ====== */}
        {filteredWatchlist.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-700">
            {watchlist.length === 0 ? (
              <>
                <FaBookmark className="text-6xl mx-auto mb-4 opacity-30 text-gray-500" />
                <h3 className="text-white text-xl font-bold mb-2">قائمتك فارغة</h3>
                <p className="text-gray-400 mb-4">لم تقم بإضافة أي محتوى إلى قائمتك بعد</p>
                <Link to="/" className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
                  استكشف المحتوى
                </Link>
              </>
            ) : (
              <>
                <FaSearch className="text-6xl mx-auto mb-4 opacity-30 text-gray-500" />
                <h3 className="text-white text-xl font-bold mb-2">لا توجد نتائج</h3>
                <p className="text-gray-400">لم نجد محتوى يطابق بحثك</p>
                <button 
                  onClick={() => { setSearchTerm(''); setFilterType('all'); setCurrentPage(1); }} 
                  className="mt-4 text-purple-400 hover:text-purple-300"
                >
                  عرض الكل
                </button>
              </>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          // ====== GRID VIEW ======
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {paginatedItems.map((item) => (
              <div 
                key={item.id} 
                className={`group relative bg-gray-800 rounded-xl overflow-hidden border ${getTypeColor(item.item_type)} hover:border-purple-500/70 transition-all duration-300`}
              >
                <Link to={`/${item.item_type}/${item.item_id}`}>
                  <div className="relative aspect-[2/3] bg-gray-900">
                    <img 
                      src={item.poster || 'https://via.placeholder.com/300x450/1a1a2e/ffffff?text=🎬'} 
                      alt={item.title || item.title_ar} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x450/1a1a2e/ffffff?text=🎬';
                      }}
                    />
                    
                    {/* BADGE */}
                    <div className={`absolute top-2 right-2 ${getTypeBadgeColor(item.item_type)} backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1`}>
                      {getTypeIcon(item.item_type)}
                      <span className="text-white text-[9px]">{getTypeLabel(item.item_type)}</span>
                    </div>
                    
                    {item.rating > 0 && (
                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                        <FaStar className="text-yellow-400 text-[10px]" />
                        <span className="text-white text-[10px] font-semibold">{item.rating}</span>
                      </div>
                    )}
                    
                    {/* HOVER OVERLAY */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <h4 className="text-white font-bold text-sm truncate">
                        {item.title || item.title_ar}
                      </h4>
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        {item.year && <span>{item.year}</span>}
                        {item.genre && <span>• {item.genre}</span>}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedItem(item);
                          setShowRemoveModal(true);
                        }}
                        className="mt-2 w-full bg-red-600/80 text-white py-1.5 rounded-lg text-sm hover:bg-red-600 transition flex items-center justify-center gap-1"
                      >
                        <FaTrash size={12} /> إزالة من القائمة
                      </button>
                    </div>
                  </div>
                </Link>

                {/* INFO */}
                <div className="p-2">
                  <Link to={`/${item.item_type}/${item.item_id}`}>
                    <h3 className="text-white text-sm font-medium truncate hover:text-purple-400 transition">
                      {item.title || item.title_ar}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      <FaClock size={10} /> {formatDate(item.added_at)}
                    </span>
                    {item.rating > 0 && (
                      <span className="text-yellow-400 text-xs flex items-center gap-1">
                        <FaStar size={10} /> {item.rating}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // ====== LIST VIEW ======
          <div className="space-y-2">
            {paginatedItems.map((item) => (
              <div 
                key={item.id} 
                className="group bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition border border-gray-700 hover:border-purple-500/50"
              >
                <div className="flex gap-3">
                  <Link to={`/${item.item_type}/${item.item_id}`} className="flex-shrink-0">
                    <img 
                      src={item.poster || 'https://via.placeholder.com/300x450/1a1a2e/ffffff?text=🎬'} 
                      alt={item.title || item.title_ar} 
                      className="w-14 h-20 object-cover rounded"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x450/1a1a2e/ffffff?text=🎬';
                      }}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <Link to={`/${item.item_type}/${item.item_id}`}>
                        <h3 className="text-white font-semibold text-sm hover:text-purple-400 transition truncate">
                          {item.title || item.title_ar}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className={`${getTypeBadgeColor(item.item_type)} text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1`}>
                          {getTypeIcon(item.item_type)} {getTypeLabel(item.item_type)}
                        </span>
                        <button 
                          onClick={() => {
                            setSelectedItem(item);
                            setShowRemoveModal(true);
                          }}
                          className="text-red-400 hover:text-red-300 transition p-1"
                          title="إزالة من القائمة"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                      {item.year && <span>{item.year}</span>}
                      {item.genre && <span>• {item.genre}</span>}
                      {item.rating > 0 && (
                        <span className="flex items-center gap-0.5">
                          <FaStar className="text-yellow-400 text-[10px]" /> {item.rating}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <FaClock size={10} /> {formatDate(item.added_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Link 
                        to={`/${item.item_type}/${item.item_id}`} 
                        className="bg-purple-600 text-white px-3 py-0.5 rounded text-xs hover:bg-purple-700 transition"
                      >
                        مشاهدة
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ====== PAGINATION ====== */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button 
              onClick={() => goToPage(currentPage - 1)} 
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <FaChevronRight />
            </button>
            
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button 
                  key={i}
                  onClick={() => goToPage(pageNum)}
                  className={`w-10 h-10 rounded-lg transition ${
                    currentPage === pageNum 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              onClick={() => goToPage(currentPage + 1)} 
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <FaChevronLeft />
            </button>
          </div>
        )}
      </div>

      {/* ====== REMOVE MODAL ====== */}
      {showRemoveModal && selectedItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowRemoveModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold flex items-center gap-2">
                <FaTrash className="text-red-400" /> إزالة من القائمة
              </h3>
              <button onClick={() => setShowRemoveModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={selectedItem.poster || 'https://via.placeholder.com/60x80/1a1a2e/ffffff?text=🎬'} 
                  alt={selectedItem.title} 
                  className="w-12 h-16 object-cover rounded"
                />
                <div>
                  <p className="text-white font-bold">{selectedItem.title || selectedItem.title_ar}</p>
                  <p className="text-gray-400 text-sm flex items-center gap-1">
                    {getTypeIcon(selectedItem.item_type)} {getTypeLabel(selectedItem.item_type)}
                  </p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                هل أنت متأكد من إزالة هذا العنصر من قائمة المشاهدة؟
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => removeFromWatchlist(selectedItem.item_id, selectedItem.item_type)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                >
                  نعم، إزالة
                </button>
                <button 
                  onClick={() => setShowRemoveModal(false)} 
                  className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListPage;