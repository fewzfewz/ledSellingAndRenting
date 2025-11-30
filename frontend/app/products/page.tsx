'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { apiGet, apiPost } from '../../lib/api';

interface Product {
  id: string;
  title: string;
  description: string;
  base_price: string;
  category: string;
  sku: string;
  image_url?: string;
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
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <span className="text-lg font-semibold">👑 Admin Product Management</span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <span>+</span>
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
              <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden group relative">
                {/* Admin Controls */}
                {isAdmin && (
                  <div className="absolute top-3 right-3 z-10 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/admin/products/edit/${product.id}`}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      ✏️ Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id, product.title)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
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
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
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

// Add Product Modal Component
function AddProductModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'indoor',
    sku: '',
    base_price: '',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For now, we'll use the image URL directly
      // In production, you'd upload to a storage service first
      const productData = {
        ...formData,
        image_url: imagePreview || formData.image_url
      };

      await apiPost('/products', productData);
      alert('Product added successfully!');
      onSuccess();
    } catch (err) {
      alert('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Add New Product</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setImageFile(null);
                    }}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
                    className="cursor-pointer px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
                  >
                    Choose Image
                  </label>
                  <p className="text-sm text-gray-500 mt-2">or enter image URL below</p>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    className="mt-3 w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., P3.9-INDOOR"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base Price *</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.base_price}
                onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="500.00"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Describe the product features and specifications..."
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
