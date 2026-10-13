// src/services/NotificationService.js - خدمة الإشعارات (بدون تغيير جوهري)
class NotificationService {
  constructor() {
    this.permission = false;
    this.notifications = [];
    this.listeners = [];
    this.checkPermission();
    this.loadNotifications();
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

  addLocalNotification(notification) {
    const newNotification = {
      id: Date.now(),
      ...notification,
      read: false,
      time: new Date().toISOString()
    };
    this.notifications.unshift(newNotification);
    this.notifyListeners();
    localStorage.setItem('cinewave_notifications', JSON.stringify(this.notifications));
    return newNotification;
  }

  loadNotifications() {
    const saved = localStorage.getItem('cinewave_notifications');
    if (saved) {
      this.notifications = JSON.parse(saved);
      this.notifyListeners();
    }
  }

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

  notifySubscription(subscription) {
    const notification = {
      title: `✨ اشتراك ${subscription.plan}`,
      body: 'تم تفعيل اشتراكك بنجاح! استمتع بالمحتوى الحصري.',
      type: 'subscription',
      data: { plan: subscription.plan }
    };
    this.sendNotification(notification.title, { body: notification.body });
    this.addLocalNotification(notification);
  }

  notifySubscriptionExpiry(daysLeft) {
    const notification = {
      title: '⚠️ اشتراكك على وشك الانتهاء',
      body: `تبقى ${daysLeft} أيام على انتهاء اشتراكك. جدد الآن!`,
      type: 'expiry',
      data: { daysLeft }
    };
    this.sendNotification(notification.title, { body: notification.body });
    this.addLocalNotification(notification);
  }

  addListener(callback) { this.listeners.push(callback); }
  removeListener(callback) { this.listeners = this.listeners.filter(cb => cb !== callback); }
  notifyListeners() { this.listeners.forEach(callback => callback(this.notifications)); }

  markAsRead(id) {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem('cinewave_notifications', JSON.stringify(this.notifications));
    this.notifyListeners();
  }

  markAllAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem('cinewave_notifications', JSON.stringify(this.notifications));
    this.notifyListeners();
  }

  deleteNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    localStorage.setItem('cinewave_notifications', JSON.stringify(this.notifications));
    this.notifyListeners();
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }
}

export default new NotificationService();