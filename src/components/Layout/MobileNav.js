// src/components/Layout/MobileNav.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FaBars, FaSearch, FaBookmark } from 'react-icons/fa';

const MobileNav = ({ onMenuToggle }) => {
  const { t } = useLanguage();
  const location = useLocation();

  // التحقق من وجود مستخدم مسجل
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true' || !!localStorage.getItem('token');

  return (
    <>
      {/* شريط التنقل العلوي للهواتف */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 z-40 lg:hidden">
        <div className="flex flex-col">
          {/* الصف الأول: زر القائمة والشعار وزر البحث */}
          <div className="flex items-center justify-between px-3 py-1">
            {/* زر فتح القائمة - على اليسار */}
            <button
              onClick={onMenuToggle}
              className="p-1.5 rounded-full bg-gray-800 text-white hover:bg-red-600 transition"
            >
              <FaBars className="text-base" />
            </button>
            
            {/* الشعار - في المنتصف */}
            <div className="flex-1 text-center">
              <h1 className="text-white font-bold text-base">
                Akil<span className="text-red-500">Tv</span>
              </h1>
            </div>
            
            {/* أزرار البحث وقائمتي - على اليمين */}
            <div className="flex items-center gap-1">
              {/* ✅ زر قائمتي - يظهر فقط للمستخدمين المسجلين */}
              {isAuthenticated && (
                <Link 
                  to="/mylist" 
                  className="p-1.5 rounded-full bg-purple-600/50 text-white hover:bg-purple-600 transition"
                  title="قائمتي"
                >
                  <FaBookmark className="text-base" />
                </Link>
              )}
              
              {/* زر البحث */}
              <Link 
                to="/search" 
                className="p-1.5 rounded-full bg-gray-800 text-white hover:bg-red-600 transition"
              >
                <FaSearch className="text-base" />
              </Link>
            </div>
          </div>
          
          {/* الصف الثاني: عبارة التوقيع */}
          <div className="text-center pb-0.5">
            <p className="text-gray-400 text-[8px] tracking-wider leading-none">
              By Mohcine Akil © 2026
            </p>
          </div>
        </div>
      </div>
      
      {/* إضافة مساحة فارغة في الأعلى */}
      <div className="h-10 lg:hidden" />
    </>
  );
};

export default MobileNav;