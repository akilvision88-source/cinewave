// src/services/api.js
import axios from 'axios';

const API_URL = 'http://192.168.11.88:5000/api';

const API = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
});

// ========== INTERCEPTOR ==========
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// ========== AUTH API ==========
export const authAPI = {
    login: async (email, password) => {
        try {
            const response = await API.post('/auth/login', { email, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('userRole', response.data.user.role);
                localStorage.setItem('userPlan', response.data.user.plan || 'free');
                localStorage.setItem('isAuthenticated', 'true');
            }
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    register: async (name, email, password) => {
        try {
            const response = await API.post('/auth/register', { name, email, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('userRole', response.data.user.role);
                localStorage.setItem('isAuthenticated', 'true');
            }
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userPlan');
        localStorage.removeItem('isAuthenticated');
    },
    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
};

// ========== MOVIES API ==========
export const moviesAPI = {
    getAll: async () => {
        try {
            const response = await API.get('/movies');
            return response.data;
        } catch (error) {
            return [];
        }
    },
    getByCategory: async (category) => {
        try {
            const response = await API.get(`/movies/category/${category}`);
            return response.data;
        } catch (error) {
            return [];
        }
    },
    getById: async (id) => {
        try {
            const response = await API.get(`/movies/${id}`);
            return response.data;
        } catch (error) {
            return null;
        }
    },
    addMovie: async (movieData) => {
        const response = await API.post('/movies', movieData);
        return response.data;
    },
    updateMovie: async (id, movieData) => {
        const response = await API.put(`/movies/${id}`, movieData);
        return response.data;
    },
    deleteMovie: async (id) => {
        const response = await API.delete(`/movies/${id}`);
        return response.data;
    },
    search: async (query) => {
        const response = await API.get(`/movies/search?q=${encodeURIComponent(query)}`);
        return response.data;
    }
};

// ========== MOVIES SUBTITLES & AUDIO TRACKS API ==========
export const subtitlesAPI = {
    getByMovie: async (movieId) => {
        try {
            const response = await API.get(`/movies/${movieId}/subtitles`);
            return response.data;
        } catch (error) {
            return [];
        }
    },
    addToMovie: async (movieId, subtitleData) => {
        const response = await API.post(`/movies/${movieId}/subtitles`, subtitleData);
        return response.data;
    },
    deleteFromMovie: async (movieId, subtitleId) => {
        const response = await API.delete(`/movies/${movieId}/subtitles/${subtitleId}`);
        return response.data;
    }
};

export const audioTracksAPI = {
    getByMovie: async (movieId) => {
        try {
            const response = await API.get(`/movies/${movieId}/audio-tracks`);
            return response.data;
        } catch (error) {
            return [];
        }
    },
    addToMovie: async (movieId, trackData) => {
        const response = await API.post(`/movies/${movieId}/audio-tracks`, trackData);
        return response.data;
    },
    deleteFromMovie: async (movieId, trackId) => {
        const response = await API.delete(`/movies/${movieId}/audio-tracks/${trackId}`);
        return response.data;
    }
};

// ========== SERIES API ==========
export const seriesAPI = {
    getAll: async () => {
        try {
            const response = await API.get('/series');
            return response.data;
        } catch (error) {
            return [];
        }
    },
    getByCategory: async (category) => {
        try {
            const response = await API.get(`/series/category/${category}`);
            return response.data;
        } catch (error) {
            return [];
        }
    },
    getById: async (id) => {
        try {
            const response = await API.get(`/series/${id}`);
            return response.data;
        } catch (error) {
            return null;
        }
    },
    addSeries: async (seriesData) => {
        const response = await API.post('/series', seriesData);
        return response.data;
    },
    addEpisode: async (seriesId, episodeData) => {
        const response = await API.post(`/series/${seriesId}/episodes`, episodeData);
        return response.data;
    },
    updateSeries: async (id, seriesData) => {
        const response = await API.put(`/series/${id}`, seriesData);
        return response.data;
    },
    deleteSeries: async (id) => {
        const response = await API.delete(`/series/${id}`);
        return response.data;
    },
    deleteEpisode: async (seriesId, episodeId) => {
        const response = await API.delete(`/series/${seriesId}/episodes/${episodeId}`);
        return response.data;
    },
    search: async (query) => {
        const response = await API.get(`/series/search?q=${encodeURIComponent(query)}`);
        return response.data;
    }
};

// ========== CHANNELS API ==========
export const channelsAPI = {
    getAll: async () => {
        try {
            const response = await API.get('/channels');
            return response.data;
        } catch (error) {
            return [];
        }
    },
    getByCategory: async (category) => {
        const response = await API.get(`/channels/category/${category}`);
        return response.data;
    },
    addChannel: async (channelData) => {
        const response = await API.post('/channels', channelData);
        return response.data;
    },
    updateChannel: async (id, channelData) => {
        const response = await API.put(`/channels/${id}`, channelData);
        return response.data;
    },
    deleteChannel: async (id) => {
        const response = await API.delete(`/channels/${id}`);
        return response.data;
    }
};

// ========== ARTISTS API ==========
export const artistsAPI = {
    getAll: async () => {
        try {
            const response = await API.get('/artists');
            return response.data;
        } catch (error) {
            return [];
        }
    },
    getById: async (id) => {
        const response = await API.get(`/artists/${id}`);
        return response.data;
    },
    addArtist: async (artistData) => {
        const response = await API.post('/artists', artistData);
        return response.data;
    },
    updateArtist: async (id, artistData) => {
        const response = await API.put(`/artists/${id}`, artistData);
        return response.data;
    },
    deleteArtist: async (id) => {
        const response = await API.delete(`/artists/${id}`);
        return response.data;
    }
};

// ========== SONGS API ==========
export const songsAPI = {
    getAll: async () => {
        try {
            const response = await API.get('/songs');
            return response.data;
        } catch (error) {
            return [];
        }
    },
    getByArtist: async (artistId) => {
        const response = await API.get(`/songs/artist/${artistId}`);
        return response.data;
    },
    addSong: async (songData) => {
        const response = await API.post('/songs', songData);
        return response.data;
    },
    updateSong: async (id, songData) => {
        const response = await API.put(`/songs/${id}`, songData);
        return response.data;
    },
    deleteSong: async (id) => {
        const response = await API.delete(`/songs/${id}`);
        return response.data;
    },
    toggleFavorite: async (songId) => {
        const response = await API.post(`/songs/${songId}/favorite`);
        return response.data;
    },
    getFavorites: async () => {
        const response = await API.get('/songs/favorites');
        return response.data;
    }
};

// ========== CLIPS API ==========
export const clipsAPI = {
    getAll: async () => {
        try {
            const response = await API.get('/clips');
            return response.data;
        } catch (error) {
            return [];
        }
    },
    getByArtist: async (artistId) => {
        const response = await API.get(`/clips/artist/${artistId}`);
        return response.data;
    },
    getById: async (id) => {
        const response = await API.get(`/clips/${id}`);
        return response.data;
    },
    addClip: async (clipData) => {
        const response = await API.post('/clips', clipData);
        return response.data;
    },
    updateClip: async (id, clipData) => {
        const response = await API.put(`/clips/${id}`, clipData);
        return response.data;
    },
    deleteClip: async (id) => {
        const response = await API.delete(`/clips/${id}`);
        return response.data;
    },
    toggleLike: async (clipId) => {
        const response = await API.post(`/clips/${clipId}/like`);
        return response.data;
    },
    toggleFavorite: async (clipId) => {
        const response = await API.post(`/clips/${clipId}/favorite`);
        return response.data;
    },
    getFavorites: async () => {
        const response = await API.get('/clips/favorites');
        return response.data;
    }
};

// ========== RECITERS API ==========
export const recitersAPI = {
    getAll: async () => {
        try {
            const response = await API.get('/reciters');
            return response.data;
        } catch (error) {
            return [];
        }
    },
    getById: async (id) => {
        const response = await API.get(`/reciters/${id}`);
        return response.data;
    },
    getSurahs: async (reciterId) => {
        try {
            const response = await API.get(`/reciters/${reciterId}`);
            return response.data.surahs || [];
        } catch (error) {
            return [];
        }
    },
    addReciter: async (reciterData) => {
        const response = await API.post('/reciters', reciterData);
        return response.data;
    },
    updateReciter: async (id, reciterData) => {
        const response = await API.put(`/reciters/${id}`, reciterData);
        return response.data;
    },
    deleteReciter: async (id) => {
        const response = await API.delete(`/reciters/${id}`);
        return response.data;
    },
    addSurah: async (reciterId, surahData) => {
        const response = await API.post(`/reciters/${reciterId}/surahs`, surahData);
        return response.data;
    },
    updateSurah: async (reciterId, surahId, surahData) => {
        const response = await API.put(`/reciters/${reciterId}/surahs/${surahId}`, surahData);
        return response.data;
    },
    deleteSurah: async (reciterId, surahId) => {
        const response = await API.delete(`/reciters/${reciterId}/surahs/${surahId}`);
        return response.data;
    },
    toggleFavorite: async (reciterId) => {
        const response = await API.post(`/reciters/${reciterId}/favorite`);
        return response.data;
    },
    getFavorites: async () => {
        const response = await API.get('/reciters/favorites');
        return response.data;
    }
};

// ========== ADMIN API ==========
export const adminAPI = {
    getStats: async () => {
        try {
            const response = await API.get('/admin/stats');
            return response.data;
        } catch (error) {
            return { totalMovies: 0, totalSeries: 0, totalUsers: 0, totalChannels: 0 };
        }
    },
    getUsers: async () => {
        try {
            const response = await API.get('/admin/users');
            return response.data;
        } catch (error) {
            return [];
        }
    },
    updateUser: async (userId, userData) => {
        const response = await API.put(`/admin/users/${userId}`, userData);
        return response.data;
    },
    deleteUser: async (userId) => {
        const response = await API.delete(`/admin/users/${userId}`);
        return response.data;
    },
    addUser: async (userData) => {
        const response = await API.post('/admin/users', userData);
        return response.data;
    }
};

// ========== SEARCH API ==========
export const searchAPI = {
    searchAll: async (query) => {
        try {
            const response = await API.get(`/search/all?q=${encodeURIComponent(query)}`);
            return response.data;
        } catch (error) {
            return { movies: [], series: [], songs: [] };
        }
    }
};

// ========== STATISTICS API ==========
export const statisticsAPI = {
    getFullStatistics: async () => {
        const token = localStorage.getItem('token');
        const response = await API.get('/admin/statistics/full', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    },
    getViewsByPeriod: async (period = 'month') => {
        const token = localStorage.getItem('token');
        const response = await API.get(`/admin/statistics/views?period=${period}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    }
};

// ========== COMMENTS API ==========
export const commentsAPI = {
    getAll: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await API.get('/admin/comments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    updateStatus: async (commentId, status) => {
        const token = localStorage.getItem('token');
        const response = await API.put(`/admin/comments/${commentId}/status`, 
            { status },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        return response.data;
    },
    deleteComment: async (commentId) => {
        const token = localStorage.getItem('token');
        const response = await API.delete(`/admin/comments/${commentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    },
    addReply: async (commentId, reply) => {
        const token = localStorage.getItem('token');
        const response = await API.post(`/admin/comments/${commentId}/reply`,
            { reply },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        return response.data;
    }
};

// ========== SUBSCRIPTION API ==========
export const subscriptionAPI = {
    getPlans: async () => {
        const token = localStorage.getItem('token');
        const response = await API.get('/subscription/plans', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    },
    getCurrentPlan: async () => {
        const token = localStorage.getItem('token');
        const response = await API.get('/subscription/current', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    },
    subscribe: async (planId) => {
        const token = localStorage.getItem('token');
        const response = await API.post('/subscription/subscribe',
            { planId },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        return response.data;
    },
    cancelSubscription: async () => {
        const token = localStorage.getItem('token');
        const response = await API.post('/subscription/cancel', {},
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        return response.data;
    }
};

// ========== WATCHLIST API ==========
export const watchlistAPI = {
    // جلب قائمة المشاهدة
    getWatchlist: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('غير مصرح');
        }
        const response = await API.get('/watchlist', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    },

    // إضافة إلى قائمة المشاهدة
    addToWatchlist: async (itemId, itemType) => {
        const token = localStorage.getItem('token');
        const response = await API.post('/watchlist',
            { itemId, itemType },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        return response.data;
    },

    // إزالة من قائمة المشاهدة
    removeFromWatchlist: async (itemId, itemType) => {
        const token = localStorage.getItem('token');
        const response = await API.delete(`/watchlist/${itemType}/${itemId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    },

    // تبديل حالة العنصر (إضافة/إزالة)
    toggleWatchlist: async (itemId, itemType) => {
        const token = localStorage.getItem('token');
        const response = await API.post('/watchlist/toggle',
            { itemId, itemType },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        return response.data;
    },

    // التحقق من وجود عنصر في قائمة المشاهدة
    isInWatchlist: async (itemId, itemType) => {
        const token = localStorage.getItem('token');
        const response = await API.get(`/watchlist/${itemType}/${itemId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    },

    // عدد العناصر في قائمة المشاهدة
    getWatchlistCount: async () => {
        const token = localStorage.getItem('token');
        const response = await API.get('/watchlist/count', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    }
};

// ========== BACKUP API ==========
export const backupAPI = {
    getStats: async () => {
        try {
            const response = await API.get('/admin/backup/stats');
            return response.data;
        } catch (error) {
            console.error('❌ خطأ في جلب الإحصائيات:', error);
            return { totalRecords: 0, totalSize: 0 };
        }
    },
    exportAll: async () => {
        const response = await API.get('/admin/backup/export/all');
        return response.data;
    },
    exportTables: async (tables) => {
        const response = await API.post('/admin/backup/export', { tables });
        return response.data;
    },
    importData: async (data) => {
        const response = await API.post('/admin/backup/import', data);
        return response.data;
    },
    clearAll: async () => {
        const response = await API.post('/admin/backup/clear');
        return response.data;
    },
    getHistory: async () => {
        try {
            const response = await API.get('/admin/backup/history');
            return response.data;
        } catch (error) {
            return [];
        }
    },
    logBackup: async (type, tables, records) => {
        const response = await API.post('/admin/backup/log', { type, tables, records });
        return response.data;
    },
    restoreBackup: async (backupId) => {
        const response = await API.post(`/admin/backup/restore/${backupId}`);
        return response.data;
    }
};

// ============================================================
// ========== EXPORT DEFAULT ==========
// ============================================================
export default {
    authAPI,
    moviesAPI,
    subtitlesAPI,
    audioTracksAPI,
    seriesAPI,
    channelsAPI,
    artistsAPI,
    songsAPI,
    clipsAPI,
    recitersAPI,
    adminAPI,
    searchAPI,
    statisticsAPI,
    commentsAPI,
    subscriptionAPI,
    watchlistAPI,
    backupAPI
};