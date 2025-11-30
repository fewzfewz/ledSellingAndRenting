'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { apiGet } from '../../lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'rentals' | 'orders'>('rentals');
  const [rentals, setRentals] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    fetchData();
  }, [user, router]);

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
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      shipped: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return null;
  }

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
                  rentals.map((rental) => (
                    <div key={rental.id} className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Rental #{rental.id.slice(0, 8)}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                          </p>
                        </div>
                        {getStatusBadge(rental.status)}
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">
                            Total Amount: <span className="font-semibold text-gray-900">${rental.total_amount}</span>
                          </p>
                          {rental.deposit_amount && (
                            <p className="text-sm text-gray-600">
                              Deposit: ${rental.deposit_amount}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => router.push(`/rentals/${rental.id}`)}
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
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex justify-between items-center">
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
