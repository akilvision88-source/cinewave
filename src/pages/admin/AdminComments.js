// src/pages/admin/AdminComments.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaStar, FaTrash, FaCheck, FaTimes, FaEye, FaReply, FaFilter, FaSearch,
  FaSyncAlt, FaUser, FaCalendarAlt, FaHeart, FaComment, FaFilm, FaTv, FaMusic
} from 'react-icons/fa';
import { commentsAPI } from '../../services/api';

const AdminComments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedComment, setSelectedComment] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState(null);

  // ========== LOAD COMMENTS ==========
  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await commentsAPI.getAll();
      setComments(data);
      console.log('✅ تم تحميل التعليقات:', data.length);
    } catch (error) {
      console.error('❌ خطأ في تحميل التعليقات:', error);
      setError(error.message || 'فشل في تحميل التعليقات');
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // ========== UPDATE COMMENT STATUS ==========
  const updateCommentStatus = async (commentId, status) => {
    setSaving(true);
    try {
      await commentsAPI.updateStatus(commentId, status);
      await loadComments();
      console.log(`✅ تم تحديث حالة التعليق إلى: ${status}`);
    } catch (error) {
      console.error('❌ خطأ في تحديث الحالة:', error);
      alert('❌ حدث خطأ في تحديث حالة التعليق');
    } finally {
      setSaving(false);
    }
  };

  // ========== DELETE COMMENT ==========
  const deleteComment = async (commentId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
    
    setSaving(true);
    try {
      await commentsAPI.deleteComment(commentId);
      await loadComments();
      console.log('✅ تم حذف التعليق');
    } catch (error) {
      console.error('❌ خطأ في حذف التعليق:', error);
      alert('❌ حدث خطأ في حذف التعليق');
    } finally {
      setSaving(false);
    }
  };

  // ========== ADD REPLY ==========
  const addReply = async () => {
    if (!replyText.trim()) {
      alert('الرجاء كتابة الرد');
      return;
    }
    
    setSaving(true);
    try {
      await commentsAPI.addReply(selectedComment.id, replyText);
      await loadComments();
      setShowReplyModal(false);
      setReplyText('');
      console.log('✅ تم إضافة الرد');
    } catch (error) {
      console.error('❌ خطأ في إضافة الرد:', error);
      alert('❌ حدث خطأ في إضافة الرد');
    } finally {
      setSaving(false);
    }
  };

  // ========== GET CONTENT TITLE ==========
  const getContentTitle = (comment) => {
    if (comment.content_title) {
      return comment.content_title;
    }
    if (comment.content_type === 'movie') return 'فيلم';
    if (comment.content_type === 'series') return 'مسلسل';
    if (comment.content_type === 'song') return 'أغنية';
    if (comment.content_type === 'clip') return 'كليب';
    return 'محتوى';
  };

  // ========== GET CONTENT TYPE ICON ==========
  const getContentTypeIcon = (type) => {
    switch(type) {
      case 'movie': return <FaFilm className="text-purple-400" />;
      case 'series': return <FaTv className="text-blue-400" />;
      case 'song': return <FaMusic className="text-pink-400" />;
      case 'clip': return <FaFilm className="text-orange-400" />;
      default: return <FaComment className="text-gray-400" />;
    }
  };

  // ========== FILTER COMMENTS ==========
  const filteredComments = comments.filter(c => {
    const matchSearch = (c.user_name || c.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (c.comment || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchType = filterType === 'all' || c.content_type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  // ========== STATS ==========
  const stats = {
    total: comments.length,
    approved: comments.filter(c => c.status === 'approved').length,
    pending: comments.filter(c => c.status === 'pending').length,
    reported: comments.filter(c => c.status === 'reported').length,
    avgRating: comments.length > 0 
      ? (comments.reduce((sum, c) => sum + (c.rating || 0), 0) / comments.length).toFixed(1) 
      : '0.0'
  };

  // ========== LOADING ==========
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل التعليقات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 text-center">
        <div className="text-red-400 text-4xl mb-4">⚠️</div>
        <h3 className="text-white text-xl font-bold mb-2">حدث خطأ</h3>
        <p className="text-gray-400">{error}</p>
        <button 
          onClick={loadComments} 
          className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <FaSyncAlt className="inline mr-2" /> إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
      {/* ====== HEADER ====== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <FaComment className="text-purple-400" /> إدارة التعليقات والتقييمات
          <span className="text-sm text-gray-500 font-normal">({stats.total})</span>
        </h2>
        <button 
          onClick={loadComments} 
          className="bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition text-sm flex items-center gap-1"
          disabled={loading}
        >
          <FaSyncAlt className={loading ? 'animate-spin' : ''} /> تحديث
        </button>
      </div>

      {/* ====== STATS ====== */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
          <p className="text-gray-500 text-xs">📊 إجمالي</p>
          <p className="text-white text-xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center border border-green-700">
          <p className="text-gray-500 text-xs">✅ مقبولة</p>
          <p className="text-green-400 text-xl font-bold">{stats.approved}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center border border-yellow-700">
          <p className="text-gray-500 text-xs">⏳ قيد المراجعة</p>
          <p className="text-yellow-400 text-xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center border border-red-700">
          <p className="text-gray-500 text-xs">🚫 مبلغ عنها</p>
          <p className="text-red-400 text-xl font-bold">{stats.reported}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center border border-purple-700">
          <p className="text-gray-500 text-xs">⭐ متوسط التقييم</p>
          <p className="text-purple-400 text-xl font-bold">{stats.avgRating}</p>
        </div>
      </div>

      {/* ====== FILTERS ====== */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="بحث عن تعليق أو مستخدم..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-3 text-white text-sm focus:outline-none focus:border-purple-500" 
          />
        </div>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)} 
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="all">📋 كل الحالات</option>
          <option value="approved">✅ مقبولة</option>
          <option value="pending">⏳ قيد المراجعة</option>
          <option value="reported">🚫 مبلغ عنها</option>
        </select>
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)} 
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="all">📂 كل الأنواع</option>
          <option value="movie">🎬 أفلام</option>
          <option value="series">📺 مسلسلات</option>
          <option value="song">🎵 أغاني</option>
          <option value="clip">🎬 كليبات</option>
        </select>
        <button 
          onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterType('all'); }} 
          className="bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition text-sm"
        >
          <FaFilter className="inline mr-1" /> إعادة تعيين
        </button>
      </div>

      {/* ====== COMMENTS LIST ====== */}
      {filteredComments.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-800/30 rounded-xl">
          <FaComment className="text-5xl mx-auto mb-3 opacity-50" />
          <p>لا توجد تعليقات {searchTerm ? 'تطابق البحث' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {filteredComments.map(comment => (
            <div key={comment.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-purple-500/30 transition">
              {/* ====== COMMENT HEADER ====== */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img 
                    src={comment.user_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(comment.user_name || 'U') + '&background=7c3aed&color=fff&size=40'} 
                    alt={comment.user_name} 
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user_name || 'U')}&background=7c3aed&color=fff&size=40`;
                    }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm truncate">{comment.user_name || 'مستخدم'}</p>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <FaCalendarAlt size={10} /> 
                        {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ''}
                      </span>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        {getContentTypeIcon(comment.content_type)}
                        <span className="truncate max-w-[100px]">{getContentTitle(comment)}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={i < (comment.rating || 0) ? 'text-yellow-400' : 'text-gray-600'} size={12} />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* ====== ACTIONS ====== */}
                <div className="flex gap-1 flex-shrink-0">
                  {comment.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => updateCommentStatus(comment.id, 'approved')} 
                        className="p-2 bg-green-500/20 rounded-lg text-green-400 hover:bg-green-500/30 transition"
                        title="قبول"
                        disabled={saving}
                      >
                        <FaCheck size={14} />
                      </button>
                      <button 
                        onClick={() => updateCommentStatus(comment.id, 'reported')} 
                        className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 transition"
                        title="رفض"
                        disabled={saving}
                      >
                        <FaTimes size={14} />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => { setSelectedComment(comment); setShowReplyModal(true); }} 
                    className="p-2 bg-purple-500/20 rounded-lg text-purple-400 hover:bg-purple-500/30 transition"
                    title="رد"
                    disabled={saving}
                  >
                    <FaReply size={14} />
                  </button>
                  <button 
                    onClick={() => deleteComment(comment.id)} 
                    className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 transition"
                    title="حذف"
                    disabled={saving}
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>

              {/* ====== COMMENT BODY ====== */}
              <div className="mt-3 mr-12">
                <p className="text-gray-300 text-sm">{comment.comment}</p>
                
                {/* ====== REPLY ====== */}
                {comment.reply && (
                  <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border-r-2 border-purple-500">
                    <p className="text-purple-400 text-xs mb-1">📝 رد الإدارة:</p>
                    <p className="text-gray-300 text-sm">{comment.reply}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {comment.reply_date ? new Date(comment.reply_date).toLocaleDateString() : ''}
                    </p>
                  </div>
                )}
              </div>

              {/* ====== COMMENT FOOTER ====== */}
              <div className="mt-2 flex items-center gap-4 text-xs">
                <span className={`px-2 py-0.5 rounded-full ${
                  comment.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  comment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {comment.status === 'approved' ? '✅ مقبول' : 
                   comment.status === 'pending' ? '⏳ قيد المراجعة' : 
                   '🚫 مبلغ عنه'}
                </span>
                <span className="text-gray-500 flex items-center gap-1">
                  <FaHeart size={10} /> {comment.likes || 0}
                </span>
                <span className="text-gray-500 flex items-center gap-1">
                  <FaEye size={10} /> {comment.views || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====== REPLY MODAL ====== */}
      {showReplyModal && selectedComment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowReplyModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold flex items-center gap-2">
                <FaReply className="text-purple-400" /> الرد على تعليق
              </h3>
              <button onClick={() => setShowReplyModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-5">
              <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                  <FaUser className="text-purple-400" /> {selectedComment.user_name}:
                </p>
                <p className="text-white text-sm">{selectedComment.comment}</p>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < (selectedComment.rating || 0) ? 'text-yellow-400' : 'text-gray-600'} size={12} />
                  ))}
                </div>
              </div>
              <textarea 
                placeholder="اكتب ردك هنا..." 
                value={replyText} 
                onChange={(e) => setReplyText(e.target.value)} 
                rows="4" 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white resize-none text-sm focus:outline-none focus:border-purple-500"
              />
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={addReply} 
                  disabled={saving}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <FaSyncAlt className="animate-spin" /> : <FaReply />}
                  {saving ? 'جاري الإرسال...' : 'إرسال الرد'}
                </button>
                <button 
                  onClick={() => setShowReplyModal(false)} 
                  className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition text-sm"
                >
                  <FaTimes className="inline mr-1" /> إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComments;