// src/pages/WatchPage.js - نسخة كاملة مع دعم Escape والعودة
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { moviesAPI, seriesAPI } from '../services/api';
import { FaArrowLeft, FaCheckCircle, FaHome } from 'react-icons/fa';
import AdvancedHTML5Player from '../components/AdvancedHTML5Player';

const WatchPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(null);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef(null);

  // ========== دالة الخروج من ملء الشاشة والعودة للصفحة السابقة ==========
  const exitFullscreenAndGoBack = async () => {
    // الخروج من ملء الشاشة
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.webkitFullscreenElement) {
        await document.webkitExitFullscreen();
      } else if (document.mozFullScreenElement) {
        await document.mozCancelFullScreen();
      } else if (document.msFullscreenElement) {
        await document.msExitFullscreen();
      }
    } catch (error) {
      console.log('خطأ في الخروج من ملء الشاشة:', error);
    }
    
    // العودة إلى الصفحة السابقة
    navigate(-1);
  };

  // ========== مستمع للضغط على Escape ==========
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        exitFullscreenAndGoBack();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ========== مستمع لحدث العودة في الهاتف (popstate) ==========
  useEffect(() => {
    const handlePopState = () => {
      exitFullscreenAndGoBack();
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // ========== مستمع لتغيير ملء الشاشة ==========
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // ========== دالة حفظ الفيلم في السجل ==========
  const saveToHistory = (contentData, contentType, watchProgress = 0) => {
    try {
      console.log('💾 محاولة حفظ في السجل:', contentData.title);
      
      let history = localStorage.getItem('cinewave_watch_history');
      let historyArray = history ? JSON.parse(history) : [];
      
      const historyItem = {
        id: contentData.id,
        type: contentType,
        title: contentData.title,
        title_ar: contentData.title_ar || contentData.title,
        poster: contentData.poster,
        year: contentData.year,
        rating: contentData.rating,
        duration: contentData.duration,
        description: contentData.description || contentData.description_ar,
        progress: Math.floor(watchProgress),
        watchedAt: new Date().toISOString()
      };
      
      const existingIndex = historyArray.findIndex(item => item.id === contentData.id && item.type === contentType);
      
      if (existingIndex !== -1) {
        historyArray[existingIndex] = historyItem;
        console.log('🔄 تحديث الفيلم في السجل:', contentData.title);
      } else {
        historyArray.unshift(historyItem);
        console.log('✅ إضافة فيلم جديد إلى السجل:', contentData.title);
      }
      
      localStorage.setItem('cinewave_watch_history', JSON.stringify(historyArray));
      
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 2000);
      
      window.dispatchEvent(new Event('historyUpdated'));
      window.dispatchEvent(new Event('storage'));
      
      return true;
    } catch (error) {
      console.error('❌ خطأ في حفظ السجل:', error);
      return false;
    }
  };

  // ========== حفظ عند التقدم ==========
  const updateProgress = (currentTime, duration) => {
    if (duration > 0 && currentTime > 0) {
      const newProgress = (currentTime / duration) * 100;
      setProgress(newProgress);
      
      if (Math.floor(currentTime) % 30 === 0 && content && newProgress > 5) {
        saveToHistory(content, type, newProgress);
      }
    }
  };

  // ========== حفظ عند انتهاء الفيديو ==========
  const handleEnded = () => {
    if (content) {
      saveToHistory(content, type, 100);
      console.log('🏁 انتهى الفيديو وتم حفظه');
    }
  };

  // ========== تحميل المحتوى ==========
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setProgress(0);
      
      try {
        let data = await moviesAPI.getById(id);
        if (data && data.id) {
          setContent(data);
          setType('movie');
          console.log('🎬 تم تحميل الفيلم:', data.title);
          saveToHistory(data, 'movie', 0);
        } else {
          data = await seriesAPI.getById(id);
          if (data && data.id) {
            setContent(data);
            setType('series');
            console.log('📺 تم تحميل المسلسل:', data.title);
            saveToHistory(data, 'series', 0);
          }
        }
      } catch (error) {
        console.error('Error loading content:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadContent();
    }
  }, [id]);

  // ========== حفظ عند مغادرة الصفحة ==========
  useEffect(() => {
    return () => {
      if (content && progress > 5 && progress < 95) {
        saveToHistory(content, type, progress);
        console.log('💾 حفظ قبل الخروج:', progress + '%');
      }
    };
  }, [content, type, progress]);

  // ========== الحصول على العنوان ==========
  const getTitle = () => {
    if (!content) return '';
    if (language === 'ar') return content.title_ar || content.title;
    if (language === 'fr') return content.title_fr || content.title;
    return content.title;
  };

  // ========== حالة التحميل ==========
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">جاري تحميل المحتوى...</p>
        </div>
      </div>
    );
  }

  // ========== المحتوى غير موجود ==========
  if (!content) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-center">
        <div>
          <div className="text-5xl mb-4">🎬</div>
          <p className="text-white text-xl mb-4">⚠️ لا يوجد محتوى</p>
          <Link to="/movies" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition inline-flex items-center gap-2">
            <FaHome className="text-sm" /> العودة إلى الأفلام
          </Link>
        </div>
      </div>
    );
  }

  // ========== واجهة المشغل ==========
  return (
    <div className="fixed inset-0 bg-black z-50" ref={videoContainerRef}>
      {/* ✅ زر العودة المعدل - يخرج من ملء الشاشة ويعود للصفحة السابقة */}
      <button 
        onClick={exitFullscreenAndGoBack}
        className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-sm p-2 rounded-lg text-white hover:bg-red-600 transition flex items-center gap-2 group"
        title="العودة (Esc)"
      >
        <FaArrowLeft className="text-lg" />
        <span className="hidden sm:inline text-sm">العودة</span>
        <span className="hidden sm:inline text-xs text-gray-400 group-hover:text-white">(Esc)</span>
      </button>
      
      {/* عنوان الفيديو */}
      <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-sm p-2 rounded-lg text-white text-sm max-w-[50%] truncate">
        {getTitle()}
        {type && (
          <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${
            type === 'movie' ? 'bg-purple-500/50' : 'bg-blue-500/50'
          }`}>
            {type === 'movie' ? '🎬 فيلم' : '📺 مسلسل'}
          </span>
        )}
      </div>
      
      {/* إشعار الحفظ */}
      {showSaveNotification && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 animate-fadeIn">
          <FaCheckCircle className="text-white" />
          <span>تم حفظ {type === 'movie' ? 'الفيلم' : 'المسلسل'} في سجل المشاهدة</span>
        </div>
      )}
      
      {/* إشعار ملء الشاشة */}
      {isFullscreen && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs animate-fadeIn">
          ⛶ اضغط Esc للخروج من ملء الشاشة والعودة
        </div>
      )}
      
      {/* مشغل الفيديو مع تفعيل ملء الشاشة التلقائي */}
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <AdvancedHTML5Player
            videoUrl={content.video_url || content.videoUrl}
            poster={content.poster}
            title={getTitle()}
            artist={content.director || content.country || ''}
            autoPlay={true}
            autoFullscreen={true}
            onExitFullscreen={exitFullscreenAndGoBack}
            subtitles={content.subtitles || []}
            audioTracks={content.audio_tracks || []}
            defaultSubtitle={content.default_subtitle || ''}
            defaultAudio={content.default_audio || ''}
            videoId={content.id}
            onProgress={updateProgress}
            onEnded={handleEnded}
            onError={(error) => console.error('Player error:', error)}
          />
        </div>
      </div>
      
      {/* شريط التقدم في الأسفل */}
      {progress > 0 && progress < 100 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 z-30">
          <div 
            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* شريط التقدم النصي (يظهر عند hover) */}
      {progress > 0 && progress < 100 && (
        <div className="absolute bottom-4 right-4 z-30 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs opacity-0 hover:opacity-100 transition-opacity">
          {Math.round(progress)}%
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default WatchPage;