// src/pages/admin/AdminClipsManager.js - نسخة معدلة لاستخدام API
import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaUser, FaVideo, FaHeart, FaSave, FaTimes, FaMusic, FaSyncAlt } from 'react-icons/fa';
import { artistsAPI, clipsAPI } from '../../services/api';

const AdminClipsManager = () => {
  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [clips, setClips] = useState([]);
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [showClipModal, setShowClipModal] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);
  const [editingClip, setEditingClip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [artistForm, setArtistForm] = useState({
    name: '', nameEn: '', genre: '', image: '', clipsCount: 0
  });
  
  const [clipForm, setClipForm] = useState({
    title: '', titleEn: '', duration: '', views: '', likes: 0, videoUrl: '', thumbnail: '', year: new Date().getFullYear()
  });

  const genres = ['عربي', 'بوب', 'روك', 'راب', 'كلاسيكي', 'جاز', 'هندي', 'تركي'];

  // تحميل الفنانين من API
  const loadArtists = async () => {
    try {
      setLoading(true);
      const data = await artistsAPI.getAll();
      setArtists(data);
      return data;
    } catch (error) {
      console.error('خطأ في تحميل الفنانين:', error);
      setArtists([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // تحميل كليبات فنان معين من API
  const loadClips = async (artistId) => {
    try {
      const data = await clipsAPI.getByArtist(artistId);
      setClips(data);
      return data;
    } catch (error) {
      console.error('خطأ في تحميل الكليبات:', error);
      setClips([]);
      return [];
    }
  };

  useEffect(() => {
    loadArtists();
  }, []);

  const handleArtistSubmit = async () => {
    if (!artistForm.name) {
      alert('الرجاء إدخال اسم الفنان');
      return;
    }
    
    setSaving(true);
    
    try {
      const artistData = {
        name: artistForm.name,
        name_en: artistForm.nameEn || artistForm.name,
        image: artistForm.image || 'https://randomuser.me/api/portraits/men/1.jpg',
        genre: artistForm.genre,
        country: 'maroc'
      };
      
      if (editingArtist) {
        await artistsAPI.updateArtist(editingArtist.id, artistData);
      } else {
        await artistsAPI.addArtist(artistData);
      }
      
      await loadArtists();
      setShowArtistModal(false);
      setEditingArtist(null);
      setArtistForm({ name: '', nameEn: '', genre: '', image: '', clipsCount: 0 });
      
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50 text-sm';
      toast.textContent = editingArtist ? 'تم تعديل الفنان بنجاح' : 'تم إضافة الفنان بنجاح';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
      
    } catch (error) {
      console.error('خطأ في حفظ الفنان:', error);
      alert('حدث خطأ في حفظ الفنان');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArtist = async (artistId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفنان وجميع كليباته؟')) {
      try {
        await artistsAPI.deleteArtist(artistId);
        await loadArtists();
        if (selectedArtist?.id === artistId) {
          setSelectedArtist(null);
          setClips([]);
        }
      } catch (error) {
        console.error('خطأ في حذف الفنان:', error);
        alert('حدث خطأ في حذف الفنان');
      }
    }
  };

  const handleClipSubmit = async () => {
    if (!clipForm.title || !clipForm.videoUrl) {
      alert('الرجاء إدخال عنوان الكليب ورابط الفيديو');
      return;
    }
    
    if (!selectedArtist) {
      alert('الرجاء اختيار فنان أولاً');
      return;
    }
    
    setSaving(true);
    
    try {
      const clipData = {
        artist_id: selectedArtist.id,
        title: clipForm.title,
        title_en: clipForm.titleEn || clipForm.title,
        video_url: clipForm.videoUrl,
        thumbnail: clipForm.thumbnail || 'https://via.placeholder.com/320x180?text=Clip',
        duration: clipForm.duration,
        year: clipForm.year,
        views: parseInt(clipForm.views) || 0,
        likes: parseInt(clipForm.likes) || 0
      };
      
      if (editingClip) {
        await clipsAPI.updateClip(editingClip.id, clipData);
      } else {
        await clipsAPI.addClip(clipData);
      }
      
      await loadClips(selectedArtist.id);
      setShowClipModal(false);
      setEditingClip(null);
      setClipForm({ title: '', titleEn: '', duration: '', views: '', likes: 0, videoUrl: '', thumbnail: '', year: new Date().getFullYear() });
      
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50 text-sm';
      toast.textContent = editingClip ? 'تم تعديل الكليب بنجاح' : 'تم إضافة الكليب بنجاح';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
      
    } catch (error) {
      console.error('خطأ في حفظ الكليب:', error);
      alert('حدث خطأ في حفظ الكليب');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClip = async (clipId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الكليب؟')) {
      try {
        await clipsAPI.deleteClip(clipId);
        await loadClips(selectedArtist.id);
      } catch (error) {
        console.error('خطأ في حذف الكليب:', error);
        alert('حدث خطأ في حذف الكليب');
      }
    }
  };

  const selectArtist = async (artist) => {
    setSelectedArtist(artist);
    await loadClips(artist.id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">🎵 إدارة الكليبات والفنانين</h2>
        <button 
          onClick={() => { 
            setEditingArtist(null); 
            setArtistForm({ name: '', nameEn: '', genre: '', image: '', clipsCount: 0 }); 
            setShowArtistModal(true); 
          }} 
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
        >
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
                <div 
                  key={artist.id} 
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${selectedArtist?.id === artist.id ? 'bg-red-600/20 border-r-2 border-red-500' : 'hover:bg-gray-700'}`} 
                  onClick={() => selectArtist(artist)}
                >
                  <div className="flex items-center gap-2">
                    <img src={artist.image} alt={artist.name} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="text-white text-sm">{artist.name}</p>
                      <p className="text-gray-500 text-xs">{artist.songs_count || 0} كليب</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingArtist(artist); 
                        setArtistForm({ 
                          name: artist.name, 
                          nameEn: artist.name_en || '', 
                          genre: artist.genre, 
                          image: artist.image, 
                          clipsCount: artist.songs_count || 0 
                        }); 
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

        {/* كليبات الفنان المختار */}
        <div className="md:col-span-2 bg-gray-800 rounded-xl p-4">
          {selectedArtist ? (
            <>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-bold flex items-center gap-2"><FaVideo /> كليبات {selectedArtist.name} ({clips.length})</h3>
                <button 
                  onClick={() => { 
                    setEditingClip(null); 
                    setClipForm({ title: '', titleEn: '', duration: '', views: '', likes: 0, videoUrl: '', thumbnail: '', year: new Date().getFullYear() }); 
                    setShowClipModal(true); 
                  }} 
                  className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700"
                >
                  <FaPlus size={12} /> إضافة كليب
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {clips.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">لا توجد كليبات لهذا الفنان</p>
                ) : (
                  clips.map(clip => (
                    <div key={clip.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition">
                      <div className="flex items-center gap-3">
                        <img src={clip.thumbnail} alt={clip.title} className="w-12 h-10 object-cover rounded" />
                        <div>
                          <p className="text-white text-sm">{clip.title}</p>
                          <p className="text-gray-500 text-xs">{clip.duration} • {clip.views || 0} مشاهدة</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { 
                            setEditingClip(clip); 
                            setClipForm({ 
                              title: clip.title, 
                              titleEn: clip.title_en || '', 
                              duration: clip.duration, 
                              views: clip.views || 0, 
                              likes: clip.likes || 0, 
                              videoUrl: clip.video_url, 
                              thumbnail: clip.thumbnail, 
                              year: clip.year || new Date().getFullYear() 
                            }); 
                            setShowClipModal(true); 
                          }} 
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDeleteClip(clip.id)} className="text-red-400 hover:text-red-300">
                          <FaTrash />
                        </button>
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
              <select 
                value={artistForm.genre} 
                onChange={(e) => setArtistForm({...artistForm, genre: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
              >
                <option value="">اختر التصنيف</option>
                {genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input 
                type="url" 
                placeholder="رابط صورة الفنان" 
                value={artistForm.image} 
                onChange={(e) => setArtistForm({...artistForm, image: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
              />
              <div className="flex gap-3 pt-3">
                <button 
                  onClick={handleArtistSubmit} 
                  disabled={saving}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  {saving ? <FaSyncAlt className="animate-spin" /> : <FaSave />} حفظ
                </button>
                <button onClick={() => setShowArtistModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition">
                  <FaTimes /> إلغاء
                </button>
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
              <input 
                type="text" 
                placeholder="عنوان الكليب" 
                value={clipForm.title} 
                onChange={(e) => setClipForm({...clipForm, title: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
                required 
              />
              <input 
                type="text" 
                placeholder="عنوان الكليب (إنجليزي)" 
                value={clipForm.titleEn} 
                onChange={(e) => setClipForm({...clipForm, titleEn: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
              />
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="المدة (مثال: 3:45)" 
                  value={clipForm.duration} 
                  onChange={(e) => setClipForm({...clipForm, duration: e.target.value})} 
                  className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
                />
                <input 
                  type="number" 
                  placeholder="السنة" 
                  value={clipForm.year} 
                  onChange={(e) => setClipForm({...clipForm, year: e.target.value})} 
                  className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
                />
                <input 
                  type="text" 
                  placeholder="عدد المشاهدات (مثال: 1.2M)" 
                  value={clipForm.views} 
                  onChange={(e) => setClipForm({...clipForm, views: e.target.value})} 
                  className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
                />
                <input 
                  type="number" 
                  placeholder="عدد الإعجابات" 
                  value={clipForm.likes} 
                  onChange={(e) => setClipForm({...clipForm, likes: e.target.value})} 
                  className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
                />
              </div>
              <input 
                type="url" 
                placeholder="رابط الفيديو (YouTube)" 
                value={clipForm.videoUrl} 
                onChange={(e) => setClipForm({...clipForm, videoUrl: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
                required 
              />
              <input 
                type="url" 
                placeholder="رابط الصورة المصغرة" 
                value={clipForm.thumbnail} 
                onChange={(e) => setClipForm({...clipForm, thumbnail: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" 
              />
              <div className="flex gap-3 pt-3">
                <button 
                  onClick={handleClipSubmit} 
                  disabled={saving}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  {saving ? <FaSyncAlt className="animate-spin" /> : <FaSave />} حفظ
                </button>
                <button onClick={() => setShowClipModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition">
                  <FaTimes /> إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClipsManager;