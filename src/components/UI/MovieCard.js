// src/components/UI/MovieCard.js - زر تشغيل احترافي
import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaPlay, FaCalendarAlt, FaClock, FaEye } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';

const MovieCard = ({ movie, showType = false }) => {
  const { language, t } = useLanguage();

  const getTitle = () => {
    if (language === 'ar') return movie.title_ar || movie.titleAr || movie.title;
    if (language === 'fr') return movie.title_fr || movie.titleFr || movie.title;
    return movie.title;
  };

  const isNew =
    movie.created_at &&
    Date.now() - new Date(movie.created_at).getTime() < 30 * 24 * 60 * 60 * 1000;

  return (
    <Link to={`/movie/${movie.id}`} className="block group/card">
      <div className="relative rounded-xl overflow-hidden bg-gray-900 shadow-lg shadow-black/50 group-hover/card:shadow-red-600/40 transition-all duration-500 group-hover/card:-translate-y-1.5">

        <div className="relative overflow-hidden">
          <img
            src={movie.poster || movie.backdrop}
            alt={getTitle()}
            className="w-full aspect-[2/3] object-cover transition-transform duration-700 group-hover/card:scale-110"
            loading="lazy"
            onError={(e) => {
              e.target.src =
                'https://via.placeholder.com/300x450/1a1a1a/666666?text=No+Image';
            }}
          />

          {/* Overlay داكن */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* ✨ زر التشغيل الاحترافي (Netflix Style) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-300 pointer-events-none">
            <div className="relative scale-0 group-hover/card:scale-100 transition-transform duration-500 delay-100">
              {/* حلقة التوهج الخارجية */}
              <span className="absolute inset-0 rounded-full bg-white/30 animate-ping opacity-75" />
              
              {/* الزر الرئيسي */}
              <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center shadow-2xl shadow-white/50 ring-2 ring-white/40 hover:scale-110 transition-transform duration-300">
                <FaPlay className="text-black text-base md:text-lg ml-1" />
              </div>
            </div>
          </div>

          {/* Badge "جديد" */}
          {isNew && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-pink-600 rounded-full px-2 py-0.5 shadow-lg shadow-red-600/50 z-10">
              <span className="text-white text-[9px] font-bold">NEW</span>
            </div>
          )}

          {/* Badge النوع */}
          {showType && !isNew && (
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/20 z-10">
              <span className="text-white text-[9px] font-bold">
                {movie.type === 'series' ? t('common.series') : t('common.movie')}
              </span>
            </div>
          )}

          {/* شريط التقييم أسفل الصورة */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1">
                <FaStar className="text-yellow-400 text-[9px]" />
                <span className="text-white font-bold">{movie.rating || '?'}</span>
                <span className="text-gray-400">/10</span>
              </div>
              {movie.views > 0 && (
                <div className="flex items-center gap-1 text-gray-300">
                  <FaEye className="text-[9px]" />
                  <span>
                    {movie.views > 1000
                      ? `${(movie.views / 1000).toFixed(1)}K`
                      : movie.views}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* شارة التقييم الثابتة */}
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md rounded-full px-1.5 py-0.5 flex items-center gap-0.5 border border-yellow-500/30 group-hover/card:opacity-0 transition-opacity duration-300">
          <FaStar className="text-yellow-400 text-[10px]" />
          <span className="text-white text-[10px] font-bold">
            {movie.rating || '?'}
          </span>
        </div>
      </div>

      {/* المعلومات */}
      <div className="mt-2 px-0.5">
        <h3 className="text-white font-semibold text-xs line-clamp-1 group-hover/card:text-red-500 transition-colors duration-300">
          {getTitle()}
        </h3>
        <div className="flex items-center gap-1.5 text-gray-400 text-[10px] mt-1">
          <FaCalendarAlt className="text-[9px]" />
          <span>{movie.year || '—'}</span>
          {movie.duration && (
            <>
              <span className="w-1 h-1 bg-gray-600 rounded-full" />
              <FaClock className="text-[9px]" />
              <span className="line-clamp-1">{movie.duration}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;