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
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'Failed to fetch dashboard data');
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-xl backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-2">Error Loading Dashboard</h3>
            <p>{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-4xl font-black mb-2">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Admin Dashboard
              </span>
            </h1>
            <p className="text-gray-400">
              Welcome back, <span className="text-white font-semibold">{user?.name || 'Admin'}</span>
            </p>
          </div>
          <div className="text-right mt-4 md:mt-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-300">System Online</span>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Revenue Card - Clickable */}
          <Link href="/admin/analytics/revenue" className="group relative p-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 hover:transform hover:scale-[1.02] cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-medium px-2 py-1 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20">
                    +12% vs last month
                  </span>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 flex items-center gap-1">
                    View Analytics
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold text-white mb-2">
                ${stats?.totalRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </h3>
              <div className="flex gap-2 text-xs text-gray-500">
                <span>Rent: ${stats?.rentalRevenue?.toLocaleString()}</span>
                <span>•</span>
                <span>Sales: ${stats?.salesRevenue?.toLocaleString()}</span>
              </div>
            </div>
          </Link>

          {/* Products Card */}
          <div className="group relative p-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 hover:transform hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <span className="text-2xl">📦</span>
                </div>
                <Link href="/products" className="text-xs font-medium px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                  View All
                </Link>
              </div>
              <p className="text-gray-400 text-sm mb-1">Total Products</p>
              <h3 className="text-3xl font-bold text-white mb-2">
                {stats?.totalProducts || 0}
              </h3>
              <p className="text-xs text-gray-500">Active catalog items</p>
            </div>
          </div>

          {/* Rentals Card */}
          <div className="group relative p-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 hover:transform hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <span className="text-2xl">🎬</span>
                </div>
                <Link href="/admin/orders" className="text-xs font-medium px-2 py-1 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20 hover:bg-purple-500/20 transition-colors">
                  Manage
                </Link>
              </div>
              <p className="text-gray-400 text-sm mb-1">Total Rentals</p>
              <h3 className="text-3xl font-bold text-white mb-2">
                {stats?.totalRentals || 0}
              </h3>
              <p className="text-xs text-gray-500">Lifetime bookings</p>
            </div>
          </div>

          {/* Users Card */}
          <div className="group relative p-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 hover:transform hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <span className="text-2xl">👥</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20">
                  Active
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-1">Total Users</p>
              <h3 className="text-3xl font-bold text-white mb-2">
                {stats?.totalUsers || 0}
              </h3>
              <p className="text-xs text-gray-500">Registered accounts</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: 'Add Product', icon: '📦', href: '/admin/products/new', color: 'blue' },
                { title: 'Inventory', icon: '📊', href: '/admin/inventory', color: 'green' },
                { title: 'Orders', icon: '📋', href: '/admin/orders', color: 'purple' },
                { title: 'Settings', icon: '⚙️', href: '/admin/settings', color: 'gray' },
              ].map((action, idx) => (
                <Link 
                  key={idx}
                  href={action.href}
                  className="group relative p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300 hover:-translate-y-1 text-center"
                >
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-${action.color}-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-gray-200 group-hover:text-white transition-colors">
                    {action.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>

          {/* Inventory Status */}
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
              Inventory Health
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="space-y-4">
                {stats?.inventoryStatus && Object.keys(stats.inventoryStatus).length > 0 ? (
                  Object.entries(stats.inventoryStatus).map(([status, count]) => {
                    const config: Record<string, { color: string, label: string }> = {
                      available: { color: 'bg-green-500', label: 'Available' },
                      rented: { color: 'bg-blue-500', label: 'Rented' },
                      maintenance: { color: 'bg-yellow-500', label: 'Maintenance' },
                      damaged: { color: 'bg-red-500', label: 'Damaged' },
                      retired: { color: 'bg-gray-500', label: 'Retired' }
                    };
                    const { color, label } = config[status] || { color: 'bg-gray-500', label: status };
                    const total = Object.values(stats.inventoryStatus).reduce((a, b) => a + b, 0);
                    const percentage = Math.round((count / total) * 100);

                    return (
                      <div key={status} className="group">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{label}</span>
                          <span className="text-gray-400">{count} units ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${color} opacity-80 group-hover:opacity-100 transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No inventory data available</p>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-6 border-t border-white/10">
                <Link 
                  href="/admin/inventory"
                  className="block w-full py-3 text-center bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  View Detailed Report
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* System Status Grid */}
        <div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-green-500 rounded-full"></span>
            System Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'API Status', status: 'Online', color: 'green', icon: '⚡' },
              { label: 'Database', status: 'Connected', color: 'blue', icon: '💾' },
              { label: 'Orders', status: `${stats?.totalOrders || 0} Total`, color: 'purple', icon: '📈' },
              { label: 'Performance', status: 'Optimal', color: 'emerald', icon: '🚀' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg bg-${item.color}-500/20 flex items-center justify-center text-xl`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">{item.label}</p>
                  <p className={`text-sm font-bold text-${item.color}-400`}>{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
