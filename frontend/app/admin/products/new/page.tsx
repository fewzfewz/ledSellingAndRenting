'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';
import { useAuth } from '../../../../contexts/AuthContext';
import { apiPost } from '../../../../lib/api';

export default function NewProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    description: '',
    category: 'indoor',
    base_price: '',
    image_url: '',
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

  if (!user || user.role !== 'admin') {
    return null;
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
        <div className="mb-8">
          <Link href="/admin/products" className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Products
          </Link>
          <h1 className="text-4xl font-black mt-2">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Add New Product
            </span>
          </h1>
          <p className="text-gray-400 mt-2">Create a new product listing for your catalog</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">📝</span>
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Product Title</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                    placeholder="e.g. P3.9 Indoor Rental Screen"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">SKU</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                    placeholder="e.g. P3.9-IN-RENT"
                    value={formData.sku}
                    onChange={e => setFormData({...formData, sku: e.target.value})}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none resize-none"
                  placeholder="Describe the product features and specifications..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none cursor-pointer"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="indoor" className="bg-gray-900">Indoor</option>
                    <option value="outdoor" className="bg-gray-900">Outdoor</option>
                    <option value="stage" className="bg-gray-900">Stage</option>
                    <option value="transparent" className="bg-gray-900">Transparent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Base Price ($)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                    placeholder="0.00"
                    value={formData.base_price}
                    onChange={e => setFormData({...formData, base_price: e.target.value})}
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                <input
                  type="url"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url}
                  onChange={e => setFormData({...formData, image_url: e.target.value})}
                />
              </div>
            </div>

            {/* Default Variant Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                Default Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Variant Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-purple-500/50 transition-all outline-none"
                    value={formData.variants[0].name}
                    onChange={e => updateVariant(0, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Sale Price ($)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-green-500/50 transition-all outline-none"
                    value={formData.variants[0].price}
                    onChange={e => updateVariant(0, 'price', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Rent/Day ($)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-purple-500/50 transition-all outline-none"
                    value={formData.variants[0].rent_price_per_day}
                    onChange={e => updateVariant(0, 'rent_price_per_day', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Pixel Pitch (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                    value={formData.variants[0].pixel_pitch}
                    onChange={e => updateVariant(0, 'pixel_pitch', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Width (cm)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                    value={formData.variants[0].width_cm}
                    onChange={e => updateVariant(0, 'width_cm', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Height (cm)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                    value={formData.variants[0].height_cm}
                    onChange={e => updateVariant(0, 'height_cm', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Weight (kg)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                    value={formData.variants[0].weight_kg}
                    onChange={e => updateVariant(0, 'weight_kg', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Product...
                  </span>
                ) : (
                  'Create Product'
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-4 bg-white/5 text-gray-300 rounded-xl font-semibold hover:bg-white/10 hover:text-white transition-colors border border-white/10"
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
