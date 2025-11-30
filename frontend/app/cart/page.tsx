'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiPost } from '../../lib/api';

export default function CartPage() {
  const { items, removeItem, updateQuantity, updateItem, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login?redirect=/cart');
      return;
    }

    setLoading(true);
    try {
      // Separate items into rentals and sales
      const rentalItems = items.filter(item => item.type === 'rent');
      const saleItems = items.filter(item => item.type === 'buy');

      // For now, let's handle just one type or mixed. 
      // If mixed, we might need to create two separate orders or a unified one.
      // Let's assume we create a "Sales Order" for buy items and "Rental" for rent items.
      // For simplicity in this MVP, let's just process them sequentially or error if mixed (or just handle one).
      
      // Actually, let's just create a Rental if there are rental items (and include sale items as extras? No, usually separate).
      // Let's just support one flow for now or create multiple.
      
      if (rentalItems.length > 0) {
        // Validate that all rental items have dates selected
        const missingDates = rentalItems.some(item => !item.rentStartDate || !item.rentEndDate);
        if (missingDates) {
          alert('Please select rental dates for all rental items');
          setLoading(false);
          return;
        }

        // Use the first rental item's dates (assuming all rentals use same period for simplicity)
        // In a more complex system, you might handle multiple rental periods
        const firstRental = rentalItems[0];
        
        const rentalData = {
          user_id: user.id,
          start_date: firstRental.rentStartDate,
          end_date: firstRental.rentEndDate,
          items: rentalItems.map(item => ({
            variant_id: item.variantId,
            quantity: item.quantity,
            unit_rent_price: item.price
          }))
        };

        const res = await apiPost('/rentals', rentalData);
        
        clearCart(); // Clear cart after successful order creation
        router.push(`/payment/checkout?rentalId=${res.rentalId}&amount=${cartTotal}`);
      } else if (saleItems.length > 0) {
        // Create Sales Order
        const orderData = {
          user_id: user.id,
          items: saleItems.map(item => ({
            variant_id: item.variantId,
            quantity: item.quantity,
            unit_price: item.price
          })),
          shipping_address: null, // Can be added later
          billing_address: null
        };

        const res = await apiPost('/sales_orders', orderData);
        
        clearCart(); // Clear cart after successful order creation
        router.push(`/payment/checkout?orderId=${res.orderId}&amount=${res.total_amount}`);
      }
      
    } catch (err) {
      console.error(err);
      alert('Failed to create order');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Looks like you haven't added any screens yet.</p>
          <Link href="/products" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1 bg-white rounded-xl shadow-sm p-6">
            {items.map(item => (
              <div key={item.id} className="flex items-center py-6 border-b last:border-0">
                <div className="h-24 w-24 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">
                  Img
                </div>
                <div className="ml-6 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-500 text-sm">{item.variantName}</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                        item.type === 'rent' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {item.type === 'rent' ? 'Rental' : 'Purchase'}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">${item.price}</p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-96">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${cartTotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (Estimated)</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t pt-4 flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>${cartTotal}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                Secure checkout powered by Stripe, Chapa & Telebirr
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
