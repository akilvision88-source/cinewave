import React, { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { FaCreditCard, FaLock, FaShieldAlt } from 'react-icons/fa';

const stripePromise = loadStripe('YOUR_STRIPE_PUBLIC_KEY');

const CheckoutForm = ({ amount, currency, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    
    // محاكاة الدفع (استبدلها بـ API حقيقي)
    setTimeout(() => {
      setProcessing(false);
      onSuccess({ transactionId: 'STRIPE_' + Date.now(), amount });
    }, 2000);
  };

  const cardElementOptions = {
    style: {
      base: {
        color: '#fff',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': { color: '#aab7c4' }
      },
      invalid: { color: '#fa755a', iconColor: '#fa755a' }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <CardElement options={cardElementOptions} onChange={(e) => setCardComplete(e.complete)} />
      </div>
      <button
        type="submit"
        disabled={!stripe || processing || !cardComplete}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {processing ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <FaLock className="text-sm" /> دفع {amount} {currency}
          </>
        )}
      </button>
    </form>
  );
};

const StripePayment = (props) => (
  <Elements stripe={stripePromise}>
    <CheckoutForm {...props} />
  </Elements>
);

export default StripePayment;