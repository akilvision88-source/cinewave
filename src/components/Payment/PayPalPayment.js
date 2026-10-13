import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { FaPaypal, FaLock, FaShieldAlt } from 'react-icons/fa';

const PayPalPayment = ({ amount, currency = 'USD', onSuccess, onError }) => {
  const [processing, setProcessing] = useState(false);

  const initialOptions = {
    clientId: 'YOUR_PAYPAL_CLIENT_ID',
    currency: currency,
    intent: 'capture',
  };

  const createOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [{
        amount: { value: amount, currency_code: currency }
      }]
    });
  };

  const onApprove = (data, actions) => {
    return actions.order.capture().then((details) => {
      onSuccess({ transactionId: details.id, amount });
    });
  };

  const onError = (err) => {
    console.error('PayPal Error:', err);
    onError('PayPal payment failed');
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="space-y-4">
        <PayPalButtons
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onError}
          style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
        />
        <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
          <FaShieldAlt /> مدفوعات آمنة 100% مشفرة
        </div>
      </div>
    </PayPalScriptProvider>
  );
};

export default PayPalPayment;