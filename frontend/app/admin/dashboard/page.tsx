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

interface RecentQuote {
  id: string;
  contact_email: string;
  event_date: string;
  status: string;
  created_at: string;
}

interface RecentRental {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: string;
  total_amount: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentQuotes, setRecentQuotes] = useState<RecentQuote[]>([]);
  const [recentRentals, setRecentRentals] = useState<RecentRental[]>([]);
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
      setRecentQuotes(data.recentQuotes);
      setRecentRentals(data.recentRentals);
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
          <div className="text-xl text-gray-600">Loading...</div>
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="text-sm font-medium text-gray-600 mb-2">Total Users</div>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
          </div>

          <Link href="/admin/products" className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-blue-300 transition-colors cursor-pointer block">
            <div className="text-sm font-medium text-gray-600 mb-2">Total Products</div>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalProducts || 0}</div>
          </Link>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="text-sm font-medium text-gray-600 mb-2">Total Rentals</div>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalRentals || 0}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="text-sm font-medium text-gray-600 mb-2">Total Revenue</div>
            <div className="text-3xl font-bold text-green-600">${stats?.totalRevenue?.toFixed(2) || '0.00'}</div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rental Revenue</span>
                <span className="font-semibold text-gray-900">${stats?.rentalRevenue?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sales Revenue</span>
                <span className="font-semibold text-gray-900">${stats?.salesRevenue?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Inventory Status</h2>
            <div className="space-y-3">
              {stats?.inventoryStatus && Object.entries(stats.inventoryStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">{status}</span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Quotes</h2>
            <div className="space-y-3">
              {recentQuotes.length > 0 ? (
                recentQuotes.map((quote) => (
                  <div key={quote.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{quote.contact_email}</div>
                        <div className="text-sm text-gray-500">Event: {new Date(quote.event_date).toLocaleDateString()}</div>
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                        {quote.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-4">No recent quotes</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Rentals</h2>
            <div className="space-y-3">
              {recentRentals.length > 0 ? (
                recentRentals.map((rental) => (
                  <div key={rental.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">${parseFloat(rental.total_amount).toFixed(2)}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                        {rental.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-4">No recent rentals</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
