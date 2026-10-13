// src/pages/admin/AdminDashboard.js - نسخة كاملة مع TMDB Integration + i18n
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaFilm, FaTv, FaPlus, FaEdit, FaTrash, FaSignOutAlt, FaStar, 
  FaSave, FaTimes, FaArrowLeft, FaTachometerAlt, FaSearch,
  FaUser, FaBars, FaHome, FaUsers, FaTv as FaChannel,
  FaClosedCaptioning, FaMicrophoneAlt, FaList, FaChevronDown, 
  FaChevronUp, FaTrashAlt, FaMusic, FaQuran, FaChartLine, 
  FaComment, FaDatabase, FaUserShield, FaImage, FaUpload,
  FaSyncAlt, FaCheck, FaExclamationTriangle, FaBookmark,
  FaDownload
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import AdminClipsManager from './AdminClipsManager';
import AdminRecitersManager from './AdminRecitersManager';
import AdminSongsManager from './AdminSongsManager';
import AdminUsers from './AdminUsers';
import AdvancedStatistics from './AdvancedStatistics';
import AdminComments from './AdminComments';
import AdminBackup from './AdminBackup';
import AdminRoles from './AdminRoles';
import AdminChannelsManager from './AdminChannelsManager';
import { moviesAPI, seriesAPI, channelsAPI } from '../../services/api';

// ⚠️ غيّر هذا الرابط إلى IP/domain الخاص بخادمك
const API_BASE_URL = 'http://192.168.11.88:5000';

const AdminDashboard = () => {
  // ========== STATES ==========
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [saveError, setSaveError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // ========== TMDB STATES ==========
  const [showTMDBModal, setShowTMDBModal] = useState(false);
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [tmdbSearchType, setTmdbSearchType] = useState('multi');
  const [tmdbResults, setTmdbResults] = useState([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbLoadingDetails, setTmdbLoadingDetails] = useState(false);
  const [selectedTMDBItem, setSelectedTMDBItem] = useState(null);
  const [tmdbError, setTmdbError] = useState('');
  
  // ========== DATA STATES ==========
  const [arabwoodMovies, setArabwoodMovies] = useState([]);
  const [hollywoodMovies, setHollywoodMovies] = useState([]);
  const [bollywoodMovies, setBollywoodMovies] = useState([]);
  const [europeanMovies, setEuropeanMovies] = useState([]);
  const [asianMovies, setAsianMovies] = useState([]);
  const [animationMovies, setAnimationMovies] = useState([]);
  
  const [arabicSeries, setArabicSeries] = useState([]);
  const [foreignSeries, setForeignSeries] = useState([]);
  const [indianSeries, setIndianSeries] = useState([]);
  const [turkishSeries, setTurkishSeries] = useState([]);
  const [koreanSeries, setKoreanSeries] = useState([]);
  const [animationSeries, setAnimationSeries] = useState([]);
  
  const [channels, setChannels] = useState([]);
  
  // ========== EPISODE STATES ==========
  const [episodesList, setEpisodesList] = useState([]);
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [episodeSubtitles, setEpisodeSubtitles] = useState([]);
  const [episodeAudioTracks, setEpisodeAudioTracks] = useState([]);
  const [newEpisodeSubtitle, setNewEpisodeSubtitle] = useState({ lang: 'ar', label: 'العربية', url: '' });
  const [newEpisodeAudio, setNewEpisodeAudio] = useState({ lang: 'en', label: 'English', url: '' });
  
  // ========== SUBTITLE & AUDIO STATES ==========
  const [subtitlesList, setSubtitlesList] = useState([]);
  const [audioTracksList, setAudioTracksList] = useState([]);
  const [newSubtitle, setNewSubtitle] = useState({ lang: 'ar', label: 'العربية', url: '' });
  const [newAudioTrack, setNewAudioTrack] = useState({ lang: 'ar', label: 'العربية', url: '' });
  
  // ========== FORM DATA ==========
  const [formData, setFormData] = useState({
    id: '', title: '', titleFr: '', titleAr: '', poster: '', backdrop: '', 
    videoUrl: '', rating: '', year: '', genre: '', duration: '', country: '', 
    director: '', cast: '', description: '', descriptionFr: '', descriptionAr: '',
    subtitles: [], defaultSubtitle: '', audioTracks: [], defaultAudio: '', seasons: 1
  });

  const [episodeFormData, setEpisodeFormData] = useState({
    number: '', title: '', titleFr: '', titleAr: '', duration: '', videoUrl: '',
    thumbnail: '', description: '', season_num: 1
  });

  const [channelFormData, setChannelFormData] = useState({
    id: '', name: '', nameAr: '', logo: '', url: '', category: 'arabic'
  });

  const navigate = useNavigate();

  // ========== CONSTANTS ==========
  const languages = [
    { code: 'ar', label: 'العربية' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' }
  ];

  const genres = ['Action', 'Drame', 'Comedie', 'Romance', 'Science-Fiction', 'Thriller', 'Horreur', 'Crime', 'Fantastique', 'Animation', 'Family', 'Adventure'];
  const years = Array.from({ length: 35 }, (_, i) => 2024 - i);
  const countries = ['Egypte', 'Maroc', 'USA', 'UK', 'France', 'Inde', 'Turquie', 'Coree du Sud', 'Arabie Saoudite', 'Emirats Arabes Unis', 'Liban', 'Jordanie', 'Syrie', 'Irak', 'Algerie', 'Tunisie', 'Japon', 'Chine'];

  const channelCategories = [
    { id: 'arabic', labelKey: 'channels.arabic' },
    { id: 'foreign', labelKey: 'channels.foreign' },
    { id: 'sports', labelKey: 'channels.sports' },
    { id: 'movies', labelKey: 'channels.movies' },
    { id: 'kids', labelKey: 'channels.kids' },
    { id: 'religious', labelKey: 'channels.religious' },
    { id: 'music', labelKey: 'channels.music' },
    { id: 'news', labelKey: 'channels.news' }
  ];

  // ========== قائمة التصنيفات ==========
  const getMenuCategories = useCallback(() => [
    { id: 'arabwood', labelKey: 'nav.arabwood', icon: '🇸🇦', count: arabwoodMovies.length, type: 'movie' },
    { id: 'hollywood', labelKey: 'nav.hollywood', icon: '🇺🇸', count: hollywoodMovies.length, type: 'movie' },
    { id: 'bollywood', labelKey: 'nav.bollywood', icon: '🇮🇳', count: bollywoodMovies.length, type: 'movie' },
    { id: 'european', labelKey: 'nav.european', icon: '🇪🇺', count: europeanMovies.length, type: 'movie' },
    { id: 'asian', labelKey: 'nav.asian', icon: '🇯🇵', count: asianMovies.length, type: 'movie' },
    { id: 'animation_movies', labelKey: 'nav.animation', icon: '🎨', count: animationMovies.length, type: 'movie' },
    { id: 'arabicseries', labelKey: 'nav.arabicSeries', icon: '🇸🇦', count: arabicSeries.length, type: 'series' },
    { id: 'foreignseries', labelKey: 'nav.foreignSeries', icon: '🌍', count: foreignSeries.length, type: 'series' },
    { id: 'indianseries', labelKey: 'nav.indianSeries', icon: '🇮🇳', count: indianSeries.length, type: 'series' },
    { id: 'turkishseries', labelKey: 'nav.turkishSeries', icon: '🇹🇷', count: turkishSeries.length, type: 'series' },
    { id: 'koreanseries', labelKey: 'nav.koreanSeries', icon: '🇰🇷', count: koreanSeries.length, type: 'series' },
    { id: 'animation_series', labelKey: 'nav.animation', icon: '🎨', count: animationSeries.length, type: 'series' },
    { id: 'channels', labelKey: 'nav.channels', icon: '📺', count: channels.length, type: 'channel' },
  ], [arabwoodMovies, hollywoodMovies, bollywoodMovies, europeanMovies, asianMovies, animationMovies, arabicSeries, foreignSeries, indianSeries, turkishSeries, koreanSeries, animationSeries, channels]);

  const menuCategories = getMenuCategories();

  // ========== دوال التحقق ==========
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (!token || userRole !== 'admin') {
      navigate('/admin/login');
    }
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isSeries = () => {
    const seriesTabs = ['arabicseries', 'foreignseries', 'indianseries', 'turkishseries', 'koreanseries', 'animation_series'];
    return seriesTabs.includes(activeTab);
  };
  
  const isMovie = () => {
    const movieTabs = ['arabwood', 'hollywood', 'bollywood', 'european', 'asian', 'animation_movies'];
    return movieTabs.includes(activeTab);
  };

  const getSeriesCategory = (tab) => {
    const categories = {
      arabicseries: 'arabic',
      foreignseries: 'foreign',
      indianseries: 'indian',
      turkishseries: 'turkish',
      koreanseries: 'korean',
      animation_series: 'animation'
    };
    return categories[tab];
  };

  const getSetterByTab = (tab) => {
    const setters = {
      arabwood: setArabwoodMovies,
      hollywood: setHollywoodMovies,
      bollywood: setBollywoodMovies,
      european: setEuropeanMovies,
      asian: setAsianMovies,
      animation_movies: setAnimationMovies,
      arabicseries: setArabicSeries,
      foreignseries: setForeignSeries,
      indianseries: setIndianSeries,
      turkishseries: setTurkishSeries,
      koreanseries: setKoreanSeries,
      animation_series: setAnimationSeries
    };
    return setters[tab];
  };

  // ========== تحميل البيانات ==========
  const loadMoviesByCategory = async (category, setter) => {
    try {
      const data = await moviesAPI.getByCategory(category);
      setter(data);
      return data;
    } catch (error) {
      console.error(`خطأ في تحميل أفلام ${category}:`, error);
      setter([]);
      return [];
    }
  };

  const loadSeriesByCategory = async (category, setter) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/series/category/${category}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      const seriesWithEpisodes = await Promise.all(
        data.map(async (series) => {
          try {
            const episodesRes = await fetch(`${API_BASE_URL}/api/series/${series.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const seriesDetail = await episodesRes.json();
            return { ...series, episodes: seriesDetail.episodes || [], episodes_count: seriesDetail.episodes?.length || 0 };
          } catch (err) {
            return { ...series, episodes: [], episodes_count: 0 };
          }
        })
      );
      
      setter(seriesWithEpisodes);
      return seriesWithEpisodes;
    } catch (error) {
      console.error(`خطأ في تحميل مسلسلات ${category}:`, error);
      setter([]);
      return [];
    }
  };

  const loadChannels = async () => {
    try {
      const data = await channelsAPI.getAll();
      setChannels(data);
      return data;
    } catch (error) {
      console.error('خطأ في تحميل القنوات:', error);
      setChannels([]);
      return [];
    }
  };

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      loadMoviesByCategory('arabwood', setArabwoodMovies),
      loadMoviesByCategory('hollywood', setHollywoodMovies),
      loadMoviesByCategory('bollywood', setBollywoodMovies),
      loadMoviesByCategory('european', setEuropeanMovies),
      loadMoviesByCategory('asian', setAsianMovies),
      loadMoviesByCategory('animation', setAnimationMovies),
      loadSeriesByCategory('arabic', setArabicSeries),
      loadSeriesByCategory('foreign', setForeignSeries),
      loadSeriesByCategory('indian', setIndianSeries),
      loadSeriesByCategory('turkish', setTurkishSeries),
      loadSeriesByCategory('korean', setKoreanSeries),
      loadSeriesByCategory('animation', setAnimationSeries),
      loadChannels()
    ]);
    
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await refreshAllData();
      setLoading(false);
    };
    loadAllData();
  }, [refreshAllData]);

  // ========== دوال الترجمات والحلقات ==========
  const addSubtitle = () => {
    if (newSubtitle.lang && newSubtitle.url && newSubtitle.label) {
      setSubtitlesList([...subtitlesList, { ...newSubtitle }]);
      setNewSubtitle({ lang: 'ar', label: 'العربية', url: '' });
    }
  };
  
  const removeSubtitle = (index) => setSubtitlesList(subtitlesList.filter((_, i) => i !== index));

  const addAudioTrack = () => {
    if (newAudioTrack.lang && newAudioTrack.url && newAudioTrack.label) {
      setAudioTracksList([...audioTracksList, { ...newAudioTrack }]);
      setNewAudioTrack({ lang: 'ar', label: 'العربية', url: '' });
    }
  };
  
  const removeAudioTrack = (index) => setAudioTracksList(audioTracksList.filter((_, i) => i !== index));

  const addEpisode = () => {
    if (!episodeFormData.number || episodeFormData.number === '') {
      alert('⚠️ ' + t('admin.episode.number'));
      return;
    }
    if (!episodeFormData.title || episodeFormData.title === '') {
      alert('⚠️ ' + t('admin.episode.title'));
      return;
    }
    if (!episodeFormData.videoUrl || episodeFormData.videoUrl === '') {
      alert('⚠️ ' + t('admin.episode.videoUrl'));
      return;
    }
    
    const newEpisode = { 
      id: Date.now(), 
      number: parseInt(episodeFormData.number),
      season_num: parseInt(episodeFormData.season_num) || 1,
      title: episodeFormData.title,
      titleAr: episodeFormData.titleAr || episodeFormData.title,
      titleFr: episodeFormData.titleFr || episodeFormData.title,
      duration: episodeFormData.duration || null,
      videoUrl: episodeFormData.videoUrl,
      thumbnail: episodeFormData.thumbnail || null,
      description: episodeFormData.description || null,
      subtitles: episodeSubtitles, 
      audioTracks: episodeAudioTracks 
    };
    
    setEpisodesList([...episodesList, newEpisode]);
    setShowEpisodeModal(false);
    setEpisodeFormData({ number: '', title: '', titleFr: '', titleAr: '', duration: '', videoUrl: '', thumbnail: '', description: '', season_num: 1 });
    setEpisodeSubtitles([]);
    setEpisodeAudioTracks([]);
  };

  const deleteEpisode = (id) => {
    setEpisodesList(episodesList.filter(ep => ep.id !== id));
  };

  const addEpisodeSubtitle = () => {
    if (newEpisodeSubtitle.lang && newEpisodeSubtitle.url) {
      setEpisodeSubtitles([...episodeSubtitles, { 
        ...newEpisodeSubtitle, 
        label: languages.find(l => l.code === newEpisodeSubtitle.lang)?.label || newEpisodeSubtitle.lang
      }]);
      setNewEpisodeSubtitle({ lang: 'ar', label: 'العربية', url: '' });
    }
  };
  
  const removeEpisodeSubtitle = (index) => setEpisodeSubtitles(episodeSubtitles.filter((_, i) => i !== index));

  const addEpisodeAudio = () => {
    if (newEpisodeAudio.lang && newEpisodeAudio.url) {
      setEpisodeAudioTracks([...episodeAudioTracks, { 
        ...newEpisodeAudio, 
        label: languages.find(l => l.code === newEpisodeAudio.lang)?.label || newEpisodeAudio.lang
      }]);
      setNewEpisodeAudio({ lang: 'en', label: 'English', url: '' });
    }
  };
  
  const removeEpisodeAudio = (index) => setEpisodeAudioTracks(episodeAudioTracks.filter((_, i) => i !== index));

  // ============================================================
  // ========== TMDB FUNCTIONS ==========
  // ============================================================
  
  const searchInTMDB = async () => {
    if (!tmdbSearchQuery.trim()) {
      setTmdbError(t('admin.tmdb.search'));
      return;
    }

    setTmdbLoading(true);
    setTmdbError('');
    setTmdbResults([]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/tmdb/search?query=${encodeURIComponent(tmdbSearchQuery)}&type=${tmdbSearchType}&language=fr`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const data = await response.json();
      
      if (data.success) {
        setTmdbResults(data.results);
        if (data.results.length === 0) setTmdbError(t('search.noResults'));
      } else {
        setTmdbError(data.message || t('common.error'));
      }
    } catch (error) {
      console.error('❌ TMDB Search Error:', error);
      setTmdbError(t('common.error'));
    } finally {
      setTmdbLoading(false);
    }
  };

  const fetchTMDBDetails = async (tmdbId, mediaType) => {
    setTmdbLoadingDetails(true);
    setTmdbError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/tmdb/details/${mediaType}/${tmdbId}?language=fr`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const data = await response.json();

      if (!data.success) throw new Error(data.message || t('common.error'));

      const tmdbData = data.data;
      setSelectedTMDBItem(tmdbData);

      setFormData({
        id: '',
        title: tmdbData.title_ar || tmdbData.title || '',
        titleAr: tmdbData.title_ar || '',
        titleFr: tmdbData.title_en || '',
        poster: tmdbData.poster || '',
        backdrop: tmdbData.backdrop || '',
        videoUrl: '',
        rating: tmdbData.rating || '',
        year: tmdbData.year || '',
        genre: tmdbData.genre || '',
        duration: tmdbData.duration || '',
        country: tmdbData.country_name || tmdbData.country || '',
        director: tmdbData.director || '',
        cast: tmdbData.cast || '',
        description: tmdbData.description_ar || tmdbData.description || '',
        descriptionFr: tmdbData.description_en || '',
        descriptionAr: tmdbData.description_ar || '',
        subtitles: [],
        defaultSubtitle: '',
        audioTracks: [],
        defaultAudio: '',
        seasons: tmdbData.seasons || 1
      });

      setSubtitlesList([]);
      setAudioTracksList([]);
      setEpisodesList([]);

      if (mediaType === 'tv' && tmdbData.seasons_data?.length > 0) {
        await loadTMDBSeasons(tmdbId);
      }

      setShowTMDBModal(false);
      setEditingItem(null);
      setShowModal(true);

      showNotification(`✅ ${tmdbData.title}`, 'success');

    } catch (error) {
      console.error('❌ TMDB Details Error:', error);
      setTmdbError(error.message || t('common.error'));
      showNotification('❌ ' + t('common.error'), 'error');
    } finally {
      setTmdbLoadingDetails(false);
    }
  };

  const loadTMDBSeasons = async (seriesId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/tmdb/seasons/${seriesId}?language=fr`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const data = await response.json();
      
      if (data.success && data.seasons) {
        const allEpisodes = [];
        
        for (const season of data.seasons) {
          if (season.season_number === 0) continue;
          
          (season.episodes || []).forEach(ep => {
            allEpisodes.push({
              id: Date.now() + Math.random(),
              number: ep.episode_number,
              season_num: ep.season_number,
              title: ep.title || `${t('movie.episode')} ${ep.episode_number}`,
              titleAr: ep.title || `${t('movie.episode')} ${ep.episode_number}`,
              titleFr: '',
              duration: ep.duration || '',
              videoUrl: '',
              thumbnail: ep.thumbnail || '',
              description: ep.description || '',
              subtitles: [],
              audioTracks: []
            });
          });
        }
        
        if (allEpisodes.length > 0) {
          setEpisodesList(allEpisodes);
          showNotification(`✅ ${allEpisodes.length} ${t('series.episodes')}`, 'success');
        }
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المواسم:', error);
    }
  };

  const handleTMDBKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchInTMDB();
    }
  };

  // ========== دوال CRUD ==========
  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.actions.areYouSure'))) return;
    
    try {
      if (activeTab === 'channels') {
        await channelsAPI.deleteChannel(id);
      } else if (isSeries()) {
        await seriesAPI.deleteSeries(id);
      } else {
        await moviesAPI.deleteMovie(id);
      }
      await refreshAllData();
    } catch (error) {
      console.error('خطأ في الحذف:', error);
      alert(t('common.error'));
    }
  };

  const handleEdit = async (item) => {
    setEditingItem(item);
    setSelectedTMDBItem(null);
    setFormData({
        id: item.id, 
        title: item.title || '', 
        titleFr: item.title_fr || '', 
        titleAr: item.title_ar || '',
        poster: item.poster || '', 
        backdrop: item.backdrop || '', 
        videoUrl: item.video_url || '',
        rating: item.rating || '', 
        year: item.year || '', 
        genre: item.genre || '',
        duration: item.duration || '', 
        country: item.country || '', 
        director: item.director || '',
        cast: item.cast || '', 
        description: item.description || '', 
        descriptionFr: item.description_fr || '',
        descriptionAr: item.description_ar || '', 
        subtitles: item.subtitles || [], 
        defaultSubtitle: item.default_subtitle || '',
        audioTracks: item.audioTracks || [], 
        defaultAudio: item.default_audio || '',
        seasons: item.seasons || 1
    });
    
    let subtitlesData = item.subtitles || [];
    let audioTracksData = item.audioTracks || [];
    
    setSubtitlesList(subtitlesData.map(sub => ({
        lang: sub.language,
        label: sub.label,
        url: sub.url
    })));
    
    setAudioTracksList(audioTracksData.map(track => ({
        lang: track.language,
        label: track.label,
        url: track.url
    })));
    
    if (item.episodes && Array.isArray(item.episodes)) {
        setEpisodesList(item.episodes.map(ep => ({
            id: ep.id,
            number: ep.episode_num || ep.number,
            title: ep.title || '',
            titleFr: ep.title_fr || '',
            titleAr: ep.title_ar || '',
            duration: ep.duration || '',
            videoUrl: ep.video_url || '',
            thumbnail: ep.thumbnail || '',
            description: ep.description || '',
            season_num: ep.season_num || 1
        })));
    } else {
        setEpisodesList([]);
    }
    
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
        id: '', title: '', titleFr: '', titleAr: '', poster: '', backdrop: '', videoUrl: '',
        rating: '', year: '', genre: '', duration: '', country: '', director: '',
        cast: '', description: '', descriptionFr: '', descriptionAr: '',
        subtitles: [], defaultSubtitle: '', audioTracks: [], defaultAudio: '', seasons: 1
    });
    setSubtitlesList([]);
    setAudioTracksList([]);
    setEpisodesList([]);
    setSaveError('');
    setSelectedTMDBItem(null);
  };

  const showNotification = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    
    const isSeriesTab = isSeries();
    const isMovieTab = isMovie();
    
    let category = activeTab;
    if (activeTab === 'animation_movies') category = 'animation';
    if (activeTab === 'animation_series') category = 'animation';
    if (isSeriesTab) {
        category = getSeriesCategory(activeTab);
    }
    
    const newItem = {
        title: formData.title || null,
        title_ar: formData.titleAr || null,
        title_fr: formData.titleFr || null,
        description: formData.description || null,
        description_ar: formData.descriptionAr || null,
        description_fr: formData.descriptionFr || null,
        poster: formData.poster || null,
        backdrop: formData.backdrop || null,
        video_url: formData.videoUrl || null,
        rating: formData.rating ? parseFloat(formData.rating) : 0,
        year: formData.year ? parseInt(formData.year) : new Date().getFullYear(),
        duration: formData.duration || null,
        genre: formData.genre || null,
        country: formData.country || null,
        director: formData.director || null,
        cast: formData.cast || null,
        category: category,
        seasons: isSeriesTab ? (formData.seasons ? parseInt(formData.seasons) : 1) : undefined,
        subtitles: subtitlesList.map(sub => ({
            language: sub.lang,
            label: sub.label,
            url: sub.url,
            is_default: formData.defaultSubtitle === sub.lang ? 1 : 0
        })),
        audioTracks: audioTracksList.map(track => ({
            language: track.lang,
            label: track.label,
            url: track.url,
            is_default: formData.defaultAudio === track.lang ? 1 : 0
        }))
    };
    
    if (isSeriesTab && episodesList.length > 0) {
        newItem.episodes = episodesList.map(ep => ({
            season_num: ep.season_num || 1,
            episode_num: parseInt(ep.number),
            title: ep.title || null,
            title_ar: ep.titleAr || null,
            title_fr: ep.titleFr || null,
            description: ep.description || null,
            video_url: ep.videoUrl || null,
            duration: ep.duration || null,
            thumbnail: ep.thumbnail || null
        }));
    }
    
    try {
        if (editingItem) {
            if (isSeriesTab) {
                await seriesAPI.updateSeries(editingItem.id, newItem);
            } else {
                await moviesAPI.updateMovie(editingItem.id, newItem);
            }
            showNotification('✅ ' + t('common.success'), 'success');
        } else {
            if (isSeriesTab) {
                await seriesAPI.addSeries(newItem);
                showNotification('✅ ' + t('common.success'), 'success');
            } else if (isMovieTab) {
                await moviesAPI.addMovie(newItem);
                showNotification('✅ ' + t('common.success'), 'success');
            }
        }
        
        await refreshAllData();
        setShowModal(false);
        setEditingItem(null);
        resetForm();
        
    } catch (error) {
        console.error('❌ خطأ في الحفظ:', error);
        const errorMsg = error.response?.data?.message || error.message;
        setSaveError(errorMsg);
        showNotification('❌ ' + t('common.error') + ': ' + errorMsg, 'error');
    } finally {
        setSaving(false);
    }
  };

  // ========== دوال القنوات ==========
  const handleChannelSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const newChannel = { 
      name: channelFormData.name,
      name_ar: channelFormData.nameAr,
      logo: channelFormData.logo,
      url: channelFormData.url,
      category: channelFormData.category
    };
    
    try {
      if (editingItem) {
        await channelsAPI.updateChannel(editingItem.id, newChannel);
      } else {
        await channelsAPI.addChannel(newChannel);
      }
      await refreshAllData();
      showNotification('✅ ' + t('common.success'), 'success');
      setShowModal(false);
      setEditingItem(null);
      setChannelFormData({ id: '', name: '', nameAr: '', logo: '', url: '', category: 'arabic' });
    } catch (error) {
      console.error('خطأ في حفظ القناة:', error);
      showNotification('❌ ' + t('common.error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChannelEdit = (channel) => {
    setEditingItem(channel);
    setChannelFormData({
      id: channel.id,
      name: channel.name || '',
      nameAr: channel.name_ar || '',
      logo: channel.logo || '',
      url: channel.url || '',
      category: channel.category || 'arabic'
    });
    setShowModal(true);
  };

  const handleLogout = () => { 
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userPlan');
    localStorage.removeItem('isAuthenticated');
    navigate('/admin/login'); 
  };

  const getCurrentData = () => {
    switch(activeTab) {
      case 'arabwood': return arabwoodMovies;
      case 'hollywood': return hollywoodMovies;
      case 'bollywood': return bollywoodMovies;
      case 'european': return europeanMovies;
      case 'asian': return asianMovies;
      case 'animation_movies': return animationMovies;
      case 'arabicseries': return arabicSeries;
      case 'foreignseries': return foreignSeries;
      case 'indianseries': return indianSeries;
      case 'turkishseries': return turkishSeries;
      case 'koreanseries': return koreanSeries;
      case 'animation_series': return animationSeries;
      case 'channels': return channels;
      default: return [];
    }
  };
  
  const currentData = getCurrentData();
  const filteredData = currentData.filter(item => item.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalMovies = arabwoodMovies.length + hollywoodMovies.length + bollywoodMovies.length + europeanMovies.length + asianMovies.length + animationMovies.length;
  const totalSeries = arabicSeries.length + foreignSeries.length + indianSeries.length + turkishSeries.length + koreanSeries.length + animationSeries.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }
    return (
    <div className="min-h-screen bg-black" key={refreshKey}>
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-white p-2 hover:bg-gray-800 rounded-lg">
              <FaBars className="text-lg sm:text-xl" />
            </button>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <FaTachometerAlt className="text-white text-base sm:text-xl" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">{t('admin.adminPanel')}</h1>
              <p className="text-gray-500 text-[10px] sm:text-xs hidden sm:block">{t('admin.fullControl')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gray-800 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <FaHome className="text-sm sm:text-base" /><span className="hidden sm:inline">{t('admin.backToSite')}</span>
            </Link>
            <button onClick={handleLogout} className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-red-600 rounded-lg text-white hover:bg-red-700 transition flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <FaSignOutAlt className="text-sm sm:text-base" /><span className="hidden sm:inline">{t('admin.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed top-[57px] sm:top-[73px] bottom-0 w-72 sm:w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto transition-all duration-300 z-30 ${
          sidebarOpen ? 'right-0' : '-right-72 sm:-right-80'
        } lg:right-0 lg:block`}>
          <div className="p-3 sm:p-4">
            <div className="bg-gray-800/50 rounded-xl p-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600/30 rounded-full flex items-center justify-center">
                  <FaUser className="text-red-400 text-base sm:text-lg" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{t('admin.users.role.admin')}</p>
                  <p className="text-gray-500 text-[10px] sm:text-xs">mohcine@akiltv.com</p>
                </div>
              </div>
            </div>
            
            <button onClick={() => { setActiveTab('dashboard'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2 transition text-sm sm:text-base ${activeTab === 'dashboard' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaTachometerAlt className="text-base sm:text-lg" /><span>{t('admin.menu.dashboard')}</span>
            </button>
            
            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">{t('admin.sections.movies')}</p></div>
            {menuCategories.filter(c => c.type === 'movie').map(cat => (
              <button key={cat.id} onClick={() => { setActiveTab(cat.id); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === cat.id ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <span className="text-base sm:text-lg">{cat.icon}</span>
                <span className="flex-1 text-right text-sm">{t(cat.labelKey)}</span>
                <span className="text-[10px] sm:text-xs bg-gray-700 px-1.5 sm:px-2 py-0.5 rounded-full">{cat.count}</span>
              </button>
            ))}
            
            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">{t('admin.sections.series')}</p></div>
            {menuCategories.filter(c => c.type === 'series').map(cat => (
              <button key={cat.id} onClick={() => { setActiveTab(cat.id); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === cat.id ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <span className="text-base sm:text-lg">{cat.icon}</span>
                <span className="flex-1 text-right text-sm">{t(cat.labelKey)}</span>
                <span className="text-[10px] sm:text-xs bg-gray-700 px-1.5 sm:px-2 py-0.5 rounded-full">{cat.count}</span>
              </button>
            ))}
            
            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">{t('admin.sections.channels')}</p></div>
            <button onClick={() => { setActiveTab('channels'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'channels' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <span className="text-base sm:text-lg">📺</span>
              <span className="flex-1 text-right text-sm">{t('admin.menu.channelsTV')}</span>
              <span className="text-[10px] sm:text-xs bg-gray-700 px-1.5 sm:px-2 py-0.5 rounded-full">{channels.length}</span>
            </button>

            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">{t('admin.sections.clips')}</p></div>
            <button onClick={() => { setActiveTab('clips'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'clips' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaMusic className="text-base sm:text-lg" /><span>{t('admin.menu.manageClips')}</span>
            </button>

            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">{t('admin.sections.songs')}</p></div>
            <button onClick={() => { setActiveTab('songs'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'songs' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaMusic className="text-base sm:text-lg" /><span>{t('admin.menu.manageSongs')}</span>
            </button>

            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">{t('admin.sections.quran')}</p></div>
            <button onClick={() => { setActiveTab('reciters'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'reciters' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaQuran className="text-base sm:text-lg" /><span>{t('admin.menu.manageReciters')}</span>
            </button>

            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">{t('admin.sections.lists')}</p></div>
            <button 
              onClick={() => { navigate('/mylist'); if(isMobile) setSidebarOpen(false); }} 
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              <FaBookmark className="text-base sm:text-lg text-purple-400" />
              <span className="flex-1 text-right text-sm">{t('admin.menu.myList')}</span>
            </button>
            
            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">{t('admin.sections.reports')}</p></div>
            <button onClick={() => { setActiveTab('statistics'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'statistics' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaChartLine className="text-base sm:text-lg" /><span>{t('admin.menu.advancedStats')}</span>
            </button>

            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">{t('admin.sections.interaction')}</p></div>
            <button onClick={() => { setActiveTab('comments'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'comments' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaComment className="text-base sm:text-lg" /><span>{t('admin.menu.manageComments')}</span>
            </button>

            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">{t('admin.sections.system')}</p></div>
            <button onClick={() => { setActiveTab('backup'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'backup' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaDatabase className="text-base sm:text-lg" /><span>{t('admin.menu.backup')}</span>
            </button>
            
            <button onClick={() => { setActiveTab('roles'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'roles' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaUserShield className="text-base sm:text-lg" /><span>{t('admin.menu.roles')}</span>
            </button>

            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">{t('admin.sections.users')}</p></div>
            <button onClick={() => { setActiveTab('users'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'users' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaUsers className="text-base sm:text-lg" /><span>{t('admin.menu.manageUsers')}</span>
            </button>
          </div>
        </aside>

        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black/70 z-20" onClick={() => setSidebarOpen(false)} />
        )}

        <main className={`flex-1 transition-all duration-300 ${!isMobile ? 'lg:mr-72' : ''} p-3 sm:p-4 md:p-6`}>
          
          {activeTab === 'dashboard' && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-gray-900 rounded-xl p-3 sm:p-5 border border-gray-800">
                  <div className="flex items-center justify-between mb-2"><FaFilm className="text-purple-400 text-xl sm:text-2xl" /><span className="text-green-400 text-[10px] sm:text-sm">+{totalMovies}</span></div>
                  <p className="text-gray-500 text-[10px] sm:text-sm">{t('admin.totalMovies')}</p>
                  <p className="text-white text-xl sm:text-2xl font-bold">{totalMovies}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-3 sm:p-5 border border-gray-800">
                  <div className="flex items-center justify-between mb-2"><FaTv className="text-blue-400 text-xl sm:text-2xl" /><span className="text-green-400 text-[10px] sm:text-sm">+{totalSeries}</span></div>
                  <p className="text-gray-500 text-[10px] sm:text-sm">{t('admin.totalSeries')}</p>
                  <p className="text-white text-xl sm:text-2xl font-bold">{totalSeries}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-3 sm:p-5 border border-gray-800">
                  <div className="flex items-center justify-between mb-2"><FaChannel className="text-green-400 text-xl sm:text-2xl" /><span className="text-green-400 text-[10px] sm:text-sm">+{channels.length}</span></div>
                  <p className="text-gray-500 text-[10px] sm:text-sm">{t('admin.totalChannels')}</p>
                  <p className="text-white text-xl sm:text-2xl font-bold">{channels.length}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-3 sm:p-5 border border-gray-800">
                  <div className="flex items-center justify-between mb-2"><FaStar className="text-yellow-400 text-xl sm:text-2xl" /><span className="text-green-400 text-[10px] sm:text-sm">★</span></div>
                  <p className="text-gray-500 text-[10px] sm:text-sm">{t('admin.avgRating')}</p>
                  <p className="text-white text-xl sm:text-2xl font-bold">8.4</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {menuCategories.map(cat => (
                  <button key={cat.id} onClick={() => setActiveTab(cat.id)} className="bg-gray-900 rounded-xl p-3 sm:p-4 text-center hover:bg-gray-800 transition border border-gray-800">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{cat.icon}</div>
                    <p className="text-white text-xs sm:text-sm font-medium">{t(cat.labelKey)}</p>
                    <p className="text-gray-500 text-[10px] sm:text-xs">{cat.count} {t('admin.content')}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'channels' && (
            <AdminChannelsManager />
          )}
          
          {activeTab === 'clips' && <AdminClipsManager />}
          {activeTab === 'reciters' && <AdminRecitersManager />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'songs' && <AdminSongsManager />}
          {activeTab === 'statistics' && <AdvancedStatistics />}
          {activeTab === 'comments' && <AdminComments />}
          {activeTab === 'backup' && <AdminBackup />}
          {activeTab === 'roles' && <AdminRoles />}
          
          {/* Movies & Series tabs */}
          {activeTab !== 'dashboard' && activeTab !== 'channels' && activeTab !== 'clips' && activeTab !== 'reciters' && activeTab !== 'users' && activeTab !== 'songs' && activeTab !== 'statistics' && activeTab !== 'comments' && activeTab !== 'backup' && activeTab !== 'roles' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">{t(menuCategories.find(c => c.id === activeTab)?.labelKey)}</h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-48">
                    <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
                    <input type="text" placeholder={t('common.search') + '...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg py-1.5 sm:py-2 pr-8 pl-3 text-white text-xs sm:text-sm" />
                  </div>
                  
                  {/* ✅ زر جلب من TMDB */}
                  <button 
                    onClick={() => { 
                      setShowTMDBModal(true); 
                      setTmdbSearchQuery(''); 
                      setTmdbResults([]); 
                      setTmdbError(''); 
                      if (isSeries()) setTmdbSearchType('tv');
                      else if (isMovie()) setTmdbSearchType('movie');
                      else setTmdbSearchType('multi');
                    }} 
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-2 text-sm hover:from-blue-700 hover:to-cyan-700 transition shadow-lg shadow-blue-600/30"
                  >
                    <FaDownload className="text-sm" />
                    <span>{t('admin.actions.fetchFromTMDB')}</span>
                  </button>
                  
                  <button onClick={() => { resetForm(); setEditingItem(null); setShowModal(true); }} className="bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-2 text-sm">
                    <FaPlus className="text-sm" /> {isSeries() ? t('admin.movie.addSeries') : t('admin.movie.addMovie')}
                  </button>
                </div>
              </div>
              <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">{t('admin.table.image')}</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">{t('admin.table.title')}</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">{t('admin.table.category')}</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">{t('admin.table.year')}</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">{t('admin.table.rating')}</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm hidden sm:table-cell">{t('admin.table.duration')}</th>
                      {isSeries() && <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm hidden md:table-cell">{t('admin.table.episodes')}</th>}
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">{t('admin.table.subtitles')}</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm hidden sm:table-cell">{t('admin.table.audio')}</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm hidden lg:table-cell">{t('admin.table.country')}</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">{t('admin.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr><td colSpan="10" className="text-center py-8 sm:py-12 text-gray-500 text-sm">{t('admin.actions.noContent')}</td></tr>
                    ) : (
                      filteredData.map(item => (
                        <tr key={item.id} className="border-b border-gray-800">
                          <td className="px-2 sm:px-4 py-2 sm:py-3"><img src={item.poster} className="w-8 h-11 sm:w-10 sm:h-14 object-cover rounded" alt={item.title} /></td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-sm">{item.title}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3"><span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs bg-purple-500/20 text-purple-300 whitespace-nowrap">{item.genre}</span></td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 text-xs sm:text-sm">{item.year}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 text-xs sm:text-sm"><FaStar className="text-yellow-400 inline ml-1 text-xs" /> {item.rating}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 text-xs sm:text-sm hidden sm:table-cell">{item.duration || '-'}</td>
                          {isSeries() && (
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-blue-400 text-xs sm:text-sm hidden md:table-cell">
                              {item.episodes?.length || item.episodes_count || 0} {t('admin.table.episode')}
                            </td>
                          )}
                          <td className="px-2 sm:px-4 py-2 sm:py-3"><span className="text-[10px] sm:text-xs text-green-400">{item.subtitles_count || 0} {t('admin.table.subtitle')}</span></td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell"><span className="text-[10px] sm:text-xs text-yellow-400">{item.audioTracks?.length || 0} {t('admin.table.audioTrack')}</span></td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 text-xs sm:text-sm hidden lg:table-cell">{item.country || '-'}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 flex gap-1 sm:gap-2">
                            <button onClick={() => handleEdit(item)} className="text-blue-400 p-1"><FaEdit className="text-sm sm:text-base" /></button>
                            <button onClick={() => handleDelete(item.id)} className="text-red-400 p-1"><FaTrash className="text-sm sm:text-base" /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================ */}
      {/* 🎬 TMDB SEARCH MODAL */}
      {/* ============================================================ */}
      {showTMDBModal && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-[60] overflow-y-auto" 
          onClick={() => !tmdbLoadingDetails && setShowTMDBModal(false)}
        >
          <div 
            className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-blue-500/30 shadow-2xl shadow-blue-600/20" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-900/50 to-cyan-900/30 p-4 border-b border-gray-800 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <FaDownload className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-white text-lg sm:text-xl font-bold">{t('admin.tmdb.title')}</h3>
                  <p className="text-gray-400 text-xs">{t('admin.tmdb.subtitle')}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTMDBModal(false)} 
                disabled={tmdbLoadingDetails}
                className="text-gray-400 hover:text-white text-2xl w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition disabled:opacity-30"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-4 border-b border-gray-800 bg-gray-900/50">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
                  <input
                    type="text"
                    placeholder={t('admin.tmdb.placeholder')}
                    value={tmdbSearchQuery}
                    onChange={(e) => setTmdbSearchQuery(e.target.value)}
                    onKeyPress={handleTMDBKeyPress}
                    disabled={tmdbLoadingDetails}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition-all disabled:opacity-50"
                    autoFocus
                  />
                </div>
                <select
                  value={tmdbSearchType}
                  onChange={(e) => setTmdbSearchType(e.target.value)}
                  disabled={tmdbLoadingDetails}
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
                >
                  <option value="multi">{t('admin.tmdb.all')}</option>
                  <option value="movie">{t('admin.tmdb.movies')}</option>
                  <option value="tv">{t('admin.tmdb.series')}</option>
                </select>
                <button
                  onClick={searchInTMDB}
                  disabled={tmdbLoading || tmdbLoadingDetails}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  {tmdbLoading ? (
                    <><FaSyncAlt className="animate-spin" /><span>{t('admin.tmdb.searching')}</span></>
                  ) : (
                    <><FaSearch /><span>{t('admin.tmdb.search')}</span></>
                  )}
                </button>
              </div>

              {tmdbLoadingDetails && (
                <div className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center gap-3">
                  <FaSyncAlt className="animate-spin text-blue-400" />
                  <span className="text-blue-300 text-sm">{t('admin.tmdb.fetchingDetails')}</span>
                </div>
              )}

              {tmdbError && (
                <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
                  <FaExclamationTriangle className="text-red-400" />
                  <span className="text-red-300 text-sm">{tmdbError}</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {tmdbResults.length === 0 && !tmdbLoading && !tmdbError && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎬</div>
                  <p className="text-gray-400 text-lg mb-2">{t('admin.tmdb.startSearching')}</p>
                  <p className="text-gray-500 text-sm">{t('admin.tmdb.autoFillMessage')}</p>
                </div>
              )}

              {tmdbResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {tmdbResults.map((item) => (
                    <div
                      key={`${item.media_type}-${item.id}`}
                      className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500/60 transition-all duration-300 group cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/20"
                      onClick={() => !tmdbLoadingDetails && fetchTMDBDetails(item.id, item.media_type)}
                    >
                      <div className="relative aspect-[2/3] overflow-hidden bg-gray-900">
                        {item.poster_url ? (
                          <img
                            src={item.poster_url}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <FaImage className="text-4xl" />
                          </div>
                        )}
                        
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20">
                          <span className="text-white text-[10px] font-bold">
                            {item.media_type === 'movie' ? t('admin.tmdb.movie') : t('admin.tmdb.tvSeries')}
                          </span>
                        </div>

                        {item.vote_average > 0 && (
                          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-yellow-500/90 backdrop-blur-md flex items-center gap-1">
                            <FaStar className="text-white text-[10px]" />
                            <span className="text-white text-[10px] font-bold">{item.vote_average.toFixed(1)}</span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white text-blue-900 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                            <FaDownload />
                            <span>{t('admin.tmdb.selectAndFill')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3">
                        <h4 className="text-white font-bold text-sm line-clamp-1 mb-1">{item.title}</h4>
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          {item.year && <span>📅 {item.year}</span>}
                          {item.original_language && <span className="uppercase">🌐 {item.original_language}</span>}
                        </div>
                        {item.overview && (
                          <p className="text-gray-500 text-xs mt-2 line-clamp-2">{item.overview}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-800 bg-gray-900/50 text-center">
              <p className="text-gray-500 text-xs">
                {t('admin.tmdb.poweredBy')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Movies/Series */}
      {showModal && activeTab !== 'channels' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 p-3 sm:p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-base sm:text-xl font-bold">
                {editingItem ? t('admin.actions.edit') : t('admin.actions.add')} {t(menuCategories.find(c => c.id === activeTab)?.labelKey)}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
              {selectedTMDBItem && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <FaDownload className="text-blue-400 text-sm" />
                  </div>
                  <div className="flex-1">
                    <p className="text-blue-300 text-sm font-bold">{t('admin.movie.tmdbImported')}</p>
                    <p className="text-gray-400 text-xs">TMDB ID: {selectedTMDBItem.tmdb_id}</p>
                  </div>
                  <a 
                    href={selectedTMDBItem.tmdb_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs underline"
                  >
                    {t('admin.movie.viewOnTMDB')} →
                  </a>
                </div>
              )}

              {saveError && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
                  <FaExclamationTriangle /> {saveError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <input type="text" placeholder={t('admin.movie.titleAr')} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
                <input type="text" placeholder={t('admin.movie.titleFr')} value={formData.titleFr} onChange={(e) => setFormData({...formData, titleFr: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
                <input type="text" placeholder={t('admin.movie.titleEn')} value={formData.titleAr} onChange={(e) => setFormData({...formData, titleAr: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
                
                {!isSeries() && (
                  <input type="url" placeholder={t('admin.movie.videoUrl')} value={formData.videoUrl} onChange={(e) => setFormData({...formData, videoUrl: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
                )}
                
                <input type="url" placeholder={t('admin.movie.poster')} value={formData.poster} onChange={(e) => setFormData({...formData, poster: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
                <input type="url" placeholder={t('admin.movie.backdrop')} value={formData.backdrop} onChange={(e) => setFormData({...formData, backdrop: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <input type="number" step="0.1" placeholder={t('movie.rating')} value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
                <select value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <input type="text" placeholder={t('movie.duration')} value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
                <select value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm">
                  <option value="">{t('admin.movie.chooseCountry')}</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={formData.genre} onChange={(e) => setFormData({...formData, genre: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm">
                  <option value="">{t('admin.movie.chooseGenre')}</option>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <input 
    type="text" 
    placeholder={t('admin.movie.director')} 
    value={formData.director} 
    onChange={(e) => setFormData({...formData, director: e.target.value})} 
    className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
/>
                <input 
    type="text" 
    placeholder={t('admin.movie.cast')} 
    value={formData.cast} 
    onChange={(e) => setFormData({...formData, cast: e.target.value})} 
    className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
/>
                {isSeries() && (
                  <input 
        type="number" 
        placeholder={t('admin.movie.seasonsCount')} 
        value={formData.seasons} 
        onChange={(e) => setFormData({...formData, seasons: e.target.value})} 
        className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
      />
                )}
              </div>

              <textarea 
        rows="2" 
        placeholder={t('admin.movie.descriptionAr')} 
        value={formData.descriptionAr} 
        onChange={(e) => setFormData({...formData, descriptionAr: e.target.value})} 
        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"
      ></textarea>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <textarea rows="2" placeholder={t('admin.movie.descriptionFr')} value={formData.descriptionFr} onChange={(e) => setFormData({...formData, descriptionFr: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"></textarea>
                <textarea rows="2" placeholder={t('admin.movie.descriptionEn')} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"></textarea>
              </div>

              {/* الترجمات */}
              <div className="border-t border-gray-800 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaClosedCaptioning className="text-red-500" />
                  <h4 className="text-white font-bold">{t('admin.movie.subtitlesSection')}</h4>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {subtitlesList.map((sub, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg px-2 py-1 flex items-center gap-1">
                      <span className="text-xs">{sub.label}</span>
                      <button type="button" onClick={() => removeSubtitle(i)} className="text-red-400 text-xs">✕</button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <select value={newSubtitle.lang} onChange={(e) => setNewSubtitle({...newSubtitle, lang: e.target.value})} className="bg-gray-800 rounded-lg p-1 text-white text-xs">
                    {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                  <input type="text" placeholder={t('admin.movie.label')} value={newSubtitle.label} onChange={(e) => setNewSubtitle({...newSubtitle, label: e.target.value})} className="bg-gray-800 rounded-lg p-1 text-white text-xs" />
                  <input type="url" placeholder={t('admin.movie.subtitleUrl')} value={newSubtitle.url} onChange={(e) => setNewSubtitle({...newSubtitle, url: e.target.value})} className="col-span-2 bg-gray-800 rounded-lg p-1 text-white text-xs" />
                </div>
                <button 
                  type="button" 
                  onClick={addSubtitle} 
                  className="mt-2 bg-green-600 text-white px-2 py-1 rounded text-xs w-full"
                >
                  {t('admin.movie.addSubtitle')}
                </button>
              </div>

              {/* المسارات الصوتية */}
              <div className="border-t border-gray-800 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaMicrophoneAlt className="text-red-500" />
                  <h4 className="text-white font-bold">
                    {t('admin.movie.audioTracksSection')}
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {audioTracksList.map((audio, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg px-2 py-1 flex items-center gap-1">
                      <span className="text-xs">{audio.label}</span>
                      <button type="button" onClick={() => removeAudioTrack(i)} className="text-red-400 text-xs">✕</button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <select value={newAudioTrack.lang} onChange={(e) => setNewAudioTrack({...newAudioTrack, lang: e.target.value})} className="bg-gray-800 rounded-lg p-1 text-white text-xs">
                    {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                  <input type="text" placeholder={t('admin.movie.label')} value={newAudioTrack.label} onChange={(e) => setNewAudioTrack({...newAudioTrack, label: e.target.value})} className="bg-gray-800 rounded-lg p-1 text-white text-xs" />
                  <input type="url" placeholder={t('admin.movie.audioUrl')} value={newAudioTrack.url} onChange={(e) => setNewAudioTrack({...newAudioTrack, url: e.target.value})} className="col-span-2 bg-gray-800 rounded-lg p-1 text-white text-xs" />
                </div>
                <button 
                  type="button" 
                  onClick={addAudioTrack} 
                  className="mt-2 bg-green-600 text-white px-2 py-1 rounded text-xs w-full"
                >
                  {t('admin.movie.addAudioTrack')}
                </button>
              </div>

              {/* الإعدادات الافتراضية */}
              <div className="grid grid-cols-2 gap-3 border-t border-gray-800 pt-4">
                <div>
                  <label className="text-gray-400 text-xs">{t('admin.movie.defaultSubtitle')}</label>
                  <select value={formData.defaultSubtitle} onChange={(e) => setFormData({...formData, defaultSubtitle: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-1 text-white text-xs mt-1">
                    <option value="">{t('admin.movie.noSubtitles')}</option>
                    {subtitlesList.map((sub, i) => (<option key={i} value={sub.lang}>{sub.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs">{t('admin.movie.defaultAudio')}</label>
                  <select value={formData.defaultAudio} onChange={(e) => setFormData({...formData, defaultAudio: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-1 text-white text-xs mt-1">
                    <option value="">{t('admin.movie.originalAudio')}</option>
                    {audioTracksList.map((audio, i) => (<option key={i} value={audio.lang}>{audio.label}</option>))}
                  </select>
                </div>
              </div>

              {/* الحلقات للمسلسلات */}
              {isSeries() && (
                <div className="border-t border-gray-800 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-white font-bold">{t('admin.movie.episodesSection')} ({episodesList.length})</h4>
                    <button type="button" onClick={() => { setShowEpisodeModal(true); }} className="bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <FaPlus size={12} /> {t('admin.movie.addEpisode')}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {episodesList.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 text-sm">{t('admin.movie.noEpisodes')}</div>
                    ) : (
                      episodesList.map(ep => (
                        <div key={ep.id} className="bg-gray-800 rounded-lg p-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-red-400 font-bold text-xs">{t('movie.episode')} {ep.number}</span>
                              <p className="text-white text-xs">{ep.title}</p>
                              <p className="text-gray-500 text-[10px]">{ep.duration}</p>
                            </div>
                            <button type="button" onClick={() => deleteEpisode(ep.id)} className="text-red-400 hover:text-red-300 p-1"><FaTrashAlt /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={saving} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <FaSyncAlt className="animate-spin" /> : <FaSave />} {saving ? t('admin.actions.saving') : t('admin.actions.save')}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition text-sm">
                  <FaTimes className="inline ml-1" /> {t('admin.actions.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Episode */}
      {showEpisodeModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-3 sm:p-4 z-[70]" onClick={() => setShowEpisodeModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 sm:p-4 border-b border-gray-800">
              <h3 className="text-white text-base sm:text-xl font-bold">{t('admin.episode.addNew')}</h3>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <input type="number" placeholder={t('admin.episode.number')} value={episodeFormData.number} onChange={(e) => setEpisodeFormData({...episodeFormData, number: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
                <input type="text" placeholder={t('admin.episode.title')} value={episodeFormData.title} onChange={(e) => setEpisodeFormData({...episodeFormData, title: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
                <input type="text" placeholder={t('admin.episode.duration')} value={episodeFormData.duration} onChange={(e) => setEpisodeFormData({...episodeFormData, duration: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
                <input type="url" placeholder={t('admin.episode.videoUrl')} value={episodeFormData.videoUrl} onChange={(e) => setEpisodeFormData({...episodeFormData, videoUrl: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
                <input type="text" placeholder={t('admin.episode.seasonNum')} value={episodeFormData.season_num} onChange={(e) => setEpisodeFormData({...episodeFormData, season_num: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
                <input type="url" placeholder={t('admin.episode.thumbnail')} value={episodeFormData.thumbnail} onChange={(e) => setEpisodeFormData({...episodeFormData, thumbnail: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
              </div>
              <textarea rows="2" placeholder={t('admin.episode.description')} value={episodeFormData.description} onChange={(e) => setEpisodeFormData({...episodeFormData, description: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"></textarea>
              
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={addEpisode} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm">{t('admin.episode.add')}</button>
                <button type="button" onClick={() => setShowEpisodeModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 text-sm">{t('admin.episode.cancel')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Channels */}
      {showModal && activeTab === 'channels' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 sm:p-4 border-b border-gray-800">
              <h3 className="text-white text-base sm:text-xl font-bold">
                {editingItem ? t('admin.actions.edit') : t('admin.actions.add')} {t('admin.channel.addChannel')}
              </h3>
            </div>
            <form onSubmit={handleChannelSubmit} className="p-4 sm:p-5 space-y-3">
              <input type="text" placeholder={t('admin.channel.name')} value={channelFormData.name} onChange={(e) => setChannelFormData({...channelFormData, name: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
              <input type="text" placeholder={t('admin.channel.nameAr')} value={channelFormData.nameAr} onChange={(e) => setChannelFormData({...channelFormData, nameAr: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
              <input type="url" placeholder={t('admin.channel.logo')} value={channelFormData.logo} onChange={(e) => setChannelFormData({...channelFormData, logo: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
              <input type="url" placeholder={t('admin.channel.streamUrl')} value={channelFormData.url} onChange={(e) => setChannelFormData({...channelFormData, url: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
              <select value={channelFormData.category} onChange={(e) => setChannelFormData({...channelFormData, category: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm">
                {channelCategories.map(c => <option key={c.id} value={c.id}>{t(c.labelKey)}</option>)}
              </select>
              <div className="flex gap-3 pt-3">
                <button type="submit" disabled={saving} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <FaSyncAlt className="animate-spin" /> : <FaSave />} {t('admin.actions.save')}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 text-sm">
                  <FaTimes className="inline ml-1" /> {t('admin.actions.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;