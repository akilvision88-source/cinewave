// src/components/Home/Spotlight.jsx
import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlay, FaStar, FaFire } from 'react-icons/fa';

const isValidThumbnail = (url) => {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (!t) return false;
  if (/placeholder\.com|via\.placeholder/i.test(t)) return false;
  return /^(https?:|\/|data:image\/)/i.test(t);
};

const Spotlight = memo(({ items = [] }) => {
  const validItems = items.filter((i) => i && isValidThumbnail(i.poster || i.backdrop));
  if (validItems.length < 3) return null;

  const [featured, ...rest] = validItems;

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-gradient-to-b from-primary to-transparent rounded-full" />
        <div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-white
                         tracking-tight">
            تحت الضوء
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm">
            اختيارات المحرر المميزة
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Featured - large */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7"
        >
          <Link
            to={`/movie/${featured.id}`}
            className="group relative block rounded-2xl overflow-hidden
                       aspect-[16/10] lg:aspect-auto lg:h-full
                       border border-white/10 shadow-2xl shadow-black/80"
          >
            <img
              src={featured.backdrop || featured.poster}
              alt={featured.title}
              className="w-full h-full object-cover transition-transform duration-700
                         group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50
                            to-transparent" />

            {/* Featured badge */}
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-primary rounded-full
                            shadow-lg shadow-primary/50 flex items-center gap-1.5">
              <FaFire className="text-white text-[10px]" />
              <span className="text-white text-[10px] font-black tracking-wider">
                SPOTLIGHT
              </span>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-black
                             text-white mb-2 leading-tight">
                {featured.title}
              </h3>
              <p className="text-gray-300 text-xs sm:text-sm mb-4 line-clamp-2 max-w-lg">
                {featured.description || 'اكتشف هذه التحفة الفنية المميزة'}
              </p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-3 py-1
                                bg-black/60 backdrop-blur-md rounded-full
                                border border-yellow-500/30">
                  <FaStar className="text-yellow-400 text-[10px]" />
                  <span className="text-white font-bold text-xs">
                    {featured.rating || '?'}
                  </span>
                </span>
                <span className="px-4 py-2 bg-white text-black rounded-full
                                text-xs font-bold flex items-center gap-1.5
                                group-hover:scale-105 transition-transform">
                  <FaPlay className="text-[9px]" />
                  شاهد الآن
                </span>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Side items */}
        <div className="lg:col-span-5 grid grid-cols-2 lg:grid-cols-1 gap-4">
          {rest.slice(0, 2).map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                to={`/movie/${item.id}`}
                className="group relative block rounded-2xl overflow-hidden
                           aspect-[16/10] lg:aspect-[16/9]
                           border border-white/10 shadow-xl shadow-black/60"
              >
                <img
                  src={item.backdrop || item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700
                             group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40
                                to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <h3 className="font-display text-sm sm:text-base md:text-lg font-bold
                                 text-white line-clamp-1 mb-1">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-gray-300">
                    <FaStar className="text-yellow-400 text-[9px]" />
                    <span>{item.rating || '?'}</span>
                    <span>•</span>
                    <span>{item.year}</span>
                  </div>
                </div>

                <div className="absolute top-3 right-3 w-9 h-9 rounded-full
                                bg-white/95 flex items-center justify-center
                                opacity-0 group-hover:opacity-100
                                scale-75 group-hover:scale-100
                                transition-all duration-300">
                  <FaPlay className="text-black text-[10px] ml-0.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});

Spotlight.displayName = 'Spotlight';
export default Spotlight;