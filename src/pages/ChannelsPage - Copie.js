// src/pages/ChannelsPage.js - قنوات مباشرة بنفس النمط الموحّد
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FaSearch, FaTv, FaExpand, FaCompress, FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { motion } from 'framer-motion';
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

  useEffect(() => {
    let results = [...channels];
    if (searchTerm) {
      results = results.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      <div className="flex justify-center items-center h-screen bg-[#1f242d]">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f242d] relative">
      {/* Hero */}
      <div className="relative h-[22vh] md:h-[28vh] w-full overflow-hidden bg-[#0d1015]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f242d]/70 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1015]/85 via-[#0d1015]/50 to-[#0d1015]/85" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1015]/50 via-transparent to-transparent" />

        <div className="relative h-full w-full px-4 sm:px-8 md:px-12 lg:px-16 flex flex-col items-center justify-center text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center">
                <FaTv className="text-red-500 text-lg sm:text-xl" />
              </div>
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-br from-white via-rose-100 to-red-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(220,38,38,0.5)]">
                {t('channels.title') || 'القنوات'}
              </h1>
            </div>
            <div className="w-20 sm:w-28 h-0.5 sm:h-1 rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent mb-2 sm:mb-3 shadow-lg shadow-red-500/50" />
            <p className="text-gray-200 text-xs xs:text-sm sm:text-base max-w-xl leading-relaxed drop-shadow-lg">
              شاهد أفضل القنوات المباشرة بجودة عالية
            </p>
          </motion.div>
        </div>
      </div>

      {/* فاصل أبيض */}
      <div className="relative w-full flex items-center justify-center py-4">
        <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/70 shadow-lg shadow-white/40" />
      </div>

      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 py-6">
        {/* بحث وفلاتر */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="text"
                placeholder={t('channels.search') || 'ابحث عن قناة...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#21262d] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white focus:outline-none focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 text-sm transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all duration-300 whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/40 scale-105'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className="hidden xs:inline">{t(`channels.${cat.label}`)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* الشبكة الرئيسية */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* قائمة القنوات */}
          <div className="lg:col-span-1 bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 bg-white/[0.02] border-b border-white/5">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <span>📡</span>
                {filteredChannels.length} {t('channels.title') || 'قناة'}
              </h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto scrollbar-hide">
              {filteredChannels.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm">{t('channels.noChannels') || 'لا توجد قنوات'}</p>
                </div>
              ) : (
                filteredChannels.map((channel) => {
                  const isActive = selectedChannel?.id === channel.id;
                  return (
                    <div
                      key={channel.id}
                      onClick={() => { setSelectedChannel(channel); setIsPlaying(true); }}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-all duration-300 border-l-4 ${
                        isActive
                          ? 'bg-gradient-to-r from-red-600/20 to-transparent border-red-500'
                          : 'border-transparent hover:bg-white/[0.04]'
                      }`}
                    >
                      <img
                        src={channel.logo}
                        alt={channel.name}
                        className="w-10 h-10 rounded-xl object-contain bg-white/5 p-1 border border-white/10"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/40x40/1f242d/666666?text=TV'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-gray-200'}`}>
                          {getChannelName(channel)}
                        </p>
                        <p className="text-gray-500 text-xs">{t(`channels.${channel.category}`)}</p>
                      </div>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* المشغل */}
          <div className="lg:col-span-2">
            {selectedChannel ? (
              <div ref={containerRef} className="relative bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
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

                {/* شريط التحكم */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-red-500 transition p-1.5 bg-black/40 rounded-lg backdrop-blur-sm">
                        {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
                      </button>
                      <button onClick={() => setMuted(!muted)} className="text-white hover:text-red-500 transition p-1.5 bg-black/40 rounded-lg backdrop-blur-sm">
                        {muted ? <FaVolumeMute size={12} /> : <FaVolumeUp size={12} />}
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
                    <button onClick={toggleFullscreen} className="text-white hover:text-red-500 transition p-1.5 bg-black/40 rounded-lg backdrop-blur-sm">
                      {isFullscreen ? <FaCompress size={12} /> : <FaExpand size={12} />}
                    </button>
                  </div>
                </div>

                {/* شارة القناة */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/20">
                  <div className="flex items-center gap-2">
                    <img src={selectedChannel.logo} alt="" className="w-5 h-5 rounded" />
                    <span className="text-white text-xs font-bold">{getChannelName(selectedChannel)}</span>
                    <span className="text-red-400 text-[10px] animate-pulse">● {t('channels.live') || 'مباشر'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl aspect-video flex flex-col items-center justify-center border border-white/10">
                <FaTv className="text-gray-700 text-5xl mb-3" />
                <p className="text-gray-500 text-sm">{t('channels.selectChannel') || 'اختر قناة للبدء'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelsPage;