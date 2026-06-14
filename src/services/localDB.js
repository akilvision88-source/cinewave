// src/services/localDB.js
const DB_NAME = 'CineWaveDB';
const DB_VERSION = 4;

// متغير لمنع التهيئة المتكررة
let isInitialized = false;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // حذف المخازن القديمة وإعادة إنشائها
      if (db.objectStoreNames.contains('users')) db.deleteObjectStore('users');
      if (db.objectStoreNames.contains('movies')) db.deleteObjectStore('movies');
      if (db.objectStoreNames.contains('series')) db.deleteObjectStore('series');
      if (db.objectStoreNames.contains('channels')) db.deleteObjectStore('channels');
      if (db.objectStoreNames.contains('artists')) db.deleteObjectStore('artists');
      if (db.objectStoreNames.contains('songs')) db.deleteObjectStore('songs');
      if (db.objectStoreNames.contains('clips')) db.deleteObjectStore('clips');
      if (db.objectStoreNames.contains('reciters')) db.deleteObjectStore('reciters');
      
      // إنشاء المخازن الجديدة
      const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
      userStore.createIndex('email', 'email', { unique: true });
      
      db.createObjectStore('movies', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('series', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('channels', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('artists', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('songs', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('clips', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('reciters', { keyPath: 'id', autoIncrement: true });
      
      console.log('✅ تم إنشاء جميع المخازن');
    };
  });
};

// ========== دوال CRUD ==========

const getAll = async (storeName) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

const getById = async (storeName, id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const add = async (storeName, data) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    // إنشاء نسخة جديدة من البيانات بدون id
    const newData = { ...data };
    delete newData.id;
    
    const request = store.add(newData);
    request.onsuccess = () => {
      const newId = request.result;
      console.log(`✅ تم إضافة عنصر إلى ${storeName} بالمعرف ${newId}`);
      resolve({ ...newData, id: newId });
    };
    request.onerror = (err) => {
      console.error(`❌ خطأ في إضافة عنصر إلى ${storeName}:`, err);
      reject(request.error);
    };
  });
};

const update = async (storeName, id, data) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put({ ...data, id });
    request.onsuccess = () => resolve({ ...data, id });
    request.onerror = () => reject(request.error);
  });
};

const remove = async (storeName, id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

// ========== دوال خاصة بالأفلام والمسلسلات ==========
const addMovie = async (movieData) => {
  const newMovie = { ...movieData };
  delete newMovie.id;
  delete newMovie._id;
  return await add('movies', newMovie);
};

const addSeries = async (seriesData) => {
  const newSeries = { ...seriesData };
  delete newSeries.id;
  delete newSeries._id;
  return await add('series', newSeries);
};

const addChannel = async (channelData) => {
  const newChannel = { ...channelData };
  delete newChannel.id;
  delete newChannel._id;
  return await add('channels', newChannel);
};

// ========== تهيئة البيانات الافتراضية ==========
const initDefaultData = async () => {
  if (isInitialized) {
    console.log('⚠️ قاعدة البيانات مُهيأة مسبقاً، تخطي...');
    return;
  }
  
  try {
    console.log('🔄 تهيئة قاعدة البيانات...');
    isInitialized = true;
    
    // فتح قاعدة البيانات لإنشاء المخازن
    await openDB();
    
    // 1. إضافة المستخدم الجديد
    let users = await getAll('users');
    
    // حذف المستخدمين القديمين
    const oldEmails = ['admin@cinewave.com', 'user@example.com', 'admin@example.com'];
    for (const oldEmail of oldEmails) {
      const oldUser = users.find(u => u.email === oldEmail);
      if (oldUser) {
        await remove('users', oldUser.id);
        console.log(`🗑️ تم حذف: ${oldEmail}`);
      }
    }
    
    // إعادة جلب المستخدمين
    users = await getAll('users');
    
    // إضافة المستخدم الجديد
    const adminExists = users.find(u => u.email === 'mohcine@akiltv.com');
    
    if (!adminExists) {
      const newUser = await add('users', {
        name: 'Mohcine Akil',
        email: 'mohcine@akiltv.com',
        password: 'Akil1988@',
        role: 'admin',
        plan: 'premium',
        status: 'active',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        createdAt: new Date().toISOString()
      });
      console.log('✅ تم إنشاء المستخدم:', newUser.email);
    }
    
    // 2. إضافة فيلم تجريبي
    const movies = await getAll('movies');
    if (movies.length === 0) {
      await addMovie({
        title: 'فيلم تجريبي',
        year: 2024,
        rating: 8.5,
        genre: 'Action',
        duration: '2:15',
        poster: 'https://image.tmdb.org/t/p/w500/8BcVABn8TkPEKpJexWjPgvwqjNh.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/8b8R8l88Qje9dnbOE6PY0QO7Lx9.jpg',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        category: 'hollywood',
        type: 'movie'
      });
      console.log('✅ تم إضافة فيلم تجريبي');
    }
    
    // 3. إضافة مسلسل تجريبي
    const series = await getAll('series');
    if (series.length === 0) {
      await addSeries({
        title: 'مسلسل تجريبي',
        year: 2024,
        rating: 8.2,
        genre: 'Drama',
        seasons: 1,
        poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        category: 'arabic',
        type: 'series'
      });
      console.log('✅ تم إضافة مسلسل تجريبي');
    }
    
    // 4. إضافة قناة تجريبية
    const channels = await getAll('channels');
    if (channels.length === 0) {
      await addChannel({
        name: 'قناة تجريبية',
        name_ar: 'قناة تجريبية',
        logo: 'https://via.placeholder.com/80x80?text=TV',
        url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        category: 'arabic',
        is_active: true
      });
      console.log('✅ تم إضافة قناة تجريبية');
    }
    
    // عرض المستخدمين النهائيين
    const finalUsers = await getAll('users');
    console.log('📋 المستخدمون النهائيون:', finalUsers.map(u => ({ email: u.email, role: u.role })));
    
    console.log('🎉 تهيئة قاعدة البيانات انتهت بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في تهيئة البيانات:', error);
    isInitialized = false;
  }
};

// دالة لإعادة تعيين قاعدة البيانات
const resetDatabase = async () => {
  isInitialized = false;
  const db = await openDB();
  const stores = ['users', 'movies', 'series', 'channels', 'artists', 'songs', 'clips', 'reciters'];
  for (const store of stores) {
    const items = await getAll(store);
    for (const item of items) {
      await remove(store, item.id);
    }
  }
  console.log('🗑️ تم مسح جميع البيانات');
  await initDefaultData();
};

export const localDB = {
  getAll,
  getById,
  add,
  update,
  remove,
  addMovie,
  addSeries,
  addChannel,
  initDefaultData,
  resetDatabase
};

export default localDB;