import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaUser, FaVideo, FaHeart, FaSave, FaTimes, FaMusic } from 'react-icons/fa';

const AdminClipsManager = () => {
  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [clips, setClips] = useState([]);
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [showClipModal, setShowClipModal] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);
  const [editingClip, setEditingClip] = useState(null);
  
  const [artistForm, setArtistForm] = useState({
    name: '', nameEn: '', genre: '', image: '', clipsCount: 0
  });
  
  const [clipForm, setClipForm] = useState({
    title: '', titleEn: '', duration: '', views: '', likes: 0, videoUrl: '', thumbnail: '', year: new Date().getFullYear()
  });

  const genres = ['عربي', 'بوب', 'روك', 'راب', 'كلاسيكي', 'جاز', 'هندي', 'تركي'];

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = () => {
    const saved = localStorage.getItem('cinewave_artists');
    if (saved) setArtists(JSON.parse(saved));
    else setArtists([]);
  };

  const loadClips = (artistId) => {
    const saved = localStorage.getItem(`cinewave_clips_${artistId}`);
    if (saved) setClips(JSON.parse(saved));
    else setClips([]);
  };

  const handleArtistSubmit = () => {
    if (!artistForm.name) return;
    const newArtist = { ...artistForm, id: editingArtist ? editingArtist.id : Date.now(), clipsCount: clips.length };
    let newArtists;
    if (editingArtist) {
      newArtists = artists.map(a => a.id === editingArtist.id ? newArtist : a);
    } else {
      newArtists = [...artists, newArtist];
    }
    setArtists(newArtists);
    localStorage.setItem('cinewave_artists', JSON.stringify(newArtists));
    setShowArtistModal(false);
    setEditingArtist(null);
    setArtistForm({ name: '', nameEn: '', genre: '', image: '', clipsCount: 0 });
  };

  const handleDeleteArtist = (artistId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفنان وجميع كليباته؟')) {
      const newArtists = artists.filter(a => a.id !== artistId);
      setArtists(newArtists);
      localStorage.setItem('cinewave_artists', JSON.stringify(newArtists));
      localStorage.removeItem(`cinewave_clips_${artistId}`);
      if (selectedArtist?.id === artistId) {
        setSelectedArtist(null);
        setClips([]);
      }
    }
  };

  const handleClipSubmit = () => {
    if (!clipForm.title || !clipForm.videoUrl) return;
    const newClip = { ...clipForm, id: editingClip ? editingClip.id : Date.now(), likes: parseInt(clipForm.likes) || 0 };
    let newClips;
    if (editingClip) {
      newClips = clips.map(c => c.id === editingClip.id ? newClip : c);
    } else {
      newClips = [...clips, newClip];
    }
    setClips(newClips);
    localStorage.setItem(`cinewave_clips_${selectedArtist.id}`, JSON.stringify(newClips));
    
    const updatedArtists = artists.map(a => a.id === selectedArtist.id ? { ...a, clipsCount: newClips.length } : a);
    setArtists(updatedArtists);
    localStorage.setItem('cinewave_artists', JSON.stringify(updatedArtists));
    
    setShowClipModal(false);
    setEditingClip(null);
    setClipForm({ title: '', titleEn: '', duration: '', views: '', likes: 0, videoUrl: '', thumbnail: '', year: new Date().getFullYear() });
  };

  const handleDeleteClip = (clipId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الكليب؟')) {
      const newClips = clips.filter(c => c.id !== clipId);
      setClips(newClips);
      localStorage.setItem(`cinewave_clips_${selectedArtist.id}`, JSON.stringify(newClips));
      
      const updatedArtists = artists.map(a => a.id === selectedArtist.id ? { ...a, clipsCount: newClips.length } : a);
      setArtists(updatedArtists);
      localStorage.setItem('cinewave_artists', JSON.stringify(updatedArtists));
    }
  };

  const selectArtist = (artist) => {
    setSelectedArtist(artist);
    loadClips(artist.id);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">🎵 إدارة الكليبات والفنانين</h2>
        <button onClick={() => { setEditingArtist(null); setArtistForm({ name: '', nameEn: '', genre: '', image: '', clipsCount: 0 }); setShowArtistModal(true); }} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700">
          <FaPlus /> إضافة فنان
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* قائمة الفنانين */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><FaUser /> الفنانين ({artists.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {artists.length === 0 ? (
              <p className="text-gray-500 text-center py-4">لا توجد فنانين</p>
            ) : (
              artists.map(artist => (
                <div key={artist.id} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${selectedArtist?.id === artist.id ? 'bg-red-600/20 border-r-2 border-red-500' : 'hover:bg-gray-700'}`} onClick={() => selectArtist(artist)}>
                  <div className="flex items-center gap-2">
                    <img src={artist.image} alt={artist.name} className="w-8 h-8 rounded-full object-cover" />
                    <div><p className="text-white text-sm">{artist.name}</p><p className="text-gray-500 text-xs">{artist.clipsCount} كليب</p></div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setEditingArtist(artist); setArtistForm(artist); setShowArtistModal(true); }} className="text-blue-400"><FaEdit size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteArtist(artist.id); }} className="text-red-400"><FaTrash size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* كليبات الفنان المختار */}
        <div className="md:col-span-2 bg-gray-800 rounded-xl p-4">
          {selectedArtist ? (
            <>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-bold flex items-center gap-2"><FaVideo /> كليبات {selectedArtist.name} ({clips.length})</h3>
                <button onClick={() => { setEditingClip(null); setClipForm({ title: '', titleEn: '', duration: '', views: '', likes: 0, videoUrl: '', thumbnail: '', year: new Date().getFullYear() }); setShowClipModal(true); }} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"><FaPlus size={12} /> إضافة كليب</button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {clips.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">لا توجد كليبات لهذا الفنان</p>
                ) : (
                  clips.map(clip => (
                    <div key={clip.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img src={clip.thumbnail} alt={clip.title} className="w-12 h-10 object-cover rounded" />
                        <div><p className="text-white text-sm">{clip.title}</p><p className="text-gray-500 text-xs">{clip.duration} • {clip.views} مشاهدة</p></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingClip(clip); setClipForm(clip); setShowClipModal(true); }} className="text-blue-400"><FaEdit /></button>
                        <button onClick={() => handleDeleteClip(clip.id)} className="text-red-400"><FaTrash /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">اختر فناناً لعرض كليباته</div>
          )}
        </div>
      </div>

      {/* Modal إضافة/تعديل فنان */}
      {showArtistModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowArtistModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold">{editingArtist ? 'تعديل' : 'إضافة'} فنان</h3>
              <button onClick={() => setShowArtistModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              <input type="text" placeholder="اسم الفنان" value={artistForm.name} onChange={(e) => setArtistForm({...artistForm, name: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
              <input type="text" placeholder="اسم الفنان (إنجليزي)" value={artistForm.nameEn} onChange={(e) => setArtistForm({...artistForm, nameEn: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
              <select value={artistForm.genre} onChange={(e) => setArtistForm({...artistForm, genre: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white">
                <option value="">اختر التصنيف</option>
                {genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input type="url" placeholder="رابط صورة الفنان" value={artistForm.image} onChange={(e) => setArtistForm({...artistForm, image: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
              <div className="flex gap-3 pt-3">
                <button onClick={handleArtistSubmit} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"><FaSave /> حفظ</button>
                <button onClick={() => setShowArtistModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600"><FaTimes /> إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal إضافة/تعديل كليب */}
      {showClipModal && selectedArtist && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowClipModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold">{editingClip ? 'تعديل' : 'إضافة'} كليب - {selectedArtist.name}</h3>
              <button onClick={() => setShowClipModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              <input type="text" placeholder="عنوان الكليب" value={clipForm.title} onChange={(e) => setClipForm({...clipForm, title: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" required />
              <input type="text" placeholder="عنوان الكليب (إنجليزي)" value={clipForm.titleEn} onChange={(e) => setClipForm({...clipForm, titleEn: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="المدة (مثال: 3:45)" value={clipForm.duration} onChange={(e) => setClipForm({...clipForm, duration: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
                <input type="text" placeholder="عدد المشاهدات (مثال: 1.2M)" value={clipForm.views} onChange={(e) => setClipForm({...clipForm, views: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
                <input type="number" placeholder="عدد الإعجابات" value={clipForm.likes} onChange={(e) => setClipForm({...clipForm, likes: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
                <input type="number" placeholder="السنة" value={clipForm.year} onChange={(e) => setClipForm({...clipForm, year: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
              </div>
              <input type="url" placeholder="رابط الفيديو (YouTube)" value={clipForm.videoUrl} onChange={(e) => setClipForm({...clipForm, videoUrl: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" required />
              <input type="url" placeholder="رابط الصورة المصغرة" value={clipForm.thumbnail} onChange={(e) => setClipForm({...clipForm, thumbnail: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
              <div className="flex gap-3 pt-3">
                <button onClick={handleClipSubmit} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"><FaSave /> حفظ</button>
                <button onClick={() => setShowClipModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600"><FaTimes /> إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClipsManager;