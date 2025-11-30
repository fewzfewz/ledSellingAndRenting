'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';

interface Product {
  id: string;
  title: string;
  description: string;
  base_price: string;
  category: string;
  sku: string;
  image_url?: string;
}

interface Variant {
  name: string;
  pixel_pitch: number;
  width_cm: number;
  height_cm: number;
  weight_kg: number;
  price: number;
  rent_price_per_day: number;
}

export default function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (category) params.append('category', category);

      const data = await fetch(`http://localhost:4000/api/products?${params.toString()}`).then(r => r.json());
      setProducts(data.products || data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    
    try {
      await fetch(`http://localhost:4000/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Admin Bar */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">👑</span>
              <span className="text-lg font-semibold">Admin Product Management</span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center space-x-2 shadow-md"
            >
              <span className="text-xl">+</span>
              <span>Add New Product</span>
            </button>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Our LED Screens</h1>
        
        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
              <option value="stage">Stage</option>
              <option value="transparent">Transparent</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all overflow-hidden group relative transform hover:-translate-y-1">
                {/* Admin Controls */}
                {isAdmin && (
                  <div className="absolute top-3 right-3 z-10 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/admin/products/edit/${product.id}`}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-lg"
                    >
                      ✏️ Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id, product.title)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-lg"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
                
                {/* Product Image */}
                <div className="h-64 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6">
                      <div className="text-6xl mb-2">📺</div>
                      <p className="text-gray-500 text-sm">No Image</p>
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{product.title}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium uppercase">
                      {product.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Starting at</p>
                      <p className="text-2xl font-bold text-gray-900">${product.base_price}</p>
                    </div>
                    <Link
                      href={`/products/${product.id}`}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchProducts();
          }}
        />
      )}
    </main>
  );
}

// Comprehensive Add Product Modal Component
function AddProductModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'indoor',
    sku: '',
    base_price: '',
    image_url: ''
  });
  
  const [variants, setVariants] = useState<Variant[]>([
    {
      name: '500x500mm',
      pixel_pitch: 3.9,
      width_cm: 50,
      height_cm: 50,
      weight_kg: 8,
      price: 500,
      rent_price_per_day: 50
    }
  ]);
  
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addVariant = () => {
    setVariants([...variants, {
      name: '',
      pixel_pitch: 3.9,
      width_cm: 50,
      height_cm: 50,
      weight_kg: 8,
      price: 500,
      rent_price_per_day: 50
    }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...formData,
        image_url: imagePreview || formData.image_url || null,
        variants: variants
      };

      const response = await fetch('http://localhost:4000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add product');
      }

      alert('Product added successfully!');
      onSuccess();
    } catch (err: any) {
      console.error('Error adding product:', err);
      alert(err.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
        <div className="p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Add New LED Screen Product</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Image Upload Section */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Product Image</label>
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-white">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-lg" />
                  <button
                    type="button"
                    onClick={() => setImagePreview('')}
                    className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">📸</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block font-medium"
                  >
                    Choose Image
                  </label>
                  <p className="text-sm text-gray-500 mt-3">or enter image URL below</p>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    className="mt-3 w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Product Basic Information */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., P3.9 Indoor LED Panel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., P3.9-INDOOR"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Base Price ($) *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="500.00"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="stage">Stage</option>
                  <option value="transparent">Transparent</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="High resolution indoor LED panel, perfect for events..."
                />
              </div>
            </div>
          </div>

          {/* Product Variants */}
          <div className="bg-blue-50 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
              <button
                type="button"
                onClick={addVariant}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
              >
                + Add Variant
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border-2 border-blue-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-700">Variant #{index + 1}</h4>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Variant Name</label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="e.g., 500x500mm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Pixel Pitch</label>
                      <input
                        type="number"
                        step="0.1"
                        value={variant.pixel_pitch}
                        onChange={(e) => updateVariant(index, 'pixel_pitch', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Width (cm)</label>
                      <input
                        type="number"
                        value={variant.width_cm}
                        onChange={(e) => updateVariant(index, 'width_cm', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Height (cm)</label>
                      <input
                        type="number"
                        value={variant.height_cm}
                        onChange={(e) => updateVariant(index, 'height_cm', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={variant.weight_kg}
                        onChange={(e) => updateVariant(index, 'weight_kg', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Rent Price/Day ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.rent_price_per_day}
                        onChange={(e) => updateVariant(index, 'rent_price_per_day', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold text-lg disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Adding Product...' : '✓ Add Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
