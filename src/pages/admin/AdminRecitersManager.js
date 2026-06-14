import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaUser, FaQuran, FaMicrophoneAlt, FaMusic, FaSave, FaTimes, FaSearch, FaGlobe, FaStar } from 'react-icons/fa';

const AdminRecitersManager = () => {
  const [reciters, setReciters] = useState([]);
  const [selectedReciter, setSelectedReciter] = useState(null);
  const [surahs, setSurahs] = useState([]);
  const [showReciterModal, setShowReciterModal] = useState(false);
  const [showSurahModal, setShowSurahModal] = useState(false);
  const [editingReciter, setEditingReciter] = useState(null);
  const [editingSurah, setEditingSurah] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [reciterForm, setReciterForm] = useState({
    name: '', nameEn: '', style: 'مقرئ', image: '', country: '', surahsCount: 0
  });
  
  const [surahForm, setSurahForm] = useState({
    number: '', name: '', nameEn: '', duration: '', audioUrl: '', verses: ''
  });

  const countries = ['مصر', 'السعودية', 'الكويت', 'الإمارات', 'قطر', 'البحرين', 'عمان', 'الأردن', 'سوريا', 'فلسطين', 'اليمن', 'السودان', 'الجزائر', 'المغرب', 'تونس', 'ليبيا', 'العراق'];

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

  // تحميل القراء
  useEffect(() => {
    loadReciters();
  }, []);

  const loadReciters = () => {
    const saved = localStorage.getItem('cinewave_reciters');
    if (saved) {
      setReciters(JSON.parse(saved));
    } else {
      const defaultReciters = [
        { id: 1, name: 'الشيخ عبد الباسط عبد الصمد', nameEn: 'Abdul Basit', style: 'مقرئ', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Abdul_Basit_%28reciter%29.jpg/220px-Abdul_Basit_%28reciter%29.jpg', country: 'مصر', surahsCount: 114 },
        { id: 2, name: 'الشيخ محمود خليل الحصري', nameEn: 'Mahmoud Khalil Al-Husary', style: 'مقرئ', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Mahmoud_Khalil_Al-Husary.jpg/220px-Mahmoud_Khalil_Al-Husary.jpg', country: 'مصر', surahsCount: 114 },
        { id: 3, name: 'الشيخ محمد صديق المنشاوي', nameEn: 'Mohamed Siddiq El-Minshawi', style: 'مقرئ', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/El_Menshawy.jpg/220px-El_Menshawy.jpg', country: 'مصر', surahsCount: 114 },
        { id: 4, name: 'الشيخ سعد الغامدي', nameEn: 'Saad Al-Ghamdi', style: 'مقرئ', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Saad_Al-Ghamdi.jpg/220px-Saad_Al-Ghamdi.jpg', country: 'السعودية', surahsCount: 114 },
        { id: 5, name: 'الشيخ ماهر المعيقلي', nameEn: 'Maher Al-Muaiqly', style: 'مقرئ', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Maher_Al_Muaiqly.jpg/220px-Maher_Al_Muaiqly.jpg', country: 'السعودية', surahsCount: 114 },
      ];
      setReciters(defaultReciters);
      localStorage.setItem('cinewave_reciters', JSON.stringify(defaultReciters));
    }
  };

  const loadSurahs = (reciterId) => {
    const saved = localStorage.getItem(`cinewave_surahs_${reciterId}`);
    if (saved) {
      setSurahs(JSON.parse(saved));
    } else {
      // إنشاء سور افتراضية للقارئ (أول 10 سور)
      const defaultSurahs = surahNames.slice(0, 10).map((name, index) => ({
        id: index + 1,
        number: index + 1,
        name: name,
        nameEn: name,
        duration: `${Math.floor(Math.random() * 10) + 3}:${Math.floor(Math.random() * 60)}`,
        audioUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        verses: Math.floor(Math.random() * 200) + 10
      }));
      setSurahs(defaultSurahs);
      localStorage.setItem(`cinewave_surahs_${reciterId}`, JSON.stringify(defaultSurahs));
    }
  };

  const selectReciter = (reciter) => {
    setSelectedReciter(reciter);
    loadSurahs(reciter.id);
  };

  const handleReciterSubmit = () => {
    if (!reciterForm.name) return;
    const newReciter = { ...reciterForm, id: editingReciter ? editingReciter.id : Date.now(), surahsCount: surahs.length };
    let newReciters;
    if (editingReciter) {
      newReciters = reciters.map(r => r.id === editingReciter.id ? newReciter : r);
    } else {
      newReciters = [...reciters, newReciter];
    }
    setReciters(newReciters);
    localStorage.setItem('cinewave_reciters', JSON.stringify(newReciters));
    setShowReciterModal(false);
    setEditingReciter(null);
    setReciterForm({ name: '', nameEn: '', style: 'مقرئ', image: '', country: '', surahsCount: 0 });
  };

  const handleDeleteReciter = (reciterId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القارئ وجميع سوره؟')) {
      const newReciters = reciters.filter(r => r.id !== reciterId);
      setReciters(newReciters);
      localStorage.setItem('cinewave_reciters', JSON.stringify(newReciters));
      localStorage.removeItem(`cinewave_surahs_${reciterId}`);
      if (selectedReciter?.id === reciterId) {
        setSelectedReciter(null);
        setSurahs([]);
      }
    }
  };

  const handleSurahSubmit = () => {
    if (!surahForm.number || !surahForm.name) return;
    const newSurah = { ...surahForm, id: editingSurah ? editingSurah.id : Date.now(), number: parseInt(surahForm.number), verses: parseInt(surahForm.verses) || 0 };
    let newSurahs;
    if (editingSurah) {
      newSurahs = surahs.map(s => s.id === editingSurah.id ? newSurah : s);
    } else {
      newSurahs = [...surahs, newSurah];
    }
    newSurahs.sort((a, b) => a.number - b.number);
    setSurahs(newSurahs);
    localStorage.setItem(`cinewave_surahs_${selectedReciter.id}`, JSON.stringify(newSurahs));
    
    // تحديث عدد السور للقارئ
    const updatedReciters = reciters.map(r => r.id === selectedReciter.id ? { ...r, surahsCount: newSurahs.length } : r);
    setReciters(updatedReciters);
    localStorage.setItem('cinewave_reciters', JSON.stringify(updatedReciters));
    
    setShowSurahModal(false);
    setEditingSurah(null);
    setSurahForm({ number: '', name: '', nameEn: '', duration: '', audioUrl: '', verses: '' });
  };

  const handleDeleteSurah = (surahId) => {
    if (window.confirm('هل أنت متأكد من حذف هذه السورة؟')) {
      const newSurahs = surahs.filter(s => s.id !== surahId);
      setSurahs(newSurahs);
      localStorage.setItem(`cinewave_surahs_${selectedReciter.id}`, JSON.stringify(newSurahs));
      
      const updatedReciters = reciters.map(r => r.id === selectedReciter.id ? { ...r, surahsCount: newSurahs.length } : r);
      setReciters(updatedReciters);
      localStorage.setItem('cinewave_reciters', JSON.stringify(updatedReciters));
    }
  };

  const filteredReciters = reciters.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">🕌 إدارة القراء والسور</h2>
        <button onClick={() => { setEditingReciter(null); setReciterForm({ name: '', nameEn: '', style: 'مقرئ', image: '', country: '', surahsCount: 0 }); setShowReciterModal(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
          <FaPlus /> إضافة قارئ
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* قائمة القراء */}
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaUser className="text-green-400" />
            <h3 className="text-white font-bold">القراء ({reciters.length})</h3>
          </div>
          <div className="relative mb-3">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="بحث عن قارئ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 pl-10 pr-3 text-white text-sm" />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredReciters.length === 0 ? (
              <p className="text-gray-500 text-center py-4">لا توجد قراء</p>
            ) : (
              filteredReciters.map(reciter => (
                <div key={reciter.id} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${selectedReciter?.id === reciter.id ? 'bg-green-600/20 border-r-2 border-green-500' : 'hover:bg-gray-700'}`} onClick={() => selectReciter(reciter)}>
                  <div className="flex items-center gap-2">
                    <img src={reciter.image} alt={reciter.name} className="w-8 h-8 rounded-full object-cover" />
                    <div><p className="text-white text-sm">{reciter.name}</p><p className="text-gray-500 text-xs">{reciter.surahsCount} سورة</p></div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setEditingReciter(reciter); setReciterForm(reciter); setShowReciterModal(true); }} className="text-blue-400"><FaEdit size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteReciter(reciter.id); }} className="text-red-400"><FaTrash size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* سور القارئ المختار */}
        <div className="md:col-span-2 bg-gray-800 rounded-xl p-4">
          {selectedReciter ? (
            <>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <FaQuran className="text-green-400" />
                  <h3 className="text-white font-bold">سور {selectedReciter.name} ({surahs.length})</h3>
                </div>
                <button onClick={() => { setEditingSurah(null); setSurahForm({ number: '', name: '', nameEn: '', duration: '', audioUrl: '', verses: '' }); setShowSurahModal(true); }} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"><FaPlus size={12} /> إضافة سورة</button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {surahs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">لا توجد سور لهذا القارئ</p>
                ) : (
                  surahs.map(surah => (
                    <div key={surah.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center">
                          <span className="text-green-400 text-sm font-bold">{surah.number}</span>
                        </div>
                        <div>
                          <p className="text-white text-sm">{surah.name}</p>
                          <p className="text-gray-500 text-xs">{surah.duration} • {surah.verses} آية</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingSurah(surah); setSurahForm(surah); setShowSurahModal(true); }} className="text-blue-400"><FaEdit /></button>
                        <button onClick={() => handleDeleteSurah(surah.id)} className="text-red-400"><FaTrash /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">اختر قارئاً لعرض سوره</div>
          )}
        </div>
      </div>

      {/* Modal إضافة/تعديل قارئ */}
      {showReciterModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowReciterModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold">{editingReciter ? 'تعديل' : 'إضافة'} قارئ</h3>
              <button onClick={() => setShowReciterModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              <input type="text" placeholder="اسم القارئ" value={reciterForm.name} onChange={(e) => setReciterForm({...reciterForm, name: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
              <input type="text" placeholder="اسم القارئ (إنجليزي)" value={reciterForm.nameEn} onChange={(e) => setReciterForm({...reciterForm, nameEn: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
              <select value={reciterForm.country} onChange={(e) => setReciterForm({...reciterForm, country: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white">
                <option value="">اختر الدولة</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="url" placeholder="رابط صورة القارئ" value={reciterForm.image} onChange={(e) => setReciterForm({...reciterForm, image: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
              <div className="flex gap-3 pt-3">
                <button onClick={handleReciterSubmit} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"><FaSave /> حفظ</button>
                <button onClick={() => setShowReciterModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600"><FaTimes /> إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal إضافة/تعديل سورة */}
      {showSurahModal && selectedReciter && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowSurahModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold">{editingSurah ? 'تعديل' : 'إضافة'} سورة - {selectedReciter.name}</h3>
              <button onClick={() => setShowSurahModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="رقم السورة" value={surahForm.number} onChange={(e) => setSurahForm({...surahForm, number: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
                <input type="text" placeholder="عدد الآيات" value={surahForm.verses} onChange={(e) => setSurahForm({...surahForm, verses: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
              </div>
              <select value={surahForm.name} onChange={(e) => setSurahForm({...surahForm, name: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white">
                <option value="">اختر اسم السورة</option>
                {surahNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              <input type="text" placeholder="اسم السورة (إنجليزي)" value={surahForm.nameEn} onChange={(e) => setSurahForm({...surahForm, nameEn: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
              <input type="text" placeholder="المدة (مثال: 5:30)" value={surahForm.duration} onChange={(e) => setSurahForm({...surahForm, duration: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
              <input type="url" placeholder="رابط التلاوة (YouTube أو MP3)" value={surahForm.audioUrl} onChange={(e) => setSurahForm({...surahForm, audioUrl: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
              <div className="flex gap-3 pt-3">
                <button onClick={handleSurahSubmit} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"><FaSave /> حفظ</button>
                <button onClick={() => setShowSurahModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600"><FaTimes /> إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecitersManager;