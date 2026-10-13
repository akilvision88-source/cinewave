// src/components/Home/FeaturedTabs.jsx
import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollableRow from '../UI/ScrollableRow';
import MovieCard from '../UI/MovieCard';
import SeriesCard from '../UI/SeriesCard';
import { FaFire, FaStar, FaClock } from 'react-icons/fa';

const TABS = [
  { id: 'trending', label: 'الأكثر رواجاً', icon: FaFire,  color: 'text-orange-400' },
  { id: 'top',      label: 'الأعلى تقييماً', icon: FaStar,  color: 'text-yellow-400' },
  { id: 'new',      label: 'أضيف حديثاً',   icon: FaClock, color: 'text-cyan-400' },
];

const FeaturedTabs = memo(({ movies = [], series = [] }) => {
  const [activeTab, setActiveTab] = useState('trending');

  // محاكاة بيانات مختلفة لكل تبويب
  const getItems = () => {
    const all = [...movies, ...series];
    switch (activeTab) {
      case 'trending':
        return all.slice(0, 12);
      case 'top':
        return [...all].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 12);
      case 'new':
        return [...all]
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .slice(0, 12);
      default:
        return all.slice(0, 12);
    }
  };

  const items = getItems();

  if (!items.length) return null;

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-white
                         tracking-tight">
            اكتشف
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            اختر ما يناسب مزاجك
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-full border border-white/10
                        overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-full
                            text-xs sm:text-sm font-semibold whitespace-nowrap
                            transition-all duration-300 ${
                              active
                                ? 'text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
              >
                {active && (
                  <motion.span
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary rounded-full shadow-lg shadow-primary/40"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`relative text-xs ${active ? '' : tab.color}`} />
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <ScrollableRow
            items={items}
            itemWidth="w-[140px] xs:w-[150px] sm:w-[170px] md:w-[190px] lg:w-[210px]"
            renderItem={(item) =>
              item.seasons !== undefined
                ? <SeriesCard serie={item} />
                : <MovieCard movie={item} />
            }
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

FeaturedTabs.displayName = 'FeaturedTabs';
export default FeaturedTabs;