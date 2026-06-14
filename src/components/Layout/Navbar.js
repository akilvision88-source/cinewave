import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FaSearch, FaUser, FaBars, FaBell } from 'react-icons/fa';

const Navbar = ({ onMenuClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const isRTL = language === 'ar';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setIsSearchOpen(false);
  };

  return (
    <nav className={`fixed top-0 ${isRTL ? 'right-0 left-0' : 'left-0 right-0'} z-40 transition-all duration-300 ${isScrolled ? 'bg-black/95 backdrop-blur-md border-b border-gray-800' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
      <div className="container-custom py-3 md:py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onMenuClick} className="lg:hidden p-2 text-white rounded-lg hover:bg-gray-800 transition"><FaBars className="text-xl" /></button>
            <Link to="/" className="text-xl md:text-2xl font-bold text-white">Cine<span className="text-primary">Wave</span></Link>
          </div>
          <div className="hidden md:flex items-center gap-6"><Link to="/" className="text-white hover:text-primary transition">Accueil</Link><Link to="/movies" className="text-white hover:text-primary transition">Films</Link><Link to="/series" className="text-white hover:text-primary transition">Séries</Link></div>
          <div className="flex items-center gap-2 md:gap-3">
            {isSearchOpen ? (<form onSubmit={handleSearch} className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher..." className="w-48 md:w-64 bg-gray-900 border border-gray-700 rounded-full py-2 px-4 text-white text-sm focus:outline-none focus:border-primary" /></form>) : (<button onClick={() => setIsSearchOpen(true)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><FaSearch className="text-lg" /></button>)}
            <div className="relative group"><button className="flex items-center gap-1 px-2 py-1.5 bg-gray-800 rounded-lg text-white text-sm">{language === 'fr' && '🇫🇷 FR'}{language === 'en' && '🇬🇧 EN'}{language === 'ar' && '🇸🇦 AR'}</button><div className="absolute right-0 mt-2 w-24 bg-gray-900 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50"><button onClick={() => changeLanguage('fr')} className="w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">🇫🇷 Français</button><button onClick={() => changeLanguage('en')} className="w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">🇬🇧 English</button><button onClick={() => changeLanguage('ar')} className="w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">🇸🇦 العربية</button></div></div>
            <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><FaBell className="text-lg" /></button>
            <Link to="/login" className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><FaUser className="text-lg" /></Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;