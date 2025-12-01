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
  
  // Address states
  const [rentalAddress, setRentalAddress] = useState({ street: '', city: '', phone: '' });
  const [purchaseAddress, setPurchaseAddress] = useState({ street: '', city: '', phone: '' });

  // Calculate totals separately
  const rentalItems = items.filter(item => item.type === 'rent');
  const saleItems = items.filter(item => item.type === 'buy');
  
  const rentalTotal = rentalItems.reduce((sum, item) => sum + (item.price * item.quantity * (item.rentDays || 1)), 0);
  const saleTotal = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleRentalCheckout = async () => {
    setError('');
    if (!user) {
      router.push('/login?redirect=/cart');
      return;
    }

    setLoading(true);
    try {
      // Validate that all rental items have dates selected
      const missingDates = rentalItems.some(item => !item.rentStartDate || !item.rentEndDate);
      if (missingDates) {
        setError('Please select rental start and end dates for all rental items to proceed.');
        setLoading(false);
        return;
      }

      // Use the first rental item's dates (assuming all rentals use same period for simplicity)
      const firstRental = rentalItems[0];
      
      // Validate address
      if (!rentalAddress.street || !rentalAddress.city || !rentalAddress.phone) {
        setError('Please fill in all delivery address fields.');
        setLoading(false);
        return;
      }

      const rentalData = {
        user_id: user.id,
        start_date: firstRental.rentStartDate,
        end_date: firstRental.rentEndDate,
        delivery_address: rentalAddress,
        items: rentalItems.map(item => ({
          variant_id: item.variantId,
          quantity: item.quantity,
          unit_rent_price: item.price
        }))
      };

      const res = await apiPost('/rentals', rentalData);
      
      // Only remove rental items from cart
      rentalItems.forEach(item => removeItem(item.id));
      router.push(`/payment/checkout?rentalId=${res.rentalId}&amount=${rentalTotal}`);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create rental request. Please try again.');
      setLoading(false);
    }
  };

  const handleSaleCheckout = async () => {
    setError('');
    if (!user) {
      router.push('/login?redirect=/cart');
      return;
    }

    setLoading(true);
    try {
      // Validate address
      if (!purchaseAddress.street || !purchaseAddress.city || !purchaseAddress.phone) {
        setError('Please fill in all shipping address fields.');
        setLoading(false);
        return;
      }

      const orderData = {
        user_id: user.id,
        items: saleItems.map(item => ({
          variant_id: item.variantId,
          quantity: item.quantity,
          unit_price: item.price
        })),
        shipping_address: purchaseAddress,
        billing_address: purchaseAddress
      };

      const res = await apiPost('/sales_orders', orderData);
      
      // Only remove sale items from cart
      saleItems.forEach(item => removeItem(item.id));
      router.push(`/payment/checkout?orderId=${res.orderId}&amount=${res.total_amount}`);
      
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
        
        <div className="flex flex-col gap-12">
          {/* Rental Section */}
          {rentalItems.length > 0 && (
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                <h2 className="text-xl font-bold mb-6 text-purple-900 flex items-center">
                  <span className="mr-2">🔄</span> Rental Items
                </h2>
                {rentalItems.map(item => (
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
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          ${item.price}<span className="text-sm font-normal text-gray-500">/day</span>
                        </p>
                      </div>

                      {/* Rental Date Selection */}
                      <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <h4 className="text-sm font-semibold text-purple-900 mb-3">Select Rental Period</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-purple-800 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={item.rentStartDate ? new Date(item.rentStartDate).toISOString().split('T')[0] : ''}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => {
                                const startDate = e.target.value;
                                const endDate = item.rentEndDate;
                                let days = 1;
                                if (startDate && endDate) {
                                  const start = new Date(startDate);
                                  const end = new Date(endDate);
                                  const diffTime = Math.abs(end.getTime() - start.getTime());
                                  days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                  if (days < 1) days = 1;
                                }
                                updateItem(item.id, { rentStartDate: startDate, rentDays: days });
                              }}
                              className="w-full px-3 py-2 border border-purple-200 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-purple-800 mb-1">End Date</label>
                            <input
                              type="date"
                              value={item.rentEndDate ? new Date(item.rentEndDate).toISOString().split('T')[0] : ''}
                              min={item.rentStartDate ? new Date(item.rentStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                              onChange={(e) => {
                                const endDate = e.target.value;
                                const startDate = item.rentStartDate;
                                let days = 1;
                                if (startDate && endDate) {
                                  const start = new Date(startDate);
                                  const end = new Date(endDate);
                                  const diffTime = Math.abs(end.getTime() - start.getTime());
                                  days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                  if (days < 1) days = 1;
                                }
                                updateItem(item.id, { rentEndDate: endDate, rentDays: days });
                              }}
                              className="w-full px-3 py-2 border border-purple-200 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                        {item.rentDays && item.rentDays > 0 && (
                          <p className="text-xs text-purple-700 mt-2 text-right">
                            Duration: <span className="font-bold">{item.rentDays} days</span>
                          </p>
                        )}
                      </div>
                      
                      {/* Quantity and Remove */}
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500">Quantity:</span>
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600">-</button>
                            <span className="w-8 text-center font-medium text-gray-900">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600">+</button>
                          </div>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center transition-colors">
                          <span className="mr-1">🗑️</span> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rental Summary */}
              <div className="w-full lg:w-96">
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 border-t-4 border-purple-500">
                  <h3 className="text-lg font-bold mb-4 text-purple-900">Rental Summary</h3>
                  <div className="flex justify-between text-gray-600 mb-4">
                    <span>Total Estimate</span>
                    <span className="font-bold text-gray-900">${rentalTotal}</span>
                  </div>
                  
                  {/* Delivery Address */}
                  <div className="mb-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">Delivery Address</h4>
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={rentalAddress.street}
                      onChange={(e) => setRentalAddress({ ...rentalAddress, street: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={rentalAddress.city}
                      onChange={(e) => setRentalAddress({ ...rentalAddress, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={rentalAddress.phone}
                      onChange={(e) => setRentalAddress({ ...rentalAddress, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  
                  {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
                  <button 
                    onClick={handleRentalCheckout}
                    disabled={loading}
                    className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    Checkout Rentals
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Section */}
          {saleItems.length > 0 && (
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                <h2 className="text-xl font-bold mb-6 text-green-900 flex items-center">
                  <span className="mr-2">🛒</span> Purchase Items
                </h2>
                {saleItems.map(item => (
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
                        </div>
                        <p className="text-lg font-bold text-gray-900">${item.price}</p>
                      </div>
                      
                      {/* Quantity and Remove */}
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500">Quantity:</span>
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600">-</button>
                            <span className="w-8 text-center font-medium text-gray-900">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600">+</button>
                          </div>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center transition-colors">
                          <span className="mr-1">🗑️</span> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Purchase Summary */}
              <div className="w-full lg:w-96">
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 border-t-4 border-green-500">
                  <h3 className="text-lg font-bold mb-4 text-green-900">Purchase Summary</h3>
                  <div className="flex justify-between text-gray-600 mb-4">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-900">${saleTotal}</span>
                  </div>
                  
                  {/* Shipping Address */}
                  <div className="mb-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">Shipping Address</h4>
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={purchaseAddress.street}
                      onChange={(e) => setPurchaseAddress({ ...purchaseAddress, street: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={purchaseAddress.city}
                      onChange={(e) => setPurchaseAddress({ ...purchaseAddress, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={purchaseAddress.phone}
                      onChange={(e) => setPurchaseAddress({ ...purchaseAddress, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  
                  {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
                  <button 
                    onClick={handleSaleCheckout}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Checkout Purchases
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
