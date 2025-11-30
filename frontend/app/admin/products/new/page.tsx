'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../../components/Navbar';
import { useAuth } from '../../../../contexts/AuthContext';
import { apiPost } from '../../../../lib/api';

export default function NewProductPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    description: '',
    category: 'indoor',
    base_price: '',
    variants: [
      { name: 'Standard', pixel_pitch: '3.9', width_cm: '50', height_cm: '50', weight_kg: '8', price: '', rent_price_per_day: '' }
    ]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiPost('/products', formData);
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
      setLoading(false);
    }
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Add New Product</h1>

          {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.sku}
                  onChange={e => setFormData({...formData, sku: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="stage">Stage</option>
                  <option value="transparent">Transparent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Base Price ($)</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.base_price}
                  onChange={e => setFormData({...formData, base_price: e.target.value})}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Default Variant</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.variants[0].name}
                    onChange={e => updateVariant(0, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Price ($)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.variants[0].price}
                    onChange={e => updateVariant(0, 'price', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Rent/Day ($)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.variants[0].rent_price_per_day}
                    onChange={e => updateVariant(0, 'rent_price_per_day', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Pixel Pitch</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.variants[0].pixel_pitch}
                    onChange={e => updateVariant(0, 'pixel_pitch', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
