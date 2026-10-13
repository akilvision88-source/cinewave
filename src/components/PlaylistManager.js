import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaList, FaPlay, FaTimes, FaSave } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const PlaylistManager = () => {
  const [playlists, setPlaylists] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [availableContent, setAvailableContent] = useState([]);

  useEffect(() => {
    loadPlaylists();
    loadContent();
  }, []);

  const loadPlaylists = () => {
    const saved = localStorage.getItem('cinewave_playlists');
    if (saved) {
      setPlaylists(JSON.parse(saved));
    } else {
      const defaultPlaylists = [
        { id: 1, name: 'أفضل الأفلام', createdAt: '2024-01-01', items: [] },
        { id: 2, name: 'مسلسلاتي المفضلة', createdAt: '2024-01-02', items: [] }
      ];
      setPlaylists(defaultPlaylists);
      localStorage.setItem('cinewave_playlists', JSON.stringify(defaultPlaylists));
    }
  };

  const loadContent = () => {
    // تحميل الأفلام والمسلسلات
    const allContent = [];
    const categories = ['arabwood', 'hollywood', 'bollywood', 'european', 'asian'];
    categories.forEach(cat => {
      const data = localStorage.getItem(`cinewave_${cat}`);
      if (data) {
        const movies = JSON.parse(data);
        movies.forEach(m => allContent.push({ ...m, type: 'movie', category: cat }));
      }
    });
    setAvailableContent(allContent);
  };

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const newPlaylist = {
      id: Date.now(),
      name: newPlaylistName,
      createdAt: new Date().toISOString().split('T')[0],
      items: []
    };
    const updated = [...playlists, newPlaylist];
    setPlaylists(updated);
    localStorage.setItem('cinewave_playlists', JSON.stringify(updated));
    setNewPlaylistName('');
    setShowCreateModal(false);
  };

  const updatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const updated = playlists.map(p =>
      p.id === editingPlaylist.id ? { ...p, name: newPlaylistName } : p
    );
    setPlaylists(updated);
    localStorage.setItem('cinewave_playlists', JSON.stringify(updated));
    setEditingPlaylist(null);
    setNewPlaylistName('');
    setShowCreateModal(false);
  };

  const deletePlaylist = (id) => {
    if (window.confirm('هل أنت متأكد من حذف قائمة التشغيل هذه؟')) {
      const updated = playlists.filter(p => p.id !== id);
      setPlaylists(updated);
      localStorage.setItem('cinewave_playlists', JSON.stringify(updated));
      if (selectedPlaylist?.id === id) setSelectedPlaylist(null);
    }
  };

  const addToPlaylist = (playlistId, contentId) => {
    const content = availableContent.find(c => c.id === contentId);
    if (!content) return;

    const updated = playlists.map(p => {
      if (p.id === playlistId) {
        const exists = p.items.some(i => i.id === contentId);
        if (!exists) {
          return { ...p, items: [...p.items, content] };
        }
      }
      return p;
    });
    setPlaylists(updated);
    localStorage.setItem('cinewave_playlists', JSON.stringify(updated));
  };

  const removeFromPlaylist = (playlistId, contentId) => {
    const updated = playlists.map(p =>
      p.id === playlistId ? { ...p, items: p.items.filter(i => i.id !== contentId) } : p
    );
    setPlaylists(updated);
    localStorage.setItem('cinewave_playlists', JSON.stringify(updated));
  };

  const openEditModal = (playlist) => {
    setEditingPlaylist(playlist);
    setNewPlaylistName(playlist.name);
    setShowCreateModal(true);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FaList className="text-purple-400" /> قوائم التشغيل
        </h2>
        <button
          onClick={() => { setEditingPlaylist(null); setNewPlaylistName(''); setShowCreateModal(true); }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
        >
          <FaPlus /> قائمة جديدة
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* قائمة القوائم */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3">قوائمي ({playlists.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {playlists.map(playlist => (
              <div
                key={playlist.id}
                onClick={() => setSelectedPlaylist(playlist)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                  selectedPlaylist?.id === playlist.id ? 'bg-purple-600/20 border-r-2 border-purple-500' : 'hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaList className="text-purple-400" />
                  <div>
                    <p className="text-white text-sm">{playlist.name}</p>
                    <p className="text-gray-500 text-xs">{playlist.items.length} محتوى</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); openEditModal(playlist); }} className="text-blue-400">
                    <FaEdit size={12} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id); }} className="text-red-400">
                    <FaTrash size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* محتوى القائمة المختارة */}
        <div className="md:col-span-2 bg-gray-800 rounded-xl p-4">
          {selectedPlaylist ? (
            <>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-bold">{selectedPlaylist.name}</h3>
                <p className="text-gray-500 text-sm">{selectedPlaylist.items.length} محتوى</p>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedPlaylist.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaList className="text-4xl mx-auto mb-2 opacity-50" />
                    <p>لا توجد محتويات في هذه القائمة</p>
                    <p className="text-xs mt-1">أضف محتوى من صفحة التفاصيل</p>
                  </div>
                ) : (
                  selectedPlaylist.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-700/30 rounded-lg">
                      <img src={item.poster} alt={item.title} className="w-12 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <Link to={`/movie/${item.id}`} className="text-white text-sm font-medium hover:text-purple-400">
                          {item.title}
                        </Link>
                        <p className="text-gray-500 text-xs">{item.year} • {item.genre}</p>
                      </div>
                      <button onClick={() => removeFromPlaylist(selectedPlaylist.id, item.id)} className="text-red-400 hover:text-red-300">
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FaList className="text-5xl mx-auto mb-3 opacity-50" />
              <p>اختر قائمة تشغيل لعرض محتوياتها</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal إنشاء/تعديل قائمة */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold">{editingPlaylist ? 'تعديل قائمة' : 'قائمة جديدة'}</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-5">
              <input
                type="text"
                placeholder="اسم القائمة"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={editingPlaylist ? updatePlaylist : createPlaylist} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                  <FaSave className="inline ml-1" /> {editingPlaylist ? 'تعديل' : 'إنشاء'}
                </button>
                <button onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600">
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

export default PlaylistManager;