import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaTimes, FaFilm, FaTv, FaTag, FaCrown, FaClock } from 'react-icons/fa';
import notificationService from '../services/NotificationService';

const NotificationCenter = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // تحميل الإشعارات
    notificationService.loadNotifications();
    setNotifications(notificationService.notifications);
    setUnreadCount(notificationService.getUnreadCount());

    // الاستماع للتغييرات
    const handleUpdate = (updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(notificationService.getUnreadCount());
    };

    notificationService.addListener(handleUpdate);
    return () => notificationService.removeListener(handleUpdate);
  }, []);

  const markAsRead = (id) => {
    notificationService.markAsRead(id);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const deleteNotification = (id, e) => {
    e.stopPropagation();
    notificationService.deleteNotification(id);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'new_content': return <FaFilm className="text-purple-400" />;
      case 'new_episode': return <FaTv className="text-blue-400" />;
      case 'offer': return <FaTag className="text-green-400" />;
      case 'subscription': return <FaCrown className="text-yellow-400" />;
      case 'expiry': return <FaClock className="text-orange-400" />;
      default: return <FaBell className="text-gray-400" />;
    }
  };

  const getTypeText = (type) => {
    switch(type) {
      case 'new_content': return 'محتوى جديد';
      case 'new_episode': return 'حلقة جديدة';
      case 'offer': return 'عرض خاص';
      case 'subscription': return 'اشتراك';
      case 'expiry': return 'تنبيه';
      default: return 'إشعار';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  };

  return (
    <div className="relative">
      {/* زر الإشعارات */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative text-gray-400 hover:text-white transition p-2 rounded-lg hover:bg-gray-800"
      >
        <FaBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* قائمة الإشعارات */}
      {showDropdown && (
        <div className="absolute left-0 mt-2 w-80 md:w-96 bg-gray-900 rounded-xl shadow-2xl border border-gray-800 z-50">
          <div className="p-3 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-white font-bold">الإشعارات</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-purple-400 text-xs hover:text-purple-300"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <FaBell className="text-gray-600 text-3xl mx-auto mb-2" />
                <p className="text-gray-500 text-sm">لا توجد إشعارات جديدة</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-3 border-b border-gray-800 hover:bg-gray-800 transition cursor-pointer ${
                    !notif.read ? 'bg-purple-500/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 ${
                      !notif.read ? 'bg-purple-500/20' : ''
                    }`}>
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className={`text-sm font-semibold ${!notif.read ? 'text-white' : 'text-gray-400'}`}>
                          {notif.title}
                        </h4>
                        <button
                          onClick={(e) => deleteNotification(notif.id, e)}
                          className="text-gray-500 hover:text-red-400"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </div>
                      <p className="text-gray-400 text-xs mt-1">{notif.body}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-500 text-[10px]">{formatTime(notif.time)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          notif.type === 'offer' ? 'bg-green-500/20 text-green-400' :
                          notif.type === 'subscription' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-gray-700 text-gray-400'
                        }`}>
                          {getTypeText(notif.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-gray-800 text-center">
            <button
              onClick={() => setShowDropdown(false)}
              className="text-purple-400 text-sm hover:text-purple-300 w-full py-1"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;