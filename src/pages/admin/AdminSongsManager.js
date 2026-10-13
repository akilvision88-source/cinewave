// src/pages/admin/AdminSongsManager.js
import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaEdit, FaTrash, FaMusic, FaUser, FaSave, FaTimes, 
  FaSearch, FaPlay, FaStop, FaHeadphones, FaGlobe, FaSyncAlt,
  FaDownload, FaChartLine, FaClock
} from 'react-icons/fa';
import { songsAPI, artistsAPI } from '../../services/api';

const AdminSongsManager = () => {
  const [artists, setArtists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [showSongModal, setShowSongModal] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);
  const [editingSong, setEditingSong] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewAudio, setPreviewAudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [artistForm, setArtistForm] = useState({
    name: '', nameAr: '', nameEn: '', country: '', genre: '', image: '', bio: ''
  });
  
  const [songForm, setSongForm] = useState({
    title: '', titleAr: '', titleEn: '', duration: '', audioUrl: '', coverImage: '', 
    lyrics: '', year: new Date().getFullYear(), genre: '', subGenre: '', plays: 0
  });

  // ========== CONSTANTS ==========
  const countries = [
    { id: 'moroccan', label: '🇲🇦 المغرب', nameAr: 'المغرب', nameEn: 'Morocco' },
    { id: 'egyptian', label: '🇪🇬 مصر', nameAr: 'مصر', nameEn: 'Egypt' },
    { id: 'lebanese', label: '🇱🇧 لبنان', nameAr: 'لبنان', nameEn: 'Lebanon' },
    { id: 'gulf', label: '🇸🇦 الخليج', nameAr: 'الخليج العربي', nameEn: 'Gulf' },
    { id: 'algerian', label: '🇩🇿 الجزائر', nameAr: 'الجزائر', nameEn: 'Algeria' },
    { id: 'tunisian', label: '🇹🇳 تونس', nameAr: 'تونس', nameEn: 'Tunisia' },
    { id: 'english', label: '🇬🇧 إنجليزي', nameAr: 'إنجلترا', nameEn: 'England' },
    { id: 'american', label: '🇺🇸 أمريكي', nameAr: 'أمريكا', nameEn: 'USA' },
    { id: 'indian', label: '🇮🇳 هندي', nameAr: 'الهند', nameEn: 'India' },
    { id: 'turkish', label: '🇹🇷 تركي', nameAr: 'تركيا', nameEn: 'Turkey' },
    { id: 'korean', label: '🇰🇷 كوري', nameAr: 'كوريا', nameEn: 'Korea' },
    { id: 'french', label: '🇫🇷 فرنسي', nameAr: 'فرنسا', nameEn: 'France' },
    { id: 'spanish', label: '🇪🇸 إسباني', nameAr: 'إسبانيا', nameEn: 'Spain' },
    { id: 'italian', label: '🇮🇹 إيطالي', nameAr: 'إيطاليا', nameEn: 'Italy' },
    { id: 'russian', label: '🇷🇺 روسي', nameAr: 'روسيا', nameEn: 'Russia' },
  ];

  const musicGenres = [
    { id: 'pop', label: 'بوب', nameAr: 'بوب', nameEn: 'Pop' },
    { id: 'rock', label: 'روك', nameAr: 'روك', nameEn: 'Rock' },
    { id: 'rap', label: 'راب', nameAr: 'راب', nameEn: 'Rap' },
    { id: 'classical', label: 'كلاسيكي', nameAr: 'كلاسيكي', nameEn: 'Classical' },
    { id: 'jazz', label: 'جاز', nameAr: 'جاز', nameEn: 'Jazz' },
    { id: 'arabic', label: 'عربي', nameAr: 'عربي', nameEn: 'Arabic' },
    { id: 'indian', label: 'هندي', nameAr: 'هندي', nameEn: 'Indian' },
    { id: 'turkish', label: 'تركي', nameAr: 'تركي', nameEn: 'Turkish' },
    { id: 'korean', label: 'كوري', nameAr: 'كوري', nameEn: 'Korean' },
    { id: 'electronic', label: 'إلكتروني', nameAr: 'إلكتروني', nameEn: 'Electronic' },
    { id: 'rnb', label: 'آر أند بي', nameAr: 'آر أند بي', nameEn: 'R&B' },
    { id: 'latin', label: 'لاتيني', nameAr: 'لاتيني', nameEn: 'Latin' },
  ];

  const subGenres = [
    { id: 'andalusian', label: 'أندلسي', parent: 'arabic' },
    { id: 'chaabi', label: 'شعبي', parent: 'arabic' },
    { id: 'rai', label: 'راي', parent: 'arabic' },
    { id: 'khaliji', label: 'خليجي', parent: 'arabic' },
    { id: 'trap', label: 'تراب', parent: 'rap' },
    { id: 'drill', label: 'دريل', parent: 'rap' },
    { id: 'indie', label: 'إندي', parent: 'rock' },
    { id: 'metal', label: 'ميتال', parent: 'rock' },
    { id: 'edm', label: 'EDM', parent: 'electronic' },
    { id: 'house', label: 'هاوس', parent: 'electronic' },
  ];

  // ========== LOAD DATA ==========
  const loadArtists = async () => {
    try {
      const data = await artistsAPI.getAll();
      setArtists(data);
      console.log('✅ تم تحميل الفنانين:', data.length);
      return data;
    } catch (error) {
      console.error('❌ خطأ في تحميل الفنانين:', error);
      setArtists([]);
      return [];
    }
  };

  const loadSongs = async () => {
    try {
      const data = await songsAPI.getAll();
      setSongs(data);
      console.log('✅ تم تحميل الأغاني:', data.length);
      return data;
    } catch (error) {
      console.error('❌ خطأ في تحميل الأغاني:', error);
      setSongs([]);
      return [];
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadArtists(), loadSongs()]);
    } catch (error) {
      console.error('❌ خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // ========== HELPERS ==========
  const getCountryLabel = (countryId) => {
    const country = countries.find(c => c.id === countryId);
    return country?.label || countryId || 'غير محدد';
  };

  const getGenreLabel = (genreId) => {
    const genre = musicGenres.find(g => g.id === genreId);
    return genre?.label || genreId || 'غير محدد';
  };

  const getArtistName = (artistId) => {
    const artist = artists.find(a => a.id === artistId);
    return artist?.name || 'غير معروف';
  };

  const getAvailableSubGenres = () => {
    if (!songForm.genre) return [];
    return subGenres.filter(sg => sg.parent === songForm.genre);
  };

  // ========== ARTIST CRUD ==========
  const handleArtistSubmit = async () => {
    if (!artistForm.name) {
      alert('الرجاء إدخال اسم الفنان');
      return;
    }
    
    setSaving(true);
    try {
      const artistData = {
        name: artistForm.name,
        name_ar: artistForm.nameAr || null,
        name_en: artistForm.nameEn || null,
        country: artistForm.country || null,
        genre: artistForm.genre || null,
        image: artistForm.image || null,
        bio: artistForm.bio || null
      };

      console.log('📤 إرسال بيانات الفنان:', JSON.stringify(artistData, null, 2));

      let response;
      if (editingArtist) {
        response = await artistsAPI.updateArtist(editingArtist.id, artistData);
        console.log('✅ تم تحديث الفنان:', response);
      } else {
        response = await artistsAPI.addArtist(artistData);
        console.log('✅ تم إضافة الفنان:', response);
      }

      await loadAllData();
      setShowArtistModal(false);
      setEditingArtist(null);
      setArtistForm({ name: '', nameAr: '', nameEn: '', country: '', genre: '', image: '', bio: '' });
      alert(editingArtist ? '✅ تم تحديث الفنان بنجاح' : '✅ تم إضافة الفنان بنجاح');
    } catch (error) {
      console.error('❌ خطأ في حفظ الفنان:', error);
      alert('❌ حدث خطأ: ' + (error.message || 'فشل في حفظ الفنان'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArtist = async (artistId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الفنان وجميع أغانيه؟')) return;

    try {
      await artistsAPI.deleteArtist(artistId);
      console.log('✅ تم حذف الفنان');
      
      if (selectedArtist?.id === artistId) {
        setSelectedArtist(null);
      }
      
      await loadAllData();
    } catch (error) {
      console.error('❌ خطأ في حذف الفنان:', error);
      alert('❌ حدث خطأ في حذف الفنان');
    }
  };

  // ========== SONG CRUD ==========
  const handleSongSubmit = async () => {
    if (!songForm.title || !songForm.audioUrl) {
      alert('الرجاء إدخال عنوان الأغنية ورابط الصوت');
      return;
    }
    
    if (!selectedArtist) {
      alert('الرجاء اختيار فنان أولاً');
      return;
    }
    
    setSaving(true);
    try {
      const songData = {
        artist_id: selectedArtist.id,
        title: songForm.title,
        title_ar: songForm.titleAr || null,
        title_en: songForm.titleEn || null,
        audio_url: songForm.audioUrl,
        cover_image: songForm.coverImage || null,
        duration: songForm.duration || null,
        year: parseInt(songForm.year) || new Date().getFullYear(),
        genre: songForm.genre || null,
        lyrics: songForm.lyrics || null
      };

      console.log('📤 إرسال بيانات الأغنية:', JSON.stringify(songData, null, 2));

      let response;
      if (editingSong) {
        response = await songsAPI.updateSong(editingSong.id, songData);
        console.log('✅ تم تحديث الأغنية:', response);
      } else {
        response = await songsAPI.addSong(songData);
        console.log('✅ تم إضافة الأغنية:', response);
      }

      await loadAllData();
      setShowSongModal(false);
      setEditingSong(null);
      setSongForm({ 
        title: '', titleAr: '', titleEn: '', duration: '', 
        audioUrl: '', coverImage: '', lyrics: '', 
        year: new Date().getFullYear(), genre: '', subGenre: '', plays: 0 
      });
      alert(editingSong ? '✅ تم تحديث الأغنية بنجاح' : '✅ تم إضافة الأغنية بنجاح');
    } catch (error) {
      console.error('❌ خطأ في حفظ الأغنية:', error);
      alert('❌ حدث خطأ: ' + (error.message || 'فشل في حفظ الأغنية'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSong = async (songId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الأغنية؟')) return;

    try {
      await songsAPI.deleteSong(songId);
      console.log('✅ تم حذف الأغنية');
      await loadAllData();
    } catch (error) {
      console.error('❌ خطأ في حذف الأغنية:', error);
      alert('❌ حدث خطأ في حذف الأغنية');
    }
  };

  const playPreview = (audioUrl) => {
    if (previewAudio) {
      previewAudio.pause();
      setPreviewAudio(null);
      if (previewAudio.src === audioUrl) return;
    }
    const audio = new Audio(audioUrl);
    audio.play();
    setPreviewAudio(audio);
    audio.onended = () => setPreviewAudio(null);
  };

  // ========== FILTERING ==========
  const filteredArtists = artists.filter(a => 
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.name_ar && a.name_ar.includes(searchTerm)) ||
    (a.name_en && a.name_en.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const artistSongs = selectedArtist 
    ? songs.filter(s => s.artist_id === selectedArtist.id) 
    : [];

  // ========== LOADING ==========
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <FaHeadphones className="text-purple-400" /> إدارة الأغاني والفنانين
          <span className="text-sm text-gray-500 font-normal">({songs.length} أغنية - {artists.length} فنان)</span>
        </h2>
        <button 
          onClick={() => { 
            setEditingArtist(null); 
            setArtistForm({ name: '', nameAr: '', nameEn: '', country: '', genre: '', image: '', bio: '' }); 
            setShowArtistModal(true); 
          }} 
          className="bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition text-sm sm:text-base"
        >
          <FaPlus /> إضافة فنان
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ====== قائمة الفنانين ====== */}
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaUser className="text-purple-400" />
            <h3 className="text-white font-bold">الفنانين ({artists.length})</h3>
          </div>
          
          <div className="relative mb-3">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="بحث عن فنان..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 pl-10 pr-3 text-white text-sm focus:outline-none focus:border-purple-500" 
            />
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredArtists.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">لا توجد فنانين</p>
            ) : (
              filteredArtists.map(artist => (
                <div 
                  key={artist.id} 
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${selectedArtist?.id === artist.id ? 'bg-red-600/20 border-r-2 border-red-500' : 'hover:bg-gray-700'}`} 
                  onClick={() => setSelectedArtist(artist)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {artist.image ? (
                      <img src={artist.image} alt={artist.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0">
                        <FaUser className="text-purple-400 text-sm" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">{artist.name || artist.name_ar}</p>
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <span>{getCountryLabel(artist.country)}</span>
                        <span>•</span>
                        <span>{songs.filter(s => s.artist_id === artist.id).length || 0} أغنية</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingArtist(artist); 
                        setArtistForm({
                          name: artist.name || '',
                          nameAr: artist.name_ar || '',
                          nameEn: artist.name_en || '',
                          country: artist.country || '',
                          genre: artist.genre || '',
                          image: artist.image || '',
                          bio: artist.bio || ''
                        }); 
                        setShowArtistModal(true); 
                      }} 
                      className="text-blue-400 hover:text-blue-300 p-1"
                      title="تعديل"
                    >
                      <FaEdit size={14} />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleDeleteArtist(artist.id); 
                      }} 
                      className="text-red-400 hover:text-red-300 p-1"
                      title="حذف"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ====== قائمة الأغاني ====== */}
        <div className="md:col-span-2 bg-gray-800 rounded-xl p-4">
          {selectedArtist ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div className="flex items-center gap-3">
                  {selectedArtist.image ? (
                    <img src={selectedArtist.image} alt={selectedArtist.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center">
                      <FaUser className="text-purple-400 text-lg" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-bold">{selectedArtist.name || selectedArtist.name_ar}</h3>
                    <p className="text-gray-500 text-xs">
                      {getCountryLabel(selectedArtist.country)} • {artistSongs.length} أغنية
                      {selectedArtist.genre && ` • ${getGenreLabel(selectedArtist.genre)}`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { 
                    setEditingSong(null); 
                    setSongForm({ 
                      title: '', titleAr: '', titleEn: '', duration: '', 
                      audioUrl: '', coverImage: '', lyrics: '', 
                      year: new Date().getFullYear(), genre: '', subGenre: '', plays: 0 
                    }); 
                    setShowSongModal(true); 
                  }} 
                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700 transition flex-shrink-0"
                >
                  <FaPlus size={12} /> إضافة أغنية
                </button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {artistSongs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaMusic className="text-4xl mx-auto mb-2 opacity-50" />
                    <p>لا توجد أغاني لهذا الفنان</p>
                  </div>
                ) : (
                  artistSongs.map(song => (
                    <div key={song.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {song.cover_image ? (
                          <img src={song.cover_image} alt={song.title} className="w-10 h-10 object-cover rounded flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                            <FaMusic className="text-purple-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{song.title || song.title_ar}</p>
                          <div className="flex flex-wrap items-center gap-1 text-gray-500 text-xs">
                            {song.duration && <span><FaClock className="inline mr-1" size={10} />{song.duration}</span>}
                            {song.genre && <span>• {getGenreLabel(song.genre)}</span>}
                            {song.year && <span>• {song.year}</span>}
                            {song.plays > 0 && <span>• <FaChartLine className="inline mr-1" size={10} />{song.plays}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button 
                          onClick={() => playPreview(song.audio_url)} 
                          className={`p-1.5 rounded-lg transition ${previewAudio?.src === song.audio_url ? 'bg-red-600 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                          title={previewAudio?.src === song.audio_url ? 'إيقاف' : 'معاينة'}
                        >
                          {previewAudio?.src === song.audio_url ? <FaStop size={12} /> : <FaPlay size={12} />}
                        </button>
                        <button 
                          onClick={() => { 
                            setEditingSong(song); 
                            setSongForm({
                              title: song.title || '',
                              titleAr: song.title_ar || '',
                              titleEn: song.title_en || '',
                              duration: song.duration || '',
                              audioUrl: song.audio_url || '',
                              coverImage: song.cover_image || '',
                              lyrics: song.lyrics || '',
                              year: song.year || new Date().getFullYear(),
                              genre: song.genre || '',
                              subGenre: song.sub_genre || '',
                              plays: song.plays || 0
                            }); 
                            setShowSongModal(true); 
                          }} 
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="تعديل"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteSong(song.id)} 
                          className="text-red-400 hover:text-red-300 p-1"
                          title="حذف"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FaMusic className="text-5xl mx-auto mb-3 opacity-50" />
              <p>اختر فناناً لعرض أغانيه</p>
            </div>
          )}
        </div>
      </div>

      {/* ====== مودال إضافة/تعديل فنان ====== */}
      {showArtistModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowArtistModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold">{editingArtist ? 'تعديل' : 'إضافة'} فنان</h3>
              <button onClick={() => setShowArtistModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              <input 
                type="text" 
                placeholder="اسم الفنان (عربي)" 
                value={artistForm.nameAr} 
                onChange={(e) => setArtistForm({...artistForm, nameAr: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
              />
              <input 
                type="text" 
                placeholder="اسم الفنان *" 
                value={artistForm.name} 
                onChange={(e) => setArtistForm({...artistForm, name: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
                required 
              />
              <input 
                type="text" 
                placeholder="اسم الفنان (إنجليزي)" 
                value={artistForm.nameEn} 
                onChange={(e) => setArtistForm({...artistForm, nameEn: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
              />
              
              <div>
                <label className="block text-gray-400 text-sm mb-1 flex items-center gap-2">
                  <FaGlobe className="text-purple-400" /> البلد / المنطقة
                </label>
                <select 
                  value={artistForm.country} 
                  onChange={(e) => setArtistForm({...artistForm, country: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"
                >
                  <option value="">اختر البلد</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">التصنيف الموسيقي</label>
                <select 
                  value={artistForm.genre} 
                  onChange={(e) => setArtistForm({...artistForm, genre: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"
                >
                  <option value="">اختر التصنيف</option>
                  {musicGenres.map(g => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>

              <textarea 
                placeholder="السيرة الذاتية" 
                value={artistForm.bio} 
                onChange={(e) => setArtistForm({...artistForm, bio: e.target.value})} 
                rows="3" 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm resize-none"
              />
              <input 
                type="url" 
                placeholder="رابط صورة الفنان" 
                value={artistForm.image} 
                onChange={(e) => setArtistForm({...artistForm, image: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
              />
              <div className="flex gap-3 pt-3">
                <button 
                  onClick={handleArtistSubmit} 
                  disabled={saving}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <FaSyncAlt className="animate-spin" /> : <FaSave />}
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button 
                  onClick={() => setShowArtistModal(false)} 
                  className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition text-sm"
                >
                  <FaTimes className="inline ml-1" /> إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== مودال إضافة/تعديل أغنية ====== */}
      {showSongModal && selectedArtist && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowSongModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold">
                {editingSong ? 'تعديل' : 'إضافة'} أغنية - {selectedArtist.name || selectedArtist.name_ar}
              </h3>
              <button onClick={() => setShowSongModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              <input 
                type="text" 
                placeholder="عنوان الأغنية (عربي)" 
                value={songForm.titleAr} 
                onChange={(e) => setSongForm({...songForm, titleAr: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
              />
              <input 
                type="text" 
                placeholder="عنوان الأغنية *" 
                value={songForm.title} 
                onChange={(e) => setSongForm({...songForm, title: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
                required 
              />
              <input 
                type="text" 
                placeholder="عنوان الأغنية (إنجليزي)" 
                value={songForm.titleEn} 
                onChange={(e) => setSongForm({...songForm, titleEn: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
              />
              
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="المدة (مثال: 3:45)" 
                  value={songForm.duration} 
                  onChange={(e) => setSongForm({...songForm, duration: e.target.value})} 
                  className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
                />
                <input 
                  type="number" 
                  placeholder="السنة" 
                  value={songForm.year} 
                  onChange={(e) => setSongForm({...songForm, year: e.target.value})} 
                  className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">التصنيف الموسيقي</label>
                <select 
                  value={songForm.genre} 
                  onChange={(e) => {
                    setSongForm({...songForm, genre: e.target.value, subGenre: ''});
                  }} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"
                >
                  <option value="">اختر التصنيف</option>
                  {musicGenres.map(g => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>

              {songForm.genre && getAvailableSubGenres().length > 0 && (
                <div>
                  <label className="block text-gray-400 text-sm mb-1">التصنيف الفرعي (اختياري)</label>
                  <select 
                    value={songForm.subGenre} 
                    onChange={(e) => setSongForm({...songForm, subGenre: e.target.value})} 
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"
                  >
                    <option value="">بدون تصنيف فرعي</option>
                    {getAvailableSubGenres().map(sg => (
                      <option key={sg.id} value={sg.label}>{sg.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <input 
                type="url" 
                placeholder="رابط الأغنية (MP3) *" 
                value={songForm.audioUrl} 
                onChange={(e) => setSongForm({...songForm, audioUrl: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
                required 
              />
              <input 
                type="url" 
                placeholder="رابط صورة الغلاف" 
                value={songForm.coverImage} 
                onChange={(e) => setSongForm({...songForm, coverImage: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
              />
              <textarea 
                placeholder="كلمات الأغنية" 
                value={songForm.lyrics} 
                onChange={(e) => setSongForm({...songForm, lyrics: e.target.value})} 
                rows="5" 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm resize-none"
              />
              <div className="flex gap-3 pt-3">
                <button 
                  onClick={handleSongSubmit} 
                  disabled={saving}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <FaSyncAlt className="animate-spin" /> : <FaSave />}
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button 
                  onClick={() => setShowSongModal(false)} 
                  className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition text-sm"
                >
                  <FaTimes className="inline ml-1" /> إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSongsManager;