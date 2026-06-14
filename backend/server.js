const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const app = express();

// تكوين CORS للسماح لجميع الأجهزة
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// دالة للحصول على عنوان IP المحلي
function getLocalIp() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// دالة لتحويل undefined أو null أو empty string إلى SQL NULL
const toSqlValue = (value) => {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    return value;
};

// ========== MIDDLEWARE ==========
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

// ========== إنشاء الجداول إذا لم تكن موجودة ==========
const initTables = async () => {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS user_favorites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                item_type ENUM('movie', 'series', 'song', 'clip', 'reciter') NOT NULL,
                item_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_favorite (user_id, item_type, item_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        await db.execute(`
            CREATE TABLE IF NOT EXISTS user_likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                item_type ENUM('movie', 'series', 'song', 'clip', 'reciter') NOT NULL,
                item_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_like (user_id, item_type, item_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        await db.execute(`
            CREATE TABLE IF NOT EXISTS watch_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                item_type ENUM('movie', 'series', 'clip', 'song', 'quran', 'animation') NOT NULL,
                item_id INT NOT NULL,
                progress INT DEFAULT 0,
                watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_history (user_id, item_type, item_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        console.log('✅ جداول المفضلة والإعجابات وسجل المشاهدة جاهزة');
    } catch (error) {
        console.error('خطأ في إنشاء الجداول:', error);
    }
};

initTables();

// ========== AUTH API ==========
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
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== MOVIES API ==========
app.get('/api/movies', async (req, res) => {
    try {
        const [movies] = await db.execute('SELECT * FROM movies ORDER BY created_at DESC');
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/movies/category/:category', async (req, res) => {
    try {
        const [movies] = await db.execute('SELECT * FROM movies WHERE category = ? ORDER BY created_at DESC', [toSqlValue(req.params.category)]);
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/movies/:id', async (req, res) => {
    try {
        const [movies] = await db.execute('SELECT * FROM movies WHERE id = ?', [req.params.id]);
        if (movies.length === 0) return res.status(404).json({ message: 'غير موجود' });
        
        const [subtitles] = await db.execute('SELECT * FROM movie_subtitles WHERE movie_id = ?', [req.params.id]);
        const [audioTracks] = await db.execute('SELECT * FROM movie_audio_tracks WHERE movie_id = ?', [req.params.id]);
        
        res.json({ ...movies[0], subtitles, audioTracks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/movies', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { 
            title, title_ar, title_fr, description, description_ar, description_fr,
            poster, backdrop, video_url, rating, year, duration, genre, 
            country, director, cast, category, subtitles, audioTracks 
        } = req.body;
        
        const [result] = await db.execute(
            `INSERT INTO movies (
                title, title_ar, title_fr, description, description_ar, description_fr,
                poster, backdrop, video_url, rating, year, duration, genre, 
                country, director, cast, category, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                toSqlValue(title), toSqlValue(title_ar), toSqlValue(title_fr),
                toSqlValue(description), toSqlValue(description_ar), toSqlValue(description_fr),
                toSqlValue(poster), toSqlValue(backdrop), toSqlValue(video_url),
                rating || 0, year || new Date().getFullYear(),
                toSqlValue(duration), toSqlValue(genre), toSqlValue(country),
                toSqlValue(director), toSqlValue(cast), toSqlValue(category)
            ]
        );
        
        const movieId = result.insertId;
        
        if (subtitles && subtitles.length > 0) {
            for (const sub of subtitles) {
                await db.execute(
                    'INSERT INTO movie_subtitles (movie_id, language, label, url, is_default) VALUES (?, ?, ?, ?, ?)',
                    [movieId, toSqlValue(sub.language), toSqlValue(sub.label), toSqlValue(sub.url), sub.is_default || 0]
                );
            }
        }
        
        if (audioTracks && audioTracks.length > 0) {
            for (const track of audioTracks) {
                await db.execute(
                    'INSERT INTO movie_audio_tracks (movie_id, language, label, url, is_default) VALUES (?, ?, ?, ?, ?)',
                    [movieId, toSqlValue(track.language), toSqlValue(track.label), toSqlValue(track.url), track.is_default || 0]
                );
            }
        }
        
        res.json({ id: movieId, message: 'تمت الإضافة بنجاح' });
    } catch (error) {
        console.error('❌ خطأ في إضافة فيلم:', error);
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/movies/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { 
            title, title_ar, title_fr, description, description_ar, description_fr,
            poster, backdrop, video_url, rating, year, duration, genre, 
            country, director, cast, category, subtitles, audioTracks 
        } = req.body;
        
        await db.execute(
            `UPDATE movies SET 
                title=?, title_ar=?, title_fr=?, 
                description=?, description_ar=?, description_fr=?,
                poster=?, backdrop=?, video_url=?, 
                rating=?, year=?, duration=?, genre=?, 
                country=?, director=?, cast=?, category=?
             WHERE id=?`,
            [
                toSqlValue(title), toSqlValue(title_ar), toSqlValue(title_fr),
                toSqlValue(description), toSqlValue(description_ar), toSqlValue(description_fr),
                toSqlValue(poster), toSqlValue(backdrop), toSqlValue(video_url),
                rating || 0, year || new Date().getFullYear(),
                toSqlValue(duration), toSqlValue(genre), toSqlValue(country),
                toSqlValue(director), toSqlValue(cast), toSqlValue(category),
                req.params.id
            ]
        );
        
        await db.execute('DELETE FROM movie_subtitles WHERE movie_id = ?', [req.params.id]);
        if (subtitles && subtitles.length > 0) {
            for (const sub of subtitles) {
                await db.execute(
                    'INSERT INTO movie_subtitles (movie_id, language, label, url, is_default) VALUES (?, ?, ?, ?, ?)',
                    [req.params.id, toSqlValue(sub.language), toSqlValue(sub.label), toSqlValue(sub.url), sub.is_default || 0]
                );
            }
        }
        
        await db.execute('DELETE FROM movie_audio_tracks WHERE movie_id = ?', [req.params.id]);
        if (audioTracks && audioTracks.length > 0) {
            for (const track of audioTracks) {
                await db.execute(
                    'INSERT INTO movie_audio_tracks (movie_id, language, label, url, is_default) VALUES (?, ?, ?, ?, ?)',
                    [req.params.id, toSqlValue(track.language), toSqlValue(track.label), toSqlValue(track.url), track.is_default || 0]
                );
            }
        }
        
        res.json({ message: 'تم التحديث بنجاح' });
    } catch (error) {
        console.error('❌ خطأ في تحديث فيلم:', error);
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/movies/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        await db.execute('DELETE FROM movie_subtitles WHERE movie_id = ?', [req.params.id]);
        await db.execute('DELETE FROM movie_audio_tracks WHERE movie_id = ?', [req.params.id]);
        await db.execute('DELETE FROM movies WHERE id = ?', [req.params.id]);
        res.json({ message: 'تم الحذف' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== MOVIES SUBTITLES & AUDIO TRACKS API ==========
app.get('/api/movies/:movieId/subtitles', async (req, res) => {
    try {
        const [subtitles] = await db.execute('SELECT * FROM movie_subtitles WHERE movie_id = ?', [req.params.movieId]);
        res.json(subtitles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/movies/:movieId/subtitles', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { language, label, url, is_default } = req.body;
        const [result] = await db.execute(
            'INSERT INTO movie_subtitles (movie_id, language, label, url, is_default) VALUES (?, ?, ?, ?, ?)',
            [req.params.movieId, toSqlValue(language), toSqlValue(label), toSqlValue(url), is_default || 0]
        );
        res.json({ id: result.insertId, message: 'تم إضافة الترجمة' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/movies/:movieId/subtitles/:subtitleId', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        await db.execute('DELETE FROM movie_subtitles WHERE id = ? AND movie_id = ?', [req.params.subtitleId, req.params.movieId]);
        res.json({ message: 'تم حذف الترجمة' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/movies/:movieId/audio-tracks', async (req, res) => {
    try {
        const [tracks] = await db.execute('SELECT * FROM movie_audio_tracks WHERE movie_id = ?', [req.params.movieId]);
        res.json(tracks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/movies/:movieId/audio-tracks', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { language, label, url, is_default } = req.body;
        const [result] = await db.execute(
            'INSERT INTO movie_audio_tracks (movie_id, language, label, url, is_default) VALUES (?, ?, ?, ?, ?)',
            [req.params.movieId, toSqlValue(language), toSqlValue(label), toSqlValue(url), is_default || 0]
        );
        res.json({ id: result.insertId, message: 'تم إضافة المسار الصوتي' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/movies/:movieId/audio-tracks/:trackId', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        await db.execute('DELETE FROM movie_audio_tracks WHERE id = ? AND movie_id = ?', [req.params.trackId, req.params.movieId]);
        res.json({ message: 'تم حذف المسار الصوتي' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== SERIES API ==========
app.get('/api/series', async (req, res) => {
    try {
        const [series] = await db.execute('SELECT * FROM series ORDER BY created_at DESC');
        res.json(series);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/series/category/:category', async (req, res) => {
    try {
        const [series] = await db.execute('SELECT * FROM series WHERE category = ? ORDER BY created_at DESC', [toSqlValue(req.params.category)]);
        res.json(series);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/series/:id', async (req, res) => {
    try {
        const [series] = await db.execute('SELECT * FROM series WHERE id = ?', [req.params.id]);
        if (series.length === 0) return res.status(404).json({ message: 'غير موجود' });
        
        const [episodes] = await db.execute('SELECT * FROM episodes WHERE series_id = ? ORDER BY season_num, episode_num', [req.params.id]);
        res.json({ ...series[0], episodes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ✅ إضافة مسلسل جديد مع دعم الحلقات (محسّن)
app.post('/api/series', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    
    console.log('📥 استلام طلب إضافة مسلسل:');
    console.log('📋 البيانات المستلمة:', JSON.stringify(req.body, null, 2));
    
    try {
        const { 
            title, title_ar, title_fr, 
            description, description_ar, description_fr,
            poster, backdrop, rating, year, genre, 
            country, director, cast, category, seasons,
            episodes
        } = req.body;
        
        // التحقق من وجود العنوان
        if (!title && !title_ar && !title_fr) {
            return res.status(400).json({ message: 'العنوان مطلوب' });
        }
        
        // إدراج المسلسل
        const [result] = await db.execute(
            `INSERT INTO series (
                title, title_ar, title_fr, 
                description, description_ar, description_fr,
                poster, backdrop, rating, year, genre, 
                country, director, cast, category, seasons, 
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                toSqlValue(title), toSqlValue(title_ar), toSqlValue(title_fr),
                toSqlValue(description), toSqlValue(description_ar), toSqlValue(description_fr),
                toSqlValue(poster), toSqlValue(backdrop),
                rating || 0, year || new Date().getFullYear(),
                toSqlValue(genre), toSqlValue(country),
                toSqlValue(director), toSqlValue(cast), 
                toSqlValue(category), seasons || 1
            ]
        );
        
        const seriesId = result.insertId;
        console.log(`✅ تم إضافة المسلسل بالمعرف: ${seriesId}`);
        
        // ✅ إضافة الحلقات إذا وجدت
        if (episodes && Array.isArray(episodes) && episodes.length > 0) {
            console.log(`📺 جاري إضافة ${episodes.length} حلقة...`);
            
            for (const ep of episodes) {
                console.log(`   - إضافة الحلقة ${ep.episode_num}: ${ep.title}`);
                await db.execute(
                    `INSERT INTO episodes (
                        series_id, season_num, episode_num, 
                        title, title_ar, title_fr, 
                        description, video_url, duration, thumbnail, 
                        created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        seriesId, 
                        ep.season_num || 1, 
                        ep.episode_num,
                        toSqlValue(ep.title), 
                        toSqlValue(ep.title_ar), 
                        toSqlValue(ep.title_fr),
                        toSqlValue(ep.description), 
                        toSqlValue(ep.video_url),
                        toSqlValue(ep.duration), 
                        toSqlValue(ep.thumbnail)
                    ]
                );
            }
            console.log(`✅ تم إضافة ${episodes.length} حلقة بنجاح`);
        } else {
            console.log('⚠️ لا توجد حلقات مضافة لهذا المسلسل');
        }
        
        // جلب المسلسل مع الحلقات للتأكيد
        const [newSeries] = await db.execute('SELECT * FROM series WHERE id = ?', [seriesId]);
        const [newEpisodes] = await db.execute('SELECT * FROM episodes WHERE series_id = ?', [seriesId]);
        
        res.json({ 
            id: seriesId, 
            message: 'تمت إضافة المسلسل بنجاح',
            series: newSeries[0],
            episodesCount: newEpisodes.length
        });
        
    } catch (error) {
        console.error('❌ خطأ في إضافة المسلسل:', error);
        res.status(500).json({ message: error.message });
    }
});

// إضافة حلقة لمسلسل (منفصلة)
app.post('/api/series/:seriesId/episodes', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { season_num, episode_num, title, title_ar, title_fr, description, video_url, duration, thumbnail } = req.body;
        const [result] = await db.execute(
            `INSERT INTO episodes (series_id, season_num, episode_num, title, title_ar, title_fr, description, video_url, duration, thumbnail, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                req.params.seriesId, season_num || 1, episode_num,
                toSqlValue(title), toSqlValue(title_ar), toSqlValue(title_fr),
                toSqlValue(description), toSqlValue(video_url),
                toSqlValue(duration), toSqlValue(thumbnail)
            ]
        );
        console.log(`✅ تم إضافة الحلقة ${episode_num} للمسلسل ${req.params.seriesId}`);
        res.json({ id: result.insertId, message: 'تمت إضافة الحلقة' });
    } catch (error) {
        console.error('❌ خطأ في إضافة حلقة:', error);
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/series/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { title, title_ar, title_fr, description, poster, backdrop, rating, year, genre, country, director, cast, category, seasons } = req.body;
        await db.execute(
            `UPDATE series SET title=?, title_ar=?, title_fr=?, description=?, poster=?, backdrop=?, rating=?, year=?, genre=?, country=?, director=?, cast=?, category=?, seasons=?
             WHERE id=?`,
            [
                toSqlValue(title), toSqlValue(title_ar), toSqlValue(title_fr),
                toSqlValue(description), toSqlValue(poster), toSqlValue(backdrop),
                rating || 0, year || new Date().getFullYear(),
                toSqlValue(genre), toSqlValue(country),
                toSqlValue(director), toSqlValue(cast), toSqlValue(category),
                seasons || 1, req.params.id
            ]
        );
        res.json({ message: 'تم التحديث' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/series/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        await db.execute('DELETE FROM episodes WHERE series_id = ?', [req.params.id]);
        await db.execute('DELETE FROM series WHERE id = ?', [req.params.id]);
        res.json({ message: 'تم الحذف' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/series/:seriesId/episodes/:episodeId', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        await db.execute('DELETE FROM episodes WHERE id = ? AND series_id = ?', [req.params.episodeId, req.params.seriesId]);
        res.json({ message: 'تم حذف الحلقة' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== CHANNELS API ==========
app.get('/api/channels', async (req, res) => {
    try {
        const [channels] = await db.execute('SELECT * FROM channels WHERE is_active = 1 ORDER BY id');
        res.json(channels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/channels/category/:category', async (req, res) => {
    try {
        const [channels] = await db.execute('SELECT * FROM channels WHERE category = ? AND is_active = 1', [toSqlValue(req.params.category)]);
        res.json(channels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/channels', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { name, name_ar, logo, url, category } = req.body;
        const [result] = await db.execute(
            'INSERT INTO channels (name, name_ar, logo, url, category) VALUES (?, ?, ?, ?, ?)',
            [toSqlValue(name), toSqlValue(name_ar), toSqlValue(logo), toSqlValue(url), toSqlValue(category)]
        );
        res.json({ id: result.insertId, message: 'تمت إضافة القناة' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/channels/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { name, name_ar, logo, url, category } = req.body;
        await db.execute(
            'UPDATE channels SET name=?, name_ar=?, logo=?, url=?, category=? WHERE id=?',
            [toSqlValue(name), toSqlValue(name_ar), toSqlValue(logo), toSqlValue(url), toSqlValue(category), req.params.id]
        );
        res.json({ message: 'تم التحديث' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/channels/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        await db.execute('DELETE FROM channels WHERE id = ?', [req.params.id]);
        res.json({ message: 'تم الحذف' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== ARTISTS API ==========
app.get('/api/artists', async (req, res) => {
    try {
        const [artists] = await db.execute('SELECT * FROM artists ORDER BY created_at DESC');
        res.json(artists);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/artists/:id', async (req, res) => {
    try {
        const [artists] = await db.execute('SELECT * FROM artists WHERE id = ?', [req.params.id]);
        if (artists.length === 0) return res.status(404).json({ message: 'غير موجود' });
        res.json(artists[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/artists', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { name, name_en, image, genre, country, bio } = req.body;
        const [result] = await db.execute(
            `INSERT INTO artists (name, name_en, image, country, genre, bio, songs_count, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
            [toSqlValue(name), toSqlValue(name_en), toSqlValue(image), toSqlValue(country), toSqlValue(genre), toSqlValue(bio)]
        );
        res.json({ id: result.insertId, message: 'تمت إضافة الفنان' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/artists/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { name, name_en, image, genre, country, bio } = req.body;
        await db.execute(
            `UPDATE artists SET name=?, name_en=?, image=?, country=?, genre=?, bio=?
             WHERE id=?`,
            [toSqlValue(name), toSqlValue(name_en), toSqlValue(image), toSqlValue(country), toSqlValue(genre), toSqlValue(bio), req.params.id]
        );
        res.json({ message: 'تم التحديث' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/artists/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        await db.execute('DELETE FROM clips WHERE artist_id = ?', [req.params.id]);
        await db.execute('DELETE FROM artists WHERE id = ?', [req.params.id]);
        res.json({ message: 'تم الحذف' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== CLIPS API ==========
app.get('/api/clips', async (req, res) => {
    try {
        const [clips] = await db.execute(`
            SELECT c.*, a.name as artist_name, a.image as artist_image 
            FROM clips c 
            LEFT JOIN artists a ON c.artist_id = a.id 
            ORDER BY c.created_at DESC
        `);
        res.json(clips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/clips/artist/:artistId', async (req, res) => {
    try {
        const [clips] = await db.execute('SELECT * FROM clips WHERE artist_id = ? ORDER BY created_at DESC', [req.params.artistId]);
        res.json(clips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/clips/:id', async (req, res) => {
    try {
        const [clips] = await db.execute('SELECT * FROM clips WHERE id = ?', [req.params.id]);
        if (clips.length === 0) return res.status(404).json({ message: 'غير موجود' });
        res.json(clips[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/clips', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { artist_id, title, title_en, video_url, thumbnail, duration, year, views, likes } = req.body;
        const [result] = await db.execute(
            `INSERT INTO clips (artist_id, title, title_en, video_url, thumbnail, duration, year, views, likes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [artist_id, toSqlValue(title), toSqlValue(title_en), toSqlValue(video_url), toSqlValue(thumbnail), toSqlValue(duration), year || new Date().getFullYear(), views || 0, likes || 0]
        );
        await db.execute('UPDATE artists SET songs_count = (SELECT COUNT(*) FROM clips WHERE artist_id = ?) WHERE id = ?', [artist_id, artist_id]);
        res.json({ id: result.insertId, message: 'تمت إضافة الكليب' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/clips/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { title, title_en, video_url, thumbnail, duration, year, views, likes } = req.body;
        await db.execute(
            `UPDATE clips SET title=?, title_en=?, video_url=?, thumbnail=?, duration=?, year=?, views=?, likes=?
             WHERE id=?`,
            [toSqlValue(title), toSqlValue(title_en), toSqlValue(video_url), toSqlValue(thumbnail), toSqlValue(duration), year || new Date().getFullYear(), views || 0, likes || 0, req.params.id]
        );
        res.json({ message: 'تم التحديث' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/clips/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const [clip] = await db.execute('SELECT artist_id FROM clips WHERE id = ?', [req.params.id]);
        await db.execute('DELETE FROM clips WHERE id = ?', [req.params.id]);
        if (clip.length > 0) {
            await db.execute('UPDATE artists SET songs_count = (SELECT COUNT(*) FROM clips WHERE artist_id = ?) WHERE id = ?', [clip[0].artist_id, clip[0].artist_id]);
        }
        res.json({ message: 'تم الحذف' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== CLIPS FAVORITES & LIKES API ==========
app.get('/api/clips/favorites', verifyToken, async (req, res) => {
    try {
        const [favorites] = await db.execute(
            `SELECT c.*, a.name as artist_name, a.image as artist_image 
             FROM user_favorites uf
             JOIN clips c ON uf.item_id = c.id
             JOIN artists a ON c.artist_id = a.id
             WHERE uf.user_id = ? AND uf.item_type = 'clip'
             ORDER BY uf.created_at DESC`,
            [req.userId]
        );
        res.json(favorites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/clips/:clipId/favorite', verifyToken, async (req, res) => {
    try {
        const clipId = req.params.clipId;
        const [existing] = await db.execute(
            'SELECT id FROM user_favorites WHERE user_id = ? AND item_type = "clip" AND item_id = ?',
            [req.userId, clipId]
        );
        
        if (existing.length > 0) {
            await db.execute('DELETE FROM user_favorites WHERE user_id = ? AND item_type = "clip" AND item_id = ?', [req.userId, clipId]);
        } else {
            await db.execute('INSERT INTO user_favorites (user_id, item_type, item_id) VALUES (?, "clip", ?)', [req.userId, clipId]);
        }
        
        const [favorites] = await db.execute('SELECT item_id FROM user_favorites WHERE user_id = ? AND item_type = "clip"', [req.userId]);
        res.json({ favorites: favorites.map(f => f.item_id) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/clips/:clipId/like', verifyToken, async (req, res) => {
    try {
        const clipId = req.params.clipId;
        const [existing] = await db.execute(
            'SELECT id FROM user_likes WHERE user_id = ? AND item_type = "clip" AND item_id = ?',
            [req.userId, clipId]
        );
        
        if (existing.length > 0) {
            await db.execute('DELETE FROM user_likes WHERE user_id = ? AND item_type = "clip" AND item_id = ?', [req.userId, clipId]);
            await db.execute('UPDATE clips SET likes = likes - 1 WHERE id = ?', [clipId]);
        } else {
            await db.execute('INSERT INTO user_likes (user_id, item_type, item_id) VALUES (?, "clip", ?)', [req.userId, clipId]);
            await db.execute('UPDATE clips SET likes = likes + 1 WHERE id = ?', [clipId]);
        }
        
        const [likes] = await db.execute('SELECT item_id FROM user_likes WHERE user_id = ? AND item_type = "clip"', [req.userId]);
        const [clip] = await db.execute('SELECT likes FROM clips WHERE id = ?', [clipId]);
        res.json({ likes: likes.map(l => l.item_id), totalLikes: clip[0]?.likes || 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== SONGS API ==========
app.get('/api/songs', async (req, res) => {
    try {
        const [songs] = await db.execute('SELECT * FROM songs ORDER BY created_at DESC');
        res.json(songs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/songs/artist/:artistId', async (req, res) => {
    try {
        const [songs] = await db.execute('SELECT * FROM songs WHERE artist_id = ? ORDER BY created_at DESC', [req.params.artistId]);
        res.json(songs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/songs/:id', async (req, res) => {
    try {
        const [songs] = await db.execute('SELECT * FROM songs WHERE id = ?', [req.params.id]);
        if (songs.length === 0) return res.status(404).json({ message: 'غير موجود' });
        res.json(songs[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/songs', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { artist_id, title, title_ar, title_en, audio_url, cover_image, duration, year, genre, lyrics } = req.body;
        const [result] = await db.execute(
            `INSERT INTO songs (artist_id, title, title_ar, title_en, audio_url, cover_image, duration, year, genre, lyrics, plays, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
            [artist_id, toSqlValue(title), toSqlValue(title_ar), toSqlValue(title_en), toSqlValue(audio_url), toSqlValue(cover_image), toSqlValue(duration), year || new Date().getFullYear(), toSqlValue(genre), toSqlValue(lyrics)]
        );
        await db.execute('UPDATE artists SET songs_count = (SELECT COUNT(*) FROM songs WHERE artist_id = ?) WHERE id = ?', [artist_id, artist_id]);
        res.json({ id: result.insertId, message: 'تمت إضافة الأغنية' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/songs/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { title, title_ar, title_en, audio_url, cover_image, duration, year, genre, lyrics } = req.body;
        await db.execute(
            `UPDATE songs SET title=?, title_ar=?, title_en=?, audio_url=?, cover_image=?, duration=?, year=?, genre=?, lyrics=?
             WHERE id=?`,
            [toSqlValue(title), toSqlValue(title_ar), toSqlValue(title_en), toSqlValue(audio_url), toSqlValue(cover_image), toSqlValue(duration), year || new Date().getFullYear(), toSqlValue(genre), toSqlValue(lyrics), req.params.id]
        );
        res.json({ message: 'تم التحديث' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/songs/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const [song] = await db.execute('SELECT artist_id FROM songs WHERE id = ?', [req.params.id]);
        await db.execute('DELETE FROM songs WHERE id = ?', [req.params.id]);
        if (song.length > 0) {
            await db.execute('UPDATE artists SET songs_count = (SELECT COUNT(*) FROM songs WHERE artist_id = ?) WHERE id = ?', [song[0].artist_id, song[0].artist_id]);
        }
        res.json({ message: 'تم الحذف' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== RECITERS API ==========
app.get('/api/reciters', async (req, res) => {
    try {
        const [reciters] = await db.execute('SELECT * FROM reciters ORDER BY name');
        res.json(reciters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/reciters/:id', async (req, res) => {
    try {
        const [reciters] = await db.execute('SELECT * FROM reciters WHERE id = ?', [req.params.id]);
        if (reciters.length === 0) return res.status(404).json({ message: 'غير موجود' });
        const [surahs] = await db.execute('SELECT * FROM surahs WHERE reciter_id = ? ORDER BY number', [req.params.id]);
        res.json({ ...reciters[0], surahs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/reciters', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { name, name_en, image, country, style } = req.body;
        const [result] = await db.execute(
            `INSERT INTO reciters (name, name_en, image, country, style, surahs_count)
             VALUES (?, ?, ?, ?, ?, 0)`,
            [toSqlValue(name), toSqlValue(name_en), toSqlValue(image), toSqlValue(country), toSqlValue(style)]
        );
        res.json({ id: result.insertId, message: 'تمت إضافة القارئ' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/reciters/:reciterId/surahs', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { number, name, name_en, audio_url, duration, verses } = req.body;
        const [result] = await db.execute(
            `INSERT INTO surahs (reciter_id, number, name, name_en, audio_url, duration, verses, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [req.params.reciterId, number, toSqlValue(name), toSqlValue(name_en), toSqlValue(audio_url), toSqlValue(duration), verses || 0]
        );
        await db.execute('UPDATE reciters SET surahs_count = (SELECT COUNT(*) FROM surahs WHERE reciter_id = ?) WHERE id = ?', [req.params.reciterId, req.params.reciterId]);
        res.json({ id: result.insertId, message: 'تمت إضافة السورة' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/reciters/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        await db.execute('DELETE FROM surahs WHERE reciter_id = ?', [req.params.id]);
        await db.execute('DELETE FROM reciters WHERE id = ?', [req.params.id]);
        res.json({ message: 'تم الحذف' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== WATCH HISTORY API ==========
app.get('/api/history', verifyToken, async (req, res) => {
    try {
        const [history] = await db.execute(
            `SELECT h.*, 
                    CASE 
                        WHEN h.item_type = 'movie' THEN (SELECT title FROM movies WHERE id = h.item_id)
                        WHEN h.item_type = 'series' THEN (SELECT title FROM series WHERE id = h.item_id)
                        WHEN h.item_type = 'clip' THEN (SELECT title FROM clips WHERE id = h.item_id)
                        WHEN h.item_type = 'song' THEN (SELECT title FROM songs WHERE id = h.item_id)
                        ELSE NULL
                    END as title,
                    CASE 
                        WHEN h.item_type = 'movie' THEN (SELECT title_ar FROM movies WHERE id = h.item_id)
                        WHEN h.item_type = 'series' THEN (SELECT title_ar FROM series WHERE id = h.item_id)
                        ELSE NULL
                    END as title_ar,
                    CASE 
                        WHEN h.item_type = 'movie' THEN (SELECT poster FROM movies WHERE id = h.item_id)
                        WHEN h.item_type = 'series' THEN (SELECT poster FROM series WHERE id = h.item_id)
                        WHEN h.item_type = 'clip' THEN (SELECT thumbnail FROM clips WHERE id = h.item_id)
                        WHEN h.item_type = 'song' THEN (SELECT cover_image FROM songs WHERE id = h.item_id)
                        ELSE NULL
                    END as image,
                    CASE 
                        WHEN h.item_type = 'movie' THEN (SELECT year FROM movies WHERE id = h.item_id)
                        WHEN h.item_type = 'series' THEN (SELECT year FROM series WHERE id = h.item_id)
                        WHEN h.item_type = 'clip' THEN (SELECT year FROM clips WHERE id = h.item_id)
                        WHEN h.item_type = 'song' THEN (SELECT year FROM songs WHERE id = h.item_id)
                        ELSE NULL
                    END as year,
                    CASE 
                        WHEN h.item_type = 'clip' THEN (SELECT a.name FROM clips c JOIN artists a ON c.artist_id = a.id WHERE c.id = h.item_id)
                        WHEN h.item_type = 'song' THEN (SELECT a.name FROM songs s JOIN artists a ON s.artist_id = a.id WHERE s.id = h.item_id)
                        ELSE NULL
                    END as artist_name
            FROM watch_history h
            WHERE h.user_id = ?
            ORDER BY h.updated_at DESC
            LIMIT 100`,
            [req.userId]
        );
        res.json(history);
    } catch (error) {
        console.error('خطأ في جلب سجل المشاهدة:', error);
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/history', verifyToken, async (req, res) => {
    try {
        const { item_type, item_id, progress } = req.body;
        
        const [existing] = await db.execute(
            'SELECT id FROM watch_history WHERE user_id = ? AND item_type = ? AND item_id = ?',
            [req.userId, item_type, item_id]
        );
        
        if (existing.length > 0) {
            await db.execute(
                'UPDATE watch_history SET progress = ?, updated_at = NOW() WHERE user_id = ? AND item_type = ? AND item_id = ?',
                [progress || 0, req.userId, item_type, item_id]
            );
        } else {
            await db.execute(
                'INSERT INTO watch_history (user_id, item_type, item_id, progress, watched_at) VALUES (?, ?, ?, ?, NOW())',
                [req.userId, item_type, item_id, progress || 0]
            );
        }
        
        res.json({ message: 'تم حفظ سجل المشاهدة بنجاح' });
    } catch (error) {
        console.error('خطأ في حفظ سجل المشاهدة:', error);
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/history/:type/:id', verifyToken, async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM watch_history WHERE user_id = ? AND item_type = ? AND item_id = ?',
            [req.userId, req.params.type, req.params.id]
        );
        res.json({ message: 'تم حذف العنصر من السجل' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/history/clear', verifyToken, async (req, res) => {
    try {
        await db.execute('DELETE FROM watch_history WHERE user_id = ?', [req.userId]);
        res.json({ message: 'تم مسح سجل المشاهدة بالكامل' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== ADMIN API ==========
app.get('/api/admin/users', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const [users] = await db.execute('SELECT id, name, email, role, plan, status, created_at FROM users ORDER BY id DESC');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/admin/users', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { name, email, password, role, plan, status } = req.body;
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [toSqlValue(email)]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'البريد الإلكتروني موجود بالفعل' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, role, plan, status) VALUES (?, ?, ?, ?, ?, ?)',
            [toSqlValue(name), toSqlValue(email), hashedPassword, toSqlValue(role) || 'user', toSqlValue(plan) || 'free', toSqlValue(status) || 'active']
        );
        res.json({ id: result.insertId, message: 'تم إضافة المستخدم' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/admin/users/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { name, email, role, plan, status } = req.body;
        await db.execute(
            'UPDATE users SET name=?, email=?, role=?, plan=?, status=? WHERE id=?',
            [toSqlValue(name), toSqlValue(email), toSqlValue(role), toSqlValue(plan), toSqlValue(status), req.params.id]
        );
        res.json({ message: 'تم تحديث المستخدم' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/admin/users/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const [user] = await db.execute('SELECT email FROM users WHERE id = ?', [req.params.id]);
        if (user[0]?.email === 'mohcine@akiltv.com') {
            return res.status(400).json({ message: 'لا يمكن حذف المستخدم الرئيسي' });
        }
        await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'تم الحذف' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/admin/stats', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const [moviesCount] = await db.execute('SELECT COUNT(*) as count FROM movies');
        const [seriesCount] = await db.execute('SELECT COUNT(*) as count FROM series');
        const [usersCount] = await db.execute('SELECT COUNT(*) as count FROM users');
        const [channelsCount] = await db.execute('SELECT COUNT(*) as count FROM channels');
        res.json({ totalMovies: moviesCount[0].count, totalSeries: seriesCount[0].count, totalUsers: usersCount[0].count, totalChannels: channelsCount[0].count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== SEARCH API ==========
app.get('/api/search/all', async (req, res) => {
    try {
        const query = `%${req.query.q || ''}%`;
        const [movies] = await db.execute('SELECT id, title, title_ar, title_fr, poster, year, rating, "movie" as type FROM movies WHERE title LIKE ? OR title_ar LIKE ? OR title_fr LIKE ? ORDER BY created_at DESC LIMIT 20', [query, query, query]);
        const [series] = await db.execute('SELECT id, title, title_ar, title_fr, poster, year, rating, "series" as type FROM series WHERE title LIKE ? OR title_ar LIKE ? OR title_fr LIKE ? ORDER BY created_at DESC LIMIT 20', [query, query, query]);
        const [songs] = await db.execute('SELECT s.id, s.title, s.title_ar, s.title_en, s.cover_image, a.name as artist_name, "song" as type FROM songs s LEFT JOIN artists a ON s.artist_id = a.id WHERE s.title LIKE ? OR s.title_ar LIKE ? OR s.title_en LIKE ? OR a.name LIKE ? ORDER BY s.created_at DESC LIMIT 20', [query, query, query, query]);
        res.json({ movies, series, songs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== تشغيل الخادم ==========
const PORT = process.env.PORT || 5000;
const localIp = getLocalIp();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 CineWave Backend Server`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   ➜ Local:   http://localhost:${PORT}`);
    console.log(`   ➜ Network: http://${localIp}:${PORT}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
});