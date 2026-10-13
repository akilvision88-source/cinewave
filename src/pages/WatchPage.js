// src/pages/WatchPage.js - المشغل النهائي مع حفظ التقدم (بدون تغيير - نسخة كاملة)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { moviesAPI, seriesAPI } from '../services/api';
import { FaArrowLeft, FaCheckCircle, FaHome } from 'react-icons/fa';
import AdvancedHTML5Player from '../components/AdvancedHTML5Player';

const WatchPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(null);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [resumeTime, setResumeTime] = useState(0);

  const videoContainerRef = useRef(null);
  const contentRef = useRef(null);
  const typeRef = useRef(null);
  const progressRef = useRef(0);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const currentEpisodeRef = useRef(null);
  const lastSavedRef = useRef(0);
  const isNavigatingRef = useRef(false);

  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { typeRef.current = type; }, [type]);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { currentEpisodeRef.current = currentEpisode; }, [currentEpisode]);

  const getProgressKey = useCallback((contentType, contentId, episodeId = null) => {
    if (contentType === 'series' && episodeId) return `cinewave_progress_series_${contentId}_ep_${episodeId}`;
    return `cinewave_progress_${contentType}_${contentId}`;
  }, []);

  const exitFullscreenAndGoBack = useCallback(async () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    const ct = currentTimeRef.current;
    const d = durationRef.current;
    if (contentRef.current && d > 0 && ct > 0) {
      const percent = (ct / d) * 100;
      if (percent > 1 && percent < 98) {
        const key = getProgressKey(typeRef.current, contentRef.current.id, currentEpisodeRef.current?.id);
        localStorage.setItem(key, JSON.stringify({
          currentTime: ct, duration: d, percent, savedAt: new Date().toISOString()
        }));
      }
    }

    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.webkitFullscreenElement) await document.webkitExitFullscreen();
      else if (document.mozFullScreenElement) await document.mozCancelFullScreen();
      else if (document.msFullscreenElement) await document.msExitFullscreen();
    } catch (error) { console.log(error); }

    navigate(-1);
  }, [navigate, getProgressKey]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); exitFullscreenAndGoBack(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exitFullscreenAndGoBack]);

  useEffect(() => {
    const handlePopState = () => {
      const ct = currentTimeRef.current;
      const d = durationRef.current;
      if (contentRef.current && d > 0 && ct > 0) {
        const percent = (ct / d) * 100;
        if (percent > 1 && percent < 98) {
          const key = getProgressKey(typeRef.current, contentRef.current.id, currentEpisodeRef.current?.id);
          localStorage.setItem(key, JSON.stringify({ currentTime: ct, duration: d, percent, savedAt: new Date().toISOString() }));
        }
      }
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getProgressKey]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const saveToHistory = useCallback((contentData, contentType, watchProgress = 0, showNotif = true, episodeData = null) => {
    if (!contentData || !contentType) return false;
    try {
      const history = localStorage.getItem('cinewave_watch_history');
      const historyArray = history ? JSON.parse(history) : [];

      const historyItem = {
        id: contentData.id, type: contentType,
        title: contentData.title, title_ar: contentData.title_ar || contentData.title,
        title_fr: contentData.title_fr, poster: contentData.poster,
        year: contentData.year, rating: contentData.rating,
        duration: contentData.duration,
        description: contentData.description || contentData.description_ar,
        progress: Math.floor(watchProgress),
        watchedAt: new Date().toISOString(),
        episode: episodeData ? {
          id: episodeData.id, episode_num: episodeData.episode_num,
          season_num: episodeData.season_num,
          title: episodeData.title, title_ar: episodeData.title_ar
        } : null
      };

      const existingIndex = historyArray.findIndex(item => item.id === contentData.id && item.type === contentType);
      if (existingIndex !== -1) historyArray[existingIndex] = historyItem;
      else historyArray.unshift(historyItem);

      if (historyArray.length > 100) historyArray.splice(100);
      localStorage.setItem('cinewave_watch_history', JSON.stringify(historyArray));

      if (showNotif) {
        setShowSaveNotification(true);
        setTimeout(() => setShowSaveNotification(false), 2000);
      }
      window.dispatchEvent(new Event('historyUpdated'));
      return true;
    } catch (error) { console.error(error); return false; }
  }, []);

  const updateProgress = useCallback((currentTime, duration) => {
    if (!duration || duration <= 0 || currentTime <= 0) return;
    currentTimeRef.current = currentTime;
    durationRef.current = duration;
    const newProgress = (currentTime / duration) * 100;
    setProgress(newProgress);

    const currentSecond = Math.floor(currentTime);
    if (currentSecond - lastSavedRef.current >= 5 && newProgress > 1 && newProgress < 98) {
      lastSavedRef.current = currentSecond;
      const key = getProgressKey(typeRef.current, contentRef.current?.id, currentEpisodeRef.current?.id);
      if (contentRef.current?.id) {
        localStorage.setItem(key, JSON.stringify({
          currentTime, duration, percent: newProgress, savedAt: new Date().toISOString()
        }));
      }
      saveToHistory(contentRef.current, typeRef.current, newProgress, false, currentEpisodeRef.current);
    }
  }, [saveToHistory, getProgressKey]);

  const handleEnded = useCallback(() => {
    if (contentRef.current) {
      saveToHistory(contentRef.current, typeRef.current, 100, true, currentEpisodeRef.current);
      const key = getProgressKey(typeRef.current, contentRef.current.id, currentEpisodeRef.current?.id);
      localStorage.removeItem(key);
    }
  }, [saveToHistory, getProgressKey]);

  const handleEpisodeChange = useCallback((episode) => {
    if (!episode) return;

    const ct = currentTimeRef.current;
    const d = durationRef.current;
    if (contentRef.current && d > 0 && ct > 0 && currentEpisodeRef.current) {
      const percent = (ct / d) * 100;
      if (percent > 1 && percent < 98) {
        const oldKey = getProgressKey(typeRef.current, contentRef.current.id, currentEpisodeRef.current.id);
        localStorage.setItem(oldKey, JSON.stringify({ currentTime: ct, duration: d, percent, savedAt: new Date().toISOString() }));
      }
    }

    setCurrentEpisode(episode);
    const newUrl = episode.video_url || episode.videoUrl;
    setCurrentVideoUrl(newUrl);
    setProgress(0);
    lastSavedRef.current = 0;
    currentTimeRef.current = 0;
    durationRef.current = 0;

    const newKey = getProgressKey('series', contentRef.current?.id, episode.id);
    try {
      const saved = localStorage.getItem(newKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.percent > 1 && parsed.percent < 98) setResumeTime(parsed.currentTime);
        else setResumeTime(0);
      } else setResumeTime(0);
    } catch (e) { setResumeTime(0); }

    if (contentRef.current) saveToHistory(contentRef.current, 'series', 0, false, episode);
    if (contentRef.current && episode.id) {
      localStorage.setItem(`cinewave_last_episode_${contentRef.current.id}`, JSON.stringify({
        episodeId: episode.id, episodeNum: episode.episode_num,
        seasonNum: episode.season_num, title: episode.title
      }));
    }
  }, [saveToHistory, getProgressKey]);

  useEffect(() => {
    let isCancelled = false;
    const loadContent = async () => {
      setLoading(true);
      setProgress(0);
      lastSavedRef.current = 0;
      isNavigatingRef.current = false;
      setCurrentEpisode(null);
      setCurrentVideoUrl('');
      setResumeTime(0);

      try {
        let data = await moviesAPI.getById(id);
        if (isCancelled) return;

        if (data && data.id) {
          setContent(data);
          setType('movie');
          setCurrentVideoUrl(data.video_url || data.videoUrl);
          saveToHistory(data, 'movie', 0, false);
          const key = getProgressKey('movie', data.id);
          try {
            const saved = localStorage.getItem(key);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.percent > 1 && parsed.percent < 98) setResumeTime(parsed.currentTime);
            }
          } catch (e) {}
        } else {
          data = await seriesAPI.getById(id);
          if (isCancelled) return;
          if (data && data.id) {
            setContent(data);
            setType('series');
            if (data.episodes && data.episodes.length > 0) {
              const sortedEps = [...data.episodes].sort((a, b) => {
                const sa = a.season_num || 1, sb = b.season_num || 1;
                if (sa !== sb) return sa - sb;
                return (a.episode_num || 0) - (b.episode_num || 0);
              });

              let episodeToPlay = sortedEps[0];
              try {
                const lastEpData = localStorage.getItem(`cinewave_last_episode_${data.id}`);
                if (lastEpData) {
                  const lastEp = JSON.parse(lastEpData);
                  const foundEp = sortedEps.find(ep => ep.id === lastEp.episodeId);
                  if (foundEp) episodeToPlay = foundEp;
                }
              } catch (e) {}

              setCurrentEpisode(episodeToPlay);
              setCurrentVideoUrl(episodeToPlay.video_url || episodeToPlay.videoUrl);
              saveToHistory(data, 'series', 0, false, episodeToPlay);

              const key = getProgressKey('series', data.id, episodeToPlay.id);
              try {
                const saved = localStorage.getItem(key);
                if (saved) {
                  const parsed = JSON.parse(saved);
                  if (parsed.percent > 1 && parsed.percent < 98) setResumeTime(parsed.currentTime);
                }
              } catch (e) {}
            } else {
              setCurrentVideoUrl(data.video_url || data.videoUrl);
              saveToHistory(data, 'series', 0, false);
            }
          }
        }
      } catch (error) { if (!isCancelled) console.error(error); }
      finally { if (!isCancelled) setLoading(false); }
    };

    if (id) loadContent();
    return () => { isCancelled = true; };
  }, [id, saveToHistory, getProgressKey]);

  useEffect(() => {
    return () => {
      const ct = currentTimeRef.current;
      const d = durationRef.current;
      if (contentRef.current && d > 0 && ct > 0) {
        const percent = (ct / d) * 100;
        if (percent > 1 && percent < 98) {
          const key = getProgressKey(typeRef.current, contentRef.current.id, currentEpisodeRef.current?.id);
          localStorage.setItem(key, JSON.stringify({ currentTime: ct, duration: d, percent, savedAt: new Date().toISOString() }));
        }
      }
    };
  }, [getProgressKey]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const ct = currentTimeRef.current;
        const d = durationRef.current;
        if (contentRef.current && d > 0 && ct > 0) {
          const percent = (ct / d) * 100;
          if (percent > 1 && percent < 98) {
            const key = getProgressKey(typeRef.current, contentRef.current.id, currentEpisodeRef.current?.id);
            localStorage.setItem(key, JSON.stringify({ currentTime: ct, duration: d, percent, savedAt: new Date().toISOString() }));
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [getProgressKey]);

  const getTitle = useCallback(() => {
    if (!content) return '';
    let baseTitle = '';
    if (language === 'ar') baseTitle = content.title_ar || content.title;
    else if (language === 'fr') baseTitle = content.title_fr || content.title;
    else baseTitle = content.title;

    if (type === 'series' && currentEpisode) {
      const epNum = currentEpisode.episode_num;
      const seasonNum = currentEpisode.season_num || 1;
      const epTitle = language === 'ar' ? (currentEpisode.title_ar || currentEpisode.title) : currentEpisode.title;
      if (seasonNum > 1) return `${baseTitle} - S${seasonNum}E${epNum}${epTitle ? ` - ${epTitle}` : ''}`;
      return `${baseTitle} - الحلقة ${epNum}${epTitle ? ` - ${epTitle}` : ''}`;
    }
    return baseTitle;
  }, [content, language, type, currentEpisode]);

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

  if (!content || !currentVideoUrl) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-center">
        <div>
          <div className="text-5xl mb-4">🎬</div>
          <p className="text-white text-xl mb-4">⚠️ لا يوجد محتوى</p>
          <Link to="/movies" className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-2 rounded-lg hover:scale-105 transition inline-flex items-center gap-2">
            <FaHome className="text-sm" /> العودة إلى الأفلام
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50" ref={videoContainerRef}>
      <button
        onClick={exitFullscreenAndGoBack}
        className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-sm p-2 rounded-xl text-white hover:bg-red-600 transition flex items-center gap-2 border border-white/20"
      >
        <FaArrowLeft className="text-lg" />
        <span className="hidden sm:inline text-sm">العودة</span>
        <span className="hidden sm:inline text-xs text-gray-400">(Esc)</span>
      </button>

      {showSaveNotification && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2">
          <FaCheckCircle /> <span>تم الحفظ في السجل</span>
        </div>
      )}

      {isFullscreen && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs">
          ⛶ اضغط Esc للخروج من ملء الشاشة والعودة
        </div>
      )}

      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <AdvancedHTML5Player
            videoUrl={currentVideoUrl}
            poster={content.poster}
            title={getTitle()}
            autoPlay={true}
            startTime={resumeTime}
            onExitFullscreen={exitFullscreenAndGoBack}
            subtitles={content.subtitles || []}
            audioTracks={content.audio_tracks || []}
            defaultSubtitle={content.default_subtitle || ''}
            videoId={content.id}
            onProgress={updateProgress}
            onEnded={handleEnded}
            onError={(error) => console.error('Player error:', error)}
            episodes={type === 'series' ? (content.episodes || []) : []}
            currentEpisodeId={currentEpisode?.id || null}
            onEpisodeChange={handleEpisodeChange}
            contentType={type}
            watermark={{ text: 'Akil-TV', enabled: true }}
          />
        </div>
      </div>

      {progress > 0 && progress < 100 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 z-30 pointer-events-none">
          <div className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
};

export default WatchPage;