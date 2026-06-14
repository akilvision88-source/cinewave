import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { 
  FaHome, FaFilm, FaTv, FaFire, FaList, FaHistory, 
  FaThumbsUp, FaClock, FaTv as FaChannel, FaUser,
  FaChevronLeft, FaChevronRight, FaMusic, FaStar, FaQuran, 
  FaSignInAlt, FaSignOutAlt, FaCrown, FaTimes, FaPlay
} from 'react-icons/fa';

const Sidebar = ({ isOpen, onToggle }) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isRTL = language === 'ar';
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated') === 'true';
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    setIsAuthenticated(auth || !!token);
    setUserRole(role);
    
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setUserPlan(parsedUser.plan || 'free');
    }
    
    const handleStorageChange = () => {
      const newAuth = localStorage.getItem('isAuthenticated') === 'true';
      setIsAuthenticated(newAuth);
      const newUser = localStorage.getItem('user');
      if (newUser) setUser(JSON.parse(newUser));
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userPlan');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
    if (isMobile && onToggle) onToggle();
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile && onToggle) onToggle();
  };

  // قائمة العناصر الرئيسية
  const mainMenuItems = [
    { path: '/', icon: FaHome, key: 'nav.home' },
    { path: '/movies', icon: FaFilm, key: 'nav.movies' },
    { path: '/series', icon: FaTv, key: 'nav.series' },
    { path: '/animation', icon: FaPlay, key: 'nav.animation' },
    { path: '/trending', icon: FaFire, key: 'nav.trending' },
    { path: '/channels', icon: FaChannel, key: 'nav.channels' },
    { path: '/clips', icon: FaMusic, key: 'nav.clips' },
    { path: '/songs', icon: FaMusic, key: 'nav.songs' },
    { path: '/quran', icon: FaQuran, key: 'nav.quran' },
  ];

  // قائمة العناصر التي تظهر فقط للمستخدمين المسجلين
  const userMenuItems = [
    { path: '/my-list', icon: FaList, key: 'nav.myList' },
    { path: '/history', icon: FaHistory, key: 'nav.history' },
    { path: '/liked', icon: FaThumbsUp, key: 'nav.liked' },
    { path: '/watch-later', icon: FaClock, key: 'nav.watchLater' },
  ];

  const getPlanBadge = () => {
    if (userPlan === 'premium') {
      return { color: 'from-purple-600 to-purple-500', text: t('subscription.premium'), icon: <FaCrown className="text-yellow-400" /> };
    } else if (userPlan === 'standard') {
      return { color: 'from-blue-600 to-blue-500', text: t('subscription.standard'), icon: <FaStar className="text-blue-400" /> };
    }
    return { color: 'from-gray-600 to-gray-500', text: t('subscription.free'), icon: null };
  };

  const planBadge = getPlanBadge();

  // نسخة الهواتف
  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div className="fixed inset-0 bg-black/70 z-40 transition-opacity duration-300" onClick={onToggle} />
        )}
        
        <aside 
          className={`fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-80 bg-gradient-to-b from-gray-900 to-black shadow-2xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto ${
            isOpen ? 'transform translate-x-0' : `transform ${isRTL ? 'translate-x-full' : '-translate-x-full'}`
          }`}
        >
          {/* رأس القائمة مع العبارة تحت الشعار - مسافة قصيرة */}
          <div className="flex flex-col border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
            <div className="flex items-center justify-between p-4 pb-1">
              <h1 className="text-xl font-bold text-white">Akil<span className="text-red-600">Tv</span></h1>
              <button onClick={onToggle} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition">
                <FaTimes className="text-xl" />
              </button>
            </div>
            {/* عبارة التوقيع تحت الشعار مباشرة */}
            <div className="text-center pb-3">
              <p className="text-gray-500 text-[9px] tracking-wider leading-none text-left">
              
              </p>
            </div>
          </div>

          {isAuthenticated && (
            <div className="p-4 border-b border-gray-800 bg-gray-800/30">
              <div className="flex items-center gap-3">
                <img src={user?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt={user?.name} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-white font-semibold">{user?.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {planBadge.icon}
                    <span className={`text-xs bg-gradient-to-r ${planBadge.color} px-2 py-0.5 rounded-full text-white`}>
                      {planBadge.text}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <nav className="p-3 space-y-1 pb-20">
            {mainMenuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <item.icon className="text-xl" />
                <span className="text-sm">{t(item.key)}</span>
              </button>
            ))}

            {isAuthenticated && (
              <div className="pt-2 mt-2 border-t border-gray-800">
                <p className="text-[10px] text-gray-600 px-3 mb-1">👤 حسابي</p>
                {userMenuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <item.icon className="text-xl" />
                    <span className="text-sm">{t(item.key)}</span>
                  </button>
                ))}
              </div>
            )}

            {!isAuthenticated && (
              <div className="pt-2 mt-2 border-t border-gray-800 space-y-2">
                <button
                  onClick={() => handleNavigation('/login')}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                >
                  <FaSignInAlt className="text-xl" />
                  <span className="text-sm">{t('nav.login')}</span>
                </button>
                <button
                  onClick={() => handleNavigation('/subscription-plans')}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                >
                  <FaCrown className="text-xl" />
                  <span className="text-sm">{t('subscription.title')}</span>
                </button>
              </div>
            )}

            {isAuthenticated && (
              <div className="pt-2 mt-2 border-t border-gray-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <FaSignOutAlt className="text-xl" />
                  <span className="text-sm">{t('nav.logout')}</span>
                </button>
              </div>
            )}
          </nav>
        </aside>
      </>
    );
  }

  // نسخة الحاسوب
  return (
    <aside className={`fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full bg-gradient-to-b from-gray-900 to-black border-r border-gray-800 z-40 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} overflow-y-auto`}>
      <div className={`h-16 flex items-center ${isOpen ? 'justify-between px-4' : 'justify-center'} border-b border-gray-800 sticky top-0 bg-gray-900 z-10`}>
        {isOpen ? (
          <>
            <h1 className="text-xl font-bold text-white">Akil<span className="text-red-600">Tv</span></h1>
            <button onClick={onToggle} className="p-1 text-gray-400 hover:text-white rounded-lg">
              {isRTL ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
          </>
        ) : (
          <button onClick={onToggle} className="p-2 text-gray-400 hover:text-white rounded-lg">
            {isRTL ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
        )}
      </div>

      <nav className="p-3 space-y-1">
        {mainMenuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800 ${!isOpen && 'justify-center'}`}
          >
            <item.icon className="text-xl" />
            {isOpen && <span className="text-sm">{t(item.key)}</span>}
          </button>
        ))}

        {isAuthenticated && isOpen && (
          <div className="pt-2 mt-2 border-t border-gray-800">
            <p className="text-[10px] text-gray-600 px-3 mb-1 mt-2">👤 حسابي</p>
            {userMenuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <item.icon className="text-xl" />
                <span className="text-sm">{t(item.key)}</span>
              </button>
            ))}
          </div>
        )}

        {/* عبارة التوقيع في أسفل القائمة للحاسوب - مسافة قصيرة */}
        {isOpen && (
          <div className="pt-2 mt-2 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-[9px] tracking-wider">
              By Mohcine Akil © 2026
            </p>
          </div>
        )}
      </nav>

      <div className={`absolute bottom-0 ${isRTL ? 'right-0' : 'left-0'} right-0 p-3 border-t border-gray-800 bg-gray-900 ${!isOpen && 'flex justify-center'}`}>
        {isAuthenticated ? (
          <div className="w-full">
            <div className="flex items-center gap-2 mb-2 p-2 bg-gray-800/50 rounded-lg">
              <img src={user?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt={user?.name} className="w-8 h-8 rounded-full" />
              {isOpen && (
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                  <div className="flex items-center gap-1">
                    {planBadge.icon}
                    <span className={`text-xs bg-gradient-to-r ${planBadge.color} px-1.5 py-0.5 rounded-full text-white`}>
                      {planBadge.text}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition ${!isOpen && 'justify-center'}`}
            >
              <FaSignOutAlt className="text-xl" />
              {isOpen && <span className="text-sm">{t('nav.logout')}</span>}
            </button>
          </div>
        ) : (
          <div className="w-full space-y-2">
            <button
              onClick={() => handleNavigation('/login')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition ${!isOpen && 'justify-center'}`}
            >
              <FaSignInAlt className="text-xl" />
              {isOpen && <span className="text-sm">{t('nav.login')}</span>}
            </button>
            <button
              onClick={() => handleNavigation('/subscription-plans')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition ${!isOpen && 'justify-center'}`}
            >
              <FaCrown className="text-xl" />
              {isOpen && <span className="text-sm">{t('subscription.title')}</span>}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;