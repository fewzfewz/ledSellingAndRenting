'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { apiGet } from '../../../lib/api';
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';

interface Variant {
  id: string;
  name: string;
  price: string;
  rent_price_per_day: string;
  pixel_pitch: string;
  width_cm: string;
  height_cm: string;
  rental_count?: number;
  sale_count?: number;
}

interface ProductDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  base_price: string;
  image_url?: string;
  variants: Variant[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    if (params.id) {
      apiGet(`/products/${params.id}`)
        .then(data => {
          setProduct(data);
          if (data.variants && data.variants.length > 0) {
            setSelectedVariant(data.variants[0]);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load product details');
          setLoading(false);
        });
    }
  }, [params.id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-xl text-gray-400">{error || 'Product not found'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <Navbar />
      
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative container mx-auto px-4 py-12 pt-24">
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Image Gallery */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 h-[500px] lg:h-auto flex items-center justify-center relative p-8">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.title} 
                  className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="text-center p-8">
                  <div className="text-8xl mb-4 animate-pulse">📺</div>
                  <p className="text-gray-500 text-lg">No Image Available</p>
                </div>
              )}
            </div>
            
            {/* Right: Details */}
            <div className="p-8 lg:p-12">
              <div className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-500/30">
                {product.category}
              </div>
              <h1 className="text-4xl lg:text-5xl font-black mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                {product.title}
              </h1>
              <p className="text-gray-400 mb-8 leading-relaxed text-lg font-light">
                {product.description}
              </p>
              
              {/* Variant Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Select Configuration</h3>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map(variant => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-6 py-3 rounded-xl border transition-all duration-300 font-medium ${
                          selectedVariant?.id === variant.id
                            ? 'border-blue-500 bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/20'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        {variant.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Specs Table */}
              {selectedVariant && (
                <div className="mb-8 bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">Technical Specifications</h4>
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div>
                      <span className="text-gray-500 block mb-1">Pixel Pitch</span>
                      <span className="text-white font-mono text-lg">{selectedVariant.pixel_pitch}mm</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Dimensions</span>
                      <span className="text-white font-mono text-lg">{selectedVariant.width_cm}cm x {selectedVariant.height_cm}cm</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing & Actions OR Admin Statistics */}
              <div className="flex flex-col space-y-6">
                
                {isAdmin ? (
                  /* Admin Statistics View */
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Admin Controls</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    </div>
                    
                    {/* Inventory Overview */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6 rounded-2xl border border-green-500/20 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">💰</span>
                          <span className="text-sm font-medium text-green-400">For Sale</span>
                        </div>
                        <p className="text-4xl font-black text-white mb-1">
                          {selectedVariant?.sale_count || 0}
                        </p>
                        <p className="text-xs text-gray-400">units in stock</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 rounded-2xl border border-purple-500/20 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">🎬</span>
                          <span className="text-sm font-medium text-purple-400">For Rent</span>
                        </div>
                        <p className="text-4xl font-black text-white mb-1">
                          {selectedVariant?.rental_count || 0}
                        </p>
                        <p className="text-xs text-gray-400">units available</p>
                      </div>
                    </div>

                    {/* Pricing Information */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                      <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">Pricing Configuration</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-black/20 rounded-xl border border-white/5">
                          <span className="text-gray-400">Sale Price</span>
                          <span className="text-2xl font-bold text-green-400 font-mono">
                            ${selectedVariant ? selectedVariant.price : product.base_price}
                          </span>
                        </div>
                        {selectedVariant?.rent_price_per_day && (
                          <div className="flex justify-between items-center p-4 bg-black/20 rounded-xl border border-white/5">
                            <span className="text-gray-400">Rental Price</span>
                            <span className="text-2xl font-bold text-purple-400 font-mono">
                              ${selectedVariant.rent_price_per_day}
                              <span className="text-sm text-gray-500 font-sans font-normal ml-1">/ day</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-4">
                      <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/20">
                        ✏️ Edit Product
                      </button>
                      <button className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-lg shadow-purple-600/20">
                        📦 Manage Inventory
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Customer Purchase/Rental View */
                  <div className="space-y-4">
                    {/* Purchase Section */}
                    {(selectedVariant?.sale_count || 0) > 0 ? (
                      <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-6 rounded-2xl border border-green-500/20">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-green-400 text-lg">Purchase</h3>
                          <span className="text-xs font-bold bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30">
                            {selectedVariant?.sale_count} in stock
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-6">
                          <span className="text-4xl font-black text-white">
                            ${selectedVariant ? selectedVariant.price : product.base_price}
                          </span>
                          <span className="text-gray-400">to own</span>
                        </div>
                        <button 
                          onClick={() => {
                            if (!product || !selectedVariant) return;
                            addItem({
                              productId: product.id,
                              variantId: selectedVariant.id,
                              title: product.title,
                              variantName: selectedVariant.name,
                              price: parseFloat(selectedVariant.price),
                              quantity: 1,
                              type: 'buy'
                            });
                            alert('Added to cart!');
                          }}
                          className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] shadow-lg shadow-green-600/20"
                        >
                          Add to Purchase Cart
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 opacity-50 cursor-not-allowed">
                         <h3 className="font-bold text-gray-500 mb-2">Purchase</h3>
                         <p className="text-sm text-gray-500">Currently out of stock for purchase.</p>
                      </div>
                    )}

                    {/* Rental Section */}
                    {(selectedVariant?.rental_count || 0) > 0 ? (
                      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-6 rounded-2xl border border-purple-500/20">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-purple-400 text-lg">Rental</h3>
                          <span className="text-xs font-bold bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30">
                            {selectedVariant?.rental_count} available
                          </span>
                        </div>
                        {selectedVariant?.rent_price_per_day && (
                          <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-4xl font-black text-white">
                              ${selectedVariant.rent_price_per_day}
                            </span>
                            <span className="text-gray-400">/ day</span>
                          </div>
                        )}
                        <button 
                          onClick={() => {
                            if (!product || !selectedVariant) return;
                            addItem({
                              productId: product.id,
                              variantId: selectedVariant.id,
                              title: product.title,
                              variantName: selectedVariant.name,
                              price: parseFloat(selectedVariant.rent_price_per_day || '0'),
                              quantity: 1,
                              type: 'rent',
                              rentDays: 1
                            });
                            alert('Added rental request to cart!');
                          }}
                          className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] shadow-lg shadow-purple-600/20"
                        >
                          Add to Rental Cart
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 opacity-50 cursor-not-allowed">
                         <h3 className="font-bold text-gray-500 mb-2">Rental</h3>
                         <p className="text-sm text-gray-500">Currently unavailable for rent.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
