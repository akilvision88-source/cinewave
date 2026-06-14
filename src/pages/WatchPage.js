// src/pages/WatchPage.js - نسخة مبسطة ومضمونة
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { moviesAPI, seriesAPI } from '../services/api';
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import AdvancedHTML5Player from '../components/AdvancedHTML5Player';

const WatchPage = () => {
  const { id } = useParams();
  const { language, t } = useLanguage();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(null);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [progress, setProgress] = useState(0);

  // دالة بسيطة لحفظ الفيلم في السجل
  const saveToHistory = (contentData, contentType, watchProgress = 0) => {
    try {
      console.log('💾 محاولة حفظ في السجل:', contentData.title);
      
      // جلب السجل الحالي
      let history = localStorage.getItem('cinewave_watch_history');
      let historyArray = history ? JSON.parse(history) : [];
      
      // إنشاء عنصر السجل
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
      
      // التحقق من وجود الفيلم مسبقاً
      const existingIndex = historyArray.findIndex(item => item.id === contentData.id && item.type === contentType);
      
      if (existingIndex !== -1) {
        // تحديث الموجود
        historyArray[existingIndex] = historyItem;
        console.log('🔄 تحديث الفيلم في السجل:', contentData.title);
      } else {
        // إضافة جديد
        historyArray.unshift(historyItem);
        console.log('✅ إضافة فيلم جديد إلى السجل:', contentData.title);
      }
      
      // حفظ في localStorage
      localStorage.setItem('cinewave_watch_history', JSON.stringify(historyArray));
      
      // التحقق من الحفظ
      const saved = localStorage.getItem('cinewave_watch_history');
      console.log('📋 السجل بعد الحفظ:', saved);
      
      // إظهار إشعار
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 2000);
      
      // إرسال حدث للتحديث
      window.dispatchEvent(new Event('historyUpdated'));
      window.dispatchEvent(new Event('storage'));
      
      return true;
    } catch (error) {
      console.error('❌ خطأ في حفظ السجل:', error);
      return false;
    }
  };

  // حفظ عند التقدم
  const updateProgress = (currentTime, duration) => {
    if (duration > 0 && currentTime > 0) {
      const newProgress = (currentTime / duration) * 100;
      setProgress(newProgress);
      
      // حفظ كل 30 ثانية
      if (Math.floor(currentTime) % 30 === 0 && content && newProgress > 5) {
        saveToHistory(content, type, newProgress);
      }
    }
  };

  // حفظ عند انتهاء الفيديو
  const handleEnded = () => {
    if (content) {
      saveToHistory(content, type, 100);
      console.log('🏁 انتهى الفيديو وتم حفظه');
    }
  };

  // تحميل المحتوى وحفظه فوراً
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setProgress(0);
      
      try {
        // محاولة جلب فيلم
        let data = await moviesAPI.getById(id);
        if (data && data.id) {
          setContent(data);
          setType('movie');
          console.log('🎬 تم تحميل الفيلم:', data.title);
          
          // حفظ فوراً عند التحميل
          saveToHistory(data, 'movie', 0);
        } else {
          // جرب مسلسل
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

  // حفظ عند مغادرة الصفحة
  useEffect(() => {
    return () => {
      if (content && progress > 5 && progress < 95) {
        saveToHistory(content, type, progress);
        console.log('💾 حفظ قبل الخروج:', progress + '%');
      }
    };
  }, [content, type, progress]);

  const getTitle = () => {
    if (!content) return '';
    if (language === 'ar') return content.title_ar || content.title;
    if (language === 'fr') return content.title_fr || content.title;
    return content.title;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-center">
        <div>
          <p className="text-white text-xl mb-4">⚠️ لا يوجد محتوى</p>
          <Link to="/movies" className="bg-red-600 text-white px-4 py-2 rounded">العودة</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* زر العودة */}
      <Link 
        to={`/${type}/${id}`} 
        className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-sm p-2 rounded-lg text-white hover:text-red-500 transition flex items-center gap-2"
      >
        <FaArrowLeft /> {t('common.back')}
      </Link>
      
      {/* عنوان الفيديو */}
      <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-sm p-2 rounded-lg text-white text-sm">
        {getTitle()}
      </div>
      
      {/* إشعار الحفظ */}
      {showSaveNotification && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 animate-fadeIn">
          <FaCheckCircle className="text-white" />
          <span>تم حفظ الفيلم في سجل المشاهدة</span>
        </div>
      )}
      
      {/* مشغل الفيديو */}
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <AdvancedHTML5Player
            videoUrl={content.video_url || content.videoUrl}
            poster={content.poster}
            title={getTitle()}
            autoPlay={true}
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
      
      {/* شريط التقدم */}
      {progress > 0 && progress < 100 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
          <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${progress}%` }} />
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