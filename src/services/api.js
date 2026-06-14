// src/services/api.js - نسخة كاملة مع الترجمات والمسارات الصوتية
import axios from 'axios';

// استخدام عنوان IP الثابت للحاسوب الأساسي
const API_URL = 'http://192.168.11.88:5000/api';

const API = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
});

// إضافة التوكن تلقائياً للطلبات
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
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
            console.error('Error loading movies:', error);
            return [];
        }
    },
    
    getByCategory: async (category) => {
        try {
            const response = await API.get(`/movies/category/${category}`);
            return response.data;
        } catch (error) {
            console.error(`Error loading ${category} movies:`, error);
            return [];
        }
    },
    
    getById: async (id) => {
        try {
            const response = await API.get(`/movies/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error loading movie ${id}:`, error);
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
    
    incrementViews: async (id) => {
        const response = await API.post(`/movies/${id}/views`);
        return response.data;
    },
    
    search: async (query) => {
        const response = await API.get(`/movies/search?q=${encodeURIComponent(query)}`);
        return response.data;
    }
};

// ========== MOVIES SUBTITLES & AUDIO TRACKS API ==========
export const subtitlesAPI = {
    // جلب ترجمات فيلم
    getByMovie: async (movieId) => {
        try {
            const response = await API.get(`/movies/${movieId}/subtitles`);
            return response.data;
        } catch (error) {
            console.error('Error loading subtitles:', error);
            return [];
        }
    },
    
    // إضافة ترجمة لفيلم
    addToMovie: async (movieId, subtitleData) => {
        const response = await API.post(`/movies/${movieId}/subtitles`, subtitleData);
        return response.data;
    },
    
    // حذف ترجمة من فيلم
    deleteFromMovie: async (movieId, subtitleId) => {
        const response = await API.delete(`/movies/${movieId}/subtitles/${subtitleId}`);
        return response.data;
    }
};

export const audioTracksAPI = {
    // جلب المسارات الصوتية لفيلم
    getByMovie: async (movieId) => {
        try {
            const response = await API.get(`/movies/${movieId}/audio-tracks`);
            return response.data;
        } catch (error) {
            console.error('Error loading audio tracks:', error);
            return [];
        }
    },
    
    // إضافة مسار صوتي لفيلم
    addToMovie: async (movieId, trackData) => {
        const response = await API.post(`/movies/${movieId}/audio-tracks`, trackData);
        return response.data;
    },
    
    // حذف مسار صوتي من فيلم
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
            console.error('Error loading series:', error);
            return [];
        }
    },
    
    getByCategory: async (category) => {
        try {
            const response = await API.get(`/series/category/${category}`);
            return response.data;
        } catch (error) {
            console.error(`Error loading ${category} series:`, error);
            return [];
        }
    },
    
    getById: async (id) => {
        try {
            const response = await API.get(`/series/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error loading series ${id}:`, error);
            return null;
        }
    },
    
    getEpisodes: async (seriesId, seasonNum = null) => {
        const url = seasonNum ? `/series/${seriesId}/episodes?season=${seasonNum}` : `/series/${seriesId}/episodes`;
        const response = await API.get(url);
        return response.data;
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

// ========== EPISODE SUBTITLES & AUDIO TRACKS API ==========
export const episodeSubtitlesAPI = {
    // جلب ترجمات حلقة
    getByEpisode: async (episodeId) => {
        try {
            const response = await API.get(`/episodes/${episodeId}/subtitles`);
            return response.data;
        } catch (error) {
            console.error('Error loading episode subtitles:', error);
            return [];
        }
    }
};

export const episodeAudioTracksAPI = {
    // جلب المسارات الصوتية لحلقة
    getByEpisode: async (episodeId) => {
        try {
            const response = await API.get(`/episodes/${episodeId}/audio-tracks`);
            return response.data;
        } catch (error) {
            console.error('Error loading episode audio tracks:', error);
            return [];
        }
    }
};

// ========== CHANNELS API ==========
export const channelsAPI = {
    getAll: async () => {
        try {
            const response = await API.get('/channels');
            return response.data;
        } catch (error) {
            console.error('Error loading channels:', error);
            return [];
        }
    },
    
    getByCategory: async (category) => {
        const response = await API.get(`/channels/category/${category}`);
        return response.data;
    },
    
    getById: async (id) => {
        const response = await API.get(`/channels/${id}`);
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
            console.error('Error loading artists:', error);
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
            console.error('Error loading songs:', error);
            return [];
        }
    },
    
    getByArtist: async (artistId) => {
        const response = await API.get(`/songs/artist/${artistId}`);
        return response.data;
    },
    
    getById: async (id) => {
        const response = await API.get(`/songs/${id}`);
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
            console.error('Error loading clips:', error);
            return [];
        }
    },
    
    getByArtist: async (artistId) => {
        const response = await API.get(`/clips/artist/${artistId}`);
        return response.data;
    },
    
    addClip: async (clipData) => {
        const response = await API.post('/clips', clipData);
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
            console.error('Error loading reciters:', error);
            return [];
        }
    },
    
    getById: async (id) => {
        const response = await API.get(`/reciters/${id}`);
        return response.data;
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
            console.error('Error loading stats:', error);
            return { totalMovies: 0, totalSeries: 0, totalUsers: 0, totalChannels: 0 };
        }
    },
    
    getUsers: async () => {
        try {
            const response = await API.get('/admin/users');
            return response.data;
        } catch (error) {
            console.error('Error loading users:', error);
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
            console.error('Error searching:', error);
            return { movies: [], series: [], songs: [] };
        }
    }
};

// ========== تصدير جميع الـ APIs ==========
export default {
    authAPI,
    moviesAPI,
    subtitlesAPI,
    audioTracksAPI,
    seriesAPI,
    episodeSubtitlesAPI,
    episodeAudioTracksAPI,
    channelsAPI,
    artistsAPI,
    songsAPI,
    clipsAPI,
    recitersAPI,
    adminAPI,
    searchAPI
};