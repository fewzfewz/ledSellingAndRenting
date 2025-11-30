'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import PaymentCheckout from '../../../components/PaymentCheckout';
import { useAuth } from '../../../contexts/AuthContext';

export default function TestPaymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState(1000);
  const [showCheckout, setShowCheckout] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to make a payment</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Test Payment</h1>

        {!showCheckout ? (
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Enter Amount</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (ETB)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowCheckout(true)}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Proceed to Payment
            </button>
          </div>
        ) : (
          <PaymentCheckout
            amount={amount}
            currency="ETB"
            onCancel={() => setShowCheckout(false)}
            onSuccess={() => {
              // Payment initiated, user will be redirected
            }}
          />
        )}
      </div>
    </div>
  );
}
