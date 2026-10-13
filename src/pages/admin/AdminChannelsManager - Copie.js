// src/pages/admin/AdminChannelsManager.js
import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaEdit, FaTrash, FaTv, FaSave, FaTimes, 
  FaSearch, FaGlobe, FaLink, FaImage, FaSyncAlt,
  FaCheckCircle, FaExclamationTriangle, FaPlay, FaStop
} from 'react-icons/fa';
import { channelsAPI } from '../../services/api';

const AdminChannelsManager = () => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewStream, setPreviewStream] = useState(null);

  // ========== FORM STATE ==========
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    logo: '',
    url: '',
    category: 'arabic'
  });

  // ========== CONSTANTS ==========
  const categories = [
    { id: 'arabic', label: '🇸🇦 عربية', icon: '🇸🇦' },
    { id: 'foreign', label: '🌍 أجنبية', icon: '🌍' },
    { id: 'sports', label: '⚽ رياضية', icon: '⚽' },
    { id: 'movies', label: '🎬 أفلام', icon: '🎬' },
    { id: 'kids', label: '🧒 أطفال', icon: '🧒' },
    { id: 'religious', label: '🕌 دينية', icon: '🕌' },
    { id: 'music', label: '🎵 موسيقى', icon: '🎵' },
    { id: 'news', label: '📰 أخبار', icon: '📰' },
    { id: 'documentary', label: '📽️ وثائقية', icon: '📽️' },
    { id: 'entertainment', label: '🎭 ترفيه', icon: '🎭' }
  ];

  // ========== LOAD DATA ==========
  const loadChannels = async () => {
    try {
      const data = await channelsAPI.getAll();
      setChannels(data);
      console.log('✅ تم تحميل القنوات:', data.length);
      return data;
    } catch (error) {
      console.error('❌ خطأ في تحميل القنوات:', error);
      setChannels([]);
      return [];
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  // ========== CRUD OPERATIONS ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.url) {
      alert('الرجاء إدخال اسم القناة ورابط البث');
      return;
    }
    
    setSaving(true);
    try {
      const channelData = {
        name: formData.name,
        name_ar: formData.nameAr || null,
        logo: formData.logo || null,
        url: formData.url,
        category: formData.category || 'arabic'
      };

      console.log('📤 إرسال بيانات القناة:', JSON.stringify(channelData, null, 2));

      let response;
      if (editingChannel) {
        response = await channelsAPI.updateChannel(editingChannel.id, channelData);
        console.log('✅ تم تحديث القناة:', response);
      } else {
        response = await channelsAPI.addChannel(channelData);
        console.log('✅ تم إضافة القناة:', response);
      }

      await loadChannels();
      setShowModal(false);
      setEditingChannel(null);
      resetForm();
      alert(editingChannel ? '✅ تم تحديث القناة بنجاح' : '✅ تم إضافة القناة بنجاح');
    } catch (error) {
      console.error('❌ خطأ في حفظ القناة:', error);
      alert('❌ حدث خطأ: ' + (error.message || 'فشل في حفظ القناة'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (channelId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه القناة؟')) return;

    try {
      await channelsAPI.deleteChannel(channelId);
      console.log('✅ تم حذف القناة');
      await loadChannels();
    } catch (error) {
      console.error('❌ خطأ في حذف القناة:', error);
      alert('❌ حدث خطأ في حذف القناة');
    }
  };

  const handleEdit = (channel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name || '',
      nameAr: channel.name_ar || '',
      logo: channel.logo || '',
      url: channel.url || '',
      category: channel.category || 'arabic'
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      logo: '',
      url: '',
      category: 'arabic'
    });
    setEditingChannel(null);
  };

  // ========== PLAY PREVIEW ==========
  const playPreview = (url) => {
    if (previewStream) {
      previewStream.pause();
      setPreviewStream(null);
      if (previewStream.src === url) return;
    }
    // دعم روابط M3U8 و MP4
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.style.display = 'none';
    document.body.appendChild(video);
    video.play();
    setPreviewStream(video);
    video.onended = () => {
      setPreviewStream(null);
      document.body.removeChild(video);
    };
  };

  // ========== FILTERING ==========
  const getFilteredChannels = () => {
    let filtered = channels;
    
    // تصفية حسب التصنيف
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }
    
    // تصفية حسب البحث
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(term) ||
        c.name_ar?.toLowerCase().includes(term) ||
        c.category?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  const filteredChannels = getFilteredChannels();

  // ========== GET CATEGORY LABEL ==========
  const getCategoryLabel = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.label : categoryId || 'غير محدد';
  };

  // ========== GET CATEGORY COLOR ==========
  const getCategoryColor = (categoryId) => {
    const colors = {
      arabic: 'text-green-400',
      foreign: 'text-blue-400',
      sports: 'text-orange-400',
      movies: 'text-red-400',
      kids: 'text-pink-400',
      religious: 'text-purple-400',
      music: 'text-yellow-400',
      news: 'text-cyan-400',
      documentary: 'text-indigo-400',
      entertainment: 'text-teal-400'
    };
    return colors[categoryId] || 'text-gray-400';
  };

  // ========== GET STATS ==========
  const getStats = () => {
    const total = channels.length;
    const active = channels.filter(c => c.is_active !== false).length;
    const byCategory = {};
    categories.forEach(cat => {
      byCategory[cat.id] = channels.filter(c => c.category === cat.id).length;
    });
    return { total, active, byCategory };
  };

  const stats = getStats();

  // ========== LOADING ==========
  if (loading && channels.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل القنوات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
      {/* ====== HEADER ====== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <FaTv className="text-red-400" /> إدارة القنوات
          <span className="text-sm text-gray-500 font-normal">({channels.length} قناة)</span>
        </h2>
        <button 
          onClick={() => { 
            resetForm(); 
            setShowModal(true); 
          }} 
          className="bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition text-sm sm:text-base"
        >
          <FaPlus /> إضافة قناة
        </button>
      </div>

      {/* ====== STATS ====== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-gray-500 text-xs">📺 إجمالي القنوات</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
          <div className="text-gray-500 text-xs">✅ قنوات نشطة</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.total - stats.active}</div>
          <div className="text-gray-500 text-xs">⏸️ قنوات غير نشطة</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{categories.length}</div>
          <div className="text-gray-500 text-xs">📂 تصنيفات</div>
        </div>
      </div>

      {/* ====== FILTERS ====== */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="بحث عن قناة..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-3 text-white text-sm focus:outline-none focus:border-red-500" 
          />
        </div>
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)} 
          className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-red-500"
        >
          <option value="all">📂 جميع التصنيفات</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
        <button 
          onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }} 
          className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition text-sm"
        >
          <FaSyncAlt className="inline mr-1" /> إعادة تعيين
        </button>
      </div>

      {/* ====== CHANNELS GRID ====== */}
      {filteredChannels.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-800/30 rounded-xl">
          <FaTv className="text-5xl mx-auto mb-3 opacity-50" />
          <p>لا توجد قنوات {searchTerm ? 'تطابق البحث' : ''}</p>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }} 
            className="mt-3 text-red-400 hover:text-red-300 transition"
          >
            <FaPlus className="inline mr-1" /> إضافة قناة جديدة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredChannels.map(channel => (
            <div key={channel.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-red-500/50 transition group">
              {/* Logo */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {channel.logo ? (
                    <img 
                      src={channel.logo} 
                      alt={channel.name} 
                      className="w-12 h-12 object-contain rounded-lg bg-gray-900 p-1"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/48x48/1a1a2e/ffffff?text=📺';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center">
                      <FaTv className="text-gray-400 text-xl" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-bold text-sm truncate max-w-[120px]">
                      {channel.name || channel.name_ar}
                    </h3>
                    <span className={`text-xs ${getCategoryColor(channel.category)}`}>
                      {getCategoryLabel(channel.category)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button 
                    onClick={() => handleEdit(channel)} 
                    className="text-blue-400 hover:text-blue-300 p-1"
                    title="تعديل"
                  >
                    <FaEdit size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(channel.id)} 
                    className="text-red-400 hover:text-red-300 p-1"
                    title="حذف"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>

              {/* URL */}
              <div className="text-gray-500 text-xs truncate mb-3" title={channel.url}>
                <FaLink className="inline mr-1" size={10} />
                {channel.url}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button 
                  onClick={() => playPreview(channel.url)} 
                  className={`flex-1 py-1.5 rounded-lg text-xs transition flex items-center justify-center gap-1 ${
                    previewStream?.src === channel.url 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {previewStream?.src === channel.url ? (
                    <><FaStop size={10} /> إيقاف</>
                  ) : (
                    <><FaPlay size={10} /> معاينة</>
                  )}
                </button>
                <span className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 ${channel.is_active !== false ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {channel.is_active !== false ? <FaCheckCircle size={10} /> : <FaExclamationTriangle size={10} />}
                  {channel.is_active !== false ? 'نشطة' : 'غير نشطة'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====== MODAL ====== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold flex items-center gap-2">
                <FaTv className="text-red-400" />
                {editingChannel ? 'تعديل' : 'إضافة'} قناة
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* الاسم */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">اسم القناة *</label>
                <input 
                  type="text" 
                  placeholder="اسم القناة" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
                  required 
                />
              </div>

              {/* الاسم بالعربية */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">اسم القناة (عربي)</label>
                <input 
                  type="text" 
                  placeholder="اسم القناة بالعربية" 
                  value={formData.nameAr} 
                  onChange={(e) => setFormData({...formData, nameAr: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
                />
              </div>

              {/* رابط الشعار */}
              <div>
                <label className="block text-gray-400 text-sm mb-1 flex items-center gap-2">
                  <FaImage className="text-purple-400" /> رابط الشعار
                </label>
                <input 
                  type="url" 
                  placeholder="https://example.com/logo.png" 
                  value={formData.logo} 
                  onChange={(e) => setFormData({...formData, logo: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
                />
                {formData.logo && (
                  <div className="mt-2">
                    <img src={formData.logo} alt="معاينة الشعار" className="w-12 h-12 object-contain rounded-lg bg-gray-900 p-1" />
                  </div>
                )}
              </div>

              {/* رابط البث */}
              <div>
                <label className="block text-gray-400 text-sm mb-1 flex items-center gap-2">
                  <FaLink className="text-blue-400" /> رابط البث (M3U8 / MP4) *
                </label>
                <input 
                  type="url" 
                  placeholder="https://example.com/stream.m3u8" 
                  value={formData.url} 
                  onChange={(e) => setFormData({...formData, url: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
                  required 
                />
              </div>

              {/* التصنيف */}
              <div>
                <label className="block text-gray-400 text-sm mb-1 flex items-center gap-2">
                  <FaGlobe className="text-green-400" /> التصنيف
                </label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({...formData, category: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* أزرار الحفظ والإلغاء */}
              <div className="flex gap-3 pt-3 border-t border-gray-800">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <FaSyncAlt className="animate-spin" /> : <FaSave />}
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)} 
                  className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition text-sm"
                >
                  <FaTimes className="inline ml-1" /> إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== PREVIEW PLAYER ====== */}
      {previewStream && (
        <div className="fixed bottom-4 right-4 z-50 bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-700 w-80">
          <div className="flex justify-between items-center p-2 bg-gray-900">
            <span className="text-white text-xs truncate flex-1">معاينة البث</span>
            <button 
              onClick={() => {
                previewStream.pause();
                setPreviewStream(null);
                document.body.removeChild(previewStream);
              }} 
              className="text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>
          </div>
          <video 
            ref={(el) => {
              if (el && previewStream) {
                el.src = previewStream.src;
                el.controls = true;
                el.autoplay = true;
                previewStream = el;
              }
            }}
            className="w-full h-40 object-contain"
            controls
            autoPlay
          />
        </div>
      )}
    </div>
  );
};

export default AdminChannelsManager;