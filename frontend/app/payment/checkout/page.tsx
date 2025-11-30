'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import PaymentCheckout from '../../../components/PaymentCheckout';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const rentalId = searchParams.get('rentalId');
  const orderId = searchParams.get('orderId');
  const amount = parseFloat(searchParams.get('amount') || '0');

  if ((!rentalId && !orderId) || amount <= 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Invalid Checkout Request</h1>
          <p className="text-gray-600">Missing rental information or invalid amount.</p>
          <button 
            onClick={() => router.push('/cart')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>
          
          <PaymentCheckout
            amount={amount}
            rental_id={rentalId || undefined}
            order_id={orderId || undefined}
            onSuccess={() => {
              console.log('Payment initiated');
            }}
            onCancel={() => router.push('/cart')}
          />
        </div>
      </div>
    </div>
  );
}
