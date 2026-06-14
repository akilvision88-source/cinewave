import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FaSearch, FaTv, FaExpand, FaCompress, FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import ReactPlayer from 'react-player';
import { channelsAPI } from '../services/api';

const ChannelsPage = () => {
  const { language, t } = useLanguage();
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  const categories = [
    { id: 'all', label: 'all', icon: '🌐' },
    { id: 'arabic', label: 'arabic', icon: '🇸🇦' },
    { id: 'foreign', label: 'foreign', icon: '🌍' },
    { id: 'sports', label: 'sports', icon: '⚽' },
    { id: 'movies', label: 'movies', icon: '🎬' },
    { id: 'kids', label: 'kids', icon: '🧸' },
    { id: 'religious', label: 'religious', icon: '🕌' },
    { id: 'news', label: 'news', icon: '📰' },
    { id: 'music', label: 'music', icon: '🎵' },
  ];

  // تحميل القنوات من API
  useEffect(() => {
    const loadChannels = async () => {
      setLoading(true);
      try {
        const data = await channelsAPI.getAll();
        setChannels(data);
        setFilteredChannels(data);
      } catch (error) {
        console.error('خطأ في تحميل القنوات:', error);
        setChannels([]);
        setFilteredChannels([]);
      } finally {
        setLoading(false);
      }
    };
    loadChannels();
  }, []);

  // فلترة القنوات
  useEffect(() => {
    let results = [...channels];
    if (searchTerm) {
      results = results.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.nameAr && c.nameAr.includes(searchTerm))
      );
    }
    if (selectedCategory !== 'all') {
      results = results.filter(c => c.category === selectedCategory);
    }
    setFilteredChannels(results);
  }, [searchTerm, selectedCategory, channels]);

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!isFullscreen) {
      container?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const getChannelName = (channel) => {
    if (language === 'ar') return channel.nameAr || channel.name;
    return channel.name;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header Section - ممتد بالكامل */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <FaTv className="text-red-500 text-2xl sm:text-3xl" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{t('channels.title')}</h1>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative w-full">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm sm:text-base" />
            <input 
              type="text" 
              placeholder={t('channels.search')} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 pl-10 pr-3 text-white focus:outline-none focus:border-red-500 text-sm sm:text-base" 
            />
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {categories.map((cat) => (
              <button 
                key={cat.id} 
                onClick={() => setSelectedCategory(cat.id)} 
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm flex items-center gap-1 transition ${selectedCategory === cat.id ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                <span className="text-sm sm:text-base">{cat.icon}</span> 
                <span className="hidden xs:inline">{t(`channels.${cat.label}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Channels Grid and Player */}
        <div className="grid lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* قائمة القنوات */}
          <div className="lg:col-span-1 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-2 sm:p-3 bg-gray-800 border-b border-gray-700">
              <h3 className="text-white font-semibold text-sm sm:text-base">📡 {filteredChannels.length} {t('channels.title')}</h3>
            </div>
            <div className="max-h-[400px] md:max-h-[500px] lg:max-h-[600px] overflow-y-auto">
              {filteredChannels.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-gray-400 text-sm sm:text-base">{t('channels.noChannels')}</p>
                </div>
              ) : (
                filteredChannels.map((channel) => (
                  <div 
                    key={channel.id} 
                    onClick={() => { setSelectedChannel(channel); setIsPlaying(true); }} 
                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 cursor-pointer transition hover:bg-gray-800 ${selectedChannel?.id === channel.id ? 'bg-red-600/20 border-l-4 border-red-500' : ''}`}
                  >
                    <img src={channel.logo} alt={channel.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain bg-gray-800 p-1" />
                    <div>
                      <p className="text-white font-medium text-xs sm:text-sm">{getChannelName(channel)}</p>
                      <p className="text-gray-500 text-[10px] sm:text-xs">{t(`channels.${channel.category}`)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* مشغل القناة */}
          <div className="lg:col-span-2">
            {selectedChannel ? (
              <div ref={containerRef} className="relative bg-black rounded-xl overflow-hidden shadow-xl">
                <div className="relative aspect-video">
                  <ReactPlayer 
                    ref={playerRef} 
                    url={selectedChannel.url} 
                    playing={isPlaying} 
                    volume={volume} 
                    muted={muted} 
                    width="100%" 
                    height="100%" 
                    className="react-player" 
                    config={{ file: { forceHLS: true, attributes: { controlsList: 'nodownload' } } }} 
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-2 sm:p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-red-500 transition p-1">
                        {isPlaying ? <FaPause size={14} className="sm:text-base" /> : <FaPlay size={14} className="sm:text-base" />}
                      </button>
                      <button onClick={() => setMuted(!muted)} className="text-white hover:text-red-500 transition p-1">
                        {muted ? <FaVolumeMute size={14} className="sm:text-base" /> : <FaVolumeUp size={14} className="sm:text-base" />}
                      </button>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={volume} 
                        onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }} 
                        className="w-16 sm:w-24 h-1 bg-gray-600 rounded-lg cursor-pointer accent-red-500" 
                      />
                    </div>
                    <button onClick={toggleFullscreen} className="text-white hover:text-red-500 transition p-1">
                      {isFullscreen ? <FaCompress size={14} className="sm:text-base" /> : <FaExpand size={14} className="sm:text-base" />}
                    </button>
                  </div>
                </div>
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-0.5 sm:px-3 sm:py-1">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <img src={selectedChannel.logo} alt="" className="w-4 h-4 sm:w-6 sm:h-6 rounded" />
                    <span className="text-white text-[10px] sm:text-sm font-semibold">{getChannelName(selectedChannel)}</span>
                    <span className="text-green-400 text-[8px] sm:text-xs animate-pulse">● {t('channels.live')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-xl aspect-video flex flex-col items-center justify-center border border-gray-800">
                <FaTv className="text-gray-700 text-3xl sm:text-5xl mb-2 sm:mb-3" />
                <p className="text-gray-500 text-sm sm:text-base">{t('channels.selectChannel')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelsPage;