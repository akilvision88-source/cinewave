// src/pages/SubscriptionPlansPage.js - خطط الاشتراك مع التسجيل بنفس النمط
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaCheckCircle, FaStar, FaCrown, FaGem, FaHeart,
  FaUsers, FaTrophy, FaGift, FaRocket, FaEnvelope, FaLock, FaUser
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';

const SubscriptionPlansPage = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const plans = [
    { id: 'free', name: 'مجاني', nameEn: 'Free', price: 0, currency: '$', period: 'مدى الحياة', icon: FaHeart, color: 'from-gray-600 to-gray-500', badge: 'basic',
      features: ['مشاهدة 5 أفلام شهرياً', 'جودة 720p', 'إعلانات', 'مشاهدة على جهاز واحد', 'دعم محدود'],
      limitations: ['لا يمكن تحميل المحتوى', 'لا توجد أولوية في الدعم', 'محتوى محدود'] },
    { id: 'standard', name: 'قياسي', nameEn: 'Standard', price: 9.99, currency: '$', period: 'شهرياً', icon: FaGem, color: 'from-blue-600 to-blue-500', badge: 'popular',
      features: ['مشاهدة غير محدودة', 'جودة 1080p Full HD', 'بدون إعلانات', 'مشاهدة على جهازين', 'دعم优先', 'تحميل المحتوى'] },
    { id: 'premium', name: 'مميز', nameEn: 'Premium', price: 19.99, currency: '$', period: 'شهرياً', icon: FaCrown, color: 'from-purple-600 to-purple-500', badge: 'best',
      features: ['مشاهدة غير محدودة', 'جودة 4K + HDR', 'بدون إعلانات', 'مشاهدة على 4 أجهزة', 'دعم VIP 24/7', 'تحميل غير محدود', 'محتوى حصري', 'دولبي أتموس', 'أولوية المشاهدة'] },
  ];

  const specialOffers = [
    { id: 'yearly', name: 'سنوي', discount: 30, price: 99.99, originalPrice: 179.88, period: 'سنة' },
    { id: 'family', name: 'عائلي', discount: 40, price: 149.99, originalPrice: 239.88, period: 'سنة', users: 6 },
  ];

  const handlePlanSelect = (planId) => { setSelectedPlan(planId); setStep(2); setError(''); };

  const handleInputChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { setError('كلمة المرور غير متطابقة'); return; }
    if (formData.password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.register(formData.name, formData.email, formData.password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', response.user.role);
      localStorage.setItem('userPlan', selectedPlan);
      setLoading(false);
      navigate('/');
    } catch (err) {
      setError(err.message || 'حدث خطأ في إنشاء الحساب');
      setLoading(false);
    }
  };

  const getPlanIcon = (icon) => {
    switch (icon) {
      case FaHeart: return <FaHeart className="text-red-400 text-3xl" />;
      case FaGem: return <FaGem className="text-blue-400 text-3xl" />;
      case FaCrown: return <FaCrown className="text-yellow-400 text-3xl" />;
      default: return <FaStar className="text-purple-400 text-3xl" />;
    }
  };

  // ========== الخطوة 2: نموذج التسجيل ==========
  if (step === 2 && selectedPlan) {
    const planData = plans.find(p => p.id === selectedPlan);
    return (
      <div className="min-h-screen bg-[#1f242d] relative flex items-center justify-center py-12 px-4">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://image.tmdb.org/t/p/original/d5NXSklXo0qyIYkgV94XAgMIckC.jpg)', filter: 'blur(100px) saturate(1.4) brightness(0.25)', transform: 'scale(1.3)' }} />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1f242d]/95 via-[#1f242d]/80 to-[#1f242d]/95" />
        </div>

        <div className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 z-10">
          <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/70 shadow-lg shadow-white/40" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 max-w-md w-full bg-white/[0.04] backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl shadow-black/60">
          {/* Progress */}
          <div className="flex items-center justify-between mb-8">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-red-500' : 'bg-white/10'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-2 font-bold text-sm ${step >= 1 ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-400'}`}>1</div>
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-red-500' : 'bg-white/10'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-2 font-bold text-sm ${step >= 2 ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-400'}`}>2</div>
            <div className="flex-1 h-1 rounded-full bg-white/10" />
          </div>

          <div className="text-center mb-6">
            <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${planData.color} rounded-2xl flex items-center justify-center mb-3 shadow-2xl`}>
              {getPlanIcon(planData.icon)}
            </div>
            <h2 className="text-xl font-bold text-white">إنشاء حساب {planData.name}</h2>
            <p className="text-gray-400 text-sm mt-1">
              {planData.price === 0 ? 'مجاني مدى الحياة' : `${planData.price} ${planData.currency}/${planData.period}`}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-3 text-red-400 text-sm text-center">⚠️ {error}</div>}

            <div>
              <label className="block text-gray-300 mb-2 text-sm font-bold">الاسم الكامل</label>
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full bg-[#21262d] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 transition text-sm" placeholder="أحمد محمد" />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm font-bold">البريد الإلكتروني</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full bg-[#21262d] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 transition text-sm" placeholder="ahmed@example.com" />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm font-bold">كلمة المرور</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required className="w-full bg-[#21262d] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 transition text-sm" placeholder="••••••••" />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm font-bold">تأكيد كلمة المرور</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required className="w-full bg-[#21262d] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 transition text-sm" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={loading} className={`w-full bg-gradient-to-r ${planData.color} text-white py-3 rounded-xl font-bold hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100`}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري إنشاء الحساب...</span>
                </div>
              ) : (selectedPlan === 'free' ? 'إنشاء حساب مجاني' : `اشتراك ${planData.name} - ${planData.price} ${planData.currency}`)}
            </button>

            <button type="button" onClick={() => setStep(1)} className="w-full text-gray-400 text-sm hover:text-white transition">← العودة لاختيار الباقة</button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ========== الخطوة 1: عرض الباقات ==========
  return (
    <div className="min-h-screen bg-[#1f242d] relative">
      {/* Hero */}
      <div className="relative h-[22vh] md:h-[28vh] w-full overflow-hidden bg-[#0d1015]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://image.tmdb.org/t/p/original/d5NXSklXo0qyIYkgV94XAgMIckC.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f242d]/70 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1015]/85 via-[#0d1015]/50 to-[#0d1015]/85" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1015]/50 via-transparent to-transparent" />

        <div className="relative h-full w-full px-4 sm:px-8 md:px-12 lg:px-16 flex flex-col items-center justify-center text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center">
                <FaRocket className="text-red-500 text-lg sm:text-xl" />
              </div>
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-br from-white via-rose-100 to-red-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(220,38,38,0.5)]">
                اختر باقتك
              </h1>
            </div>
            <div className="w-20 sm:w-28 h-0.5 sm:h-1 rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent mb-2 sm:mb-3 shadow-lg shadow-red-500/50" />
            <p className="text-gray-200 text-xs xs:text-sm sm:text-base max-w-xl leading-relaxed drop-shadow-lg">
              جميع الباقات تشمل تجربة مجانية 7 أيام
            </p>
          </motion.div>
        </div>
      </div>

      {/* فاصل أبيض */}
      <div className="relative w-full flex items-center justify-center py-4">
        <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/70 shadow-lg shadow-white/40" />
      </div>

      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 py-6">
        {/* عرض خاص */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-2xl p-4 border border-emerald-500/30 text-center mb-8 backdrop-blur-sm">
          <FaGift className="inline text-emerald-400 mr-2" />
          <span className="text-emerald-300 font-bold">🎁 عرض خاص: 7 أيام تجريبية مجانية على جميع الباقات!</span>
        </motion.div>

        {/* البطاقات */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`relative bg-white/[0.04] backdrop-blur-sm rounded-3xl overflow-hidden border transition-all duration-300 hover:-translate-y-2 ${
                plan.badge === 'best' ? 'border-purple-500 shadow-2xl shadow-purple-500/20' :
                plan.badge === 'popular' ? 'border-blue-500 shadow-2xl shadow-blue-500/20' :
                'border-white/10 hover:border-red-500/40'
              }`}
            >
              {plan.badge === 'best' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg z-10">الأفضل قيمة</div>
              )}
              {plan.badge === 'popular' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg z-10">الأكثر طلباً</div>
              )}

              <div className={`p-6 bg-gradient-to-br ${plan.color}`}>
                <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 ring-2 ring-white/30">
                  {getPlanIcon(plan.icon)}
                </div>
                <h3 className="text-xl font-bold text-white text-center">{plan.name}</h3>
                <p className="text-white/70 text-center text-sm">{plan.period}</p>
                <div className="text-center mt-4">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-black text-white">مجاني</span>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-white">{plan.price}</span>
                      <span className="text-white/70 text-sm"> {plan.currency}/شهر</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6">
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                      <FaCheckCircle className="text-emerald-400 text-xs flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.id === 'free' && (
                  <div className="mb-6 p-3 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-gray-400 text-xs text-center mb-1 font-bold">القيود:</p>
                    {plan.limitations.map((l, i) => (
                      <p key={i} className="text-gray-500 text-xs text-center">• {l}</p>
                    ))}
                  </div>
                )}

                <button onClick={() => handlePlanSelect(plan.id)} className={`w-full bg-gradient-to-r ${plan.color} text-white py-3 rounded-xl font-bold hover:scale-105 transition shadow-lg`}>
                  {plan.price === 0 ? 'ابدأ مجاناً' : 'اشترك الآن'}
                </button>

                {plan.price > 0 && <p className="text-center text-gray-500 text-xs mt-3">7 أيام تجريبية مجانية</p>}
              </div>
            </motion.div>
          ))}
        </div>

        {/* عروض خاصة */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white text-center mb-6 flex items-center justify-center gap-2">
            <FaTrophy className="text-yellow-500" /> عروض خاصة <FaTrophy className="text-yellow-500" />
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {specialOffers.map((offer) => (
              <motion.div key={offer.id} whileHover={{ scale: 1.02 }} className="bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-2xl p-5 border border-orange-500/30 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-white font-bold text-lg">{offer.name}</h3>
                    <p className="text-gray-400 text-sm">خصم {offer.discount}%</p>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 line-through text-sm">${offer.originalPrice}</span>
                    <p className="text-2xl font-black text-white">${offer.price}</p>
                    <p className="text-gray-500 text-xs">/{offer.period}</p>
                  </div>
                </div>
                {offer.users && <p className="text-gray-400 text-sm mb-3"><FaUsers className="inline mr-1" /> حتى {offer.users} أفراد</p>}
                <button className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-2.5 rounded-xl font-bold hover:scale-105 transition">احصل على العرض</button>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>🔒 مدفوعات آمنة 100% • إلغاء في أي وقت • دعم فني 24/7</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;