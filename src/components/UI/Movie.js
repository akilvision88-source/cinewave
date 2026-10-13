import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';

const MovieCard = ({ movie }) => {
  return (
    <Link to={`/movie/${movie.id}`} className="block group">
      <div className="relative rounded-lg sm:rounded-xl overflow-hidden">
        <img 
          src={movie.poster} 
          alt={movie.title} 
          className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105" 
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {movie.rating && (
          <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-black/60 rounded-full px-1.5 py-0.5 sm:px-2 sm:py-0.5 flex items-center gap-0.5 sm:gap-1">
            <FaStar className="text-yellow-400 text-[10px] sm:text-xs" />
            <span className="text-white text-[10px] sm:text-xs">{movie.rating}</span>
          </div>
        )}
      </div>
      <h3 className="text-white font-semibold text-xs sm:text-sm mt-1 sm:mt-2 line-clamp-1">{movie.title}</h3>
      <p className="text-gray-400 text-[10px] sm:text-xs">{movie.year}</p>
    </Link>
  );
};

export default MovieCard;