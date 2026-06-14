import React, { useState, useEffect } from 'react';
import { FaStar, FaTrash, FaCheck, FaTimes, FaEye, FaReply, FaFilter, FaSearch } from 'react-icons/fa';

const AdminComments = () => {
  const [comments, setComments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedComment, setSelectedComment] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = () => {
    // تحميل التعليقات من localStorage
    const savedComments = localStorage.getItem('cinewave_comments');
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    } else {
      // بيانات تجريبية
      const demoComments = [
        { id: 1, contentId: 1, contentType: 'movie', userName: 'أحمد محمد', userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg', comment: 'فيلم رائع جداً! استمتعت بمشاهدته', rating: 5, status: 'approved', createdAt: '2024-01-15', likes: 12 },
        { id: 2, contentId: 2, userName: 'سارة علي', userAvatar: 'https://randomuser.me/api/portraits/women/1.jpg', comment: 'قصة جميلة ولكن الإيقاع بطيء نوعاً ما', rating: 4, status: 'pending', createdAt: '2024-01-14', likes: 5 },
        { id: 3, contentId: 101, contentType: 'song', userName: 'محمد خالد', userAvatar: 'https://randomuser.me/api/portraits/men/2.jpg', comment: 'أغنية رائعة! صوت رائع', rating: 5, status: 'approved', createdAt: '2024-01-13', likes: 8 },
      ];
      setComments(demoComments);
      localStorage.setItem('cinewave_comments', JSON.stringify(demoComments));
    }
    setLoading(false);
  };

  const updateCommentStatus = (commentId, status) => {
    const updatedComments = comments.map(c => 
      c.id === commentId ? { ...c, status } : c
    );
    setComments(updatedComments);
    localStorage.setItem('cinewave_comments', JSON.stringify(updatedComments));
  };

  const deleteComment = (commentId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
      const updatedComments = comments.filter(c => c.id !== commentId);
      setComments(updatedComments);
      localStorage.setItem('cinewave_comments', JSON.stringify(updatedComments));
    }
  };

  const addReply = (commentId) => {
    if (!replyText.trim()) return;
    
    const updatedComments = comments.map(c => 
      c.id === commentId ? { ...c, reply: replyText, replyDate: new Date().toISOString() } : c
    );
    setComments(updatedComments);
    localStorage.setItem('cinewave_comments', JSON.stringify(updatedComments));
    setShowReplyModal(false);
    setReplyText('');
  };

  const filteredComments = comments.filter(c => {
    const matchSearch = c.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       c.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchType = filterType === 'all' || c.contentType === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const stats = {
    total: comments.length,
    approved: comments.filter(c => c.status === 'approved').length,
    pending: comments.filter(c => c.status === 'pending').length,
    reported: comments.filter(c => c.status === 'reported').length,
    avgRating: (comments.reduce((sum, c) => sum + (c.rating || 0), 0) / comments.length).toFixed(1)
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">💬 إدارة التعليقات والتقييمات</h2>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm">إجمالي التعليقات</p>
          <p className="text-white text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm">مقبولة</p>
          <p className="text-green-400 text-2xl font-bold">{stats.approved}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm">قيد المراجعة</p>
          <p className="text-yellow-400 text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm">مبلغ عنها</p>
          <p className="text-red-400 text-2xl font-bold">{stats.reported}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm">متوسط التقييم</p>
          <p className="text-purple-400 text-2xl font-bold">{stats.avgRating} ★</p>
        </div>
      </div>

      {/* الفلترة والبحث */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="بحث عن تعليق..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-3 text-white text-sm" 
          />
        </div>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)} 
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
        >
          <option value="all">كل الحالات</option>
          <option value="approved">مقبولة</option>
          <option value="pending">قيد المراجعة</option>
          <option value="reported">مبلغ عنها</option>
        </select>
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)} 
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
        >
          <option value="all">كل الأنواع</option>
          <option value="movie">أفلام</option>
          <option value="series">مسلسلات</option>
          <option value="song">أغاني</option>
        </select>
      </div>

      {/* قائمة التعليقات */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">لا توجد تعليقات</div>
        ) : (
          filteredComments.map(comment => (
            <div key={comment.id} className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img src={comment.userAvatar} alt={comment.userName} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="text-white font-semibold">{comment.userName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{comment.createdAt}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={i < (comment.rating || 0) ? 'text-yellow-400' : 'text-gray-600'} size={10} />
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {comment.status === 'pending' && (
                    <>
                      <button onClick={() => updateCommentStatus(comment.id, 'approved')} className="p-2 bg-green-500/20 rounded-lg text-green-400 hover:bg-green-500/30" title="قبول">
                        <FaCheck />
                      </button>
                      <button onClick={() => updateCommentStatus(comment.id, 'reported')} className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30" title="رفض">
                        <FaTimes />
                      </button>
                    </>
                  )}
                  <button onClick={() => { setSelectedComment(comment); setShowReplyModal(true); }} className="p-2 bg-purple-500/20 rounded-lg text-purple-400 hover:bg-purple-500/30" title="رد">
                    <FaReply />
                  </button>
                  <button onClick={() => deleteComment(comment.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30" title="حذف">
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="mt-3 mr-12">
                <p className="text-gray-300">{comment.comment}</p>
                {comment.reply && (
                  <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border-r-2 border-purple-500">
                    <p className="text-purple-400 text-xs mb-1">📝 رد الإدارة:</p>
                    <p className="text-gray-300 text-sm">{comment.reply}</p>
                    <p className="text-gray-500 text-xs mt-1">{comment.replyDate?.split('T')[0]}</p>
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs">
                <span className={`px-2 py-0.5 rounded-full ${
                  comment.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  comment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {comment.status === 'approved' ? 'مقبول' : comment.status === 'pending' ? 'قيد المراجعة' : 'مبلغ عنه'}
                </span>
                <span className="text-gray-500">❤️ {comment.likes} إعجاب</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* مودال الرد على التعليق */}
      {showReplyModal && selectedComment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowReplyModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-white text-xl font-bold">الرد على تعليق</h3>
            </div>
            <div className="p-5">
              <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-sm mb-1">تعليق {selectedComment.userName}:</p>
                <p className="text-white">{selectedComment.comment}</p>
              </div>
              <textarea 
                placeholder="اكتب ردك هنا..." 
                value={replyText} 
                onChange={(e) => setReplyText(e.target.value)} 
                rows="4" 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => addReply(selectedComment.id)} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                  إرسال الرد
                </button>
                <button onClick={() => setShowReplyModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600">
                  إلغاء
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