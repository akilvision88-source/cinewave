// ============================================================
// server.js - CineWave Backend مع TMDB Integration
// ============================================================
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');
const axios = require('axios');
const db = require('./db');
require('dotenv').config();

const execAsync = promisify(exec);
const app = express();

// ============================================================
// ✅ دالة hash فريدة (MD5 — 32 حرفاً)
// ============================================================
const getHash = (str) => crypto.createHash('md5').update(str).digest('hex');

// ============================================================
// ========== CORS ==========
// ============================================================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges', 'Content-Type'],
    maxAge: 86400
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, Accept, Origin, X-Requested-With');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');
    res.header('Access-Control-Max-Age', '86400');
    res.header('Accept-Ranges', 'bytes');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

function getLocalIp() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) return net.address;
        }
    }
    return 'localhost';
}

const toSqlValue = (value) => {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    return value;
};

// ============================================================
// ========== STATIC FILES ==========
// ============================================================
const DATA_DIR = 'F:\\inetpub\\wwwroot\\data';
const THUMB_DIR = path.join(__dirname, 'data', 'thumbnails');

if (!fs.existsSync(THUMB_DIR)) {
    fs.mkdirSync(THUMB_DIR, { recursive: true });
    console.log(`📁 تم إنشاء مجلد Thumbnails: ${THUMB_DIR}`);
}

if (!fs.existsSync(DATA_DIR)) {
    console.warn(`⚠️ تحذير: مجلد الفيديوهات غير موجود: ${DATA_DIR}`);
} else {
    console.log(`✅ مجلد الفيديوهات موجود: ${DATA_DIR}`);
}

// ============================================================
// ✅ Middleware محسّن للفيديوهات والترجمات
// ============================================================
const videoMiddleware = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Range, Content-Type, Accept, Origin, X-Requested-With');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');
    res.header('Access-Control-Max-Age', '86400');
    res.header('Accept-Ranges', 'bytes');
    res.header('Cache-Control', 'public, max-age=86400');

    const ext = path.extname(req.path).toLowerCase();
    if (ext === '.vtt') {
        res.header('Content-Type', 'text/vtt; charset=utf-8');
    } else if (ext === '.srt') {
        res.header('Content-Type', 'text/plain; charset=utf-8');
    }

    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
};

app.use('/data', videoMiddleware, express.static(DATA_DIR, {
    setHeaders: (res, filepath) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept, Origin');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');
        res.setHeader('Access-Control-Max-Age', '86400');
        res.setHeader('Accept-Ranges', 'bytes');

        const ext = path.extname(filepath).toLowerCase();
        const mimeTypes = {
            '.mp4': 'video/mp4', '.mkv': 'video/x-matroska', '.webm': 'video/webm',
            '.avi': 'video/x-msvideo', '.mov': 'video/quicktime', '.m4v': 'video/x-m4v',
            '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav',
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.webp': 'image/webp', '.gif': 'image/gif',
            '.vtt': 'text/vtt; charset=utf-8',
            '.srt': 'text/plain; charset=utf-8'
        };
        if (mimeTypes[ext]) res.setHeader('Content-Type', mimeTypes[ext]);
    }
}));

app.use('/thumbnails', videoMiddleware, express.static(THUMB_DIR));

// ============================================================
// ✅ API لجلب ملفات الترجمة
// ============================================================
app.get('/api/subtitle', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ message: 'url مطلوب' });

        let cleanPath = decodeURIComponent(url);
        cleanPath = cleanPath.replace(/^https?:\/\/[^/]+/i, '');
        cleanPath = cleanPath.replace(/^\/+/, '');
        cleanPath = cleanPath.replace(/^data\//i, '');
        cleanPath = cleanPath.replace(/\/+/g, '/');

        const filePath = path.join(DATA_DIR, cleanPath);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'ملف الترجمة غير موجود' });
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        res.send(content);
    } catch (error) {
        console.error('❌ خطأ في جلب الترجمة:', error);
        res.status(500).json({ message: error.message });
    }
});

// ============================================================
// ========== THUMBNAILS API ==========
// ============================================================
app.get('/api/thumbnail', async (req, res) => {
    try {
        const { video } = req.query;
        if (!video) return res.status(400).json({ message: 'video parameter required' });

        const cleanPath = video.replace(/^\/+/, '').replace(/^data\//, '');
        const videoPath = path.join(DATA_DIR, cleanPath);

        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({ message: 'Video not found' });
        }

        const videoHash = getHash(video);
        const thumbName = `${videoHash}.jpg`;
        const thumbPath = path.join(THUMB_DIR, thumbName);

        if (fs.existsSync(thumbPath)) {
            res.setHeader('Cache-Control', 'public, max-age=604800');
            return res.sendFile(thumbPath);
        }

        let midTime = 30;
        try {
            const { stdout } = await execAsync(
                `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`,
                { timeout: 15000 }
            );
            const duration = parseFloat(stdout.trim());
            if (duration && isFinite(duration) && duration > 0) midTime = Math.floor(duration / 2);
        } catch (e) {}

        try {
            await execAsync(
                `ffmpeg -ss ${midTime} -i "${videoPath}" -vframes 1 -vf "scale=640:-1" -q:v 3 -y "${thumbPath}"`,
                { timeout: 30000 }
            );
        } catch (e) {}

        if (fs.existsSync(thumbPath)) {
            res.setHeader('Cache-Control', 'public, max-age=604800');
            res.sendFile(thumbPath);
        } else {
            res.status(500).json({ message: 'Failed to generate thumbnail' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/thumbnail-url', async (req, res) => {
    try {
        const { videoUrl } = req.body;

        if (!videoUrl) return res.status(400).json({ message: 'videoUrl مطلوب' });

        let cleanPath = videoUrl;
        cleanPath = cleanPath.replace(/^https?:\/\/[^/]+/i, '');
        cleanPath = cleanPath.replace(/^\/+/, '');
        cleanPath = cleanPath.replace(/^data\//i, '');
        try { cleanPath = decodeURIComponent(cleanPath); } catch (e) {}
        cleanPath = cleanPath.replace(/\/+/g, '/');

        const videoPath = path.join(DATA_DIR, cleanPath);

        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({ message: 'الفيديو غير موجود', cleanPath });
        }

        const videoDir = path.dirname(videoPath);
        const possibleThumbnails = [
            'Thumbnail.jpg', 'thumbnail.jpg', 'Thumbnail.png', 'thumbnail.png',
            'Poster.jpg', 'poster.jpg', 'Landscape.jpg', 'landscape.jpg'
        ];

        for (const thumbName of possibleThumbnails) {
            const localThumb = path.join(videoDir, thumbName);
            if (fs.existsSync(localThumb)) {
                const hash = getHash(videoUrl);
                const targetName = `local_${hash}.jpg`;
                const targetPath = path.join(THUMB_DIR, targetName);

                if (!fs.existsSync(targetPath)) {
                    fs.copyFileSync(localThumb, targetPath);
                }

                return res.json({
                    thumbnail: `/thumbnails/${targetName}`,
                    cached: true,
                    source: 'local'
                });
            }
        }

        const hash = getHash(videoUrl);
        const thumbName = `gen_${hash}.jpg`;
        const thumbPath = path.join(THUMB_DIR, thumbName);

        if (fs.existsSync(thumbPath)) {
            return res.json({
                thumbnail: `/thumbnails/${thumbName}`,
                cached: true,
                source: 'ffmpeg-cache'
            });
        }

        let midTime = 30;
        try {
            const { stdout } = await execAsync(
                `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`,
                { timeout: 10000 }
            );
            const duration = parseFloat(stdout.trim());
            if (duration && isFinite(duration) && duration > 0) midTime = Math.floor(duration / 2);
        } catch (e) {}

        try {
            const cmd = `ffmpeg -ss ${midTime} -i "${videoPath}" -vframes 1 -vf "scale=480:-1" -q:v 4 -y "${thumbPath}"`;
            await execAsync(cmd, { timeout: 30000 });
        } catch (e) {
            return res.status(500).json({ message: 'فشل توليد الصورة', error: e.message });
        }

        if (!fs.existsSync(thumbPath)) {
            return res.status(500).json({ message: 'الصورة لم تُنشأ' });
        }

        res.json({
            thumbnail: `/thumbnails/${thumbName}`,
            cached: false,
            source: 'ffmpeg'
        });

    } catch (error) {
        console.error('❌ خطأ:', error);
        res.status(500).json({ message: error.message });
    }
});

console.log(`📁 مسار ملفات البيانات: ${DATA_DIR}`);
console.log(`🎬 مجلد Thumbnails: ${THUMB_DIR}`);

// ============================================================
// ========== MIDDLEWARE ==========
// ============================================================
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'غير مصرح' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch {
        res.status(401).json({ message: 'توكن غير صالح' });
    }
};

// ============================================================
// ========== TABLES ==========
// ============================================================
const initTables = async () => {
    try {
        await db.execute(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'premium', 'user') DEFAULT 'user',
            plan ENUM('free', 'standard', 'premium') DEFAULT 'free',
            status ENUM('active', 'banned') DEFAULT 'active',
            avatar TEXT DEFAULT NULL,
            watch_history INT DEFAULT 0,
            watchlist TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS user_favorites (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            item_type ENUM('movie', 'series', 'song', 'clip', 'reciter') NOT NULL,
            item_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_favorite (user_id, item_type, item_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS user_likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            item_type ENUM('movie', 'series', 'song', 'clip', 'reciter') NOT NULL,
            item_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_like (user_id, item_type, item_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS watch_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            item_type ENUM('movie', 'series', 'clip', 'song', 'quran', 'animation') NOT NULL,
            item_id INT NOT NULL,
            progress INT DEFAULT 0,
            watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_history (user_id, item_type, item_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS subscription_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            name_ar VARCHAR(50) DEFAULT NULL,
            description TEXT DEFAULT NULL,
            description_ar TEXT DEFAULT NULL,
            price DECIMAL(10,2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'USD',
            duration ENUM('month', 'year', 'life') DEFAULT 'month',
            features JSON DEFAULT NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS user_subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            plan_id INT NOT NULL,
            status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
            start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_date DATETIME DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
        )`);

        await db.execute(`INSERT IGNORE INTO subscription_plans (name, name_ar, price, duration, features, is_active) VALUES
            ('free', 'مجاني', 0, 'life', '["مشاهدة بجودة 480p", "إعلانات", "دعم محدود"]', 1),
            ('standard', 'ستاندرد', 9.99, 'month', '["مشاهدة بجودة 1080p", "بدون إعلانات", "تحميل للمشاهدة", "دعم 24/7"]', 1),
            ('premium', 'بريميوم', 19.99, 'month', '["مشاهدة بجودة 4K", "بدون إعلانات", "تحميل غير محدود", "محتوى حصري", "دعم 24/7"]', 1)
        `);

        console.log('✅ جميع الجداول جاهزة');
    } catch (error) {
        console.error('❌ خطأ في إنشاء الجداول:', error);
    }
};

initTables();

const ensureWatchlistTable = async () => {
    try {
        const [tables] = await db.execute("SHOW TABLES LIKE 'watchlist'");
        if (tables.length === 0) {
            await db.execute(`CREATE TABLE watchlist (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                item_type ENUM('movie', 'series', 'song', 'clip', 'animation', 'quran') NOT NULL,
                item_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_watchlist (user_id, item_type, item_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
            try {
                await db.execute(`ALTER TABLE watchlist ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
            } catch (fkError) {}
            console.log('✅ تم إنشاء جدول watchlist');
        }
    } catch (error) {
        console.error('❌ خطأ:', error);
    }
};

ensureWatchlistTable();

const ensureChannelAudioUrl = async () => {
    try {
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'channels' 
            AND COLUMN_NAME = 'audio_url'
        `);

        if (columns.length === 0) {
            await db.execute(`ALTER TABLE channels ADD COLUMN audio_url TEXT DEFAULT NULL AFTER url`);
            console.log('✅ تم إضافة عمود audio_url إلى جدول channels');
        }
    } catch (error) {
        console.error('⚠️ خطأ في التأكد من عمود audio_url:', error.message);
    }
};

ensureChannelAudioUrl();

// ============================================================
// ========== TMDB API INTEGRATION ==========
// ============================================================
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';
const TMDB_DEFAULT_LANGUAGE = process.env.TMDB_LANGUAGE || 'ar';

if (!TMDB_API_KEY) {
    console.warn('⚠️ تحذير: TMDB_API_KEY غير موجود في ملف .env');
    console.warn('⚠️ ميزات TMDB لن تعمل');
} else {
    console.log(`✅ TMDB API Key loaded: ${TMDB_API_KEY.substring(0, 8)}...`);
}

const searchTMDB = async (query, type = 'multi', language = TMDB_DEFAULT_LANGUAGE) => {
    const response = await axios.get(`${TMDB_BASE_URL}/search/${type}`, {
        params: { api_key: TMDB_API_KEY, query, language, include_adult: false, page: 1 },
        timeout: 15000
    });
    return response.data;
};

const getTMDBDetails = async (tmdbId, type = 'movie', language = TMDB_DEFAULT_LANGUAGE) => {
    const response = await axios.get(`${TMDB_BASE_URL}/${type}/${tmdbId}`, {
        params: {
            api_key: TMDB_API_KEY,
            language,
            append_to_response: 'credits,videos,images,external_ids,similar,recommendations'
        },
        timeout: 15000
    });
    return response.data;
};

const buildImageUrl = (imagePath, size = 'w500') => {
    if (!imagePath) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${imagePath}`;
};

const extractDirector = (credits) => {
    if (!credits?.crew) return null;
    const directors = credits.crew.filter(c => c.job === 'Director');
    return directors.map(d => d.name).join(', ') || null;
};

const extractCast = (credits, limit = 10) => {
    if (!credits?.cast) return null;
    return credits.cast.slice(0, limit).map(c => c.name).join(', ') || null;
};

const extractGenres = (genres) => {
    if (!Array.isArray(genres)) return null;
    return genres.map(g => g.name).join(', ') || null;
};

const formatRuntime = (minutes) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins}min`;
};

const mapCountryToCategory = (countryCode, type) => {
    if (type === 'tv') {
        const seriesMap = {
            'SA': 'arabic', 'EG': 'arabic', 'MA': 'arabic', 'AE': 'arabic',
            'US': 'foreign', 'GB': 'foreign', 'FR': 'foreign', 'DE': 'foreign',
            'IN': 'indian', 'TR': 'turkish', 'KR': 'korean'
        };
        return seriesMap[countryCode] || 'foreign';
    } else {
        const movieMap = {
            'SA': 'arabwood', 'EG': 'arabwood', 'MA': 'arabwood', 'AE': 'arabwood',
            'US': 'hollywood', 'GB': 'hollywood',
            'IN': 'bollywood',
            'FR': 'european', 'DE': 'european', 'IT': 'european', 'ES': 'european',
            'JP': 'asian', 'CN': 'asian', 'KR': 'asian', 'TH': 'asian'
        };
        return movieMap[countryCode] || 'hollywood';
    }
};

// 🔍 البحث في TMDB
app.get('/api/tmdb/search', async (req, res) => {
    try {
        if (!TMDB_API_KEY) {
            return res.status(500).json({ success: false, message: 'TMDB API Key غير مُعدّ' });
        }

        const { query, type = 'multi', language = TMDB_DEFAULT_LANGUAGE } = req.query;
        
        if (!query || !query.trim()) {
            return res.status(400).json({ success: false, message: 'الرجاء إدخال كلمة البحث' });
        }

        console.log(`🔍 [TMDB] بحث: "${query}" | النوع: ${type}`);
        
        const data = await searchTMDB(query, type, language);
        
        const filteredResults = (data.results || [])
            .filter(item => {
                if (type !== 'multi') return true;
                return item.media_type === 'movie' || item.media_type === 'tv';
            })
            .slice(0, 20)
            .map(item => ({
                id: item.id,
                media_type: item.media_type || type,
                title: item.title || item.name,
                original_title: item.original_title || item.original_name,
                overview: item.overview,
                poster_path: item.poster_path,
                backdrop_path: item.backdrop_path,
                release_date: item.release_date || item.first_air_date,
                vote_average: item.vote_average,
                vote_count: item.vote_count,
                popularity: item.popularity,
                original_language: item.original_language,
                poster_url: buildImageUrl(item.poster_path, 'w500'),
                backdrop_url: buildImageUrl(item.backdrop_path, 'w780'),
                year: (item.release_date || item.first_air_date || '').split('-')[0]
            }));

        console.log(`✅ [TMDB] تم العثور على ${filteredResults.length} نتيجة`);
        
        res.json({
            success: true,
            total_results: filteredResults.length,
            results: filteredResults
        });
    } catch (error) {
        console.error('❌ [TMDB] خطأ:', error.message);
        res.status(500).json({ 
            success: false, 
            message: error.response?.data?.status_message || error.message 
        });
    }
});

// 📥 جلب تفاصيل كاملة
app.get('/api/tmdb/details/:type/:id', async (req, res) => {
    try {
        if (!TMDB_API_KEY) {
            return res.status(500).json({ success: false, message: 'TMDB API Key غير مُعدّ' });
        }

        const { type, id } = req.params;
        const { language = TMDB_DEFAULT_LANGUAGE } = req.query;

        if (!['movie', 'tv'].includes(type)) {
            return res.status(400).json({ success: false, message: 'النوع يجب أن يكون movie أو tv' });
        }

        console.log(`📥 [TMDB] جلب تفاصيل ${type} #${id}`);

        const [dataAr, dataEn] = await Promise.all([
            getTMDBDetails(id, type, 'ar').catch(() => null),
            getTMDBDetails(id, type, 'en-US').catch(() => null)
        ]);

        const data = dataAr || dataEn;
        if (!data) {
            return res.status(404).json({ success: false, message: 'لم يتم العثور على المحتوى' });
        }

        const isMovie = type === 'movie';
        const productionCountry = data.production_countries?.[0]?.iso_3166_1 
            || data.origin_country?.[0] 
            || 'US';

        const category = mapCountryToCategory(productionCountry, type);

        const runtime = isMovie 
            ? formatRuntime(data.runtime)
            : (data.number_of_seasons ? `${data.number_of_seasons} مواسم` : null);

        const releaseYear = (data.release_date || data.first_air_date || '').split('-')[0];

        const result = {
            tmdb_id: data.id,
            media_type: type,
            title: dataAr?.title || dataAr?.name || dataEn?.title || dataEn?.name,
            title_ar: dataAr?.title || dataAr?.name || null,
            title_en: dataEn?.title || dataEn?.name || null,
            original_title: data.original_title || data.original_name,
            description: dataAr?.overview || dataEn?.overview || null,
            description_ar: dataAr?.overview || null,
            description_en: dataEn?.overview || null,
            poster: buildImageUrl(data.poster_path, 'w500'),
            backdrop: buildImageUrl(data.backdrop_path, 'w1280'),
            rating: data.vote_average ? parseFloat(data.vote_average.toFixed(1)) : 0,
            vote_count: data.vote_count || 0,
            year: releaseYear ? parseInt(releaseYear) : null,
            duration: runtime,
            runtime: data.runtime || null,
            genre: extractGenres(data.genres),
            genres_list: data.genres || [],
            category: category,
            director: extractDirector(data.credits),
            cast: extractCast(data.credits, 10),
            country: productionCountry,
            country_name: data.production_countries?.[0]?.name || null,
            original_language: data.original_language,
            seasons: data.number_of_seasons || null,
            episodes_count: data.number_of_episodes || null,
            seasons_data: (data.seasons || []).map(s => ({
                season_number: s.season_number,
                name: s.name,
                episode_count: s.episode_count,
                poster: buildImageUrl(s.poster_path, 'w500'),
                air_date: s.air_date
            })),
            imdb_id: data.external_ids?.imdb_id || data.imdb_id || null,
            tmdb_url: `https://www.themoviedb.org/${type}/${data.id}`,
            tagline: data.tagline || null,
            status: data.status,
            popularity: data.popularity
        };

        console.log(`✅ [TMDB] تم جلب: ${result.title} (${result.year})`);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('❌ [TMDB] خطأ:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 📺 جلب موسم وحلقاته
app.get('/api/tmdb/season/:seriesId/:seasonNumber', async (req, res) => {
    try {
        if (!TMDB_API_KEY) return res.status(500).json({ success: false, message: 'TMDB API Key غير مُعدّ' });

        const { seriesId, seasonNumber } = req.params;
        const { language = TMDB_DEFAULT_LANGUAGE } = req.query;

        const response = await axios.get(`${TMDB_BASE_URL}/tv/${seriesId}/season/${seasonNumber}`, {
            params: { api_key: TMDB_API_KEY, language },
            timeout: 15000
        });

        const episodes = (response.data.episodes || []).map(ep => ({
            episode_number: ep.episode_number,
            season_number: ep.season_number,
            title: ep.name,
            title_ar: ep.name,
            description: ep.overview,
            air_date: ep.air_date,
            vote_average: ep.vote_average,
            runtime: ep.runtime,
            duration: formatRuntime(ep.runtime),
            still_path: ep.still_path,
            thumbnail: buildImageUrl(ep.still_path, 'w500')
        }));

        res.json({
            success: true,
            season_number: parseInt(seasonNumber),
            name: response.data.name,
            overview: response.data.overview,
            poster: buildImageUrl(response.data.poster_path, 'w500'),
            episodes
        });
    } catch (error) {
        console.error('❌ [TMDB] خطأ:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 🎬 جميع المواسم مع حلقاتها
app.get('/api/tmdb/seasons/:seriesId', async (req, res) => {
    try {
        if (!TMDB_API_KEY) return res.status(500).json({ success: false, message: 'TMDB API Key غير مُعدّ' });

        const { seriesId } = req.params;
        const { language = TMDB_DEFAULT_LANGUAGE } = req.query;

        const seriesDetails = await getTMDBDetails(seriesId, 'tv', language);
        
        const seasons = await Promise.all(
            (seriesDetails.seasons || [])
                .filter(s => s.season_number > 0)
                .map(async (s) => {
                    let episodes = [];
                    try {
                        const epRes = await axios.get(`${TMDB_BASE_URL}/tv/${seriesId}/season/${s.season_number}`, {
                            params: { api_key: TMDB_API_KEY, language },
                            timeout: 15000
                        });
                        
                        episodes = (epRes.data.episodes || []).map(ep => ({
                            episode_number: ep.episode_number,
                            season_number: ep.season_number,
                            title: ep.name,
                            description: ep.overview,
                            air_date: ep.air_date,
                            vote_average: ep.vote_average,
                            runtime: ep.runtime,
                            duration: formatRuntime(ep.runtime),
                            thumbnail: buildImageUrl(ep.still_path, 'w500')
                        }));
                    } catch (err) {}

                    return {
                        season_number: s.season_number,
                        name: s.name,
                        overview: s.overview,
                        poster: buildImageUrl(s.poster_path, 'w500'),
                        air_date: s.air_date,
                        episode_count: s.episode_count,
                        episodes
                    };
                })
        );

        res.json({
            success: true,
            series_title: seriesDetails.name,
            total_seasons: seriesDetails.number_of_seasons,
            total_episodes: seriesDetails.number_of_episodes,
            seasons
        });
    } catch (error) {
        console.error('❌ [TMDB] خطأ:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 🔥 الأكثر شعبية
app.get('/api/tmdb/popular/:type', async (req, res) => {
    try {
        if (!TMDB_API_KEY) return res.status(500).json({ success: false, message: 'TMDB API Key غير مُعدّ' });

        const { type = 'movie' } = req.params;
        const { language = TMDB_DEFAULT_LANGUAGE, page = 1 } = req.query;

        if (!['movie', 'tv'].includes(type)) {
            return res.status(400).json({ success: false, message: 'النوع يجب أن يكون movie أو tv' });
        }

        const response = await axios.get(`${TMDB_BASE_URL}/${type}/popular`, {
            params: { api_key: TMDB_API_KEY, language, page },
            timeout: 15000
        });

        const results = (response.data.results || []).map(item => ({
            id: item.id,
            media_type: type,
            title: item.title || item.name,
            overview: item.overview,
            poster_url: buildImageUrl(item.poster_path, 'w500'),
            backdrop_url: buildImageUrl(item.backdrop_path, 'w780'),
            release_date: item.release_date || item.first_air_date,
            vote_average: item.vote_average,
            original_language: item.original_language,
            year: (item.release_date || item.first_air_date || '').split('-')[0]
        }));

        res.json({
            success: true,
            page: response.data.page,
            total_pages: response.data.total_pages,
            results
        });
    } catch (error) {
        console.error('❌ [TMDB] خطأ:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

console.log('✅ TMDB API Routes registered');

// ============================================================
// ========== AUTH ==========
// ============================================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "user")',
            [toSqlValue(name), toSqlValue(email), hashedPassword]
        );
        const token = jwt.sign({ id: result.insertId, role: 'user' }, process.env.JWT_SECRET);
        res.json({ token, user: { id: result.insertId, name, email, role: 'user' } });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [toSqlValue(email)]);
        if (users.length === 0) return res.status(401).json({ message: 'بيانات غير صحيحة' });
        const user = users[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(401).json({ message: 'بيانات غير صحيحة' });
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ============================================================
// ========== MOVIES ==========
// ============================================================
app.get('/api/movies', async (req, res) => {
    try {
        const [movies] = await db.execute(`SELECT m.*, 
            (SELECT COUNT(*) FROM movie_subtitles WHERE movie_id = m.id) as subtitles_count,
            (SELECT COUNT(*) FROM movie_audio_tracks WHERE movie_id = m.id) as audio_tracks_count
            FROM movies m ORDER BY m.created_at DESC`);
        res.json(movies);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/movies/category/:category', async (req, res) => {
    try {
        const [movies] = await db.execute(`SELECT m.*, 
            (SELECT COUNT(*) FROM movie_subtitles WHERE movie_id = m.id) as subtitles_count,
            (SELECT COUNT(*) FROM movie_audio_tracks WHERE movie_id = m.id) as audio_tracks_count
            FROM movies m WHERE m.category = ? ORDER BY m.created_at DESC`, [toSqlValue(req.params.category)]);
        res.json(movies);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/movies/:id', async (req, res) => {
    try {
        const [movies] = await db.execute('SELECT * FROM movies WHERE id = ?', [req.params.id]);
        if (movies.length === 0) return res.status(404).json({ message: 'غير موجود' });
        const [subtitles] = await db.execute('SELECT * FROM movie_subtitles WHERE movie_id = ?', [req.params.id]);
        const [audioTracks] = await db.execute('SELECT * FROM movie_audio_tracks WHERE movie_id = ?', [req.params.id]);
        res.json({ ...movies[0], subtitles, audioTracks });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/movies', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { title, title_ar, title_fr, description, description_ar, description_fr,
            poster, backdrop, video_url, rating, year, duration, genre, country, director, cast, category, subtitles, audioTracks } = req.body;
        const [result] = await db.execute(`INSERT INTO movies (title, title_ar, title_fr, description, description_ar, description_fr,
            poster, backdrop, video_url, rating, year, duration, genre, country, director, cast, category, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [toSqlValue(title), toSqlValue(title_ar), toSqlValue(title_fr),
            toSqlValue(description), toSqlValue(description_ar), toSqlValue(description_fr),
            toSqlValue(poster), toSqlValue(backdrop), toSqlValue(video_url),
            rating || 0, year || new Date().getFullYear(), toSqlValue(duration), toSqlValue(genre),
            toSqlValue(country), toSqlValue(director), toSqlValue(cast), toSqlValue(category)]);
        const movieId = result.insertId;
        if (subtitles && subtitles.length > 0) {
            for (const sub of subtitles) {
                await db.execute('INSERT INTO movie_subtitles (movie_id, language, label, url, is_default) VALUES (?, ?, ?, ?, ?)',
                    [movieId, toSqlValue(sub.language), toSqlValue(sub.label), toSqlValue(sub.url), sub.is_default || 0]);
            }
        }
        if (audioTracks && audioTracks.length > 0) {
            for (const track of audioTracks) {
                await db.execute('INSERT INTO movie_audio_tracks (movie_id, language, label, url, is_default) VALUES (?, ?, ?, ?, ?)',
                    [movieId, toSqlValue(track.language), toSqlValue(track.label), toSqlValue(track.url), track.is_default || 0]);
            }
        }
        res.json({ id: movieId, message: 'تمت الإضافة بنجاح' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.put('/api/movies/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { title, title_ar, title_fr, description, description_ar, description_fr,
            poster, backdrop, video_url, rating, year, duration, genre, country, director, cast, category, subtitles, audioTracks } = req.body;
        await db.execute(`UPDATE movies SET title=?, title_ar=?, title_fr=?, description=?, description_ar=?, description_fr=?,
            poster=?, backdrop=?, video_url=?, rating=?, year=?, duration=?, genre=?, country=?, director=?, cast=?, category=? WHERE id=?`,
            [toSqlValue(title), toSqlValue(title_ar), toSqlValue(title_fr),
            toSqlValue(description), toSqlValue(description_ar), toSqlValue(description_fr),
            toSqlValue(poster), toSqlValue(backdrop), toSqlValue(video_url),
            rating || 0, year || new Date().getFullYear(), toSqlValue(duration), toSqlValue(genre),
            toSqlValue(country), toSqlValue(director), toSqlValue(cast), toSqlValue(category), req.params.id]);
        await db.execute('DELETE FROM movie_subtitles WHERE movie_id = ?', [req.params.id]);
        if (subtitles && subtitles.length > 0) {
            for (const sub of subtitles) {
                await db.execute('INSERT INTO movie_subtitles (movie_id, language, label, url, is_default) VALUES (?, ?, ?, ?, ?)',
                    [req.params.id, toSqlValue(sub.language), toSqlValue(sub.label), toSqlValue(sub.url), sub.is_default || 0]);
            }
        }
        await db.execute('DELETE FROM movie_audio_tracks WHERE movie_id = ?', [req.params.id]);
        if (audioTracks && audioTracks.length > 0) {
            for (const track of audioTracks) {
                await db.execute('INSERT INTO movie_audio_tracks (movie_id, language, label, url, is_default) VALUES (?, ?, ?, ?, ?)',
                    [req.params.id, toSqlValue(track.language), toSqlValue(track.label), toSqlValue(track.url), track.is_default || 0]);
            }
        }
        res.json({ message: 'تم التحديث بنجاح' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete('/api/movies/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        await db.execute('DELETE FROM movie_subtitles WHERE movie_id = ?', [req.params.id]);
        await db.execute('DELETE FROM movie_audio_tracks WHERE movie_id = ?', [req.params.id]);
        await db.execute('DELETE FROM movies WHERE id = ?', [req.params.id]);
        res.json({ message: 'تم الحذف' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ========== SUBTITLES & AUDIO ==========
app.get('/api/movies/:movieId/subtitles', async (req, res) => {
    try {
        const [subtitles] = await db.execute('SELECT * FROM movie_subtitles WHERE movie_id = ?', [req.params.movieId]);
        res.json(subtitles);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/movies/:movieId/subtitles', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { language, label, url, is_default } = req.body;
        const [result] = await db.execute('INSERT INTO movie_subtitles (movie_id, language, label, url, is_default) VALUES (?, ?, ?, ?, ?)',
            [req.params.movieId, toSqlValue(language), toSqlValue(label), toSqlValue(url), is_default || 0]);
        res.json({ id: result.insertId, message: 'تم إضافة الترجمة' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/movies/:movieId/audio-tracks', async (req, res) => {
    try {
        const [tracks] = await db.execute('SELECT * FROM movie_audio_tracks WHERE movie_id = ?', [req.params.movieId]);
        res.json(tracks);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/movies/:movieId/audio-tracks', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { language, label, url, is_default } = req.body;
        const [result] = await db.execute('INSERT INTO movie_audio_tracks (movie_id, language, label, url, is_default) VALUES (?, ?, ?, ?, ?)',
            [req.params.movieId, toSqlValue(language), toSqlValue(label), toSqlValue(url), is_default || 0]);
        res.json({ id: result.insertId, message: 'تم إضافة المسار الصوتي' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ============================================================
// ========== SERIES ==========
// ============================================================
app.get('/api/series', async (req, res) => {
    try {
        const [series] = await db.execute('SELECT * FROM series ORDER BY created_at DESC');
        res.json(series);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/series/category/:category', async (req, res) => {
    try {
        const [series] = await db.execute('SELECT * FROM series WHERE category = ? ORDER BY created_at DESC', [toSqlValue(req.params.category)]);
        res.json(series);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/series/:id', async (req, res) => {
    try {
        const [series] = await db.execute('SELECT * FROM series WHERE id = ?', [req.params.id]);
        if (series.length === 0) return res.status(404).json({ message: 'غير موجود' });
        const [episodes] = await db.execute('SELECT * FROM episodes WHERE series_id = ? ORDER BY season_num, episode_num', [req.params.id]);
        res.json({ ...series[0], episodes });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/series', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { title, title_ar, title_fr, description, description_ar, description_fr,
            poster, backdrop, rating, year, genre, country, director, cast, category, seasons, episodes } = req.body;
        if (!title && !title_ar && !title_fr) return res.status(400).json({ message: 'العنوان مطلوب' });
        const [result] = await db.execute(`INSERT INTO series (title, title_ar, title_fr, description, description_ar, description_fr,
            poster, backdrop, rating, year, genre, country, director, cast, category, seasons, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [toSqlValue(title), toSqlValue(title_ar), toSqlValue(title_fr),
            toSqlValue(description), toSqlValue(description_ar), toSqlValue(description_fr),
            toSqlValue(poster), toSqlValue(backdrop), rating || 0, year || new Date().getFullYear(),
            toSqlValue(genre), toSqlValue(country), toSqlValue(director), toSqlValue(cast),
            toSqlValue(category), seasons || 1]);
        const seriesId = result.insertId;
        if (episodes && Array.isArray(episodes) && episodes.length > 0) {
            for (const ep of episodes) {
                await db.execute(`INSERT INTO episodes (series_id, season_num, episode_num, title, title_ar, title_fr,
                    description, video_url, duration, thumbnail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [seriesId, ep.season_num || 1, ep.episode_num, toSqlValue(ep.title), toSqlValue(ep.title_ar),
                    toSqlValue(ep.title_fr), toSqlValue(ep.description), toSqlValue(ep.video_url),
                    toSqlValue(ep.duration), toSqlValue(ep.thumbnail)]);
            }
        }
        res.json({ id: seriesId, message: 'تمت الإضافة بنجاح' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.put('/api/series/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { title, title_ar, title_fr, description, description_ar, description_fr,
            poster, backdrop, rating, year, genre, country, director, cast, category, seasons, episodes } = req.body;
        await db.execute(`UPDATE series SET title=?, title_ar=?, title_fr=?, description=?, description_ar=?, description_fr=?,
            poster=?, backdrop=?, rating=?, year=?, genre=?, country=?, director=?, cast=?, category=?, seasons=? WHERE id=?`,
            [toSqlValue(title), toSqlValue(title_ar), toSqlValue(title_fr),
            toSqlValue(description), toSqlValue(description_ar), toSqlValue(description_fr),
            toSqlValue(poster), toSqlValue(backdrop), rating || 0, year || new Date().getFullYear(),
            toSqlValue(genre), toSqlValue(country), toSqlValue(director), toSqlValue(cast),
            toSqlValue(category), seasons || 1, req.params.id]);
        if (episodes && Array.isArray(episodes)) {
            const [existingEpisodes] = await db.execute('SELECT id, episode_num FROM episodes WHERE series_id = ?', [req.params.id]);
            const existingEpisodeNums = existingEpisodes.map(ep => ep.episode_num);
            const newEpisodeNums = episodes.map(ep => parseInt(ep.episode_num));
            for (const existing of existingEpisodes) {
                if (!newEpisodeNums.includes(existing.episode_num)) {
                    await db.execute('DELETE FROM episodes WHERE id = ?', [existing.id]);
                }
            }
            for (const ep of episodes) {
                const [exists] = await db.execute('SELECT id FROM episodes WHERE series_id = ? AND episode_num = ?',
                    [req.params.id, parseInt(ep.episode_num)]);
                if (exists.length > 0) {
                    await db.execute(`UPDATE episodes SET season_num=?, title=?, title_ar=?, title_fr=?,
                        description=?, video_url=?, duration=?, thumbnail=? WHERE id=?`,
                        [ep.season_num || 1, toSqlValue(ep.title), toSqlValue(ep.title_ar), toSqlValue(ep.title_fr),
                        toSqlValue(ep.description), toSqlValue(ep.video_url), toSqlValue(ep.duration),
                        toSqlValue(ep.thumbnail), exists[0].id]);
                } else {
                    await db.execute(`INSERT INTO episodes (series_id, season_num, episode_num, title, title_ar, title_fr,
                        description, video_url, duration, thumbnail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                        [req.params.id, ep.season_num || 1, parseInt(ep.episode_num), toSqlValue(ep.title),
                        toSqlValue(ep.title_ar), toSqlValue(ep.title_fr), toSqlValue(ep.description),
                        toSqlValue(ep.video_url), toSqlValue(ep.duration), toSqlValue(ep.thumbnail)]);
                }
            }
        }
        res.json({ message: 'تم التحديث بنجاح' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/series/:seriesId/episodes', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { season_num, episode_num, title, title_ar, title_fr, description, video_url, duration, thumbnail } = req.body;
        const [result] = await db.execute(`INSERT INTO episodes (series_id, season_num, episode_num, title, title_ar, title_fr,
            description, video_url, duration, thumbnail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [req.params.seriesId, season_num || 1, episode_num, toSqlValue(title), toSqlValue(title_ar),
            toSqlValue(title_fr), toSqlValue(description), toSqlValue(video_url),
            toSqlValue(duration), toSqlValue(thumbnail)]);
        res.json({ id: result.insertId, message: 'تمت إضافة الحلقة' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete('/api/series/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        await db.execute('DELETE FROM episodes WHERE series_id = ?', [req.params.id]);
        await db.execute('DELETE FROM series WHERE id = ?', [req.params.id]);
        res.json({ message: 'تم الحذف' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete('/api/series/:seriesId/episodes/:episodeId', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        await db.execute('DELETE FROM episodes WHERE id = ? AND series_id = ?', [req.params.episodeId, req.params.seriesId]);
        res.json({ message: 'تم حذف الحلقة' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ============================================================
// ========== CHANNELS ==========
// ============================================================
app.get('/api/channels', async (req, res) => {
    try {
        const [channels] = await db.execute('SELECT * FROM channels WHERE is_active = 1 ORDER BY id');
        res.json(channels);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/channels', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { name, name_ar, logo, url, audio_url, category } = req.body;
        const [result] = await db.execute(
            'INSERT INTO channels (name, name_ar, logo, url, audio_url, category) VALUES (?, ?, ?, ?, ?, ?)',
            [toSqlValue(name), toSqlValue(name_ar), toSqlValue(logo), toSqlValue(url), toSqlValue(audio_url), toSqlValue(category)]
        );
        res.json({ id: result.insertId, message: 'تمت الإضافة' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.put('/api/channels/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { name, name_ar, logo, url, audio_url, category } = req.body;
        await db.execute(
            'UPDATE channels SET name=?, name_ar=?, logo=?, url=?, audio_url=?, category=? WHERE id=?',
            [toSqlValue(name), toSqlValue(name_ar), toSqlValue(logo), toSqlValue(url), toSqlValue(audio_url), toSqlValue(category), req.params.id]
        );
        res.json({ message: 'تم التحديث' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete('/api/channels/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        await db.execute('DELETE FROM channels WHERE id = ?', [req.params.id]);
        res.json({ message: 'تم الحذف' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ============================================================
// ========== ARTISTS ==========
// ============================================================
app.get('/api/artists', async (req, res) => {
    try {
        const [artists] = await db.execute('SELECT * FROM artists ORDER BY created_at DESC');
        res.json(artists);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/artists/:id', async (req, res) => {
    try {
        const [artists] = await db.execute('SELECT * FROM artists WHERE id = ?', [req.params.id]);
        if (artists.length === 0) return res.status(404).json({ message: 'غير موجود' });
        res.json(artists[0]);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/artists', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { name, name_en, image, genre, country, bio } = req.body;
        const [result] = await db.execute(`INSERT INTO artists (name, name_en, image, country, genre, bio, songs_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
            [toSqlValue(name), toSqlValue(name_en), toSqlValue(image), toSqlValue(country), toSqlValue(genre), toSqlValue(bio)]);
        res.json({ id: result.insertId, message: 'تمت الإضافة' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.put('/api/artists/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { name, name_en, image, genre, country, bio } = req.body;
        await db.execute('UPDATE artists SET name=?, name_en=?, image=?, country=?, genre=?, bio=? WHERE id=?',
            [toSqlValue(name), toSqlValue(name_en), toSqlValue(image), toSqlValue(country), toSqlValue(genre), toSqlValue(bio), req.params.id]);
        res.json({ message: 'تم التحديث' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete('/api/artists/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        await db.execute('DELETE FROM clips WHERE artist_id = ?', [req.params.id]);
        await db.execute('DELETE FROM artists WHERE id = ?', [req.params.id]);
        res.json({ message: 'تم الحذف' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ============================================================
// ========== CLIPS ==========
// ============================================================
app.get('/api/clips', async (req, res) => {
    try {
        const [clips] = await db.execute(`SELECT c.*, a.name as artist_name, a.image as artist_image 
            FROM clips c LEFT JOIN artists a ON c.artist_id = a.id ORDER BY c.created_at DESC`);
        res.json(clips);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/clips/artist/:artistId', async (req, res) => {
    try {
        const [clips] = await db.execute('SELECT * FROM clips WHERE artist_id = ? ORDER BY created_at DESC', [req.params.artistId]);
        res.json(clips);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/clips/:id', async (req, res) => {
    try {
        const [clips] = await db.execute('SELECT * FROM clips WHERE id = ?', [req.params.id]);
        if (clips.length === 0) return res.status(404).json({ message: 'غير موجود' });
        res.json(clips[0]);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/clips', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { artist_id, title, title_en, video_url, thumbnail, duration, year, views, likes } = req.body;
        const [result] = await db.execute(`INSERT INTO clips (artist_id, title, title_en, video_url, thumbnail, duration, year, views, likes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [artist_id, toSqlValue(title), toSqlValue(title_en), toSqlValue(video_url), toSqlValue(thumbnail),
            toSqlValue(duration), year || new Date().getFullYear(), views || 0, likes || 0]);
        await db.execute('UPDATE artists SET songs_count = (SELECT COUNT(*) FROM clips WHERE artist_id = ?) WHERE id = ?', [artist_id, artist_id]);
        res.json({ id: result.insertId, message: 'تمت الإضافة' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.put('/api/clips/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { title, title_en, video_url, thumbnail, duration, year, views, likes } = req.body;
        await db.execute(`UPDATE clips SET title=?, title_en=?, video_url=?, thumbnail=?, duration=?, year=?, views=?, likes=? WHERE id=?`,
            [toSqlValue(title), toSqlValue(title_en), toSqlValue(video_url), toSqlValue(thumbnail),
            toSqlValue(duration), year || new Date().getFullYear(), views || 0, likes || 0, req.params.id]);
        res.json({ message: 'تم التحديث' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete('/api/clips/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const [clip] = await db.execute('SELECT artist_id FROM clips WHERE id = ?', [req.params.id]);
        await db.execute('DELETE FROM clips WHERE id = ?', [req.params.id]);
        if (clip.length > 0) {
            await db.execute('UPDATE artists SET songs_count = (SELECT COUNT(*) FROM clips WHERE artist_id = ?) WHERE id = ?',
                [clip[0].artist_id, clip[0].artist_id]);
        }
        res.json({ message: 'تم الحذف' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/clips/favorites', verifyToken, async (req, res) => {
    try {
        const [favorites] = await db.execute(`SELECT c.*, a.name as artist_name, a.image as artist_image 
            FROM user_favorites uf JOIN clips c ON uf.item_id = c.id JOIN artists a ON c.artist_id = a.id
            WHERE uf.user_id = ? AND uf.item_type = 'clip' ORDER BY uf.created_at DESC`, [req.userId]);
        res.json(favorites);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/clips/:clipId/favorite', verifyToken, async (req, res) => {
    try {
        const clipId = req.params.clipId;
        const [existing] = await db.execute('SELECT id FROM user_favorites WHERE user_id = ? AND item_type = "clip" AND item_id = ?',
            [req.userId, clipId]);
        if (existing.length > 0) {
            await db.execute('DELETE FROM user_favorites WHERE user_id = ? AND item_type = "clip" AND item_id = ?', [req.userId, clipId]);
        } else {
            await db.execute('INSERT INTO user_favorites (user_id, item_type, item_id) VALUES (?, "clip", ?)', [req.userId, clipId]);
        }
        const [favorites] = await db.execute('SELECT item_id FROM user_favorites WHERE user_id = ? AND item_type = "clip"', [req.userId]);
        res.json({ favorites: favorites.map(f => f.item_id) });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/clips/:clipId/like', verifyToken, async (req, res) => {
    try {
        const clipId = req.params.clipId;
        const [existing] = await db.execute('SELECT id FROM user_likes WHERE user_id = ? AND item_type = "clip" AND item_id = ?',
            [req.userId, clipId]);
        if (existing.length > 0) {
            await db.execute('DELETE FROM user_likes WHERE user_id = ? AND item_type = "clip" AND item_id = ?', [req.userId, clipId]);
            await db.execute('UPDATE clips SET likes = likes - 1 WHERE id = ?', [clipId]);
        } else {
            await db.execute('INSERT INTO user_likes (user_id, item_type, item_id) VALUES (?, "clip", ?)', [req.userId, clipId]);
            await db.execute('UPDATE clips SET likes = likes + 1 WHERE id = ?', [clipId]);
        }
        const [clip] = await db.execute('SELECT likes FROM clips WHERE id = ?', [clipId]);
        res.json({ totalLikes: clip[0]?.likes || 0 });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ============================================================
// ========== SONGS ==========
// ============================================================
app.get('/api/songs', async (req, res) => {
    try {
        const [songs] = await db.execute('SELECT * FROM songs ORDER BY created_at DESC');
        res.json(songs);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/songs/artist/:artistId', async (req, res) => {
    try {
        const [songs] = await db.execute('SELECT * FROM songs WHERE artist_id = ? ORDER BY created_at DESC', [req.params.artistId]);
        res.json(songs);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/songs/:id', async (req, res) => {
    try {
        const [songs] = await db.execute('SELECT * FROM songs WHERE id = ?', [req.params.id]);
        if (songs.length === 0) return res.status(404).json({ message: 'غير موجود' });
        res.json(songs[0]);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/songs', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { artist_id, title, title_ar, title_en, audio_url, cover_image, duration, year, genre, lyrics } = req.body;
        const [result] = await db.execute(`INSERT INTO songs (artist_id, title, title_ar, title_en, audio_url, cover_image,
            duration, year, genre, lyrics, plays, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
            [artist_id, toSqlValue(title), toSqlValue(title_ar), toSqlValue(title_en),
            toSqlValue(audio_url), toSqlValue(cover_image), toSqlValue(duration),
            year || new Date().getFullYear(), toSqlValue(genre), toSqlValue(lyrics)]);
        await db.execute('UPDATE artists SET songs_count = (SELECT COUNT(*) FROM songs WHERE artist_id = ?) WHERE id = ?', [artist_id, artist_id]);
        res.json({ id: result.insertId, message: 'تمت الإضافة' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.put('/api/songs/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { title, title_ar, title_en, audio_url, cover_image, duration, year, genre, lyrics } = req.body;
        await db.execute(`UPDATE songs SET title=?, title_ar=?, title_en=?, audio_url=?, cover_image=?, duration=?, year=?, genre=?, lyrics=? WHERE id=?`,
            [toSqlValue(title), toSqlValue(title_ar), toSqlValue(title_en), toSqlValue(audio_url),
            toSqlValue(cover_image), toSqlValue(duration), year || new Date().getFullYear(),
            toSqlValue(genre), toSqlValue(lyrics), req.params.id]);
        res.json({ message: 'تم التحديث' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete('/api/songs/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const [song] = await db.execute('SELECT artist_id FROM songs WHERE id = ?', [req.params.id]);
        await db.execute('DELETE FROM songs WHERE id = ?', [req.params.id]);
        if (song.length > 0) {
            await db.execute('UPDATE artists SET songs_count = (SELECT COUNT(*) FROM songs WHERE artist_id = ?) WHERE id = ?',
                [song[0].artist_id, song[0].artist_id]);
        }
        res.json({ message: 'تم الحذف' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ============================================================
// ========== RECITERS ==========
// ============================================================
app.get('/api/reciters', async (req, res) => {
    try {
        const [reciters] = await db.execute('SELECT * FROM reciters ORDER BY name');
        res.json(reciters);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/reciters/:id', async (req, res) => {
    try {
        const [reciters] = await db.execute('SELECT * FROM reciters WHERE id = ?', [req.params.id]);
        if (reciters.length === 0) return res.status(404).json({ message: 'غير موجود' });
        const [surahs] = await db.execute('SELECT * FROM surahs WHERE reciter_id = ? ORDER BY number', [req.params.id]);
        res.json({ ...reciters[0], surahs });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/reciters', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { name, name_en, image, country, style } = req.body;
        const [result] = await db.execute(`INSERT INTO reciters (name, name_en, image, country, style, surahs_count)
            VALUES (?, ?, ?, ?, ?, 0)`,
            [toSqlValue(name), toSqlValue(name_en), toSqlValue(image), toSqlValue(country), toSqlValue(style)]);
        res.json({ id: result.insertId, message: 'تمت الإضافة' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/reciters/:reciterId/surahs', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { number, name, name_en, audio_url, duration, verses } = req.body;
        const [result] = await db.execute(`INSERT INTO surahs (reciter_id, number, name, name_en, audio_url, duration, verses, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [req.params.reciterId, number, toSqlValue(name), toSqlValue(name_en),
            toSqlValue(audio_url), toSqlValue(duration), verses || 0]);
        await db.execute('UPDATE reciters SET surahs_count = (SELECT COUNT(*) FROM surahs WHERE reciter_id = ?) WHERE id = ?',
            [req.params.reciterId, req.params.reciterId]);
        res.json({ id: result.insertId, message: 'تمت الإضافة' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete('/api/reciters/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        await db.execute('DELETE FROM surahs WHERE reciter_id = ?', [req.params.id]);
        await db.execute('DELETE FROM reciters WHERE id = ?', [req.params.id]);
        res.json({ message: 'تم الحذف' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ============================================================
// ========== WATCHLIST ==========
// ============================================================
app.get('/api/watchlist', verifyToken, async (req, res) => {
    try {
        const [items] = await db.execute(`SELECT 
            w.id, w.user_id, w.item_type, w.item_id, w.created_at as added_at,
            COALESCE(m.title, s.title, so.title, c.title, m2.title, su.name) as title,
            COALESCE(m.title_ar, s.title_ar, so.title_ar, c.title_ar, m2.title_ar, su.name) as title_ar,
            COALESCE(m.poster, s.poster, so.cover_image, c.thumbnail, m2.poster, r.image) as poster,
            COALESCE(m.rating, s.rating, NULL) as rating,
            COALESCE(m.year, s.year, so.year, c.year, m2.year, su.number) as year,
            COALESCE(m.genre, s.genre, so.genre, NULL, m2.genre, NULL) as genre
            FROM watchlist w
            LEFT JOIN movies m ON w.item_type = 'movie' AND w.item_id = m.id
            LEFT JOIN series s ON w.item_type = 'series' AND w.item_id = s.id
            LEFT JOIN songs so ON w.item_type = 'song' AND w.item_id = so.id
            LEFT JOIN clips c ON w.item_type = 'clip' AND w.item_id = c.id
            LEFT JOIN movies m2 ON w.item_type = 'animation' AND w.item_id = m2.id
            LEFT JOIN surahs su ON w.item_type = 'quran' AND w.item_id = su.id
            LEFT JOIN reciters r ON su.reciter_id = r.id
            WHERE w.user_id = ? ORDER BY w.created_at DESC`, [req.userId]);
        res.json(items);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/watchlist', verifyToken, async (req, res) => {
    try {
        const { itemId, itemType } = req.body;
        if (!itemId || !itemType) return res.status(400).json({ message: 'معرف العنصر ونوعه مطلوبان' });
        const validTypes = ['movie', 'series', 'song', 'clip', 'animation', 'quran'];
        if (!validTypes.includes(itemType)) return res.status(400).json({ message: 'نوع غير صالح' });
        const [existing] = await db.execute('SELECT id FROM watchlist WHERE user_id = ? AND item_type = ? AND item_id = ?',
            [req.userId, itemType, itemId]);
        if (existing.length > 0) return res.status(400).json({ message: 'موجود بالفعل' });
        const [result] = await db.execute('INSERT INTO watchlist (user_id, item_type, item_id, created_at) VALUES (?, ?, ?, NOW())',
            [req.userId, itemType, itemId]);
        res.json({ id: result.insertId, added: true });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete('/api/watchlist/:itemType/:itemId', verifyToken, async (req, res) => {
    try {
        const { itemType, itemId } = req.params;
        const result = await db.execute('DELETE FROM watchlist WHERE user_id = ? AND item_type = ? AND item_id = ?',
            [req.userId, itemType, itemId]);
        if (result[0].affectedRows === 0) return res.status(404).json({ message: 'غير موجود' });
        res.json({ removed: true });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/watchlist/toggle', verifyToken, async (req, res) => {
    try {
        const { itemId, itemType } = req.body;
        if (!itemId || !itemType) return res.status(400).json({ message: 'مطلوب' });
        const [existing] = await db.execute('SELECT id FROM watchlist WHERE user_id = ? AND item_type = ? AND item_id = ?',
            [req.userId, itemType, itemId]);
        if (existing.length > 0) {
            await db.execute('DELETE FROM watchlist WHERE user_id = ? AND item_type = ? AND item_id = ?',
                [req.userId, itemType, itemId]);
            return res.json({ added: false });
        } else {
            await db.execute('INSERT INTO watchlist (user_id, item_type, item_id, created_at) VALUES (?, ?, ?, NOW())',
                [req.userId, itemType, itemId]);
            return res.json({ added: true });
        }
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/watchlist/:itemType/:itemId', verifyToken, async (req, res) => {
    try {
        const { itemType, itemId } = req.params;
        const [existing] = await db.execute('SELECT id FROM watchlist WHERE user_id = ? AND item_type = ? AND item_id = ?',
            [req.userId, itemType, itemId]);
        res.json({ exists: existing.length > 0 });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/watchlist/count', verifyToken, async (req, res) => {
    try {
        const [result] = await db.execute('SELECT COUNT(*) as count FROM watchlist WHERE user_id = ?', [req.userId]);
        res.json({ count: result[0]?.count || 0 });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete('/api/watchlist/clear', verifyToken, async (req, res) => {
    try {
        const result = await db.execute('DELETE FROM watchlist WHERE user_id = ?', [req.userId]);
        res.json({ deletedCount: result[0].affectedRows || 0 });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ============================================================
// ========== COMMENTS ==========
// ============================================================
app.get('/api/admin/comments', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const [comments] = await db.execute(`SELECT c.*, u.name as user_name, u.avatar as user_avatar FROM comments c
            LEFT JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC`);
        res.json(comments);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/comments/:contentType/:contentId', async (req, res) => {
    try {
        const { contentType, contentId } = req.params;
        const [comments] = await db.execute(`SELECT c.*, u.name as user_name, u.avatar as user_avatar FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.content_type = ? AND c.content_id = ? AND c.status = 'approved' ORDER BY c.created_at DESC`,
            [contentType, contentId]);
        res.json(comments);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/comments', verifyToken, async (req, res) => {
    try {
        const { content_type, content_id, comment, rating } = req.body;
        if (!content_type || !content_id || !comment) return res.status(400).json({ message: 'مطلوب' });
        const [result] = await db.execute(`INSERT INTO comments (user_id, content_type, content_id, comment, rating, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
            [req.userId, content_type, content_id, comment, rating || 0]);
        res.json({ id: result.insertId });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ============================================================
// ========== SUBSCRIPTIONS ==========
// ============================================================
app.get('/api/subscription/plans', verifyToken, async (req, res) => {
    try {
        const [plans] = await db.execute('SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price ASC');
        res.json(plans);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/subscription/current', verifyToken, async (req, res) => {
    try {
        const [subs] = await db.execute(`SELECT s.*, p.name as plan_name, p.name_ar as plan_name_ar FROM user_subscriptions s
            JOIN subscription_plans p ON s.plan_id = p.id WHERE s.user_id = ? AND s.status = 'active' ORDER BY s.created_at DESC LIMIT 1`,
            [req.userId]);
        res.json(subs[0] || null);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ============================================================
// ========== HISTORY ==========
// ============================================================
app.get('/api/history', verifyToken, async (req, res) => {
    try {
        const [history] = await db.execute(`SELECT h.*, 
            CASE WHEN h.item_type = 'movie' THEN (SELECT title FROM movies WHERE id = h.item_id)
                 WHEN h.item_type = 'series' THEN (SELECT title FROM series WHERE id = h.item_id)
                 WHEN h.item_type = 'clip' THEN (SELECT title FROM clips WHERE id = h.item_id)
                 WHEN h.item_type = 'song' THEN (SELECT title FROM songs WHERE id = h.item_id) END as title
            FROM watch_history h WHERE h.user_id = ? ORDER BY h.updated_at DESC LIMIT 100`, [req.userId]);
        res.json(history);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/history', verifyToken, async (req, res) => {
    try {
        const { item_type, item_id, progress } = req.body;
        const [existing] = await db.execute('SELECT id FROM watch_history WHERE user_id = ? AND item_type = ? AND item_id = ?',
            [req.userId, item_type, item_id]);
        if (existing.length > 0) {
            await db.execute('UPDATE watch_history SET progress = ?, updated_at = NOW() WHERE user_id = ? AND item_type = ? AND item_id = ?',
                [progress || 0, req.userId, item_type, item_id]);
        } else {
            await db.execute('INSERT INTO watch_history (user_id, item_type, item_id, progress, watched_at) VALUES (?, ?, ?, ?, NOW())',
                [req.userId, item_type, item_id, progress || 0]);
        }
        res.json({ message: 'تم الحفظ' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete('/api/history/clear', verifyToken, async (req, res) => {
    try {
        await db.execute('DELETE FROM watch_history WHERE user_id = ?', [req.userId]);
        res.json({ message: 'تم المسح' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ============================================================
// ========== ADMIN ==========
// ============================================================
app.get('/api/admin/users', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const [users] = await db.execute('SELECT id, name, email, role, plan, status, created_at FROM users ORDER BY id DESC');
        res.json(users);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/admin/users', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { name, email, password, role, plan, status } = req.body;
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [toSqlValue(email)]);
        if (existing.length > 0) return res.status(400).json({ message: 'البريد موجود' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute('INSERT INTO users (name, email, password, role, plan, status) VALUES (?, ?, ?, ?, ?, ?)',
            [toSqlValue(name), toSqlValue(email), hashedPassword, toSqlValue(role) || 'user',
            toSqlValue(plan) || 'free', toSqlValue(status) || 'active']);
        res.json({ id: result.insertId });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.put('/api/admin/users/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { name, email, role, plan, status } = req.body;
        await db.execute('UPDATE users SET name=?, email=?, role=?, plan=?, status=? WHERE id=?',
            [toSqlValue(name), toSqlValue(email), toSqlValue(role), toSqlValue(plan), toSqlValue(status), req.params.id]);
        res.json({ message: 'تم التحديث' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete('/api/admin/users/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const [user] = await db.execute('SELECT email FROM users WHERE id = ?', [req.params.id]);
        if (user[0]?.email === 'mohcine@akiltv.com') return res.status(400).json({ message: 'لا يمكن الحذف' });
        await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'تم الحذف' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ============================================================
// ========== SEARCH ==========
// ============================================================
app.get('/api/search/all', async (req, res) => {
    try {
        const query = `%${req.query.q || ''}%`;
        const [movies] = await db.execute('SELECT id, title, title_ar, poster, year, rating, "movie" as type FROM movies WHERE title LIKE ? OR title_ar LIKE ? LIMIT 20', [query, query]);
        const [series] = await db.execute('SELECT id, title, title_ar, poster, year, rating, "series" as type FROM series WHERE title LIKE ? OR title_ar LIKE ? LIMIT 20', [query, query]);
        const [songs] = await db.execute('SELECT s.id, s.title, s.title_ar, s.cover_image, a.name as artist_name, "song" as type FROM songs s LEFT JOIN artists a ON s.artist_id = a.id WHERE s.title LIKE ? OR s.title_ar LIKE ? LIMIT 20', [query, query]);
        res.json({ movies, series, songs });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ============================================================
// ========== START SERVER ==========
// ============================================================
const PORT = process.env.PORT || 5000;
const localIp = getLocalIp();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 CineWave Backend Server`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   ➜ Local:   http://localhost:${PORT}`);
    console.log(`   ➜ Network: http://${localIp}:${PORT}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n📁 Static Data: ${DATA_DIR}`);
    console.log(`🎬 Thumbnails:  ${THUMB_DIR}`);
    console.log(`\n✅ CORS مفعّل`);
    console.log(`✅ Range Requests مدعومة`);
    console.log(`✅ Thumbnail API: POST /api/thumbnail-url`);
    console.log(`✅ Subtitle API: GET /api/subtitle?url=...`);
    console.log(`✅ Local Thumbnail.jpg Support`);
    console.log(`✅ MD5 Hash (unique per video)`);
    console.log(`✅ Audio URL Support for Channels 🎵`);
    console.log(`✅ TMDB API Integration 🎬`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});