'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { apiGet } from '../../../lib/api';

export default function AdminInventoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetchInventory();
  }, [user, router, statusFilter, searchTerm]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const data = await apiGet(`/admin/inventory?${params.toString()}`);
      setInventory(data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      rented: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      damaged: 'bg-red-100 text-red-800',
      retired: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-1">Manage LED screen inventory units</p>
          </div>
          <Link
            href="/admin/inventory/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            + Add Inventory Unit
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by serial number or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
                <option value="damaged">Damaged</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading inventory...</p>
            </div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No inventory units found.</p>
              <Link
                href="/admin/inventory/new"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first inventory unit →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((unit) => (
                    <tr key={unit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{unit.serial_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{unit.product_title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{unit.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(unit.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{unit.location || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 hover:text-blue-700 mr-3">
                          Edit
                        </button>
                        <button className="text-gray-600 hover:text-gray-700">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {!loading && inventory.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            {['available', 'rented', 'maintenance', 'damaged', 'retired'].map((status) => {
              const count = inventory.filter((u) => u.status === status).length;
              return (
                <div key={status} className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-sm text-gray-600 capitalize">{status}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
