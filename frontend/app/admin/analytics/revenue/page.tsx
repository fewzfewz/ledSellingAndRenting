'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import Navbar from '../../../../components/Navbar';

interface ChartDataPoint {
  date: string;
  rentalRevenue: number;
  salesRevenue: number;
  totalRevenue: number;
}

interface AnalyticsData {
  period: string;
  groupBy: string;
  chartData: ChartDataPoint[];
  summary: {
    totalRevenue: number;
    totalRentalRevenue: number;
    totalSalesRevenue: number;
    averageDaily: number;
  };
}

export default function RevenueAnalyticsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    if (user && token) {
      fetchAnalytics();
    }
  }, [user, token, authLoading, router, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:4000/api/admin/analytics/revenue?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const analyticsData = await res.json();
      setData(analyticsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const periods = [
    { value: '7d', label: 'Last 7 Days', icon: '📅' },
    { value: '1m', label: 'Last Month', icon: '📆' },
    { value: '3m', label: 'Last 3 Months', icon: '🗓️' },
    { value: '1y', label: 'Last Year', icon: '📊' },
    { value: 'all', label: 'All Time', icon: '♾️' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (data?.groupBy === 'month') {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getMaxRevenue = () => {
    if (!data?.chartData.length) return 0;
    return Math.max(...data.chartData.map(d => d.totalRevenue));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navbar />
        <div className="container mx-auto px-4 py-24">
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-xl">
            <h3 className="text-lg font-bold mb-2">Error Loading Analytics</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const maxRevenue = getMaxRevenue();

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
              <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Revenue Analytics
              </span>
            </h1>
            <p className="text-gray-400 mt-2">Track your business performance over time</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  period === p.value
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                <span className="mr-2">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Revenue */}
              <div className="group relative p-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-sm text-gray-400 mb-2">Total Revenue</div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {formatCurrency(data.summary.totalRevenue)}
                  </div>
                  <div className="text-xs text-green-400">● Active</div>
                </div>
              </div>

              {/* Rental Revenue */}
              <div className="group relative p-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-sm text-gray-400 mb-2">Rental Revenue</div>
                  <div className="text-3xl font-bold text-purple-400 mb-1">
                    {formatCurrency(data.summary.totalRentalRevenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {data.summary.totalRevenue > 0 
                      ? `${((data.summary.totalRentalRevenue / data.summary.totalRevenue) * 100).toFixed(1)}% of total`
                      : '0% of total'}
                  </div>
                </div>
              </div>

              {/* Sales Revenue */}
              <div className="group relative p-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-sm text-gray-400 mb-2">Sales Revenue</div>
                  <div className="text-3xl font-bold text-blue-400 mb-1">
                    {formatCurrency(data.summary.totalSalesRevenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {data.summary.totalRevenue > 0 
                      ? `${((data.summary.totalSalesRevenue / data.summary.totalRevenue) * 100).toFixed(1)}% of total`
                      : '0% of total'}
                  </div>
                </div>
              </div>

              {/* Average */}
              <div className="group relative p-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-sm text-gray-400 mb-2">Average {data.groupBy === 'day' ? 'Daily' : 'Monthly'}</div>
                  <div className="text-3xl font-bold text-orange-400 mb-1">
                    {formatCurrency(data.summary.averageDaily)}
                  </div>
                  <div className="text-xs text-gray-500">Per {data.groupBy}</div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
                Revenue Over Time
              </h2>
              
              {data.chartData.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-xl">No revenue data for this period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Chart Legend */}
                  <div className="flex gap-6 justify-center mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded"></div>
                      <span className="text-sm text-gray-300">Sales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
                      <span className="text-sm text-gray-300">Rentals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded"></div>
                      <span className="text-sm text-gray-300">Total</span>
                    </div>
                  </div>

                  {/* Custom Bar Chart */}
                  <div className="space-y-3">
                    {data.chartData.map((point, idx) => (
                      <div key={idx} className="group">
                        <div className="flex items-center gap-4">
                          <div className="w-24 text-sm text-gray-400 text-right">
                            {formatDate(point.date)}
                          </div>
                          <div className="flex-1">
                            <div className="flex gap-1 h-12 items-end">
                              {/* Sales Bar */}
                              <div 
                                className="bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t hover:from-blue-500 hover:to-cyan-400 transition-all cursor-pointer relative group/bar"
                                style={{ 
                                  width: `${(point.salesRevenue / maxRevenue) * 100}%`,
                                  minWidth: point.salesRevenue > 0 ? '2px' : '0'
                                }}
                              >
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                                  Sales: {formatCurrency(point.salesRevenue)}
                                </div>
                              </div>
                              {/* Rental Bar */}
                              <div 
                                className="bg-gradient-to-t from-purple-600 to-pink-500 rounded-t hover:from-purple-500 hover:to-pink-400 transition-all cursor-pointer relative group/bar"
                                style={{ 
                                  width: `${(point.rentalRevenue / maxRevenue) * 100}%`,
                                  minWidth: point.rentalRevenue > 0 ? '2px' : '0'
                                }}
                              >
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                                  Rentals: {formatCurrency(point.rentalRevenue)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="w-28 text-sm font-semibold text-green-400">
                            {formatCurrency(point.totalRevenue)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sales Breakdown */}
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-lg rounded-2xl border border-blue-500/20 p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  Sales Performance
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-300">Total Sales</span>
                    <span className="text-xl font-bold text-blue-400">
                      {formatCurrency(data.summary.totalSalesRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-300">Contribution</span>
                    <span className="text-lg font-semibold text-blue-300">
                      {data.summary.totalRevenue > 0 
                        ? `${((data.summary.totalSalesRevenue / data.summary.totalRevenue) * 100).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rental Breakdown */}
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎬</span>
                  Rental Performance
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-300">Total Rentals</span>
                    <span className="text-xl font-bold text-purple-400">
                      {formatCurrency(data.summary.totalRentalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-300">Contribution</span>
                    <span className="text-lg font-semibold text-purple-300">
                      {data.summary.totalRevenue > 0 
                        ? `${((data.summary.totalRentalRevenue / data.summary.totalRevenue) * 100).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
