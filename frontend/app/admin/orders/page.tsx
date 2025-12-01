'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import { useAuth } from '../../../contexts/AuthContext';
import { apiGet, apiPut } from '../../../lib/api';

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'rentals'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, rentalsData] = await Promise.all([
        apiGet('/sales_orders'),
        apiGet('/rentals')
      ]);
      setOrders(ordersData);
      setRentals(rentalsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      await apiPut(`/sales_orders/${id}`, { status: newStatus });
      fetchData(); // Refresh data
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const updateRentalStatus = async (id: string, newStatus: string) => {
    try {
      await apiPut(`/rentals/${id}`, { status: newStatus });
      fetchData(); // Refresh data
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      shipped: 'bg-purple-100 text-purple-800',
      active: 'bg-green-100 text-green-800',
      delivered: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      returned: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    if (typeof address === 'string') return address;
    return `${address.street || ''}, ${address.city || ''} | ${address.phone || ''}`;
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <button onClick={fetchData} className="text-blue-600 hover:text-blue-800">
            🔄 Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'orders'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sales Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('rentals')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'rentals'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Rentals ({rentals.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-600">ID</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Customer</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Address</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Amount</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activeTab === 'orders' ? (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm">{order.id.slice(0, 8)}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{order.user_name}</div>
                          <div className="text-sm text-gray-500">{order.user_email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                          <div className="truncate" title={formatAddress(order.shipping_address)}>
                            {formatAddress(order.shipping_address)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 font-medium">${order.total_amount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="processing">Processing</option>
                            <option value="in_transit">In Transit</option>
                            <option value="delivered">Delivered</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    rentals.map((rental) => (
                      <tr key={rental.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm">{rental.id.slice(0, 8)}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{rental.user_name}</div>
                          <div className="text-sm text-gray-500">{rental.user_email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                          <div className="truncate" title={formatAddress(rental.delivery_address)}>
                            {formatAddress(rental.delivery_address)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                        </td>
                        <td className="px-6 py-4 font-medium">${rental.total_amount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                            {rental.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={rental.status}
                            onChange={(e) => updateRentalStatus(rental.id, e.target.value)}
                            className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="in_transit">In Transit</option>
                            <option value="active">Active (Delivered)</option>
                            <option value="returned">Returned</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
