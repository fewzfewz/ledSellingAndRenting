'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Navbar from '../../../components/Navbar';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, loading: authLoading } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [error, setError] = useState('');

  // Accept multiple param names from providers (Chapa/Telebirr)
  const tx_ref = searchParams.get('tx_ref') || searchParams.get('trx_ref') || searchParams.get('out_trade_no');
  const status = searchParams.get('status');

  useEffect(() => {
    // Wait for auth to initialize
    if (authLoading) return;

    // Check URL params first
    let ref = tx_ref;
    
    // Fallback to localStorage
    if (!ref) {
      const storedRef = localStorage.getItem('pending_payment_ref');
      if (storedRef) {
        ref = storedRef;
      }
    }

    if (ref) {
      if (token) {
        setError(''); // Clear any previous errors
        setVerifying(true);
        verifyPayment(ref);
      } else {
        setVerifying(false);
        setError('Please log in to verify your payment.');
      }
    } else if (status === 'success') {
      setVerifying(false);
      setPaymentStatus({ status: 'success' });
    } else {
      // No parameters present
      setVerifying(false);
      setError('No payment information found. Please check your dashboard.');
    }
  }, [tx_ref, token, status, authLoading]);

  const verifyPayment = async (ref: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
      
      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(`${apiBase}/payments/verify/${ref}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();
      
      if (data.success) {
        setPaymentStatus(data);
        localStorage.removeItem('pending_payment_ref'); // Clear stored ref
      } else {
        setError('Payment verification failed');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Verification timed out. Please check your dashboard for order status.');
      } else {
        setError(err.message || 'Failed to verify payment');
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {verifying ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment...</h2>
              <p className="text-gray-600">Please wait while we confirm your payment</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              {error.includes('log in') ? (
                <button
                  onClick={() => router.push(`/login?redirect=/payment/success?tx_ref=${tx_ref}`)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Log In to Verify
                </button>
              ) : (
                <button
                  onClick={() => router.push('/products')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Back to Products
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-8">
                Your payment has been processed successfully. You will receive a confirmation email shortly.
              </p>
              
              {tx_ref && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">Transaction Reference</p>
                  <p className="font-mono text-sm font-semibold text-gray-900">{tx_ref}</p>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/products')}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  View Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
