'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { apiGet } from '../../lib/api';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'rentals' | 'orders'>('rentals');
  const [rentals, setRentals] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    if (user.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    fetchData();
  }, [user, router, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rentalsData, ordersData] = await Promise.all([
        apiGet('/rentals'),
        apiGet('/sales_orders')
      ]);
      setRentals(rentalsData);
      setOrders(ordersData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      active: 'bg-green-100 text-green-800',
      delivered: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      shipped: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const getDeliveryProgress = (status: string, type: 'rental' | 'order') => {
    const rentalSteps = ['pending', 'confirmed', 'in_transit', 'active', 'returned'];
    const orderSteps = ['pending', 'paid', 'processing', 'in_transit', 'delivered'];
    const steps = type === 'rental' ? rentalSteps : orderSteps;
    const currentIndex = steps.indexOf(status);
    
    if (currentIndex === -1 || status === 'cancelled' || status === 'completed') return null;
    
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <span>Order Progress</span>
          <span>{Math.round(((currentIndex + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="flex items-center gap-1">
          {steps.map((step, idx) => (
            <div key={step} className="flex-1">
              <div className={`h-2 rounded-full ${
                idx <= currentIndex ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{steps[0].replace('_', ' ')}</span>
          <span>{steps[steps.length - 1].replace('_', ' ')}</span>
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

// Helper to calculate days remaining
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleConfirmReceipt = async (id: string, type: 'rental' | 'order') => {
    if (!confirm('Confirm that you have received the items?')) return;
    try {
      const endpoint = type === 'rental' ? `/rentals/${id}` : `/sales_orders/${id}`;
      const status = type === 'rental' ? 'active' : 'delivered'; // Rental becomes active, Order becomes delivered
      
      await fetch(`http://localhost:4000/api${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

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
            My Dashboard
          </span>
        </h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200 dark:border-white/10">
          <button
            onClick={() => setActiveTab('rentals')}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === 'rentals'
                ? 'border-b-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            My Rentals ({rentals.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === 'orders'
                ? 'border-b-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            My Orders ({orders.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block relative">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading your activity...</p>
          </div>
        ) : (
          <>
            {/* Rentals Tab */}
            {activeTab === 'rentals' && (
              <div className="space-y-6">
                {rentals.length === 0 ? (
                  <div className="bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-white/10 p-12 text-center shadow-xl dark:shadow-none transition-colors duration-300">
                    <div className="text-6xl mb-4">📺</div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">You haven't made any rental bookings yet.</p>
                    <a href="/products" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-blue-500/20">
                      Browse LED Screens →
                    </a>
                  </div>
                ) : (
                  rentals.map((rental) => {
                    const daysLeft = getDaysRemaining(rental.end_date);
                    const isActive = rental.status === 'active';
                    
                    return (
                      <div key={rental.id} className="bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-white/10 p-6 hover:border-blue-300 dark:hover:border-white/20 transition-all group shadow-lg dark:shadow-none">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Rental #{rental.id.slice(0, 8)}
                              </h3>
                              {getStatusBadge(rental.status)}
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                              {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                            </p>
                            {isActive && (
                              <p className={`text-sm font-bold mt-2 ${daysLeft < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                {daysLeft < 0 ? `Overdue by ${Math.abs(daysLeft)} days` : `${daysLeft} days remaining`}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              ${rental.total_amount}
                            </p>
                            {rental.status === 'confirmed' && (
                              <button 
                                onClick={() => handleConfirmReceipt(rental.id, 'rental')}
                                className="text-sm bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30 px-4 py-2 rounded-lg hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors"
                              >
                                Confirm Receipt
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Delivery Progress */}
                        <div className="bg-gray-100 dark:bg-black/20 rounded-xl p-4 mb-4">
                          {getDeliveryProgress(rental.status, 'rental')}
                        </div>
                        
                        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-white/10">
                          <button
                            onClick={() => router.push(`/rentals/${rental.id}`)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-2 group-hover:translate-x-1 transition-transform"
                          >
                            View Details <span className="text-lg">→</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {orders.length === 0 ? (
                  <div className="bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-white/10 p-12 text-center shadow-xl dark:shadow-none transition-colors duration-300">
                    <div className="text-6xl mb-4">🛒</div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">You haven't placed any orders yet.</p>
                    <a href="/products" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-blue-500/20">
                      Browse LED Screens →
                    </a>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-white/10 p-6 hover:border-blue-300 dark:hover:border-white/20 transition-all group shadow-lg dark:shadow-none">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              Order #{order.id.slice(0, 8)}
                            </h3>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Placed on {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            ${order.total_amount}
                          </p>
                          {order.status === 'shipped' && (
                            <button 
                              onClick={() => handleConfirmReceipt(order.id, 'order')}
                              className="text-sm bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30 px-4 py-2 rounded-lg hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors"
                            >
                              Confirm Delivery
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Delivery Progress */}
                      <div className="bg-gray-100 dark:bg-black/20 rounded-xl p-4 mb-4">
                        {getDeliveryProgress(order.status, 'order')}
                      </div>
                      
                      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-white/10">
                        <button
                          onClick={() => router.push(`/orders/${order.id}`)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-2 group-hover:translate-x-1 transition-transform"
                        >
                          View Details <span className="text-lg">→</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
