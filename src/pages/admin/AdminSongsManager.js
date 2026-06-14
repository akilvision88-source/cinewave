import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaMusic, FaUser, FaSave, FaTimes, FaSearch, FaPlay, FaStop, FaHeadphones, FaGlobe } from 'react-icons/fa';

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
  
  const [artistForm, setArtistForm] = useState({
    name: '', nameAr: '', nameEn: '', country: '', genre: '', image: '', bio: '', songsCount: 0
  });
  
  const [songForm, setSongForm] = useState({
    title: '', titleAr: '', titleEn: '', duration: '', audioUrl: '', coverImage: '', 
    lyrics: '', year: new Date().getFullYear(), genre: '', subGenre: '', plays: 0
  });

  // قائمة البلدان
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

  // قائمة التصنيفات الموسيقية
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

  // قائمة التصنيفات الفرعية
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

  // تحميل البيانات
  useEffect(() => {
    loadArtists();
    loadSongs();
  }, []);

  const loadArtists = () => {
    const saved = localStorage.getItem('cinewave_song_artists');
    if (saved) setArtists(JSON.parse(saved));
    else setArtists([]);
  };

  const loadSongs = () => {
    const saved = localStorage.getItem('cinewave_songs');
    if (saved) setSongs(JSON.parse(saved));
    else setSongs([]);
  };

  // الحصول على اسم البلد
  const getCountryLabel = (countryId) => {
    const country = countries.find(c => c.id === countryId);
    return country?.label || countryId;
  };

  // الحصول على اسم التصنيف
  const getGenreLabel = (genreId) => {
    const genre = musicGenres.find(g => g.id === genreId);
    return genre?.label || genreId;
  };

  // إدارة الفنانين
  const handleArtistSubmit = () => {
    if (!artistForm.name) {
      alert('الرجاء إدخال اسم الفنان');
      return;
    }
    
    const newArtist = { 
      ...artistForm, 
      id: editingArtist ? editingArtist.id : Date.now(), 
      songsCount: editingArtist ? editingArtist.songsCount : 0
    };
    
    let newArtists;
    if (editingArtist) {
      newArtists = artists.map(a => a.id === editingArtist.id ? newArtist : a);
    } else {
      newArtists = [...artists, newArtist];
    }
    
    setArtists(newArtists);
    localStorage.setItem('cinewave_song_artists', JSON.stringify(newArtists));
    setShowArtistModal(false);
    setEditingArtist(null);
    setArtistForm({ name: '', nameAr: '', nameEn: '', country: '', genre: '', image: '', bio: '', songsCount: 0 });
  };

  const handleDeleteArtist = (artistId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفنان وجميع أغانيه؟')) {
      const newArtists = artists.filter(a => a.id !== artistId);
      setArtists(newArtists);
      localStorage.setItem('cinewave_song_artists', JSON.stringify(newArtists));
      
      const newSongs = songs.filter(s => s.artistId !== artistId);
      setSongs(newSongs);
      localStorage.setItem('cinewave_songs', JSON.stringify(newSongs));
      
      if (selectedArtist?.id === artistId) {
        setSelectedArtist(null);
      }
    }
  };

  // إدارة الأغاني
  const handleSongSubmit = () => {
    if (!songForm.title || !songForm.audioUrl || !selectedArtist) {
      alert('الرجاء إدخال عنوان الأغنية ورابط الصوت');
      return;
    }
    
    const newSong = { 
      ...songForm, 
      id: editingSong ? editingSong.id : Date.now(), 
      artistId: selectedArtist.id,
      artistName: selectedArtist.name,
      artistImage: selectedArtist.image,
      artistCountry: selectedArtist.country,
      plays: editingSong ? editingSong.plays : Math.floor(Math.random() * 10000) + 1000
    };
    
    let newSongs;
    if (editingSong) {
      newSongs = songs.map(s => s.id === editingSong.id ? newSong : s);
    } else {
      newSongs = [...songs, newSong];
    }
    
    setSongs(newSongs);
    localStorage.setItem('cinewave_songs', JSON.stringify(newSongs));
    
    const artistSongsCount = newSongs.filter(s => s.artistId === selectedArtist.id).length;
    const updatedArtists = artists.map(a => 
      a.id === selectedArtist.id ? { ...a, songsCount: artistSongsCount } : a
    );
    setArtists(updatedArtists);
    localStorage.setItem('cinewave_song_artists', JSON.stringify(updatedArtists));
    
    setShowSongModal(false);
    setEditingSong(null);
    setSongForm({ title: '', titleAr: '', titleEn: '', duration: '', audioUrl: '', coverImage: '', lyrics: '', year: new Date().getFullYear(), genre: '', subGenre: '', plays: 0 });
  };

  const handleDeleteSong = (songId) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الأغنية؟')) {
      const newSongs = songs.filter(s => s.id !== songId);
      setSongs(newSongs);
      localStorage.setItem('cinewave_songs', JSON.stringify(newSongs));
      
      if (selectedArtist) {
        const artistSongsCount = newSongs.filter(s => s.artistId === selectedArtist.id).length;
        const updatedArtists = artists.map(a => 
          a.id === selectedArtist.id ? { ...a, songsCount: artistSongsCount } : a
        );
        setArtists(updatedArtists);
        localStorage.setItem('cinewave_song_artists', JSON.stringify(updatedArtists));
      }
    }
  };

  const playPreview = (audioUrl) => {
    if (previewAudio) {
      previewAudio.pause();
      setPreviewAudio(null);
    }
    const audio = new Audio(audioUrl);
    audio.play();
    setPreviewAudio(audio);
    audio.onended = () => setPreviewAudio(null);
  };

  const filteredArtists = artists.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.nameAr && a.nameAr.includes(searchTerm)) ||
    (a.nameEn && a.nameEn.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const artistSongs = selectedArtist ? songs.filter(s => s.artistId === selectedArtist.id) : [];

  // الحصول على التصنيفات الفرعية المتاحة بناءً على التصنيف الرئيسي
  const getAvailableSubGenres = () => {
    if (!songForm.genre) return [];
    return subGenres.filter(sg => sg.parent === songForm.genre);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FaHeadphones className="text-purple-400" /> إدارة الأغاني والفنانين
        </h2>
        <button 
          onClick={() => { 
            setEditingArtist(null); 
            setArtistForm({ name: '', nameAr: '', nameEn: '', country: '', genre: '', image: '', bio: '', songsCount: 0 }); 
            setShowArtistModal(true); 
          }} 
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition"
        >
          <FaPlus /> إضافة فنان
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* قائمة الفنانين */}
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
              <p className="text-gray-500 text-center py-4">لا توجد فنانين</p>
            ) : (
              filteredArtists.map(artist => (
                <div 
                  key={artist.id} 
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${selectedArtist?.id === artist.id ? 'bg-red-600/20 border-r-2 border-red-500' : 'hover:bg-gray-700'}`} 
                  onClick={() => setSelectedArtist(artist)}
                >
                  <div className="flex items-center gap-2">
                    {artist.image ? (
                      <img src={artist.image} alt={artist.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center">
                        <FaUser className="text-purple-400 text-sm" />
                      </div>
                    )}
                    <div>
                      <p className="text-white text-sm">{artist.name}</p>
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <span>{getCountryLabel(artist.country)}</span>
                        <span>•</span>
                        <span>{artist.songsCount || 0} أغنية</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingArtist(artist); 
                        setArtistForm(artist); 
                        setShowArtistModal(true); 
                      }} 
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <FaEdit size={14} />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleDeleteArtist(artist.id); 
                      }} 
                      className="text-red-400 hover:text-red-300"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* قائمة الأغاني */}
        <div className="md:col-span-2 bg-gray-800 rounded-xl p-4">
          {selectedArtist ? (
            <>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  {selectedArtist.image ? (
                    <img src={selectedArtist.image} alt={selectedArtist.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center">
                      <FaUser className="text-purple-400 text-lg" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-bold">{selectedArtist.name}</h3>
                    <p className="text-gray-500 text-xs">{getCountryLabel(selectedArtist.country)} • {artistSongs.length} أغنية</p>
                  </div>
                </div>
                <button 
                  onClick={() => { 
                    setEditingSong(null); 
                    setSongForm({ title: '', titleAr: '', titleEn: '', duration: '', audioUrl: '', coverImage: '', lyrics: '', year: new Date().getFullYear(), genre: '', subGenre: '', plays: 0 }); 
                    setShowSongModal(true); 
                  }} 
                  className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700 transition"
                >
                  <FaPlus size={12} /> إضافة أغنية
                </button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {artistSongs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">لا توجد أغاني لهذا الفنان</p>
                ) : (
                  artistSongs.map(song => (
                    <div key={song.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition">
                      <div className="flex items-center gap-3">
                        {song.coverImage ? (
                          <img src={song.coverImage} alt={song.title} className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-purple-600/20 flex items-center justify-center">
                            <FaMusic className="text-purple-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-white text-sm font-medium">{song.title}</p>
                          <p className="text-gray-500 text-xs">{song.duration} • {getGenreLabel(song.genre)} {song.subGenre && `• ${song.subGenre}`} • {song.year}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => playPreview(song.audioUrl)} 
                          className="p-2 bg-purple-600 rounded-lg text-white hover:bg-purple-700 transition"
                          title="معاينة"
                        >
                          {previewAudio ? <FaStop size={12} /> : <FaPlay size={12} />}
                        </button>
                        <button 
                          onClick={() => { 
                            setEditingSong(song); 
                            setSongForm(song); 
                            setShowSongModal(true); 
                          }} 
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDeleteSong(song.id)} 
                          className="text-red-400 hover:text-red-300"
                        >
                          <FaTrash />
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

      {/* مودال إضافة/تعديل فنان */}
      {showArtistModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowArtistModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold">{editingArtist ? 'تعديل' : 'إضافة'} فنان</h3>
              <button onClick={() => setShowArtistModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <input 
                type="text" 
                placeholder="اسم الفنان (عربي)" 
                value={artistForm.nameAr} 
                onChange={(e) => setArtistForm({...artistForm, nameAr: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
              />
              <input 
                type="text" 
                placeholder="اسم الفنان" 
                value={artistForm.name} 
                onChange={(e) => setArtistForm({...artistForm, name: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
                required 
              />
              <input 
                type="text" 
                placeholder="اسم الفنان (إنجليزي)" 
                value={artistForm.nameEn} 
                onChange={(e) => setArtistForm({...artistForm, nameEn: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
              />
              
              {/* حقل البلد */}
              <div>
                <label className="block text-gray-400 text-sm mb-1 flex items-center gap-2">
                  <FaGlobe className="text-purple-400" /> البلد / المنطقة
                </label>
                <select 
                  value={artistForm.country} 
                  onChange={(e) => setArtistForm({...artistForm, country: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
                >
                  <option value="">اختر البلد</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* حقل التصنيف الموسيقي للفنان */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">التصنيف الموسيقي</label>
                <select 
                  value={artistForm.genre} 
                  onChange={(e) => setArtistForm({...artistForm, genre: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
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
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white resize-none"
              />
              <input 
                type="url" 
                placeholder="رابط صورة الفنان" 
                value={artistForm.image} 
                onChange={(e) => setArtistForm({...artistForm, image: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
              />
              <div className="flex gap-3 pt-3">
                <button onClick={handleArtistSubmit} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">
                  <FaSave className="inline ml-1" /> حفظ
                </button>
                <button onClick={() => setShowArtistModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition">
                  <FaTimes className="inline ml-1" /> إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال إضافة/تعديل أغنية */}
      {showSongModal && selectedArtist && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowSongModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-900">
              <h3 className="text-white text-xl font-bold">{editingSong ? 'تعديل' : 'إضافة'} أغنية - {selectedArtist.name}</h3>
              <button onClick={() => setShowSongModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              <input 
                type="text" 
                placeholder="عنوان الأغنية (عربي)" 
                value={songForm.titleAr} 
                onChange={(e) => setSongForm({...songForm, titleAr: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
              />
              <input 
                type="text" 
                placeholder="عنوان الأغنية" 
                value={songForm.title} 
                onChange={(e) => setSongForm({...songForm, title: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
                required 
              />
              <input 
                type="text" 
                placeholder="عنوان الأغنية (إنجليزي)" 
                value={songForm.titleEn} 
                onChange={(e) => setSongForm({...songForm, titleEn: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
              />
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="المدة (مثال: 3:45)" 
                  value={songForm.duration} 
                  onChange={(e) => setSongForm({...songForm, duration: e.target.value})} 
                  className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
                />
                <input 
                  type="number" 
                  placeholder="السنة" 
                  value={songForm.year} 
                  onChange={(e) => setSongForm({...songForm, year: e.target.value})} 
                  className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
                />
              </div>

              {/* حقل التصنيف الموسيقي للأغنية */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">التصنيف الموسيقي</label>
                <select 
                  value={songForm.genre} 
                  onChange={(e) => {
                    setSongForm({...songForm, genre: e.target.value, subGenre: ''});
                  }} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
                >
                  <option value="">اختر التصنيف</option>
                  {musicGenres.map(g => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>

              {/* حقل التصنيف الفرعي (يظهر فقط عند اختيار تصنيف رئيسي) */}
              {songForm.genre && getAvailableSubGenres().length > 0 && (
                <div>
                  <label className="block text-gray-400 text-sm mb-1">التصنيف الفرعي (اختياري)</label>
                  <select 
                    value={songForm.subGenre} 
                    onChange={(e) => setSongForm({...songForm, subGenre: e.target.value})} 
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
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
                placeholder="رابط الأغنية (MP3)" 
                value={songForm.audioUrl} 
                onChange={(e) => setSongForm({...songForm, audioUrl: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
                required 
              />
              <input 
                type="url" 
                placeholder="رابط صورة الغلاف" 
                value={songForm.coverImage} 
                onChange={(e) => setSongForm({...songForm, coverImage: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
              />
              <textarea 
                placeholder="كلمات الأغنية" 
                value={songForm.lyrics} 
                onChange={(e) => setSongForm({...songForm, lyrics: e.target.value})} 
                rows="5" 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white resize-none"
              />
              <div className="flex gap-3 pt-3">
                <button onClick={handleSongSubmit} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">
                  <FaSave className="inline ml-1" /> حفظ
                </button>
                <button onClick={() => setShowSongModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition">
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