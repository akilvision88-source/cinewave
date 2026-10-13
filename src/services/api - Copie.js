// src/services/api.js - نسخة محلية بالكامل (بدون خادوم)
import localDB from './localDB';

// ========== Auth API (محلي) ==========
export const authAPI = {
  login: async (email, password) => {
    try {
      const users = await localDB.getAll('users');
      console.log('📋 محاولة تسجيل الدخول:', email);
      console.log('📋 المستخدمين المتاحين:', users.map(u => ({ email: u.email, role: u.role })));
      
      // البحث عن المستخدم
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        if (user.status === 'banned') {
          throw new Error('هذا الحساب محظور');
        }
        
        // حفظ الجلسة
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('userPlan', user.plan);
        
        console.log('✅ تم تسجيل الدخول بنجاح:', user.email);
        return { success: true, user };
      }
      
      // محاولة البحث بدون تمييز حالة الأحرف
      const userCaseInsensitive = users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password
      );
      
      if (userCaseInsensitive) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(userCaseInsensitive));
        localStorage.setItem('userRole', userCaseInsensitive.role);
        localStorage.setItem('userPlan', userCaseInsensitive.plan);
        
        console.log('✅ تم تسجيل الدخول (بدون تمييز حالة):', userCaseInsensitive.email);
        return { success: true, user: userCaseInsensitive };
      }
      
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      
    } catch (error) {
      console.error('❌ خطأ في تسجيل الدخول:', error);
      throw error;
    }
  },
  
  register: async (name, email, password) => {
    try {
      const users = await localDB.getAll('users');
      const existing = users.find(u => u.email === email);
      if (existing) throw new Error('البريد الإلكتروني مستخدم بالفعل');
      
      if (password.length < 6) {
        throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      }
      
      const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        role: 'user',
        plan: 'free',
        status: 'active',
        avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
        createdAt: new Date().toISOString()
      };
      
      const created = await localDB.add('users', newUser);
      console.log('✅ تم إنشاء حساب جديد:', email);
      
      return { success: true, user: created };
    } catch (error) {
      console.error('❌ خطأ في التسجيل:', error);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userPlan');
    console.log('✅ تم تسجيل الخروج');
    return { success: true };
  },
  
  getMe: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  updateProfile: async (userData) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      const updated = { ...user, ...userData };
      await localDB.update('users', user.id, updated);
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    }
    throw new Error('المستخدم غير موجود');
  }
};

// ========== Movies API ==========
export const moviesAPI = {
  getByCategory: async (category) => {
    try {
      const allMovies = await localDB.getAll('movies');
      return allMovies.filter(m => m.category === category);
    } catch (error) {
      console.error('Error loading movies:', error);
      return [];
    }
  },
  
  getAll: async () => {
    try {
      return await localDB.getAll('movies');
    } catch (error) {
      console.error('Error loading all movies:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    try {
      return await localDB.getById('movies', id);
    } catch (error) {
      console.error('Error loading movie:', error);
      return null;
    }
  },
  
  addMovie: async (movieData) => {
    return await localDB.add('movies', { ...movieData, type: 'movie' });
  },
  
  updateMovie: async (id, movieData) => {
    return await localDB.update('movies', id, movieData);
  },
  
  deleteMovie: async (id) => {
    return await localDB.remove('movies', id);
  },
  
  search: async (query) => {
    const allMovies = await localDB.getAll('movies');
    return allMovies.filter(m => 
      m.title.toLowerCase().includes(query.toLowerCase()) ||
      (m.title_ar && m.title_ar.includes(query))
    );
  }
};

// ========== Series API ==========
export const seriesAPI = {
  getByCategory: async (category) => {
    try {
      const allSeries = await localDB.getAll('series');
      return allSeries.filter(s => s.category === category);
    } catch (error) {
      console.error('Error loading series:', error);
      return [];
    }
  },
  
  getAll: async () => {
    try {
      return await localDB.getAll('series');
    } catch (error) {
      console.error('Error loading all series:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    try {
      return await localDB.getById('series', id);
    } catch (error) {
      console.error('Error loading series:', error);
      return null;
    }
  },
  
  addSeries: async (seriesData) => {
    return await localDB.add('series', { ...seriesData, type: 'series' });
  },
  
  updateSeries: async (id, seriesData) => {
    return await localDB.update('series', id, seriesData);
  },
  
  deleteSeries: async (id) => {
    return await localDB.remove('series', id);
  },
  
  search: async (query) => {
    const allSeries = await localDB.getAll('series');
    return allSeries.filter(s => 
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      (s.title_ar && s.title_ar.includes(query))
    );
  }
};

// ========== Channels API ==========
export const channelsAPI = {
  getAll: async () => {
    try {
      return await localDB.getAll('channels');
    } catch (error) {
      console.error('Error loading channels:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    return await localDB.getById('channels', id);
  },
  
  addChannel: async (channelData) => {
    return await localDB.add('channels', channelData);
  },
  
  updateChannel: async (id, channelData) => {
    return await localDB.update('channels', id, channelData);
  },
  
  deleteChannel: async (id) => {
    return await localDB.remove('channels', id);
  },
  
  getByCategory: async (category) => {
    const allChannels = await localDB.getAll('channels');
    return allChannels.filter(c => c.category === category && c.is_active);
  }
};

// ========== Artists API ==========
export const artistsAPI = {
  getAll: async () => {
    try {
      return await localDB.getAll('artists');
    } catch (error) {
      console.error('Error loading artists:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    return await localDB.getById('artists', id);
  },
  
  addArtist: async (artistData) => {
    return await localDB.add('artists', artistData);
  },
  
  updateArtist: async (id, artistData) => {
    return await localDB.update('artists', id, artistData);
  },
  
  deleteArtist: async (id) => {
    return await localDB.remove('artists', id);
  },
  
  search: async (query) => {
    const allArtists = await localDB.getAll('artists');
    return allArtists.filter(a => 
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      (a.name_ar && a.name_ar.includes(query))
    );
  }
};

// ========== Songs API ==========
export const songsAPI = {
  getAll: async () => {
    try {
      return await localDB.getAll('songs');
    } catch (error) {
      console.error('Error loading songs:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    return await localDB.getById('songs', id);
  },
  
  getByArtist: async (artistId) => {
    const allSongs = await localDB.getAll('songs');
    return allSongs.filter(s => s.artist_id === artistId);
  },
  
  addSong: async (songData) => {
    return await localDB.add('songs', songData);
  },
  
  updateSong: async (id, songData) => {
    return await localDB.update('songs', id, songData);
  },
  
  deleteSong: async (id) => {
    return await localDB.remove('songs', id);
  },
  
  toggleFavorite: async (songId) => {
    const favorites = JSON.parse(localStorage.getItem('favorite_songs') || '[]');
    let newFavorites;
    if (favorites.includes(songId)) {
      newFavorites = favorites.filter(id => id !== songId);
    } else {
      newFavorites = [...favorites, songId];
    }
    localStorage.setItem('favorite_songs', JSON.stringify(newFavorites));
    return { favorites: newFavorites };
  },
  
  getFavorites: async () => {
    const favorites = JSON.parse(localStorage.getItem('favorite_songs') || '[]');
    const allSongs = await localDB.getAll('songs');
    return allSongs.filter(song => favorites.includes(song.id));
  },
  
  incrementPlays: async (id) => {
    const song = await localDB.getById('songs', id);
    if (song) {
      const plays = (song.plays || 0) + 1;
      await localDB.update('songs', id, { ...song, plays });
      return plays;
    }
    return 0;
  }
};

// ========== Clips API ==========
export const clipsAPI = {
  getAll: async () => {
    try {
      return await localDB.getAll('clips');
    } catch (error) {
      console.error('Error loading clips:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    return await localDB.getById('clips', id);
  },
  
  getByArtist: async (artistId) => {
    const allClips = await localDB.getAll('clips');
    return allClips.filter(c => c.artist_id === artistId);
  },
  
  addClip: async (clipData) => {
    return await localDB.add('clips', clipData);
  },
  
  updateClip: async (id, clipData) => {
    return await localDB.update('clips', id, clipData);
  },
  
  deleteClip: async (id) => {
    return await localDB.remove('clips', id);
  },
  
  toggleLike: async (clipId) => {
    const likes = JSON.parse(localStorage.getItem('liked_clips') || '[]');
    let newLikes;
    if (likes.includes(clipId)) {
      newLikes = likes.filter(id => id !== clipId);
    } else {
      newLikes = [...likes, clipId];
    }
    localStorage.setItem('liked_clips', JSON.stringify(newLikes));
    return { likes: newLikes };
  },
  
  toggleFavorite: async (clipId) => {
    const favorites = JSON.parse(localStorage.getItem('favorite_clips') || '[]');
    let newFavorites;
    if (favorites.includes(clipId)) {
      newFavorites = favorites.filter(id => id !== clipId);
    } else {
      newFavorites = [...favorites, clipId];
    }
    localStorage.setItem('favorite_clips', JSON.stringify(newFavorites));
    return { favorites: newFavorites };
  },
  
  getFavorites: async () => {
    const favorites = JSON.parse(localStorage.getItem('favorite_clips') || '[]');
    const allClips = await localDB.getAll('clips');
    return allClips.filter(clip => favorites.includes(clip.id));
  },
  
  incrementViews: async (id) => {
    const clip = await localDB.getById('clips', id);
    if (clip) {
      const views = (clip.views || 0) + 1;
      await localDB.update('clips', id, { ...clip, views });
      return views;
    }
    return 0;
  }
};

// ========== Reciters API ==========
export const recitersAPI = {
  getAll: async () => {
    try {
      return await localDB.getAll('reciters');
    } catch (error) {
      console.error('Error loading reciters:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    return await localDB.getById('reciters', id);
  },
  
  addReciter: async (reciterData) => {
    return await localDB.add('reciters', reciterData);
  },
  
  updateReciter: async (id, reciterData) => {
    return await localDB.update('reciters', id, reciterData);
  },
  
  deleteReciter: async (id) => {
    return await localDB.remove('reciters', id);
  },
  
  toggleFavorite: async (reciterId) => {
    const favorites = JSON.parse(localStorage.getItem('favorite_reciters') || '[]');
    let newFavorites;
    if (favorites.includes(reciterId)) {
      newFavorites = favorites.filter(id => id !== reciterId);
    } else {
      newFavorites = [...favorites, reciterId];
    }
    localStorage.setItem('favorite_reciters', JSON.stringify(newFavorites));
    return { favorites: newFavorites };
  },
  
  getFavorites: async () => {
    const favorites = JSON.parse(localStorage.getItem('favorite_reciters') || '[]');
    const allReciters = await localDB.getAll('reciters');
    return allReciters.filter(reciter => favorites.includes(reciter.id));
  }
};

// ========== Admin API (محلي) ==========
export const adminAPI = {
  getStats: async () => {
    try {
      const movies = await localDB.getAll('movies');
      const series = await localDB.getAll('series');
      const users = await localDB.getAll('users');
      const channels = await localDB.getAll('channels');
      const songs = await localDB.getAll('songs');
      const artists = await localDB.getAll('artists');
      const clips = await localDB.getAll('clips');
      const reciters = await localDB.getAll('reciters');
      
      return {
        movies: movies.length,
        series: series.length,
        users: users.length,
        channels: channels.length,
        songs: songs.length,
        artists: artists.length,
        clips: clips.length,
        reciters: reciters.length
      };
    } catch (error) {
      console.error('Error loading stats:', error);
      return {
        movies: 0, series: 0, users: 0, channels: 0, songs: 0, artists: 0, clips: 0, reciters: 0
      };
    }
  },
  
  getUsers: async () => {
    try {
      const users = await localDB.getAll('users');
      return users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        plan: u.plan,
        createdAt: u.createdAt,
        avatar: u.avatar
      }));
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  },
  
  updateUser: async (id, data) => {
    const user = await localDB.getById('users', id);
    if (user) {
      return await localDB.update('users', id, { ...user, ...data });
    }
    throw new Error('User not found');
  },
  
  deleteUser: async (id) => {
    const user = await localDB.getById('users', id);
    if (user && user.email === 'mohcine@akiltv.com') {
      throw new Error('لا يمكن حذف المستخدم الرئيسي');
    }
    return await localDB.remove('users', id);
  },
  
  createUser: async (userData) => {
    const users = await localDB.getAll('users');
    const existing = users.find(u => u.email === userData.email);
    if (existing) throw new Error('البريد الإلكتروني مستخدم بالفعل');
    
    const newUser = {
      id: Date.now(),
      ...userData,
      role: userData.role || 'user',
      plan: userData.plan || 'free',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    return await localDB.add('users', newUser);
  },
  
  addContent: async (content) => {
    const store = content.type === 'movie' ? 'movies' : 'series';
    return await localDB.add(store, content);
  },
  
  updateContent: async (id, content) => {
    const store = content.type === 'movie' ? 'movies' : 'series';
    return await localDB.update(store, id, content);
  },
  
  deleteContent: async (id, type) => {
    const store = type === 'movie' ? 'movies' : 'series';
    return await localDB.remove(store, id);
  },
  
  addChannel: async (channelData) => {
    return await localDB.add('channels', channelData);
  },
  
  updateChannel: async (id, channelData) => {
    return await localDB.update('channels', id, channelData);
  },
  
  deleteChannel: async (id) => {
    return await localDB.remove('channels', id);
  },
  
  addArtist: async (artistData) => {
    return await localDB.add('artists', artistData);
  },
  
  updateArtist: async (id, artistData) => {
    return await localDB.update('artists', id, artistData);
  },
  
  deleteArtist: async (id) => {
    return await localDB.remove('artists', id);
  },
  
  addSong: async (songData) => {
    return await localDB.add('songs', songData);
  },
  
  updateSong: async (id, songData) => {
    return await localDB.update('songs', id, songData);
  },
  
  deleteSong: async (id) => {
    return await localDB.remove('songs', id);
  },
  
  addClip: async (clipData) => {
    return await localDB.add('clips', clipData);
  },
  
  updateClip: async (id, clipData) => {
    return await localDB.update('clips', id, clipData);
  },
  
  deleteClip: async (id) => {
    return await localDB.remove('clips', id);
  },
  
  addReciter: async (reciterData) => {
    return await localDB.add('reciters', reciterData);
  },
  
  updateReciter: async (id, reciterData) => {
    return await localDB.update('reciters', id, reciterData);
  },
  
  deleteReciter: async (id) => {
    return await localDB.remove('reciters', id);
  }
};

// ========== Search API ==========
export const searchAPI = {
  searchAll: async (query) => {
    try {
      const [movies, series, artists, songs] = await Promise.all([
        localDB.getAll('movies'),
        localDB.getAll('series'),
        localDB.getAll('artists'),
        localDB.getAll('songs')
      ]);
      
      const results = {
        movies: movies.filter(m => 
          m.title.toLowerCase().includes(query.toLowerCase()) ||
          (m.title_ar && m.title_ar.includes(query))
        ),
        series: series.filter(s => 
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          (s.title_ar && s.title_ar.includes(query))
        ),
        artists: artists.filter(a => 
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          (a.name_ar && a.name_ar.includes(query))
        ),
        songs: songs.filter(s => 
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          (s.title_ar && s.title_ar.includes(query))
        )
      };
      
      return results;
    } catch (error) {
      console.error('Search error:', error);
      return { movies: [], series: [], artists: [], songs: [] };
    }
  }
};

// ========== Watchlist API ==========
export const watchlistAPI = {
  getWatchlist: () => {
    return JSON.parse(localStorage.getItem('watchlist') || '[]');
  },
  
  addToWatchlist: (id, type) => {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    if (!watchlist.find(item => item.id === id)) {
      watchlist.push({ id, type, addedAt: new Date().toISOString() });
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
    }
    return watchlist;
  },
  
  removeFromWatchlist: (id) => {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    const newWatchlist = watchlist.filter(item => item.id !== id);
    localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
    return newWatchlist;
  },
  
  isInWatchlist: (id) => {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    return watchlist.some(item => item.id === id);
  }
};

// ========== Comments API ==========
export const commentsAPI = {
  getByContent: async (contentId) => {
    const allComments = await localDB.getAll('comments');
    return allComments.filter(c => c.content_id === contentId && c.status === 'approved');
  },
  
  addComment: async (userId, userName, contentId, comment, rating = null) => {
    const newComment = {
      id: Date.now(),
      user_id: userId,
      user_name: userName,
      content_id: contentId,
      comment,
      rating,
      likes: 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    return await localDB.add('comments', newComment);
  },
  
  likeComment: async (commentId) => {
    const comment = await localDB.getById('comments', commentId);
    if (comment) {
      const likes = (comment.likes || 0) + 1;
      return await localDB.update('comments', commentId, { ...comment, likes });
    }
    throw new Error('Comment not found');
  }
};

// ========== Sync API للمزامنة بين الأجهزة ==========
export const syncAPI = {
  onSync: (callback) => {
    localDB.onSyncChange(callback);
  },
  
  exportAllData: async () => {
    const stores = ['movies', 'series', 'channels', 'artists', 'songs', 'clips', 'reciters', 'users', 'comments', 'bookmarks'];
    const allData = {};
    for (const store of stores) {
      allData[store] = await localDB.getAll(store);
    }
    return allData;
  },
  
  importAllData: async (data) => {
    for (const [store, items] of Object.entries(data)) {
      for (const item of items) {
        const exists = await localDB.getById(store, item.id);
        if (!exists) {
          await localDB.add(store, item);
        }
      }
    }
  },
  
  clearAllData: async () => {
    await localDB.clearAllData();
  }
};

// ========== Export all ==========
export default {
  authAPI,
  moviesAPI,
  seriesAPI,
  channelsAPI,
  artistsAPI,
  songsAPI,
  clipsAPI,
  recitersAPI,
  adminAPI,
  searchAPI,
  watchlistAPI,
  commentsAPI,
  syncAPI
};