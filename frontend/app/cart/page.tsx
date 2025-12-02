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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-black text-gray-900 dark:text-white transition-colors duration-300">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <div className="text-6xl mb-6 animate-bounce">🛒</div>
          <h1 className="text-4xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">Looks like you haven't added any screens yet.</p>
          <Link href="/products" className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-blue-500/30">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-black text-gray-900 dark:text-white transition-colors duration-300">
      <Navbar />
      
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-4 py-12 pt-24">
        <h1 className="text-4xl font-black mb-8">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            Shopping Cart
          </span>
        </h1>
        
        <div className="flex flex-col gap-12">
          {/* Rental Section */}
          {rentalItems.length > 0 && (
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-white/10 p-6 shadow-xl dark:shadow-none transition-colors duration-300">
                <h2 className="text-2xl font-bold mb-6 text-purple-600 dark:text-purple-400 flex items-center">
                  <span className="mr-3 p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">🔄</span> Rental Items
                </h2>
                {rentalItems.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center py-6 border-b border-gray-200 dark:border-white/10 last:border-0 gap-6">
                    {/* Product Image */}
                    <div className="h-24 w-24 bg-gray-100 dark:bg-black/40 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-600 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-white/10">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">📺</span>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.title}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">{item.variantName}</p>
                        </div>
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          ${item.price}<span className="text-sm font-normal text-gray-500">/day</span>
                        </p>
                      </div>

                      {/* Rental Date Selection */}
                      <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-100 dark:border-purple-500/20">
                        <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3">Select Rental Period</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-purple-600/70 dark:text-purple-300/70 mb-1">Start Date</label>
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
                              className="w-full px-3 py-2 bg-white dark:bg-black/30 border border-purple-200 dark:border-purple-500/30 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-purple-600/70 dark:text-purple-300/70 mb-1">End Date</label>
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
                              className="w-full px-3 py-2 bg-white dark:bg-black/30 border border-purple-200 dark:border-purple-500/30 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                            />
                          </div>
                        </div>
                        {item.rentDays && item.rentDays > 0 && (
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 text-right">
                            Duration: <span className="font-bold">{item.rentDays} days</span>
                          </p>
                        )}
                      </div>
                      
                      {/* Quantity and Remove */}
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Quantity:</span>
                          <div className="flex items-center bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors">-</button>
                            <span className="w-8 text-center font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors">+</button>
                          </div>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm font-medium flex items-center transition-colors">
                          <span className="mr-1">🗑️</span> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rental Summary */}
              <div className="w-full lg:w-96">
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-white/10 p-6 sticky top-24 shadow-xl dark:shadow-none transition-colors duration-300">
                  <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Rental Summary</h3>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-white/10">
                    <span>Total Estimate</span>
                    <span className="font-bold text-2xl text-purple-600 dark:text-purple-400">${rentalTotal}</span>
                  </div>
                  
                  {/* Delivery Address */}
                  <div className="mb-6 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Delivery Address</h4>
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={rentalAddress.street}
                      onChange={(e) => setRentalAddress({ ...rentalAddress, street: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-500/50 outline-none transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={rentalAddress.city}
                      onChange={(e) => setRentalAddress({ ...rentalAddress, city: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-500/50 outline-none transition-colors"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={rentalAddress.phone}
                      onChange={(e) => setRentalAddress({ ...rentalAddress, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-500/50 outline-none transition-colors"
                    />
                  </div>
                  
                  {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-lg">{error}</div>}
                  <button 
                    onClick={handleRentalCheckout}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {loading ? 'Processing...' : 'Checkout Rentals'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Section */}
          {saleItems.length > 0 && (
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-white/10 p-6 shadow-xl dark:shadow-none transition-colors duration-300">
                <h2 className="text-2xl font-bold mb-6 text-green-600 dark:text-green-400 flex items-center">
                  <span className="mr-3 p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">🛒</span> Purchase Items
                </h2>
                {saleItems.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center py-6 border-b border-gray-200 dark:border-white/10 last:border-0 gap-6">
                    {/* Product Image */}
                    <div className="h-24 w-24 bg-gray-100 dark:bg-black/40 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-600 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-white/10">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">📺</span>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.title}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">{item.variantName}</p>
                        </div>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">${item.price}</p>
                      </div>
                      
                      {/* Quantity and Remove */}
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Quantity:</span>
                          <div className="flex items-center bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors">-</button>
                            <span className="w-8 text-center font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors">+</button>
                          </div>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm font-medium flex items-center transition-colors">
                          <span className="mr-1">🗑️</span> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Purchase Summary */}
              <div className="w-full lg:w-96">
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-white/10 p-6 sticky top-24 shadow-xl dark:shadow-none transition-colors duration-300">
                  <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Purchase Summary</h3>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-white/10">
                    <span>Subtotal</span>
                    <span className="font-bold text-2xl text-green-600 dark:text-green-400">${saleTotal}</span>
                  </div>
                  
                  {/* Shipping Address */}
                  <div className="mb-6 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Shipping Address</h4>
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={purchaseAddress.street}
                      onChange={(e) => setPurchaseAddress({ ...purchaseAddress, street: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:border-green-500 dark:focus:border-green-500/50 outline-none transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={purchaseAddress.city}
                      onChange={(e) => setPurchaseAddress({ ...purchaseAddress, city: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:border-green-500 dark:focus:border-green-500/50 outline-none transition-colors"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={purchaseAddress.phone}
                      onChange={(e) => setPurchaseAddress({ ...purchaseAddress, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:border-green-500 dark:focus:border-green-500/50 outline-none transition-colors"
                    />
                  </div>
                  
                  {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-lg">{error}</div>}
                  <button 
                    onClick={handleSaleCheckout}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {loading ? 'Processing...' : 'Checkout Purchases'}
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
