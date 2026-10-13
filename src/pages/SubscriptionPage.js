// src/pages/SubscriptionPage.js - خطط الاشتراك بنفس النمط الموحّد
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCheck, FaStar, FaCrown, FaGem, FaShieldAlt,
  FaArrowLeft, FaUsers, FaRocket, FaHeadset
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { subscriptionAPI } from '../services/api';

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    loadPlans();
    loadCurrentPlan();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await subscriptionAPI.getPlans();
      setPlans(data);
    } catch (error) {
      console.error('❌ خطأ:', error);
      setError(error.message || 'فشل في تحميل الخطط');
      setPlans([
        { id: 1, name_ar: 'مجاني', name: 'Free', price: 0, currency: 'USD', duration: 'life',
          features: ['مشاهدة الأفلام بجودة 480p', 'مشاهدة المسلسلات بجودة 480p', 'الإعلانات', 'دعم محدود'], is_active: true },
        { id: 2, name_ar: 'ستاندرد', name: 'Standard', price: 9.99, currency: 'USD', duration: 'month',
          features: ['مشاهدة بجودة 1080p', 'بدون إعلانات', 'تحميل للمشاهدة', 'دعم 24/7'], is_active: true },
        { id: 3, name_ar: 'بريميوم', name: 'Premium', price: 19.99, currency: 'USD', duration: 'month',
          features: ['مشاهدة بجودة 4K', 'بدون إعلانات', 'تحميل غير محدود', 'دعم 24/7', 'محتوى حصري', 'مشاهدة مبكرة'], is_active: true },
      ]);
    } finally { setLoading(false); }
  };

  const loadCurrentPlan = async () => {
    try {
      const data = await subscriptionAPI.getCurrentPlan();
      setCurrentPlan(data);
    } catch (error) { console.error(error); }
  };

  const handleSubscribe = async (planId) => {
    setProcessing(true);
    setError(null);
    try {
      const result = await subscriptionAPI.subscribe(planId);
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('userPlan', result.user.plan);
      }
      showToast('🎉 تم الاشتراك بنجاح!');
      await loadCurrentPlan();
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error(error);
      setError(error.message || 'فشل في الاشتراك');
      showToast('❌ فشل في الاشتراك', 'error');
    } finally { setProcessing(false); }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('هل أنت متأكد من إلغاء الاشتراك؟')) return;
    setProcessing(true);
    try {
      await subscriptionAPI.cancelSubscription();
      showToast('✅ تم إلغاء الاشتراك');
      await loadCurrentPlan();
      await loadPlans();
    } catch (error) { showToast('❌ حدث خطأ', 'error'); }
    finally { setProcessing(false); }
  };

  const showToast = (msg, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-24 left-1/2 -translate-x-1/2 z-50 text-white px-4 py-2 rounded-full shadow-lg text-sm ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  const getPlanIcon = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('بريميوم') || n.includes('premium')) return <FaCrown className="text-yellow-400 text-4xl" />;
    if (n.includes('ستاندرد') || n.includes('standard')) return <FaGem className="text-blue-400 text-4xl" />;
    return <FaStar className="text-gray-400 text-4xl" />;
  };

  const getPlanColor = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('بريميوم') || n.includes('premium')) return 'from-yellow-500 to-orange-600';
    if (n.includes('ستاندرد') || n.includes('standard')) return 'from-blue-500 to-purple-600';
    return 'from-gray-500 to-gray-700';
  };

  const getPlanBadge = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('بريميوم') || n.includes('premium')) return '🌟 الأكثر شعبية';
    if (n.includes('ستاندرد') || n.includes('standard')) return '⭐ الأفضل قيمة';
    return '';
  };

  const formatPrice = (price, currency) => {
    const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'MAD' ? 'DH' : '$';
    return `${sym}${price}`;
  };

  const getPlanDuration = (d) => ({ month: '/شهر', year: '/سنة', life: 'مدى الحياة' }[d] || '');

  const isCurrentPlan = (planId) => currentPlan && (currentPlan.plan_id === planId || currentPlan.id === planId);

  const canUpgrade = (planId) => {
    if (!currentPlan) return true;
    if (isCurrentPlan(planId)) return false;
    const ci = plans.findIndex(p => p.id === (currentPlan.plan_id || currentPlan.id));
    const si = plans.findIndex(p => p.id === planId);
    return si > ci;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1f242d]">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
                <FaCrown className="text-yellow-400 text-lg sm:text-xl" />
              </div>
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-br from-white via-rose-100 to-red-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(220,38,38,0.5)]">
                خطط الاشتراك
              </h1>
            </div>
            <div className="w-20 sm:w-28 h-0.5 sm:h-1 rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent mb-2 sm:mb-3 shadow-lg shadow-red-500/50" />
            <p className="text-gray-200 text-xs xs:text-sm sm:text-base max-w-xl leading-relaxed drop-shadow-lg">
              اختر الباقة المناسبة واستمتع بمحتوى لا محدود
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
        {/* زر العودة */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm">
          <FaArrowLeft /> العودة
        </button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 mb-6 text-center">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <button onClick={loadPlans} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs hover:scale-105 transition">إعادة المحاولة</button>
          </div>
        )}

        {/* الخطة الحالية */}
        {currentPlan && (
          <div className="bg-white/[0.04] border border-purple-500/30 rounded-2xl p-5 mb-8 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <p className="text-gray-400 text-xs">📌 خطتك الحالية</p>
                <p className="text-white font-bold text-lg">{currentPlan.plan_name || currentPlan.name}</p>
                <p className="text-gray-400 text-xs">
                  {currentPlan.plan_duration || currentPlan.duration} • {currentPlan.status === 'active' ? '✅ نشطة' : '⏸️ غير نشطة'}
                </p>
              </div>
              {currentPlan.status === 'active' && (
                <button onClick={handleCancelSubscription} disabled={processing} className="px-4 py-2 bg-red-600/20 border border-red-500/40 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition text-sm font-bold disabled:opacity-50">
                  إلغاء الاشتراك
                </button>
              )}
            </div>
          </div>
        )}

        {/* الشبكة */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.filter(p => p.is_active !== false).map((plan) => {
            const isCurrent = isCurrentPlan(plan.id);
            const badge = getPlanBadge(plan.name);
            const canUp = canUpgrade(plan.id);
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className={`relative bg-white/[0.04] backdrop-blur-sm rounded-3xl overflow-hidden border transition-all duration-300 hover:-translate-y-2 ${
                  isCurrent ? 'border-purple-500 shadow-2xl shadow-purple-500/20' : 'border-white/10 hover:border-red-500/40'
                }`}
              >
                {badge && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-lg">
                    {badge}
                  </div>
                )}

                <div className={`p-6 bg-gradient-to-br ${getPlanColor(plan.name)}`}>
                  <div className="flex items-center gap-3">
                    {getPlanIcon(plan.name)}
                    <div>
                      <h3 className="text-white text-xl font-bold">{plan.name_ar || plan.name}</h3>
                      <p className="text-white/70 text-xs">{plan.name}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-white text-3xl font-black">{formatPrice(plan.price, plan.currency)}</span>
                    <span className="text-white/70 text-sm">{getPlanDuration(plan.duration)}</span>
                  </div>
                </div>

                <div className="p-6">
                  <ul className="space-y-3">
                    {plan.features?.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                        <FaCheck className="text-emerald-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    {isCurrent ? (
                      <div className="w-full bg-purple-600/20 text-purple-400 py-3 rounded-xl text-center font-bold border border-purple-500/30">
                        ✅ خطتك الحالية
                      </div>
                    ) : canUp ? (
                      <button onClick={() => handleSubscribe(plan.id)} disabled={processing} className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white py-3 rounded-xl font-bold hover:scale-105 transition disabled:opacity-50">
                        {processing ? 'جاري الاشتراك...' : 'الاشتراك الآن'}
                      </button>
                    ) : (
                      <div className="w-full bg-white/5 text-gray-400 py-3 rounded-xl text-center font-bold border border-white/10">
                        {currentPlan ? 'خطتك الحالية أفضل' : 'غير متاح'}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* المميزات */}
        <div className="mt-12 bg-white/[0.04] rounded-3xl p-6 border border-white/10">
          <h2 className="text-white text-xl font-bold mb-6 text-center flex items-center justify-center gap-2">
            <FaShieldAlt className="text-purple-400" /> مقارنة المميزات
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-right text-gray-400 text-sm py-3 px-4 font-bold">الميزة</th>
                  {plans.filter(p => p.is_active !== false).map(plan => (
                    <th key={plan.id} className="text-center text-white text-sm py-3 px-4 font-bold">{plan.name_ar || plan.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'quality', label: 'جودة المشاهدة' },
                  { key: 'ads', label: 'إعلانات' },
                  { key: 'download', label: 'تحميل' },
                  { key: 'support', label: 'الدعم' },
                  { key: 'exclusive', label: 'حصري' },
                ].map((item, idx) => (
                  <tr key={idx} className="border-b border-white/5">
                    <td className="text-gray-300 text-sm py-3 px-4">{item.label}</td>
                    {plans.filter(p => p.is_active !== false).map(plan => {
                      const features = plan.features || [];
                      let value = '❌';
                      if (item.key === 'quality') {
                        if (plan.name?.toLowerCase().includes('premium') || plan.name_ar?.includes('بريميوم')) value = '4K';
                        else if (plan.name?.toLowerCase().includes('standard') || plan.name_ar?.includes('ستاندرد')) value = '1080p';
                        else value = '480p';
                      } else if (item.key === 'ads') value = features.some(f => f.includes('بدون إعلانات')) ? '✅ بدون' : '⚠️ مع إعلانات';
                      else if (item.key === 'download') value = features.some(f => f.includes('تحميل')) ? '✅' : '❌';
                      else if (item.key === 'support') value = features.some(f => f.includes('دعم')) ? '✅ 24/7' : '⚠️ محدود';
                      else if (item.key === 'exclusive') value = features.some(f => f.includes('حصري') || f.includes('مبكرة')) ? '✅' : '❌';
                      return (
                        <td key={plan.id} className={`text-center text-sm py-3 px-4 ${
                          value.includes('✅') || value === '4K' || value === '1080p' ? 'text-emerald-400' :
                          value.includes('⚠️') ? 'text-yellow-400' : 'text-gray-500'
                        }`}>{value}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <FaHeadset className="text-red-400" />
            لديك أسئلة؟ تواصل معنا على <a href="mailto:support@akiltv.com" className="text-red-400 hover:text-red-300">support@akiltv.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;