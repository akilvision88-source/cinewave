class NotificationService {
  constructor() {
    this.permission = false;
    this.notifications = [];
    this.listeners = [];
    this.checkPermission();
  }

  checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission === 'granted';
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('هذا المتصفح لا يدعم الإشعارات');
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission === 'granted';
    return this.permission;
  }

  sendNotification(title, options = {}) {
    if (!this.permission) return;
    
    const notification = new Notification(title, {
      icon: '/logo192.png',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      ...options
    });

    notification.onclick = (event) => {
      event.preventDefault();
      if (options.onClick) options.onClick();
      window.focus();
    };

    return notification;
  }

  // إضافة إشعار إلى القائمة المحلية
  addLocalNotification(notification) {
    const newNotification = {
      id: Date.now(),
      ...notification,
      read: false,
      time: new Date().toISOString()
    };
    this.notifications.unshift(newNotification);
    this.notifyListeners();
    
    // حفظ في localStorage
    localStorage.setItem('cinewave_notifications', JSON.stringify(this.notifications));
    
    return newNotification;
  }

  // تحميل الإشعارات المحفوظة
  loadNotifications() {
    const saved = localStorage.getItem('cinewave_notifications');
    if (saved) {
      this.notifications = JSON.parse(saved);
      this.notifyListeners();
    }
  }

  // إشعار محتوى جديد
  notifyNewContent(content) {
    const notification = {
      title: `🎬 جديد: ${content.title}`,
      body: `${content.type === 'movie' ? 'فيلم' : 'مسلسل'} جديد أضيف للمنصة!`,
      type: 'new_content',
      data: { contentId: content.id, type: content.type }
    };
    
    this.sendNotification(notification.title, { body: notification.body });
    this.addLocalNotification(notification);
  }

  // إشعار حلقة جديدة
  notifyNewEpisode(series, episode) {
    const notification = {
      title: `📺 حلقة جديدة: ${series.title}`,
      body: `الحلقة ${episode.number} - ${episode.title} متاحة الآن!`,
      type: 'new_episode',
      data: { seriesId: series.id, episodeId: episode.id }
    };
    
    this.sendNotification(notification.title, { body: notification.body });
    this.addLocalNotification(notification);
  }

  // إشعار عرض خاص
  notifySpecialOffer(offer) {
    const notification = {
      title: `🎉 عرض خاص: ${offer.title}`,
      body: `${offer.description} - خصم ${offer.discount}%`,
      type: 'offer',
      data: { offerId: offer.id }
    };
    
    this.sendNotification(notification.title, { body: notification.body });
    this.addLocalNotification(notification);
  }

  // إشعار اشتراك
  notifySubscription(subscription) {
    const notification = {
      title: `✨ اشتراك ${subscription.plan}`,
      body: `تم تفعيل اشتراكك بنجاح! استمتع بالمحتوى الحصري.`,
      type: 'subscription',
      data: { plan: subscription.plan }
    };
    
    this.sendNotification(notification.title, { body: notification.body });
    this.addLocalNotification(notification);
  }

  // إشعار انتهاء اشتراك
  notifySubscriptionExpiry(daysLeft) {
    const notification = {
      title: `⚠️ اشتراكك على وشك الانتهاء`,
      body: `تبقى ${daysLeft} أيام على انتهاء اشتراكك. جدد الآن!`,
      type: 'expiry',
      data: { daysLeft }
    };
    
    this.sendNotification(notification.title, { body: notification.body });
    this.addLocalNotification(notification);
  }

  // تسجيل مستمع للإشعارات
  addListener(callback) {
    this.listeners.push(callback);
  }

  // إزالة مستمع
  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  // إعلام المستمعين
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.notifications));
  }

  // تحديد إشعار كمقروء
  markAsRead(id) {
    this.notifications = this.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    localStorage.setItem('cinewave_notifications', JSON.stringify(this.notifications));
    this.notifyListeners();
  }

  // تحديد الكل كمقروء
  markAllAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem('cinewave_notifications', JSON.stringify(this.notifications));
    this.notifyListeners();
  }

  // حذف إشعار
  deleteNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    localStorage.setItem('cinewave_notifications', JSON.stringify(this.notifications));
    this.notifyListeners();
  }

  // الحصول على عدد الإشعارات غير المقروءة
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }
}

export default new NotificationService();