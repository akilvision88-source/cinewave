// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// 🔥 ضع معلومات Firebase الخاصة بك هنا (من الخطوة 2)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ========== دوال قاعدة البيانات ==========

// جلب جميع المستندات من مجموعة
const getAll = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    console.log(`📋 تم جلب ${items.length} عنصر من ${collectionName}`);
    return items;
  } catch (error) {
    console.error(`❌ خطأ في جلب ${collectionName}:`, error);
    return [];
  }
};

// جلب مستند حسب المعرف
const getById = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`❌ خطأ في جلب المستند ${id}:`, error);
    return null;
  }
};

// إضافة مستند جديد
const add = async (collectionName, data) => {
  try {
    // إضافة بيانات إضافية
    const newData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, collectionName), newData);
    console.log(`✅ تم إضافة عنصر إلى ${collectionName} بالمعرف ${docRef.id}`);
    return { id: docRef.id, ...newData };
  } catch (error) {
    console.error(`❌ خطأ في إضافة عنصر إلى ${collectionName}:`, error);
    throw error;
  }
};

// تحديث مستند
const update = async (collectionName, id, data) => {
  try {
    const docRef = doc(db, collectionName, id);
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(docRef, updateData);
    console.log(`✅ تم تحديث العنصر ${id} في ${collectionName}`);
    return { id, ...updateData };
  } catch (error) {
    console.error(`❌ خطأ في تحديث العنصر ${id}:`, error);
    throw error;
  }
};

// حذف مستند
const remove = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    console.log(`✅ تم حذف العنصر ${id} من ${collectionName}`);
    return true;
  } catch (error) {
    console.error(`❌ خطأ في حذف العنصر ${id}:`, error);
    throw error;
  }
};

// ========== دوال المصادقة ==========

// تسجيل الدخول
const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ تم تسجيل الدخول بنجاح:', user.email);
    
    // حفظ بيانات المستخدم
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userId', user.uid);
    localStorage.setItem('userEmail', user.email);
    
    return { success: true, user: { id: user.uid, email: user.email, role: 'admin' } };
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error);
    return { success: false, error: error.message };
  }
};

// تسجيل مستخدم جديد
const register = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // إضافة بيانات المستخدم إلى Firestore
    await add('users', {
      uid: user.uid,
      name: name,
      email: email,
      role: 'user',
      plan: 'free',
      status: 'active',
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ تم تسجيل المستخدم بنجاح:', user.email);
    return { success: true, user: { id: user.uid, email: user.email, role: 'user' } };
  } catch (error) {
    console.error('❌ خطأ في التسجيل:', error);
    return { success: false, error: error.message };
  }
};

// تسجيل الخروج
const logout = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    console.log('✅ تم تسجيل الخروج');
    return { success: true };
  } catch (error) {
    console.error('❌ خطأ في تسجيل الخروج:', error);
    return { success: false, error: error.message };
  }
};

// مراقبة حالة المصادقة
const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ========== دوال مخصصة للمشروع ==========

// جلب الأفلام حسب التصنيف
const getMoviesByCategory = async (category) => {
  const allMovies = await getAll('movies');
  return allMovies.filter(movie => movie.category === category && movie.type === 'movie');
};

// جلب المسلسلات حسب التصنيف
const getSeriesByCategory = async (category) => {
  const allSeries = await getAll('series');
  return allSeries.filter(series => series.category === category && series.type === 'series');
};

// ========== تصدير الدوال ==========
export const firebaseDB = {
  getAll,
  getById,
  add,
  update,
  remove,
  getMoviesByCategory,
  getSeriesByCategory
};

export const firebaseAuth = {
  login,
  register,
  logout,
  onAuthChange
};

export default { firebaseDB, firebaseAuth };