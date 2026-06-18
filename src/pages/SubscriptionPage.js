// src/pages/SubscriptionPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCheck, FaStar, FaCrown, FaGem, FaRocket, FaShieldAlt,
  FaVideo, FaMusic, FaTv, FaDownload, FaAd, FaHeadset,
  FaArrowLeft, FaHeart, FaPlay, FaFilm, FaUsers
} from 'react-icons/fa';
import { subscriptionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);

  // ========== LOAD PLANS ==========
  useEffect(() => {
    loadPlans();
    loadCurrentPlan();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await subscriptionAPI.getPlans();
      setPlans(data);
      console.log('✅ تم تحميل خطط الاشتراك:', data);
    } catch (error) {
      console.error('❌ خطأ في تحميل الخطط:', error);
      setError(error.message || 'فشل في تحميل خطط الاشتراك');
      // بيانات تجريبية في حالة فشل الاتصال
      setPlans([
        {
          id: 1,
          name: 'مجاني',
          name_ar: 'مجاني',
          price: 0,
          currency: 'USD',
          duration: 'life',
          features: [
            'مشاهدة الأفلام بجودة 480p',
            'مشاهدة المسلسلات بجودة 480p',
            'الإعلانات',
            'دعم محدود'
          ],
          is_active: true
        },
        {
          id: 2,
          name: 'ستاندرد',
          name_ar: 'ستاندرد',
          price: 9.99,
          currency: 'USD',
          duration: 'month',
          features: [
            'مشاهدة الأفلام بجودة 1080p',
            'مشاهدة المسلسلات بجودة 1080p',
            'بدون إعلانات',
            'تحميل للمشاهدة بدون إنترنت',
            'دعم 24/7'
          ],
          is_active: true
        },
        {
          id: 3,
          name: 'بريميوم',
          name_ar: 'بريميوم',
          price: 19.99,
          currency: 'USD',
          duration: 'month',
          features: [
            'مشاهدة الأفلام بجودة 4K',
            'مشاهدة المسلسلات بجودة 4K',
            'بدون إعلانات',
            'تحميل غير محدود',
            'دعم 24/7',
            'محتوى حصري',
            'مشاهدة مبكرة للأفلام'
          ],
          is_active: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentPlan = async () => {
    try {
      const data = await subscriptionAPI.getCurrentPlan();
      setCurrentPlan(data);
      console.log('✅ الخطة الحالية:', data);
    } catch (error) {
      console.error('❌ خطأ في تحميل الخطة الحالية:', error);
    }
  };

  // ========== SUBSCRIBE ==========
  const handleSubscribe = async (planId) => {
    setProcessing(true);
    setError(null);
    try {
      const result = await subscriptionAPI.subscribe(planId);
      console.log('✅ تم الاشتراك بنجاح:', result);
      
      // تحديث حالة المستخدم
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('userPlan', result.user.plan);
      }
      
      alert('🎉 تم الاشتراك بنجاح!');
      await loadCurrentPlan();
      navigate('/');
    } catch (error) {
      console.error('❌ خطأ في الاشتراك:', error);
      setError(error.message || 'فشل في عملية الاشتراك');
    } finally {
      setProcessing(false);
    }
  };

  // ========== CANCEL SUBSCRIPTION ==========
  const handleCancelSubscription = async () => {
    if (!window.confirm('هل أنت متأكد من إلغاء الاشتراك؟')) return;
    
    setProcessing(true);
    try {
      await subscriptionAPI.cancelSubscription();
      alert('✅ تم إلغاء الاشتراك بنجاح');
      await loadCurrentPlan();
      await loadPlans();
    } catch (error) {
      console.error('❌ خطأ في إلغاء الاشتراك:', error);
      alert('❌ حدث خطأ في إلغاء الاشتراك');
    } finally {
      setProcessing(false);
    }
  };

  // ========== GET PLAN ICON ==========
  const getPlanIcon = (planName) => {
    const name = planName?.toLowerCase() || '';
    if (name.includes('بريميوم') || name.includes('premium')) return <FaCrown className="text-yellow-400 text-4xl" />;
    if (name.includes('ستاندرد') || name.includes('standard')) return <FaGem className="text-blue-400 text-4xl" />;
    return <FaStar className="text-gray-400 text-4xl" />;
  };

  // ========== GET PLAN COLOR ==========
  const getPlanColor = (planName) => {
    const name = planName?.toLowerCase() || '';
    if (name.includes('بريميوم') || name.includes('premium')) return 'from-yellow-600 to-orange-600';
    if (name.includes('ستاندرد') || name.includes('standard')) return 'from-blue-600 to-purple-600';
    return 'from-gray-600 to-gray-700';
  };

  // ========== GET PLAN BADGE ==========
  const getPlanBadge = (planName) => {
    const name = planName?.toLowerCase() || '';
    if (name.includes('بريميوم') || name.includes('premium')) return '🌟 الأكثر شعبية';
    if (name.includes('ستاندرد') || name.includes('standard')) return '⭐ الأفضل قيمة';
    return '';
  };

  // ========== FORMAT PRICE ==========
  const formatPrice = (price, currency) => {
    const symbol = currency === 'USD' ? '$' : 
                   currency === 'EUR' ? '€' : 
                   currency === 'MAD' ? 'DH' : '$';
    return `${symbol}${price}`;
  };

  // ========== GET PLAN DURATION ==========
  const getPlanDuration = (duration) => {
    switch(duration) {
      case 'month': return '/شهر';
      case 'year': return '/سنة';
      case 'life': return 'مدى الحياة';
      default: return '';
    }
  };

  // ========== CHECK IF CURRENT PLAN ==========
  const isCurrentPlan = (planId) => {
    if (!currentPlan) return false;
    return currentPlan.plan_id === planId || currentPlan.id === planId;
  };

  // ========== CHECK IF USER CAN UPGRADE ==========
  const canUpgrade = (planId) => {
    if (!currentPlan) return true;
    if (currentPlan.plan_id === planId || currentPlan.id === planId) return false;
    // إذا كانت الخطة الحالية أعلى من الخطة المختارة
    const currentIndex = plans.findIndex(p => p.id === currentPlan.plan_id || p.id === currentPlan.id);
    const selectedIndex = plans.findIndex(p => p.id === planId);
    return selectedIndex > currentIndex;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل خطط الاشتراك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* ====== HEADER ====== */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition">
            <FaArrowLeft className="text-xl" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <FaCrown className="text-yellow-400" />
            خطط الاشتراك المميزة
          </h1>
        </div>

        {/* ====== ERROR ====== */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-400">{error}</p>
            <button onClick={loadPlans} className="mt-2 text-white bg-red-600 px-4 py-1 rounded-lg text-sm hover:bg-red-700">
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* ====== CURRENT PLAN ====== */}
        {currentPlan && (
          <div className="bg-gray-800/50 border border-purple-500/30 rounded-xl p-4 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <p className="text-gray-400 text-sm">📌 خطتك الحالية</p>
                <p className="text-white font-bold text-lg">{currentPlan.plan_name || currentPlan.name}</p>
                <p className="text-gray-400 text-sm">
                  {currentPlan.plan_duration || currentPlan.duration} • 
                  {currentPlan.status === 'active' ? ' ✅ نشطة' : ' ⏸️ غير نشطة'}
                </p>
              </div>
              <div className="flex gap-3">
                {currentPlan.status === 'active' && (
                  <button 
                    onClick={handleCancelSubscription}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50"
                  >
                    إلغاء الاشتراك
                  </button>
                )}
                <button 
                  onClick={loadPlans}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                >
                  تحديث
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====== PLANS ====== */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.filter(plan => plan.is_active !== false).map((plan) => {
            const isCurrent = isCurrentPlan(plan.id);
            const badge = getPlanBadge(plan.name);
            const canUpgradePlan = canUpgrade(plan.id);

            return (
              <div 
                key={plan.id} 
                className={`relative bg-gray-800 rounded-2xl overflow-hidden border transition-all duration-300 ${
                  isCurrent ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-gray-700 hover:border-purple-500/50'
                }`}
              >
                {/* Badge */}
                {badge && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {badge}
                  </div>
                )}

                {/* Header */}
                <div className={`p-6 bg-gradient-to-r ${getPlanColor(plan.name)}`}>
                  <div className="flex items-center gap-3">
                    {getPlanIcon(plan.name)}
                    <div>
                      <h3 className="text-white text-xl font-bold">
                        {plan.name_ar || plan.name}
                      </h3>
                      <p className="text-white/70 text-sm">{plan.name}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-white text-3xl font-bold">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    <span className="text-white/70 text-sm">
                      {getPlanDuration(plan.duration)}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="p-6">
                  <ul className="space-y-3">
                    {plan.features && plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-gray-300 text-sm">
                        <FaCheck className="text-green-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  <div className="mt-6">
                    {isCurrent ? (
                      <div className="w-full bg-purple-600/20 text-purple-400 py-3 rounded-xl text-center font-medium border border-purple-500/30">
                        ✅ خطتك الحالية
                      </div>
                    ) : canUpgradePlan ? (
                      <button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={processing}
                        className="w-full bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 transition font-medium disabled:opacity-50"
                      >
                        {processing ? 'جاري الاشتراك...' : 'الاشتراك الآن'}
                      </button>
                    ) : (
                      <div className="w-full bg-gray-700/50 text-gray-400 py-3 rounded-xl text-center font-medium border border-gray-600">
                        {currentPlan ? 'خطتك الحالية أفضل' : 'غير متاح'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ====== FEATURES COMPARISON ====== */}
        <div className="mt-12 bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-white text-xl font-bold mb-6 text-center flex items-center justify-center gap-2">
            <FaShieldAlt className="text-purple-400" />
            مقارنة المميزات
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-right text-gray-400 text-sm py-3 px-4">الميزة</th>
                  {plans.filter(p => p.is_active !== false).map(plan => (
                    <th key={plan.id} className="text-center text-white text-sm py-3 px-4">{plan.name_ar || plan.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'quality', label: 'جودة المشاهدة' },
                  { key: 'ads', label: 'إعلانات' },
                  { key: 'download', label: 'تحميل للمشاهدة' },
                  { key: 'support', label: 'الدعم الفني' },
                  { key: 'exclusive', label: 'محتوى حصري' },
                ].map((item, index) => (
                  <tr key={index} className="border-b border-gray-700/50">
                    <td className="text-gray-300 text-sm py-3 px-4">{item.label}</td>
                    {plans.filter(p => p.is_active !== false).map(plan => {
                      const features = plan.features || [];
                      let value = '❌';
                      if (item.key === 'quality') {
                        if (plan.name?.toLowerCase().includes('premium') || plan.name_ar?.includes('بريميوم')) value = '4K';
                        else if (plan.name?.toLowerCase().includes('standard') || plan.name_ar?.includes('ستاندرد')) value = '1080p';
                        else value = '480p';
                      } else if (item.key === 'ads') {
                        value = features.some(f => f.includes('بدون إعلانات')) ? '✅ بدون' : '⚠️ مع إعلانات';
                      } else if (item.key === 'download') {
                        value = features.some(f => f.includes('تحميل')) ? '✅' : '❌';
                      } else if (item.key === 'support') {
                        value = features.some(f => f.includes('دعم')) ? '✅ 24/7' : '⚠️ محدود';
                      } else if (item.key === 'exclusive') {
                        value = features.some(f => f.includes('حصري') || f.includes('مبكرة')) ? '✅' : '❌';
                      }
                      return (
                        <td key={plan.id} className={`text-center text-sm py-3 px-4 ${
                          value.includes('✅') || value.includes('4K') || value.includes('1080p') 
                            ? 'text-green-400' 
                            : value.includes('⚠️') ? 'text-yellow-400' : 'text-gray-500'
                        }`}>
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ====== FAQ ====== */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            لديك أسئلة؟ تواصل معنا على <a href="mailto:support@akiltv.com" className="text-purple-400 hover:text-purple-300">support@akiltv.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;