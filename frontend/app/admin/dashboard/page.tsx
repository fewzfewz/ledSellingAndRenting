'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Navbar from '../../../components/Navbar';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalRentals: number;
  totalOrders: number;
  rentalRevenue: number;
  salesRevenue: number;
  totalRevenue: number;
  inventoryStatus: Record<string, number>;
}

export default function AdminDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    if (user && token) {
      fetchDashboardData();
    }
  }, [user, token, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await res.json();
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-8 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">👑 Admin Dashboard</h1>
              <p className="text-blue-100">Welcome back, {user?.name || 'Admin'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Last updated</p>
              <p className="text-lg font-semibold">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/products" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-blue-500">
              <div className="text-4xl mb-2">📦</div>
              <div className="font-semibold text-gray-900">Manage Products</div>
              <div className="text-sm text-gray-500">Add, edit, delete</div>
            </Link>
            
            <Link href="/admin/inventory" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-green-500">
              <div className="text-4xl mb-2">📊</div>
              <div className="font-semibold text-gray-900">Inventory</div>
              <div className="text-sm text-gray-500">Track stock</div>
            </Link>
            
            <Link href="/dashboard" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-purple-500">
              <div className="text-4xl mb-2">📋</div>
              <div className="font-semibold text-gray-900">Orders</div>
              <div className="text-sm text-gray-500">View all orders</div>
            </Link>
            
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-yellow-500 cursor-pointer">
              <div className="text-4xl mb-2">⚙️</div>
              <div className="font-semibold text-gray-900">Settings</div>
              <div className="text-sm text-gray-500">Configure system</div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Key Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-start mb-4">
                <div className="text-5xl">💰</div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                  Total
                </div>
              </div>
              <div className="text-sm font-medium opacity-90 mb-1">Total Revenue</div>
              <div className="text-3xl font-bold">${stats?.totalRevenue?.toFixed(2) || '0.00'}</div>
              <div className="mt-3 text-xs opacity-75">
                Rental: ${stats?.rentalRevenue?.toFixed(2) || '0'} | Sales: ${stats?.salesRevenue?.toFixed(2) || '0'}
              </div>
            </div>

            {/* Total Products */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-start mb-4">
                <div className="text-5xl">📦</div>
                <Link href="/products" className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-semibold transition-colors">
                  View All
                </Link>
              </div>
              <div className="text-sm font-medium opacity-90 mb-1">Total Products</div>
              <div className="text-3xl font-bold">{stats?.totalProducts || 0}</div>
              <div className="mt-3 text-xs opacity-75">
                Active catalog items
              </div>
            </div>

            {/* Total Rentals */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-start mb-4">
                <div className="text-5xl">🎬</div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                  Bookings
                </div>
              </div>
              <div className="text-sm font-medium opacity-90 mb-1">Total Rentals</div>
              <div className="text-3xl font-bold">{stats?.totalRentals || 0}</div>
              <div className="mt-3 text-xs opacity-75">
                Rental transactions
              </div>
            </div>

            {/* Total Users */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-start mb-4">
                <div className="text-5xl">👥</div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                  Customers
                </div>
              </div>
              <div className="text-sm font-medium opacity-90 mb-1">Total Users</div>
              <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
              <div className="mt-3 text-xs opacity-75">
                Registered accounts
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">💵</span>
              Revenue Breakdown
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-700">Rental Revenue</span>
                </div>
                <span className="text-xl font-bold text-blue-600">${stats?.rentalRevenue?.toFixed(2) || '0.00'}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-700">Sales Revenue</span>
                </div>
                <span className="text-xl font-bold text-green-600">${stats?.salesRevenue?.toFixed(2) || '0.00'}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="font-bold text-gray-900">Total Revenue</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">${stats?.totalRevenue?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Inventory Status */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">📊</span>
              Inventory Status
            </h3>
            <div className="space-y-3">
              {stats?.inventoryStatus && Object.keys(stats.inventoryStatus).length > 0 ? (
                Object.entries(stats.inventoryStatus).map(([status, count]) => {
                  const colors: Record<string, string> = {
                    available: 'bg-green-100 text-green-700 border-green-200',
                    rented: 'bg-blue-100 text-blue-700 border-blue-200',
                    maintenance: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                    damaged: 'bg-red-100 text-red-700 border-red-200',
                    retired: 'bg-gray-100 text-gray-700 border-gray-200'
                  };
                  
                  return (
                    <div key={status} className={`flex items-center justify-between p-4 rounded-lg border-2 ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
                      <span className="font-medium capitalize">{status}</span>
                      <span className="text-2xl font-bold">{count}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📦</div>
                  <p>No inventory data available</p>
                  <Link href="/admin/inventory/new" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                    Add inventory units →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">🔧</span>
            System Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-sm font-medium text-gray-700">API Status</div>
              <div className="text-xs text-green-600 font-semibold">Online</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl mb-2">💾</div>
              <div className="text-sm font-medium text-gray-700">Database</div>
              <div className="text-xs text-green-600 font-semibold">Connected</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl mb-2">📈</div>
              <div className="text-sm font-medium text-gray-700">Orders</div>
              <div className="text-xs text-blue-600 font-semibold">{stats?.totalOrders || 0} Total</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-sm font-medium text-gray-700">Performance</div>
              <div className="text-xs text-purple-600 font-semibold">Excellent</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
