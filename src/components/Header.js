// src/components/Header.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaHome, FaFilm, FaTv, FaMusic, FaUser, 
  FaSignInAlt, FaUserPlus, FaBookmark, FaSearch,
  FaBars, FaTimes, FaCrown, FaHeart
} from 'react-icons/fa';

const Header = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    setIsAuthenticated(!!token);
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userPlan');
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* ====== LOGO ====== */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CW</span>
            </div>
            <span className="text-white font-bold text-xl hidden sm:block">CineWave</span>
          </Link>

          {/* ====== NAVIGATION LINKS (Desktop) ====== */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-300 hover:text-white transition text-sm flex items-center gap-1">
              <FaHome size={14} /> الرئيسية
            </Link>
            <Link to="/movies" className="text-gray-300 hover:text-white transition text-sm flex items-center gap-1">
              <FaFilm size={14} /> أفلام
            </Link>
            <Link to="/series" className="text-gray-300 hover:text-white transition text-sm flex items-center gap-1">
              <FaTv size={14} /> مسلسلات
            </Link>
            <Link to="/songs" className="text-gray-300 hover:text-white transition text-sm flex items-center gap-1">
              <FaMusic size={14} /> أغاني
            </Link>
            
            {/* ✅ زر قائمتي - My List */}
            {isAuthenticated && (
              <Link to="/mylist" className="text-purple-400 hover:text-purple-300 transition text-sm flex items-center gap-1">
                <FaBookmark size={14} /> قائمتي
              </Link>
            )}
          </nav>

          {/* ====== SEARCH & AUTH ====== */}
          <div className="flex items-center gap-3">
            {/* Search Bar (Desktop) */}
            <form onSubmit={handleSearch} className="hidden lg:flex items-center bg-gray-800 rounded-lg px-3 py-1.5">
              <input 
                type="text" 
                placeholder="بحث..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-white text-sm outline-none w-32 focus:w-48 transition-all duration-300"
              />
              <button type="submit" className="text-gray-400 hover:text-white">
                <FaSearch size={14} />
              </button>
            </form>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="text-gray-300 hover:text-white transition">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-400 transition text-sm hidden sm:block"
                >
                  خروج
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-gray-300 hover:text-white transition text-sm flex items-center gap-1">
                  <FaSignInAlt size={14} /> دخول
                </Link>
                <Link to="/register" className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition text-sm flex items-center gap-1">
                  <FaUserPlus size={14} /> تسجيل
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-400 hover:text-white transition p-1"
            >
              {mobileMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
            </button>
          </div>
        </div>

        {/* ====== MOBILE MENU ====== */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-800 py-4 px-2 space-y-3">
            {/* Search Bar (Mobile) */}
            <form onSubmit={handleSearch} className="flex items-center bg-gray-800 rounded-lg px-3 py-2">
              <input 
                type="text" 
                placeholder="بحث..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-white text-sm outline-none flex-1"
              />
              <button type="submit" className="text-gray-400 hover:text-white">
                <FaSearch size={16} />
              </button>
            </form>

            {/* Navigation Links */}
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-white transition py-2 px-3 rounded-lg hover:bg-gray-800">
              <FaHome className="inline ml-2" /> الرئيسية
            </Link>
            <Link to="/movies" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-white transition py-2 px-3 rounded-lg hover:bg-gray-800">
              <FaFilm className="inline ml-2" /> أفلام
            </Link>
            <Link to="/series" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-white transition py-2 px-3 rounded-lg hover:bg-gray-800">
              <FaTv className="inline ml-2" /> مسلسلات
            </Link>
            <Link to="/songs" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-white transition py-2 px-3 rounded-lg hover:bg-gray-800">
              <FaMusic className="inline ml-2" /> أغاني
            </Link>

            {/* ✅ زر قائمتي في القائمة الجانبية للهواتف */}
            {isAuthenticated && (
              <Link to="/mylist" onClick={() => setMobileMenuOpen(false)} className="block text-purple-400 hover:text-purple-300 transition py-2 px-3 rounded-lg hover:bg-gray-800">
                <FaBookmark className="inline ml-2" /> قائمتي
              </Link>
            )}

            {!isAuthenticated && (
              <div className="pt-3 border-t border-gray-800 space-y-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-white transition py-2 px-3 rounded-lg hover:bg-gray-800">
                  <FaSignInAlt className="inline ml-2" /> تسجيل الدخول
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block bg-red-600 text-white py-2 px-3 rounded-lg text-center hover:bg-red-700 transition">
                  <FaUserPlus className="inline ml-2" /> إنشاء حساب
                </Link>
              </div>
            )}

            {isAuthenticated && (
              <button 
                onClick={handleLogout}
                className="block w-full text-left text-red-400 hover:text-red-300 transition py-2 px-3 rounded-lg hover:bg-gray-800"
              >
                خروج
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;