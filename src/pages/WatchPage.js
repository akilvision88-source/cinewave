// src/pages/WatchPage.js - نسخة معدلة لاستخدام API
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { moviesAPI, seriesAPI } from '../services/api';
import { FaArrowLeft } from 'react-icons/fa';
import AdvancedHTML5Player from '../components/AdvancedHTML5Player';

const WatchPage = () => {
  const { id } = useParams();
  const { language, t } = useLanguage();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(null);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        // محاولة جلب فيلم أولاً
        let data = await moviesAPI.getById(id);
        if (data && data.id) {
          setContent(data);
          setType('movie');
        } else {
          // إذا لم يوجد، جرب مسلسل
          data = await seriesAPI.getById(id);
          if (data && data.id) {
            setContent(data);
            setType('series');
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

  const getTitle = () => {
    if (!content) return '';
    if (language === 'ar') return content.title_ar || content.title;
    if (language === 'fr') return content.title_fr || content.title;
    return content.title;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">{t('common.loading')}</p>
        </div>
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
    <div className="fixed inset-0 bg-black">
      <Link to={`/${type}/${id}`} className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-sm p-2 rounded-lg text-white hover:text-red-500 transition flex items-center gap-2">
        <FaArrowLeft /> {t('common.back')}
      </Link>
      <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-sm p-2 rounded-lg text-white text-sm">
        {getTitle()}
      </div>
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
            onEnded={() => console.log('Video ended')}
            onError={(error) => console.error('Player error:', error)}
          />
        </div>
      </div>
    </div>
  );
};

export default WatchPage;