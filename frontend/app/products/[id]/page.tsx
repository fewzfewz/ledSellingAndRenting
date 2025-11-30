'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { apiGet } from '../../../lib/api';
import { useCart } from '../../../contexts/CartContext';

interface Variant {
  id: string;
  name: string;
  price: string;
  rent_price_per_day: string;
  pixel_pitch: string;
  width_cm: string;
  height_cm: string;
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

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-12 text-center">Loading...</div></div>;
  if (error || !product) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-12 text-center text-red-500">{error || 'Product not found'}</div></div>;

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Image Gallery */}
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 h-96 md:h-auto flex items-center justify-center">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-8">
                  <div className="text-8xl mb-4">📺</div>
                  <p className="text-gray-500 text-lg">No Image Available</p>
                </div>
              )}
            </div>
            
            {/* Right: Details */}
            <div className="p-8 md:p-12">
              <div className="text-sm text-blue-500 font-semibold mb-2 uppercase tracking-wide">{product.category}</div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">{product.title}</h1>
              <p className="text-gray-600 mb-8 leading-relaxed">{product.description}</p>
              
              {/* Variant Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Select Configuration</h3>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map(variant => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          selectedVariant?.id === variant.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-blue-300 text-gray-700'
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
                <div className="mb-8 bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Specifications</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-gray-500">Pixel Pitch</div>
                    <div className="font-medium">{selectedVariant.pixel_pitch}mm</div>
                    <div className="text-gray-500">Dimensions</div>
                    <div className="font-medium">{selectedVariant.width_cm}cm x {selectedVariant.height_cm}cm</div>
                  </div>
                </div>
              )}

              {/* Pricing & Actions */}
              <div className="flex flex-col space-y-4">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ${selectedVariant ? selectedVariant.price : product.base_price}
                  </span>
                  <span className="text-gray-500">to buy</span>
                </div>
                {selectedVariant?.rent_price_per_day && (
                   <div className="flex items-baseline space-x-2">
                   <span className="text-xl font-bold text-blue-600">
                     ${selectedVariant.rent_price_per_day}
                   </span>
                   <span className="text-gray-500">/ day to rent</span>
                 </div>
                )}

                <div className="flex space-x-4 pt-4">
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Add to Cart
                  </button>
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
                    className="flex-1 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Request Rental
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
