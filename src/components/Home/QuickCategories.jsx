// src/components/Home/QuickCategories.jsx
import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaFilm, FaTv, FaMagic, FaMusic, FaFire,
  FaStar, FaClock, FaGlobe,
} from 'react-icons/fa';

const CATEGORIES = [
  { id: 'movies',    label: 'أفلام',       icon: FaFilm,   path: '/movies',    color: 'from-rose-500 to-red-700',       glow: 'shadow-rose-500/40' },
  { id: 'series',    label: 'مسلسلات',      icon: FaTv,     path: '/series',    color: 'from-blue-500 to-indigo-700',    glow: 'shadow-blue-500/40' },
  { id: 'animation', label: 'رسوم متحركة',  icon: FaMagic,  path: '/animation', color: 'from-purple-500 to-fuchsia-700', glow: 'shadow-purple-500/40' },
  { id: 'clips',     label: 'كليبات',       icon: FaMusic,  path: '/clips',     color: 'from-emerald-500 to-teal-700',   glow: 'shadow-emerald-500/40' },
  { id: 'trending',  label: 'الأكثر رواجاً', icon: FaFire,   path: '/trending',  color: 'from-orange-500 to-red-600',     glow: 'shadow-orange-500/40' },
  { id: 'top',       label: 'الأعلى تقييماً', icon: FaStar,   path: '/top',       color: 'from-amber-500 to-yellow-600',   glow: 'shadow-amber-500/40' },
  { id: 'new',       label: 'جديد',          icon: FaClock,  path: '/new',       color: 'from-cyan-500 to-blue-600',      glow: 'shadow-cyan-500/40' },
  { id: 'genres',    label: 'التصنيفات',    icon: FaGlobe,  path: '/genres',    color: 'from-pink-500 to-rose-600',      glow: 'shadow-pink-500/40' },
];

const QuickCategories = memo(() => {
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8">
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
            >
              <Link
                to={cat.path}
                className="category-pill group flex flex-col items-center gap-2 p-3 sm:p-4
                           rounded-2xl bg-white/5 hover:bg-white/10
                           border border-white/10 hover:border-white/20
                           transition-all duration-300"
              >
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl
                              bg-gradient-to-br ${cat.color}
                              flex items-center justify-center
                              shadow-lg ${cat.glow}
                              group-hover:scale-110 group-hover:rotate-6
                              transition-transform duration-300`}
                >
                  <Icon className="text-white text-sm sm:text-base" />
                </div>
                <span className="text-white text-[10px] sm:text-xs font-semibold text-center">
                  {cat.label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

QuickCategories.displayName = 'QuickCategories';
export default QuickCategories;