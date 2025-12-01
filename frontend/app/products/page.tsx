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
  rental_count?: number;
  sale_count?: number;
}

export default function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, category, isAdmin]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (category) params.append('category', category);
      if (isAdmin) params.append('show_all', 'true');

      const data = await fetch(`http://localhost:4000/api/products?${params.toString()}`).then(r => r.json());
      const productsList = Array.isArray(data) ? data : (data.products || []);
      setProducts(productsList);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    
    try {
      await fetch(`http://localhost:4000/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-6xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Our Collection
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Premium LED screens for every occasion. Rent or buy the perfect display for your needs.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search LED screens..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:bg-white/20 focus:border-blue-500/50 transition-all outline-none"
                  />
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white focus:bg-white/20 focus:border-purple-500/50 transition-all outline-none cursor-pointer"
                >
                  <option value="" className="bg-gray-900">All Categories</option>
                  <option value="indoor" className="bg-gray-900">Indoor</option>
                  <option value="outdoor" className="bg-gray-900">Outdoor</option>
                  <option value="stage" className="bg-gray-900">Stage</option>
                  <option value="transparent" className="bg-gray-900">Transparent</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 pb-20">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block relative">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="text-gray-400 mt-4">Loading amazing screens...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-2xl text-gray-400 mb-2">No products found</p>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, idx) => (
              <div 
                key={product.id} 
                className="group relative"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Card */}
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
                  
                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/products/edit/${product.id}`}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium shadow-lg transition-colors"
                      >
                        ✏️
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.title)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium shadow-lg transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  )}

                  {/* Image */}
                  <div className="relative h-64 overflow-hidden bg-gradient-to-br from-blue-900/20 to-purple-900/20">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-6xl mb-2 opacity-50">📺</div>
                          <p className="text-gray-500 text-sm">No Image</p>
                        </div>
                      </div>
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Category Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-xs font-bold text-blue-300 uppercase">
                        {product.category}
                      </span>
                      {/* Availability Badges */}
                      {(product.rental_count || 0) > 0 && (
                        <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-medium text-purple-300">
                          🔄 {product.rental_count} rent
                        </span>
                      )}
                      {(product.sale_count || 0) > 0 && (
                        <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-medium text-green-300">
                          🛒 {product.sale_count} sale
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all">
                      {product.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-400 mb-4 line-clamp-2 text-sm leading-relaxed">
                      {product.description}
                    </p>

                    {/* Price and CTA */}
                    <div className="flex items-end justify-between pt-4 border-t border-white/10">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Starting at</p>
                        <p className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                          ${product.base_price}
                        </p>
                      </div>
                      <Link
                        href={`/products/${product.id}`}
                        className="group/btn relative px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-bold overflow-hidden transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          View
                          <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                      </Link>
                    </div>
                  </div>

                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 rounded-2xl transition-all duration-500 pointer-events-none"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </main>
  );
}
