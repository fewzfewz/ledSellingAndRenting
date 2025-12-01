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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('rentals')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'rentals'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Rentals ({rentals.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'orders'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Orders ({orders.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {/* Rentals Tab */}
            {activeTab === 'rentals' && (
              <div className="space-y-4">
                {rentals.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <p className="text-gray-500 mb-4">You haven't made any rental bookings yet.</p>
                    <a href="/products" className="text-blue-600 hover:text-blue-700 font-medium">
                      Browse LED Screens →
                    </a>
                  </div>
                ) : (
                  rentals.map((rental) => {
                    const daysLeft = getDaysRemaining(rental.end_date);
                    const isActive = rental.status === 'active';
                    
                    return (
                      <div key={rental.id} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Rental #{rental.id.slice(0, 8)}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                            </p>
                            {isActive && (
                              <p className={`text-sm font-bold mt-1 ${daysLeft < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {daysLeft < 0 ? `Overdue by ${Math.abs(daysLeft)} days` : `${daysLeft} days remaining`}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(rental.status)}
                            {rental.status === 'confirmed' && (
                              <button 
                                onClick={() => handleConfirmReceipt(rental.id, 'rental')}
                                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                              >
                                Confirm Receipt
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Delivery Progress */}
                        {getDeliveryProgress(rental.status, 'rental')}
                        
                        <div className="flex justify-between items-center mt-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              Total Amount: <span className="font-semibold text-gray-900">${rental.total_amount}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => router.push(`/rentals/${rental.id}`)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View Details →
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
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
                    <a href="/products" className="text-blue-600 hover:text-blue-700 font-medium">
                      Browse LED Screens →
                    </a>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Order #{order.id.slice(0, 8)}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Placed on {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(order.status)}
                          {order.status === 'shipped' && (
                            <button 
                              onClick={() => handleConfirmReceipt(order.id, 'order')}
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                            >
                              Confirm Delivery
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Delivery Progress */}
                      {getDeliveryProgress(order.status, 'order')}
                      
                      <div className="flex justify-between items-center mt-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            Total Amount: <span className="font-semibold text-gray-900">${order.total_amount}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => router.push(`/orders/${order.id}`)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View Details →
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
