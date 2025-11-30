'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface PaymentMethod {
  id: string;
  name: string;
  provider: 'stripe' | 'chapa' | 'telebirr';
  logo?: string;
  description: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'chapa',
    name: 'Chapa',
    provider: 'chapa',
    description: 'Pay with Telebirr, CBE Birr, Ebirr, or Mpesa'
  },
  {
    id: 'telebirr',
    name: 'Telebirr',
    provider: 'telebirr',
    description: 'Pay directly with Telebirr'
  },
  {
    id: 'stripe',
    name: 'Credit/Debit Card',
    provider: 'stripe',
    description: 'Pay with Visa, Mastercard, or Amex'
  }
];

interface PaymentCheckoutProps {
  amount: number;
  currency?: string;
  rental_id?: string;
  order_id?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PaymentCheckout({
  amount,
  currency = 'ETB',
  rental_id,
  order_id,
  onSuccess,
  onCancel
}: PaymentCheckoutProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('chapa');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token, user } = useAuth();
  const router = useRouter();

  const handlePayment = async () => {
    if (!token) {
      setError('Please login to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api'}/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount,
          currency,
          provider: selectedMethod as 'stripe' | 'chapa' | 'telebirr',
          rental_id,
          order_id,
          customer_info: {
            email: user?.email,
            first_name: user?.name?.split(' ')[0] || 'Customer',
            last_name: user?.name?.split(' ')[1] || ''
          }
        })
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.clientSecret) {
        router.push(`/payment/stripe?client_secret=${data.clientSecret}`);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Payment</h2>

      {/* Amount Display */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">Total Amount</span>
          <span className="text-3xl font-bold text-blue-600">
            {currency} {amount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedMethod === method.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{method.name}</div>
                  <div className="text-sm text-gray-600">{method.description}</div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === method.id
                      ? 'border-blue-600'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedMethod === method.id && (
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handlePayment}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : `Pay ${currency} ${amount.toLocaleString()}`}
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>🔒 Your payment is secure and encrypted</p>
      </div>
    </div>
  );
}
