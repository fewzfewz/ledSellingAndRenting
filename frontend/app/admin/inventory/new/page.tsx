'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { apiGet, apiPost } from '../../../../lib/api';

export default function AddInventoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    variant_id: '',
    serial_number: '',
    status: 'available',
    location: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetchProducts();
  }, [user, router]);

  const fetchProducts = async () => {
    try {
      const data = await apiGet('/products');
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleProductChange = async (productId: string) => {
    setFormData({ ...formData, product_id: productId, variant_id: '' });
    
    if (!productId) {
      setVariants([]);
      return;
    }

    try {
      const product = await apiGet(`/products/${productId}`);
      setVariants(product.variants || []);
    } catch (err) {
      console.error('Failed to fetch variants:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.variant_id || !formData.serial_number) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await apiPost('/admin/inventory', {
        variant_id: formData.variant_id,
        serial_number: formData.serial_number,
        status: formData.status,
        location: formData.location || null
      });

      alert('Inventory unit added successfully!');
      router.push('/admin/inventory');
    } catch (err: any) {
      console.error('Failed to add inventory:', err);
      alert(err.response?.data?.error || 'Failed to add inventory unit');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/inventory')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
          >
            ← Back to Inventory
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Add Inventory Unit</h1>
          <p className="text-gray-600 mt-1">Add a new LED screen unit to the inventory</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.product_id}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Variant Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variant <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.variant_id}
                onChange={(e) => setFormData({ ...formData, variant_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!formData.product_id}
              >
                <option value="">Select a variant</option>
                {variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.sku} - ${variant.base_price}
                  </option>
                ))}
              </select>
              {!formData.product_id && (
                <p className="text-sm text-gray-500 mt-1">Please select a product first</p>
              )}
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serial Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., LED-001-2024"
                required
              />
              <p className="text-sm text-gray-500 mt-1">Unique identifier for this unit</p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
                <option value="damaged">Damaged</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Warehouse A, Shelf 3"
              />
              <p className="text-sm text-gray-500 mt-1">Physical location of the unit (optional)</p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Inventory Unit'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/inventory')}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
