'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import { useAuth } from '../../../contexts/AuthContext';
import { apiGet, apiPut } from '../../../lib/api';

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'rentals'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const updateRentalStatus = async (id: string, newStatus: string) => {
    try {
      await apiPut(`/rentals/${id}`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: string }> = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '⏳' },
      paid: { bg: 'bg-green-500/20', text: 'text-green-400', icon: '✅' },
      processing: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '⚙️' },
      confirmed: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '✓' },
      in_transit: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: '🚚' },
      shipped: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: '📦' },
      active: { bg: 'bg-green-500/20', text: 'text-green-400', icon: '🎬' },
      delivered: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', icon: '📍' },
      completed: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '✔️' },
      cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', icon: '❌' },
      returned: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: '↩️' }
    };
    return configs[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '•' };
  };

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    if (typeof address === 'string') return address;
    return `${address.street || ''}, ${address.city || ''}`;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRentals = rentals.filter(rental => {
    const matchesSearch = !searchQuery || 
      rental.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || rental.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access Denied</div>;
  }

  const currentData = activeTab === 'orders' ? filteredOrders : filteredRentals;
  const totalRevenue = currentData.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <Navbar />
      
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <Link href="/admin/dashboard" className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black mt-2">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Order Management
              </span>
            </h1>
            <p className="text-gray-400 mt-2">Manage sales orders and rental bookings</p>
          </div>
          <button 
            onClick={fetchData}
            className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg shadow-blue-500/50"
          >
            <span className="flex items-center gap-2">
              🔄 Refresh
            </span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <span className="text-3xl">📦</span>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Orders</p>
                <p className="text-3xl font-bold text-blue-400">{orders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <span className="text-3xl">🎬</span>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Rentals</p>
                <p className="text-3xl font-bold text-purple-400">{rentals.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <span className="text-3xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-400">{activeTab === 'orders' ? 'Orders' : 'Rentals'} Revenue</p>
                <p className="text-3xl font-bold text-green-400">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => { setActiveTab('orders'); setStatusFilter(''); }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <span className="flex items-center gap-2">
              📦 Sales Orders ({orders.length})
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('rentals'); setStatusFilter(''); }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'rentals'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <span className="flex items-center gap-2">
              🎬 Rentals ({rentals.length})
            </span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:bg-white/10 focus:border-purple-500/50 transition-all outline-none cursor-pointer"
              >
                <option value="" className="bg-gray-900">All Statuses</option>
                {activeTab === 'orders' ? (
                  <>
                    <option value="processing" className="bg-gray-900">Processing</option>
                    <option value="in_transit" className="bg-gray-900">In Transit</option>
                    <option value="delivered" className="bg-gray-900">Delivered</option>
                    <option value="completed" className="bg-gray-900">Completed</option>
                    <option value="cancelled" className="bg-gray-900">Cancelled</option>
                  </>
                ) : (
                  <>
                    <option value="confirmed" className="bg-gray-900">Confirmed</option>
                    <option value="in_transit" className="bg-gray-900">In Transit</option>
                    <option value="active" className="bg-gray-900">Active</option>
                    <option value="returned" className="bg-gray-900">Returned</option>
                    <option value="completed" className="bg-gray-900">Completed</option>
                    <option value="cancelled" className="bg-gray-900">Cancelled</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Orders/Rentals List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block relative">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="text-gray-400 mt-4">Loading {activeTab}...</p>
          </div>
        ) : currentData.length === 0 ? (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-xl text-gray-400 mb-2">No {activeTab} found</p>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentData.map((item, idx) => {
              const statusConfig = getStatusConfig(item.status);
              const isOrder = activeTab === 'orders';
              
              return (
                <div 
                  key={item.id}
                  className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Customer Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
                            <span className="text-2xl">{isOrder ? '📦' : '🎬'}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-white">{item.user_name || 'Unknown'}</h3>
                              <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} border-current/30`}>
                                {statusConfig.icon} {item.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-1">{item.user_email}</p>
                            <p className="text-xs text-gray-500 font-mono">ID: {item.id.slice(0, 16)}...</p>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Details */}
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Date</p>
                          <p className="text-sm font-medium text-gray-300">
                            {isOrder ? formatDate(item.created_at) : `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Address</p>
                          <p className="text-sm font-medium text-gray-300 truncate" title={formatAddress(isOrder ? item.shipping_address : item.delivery_address)}>
                            {formatAddress(isOrder ? item.shipping_address : item.delivery_address)}
                          </p>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Amount</p>
                          <p className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            ${item.total_amount}
                          </p>
                        </div>
                        <select
                          value={item.status}
                          onChange={(e) => isOrder ? updateOrderStatus(item.id, e.target.value) : updateRentalStatus(item.id, e.target.value)}
                          className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none cursor-pointer"
                        >
                          {isOrder ? (
                            <>
                              <option value="processing" className="bg-gray-900">Processing</option>
                              <option value="in_transit" className="bg-gray-900">In Transit</option>
                              <option value="delivered" className="bg-gray-900">Delivered</option>
                              <option value="completed" className="bg-gray-900">Completed</option>
                              <option value="cancelled" className="bg-gray-900">Cancelled</option>
                            </>
                          ) : (
                            <>
                              <option value="confirmed" className="bg-gray-900">Confirmed</option>
                              <option value="in_transit" className="bg-gray-900">In Transit</option>
                              <option value="active" className="bg-gray-900">Active</option>
                              <option value="returned" className="bg-gray-900">Returned</option>
                              <option value="completed" className="bg-gray-900">Completed</option>
                              <option value="cancelled" className="bg-gray-900">Cancelled</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
