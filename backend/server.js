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
// جلب جميع الأفلام (الأحدث أولاً)
app.get('/api/movies', async (req, res) => {
    try {
        const [movies] = await db.execute('SELECT * FROM movies ORDER BY created_at DESC');
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// جلب أفلام حسب التصنيف (الأحدث أولاً)
app.get('/api/movies/category/:category', async (req, res) => {
    try {
        const [movies] = await db.execute('SELECT * FROM movies WHERE category = ? ORDER BY created_at DESC', [toSqlValue(req.params.category)]);
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// جلب فيلم محدد مع ترجماته ومساراته الصوتية
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

// إضافة فيلم جديد
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
        console.error('❌ خطأ في الإضافة:', error);
        res.status(500).json({ message: error.message });
    }
});

// تحديث فيلم
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
        console.error('❌ خطأ في التحديث:', error);
        res.status(500).json({ message: error.message });
    }
});

// حذف فيلم
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
// جلب جميع المسلسلات (الأحدث أولاً)
app.get('/api/series', async (req, res) => {
    try {
        const [series] = await db.execute('SELECT * FROM series ORDER BY created_at DESC');
        res.json(series);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// جلب مسلسلات حسب التصنيف (الأحدث أولاً)
app.get('/api/series/category/:category', async (req, res) => {
    try {
        const [series] = await db.execute('SELECT * FROM series WHERE category = ? ORDER BY created_at DESC', [toSqlValue(req.params.category)]);
        res.json(series);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// جلب مسلسل محدد مع حلقاته
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

// إضافة مسلسل جديد
app.post('/api/series', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    try {
        const { title, title_ar, title_fr, description, poster, backdrop, rating, year, genre, country, director, cast, category, seasons } = req.body;
        const [result] = await db.execute(
            `INSERT INTO series (title, title_ar, title_fr, description, poster, backdrop, rating, year, genre, country, director, cast, category, seasons, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                toSqlValue(title), toSqlValue(title_ar), toSqlValue(title_fr),
                toSqlValue(description), toSqlValue(poster), toSqlValue(backdrop),
                rating || 0, year || new Date().getFullYear(),
                toSqlValue(genre), toSqlValue(country),
                toSqlValue(director), toSqlValue(cast), toSqlValue(category),
                seasons || 1
            ]
        );
        res.json({ id: result.insertId, message: 'تمت الإضافة' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// إضافة حلقة لمسلسل
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
        res.json({ id: result.insertId, message: 'تمت إضافة الحلقة' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// تحديث مسلسل
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

// حذف مسلسل
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

// حذف حلقة
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
        const [artists] = await db.execute('SELECT * FROM artists ORDER BY name');
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

// ========== SONGS API ==========
// جلب جميع الأغاني (الأحدث أولاً)
app.get('/api/songs', async (req, res) => {
    try {
        const [songs] = await db.execute('SELECT * FROM songs ORDER BY created_at DESC');
        res.json(songs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// جلب أغاني فنان معين (الأحدث أولاً)
app.get('/api/songs/artist/:artistId', async (req, res) => {
    try {
        const [songs] = await db.execute('SELECT * FROM songs WHERE artist_id = ? ORDER BY created_at DESC', [req.params.artistId]);
        res.json(songs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== CLIPS API ==========
// جلب جميع الكليبات (الأحدث أولاً)
app.get('/api/clips', async (req, res) => {
    try {
        const [clips] = await db.execute('SELECT * FROM clips ORDER BY created_at DESC');
        res.json(clips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// جلب كليبات فنان معين (الأحدث أولاً)
app.get('/api/clips/artist/:artistId', async (req, res) => {
    try {
        const [clips] = await db.execute('SELECT * FROM clips WHERE artist_id = ? ORDER BY created_at DESC', [req.params.artistId]);
        res.json(clips);
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

// ========== ADMIN: إدارة المستخدمين ==========
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
        
        res.json({ id: result.insertId, message: 'تم إضافة المستخدم بنجاح' });
    } catch (error) {
        console.error('Error adding user:', error);
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
        res.json({ message: 'تم تحديث المستخدم بنجاح' });
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
        res.json({ message: 'تم حذف المستخدم بنجاح' });
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
        
        res.json({
            totalMovies: moviesCount[0].count,
            totalSeries: seriesCount[0].count,
            totalUsers: usersCount[0].count,
            totalChannels: channelsCount[0].count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== SEARCH API ==========
app.get('/api/search/all', async (req, res) => {
    try {
        const query = `%${toSqlValue(req.query.q) || ''}%`;
        const [movies] = await db.execute(
            'SELECT id, title, title_ar, title_fr, poster, year, rating FROM movies WHERE title LIKE ? OR title_ar LIKE ? OR title_fr LIKE ? ORDER BY created_at DESC LIMIT 20',
            [query, query, query]
        );
        const [series] = await db.execute(
            'SELECT id, title, title_ar, title_fr, poster, year, rating FROM series WHERE title LIKE ? OR title_ar LIKE ? OR title_fr LIKE ? ORDER BY created_at DESC LIMIT 20',
            [query, query, query]
        );
        res.json({ movies, series });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== تشغيل الخادم على جميع الواجهات ==========
const PORT = process.env.PORT || 5000;
const localIp = getLocalIp();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 CineWave Backend Server`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   ➜ Local:   http://localhost:${PORT}`);
    console.log(`   ➜ Network: http://${localIp}:${PORT}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n📱 للاتصال من الأجهزة الأخرى على نفس الشبكة:`);
    console.log(`   http://${localIp}:3000\n`);
});