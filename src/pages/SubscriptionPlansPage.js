import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaCheckCircle, FaStar, FaCrown, FaGem, FaHeart, 
  FaFilm, FaTv, FaDownload, FaHeadset, FaAd, FaUsers,
  FaTrophy, FaGift, FaRocket, FaShieldAlt
} from 'react-icons/fa';
import { authAPI } from '../services/api';

const SubscriptionPlansPage = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const plans = [
    {
      id: 'free',
      name: 'مجاني',
      nameEn: 'Free',
      price: 0,
      currency: '$',
      period: 'مدى الحياة',
      icon: FaHeart,
      color: 'from-gray-600 to-gray-500',
      badge: 'basic',
      features: [
        'مشاهدة 5 أفلام شهرياً',
        'جودة 720p',
        'إعلانات',
        'مشاهدة على جهاز واحد',
        'دعم محدود'
      ],
      limitations: [
        'لا يمكن تحميل المحتوى',
        'لا توجد أولوية في الدعم',
        'محتوى محدود'
      ]
    },
    {
      id: 'standard',
      name: 'قياسي',
      nameEn: 'Standard',
      price: 9.99,
      currency: '$',
      period: 'شهرياً',
      icon: FaGem,
      color: 'from-blue-600 to-blue-500',
      badge: 'popular',
      features: [
        'مشاهدة غير محدودة',
        'جودة 1080p Full HD',
        'بدون إعلانات',
        'مشاهدة على جهازين',
        'دعم優先',
        'تحميل المحتوى'
      ]
    },
    {
      id: 'premium',
      name: 'مميز',
      nameEn: 'Premium',
      price: 19.99,
      currency: '$',
      period: 'شهرياً',
      icon: FaCrown,
      color: 'from-purple-600 to-purple-500',
      badge: 'best',
      features: [
        'مشاهدة غير محدودة',
        'جودة 4K + HDR',
        'بدون إعلانات',
        'مشاهدة على 4 أجهزة',
        'دعم VIP 24/7',
        'تحميل غير محدود',
        'محتوى حصري',
        'دولبي أتموس',
        'أولوية المشاهدة'
      ]
    }
  ];

  const specialOffers = [
    { id: 'yearly', name: 'سنوي', discount: 30, price: 99.99, originalPrice: 179.88, period: 'سنة' },
    { id: 'family', name: 'عائلي', discount: 40, price: 149.99, originalPrice: 239.88, period: 'سنة', users: 6 }
  ];

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    setStep(2);
    setError('');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // تسجيل المستخدم عبر API
      const response = await authAPI.register(
        formData.name,
        formData.email,
        formData.password
      );
      
      // حفظ بيانات المصادقة
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', response.user.role);
      localStorage.setItem('userPlan', selectedPlan);
      
      setLoading(false);
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'حدث خطأ في إنشاء الحساب');
      setLoading(false);
    }
  };

  const getPlanIcon = (icon) => {
    switch(icon) {
      case FaHeart: return <FaHeart className="text-red-400 text-3xl" />;
      case FaGem: return <FaGem className="text-blue-400 text-3xl" />;
      case FaCrown: return <FaCrown className="text-yellow-400 text-3xl" />;
      default: return <FaStar className="text-purple-400 text-3xl" />;
    }
  };

  if (step === 2 && selectedPlan) {
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
          <div className="flex items-center justify-between mb-8">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-2 ${step >= 1 ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'}`}>1</div>
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-2 ${step >= 2 ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'}`}>2</div>
            <div className={`flex-1 h-1 rounded-full ${step >= 3 ? 'bg-green-500' : 'bg-gray-700'}`} />
          </div>

          <div className="text-center mb-6">
            <div className={`w-16 h-16 mx-auto bg-gradient-to-r ${selectedPlanData.color} rounded-2xl flex items-center justify-center mb-3`}>
              {getPlanIcon(selectedPlanData.icon)}
            </div>
            <h2 className="text-xl font-bold text-white">إنشاء حساب {selectedPlanData.name}</h2>
            <p className="text-gray-400 text-sm mt-1">{selectedPlanData.price === 0 ? 'مجاني مدى الحياة' : `${selectedPlanData.price} ${selectedPlanData.currency}/${selectedPlanData.period}`}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-400 mb-1 text-sm">الاسم الكامل</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-green-500"
                placeholder="أحمد محمد"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 text-sm">البريد الإلكتروني</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-green-500"
                placeholder="ahmed@example.com"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 text-sm">كلمة المرور</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-green-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 text-sm">تأكيد كلمة المرور</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-green-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r ${selectedPlanData.color} text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري إنشاء الحساب...</span>
                </div>
              ) : (
                selectedPlan === 'free' ? 'إنشاء حساب مجاني' : `اشتراك ${selectedPlanData.name} - ${selectedPlanData.price} ${selectedPlanData.currency}`
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-gray-500 text-sm hover:text-gray-400"
            >
              ← العودة لاختيار الباقة
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black py-12 px-4">
      <div className="text-center mb-12">
        <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-600 to-red-600 rounded-2xl flex items-center justify-center mb-4">
          <FaRocket className="text-white text-3xl" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          اختر <span className="bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent">باقتك المناسبة</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          جميع الباقات تشمل تجربة مجانية لمدة 7 أيام. يمكنك الإلغاء في أي وقت.
        </p>
      </div>

      <div className="max-w-6xl mx-auto mb-8 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-4 border border-green-500/30 text-center">
        <FaGift className="inline text-green-500 mr-2" />
        <span className="text-green-400">🎁 عرض خاص: 7 أيام تجريبية مجانية على جميع الباقات!</span>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-2 ${
              plan.badge === 'best' ? 'border-purple-500 shadow-xl shadow-purple-500/20' :
              plan.badge === 'popular' ? 'border-blue-500 shadow-xl shadow-blue-500/20' :
              'border-gray-800'
            }`}
          >
            {plan.badge === 'best' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                الأفضل قيمة
              </div>
            )}
            {plan.badge === 'popular' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                الأكثر طلباً
              </div>
            )}

            <div className={`w-16 h-16 mx-auto bg-gradient-to-r ${plan.color} rounded-2xl flex items-center justify-center mb-4`}>
              {getPlanIcon(plan.icon)}
            </div>

            <h3 className="text-xl font-bold text-white text-center">{plan.name}</h3>
            <p className="text-gray-400 text-center text-sm mb-4">{plan.period}</p>

            <div className="text-center mb-4">
              {plan.price === 0 ? (
                <span className="text-3xl font-bold text-white">مجاني</span>
              ) : (
                <>
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400"> {plan.currency}/{plan.period === 'مدى الحياة' ? 'مدى الحياة' : 'شهر'}</span>
                </>
              )}
            </div>

            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                  <FaCheckCircle className="text-green-500 text-xs flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {plan.id === 'free' && (
              <div className="mb-6 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-gray-500 text-xs text-center">القيود:</p>
                {plan.limitations.map((limitation, i) => (
                  <p key={i} className="text-gray-600 text-xs text-center">• {limitation}</p>
                ))}
              </div>
            )}

            <button
              onClick={() => handlePlanSelect(plan.id)}
              className={`w-full bg-gradient-to-r ${plan.color} text-white py-2 rounded-lg font-semibold hover:shadow-lg transition`}
            >
              {plan.price === 0 ? 'ابدأ مجاناً' : `اشترك الآن`}
            </button>

            {plan.price > 0 && (
              <p className="text-center text-gray-500 text-xs mt-3">7 أيام تجريبية مجانية</p>
            )}
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto mt-12">
        <h2 className="text-xl font-bold text-white text-center mb-6 flex items-center justify-center gap-2">
          <FaTrophy className="text-yellow-500" /> عروض خاصة <FaTrophy className="text-yellow-500" />
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {specialOffers.map((offer) => (
            <div key={offer.id} className="bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-xl p-5 border border-orange-500/30">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-white font-bold text-lg">{offer.name}</h3>
                  <p className="text-gray-400 text-sm">خصم {offer.discount}%</p>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 line-through text-sm">${offer.originalPrice}</span>
                  <p className="text-2xl font-bold text-white">${offer.price}</p>
                  <p className="text-gray-500 text-xs">/{offer.period}</p>
                </div>
              </div>
              {offer.users && <p className="text-gray-400 text-sm mb-3"><FaUsers className="inline mr-1" /> حتى {offer.users} أفراد</p>}
              <button className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition">
                احصل على العرض
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-12 text-center">
        <p className="text-gray-500 text-sm">
          🔒 مدفوعات آمنة 100% • إلغاء في أي وقت • دعم فني 24/7
        </p>
        <p className="text-gray-600 text-xs mt-2">
          * الأسعار تشمل الضريبة. التجربة المجانية متاحة لجميع الباقات.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;