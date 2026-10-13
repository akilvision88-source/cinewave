// src/pages/admin/AdminRecitersManager.js
import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaEdit, FaTrash, FaUser, FaQuran, FaMicrophoneAlt, 
  FaMusic, FaSave, FaTimes, FaSearch, FaGlobe, FaStar,
  FaSyncAlt, FaPlay, FaStop, FaClock
} from 'react-icons/fa';
import { recitersAPI } from '../../services/api';

const AdminRecitersManager = () => {
  const [reciters, setReciters] = useState([]);
  const [selectedReciter, setSelectedReciter] = useState(null);
  const [surahs, setSurahs] = useState([]);
  const [showReciterModal, setShowReciterModal] = useState(false);
  const [showSurahModal, setShowSurahModal] = useState(false);
  const [editingReciter, setEditingReciter] = useState(null);
  const [editingSurah, setEditingSurah] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewAudio, setPreviewAudio] = useState(null);
  
  const [reciterForm, setReciterForm] = useState({
    name: '', nameEn: '', style: 'مقرئ', image: '', country: '', surahsCount: 0
  });
  
  const [surahForm, setSurahForm] = useState({
    number: '', name: '', nameEn: '', duration: '', audioUrl: '', verses: ''
  });

  // ========== CONSTANTS ==========
  const countries = ['مصر', 'السعودية', 'الكويت', 'الإمارات', 'قطر', 'البحرين', 'عمان', 'الأردن', 'سوريا', 'فلسطين', 'اليمن', 'السودان', 'الجزائر', 'المغرب', 'تونس', 'ليبيا', 'العراق', 'تركيا', 'إيران', 'باكستان', 'الهند'];

  // أسماء السور (114 سورة)
  const surahNames = [
    'الفاتحة', 'البقرة', 'آل عمران', 'النساء', 'المائدة', 'الأنعام', 'الأعراف', 'الأنفال', 'التوبة', 'يونس',
    'هود', 'يوسف', 'الرعد', 'إبراهيم', 'الحجر', 'النحل', 'الإسراء', 'الكهف', 'مريم', 'طه',
    'الأنبياء', 'الحج', 'المؤمنون', 'النور', 'الفرقان', 'الشعراء', 'النمل', 'القصص', 'العنكبوت', 'الروم',
    'لقمان', 'السجدة', 'الأحزاب', 'سبأ', 'فاطر', 'يس', 'الصافات', 'ص', 'الزمر', 'غافر',
    'فصلت', 'الشورى', 'الزخرف', 'الدخان', 'الجاثية', 'الأحقاف', 'محمد', 'الفتح', 'الحجرات', 'ق',
    'الذاريات', 'الطور', 'النجم', 'القمر', 'الرحمن', 'الواقعة', 'الحديد', 'المجادلة', 'الحشر', 'الممتحنة',
    'الصف', 'الجمعة', 'المنافقون', 'التغابن', 'الطلاق', 'التحريم', 'الملك', 'القلم', 'الحاقة', 'المعارج',
    'نوح', 'الجن', 'المزمل', 'المدثر', 'القيامة', 'الإنسان', 'المرسلات', 'النبأ', 'النازعات', 'عبس',
    'التكوير', 'الانفطار', 'المطففين', 'الانشقاق', 'البروج', 'الطارق', 'الأعلى', 'الغاشية', 'الفجر', 'البلد',
    'الشمس', 'الليل', 'الضحى', 'الشرح', 'التين', 'العلق', 'القدر', 'البينة', 'الزلزلة', 'العاديات',
    'القارعة', 'التكاثر', 'العصر', 'الهمزة', 'الفيل', 'قريش', 'الماعون', 'الكوثر', 'الكافرون', 'النصر',
    'المسد', 'الإخلاص', 'الفلق', 'الناس'
  ];

  // ========== LOAD DATA ==========
  const loadReciters = async () => {
    try {
      const data = await recitersAPI.getAll();
      setReciters(data);
      console.log('✅ تم تحميل القراء:', data.length);
      return data;
    } catch (error) {
      console.error('❌ خطأ في تحميل القراء:', error);
      setReciters([]);
      return [];
    }
  };

  const loadSurahs = async (reciterId) => {
    try {
      const data = await recitersAPI.getSurahs(reciterId);
      setSurahs(data);
      console.log(`✅ تم تحميل ${data.length} سورة للقارئ ${reciterId}`);
      return data;
    } catch (error) {
      console.error('❌ خطأ في تحميل السور:', error);
      setSurahs([]);
      return [];
    }
  };

  const selectReciter = async (reciter) => {
    setSelectedReciter(reciter);
    setLoading(true);
    await loadSurahs(reciter.id);
    setLoading(false);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await loadReciters();
      if (selectedReciter) {
        await loadSurahs(selectedReciter.id);
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // ========== RECITER CRUD ==========
  const handleReciterSubmit = async () => {
    if (!reciterForm.name) {
      alert('الرجاء إدخال اسم القارئ');
      return;
    }
    
    setSaving(true);
    try {
      const reciterData = {
        name: reciterForm.name,
        name_en: reciterForm.nameEn || null,
        image: reciterForm.image || null,
        country: reciterForm.country || null,
        style: reciterForm.style || 'مقرئ'
      };

      console.log('📤 إرسال بيانات القارئ:', JSON.stringify(reciterData, null, 2));

      let response;
      if (editingReciter) {
        response = await recitersAPI.updateReciter(editingReciter.id, reciterData);
        console.log('✅ تم تحديث القارئ:', response);
      } else {
        response = await recitersAPI.addReciter(reciterData);
        console.log('✅ تم إضافة القارئ:', response);
      }

      await loadAllData();
      setShowReciterModal(false);
      setEditingReciter(null);
      setReciterForm({ name: '', nameEn: '', style: 'مقرئ', image: '', country: '', surahsCount: 0 });
      alert(editingReciter ? '✅ تم تحديث القارئ بنجاح' : '✅ تم إضافة القارئ بنجاح');
    } catch (error) {
      console.error('❌ خطأ في حفظ القارئ:', error);
      alert('❌ حدث خطأ: ' + (error.message || 'فشل في حفظ القارئ'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReciter = async (reciterId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القارئ وجميع سوره؟')) return;

    try {
      await recitersAPI.deleteReciter(reciterId);
      console.log('✅ تم حذف القارئ');
      
      if (selectedReciter?.id === reciterId) {
        setSelectedReciter(null);
        setSurahs([]);
      }
      
      await loadAllData();
    } catch (error) {
      console.error('❌ خطأ في حذف القارئ:', error);
      alert('❌ حدث خطأ في حذف القارئ');
    }
  };

  // ========== SURAH CRUD ==========
  const handleSurahSubmit = async () => {
    if (!surahForm.number || !surahForm.name) {
      alert('الرجاء إدخال رقم واسم السورة');
      return;
    }
    
    if (!selectedReciter) {
      alert('الرجاء اختيار قارئ أولاً');
      return;
    }
    
    setSaving(true);
    try {
      const surahData = {
        number: parseInt(surahForm.number),
        name: surahForm.name,
        name_en: surahForm.nameEn || null,
        audio_url: surahForm.audioUrl || null,
        duration: surahForm.duration || null,
        verses: parseInt(surahForm.verses) || 0
      };

      console.log('📤 إرسال بيانات السورة:', JSON.stringify(surahData, null, 2));

      let response;
      if (editingSurah) {
        response = await recitersAPI.updateSurah(selectedReciter.id, editingSurah.id, surahData);
        console.log('✅ تم تحديث السورة:', response);
      } else {
        response = await recitersAPI.addSurah(selectedReciter.id, surahData);
        console.log('✅ تم إضافة السورة:', response);
      }

      await loadAllData();
      setShowSurahModal(false);
      setEditingSurah(null);
      setSurahForm({ number: '', name: '', nameEn: '', duration: '', audioUrl: '', verses: '' });
      alert(editingSurah ? '✅ تم تحديث السورة بنجاح' : '✅ تم إضافة السورة بنجاح');
    } catch (error) {
      console.error('❌ خطأ في حفظ السورة:', error);
      alert('❌ حدث خطأ: ' + (error.message || 'فشل في حفظ السورة'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSurah = async (surahId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه السورة؟')) return;

    try {
      await recitersAPI.deleteSurah(selectedReciter.id, surahId);
      console.log('✅ تم حذف السورة');
      await loadAllData();
    } catch (error) {
      console.error('❌ خطأ في حذف السورة:', error);
      alert('❌ حدث خطأ في حذف السورة');
    }
  };

  // ========== PLAY PREVIEW ==========
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
  const filteredReciters = reciters.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.name_en && r.name_en.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ========== LOADING ==========
  if (loading && reciters.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل القراء...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <FaQuran className="text-green-400" /> إدارة القراء والسور
          <span className="text-sm text-gray-500 font-normal">({reciters.length} قارئ)</span>
        </h2>
        <button 
          onClick={() => { 
            setEditingReciter(null); 
            setReciterForm({ name: '', nameEn: '', style: 'مقرئ', image: '', country: '', surahsCount: 0 }); 
            setShowReciterModal(true); 
          }} 
          className="bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition text-sm sm:text-base"
        >
          <FaPlus /> إضافة قارئ
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ====== قائمة القراء ====== */}
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaUser className="text-green-400" />
            <h3 className="text-white font-bold">القراء ({reciters.length})</h3>
          </div>
          
          <div className="relative mb-3">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="بحث عن قارئ..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 pl-10 pr-3 text-white text-sm focus:outline-none focus:border-green-500" 
            />
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredReciters.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">لا توجد قراء</p>
            ) : (
              filteredReciters.map(reciter => (
                <div 
                  key={reciter.id} 
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${selectedReciter?.id === reciter.id ? 'bg-green-600/20 border-r-2 border-green-500' : 'hover:bg-gray-700'}`} 
                  onClick={() => selectReciter(reciter)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {reciter.image ? (
                      <img src={reciter.image} alt={reciter.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-green-600/30 flex items-center justify-center flex-shrink-0">
                        <FaQuran className="text-green-400 text-sm" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">{reciter.name}</p>
                      <p className="text-gray-500 text-xs">
                        {reciter.country && `${reciter.country} • `}
                        {reciter.surahs_count || 0} سورة
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingReciter(reciter); 
                        setReciterForm({
                          name: reciter.name || '',
                          nameEn: reciter.name_en || '',
                          style: reciter.style || 'مقرئ',
                          image: reciter.image || '',
                          country: reciter.country || '',
                          surahsCount: reciter.surahs_count || 0
                        }); 
                        setShowReciterModal(true); 
                      }} 
                      className="text-blue-400 hover:text-blue-300 p-1"
                      title="تعديل"
                    >
                      <FaEdit size={14} />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleDeleteReciter(reciter.id); 
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

        {/* ====== سور القارئ المختار ====== */}
        <div className="md:col-span-2 bg-gray-800 rounded-xl p-4">
          {selectedReciter ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div className="flex items-center gap-3">
                  {selectedReciter.image ? (
                    <img src={selectedReciter.image} alt={selectedReciter.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-600/30 flex items-center justify-center">
                      <FaQuran className="text-green-400 text-lg" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-bold">{selectedReciter.name}</h3>
                    <p className="text-gray-500 text-xs">
                      {selectedReciter.country && `${selectedReciter.country} • `}
                      {surahs.length} سورة
                      {selectedReciter.style && ` • ${selectedReciter.style}`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { 
                    setEditingSurah(null); 
                    setSurahForm({ number: '', name: '', nameEn: '', duration: '', audioUrl: '', verses: '' }); 
                    setShowSurahModal(true); 
                  }} 
                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700 transition flex-shrink-0"
                >
                  <FaPlus size={12} /> إضافة سورة
                </button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : surahs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaQuran className="text-4xl mx-auto mb-2 opacity-50" />
                    <p>لا توجد سور لهذا القارئ</p>
                  </div>
                ) : (
                  surahs.map(surah => (
                    <div key={surah.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-400 text-sm font-bold">{surah.number}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium">{surah.name}</p>
                          <div className="flex flex-wrap items-center gap-1 text-gray-500 text-xs">
                            {surah.duration && <span><FaClock className="inline mr-1" size={10} />{surah.duration}</span>}
                            {surah.verses && <span>• {surah.verses} آية</span>}
                            {surah.name_en && <span>• {surah.name_en}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {surah.audio_url && (
                          <button 
                            onClick={() => playPreview(surah.audio_url)} 
                            className={`p-1.5 rounded-lg transition ${previewAudio?.src === surah.audio_url ? 'bg-green-600 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                            title={previewAudio?.src === surah.audio_url ? 'إيقاف' : 'استماع'}
                          >
                            {previewAudio?.src === surah.audio_url ? <FaStop size={12} /> : <FaPlay size={12} />}
                          </button>
                        )}
                        <button 
                          onClick={() => { 
                            setEditingSurah(surah); 
                            setSurahForm({
                              number: surah.number || '',
                              name: surah.name || '',
                              nameEn: surah.name_en || '',
                              duration: surah.duration || '',
                              audioUrl: surah.audio_url || '',
                              verses: surah.verses || ''
                            }); 
                            setShowSurahModal(true); 
                          }} 
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="تعديل"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteSurah(surah.id)} 
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
              <FaQuran className="text-5xl mx-auto mb-3 opacity-50" />
              <p>اختر قارئاً لعرض سوره</p>
            </div>
          )}
        </div>
      </div>

      {/* ====== مودال إضافة/تعديل قارئ ====== */}
      {showReciterModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowReciterModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold flex items-center gap-2">
                <FaUser className="text-green-400" />
                {editingReciter ? 'تعديل' : 'إضافة'} قارئ
              </h3>
              <button onClick={() => setShowReciterModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              <input 
                type="text" 
                placeholder="اسم القارئ *" 
                value={reciterForm.name} 
                onChange={(e) => setReciterForm({...reciterForm, name: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
                required 
              />
              <input 
                type="text" 
                placeholder="اسم القارئ (إنجليزي)" 
                value={reciterForm.nameEn} 
                onChange={(e) => setReciterForm({...reciterForm, nameEn: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
              />
              
              <div>
                <label className="block text-gray-400 text-sm mb-1 flex items-center gap-2">
                  <FaGlobe className="text-green-400" /> الدولة
                </label>
                <select 
                  value={reciterForm.country} 
                  onChange={(e) => setReciterForm({...reciterForm, country: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"
                >
                  <option value="">اختر الدولة</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <input 
                type="text" 
                placeholder="النمط (مثال: مقرئ, مجود)" 
                value={reciterForm.style} 
                onChange={(e) => setReciterForm({...reciterForm, style: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
              />
              <input 
                type="url" 
                placeholder="رابط صورة القارئ" 
                value={reciterForm.image} 
                onChange={(e) => setReciterForm({...reciterForm, image: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
              />
              
              <div className="flex gap-3 pt-3">
                <button 
                  onClick={handleReciterSubmit} 
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <FaSyncAlt className="animate-spin" /> : <FaSave />}
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button 
                  onClick={() => setShowReciterModal(false)} 
                  className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition text-sm"
                >
                  <FaTimes className="inline ml-1" /> إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== مودال إضافة/تعديل سورة ====== */}
      {showSurahModal && selectedReciter && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowSurahModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold flex items-center gap-2">
                <FaQuran className="text-green-400" />
                {editingSurah ? 'تعديل' : 'إضافة'} سورة - {selectedReciter.name}
              </h3>
              <button onClick={() => setShowSurahModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="number" 
                  placeholder="رقم السورة *" 
                  value={surahForm.number} 
                  onChange={(e) => setSurahForm({...surahForm, number: e.target.value})} 
                  className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
                  required 
                />
                <input 
                  type="number" 
                  placeholder="عدد الآيات" 
                  value={surahForm.verses} 
                  onChange={(e) => setSurahForm({...surahForm, verses: e.target.value})} 
                  className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">اسم السورة</label>
                <select 
                  value={surahForm.name} 
                  onChange={(e) => setSurahForm({...surahForm, name: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"
                  required
                >
                  <option value="">اختر اسم السورة</option>
                  {surahNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              
              <input 
                type="text" 
                placeholder="اسم السورة (إنجليزي)" 
                value={surahForm.nameEn} 
                onChange={(e) => setSurahForm({...surahForm, nameEn: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
              />
              <input 
                type="text" 
                placeholder="المدة (مثال: 5:30)" 
                value={surahForm.duration} 
                onChange={(e) => setSurahForm({...surahForm, duration: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
              />
              <input 
                type="url" 
                placeholder="رابط التلاوة (YouTube أو MP3)" 
                value={surahForm.audioUrl} 
                onChange={(e) => setSurahForm({...surahForm, audioUrl: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" 
              />
              
              <div className="flex gap-3 pt-3">
                <button 
                  onClick={handleSurahSubmit} 
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <FaSyncAlt className="animate-spin" /> : <FaSave />}
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button 
                  onClick={() => setShowSurahModal(false)} 
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

export default AdminRecitersManager;