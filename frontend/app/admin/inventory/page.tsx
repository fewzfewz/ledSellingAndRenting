'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { apiGet } from '../../../lib/api';
import Navbar from '../../../components/Navbar';

export default function AdminInventoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetchInventory();
  }, [user, router, statusFilter, searchTerm, typeFilter]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter) params.append('type', typeFilter);
      
      const data = await apiGet(`/admin/inventory?${params.toString()}`);
      setInventory(data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: string }> = {
      available: { bg: 'bg-green-500/20', text: 'text-green-400', icon: '✓' },
      rented: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '🎬' },
      maintenance: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '🔧' },
      damaged: { bg: 'bg-red-500/20', text: 'text-red-400', icon: '⚠️' },
      retired: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '📦' }
    };
    return configs[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '•' };
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  // Group inventory by product and variant
  const groupedInventory = inventory.reduce((acc, unit) => {
    const key = `${unit.product_id}-${unit.variant_id}`;
    if (!acc[key]) {
      acc[key] = {
        product_title: unit.product_title,
        sku: unit.sku,
        units: [],
        totalCount: 0,
        availableCount: 0,
        rentedCount: 0
      };
    }
    acc[key].units.push(unit);
    acc[key].totalCount++;
    if (unit.status === 'available') acc[key].availableCount++;
    if (unit.status === 'rented') acc[key].rentedCount++;
    return acc;
  }, {} as Record<string, any>);

  const stats = {
    total: inventory.length,
    available: inventory.filter(u => u.status === 'available').length,
    rented: inventory.filter(u => u.status === 'rented').length,
    maintenance: inventory.filter(u => u.status === 'maintenance').length,
    damaged: inventory.filter(u => u.status === 'damaged').length
  };

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
                Inventory Management
              </span>
            </h1>
            <p className="text-gray-400 mt-2">Track and manage LED screen inventory units</p>
          </div>
          <Link
            href="/admin/inventory/new"
            className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg shadow-blue-500/50"
          >
            <span className="flex items-center gap-2">
              ➕ Add Inventory
            </span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Units', value: stats.total, icon: '📦', color: 'blue' },
            { label: 'Available', value: stats.available, icon: '✓', color: 'green' },
            { label: 'Rented', value: stats.rented, icon: '🎬', color: 'purple' },
            { label: 'Maintenance', value: stats.maintenance, icon: '🔧', color: 'yellow' },
            { label: 'Damaged', value: stats.damaged, icon: '⚠️', color: 'red' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-${stat.color}-500/20 rounded-lg`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                  <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by serial number or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:bg-white/10 focus:border-purple-500/50 transition-all outline-none cursor-pointer"
              >
                <option value="" className="bg-gray-900">All Statuses</option>
                <option value="available" className="bg-gray-900">Available</option>
                <option value="rented" className="bg-gray-900">Rented</option>
                <option value="maintenance" className="bg-gray-900">Maintenance</option>
                <option value="damaged" className="bg-gray-900">Damaged</option>
                <option value="retired" className="bg-gray-900">Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Type Filter</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:bg-white/10 focus:border-pink-500/50 transition-all outline-none cursor-pointer"
              >
                <option value="" className="bg-gray-900">All Types</option>
                <option value="rental" className="bg-gray-900">Rental</option>
                <option value="sale" className="bg-gray-900">Sale</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inventory List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block relative">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="text-gray-400 mt-4">Loading inventory...</p>
          </div>
        ) : Object.keys(groupedInventory).length === 0 ? (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-xl text-gray-400 mb-2">No inventory units found</p>
            <p className="text-gray-500 mb-6">Start by adding your first inventory unit</p>
            <Link
              href="/admin/inventory/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              Add Inventory Unit →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedInventory).map(([key, group]: [string, any], idx) => (
              <div
                key={key}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
                        <span className="text-2xl">📺</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{group.product_title}</h3>
                        <p className="text-sm text-gray-400">SKU: {group.sku}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center px-4 py-2 bg-white/5 rounded-xl">
                        <p className="text-xs text-gray-400">Total</p>
                        <p className="text-2xl font-bold text-white">{group.totalCount}</p>
                      </div>
                      <div className="text-center px-4 py-2 bg-green-500/10 rounded-xl border border-green-500/20">
                        <p className="text-xs text-green-400">Available</p>
                        <p className="text-2xl font-bold text-green-400">{group.availableCount}</p>
                      </div>
                      <div className="text-center px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <p className="text-xs text-blue-400">Rented</p>
                        <p className="text-2xl font-bold text-blue-400">{group.rentedCount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Units List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                    {group.units.map((unit: any) => {
                      const statusConfig = getStatusConfig(unit.status);
                      return (
                        <div key={unit.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-xs text-gray-500 font-mono">{unit.serial_number}</p>
                              <p className="text-xs text-gray-400 mt-1">{unit.location || 'No location'}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} border border-current/30`}>
                              {statusConfig.icon} {unit.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              unit.inventory_type === 'rental' 
                                ? 'bg-purple-500/20 text-purple-400' 
                                : 'bg-green-500/20 text-green-400'
                            }`}>
                              {unit.inventory_type === 'rental' ? '🎬 Rental' : '💰 Sale'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
