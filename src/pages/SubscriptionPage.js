import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { FaCheckCircle, FaStar, FaPaypal, FaCreditCard, FaApplePay, FaGooglePay, FaLock, FaGift } from 'react-icons/fa';
import StripePayment from '../components/Payment/StripePayment';
import PayPalPayment from '../components/Payment/PayPalPayment';

const SubscriptionPage = () => {
  const { isSubscribed, setIsSubscribed, user } = useContext(AuthContext);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showCouponInput, setShowCouponInput] = useState(false);

  const plans = [
    { 
      id: 'monthly',
      name: 'شهري', 
      nameEn: 'Monthly',
      price: 29, 
      priceId: 'price_monthly',
      duration: 'شهر واحد',
      features: [
        'مشاهدة جميع الأفلام والمسلسلات', 
        'إعادة كاملة', 
        'جودة 4K', 
        'ملخصات حصرية',
        'دعم فني 24/7'
      ] 
    },
    { 
      id: 'yearly',
      name: 'سنوي', 
      nameEn: 'Yearly',
      price: 199, 
      priceId: 'price_yearly',
      duration: '12 شهراً',
      features: [
        'خصم 45%', 
        'تحميل المباريات', 
        'أولوية الدعم', 
        'بدون إعلانات',
        'مشاهدة على 4 أجهزة',
        'محتوى حصري إضافي',
        'هدية شهر مجاني'
      ], 
      popular: true 
    },
    { 
      id: 'lifetime',
      name: 'مدى الحياة', 
      nameEn: 'Lifetime',
      price: 499, 
      priceId: 'price_lifetime',
      duration: 'مدى الحياة',
      features: [
        'خصم 70%', 
        'تحميل غير محدود', 
        'دعم VIP', 
        'بدون إعلانات',
        'مشاهدة على 10 أجهزة',
        'محتوى حصري',
        'تحديثات مجانية مدى الحياة'
      ] 
    },
  ];

  const paymentMethods = [
    { id: 'stripe', name: 'بطاقة ائتمان', icon: FaCreditCard, color: 'from-blue-600 to-blue-500' },
    { id: 'paypal', name: 'PayPal', icon: FaPaypal, color: 'from-blue-700 to-blue-600' },
  ];

  const handleApplyCoupon = () => {
    if (couponCode === 'WELCOME50') {
      setDiscount(50);
      alert('تم تطبيق خصم 50%!');
    } else if (couponCode === 'SAVE20') {
      setDiscount(20);
      alert('تم تطبيق خصم 20%!');
    } else {
      alert('كود الخصم غير صالح');
    }
  };

  const getFinalPrice = (price) => {
    return price - (price * discount / 100);
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData);
    setIsSubscribed(true);
    setShowPayment(false);
    alert('✅ تم تفعيل اشتراكك بنجاح! شكراً لثقتك بنا.');
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    alert('❌ حدث خطأ في عملية الدفع. يرجى المحاولة مرة أخرى.');
  };

  if (isSubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black flex items-center justify-center">
        <div className="text-center bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-green-500/30 max-w-md">
          <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <FaCheckCircle className="text-green-500 text-4xl" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">أنت مشترك بالفعل! 🎉</h1>
          <p className="text-gray-400 mb-6">استمتع بمشاهدة جميع المحتويات الحصرية</p>
          <Link to="/" className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-2 rounded-lg inline-block">
            العودة للمشاهدة
          </Link>
        </div>
      </div>
    );
  }

  if (showPayment && selectedPlan && paymentMethod) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black py-12 px-4">
        <div className="max-w-md mx-auto">
          <button 
            onClick={() => setShowPayment(false)}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            ← العودة للباقات
          </button>
          
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">إتمام الدفع</h2>
              <p className="text-gray-400">{selectedPlan.name} - {selectedPlan.duration}</p>
              <div className="mt-2 text-3xl font-bold text-purple-400">
                {getFinalPrice(selectedPlan.price)} {selectedPlan.price === 499 ? '$' : '₪'}
                {discount > 0 && (
                  <span className="text-sm text-gray-500 line-through mr-2">${selectedPlan.price}</span>
                )}
              </div>
            </div>

            {paymentMethod.id === 'stripe' ? (
              <StripePayment
                amount={getFinalPrice(selectedPlan.price)}
                currency="USD"
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            ) : (
              <PayPalPayment
                amount={getFinalPrice(selectedPlan.price)}
                currency="USD"
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black">
      {/* Hero Section */}
      <div className="relative h-[40vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-black" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=400&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="relative h-full container-custom flex flex-col justify-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            اختر <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">باقة الاشتراك</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl">
            احصل على تجربة مشاهدة فائقة مع ميزات حصرية وباقات تناسب احتياجاتك
          </p>
          <div className="flex items-center gap-2 mt-4">
            <FaGift className="text-yellow-500" />
            <span className="text-yellow-500">7 أيام تجريبية مجانية على جميع الباقات!</span>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="container-custom py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-2 ${
              plan.popular ? 'border-purple-500 shadow-xl shadow-purple-500/20' : 'border-gray-800'
            }`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-1 rounded-full text-sm flex items-center gap-1">
                  <FaStar className="text-sm" /> الأكثر طلباً
                </div>
              )}
              
              <h2 className="text-2xl font-bold text-white mb-2">{plan.name}</h2>
              <p className="text-gray-400 text-sm mb-4">{plan.duration}</p>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">${getFinalPrice(plan.price)}</span>
                {plan.id !== 'lifetime' && <span className="text-gray-400">/{plan.id === 'monthly' ? 'شهر' : 'سنة'}</span>}
              </div>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <FaCheckCircle className="text-purple-500 text-sm" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => {
                  setSelectedPlan(plan);
                  setShowCouponInput(false);
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
              >
                اختر الباقة
              </button>
            </div>
          ))}
        </div>

        {/* اختيار طريقة الدفع بعد اختيار الباقة */}
        {selectedPlan && !showPayment && (
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <h3 className="text-white text-xl font-bold mb-4">اختر طريقة الدفع</h3>
              
              {/* كود الخصم */}
              <div className="mb-6">
                <button onClick={() => setShowCouponInput(!showCouponInput)} className="text-purple-400 text-sm hover:text-purple-300">
                  {showCouponInput ? 'إخفاء' : 'لديك كود خصم؟'}
                </button>
                {showCouponInput && (
                  <div className="flex gap-2 mt-2">
                    <input type="text" placeholder="أدخل كود الخصم" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" />
                    <button onClick={handleApplyCoupon} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">تطبيق</button>
                  </div>
                )}
              </div>

              {/* طرق الدفع */}
              <div className="grid grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => { setPaymentMethod(method); setShowPayment(true); }}
                    className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${paymentMethod?.id === method.id ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-purple-500/50'}`}
                  >
                    <method.icon className="text-2xl text-purple-400" />
                    <span className="text-white">{method.name}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 text-center text-gray-500 text-xs flex items-center justify-center gap-2">
                <FaLock className="text-xs" /> مدفوعات آمنة 100% مشفرة
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;