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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setError('');
    if (!user) {
      router.push('/login?redirect=/cart');
      return;
    }

    setLoading(true);
    try {
      // Separate items into rentals and sales
      const rentalItems = items.filter(item => item.type === 'rent');
      const saleItems = items.filter(item => item.type === 'buy');

      if (rentalItems.length > 0) {
        // Validate that all rental items have dates selected
        const missingDates = rentalItems.some(item => !item.rentStartDate || !item.rentEndDate);
        if (missingDates) {
          setError('Please select rental start and end dates for all rental items to proceed.');
          setLoading(false);
          return;
        }

        // Use the first rental item's dates (assuming all rentals use same period for simplicity)
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
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create order. Please try again.');
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
              <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center py-6 border-b last:border-0 gap-6">
                {/* Product Image */}
                <div className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">📺</span>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-500 text-sm">{item.variantName}</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                        item.type === 'rent' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {item.type === 'rent' ? 'Rental' : 'Purchase'}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      ${item.price}
                      {item.type === 'rent' && <span className="text-sm font-normal text-gray-500">/day</span>}
                    </p>
                  </div>

                  {/* Rental Date Selection */}
                  {item.type === 'rent' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h4 className="text-sm font-semibold text-blue-900 mb-3">Select Rental Period</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-blue-800 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={item.rentStartDate ? new Date(item.rentStartDate).toISOString().split('T')[0] : ''}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => {
                              const startDate = e.target.value;
                              const endDate = item.rentEndDate;
                              
                              // Calculate days if both dates exist
                              let days = 1;
                              if (startDate && endDate) {
                                const start = new Date(startDate);
                                const end = new Date(endDate);
                                const diffTime = Math.abs(end.getTime() - start.getTime());
                                days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
                                if (days < 1) days = 1;
                              }

                              updateItem(item.id, { 
                                rentStartDate: startDate,
                                rentDays: days
                              });
                            }}
                            className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                              !item.rentStartDate ? 'border-red-300 bg-red-50' : 'border-blue-200'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-blue-800 mb-1">End Date</label>
                          <input
                            type="date"
                            value={item.rentEndDate ? new Date(item.rentEndDate).toISOString().split('T')[0] : ''}
                            min={item.rentStartDate ? new Date(item.rentStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                            onChange={(e) => {
                              const endDate = e.target.value;
                              const startDate = item.rentStartDate;
                              
                              // Calculate days
                              let days = 1;
                              if (startDate && endDate) {
                                const start = new Date(startDate);
                                const end = new Date(endDate);
                                const diffTime = Math.abs(end.getTime() - start.getTime());
                                days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
                                if (days < 1) days = 1;
                              }

                              updateItem(item.id, { 
                                rentEndDate: endDate,
                                rentDays: days
                              });
                            }}
                            className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                              !item.rentEndDate ? 'border-red-300 bg-red-50' : 'border-blue-200'
                            }`}
                          />
                        </div>
                      </div>
                      {item.rentDays && item.rentDays > 0 && (
                        <p className="text-xs text-blue-700 mt-2 text-right">
                          Duration: <span className="font-bold">{item.rentDays} days</span>
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Quantity and Remove */}
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">Quantity:</span>
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center transition-colors"
                    >
                      <span className="mr-1">🗑️</span> Remove
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

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}

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
