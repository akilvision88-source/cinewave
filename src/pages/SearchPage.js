// src/pages/SearchPage.js - نسخة معدلة لاستخدام API
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import MovieCard from '../components/UI/MovieCard';
import { moviesAPI, seriesAPI, searchAPI } from '../services/api';
import { FaFilm, FaTv, FaSearch, FaSpinner } from 'react-icons/fa';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { language, t } = useLanguage();
  const [results, setResults] = useState({ movies: [], series: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults({ movies: [], series: [] });
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // استخدام searchAPI للبحث الشامل
        const searchResults = await searchAPI.searchAll(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        // Fallback: البحث بشكل منفصل
        const [movies, series] = await Promise.all([
          moviesAPI.search(query),
          seriesAPI.search(query)
        ]);
        setResults({ movies, series });
      } finally {
        setLoading(false);
      }
    };
    
    performSearch();
  }, [query]);

  const getMovieTitle = (movie) => {
    if (language === 'ar') return movie.title_ar || movie.title;
    if (language === 'fr') return movie.title_fr || movie.title;
    return movie.title;
  };

  const getSeriesTitle = (series) => {
    if (language === 'ar') return series.title_ar || series.title;
    if (language === 'fr') return series.title_fr || series.title;
    return series.title;
  };

  const totalResults = results.movies.length + results.series.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-center">
          <FaSpinner className="text-red-500 text-4xl animate-spin mx-auto mb-4" />
          <p className="text-gray-400">جاري البحث...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container-custom py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {t('search.resultsFor')} "{query}"
          </h1>
          <p className="text-gray-400">{totalResults} {t('search.results')}</p>
        </div>

        {/* Tabs */}
        {totalResults > 0 && (
          <div className="flex gap-2 border-b border-gray-800 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'all' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
            >
              الكل ({totalResults})
            </button>
            <button
              onClick={() => setActiveTab('movies')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'movies' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
            >
              <FaFilm className="inline ml-1" /> أفلام ({results.movies.length})
            </button>
            <button
              onClick={() => setActiveTab('series')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'series' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
            >
              <FaTv className="inline ml-1" /> مسلسلات ({results.series.length})
            </button>
          </div>
        )}

        {/* Results */}
        {totalResults === 0 ? (
          <div className="text-center py-12">
            <FaSearch className="text-gray-700 text-5xl mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لم يتم العثور على نتائج لـ "{query}"</p>
            <p className="text-gray-500 text-sm mt-2">حاول استخدام كلمات أخرى</p>
          </div>
        ) : (
          <>
            {/* Movies Results */}
            {(activeTab === 'all' || activeTab === 'movies') && results.movies.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FaFilm className="text-red-500" /> أفلام ({results.movies.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {results.movies.map((movie) => (
                    <Link key={movie.id} to={`/movie/${movie.id}`} className="block group">
                      <div className="relative rounded-lg overflow-hidden bg-gray-900">
                        <img src={movie.poster} alt={getMovieTitle(movie)} className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                          <h3 className="text-white font-semibold text-sm line-clamp-1">{getMovieTitle(movie)}</h3>
                          <p className="text-gray-400 text-xs">{movie.year}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Series Results */}
            {(activeTab === 'all' || activeTab === 'series') && results.series.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FaTv className="text-blue-500" /> مسلسلات ({results.series.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {results.series.map((series) => (
                    <Link key={series.id} to={`/series/${series.id}`} className="block group">
                      <div className="relative rounded-lg overflow-hidden bg-gray-900">
                        <img src={series.poster} alt={getSeriesTitle(series)} className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                          <h3 className="text-white font-semibold text-sm line-clamp-1">{getSeriesTitle(series)}</h3>
                          <p className="text-gray-400 text-xs">{series.year}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;