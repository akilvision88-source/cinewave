// src/pages/admin/AdminDashboard.js - نسخة كاملة مع صور المستخدمين
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaFilm, FaTv, FaPlus, FaEdit, FaTrash, FaSignOutAlt, FaStar, 
  FaSave, FaTimes, FaArrowLeft, FaTachometerAlt, FaSearch,
  FaUser, FaBars, FaHome, FaUsers, FaTv as FaChannel,
  FaClosedCaptioning, FaMicrophoneAlt, FaList, FaChevronDown, 
  FaChevronUp, FaTrashAlt, FaMusic, FaQuran, FaChartLine, 
  FaComment, FaDatabase, FaUserShield, FaImage, FaUpload
} from 'react-icons/fa';
import AdminClipsManager from './AdminClipsManager';
import AdminRecitersManager from './AdminRecitersManager';
import AdminSongsManager from './AdminSongsManager';
import AdminUsers from './AdminUsers';
import AdvancedStatistics from './AdvancedStatistics';
import AdminComments from './AdminComments';
import AdminBackup from './AdminBackup';
import AdminRoles from './AdminRoles';
import { moviesAPI, seriesAPI, channelsAPI, subtitlesAPI, audioTracksAPI } from '../../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  // Data states
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
  
  // Episode states
  const [episodesList, setEpisodesList] = useState([]);
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [episodeSubtitles, setEpisodeSubtitles] = useState([]);
  const [episodeAudioTracks, setEpisodeAudioTracks] = useState([]);
  const [newEpisodeSubtitle, setNewEpisodeSubtitle] = useState({ lang: 'ar', url: '' });
  const [newEpisodeAudio, setNewEpisodeAudio] = useState({ lang: 'en', url: '' });
  
  // Subtitle and audio states
  const [subtitlesList, setSubtitlesList] = useState([]);
  const [audioTracksList, setAudioTracksList] = useState([]);
  const [newSubtitle, setNewSubtitle] = useState({ lang: 'ar', label: 'العربية', url: '' });
  const [newAudioTrack, setNewAudioTrack] = useState({ lang: 'ar', label: 'العربية', url: '' });
  
  const [formData, setFormData] = useState({
    id: '', title: '', titleFr: '', titleAr: '', poster: '', backdrop: '', 
    videoUrl: '', rating: '', year: '', genre: '', duration: '', country: '', 
    director: '', cast: '', description: '', descriptionFr: '', descriptionAr: '',
    subtitles: [], defaultSubtitle: '', audioTracks: [], defaultAudio: ''
  });

  const [episodeFormData, setEpisodeFormData] = useState({
    number: '', title: '', titleFr: '', titleAr: '', duration: '', videoUrl: '',
    thumbnail: '', description: ''
  });

  const [channelFormData, setChannelFormData] = useState({
    id: '', name: '', nameAr: '', logo: '', url: '', category: 'arabic'
  });

  const navigate = useNavigate();

  // التحقق من صلاحيات المشرف
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (!token || userRole !== 'admin') {
      navigate('/admin/login');
    }
  }, [navigate]);

  // التحقق من حجم الشاشة
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
      const data = await seriesAPI.getByCategory(category);
      setter(data);
      return data;
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

  // تحميل جميع البيانات
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
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
      setLoading(false);
    };
    loadAllData();
  }, []);

  const handleLogout = () => { 
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userPlan');
    localStorage.removeItem('isAuthenticated');
    navigate('/admin/login'); 
  };

  // ========== دوال الترجمات ==========
  const addSubtitle = () => {
    if (newSubtitle.lang && newSubtitle.url && newSubtitle.label) {
      setSubtitlesList([...subtitlesList, { ...newSubtitle }]);
      setNewSubtitle({ lang: 'ar', label: 'العربية', url: '' });
    } else {
      alert('الرجاء اختيار اللغة وإدخال رابط الترجمة والتسمية');
    }
  };
  
  const removeSubtitle = (index) => setSubtitlesList(subtitlesList.filter((_, i) => i !== index));

  const addAudioTrack = () => {
    if (newAudioTrack.lang && newAudioTrack.url && newAudioTrack.label) {
      setAudioTracksList([...audioTracksList, { ...newAudioTrack }]);
      setNewAudioTrack({ lang: 'ar', label: 'العربية', url: '' });
    } else {
      alert('الرجاء اختيار اللغة وإدخال رابط الصوت والتسمية');
    }
  };
  
  const removeAudioTrack = (index) => setAudioTracksList(audioTracksList.filter((_, i) => i !== index));

  // ========== دوال الحلقات ==========
  const addEpisode = () => {
    if (!episodeFormData.number || !episodeFormData.title || !episodeFormData.videoUrl) {
      alert('الرجاء إدخال رقم الحلقة والعنوان ورابط الفيديو');
      return;
    }
    setEpisodesList([...episodesList, { 
      id: Date.now(), 
      ...episodeFormData, 
      subtitles: episodeSubtitles, 
      audioTracks: episodeAudioTracks 
    }]);
    setShowEpisodeModal(false);
    setEpisodeFormData({ number: '', title: '', titleFr: '', titleAr: '', duration: '', videoUrl: '', thumbnail: '', description: '' });
    setEpisodeSubtitles([]);
    setEpisodeAudioTracks([]);
  };

  const deleteEpisode = (id) => setEpisodesList(episodesList.filter(ep => ep.id !== id));

  const addEpisodeSubtitle = () => {
    if (newEpisodeSubtitle.lang && newEpisodeSubtitle.url) {
      setEpisodeSubtitles([...episodeSubtitles, { 
        ...newEpisodeSubtitle, 
        label: languages.find(l => l.code === newEpisodeSubtitle.lang)?.label 
      }]);
      setNewEpisodeSubtitle({ lang: 'ar', url: '' });
    }
  };
  
  const removeEpisodeSubtitle = (index) => setEpisodeSubtitles(episodeSubtitles.filter((_, i) => i !== index));

  const addEpisodeAudio = () => {
    if (newEpisodeAudio.lang && newEpisodeAudio.url) {
      setEpisodeAudioTracks([...episodeAudioTracks, { 
        ...newEpisodeAudio, 
        label: languages.find(l => l.code === newEpisodeAudio.lang)?.label 
      }]);
      setNewEpisodeAudio({ lang: 'en', url: '' });
    }
  };
  
  const removeEpisodeAudio = (index) => setEpisodeAudioTracks(episodeAudioTracks.filter((_, i) => i !== index));

  // ========== دوال CRUD ==========
  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المحتوى؟')) return;
    
    try {
      if (activeTab === 'channels') {
        await channelsAPI.deleteChannel(id);
        await loadChannels();
      } else if (isSeries()) {
        await seriesAPI.deleteSeries(id);
        await loadSeriesByCategory(getSeriesCategory(activeTab), getSetterByTab(activeTab));
      } else {
        await moviesAPI.deleteMovie(id);
        const category = activeTab === 'animation_movies' ? 'animation' : activeTab;
        await loadMoviesByCategory(category, getSetterByTab(activeTab));
      }
      showNotification('تم الحذف بنجاح');
    } catch (error) {
      console.error('خطأ في الحذف:', error);
      alert('حدث خطأ في الحذف: ' + (error.response?.data?.message || error.message));
    }
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

  const handleEdit = async (item) => {
    setEditingItem(item);
    setFormData({
        id: item.id, title: item.title || '', titleFr: item.title_fr || '', titleAr: item.title_ar || '',
        poster: item.poster || '', backdrop: item.backdrop || '', videoUrl: item.video_url || '',
        rating: item.rating || '', year: item.year || '', genre: item.genre || '',
        duration: item.duration || '', country: item.country || '', director: item.director || '',
        cast: item.cast || '', description: item.description || '', descriptionFr: item.description_fr || '',
        descriptionAr: item.description_ar || '', subtitles: item.subtitles || [], defaultSubtitle: item.default_subtitle || '',
        audioTracks: item.audioTracks || [], defaultAudio: item.default_audio || ''
    });
    
    let subtitlesData = item.subtitles || [];
    let audioTracksData = item.audioTracks || [];
    
    if ((!subtitlesData || subtitlesData.length === 0) && item.id && !isSeries()) {
        try {
            subtitlesData = await subtitlesAPI.getByMovie(item.id);
            audioTracksData = await audioTracksAPI.getByMovie(item.id);
        } catch (error) {
            console.error('Error loading subtitles:', error);
        }
    }
    
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
    setEpisodesList(item.episodes || []);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
        id: '', title: '', titleFr: '', titleAr: '', poster: '', backdrop: '', videoUrl: '',
        rating: '', year: '', genre: '', duration: '', country: '', director: '',
        cast: '', description: '', descriptionFr: '', descriptionAr: '',
        subtitles: [], defaultSubtitle: '', audioTracks: [], defaultAudio: ''
    });
    setSubtitlesList([]);
    setAudioTracksList([]);
    setEpisodesList([]);
  };

  // دالة لتحويل undefined إلى null
  const toNull = (value) => (value === undefined || value === '') ? null : value;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isSeriesTab = ['arabicseries', 'foreignseries', 'indianseries', 'turkishseries', 'koreanseries', 'animation_series'].includes(activeTab);
    const isMovieTab = ['arabwood', 'hollywood', 'bollywood', 'european', 'asian', 'animation_movies'].includes(activeTab);
    
    let category = activeTab;
    if (activeTab === 'animation_movies') category = 'animation';
    if (activeTab === 'animation_series') category = 'animation';
    
    // دالة لتحويل القيم الفارغة إلى null
    const sanitizeValue = (value) => {
        if (value === undefined || value === null || value === '') return null;
        if (typeof value === 'string' && value.trim() === '') return null;
        return value;
    };
    
    // بناء بيانات المسلسل/الفيلم
    const newItem = {
        title: sanitizeValue(formData.title),
        title_ar: sanitizeValue(formData.titleAr),
        title_fr: sanitizeValue(formData.titleFr),
        description: sanitizeValue(formData.description),
        description_ar: sanitizeValue(formData.descriptionAr),
        description_fr: sanitizeValue(formData.descriptionFr),
        poster: sanitizeValue(formData.poster),
        backdrop: sanitizeValue(formData.backdrop),
        video_url: sanitizeValue(formData.videoUrl),
        rating: formData.rating ? parseFloat(formData.rating) : 0,
        year: formData.year ? parseInt(formData.year) : new Date().getFullYear(),
        duration: sanitizeValue(formData.duration),
        genre: sanitizeValue(formData.genre),
        country: sanitizeValue(formData.country),
        director: sanitizeValue(formData.director),
        cast: sanitizeValue(formData.cast),
        category: sanitizeValue(category)
    };
    
    // إضافة الترجمات والمسارات الصوتية
    if (subtitlesList.length > 0) {
        newItem.subtitles = subtitlesList.map(sub => ({
            language: sanitizeValue(sub.lang),
            label: sanitizeValue(sub.label),
            url: sanitizeValue(sub.url),
            is_default: sub.lang === formData.defaultSubtitle ? 1 : 0
        }));
    }
    
    if (audioTracksList.length > 0) {
        newItem.audioTracks = audioTracksList.map(track => ({
            language: sanitizeValue(track.lang),
            label: sanitizeValue(track.label),
            url: sanitizeValue(track.url),
            is_default: track.lang === formData.defaultAudio ? 1 : 0
        }));
    }
    
    // ========== معالجة المسلسلات ==========
    if (isSeriesTab) {
        newItem.seasons = formData.seasons ? parseInt(formData.seasons) : 1;
        
        // معالجة الحلقات - تأكد من وجودها بالشكل الصحيح
        if (episodesList && episodesList.length > 0) {
            newItem.episodes = episodesList.map(ep => ({
                season_num: ep.season_num || 1,
                episode_num: parseInt(ep.number),
                title: sanitizeValue(ep.title),
                title_ar: sanitizeValue(ep.titleAr),
                title_fr: sanitizeValue(ep.titleFr),
                description: sanitizeValue(ep.description),
                video_url: sanitizeValue(ep.videoUrl),
                duration: sanitizeValue(ep.duration),
                thumbnail: sanitizeValue(ep.thumbnail),
                subtitles: ep.subtitles || [],
                audioTracks: ep.audioTracks || []
            }));
        }
    }
    
    // حذف أي خاصية قيمتها null أو undefined
    Object.keys(newItem).forEach(key => {
        if (newItem[key] === null || newItem[key] === undefined) {
            delete newItem[key];
        }
    });
    
    // إذا كان مصفوفة فارغة، احذفها أيضاً
    if (newItem.subtitles && newItem.subtitles.length === 0) delete newItem.subtitles;
    if (newItem.audioTracks && newItem.audioTracks.length === 0) delete newItem.audioTracks;
    if (newItem.episodes && newItem.episodes.length === 0) delete newItem.episodes;
    
    console.log('📤 البيانات المرسلة:', JSON.stringify(newItem, null, 2));
    
    try {
        if (editingItem) {
            if (isSeriesTab) {
                await seriesAPI.updateSeries(editingItem.id, newItem);
            } else {
                await moviesAPI.updateMovie(editingItem.id, newItem);
            }
            showNotification('تم التعديل بنجاح');
        } else {
            if (isSeriesTab) {
                const response = await seriesAPI.addSeries(newItem);
                console.log('✅ تم إضافة المسلسل:', response);
            } else {
                const response = await moviesAPI.addMovie(newItem);
                console.log('✅ تم إضافة الفيلم:', response);
            }
            showNotification('تمت الإضافة بنجاح');
        }
        
        // إعادة تحميل البيانات
        if (isSeriesTab) {
            await loadSeriesByCategory(getSeriesCategory(activeTab), getSetterByTab(activeTab));
        } else if (isMovieTab) {
            await loadMoviesByCategory(category, getSetterByTab(activeTab));
        }
        
        // إغلاق المودال وإعادة تعيين النموذج
        setShowModal(false);
        setEditingItem(null);
        resetForm();
        
    } catch (error) {
        console.error('❌ خطأ في الحفظ:', error);
        const errorMsg = error.response?.data?.message || error.message;
        alert('حدث خطأ في حفظ البيانات: ' + errorMsg);
    }
};

  const handleChannelSubmit = async (e) => {
    e.preventDefault();
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
      await loadChannels();
      showNotification('تم حفظ القناة بنجاح');
    } catch (error) {
      console.error('خطأ في حفظ القناة:', error);
      alert('حدث خطأ في حفظ القناة: ' + (error.response?.data?.message || error.message));
    }
    
    setShowModal(false);
    setEditingItem(null);
    setChannelFormData({ id: '', name: '', nameAr: '', logo: '', url: '', category: 'arabic' });
  };

  const showNotification = (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-fadeIn';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
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

  const isSeries = () => {
    const seriesTabs = ['arabicseries', 'foreignseries', 'indianseries', 'turkishseries', 'koreanseries', 'animation_series'];
    return seriesTabs.includes(activeTab);
  };
  
  const currentData = getCurrentData();
  const filteredData = currentData.filter(item => item.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalMovies = arabwoodMovies.length + hollywoodMovies.length + bollywoodMovies.length + europeanMovies.length + asianMovies.length + animationMovies.length;
  const totalSeries = arabicSeries.length + foreignSeries.length + indianSeries.length + turkishSeries.length + koreanSeries.length + animationSeries.length;

  const languages = [
    { code: 'ar', label: 'العربية' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'ur', label: 'اردو' },
    { code: 'hi', label: 'हिन्दी' }
  ];

  const genres = ['Action', 'Drame', 'Comedie', 'Romance', 'Science-Fiction', 'Thriller', 'Horreur', 'Crime', 'Fantastique', 'Animation', 'Family', 'Adventure'];
  const years = Array.from({ length: 35 }, (_, i) => 2024 - i);
  const countries = ['Egypte', 'Maroc', 'USA', 'UK', 'France', 'Inde', 'Turquie', 'Coree du Sud', 'Arabie Saoudite', 'Emirats Arabes Unis', 'Liban', 'Jordanie', 'Syrie', 'Irak', 'Algerie', 'Tunisie', 'Japon', 'Chine'];

  const channelCategories = [
    { id: 'arabic', label: 'عربية' },
    { id: 'foreign', label: 'أجنبية' },
    { id: 'sports', label: 'رياضية' },
    { id: 'movies', label: 'أفلام' },
    { id: 'kids', label: 'أطفال' },
    { id: 'religious', label: 'دينية' },
    { id: 'music', label: 'موسيقى' },
    { id: 'news', label: 'أخبار' }
  ];

  const menuCategories = [
    { id: 'arabwood', label: 'أفلام عربية', icon: '🇸🇦', count: arabwoodMovies.length, type: 'movie' },
    { id: 'hollywood', label: 'Hollywood', icon: '🇺🇸', count: hollywoodMovies.length, type: 'movie' },
    { id: 'bollywood', label: 'Bollywood', icon: '🇮🇳', count: bollywoodMovies.length, type: 'movie' },
    { id: 'european', label: 'أفلام أوروبية', icon: '🇪🇺', count: europeanMovies.length, type: 'movie' },
    { id: 'asian', label: 'أفلام آسيوية', icon: '🇯🇵', count: asianMovies.length, type: 'movie' },
    { id: 'animation_movies', label: 'أفلام رسوم متحركة', icon: '🎨', count: animationMovies.length, type: 'movie' },
    { id: 'arabicseries', label: 'مسلسلات عربية', icon: '🇸🇦', count: arabicSeries.length, type: 'series' },
    { id: 'foreignseries', label: 'مسلسلات أجنبية', icon: '🌍', count: foreignSeries.length, type: 'series' },
    { id: 'indianseries', label: 'مسلسلات هندية', icon: '🇮🇳', count: indianSeries.length, type: 'series' },
    { id: 'turkishseries', label: 'مسلسلات تركية', icon: '🇹🇷', count: turkishSeries.length, type: 'series' },
    { id: 'koreanseries', label: 'دراما كورية', icon: '🇰🇷', count: koreanSeries.length, type: 'series' },
    { id: 'animation_series', label: 'مسلسلات رسوم متحركة', icon: '🎨', count: animationSeries.length, type: 'series' },
    { id: 'channels', label: 'قنوات TV', icon: '📺', count: channels.length, type: 'channel' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
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
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-500 text-[10px] sm:text-xs hidden sm:block">التحكم الكامل في منصة CineWave</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gray-800 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <FaHome className="text-sm sm:text-base" /><span className="hidden sm:inline">العودة للموقع</span>
            </Link>
            <button onClick={handleLogout} className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-red-600 rounded-lg text-white hover:bg-red-700 transition flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <FaSignOutAlt className="text-sm sm:text-base" /><span className="hidden sm:inline">خروج</span>
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
                  <p className="text-white font-semibold text-sm">المشرف العام</p>
                  <p className="text-gray-500 text-[10px] sm:text-xs">mohcine@akiltv.com</p>
                </div>
              </div>
            </div>
            
            <button onClick={() => { setActiveTab('dashboard'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2 transition text-sm sm:text-base ${activeTab === 'dashboard' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaTachometerAlt className="text-base sm:text-lg" /><span>لوحة التحكم</span>
            </button>
            
            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">🎬 الأفلام</p></div>
            {menuCategories.filter(c => c.type === 'movie').map(cat => (
              <button key={cat.id} onClick={() => { setActiveTab(cat.id); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === cat.id ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <span className="text-base sm:text-lg">{cat.icon}</span><span className="flex-1 text-right text-sm">{cat.label}</span><span className="text-[10px] sm:text-xs bg-gray-700 px-1.5 sm:px-2 py-0.5 rounded-full">{cat.count}</span>
              </button>
            ))}
            
            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">📺 المسلسلات</p></div>
            {menuCategories.filter(c => c.type === 'series').map(cat => (
              <button key={cat.id} onClick={() => { setActiveTab(cat.id); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === cat.id ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <span className="text-base sm:text-lg">{cat.icon}</span><span className="flex-1 text-right text-sm">{cat.label}</span><span className="text-[10px] sm:text-xs bg-gray-700 px-1.5 sm:px-2 py-0.5 rounded-full">{cat.count}</span>
              </button>
            ))}
            
            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">📡 القنوات</p></div>
            <button onClick={() => { setActiveTab('channels'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'channels' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <span className="text-base sm:text-lg">📺</span><span className="flex-1 text-right text-sm">قنوات TV</span><span className="text-[10px] sm:text-xs bg-gray-700 px-1.5 sm:px-2 py-0.5 rounded-full">{channels.length}</span>
            </button>

            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">🎵 الكليبات</p></div>
            <button onClick={() => { setActiveTab('clips'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'clips' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaMusic className="text-base sm:text-lg" /><span className="flex-1 text-right text-sm">إدارة الكليبات</span>
            </button>

            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">🎵 الأغاني</p></div>
            <button onClick={() => { setActiveTab('songs'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'songs' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaMusic className="text-base sm:text-lg" /><span className="flex-1 text-right text-sm">إدارة الأغاني</span>
            </button>

            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">🕌 القرآن</p></div>
            <button onClick={() => { setActiveTab('reciters'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'reciters' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaQuran className="text-base sm:text-lg" /><span className="flex-1 text-right text-sm">إدارة القراء</span>
            </button>
            
            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">📊 التقارير</p></div>
            <button onClick={() => { setActiveTab('statistics'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'statistics' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaChartLine className="text-base sm:text-lg" /><span className="flex-1 text-right text-sm">الإحصائيات المتقدمة</span>
            </button>

            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">💬 التفاعل</p></div>
            <button onClick={() => { setActiveTab('comments'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'comments' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaComment className="text-base sm:text-lg" /><span className="flex-1 text-right text-sm">إدارة التعليقات</span>
            </button>

            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">💾 النظام</p></div>
            <button onClick={() => { setActiveTab('backup'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'backup' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaDatabase className="text-base sm:text-lg" /><span className="flex-1 text-right text-sm">النسخ الاحتياطي</span>
            </button>
            
            <button onClick={() => { setActiveTab('roles'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'roles' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaUserShield className="text-base sm:text-lg" /><span className="flex-1 text-right text-sm">إدارة الصلاحيات</span>
            </button>

            <div className="mt-4 mb-2"><p className="text-[10px] sm:text-xs text-gray-600 px-3">👥 المستخدمين</p></div>
            <button onClick={() => { setActiveTab('users'); if(isMobile) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition text-sm ${activeTab === 'users' ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FaUsers className="text-base sm:text-lg" /><span className="flex-1 text-right text-sm">إدارة المستخدمين</span>
            </button>
          </div>
        </aside>

        {/* خلفية مظلمة للقائمة على الهواتف */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black/70 z-20" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${!isMobile ? 'lg:mr-72' : ''} p-3 sm:p-4 md:p-6`}>
          
          {activeTab === 'dashboard' && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-gray-900 rounded-xl p-3 sm:p-5 border border-gray-800">
                  <div className="flex items-center justify-between mb-2"><FaFilm className="text-purple-400 text-xl sm:text-2xl" /><span className="text-green-400 text-[10px] sm:text-sm">+{totalMovies}</span></div>
                  <p className="text-gray-500 text-[10px] sm:text-sm">إجمالي الأفلام</p>
                  <p className="text-white text-xl sm:text-2xl font-bold">{totalMovies}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-3 sm:p-5 border border-gray-800">
                  <div className="flex items-center justify-between mb-2"><FaTv className="text-blue-400 text-xl sm:text-2xl" /><span className="text-green-400 text-[10px] sm:text-sm">+{totalSeries}</span></div>
                  <p className="text-gray-500 text-[10px] sm:text-sm">إجمالي المسلسلات</p>
                  <p className="text-white text-xl sm:text-2xl font-bold">{totalSeries}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-3 sm:p-5 border border-gray-800">
                  <div className="flex items-center justify-between mb-2"><FaChannel className="text-green-400 text-xl sm:text-2xl" /><span className="text-green-400 text-[10px] sm:text-sm">+{channels.length}</span></div>
                  <p className="text-gray-500 text-[10px] sm:text-sm">إجمالي القنوات</p>
                  <p className="text-white text-xl sm:text-2xl font-bold">{channels.length}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-3 sm:p-5 border border-gray-800">
                  <div className="flex items-center justify-between mb-2"><FaStar className="text-yellow-400 text-xl sm:text-2xl" /><span className="text-green-400 text-[10px] sm:text-sm">★</span></div>
                  <p className="text-gray-500 text-[10px] sm:text-sm">متوسط التقييم</p>
                  <p className="text-white text-xl sm:text-2xl font-bold">8.4</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {menuCategories.map(cat => (
                  <button key={cat.id} onClick={() => setActiveTab(cat.id)} className="bg-gray-900 rounded-xl p-3 sm:p-4 text-center hover:bg-gray-800 transition border border-gray-800">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{cat.icon}</div>
                    <p className="text-white text-xs sm:text-sm font-medium">{cat.label}</p>
                    <p className="text-gray-500 text-[10px] sm:text-xs">{cat.count} محتوى</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Channels Table */}
          {activeTab === 'channels' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">قنوات التلفزيون</h2>
                <button onClick={() => { setEditingItem(null); setChannelFormData({ id: '', name: '', nameAr: '', logo: '', url: '', category: 'arabic' }); setShowModal(true); }} className="bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base"><FaPlus /> إضافة قناة</button>
              </div>
              <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">الشعار</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">الاسم</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">التصنيف</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm hidden md:table-cell">الرابط</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channels.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 sm:py-12 text-gray-500 text-sm">لا توجد قنوات</td>
                      </tr>
                    ) : (
                      channels.map(channel => (
                        <tr key={channel.id} className="border-b border-gray-800">
                          <td className="px-2 sm:px-4 py-2 sm:py-3"><img src={channel.logo} className="w-6 h-6 sm:w-8 sm:h-8 object-contain" alt={channel.name} /></td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-sm">{channel.name}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3"><span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs bg-purple-500/20 text-purple-300">{channel.category}</span></td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 truncate max-w-[120px] sm:max-w-[200px] text-xs hidden md:table-cell">{channel.url}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 flex gap-1 sm:gap-2">
                            <button onClick={() => handleEdit(channel)} className="text-blue-400 p-1"><FaEdit className="text-sm sm:text-base" /></button>
                            <button onClick={() => handleDelete(channel.id)} className="text-red-400 p-1"><FaTrash className="text-sm sm:text-base" /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* باقي الأقسام */}
          {activeTab === 'clips' && <AdminClipsManager />}
          {activeTab === 'reciters' && <AdminRecitersManager />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'songs' && <AdminSongsManager />}
          {activeTab === 'statistics' && <AdvancedStatistics />}
          {activeTab === 'comments' && <AdminComments />}
          {activeTab === 'backup' && <AdminBackup />}
          {activeTab === 'roles' && <AdminRoles />}
          
          {/* Movies & Series Table */}
          {activeTab !== 'dashboard' && activeTab !== 'channels' && activeTab !== 'clips' && activeTab !== 'reciters' && activeTab !== 'users' && activeTab !== 'songs' && activeTab !== 'statistics' && activeTab !== 'comments' && activeTab !== 'backup' && activeTab !== 'roles' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">{menuCategories.find(c => c.id === activeTab)?.label}</h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-48">
                    <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
                    <input type="text" placeholder="بحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg py-1.5 sm:py-2 pr-8 pl-3 text-white text-xs sm:text-sm" />
                  </div>
                  <button onClick={() => { resetForm(); setEditingItem(null); setShowModal(true); }} className="bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-2 text-sm"><FaPlus className="text-sm" /> إضافة</button>
                </div>
              </div>
              <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">الصورة</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">العنوان</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">التصنيف</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">السنة</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">التقييم</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm hidden sm:table-cell">المدة</th>
                      {isSeries() && <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm hidden md:table-cell">الحلقات</th>}
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">الترجمات</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm hidden sm:table-cell">الصوت</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm hidden lg:table-cell">الدولة</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white text-xs sm:text-sm">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="text-center py-8 sm:py-12 text-gray-500 text-sm">لا يوجد محتوى</td>
                      </tr>
                    ) : (
                      filteredData.map(item => (
                        <tr key={item.id} className="border-b border-gray-800">
                          <td className="px-2 sm:px-4 py-2 sm:py-3"><img src={item.poster} className="w-8 h-11 sm:w-10 sm:h-14 object-cover rounded" alt={item.title} /></td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-sm">{item.title}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3"><span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs bg-purple-500/20 text-purple-300 whitespace-nowrap">{item.genre}</span></td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 text-xs sm:text-sm">{item.year}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 text-xs sm:text-sm"><FaStar className="text-yellow-400 inline ml-1 text-xs" /> {item.rating}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 text-xs sm:text-sm hidden sm:table-cell">{item.duration || '-'}</td>
                          {isSeries() && <td className="px-2 sm:px-4 py-2 sm:py-3 text-blue-400 text-xs sm:text-sm hidden md:table-cell">{item.episodes?.length || 0} حلقة</td>}
                          <td className="px-2 sm:px-4 py-2 sm:py-3"><span className="text-[10px] sm:text-xs text-green-400">{item.subtitles?.length || 0} ترجمة</span></td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell"><span className="text-[10px] sm:text-xs text-yellow-400">{item.audioTracks?.length || 0} صوت</span></td>
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

      {/* Modal for Movies/Series */}
      {showModal && activeTab !== 'channels' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 p-3 sm:p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-base sm:text-xl font-bold">{editingItem ? 'تعديل' : 'إضافة'} {menuCategories.find(c => c.id === activeTab)?.label}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <input type="text" placeholder="العنوان (عربي)" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
                <input type="text" placeholder="العنوان (Français)" value={formData.titleFr} onChange={(e) => setFormData({...formData, titleFr: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
                <input type="text" placeholder="العنوان (English)" value={formData.titleAr} onChange={(e) => setFormData({...formData, titleAr: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
                <input type="url" placeholder="رابط الفيديو" value={formData.videoUrl} onChange={(e) => setFormData({...formData, videoUrl: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
                <input type="url" placeholder="رابط الملصق (Poster)" value={formData.poster} onChange={(e) => setFormData({...formData, poster: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
                <input type="url" placeholder="رابط الخلفية (Backdrop)" value={formData.backdrop} onChange={(e) => setFormData({...formData, backdrop: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <input type="number" step="0.1" placeholder="التقييم" value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
                <select value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <input type="text" placeholder="المدة (مثال: 2:15)" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
                <select value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm">
                  <option value="">اختر الدولة</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={formData.genre} onChange={(e) => setFormData({...formData, genre: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm">
                  <option value="">اختر التصنيف</option>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <input type="text" placeholder="المخرج" value={formData.director} onChange={(e) => setFormData({...formData, director: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
                <input type="text" placeholder="طاقم التمثيل" value={formData.cast} onChange={(e) => setFormData({...formData, cast: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
              </div>

              <textarea rows="2" placeholder="القصة (عربي)" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"></textarea>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <textarea rows="2" placeholder="القصة (Français)" value={formData.descriptionFr} onChange={(e) => setFormData({...formData, descriptionFr: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"></textarea>
                <textarea rows="2" placeholder="القصة (English)" value={formData.descriptionAr} onChange={(e) => setFormData({...formData, descriptionAr: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"></textarea>
              </div>

              {/* الترجمات */}
              <div className="border-t border-gray-800 pt-4">
                <div className="flex items-center gap-2 mb-2"><FaClosedCaptioning className="text-red-500 text-sm sm:text-base" /><h4 className="text-white font-bold text-sm sm:text-base">الترجمات (Subtitles) - ملفات بصيغة VTT</h4></div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {subtitlesList.map((sub, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg px-2 sm:px-3 py-1 flex items-center gap-1 sm:gap-2">
                      <span className={`text-[10px] sm:text-xs px-1 rounded ${sub.lang === 'ar' ? 'text-green-400' : sub.lang === 'en' ? 'text-blue-400' : 'text-yellow-400'}`}>{sub.label}</span>
                      <span className="text-gray-500 text-[10px] sm:text-xs truncate max-w-[100px] sm:max-w-[150px]">{sub.url}</span>
                      <button type="button" onClick={() => removeSubtitle(i)} className="text-red-400 text-xs">✕</button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <select value={newSubtitle.lang} onChange={(e) => setNewSubtitle({...newSubtitle, lang: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-1.5 sm:p-2 text-white text-xs sm:text-sm">
                    {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                  <input type="text" placeholder="التسمية" value={newSubtitle.label} onChange={(e) => setNewSubtitle({...newSubtitle, label: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-1.5 sm:p-2 text-white text-xs sm:text-sm" />
                  <input type="url" placeholder="رابط الترجمة (.vtt)" value={newSubtitle.url} onChange={(e) => setNewSubtitle({...newSubtitle, url: e.target.value})} className="col-span-2 bg-gray-800 border border-gray-700 rounded-lg p-1.5 sm:p-2 text-white text-xs sm:text-sm" />
                </div>
                <button type="button" onClick={addSubtitle} className="mt-2 bg-green-600 text-white px-3 py-1 rounded-lg text-xs sm:text-sm w-full">+ إضافة ترجمة</button>
              </div>

              {/* المسارات الصوتية */}
              <div className="border-t border-gray-800 pt-4">
                <div className="flex items-center gap-2 mb-2"><FaMicrophoneAlt className="text-red-500 text-sm sm:text-base" /><h4 className="text-white font-bold text-sm sm:text-base">المسارات الصوتية (Audio Tracks) - روابط MP3/M4A</h4></div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {audioTracksList.map((audio, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg px-2 sm:px-3 py-1 flex items-center gap-1 sm:gap-2">
                      <span className={`text-[10px] sm:text-xs px-1 rounded ${audio.lang === 'ar' ? 'text-green-400' : audio.lang === 'en' ? 'text-blue-400' : 'text-yellow-400'}`}>{audio.label}</span>
                      <span className="text-gray-500 text-[10px] sm:text-xs truncate max-w-[100px] sm:max-w-[150px]">{audio.url}</span>
                      <button type="button" onClick={() => removeAudioTrack(i)} className="text-red-400 text-xs">✕</button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <select value={newAudioTrack.lang} onChange={(e) => setNewAudioTrack({...newAudioTrack, lang: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-1.5 sm:p-2 text-white text-xs sm:text-sm">
                    {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                  <input type="text" placeholder="التسمية" value={newAudioTrack.label} onChange={(e) => setNewAudioTrack({...newAudioTrack, label: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-1.5 sm:p-2 text-white text-xs sm:text-sm" />
                  <input type="url" placeholder="رابط الصوت (MP3/M4A)" value={newAudioTrack.url} onChange={(e) => setNewAudioTrack({...newAudioTrack, url: e.target.value})} className="col-span-2 bg-gray-800 border border-gray-700 rounded-lg p-1.5 sm:p-2 text-white text-xs sm:text-sm" />
                </div>
                <button type="button" onClick={addAudioTrack} className="mt-2 bg-green-600 text-white px-3 py-1 rounded-lg text-xs sm:text-sm w-full">+ إضافة مسار صوتي</button>
              </div>

              {/* الإعدادات الافتراضية */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 border-t border-gray-800 pt-4">
                <div><label className="text-gray-400 text-xs sm:text-sm">الترجمة الافتراضية</label><select value={formData.defaultSubtitle} onChange={(e) => setFormData({...formData, defaultSubtitle: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-1.5 sm:p-2 text-white text-xs sm:text-sm mt-1"><option value="">-- بدون --</option>{subtitlesList.map((sub, i) => (<option key={i} value={sub.lang}>{sub.label}</option>))}</select></div>
                <div><label className="text-gray-400 text-xs sm:text-sm">المسار الصوتي الافتراضي</label><select value={formData.defaultAudio} onChange={(e) => setFormData({...formData, defaultAudio: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-1.5 sm:p-2 text-white text-xs sm:text-sm mt-1"><option value="">-- الصوت الأصلي --</option>{audioTracksList.map((audio, i) => (<option key={i} value={audio.lang}>{audio.label}</option>))}</select></div>
              </div>

              {/* الحلقات للمسلسلات */}
              {isSeries() && (
                <div className="border-t border-gray-800 pt-4">
                  <div className="flex justify-between items-center mb-3"><h4 className="text-white font-bold text-sm sm:text-base">الحلقات ({episodesList.length})</h4><button type="button" onClick={() => { setShowEpisodeModal(true); }} className="bg-green-600 text-white px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm flex items-center gap-1"><FaPlus size={12} /> إضافة حلقة</button></div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {episodesList.map(ep => (
                      <div key={ep.id} className="bg-gray-800 rounded-lg p-2 sm:p-3">
                        <div className="flex justify-between items-center">
                          <div><span className="text-red-400 font-bold text-xs sm:text-sm">الحلقة {ep.number}</span><p className="text-white text-xs sm:text-sm">{ep.title}</p><p className="text-gray-500 text-[10px] sm:text-xs">{ep.duration}</p>{ep.subtitles?.length > 0 && <span className="text-green-400 text-[10px] sm:text-xs ml-2">📝 {ep.subtitles.length} ترجمة</span>}{ep.audioTracks?.length > 0 && <span className="text-yellow-400 text-[10px] sm:text-xs">🎧 {ep.audioTracks.length} صوت</span>}</div>
                          <button type="button" onClick={() => deleteEpisode(ep.id)} className="text-red-400 hover:text-red-300 p-1"><FaTrashAlt className="text-sm" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm sm:text-base"><FaSave className="inline ml-1" /> حفظ</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition text-sm sm:text-base"><FaTimes className="inline ml-1" /> إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Episode */}
      {showEpisodeModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-3 sm:p-4 z-50" onClick={() => setShowEpisodeModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 sm:p-4 border-b border-gray-800"><h3 className="text-white text-base sm:text-xl font-bold">إضافة حلقة جديدة</h3></div>
            <div className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <input type="number" placeholder="رقم الحلقة" value={episodeFormData.number} onChange={(e) => setEpisodeFormData({...episodeFormData, number: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
                <input type="text" placeholder="عنوان الحلقة" value={episodeFormData.title} onChange={(e) => setEpisodeFormData({...episodeFormData, title: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
                <input type="text" placeholder="المدة" value={episodeFormData.duration} onChange={(e) => setEpisodeFormData({...episodeFormData, duration: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
                <input type="url" placeholder="رابط الفيديو" value={episodeFormData.videoUrl} onChange={(e) => setEpisodeFormData({...episodeFormData, videoUrl: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
              </div>
              <textarea rows="2" placeholder="وصف الحلقة" value={episodeFormData.description} onChange={(e) => setEpisodeFormData({...episodeFormData, description: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"></textarea>
              
              <div><h4 className="text-white font-medium text-sm mb-2">ترجمات الحلقة</h4><div className="flex gap-2 mb-2 flex-wrap">{episodeSubtitles.map((s, i) => (<div key={i} className="bg-gray-800 rounded-lg px-2 py-1 flex items-center gap-2"><span className="text-gray-300 text-xs">{s.label}</span><button onClick={() => removeEpisodeSubtitle(i)} className="text-red-400 text-xs">✕</button></div>))}</div><div className="flex gap-2"><select value={newEpisodeSubtitle.lang} onChange={(e) => setNewEpisodeSubtitle({...newEpisodeSubtitle, lang: e.target.value})} className="bg-gray-800 rounded-lg p-1 text-white text-xs flex-1">{languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select><input type="text" placeholder="رابط الترجمة (.vtt)" value={newEpisodeSubtitle.url} onChange={(e) => setNewEpisodeSubtitle({...newEpisodeSubtitle, url: e.target.value})} className="flex-2 bg-gray-800 rounded-lg p-1 text-white text-xs" /><button onClick={addEpisodeSubtitle} className="bg-green-600 text-white px-2 py-1 rounded text-xs">+</button></div></div>
              
              <div><h4 className="text-white font-medium text-sm mb-2">أصوات الحلقة</h4><div className="flex gap-2 mb-2 flex-wrap">{episodeAudioTracks.map((a, i) => (<div key={i} className="bg-gray-800 rounded-lg px-2 py-1 flex items-center gap-2"><span className="text-gray-300 text-xs">{a.label}</span><button onClick={() => removeEpisodeAudio(i)} className="text-red-400 text-xs">✕</button></div>))}</div><div className="flex gap-2"><select value={newEpisodeAudio.lang} onChange={(e) => setNewEpisodeAudio({...newEpisodeAudio, lang: e.target.value})} className="bg-gray-800 rounded-lg p-1 text-white text-xs flex-1">{languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select><input type="text" placeholder="رابط الصوت (MP3)" value={newEpisodeAudio.url} onChange={(e) => setNewEpisodeAudio({...newEpisodeAudio, url: e.target.value})} className="flex-2 bg-gray-800 rounded-lg p-1 text-white text-xs" /><button onClick={addEpisodeAudio} className="bg-green-600 text-white px-2 py-1 rounded text-xs">+</button></div></div>
              
              <div className="flex gap-3 pt-3"><button onClick={addEpisode} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm">إضافة الحلقة</button><button onClick={() => setShowEpisodeModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 text-sm">إلغاء</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Channels */}
      {showModal && activeTab === 'channels' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 sm:p-4 border-b border-gray-800"><h3 className="text-white text-base sm:text-xl font-bold">{editingItem ? 'تعديل' : 'إضافة'} قناة</h3></div>
            <form onSubmit={handleChannelSubmit} className="p-4 sm:p-5 space-y-3">
              <input type="text" placeholder="اسم القناة" value={channelFormData.name} onChange={(e) => setChannelFormData({...channelFormData, name: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
              <input type="text" placeholder="اسم القناة (عربي)" value={channelFormData.nameAr} onChange={(e) => setChannelFormData({...channelFormData, nameAr: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
              <input type="url" placeholder="رابط الشعار" value={channelFormData.logo} onChange={(e) => setChannelFormData({...channelFormData, logo: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
              <input type="url" placeholder="رابط البث (m3u8)" value={channelFormData.url} onChange={(e) => setChannelFormData({...channelFormData, url: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" required />
              <select value={channelFormData.category} onChange={(e) => setChannelFormData({...channelFormData, category: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm">
                {channelCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <div className="flex gap-3 pt-3"><button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm">حفظ</button><button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 text-sm">إلغاء</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;