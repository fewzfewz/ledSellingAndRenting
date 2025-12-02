'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import { apiGet, apiPost } from '../../../../lib/api';
import Navbar from '../../../../components/Navbar';

export default function AddInventoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [addMultiple, setAddMultiple] = useState(false);
  
  const [formData, setFormData] = useState({
    // Existing product fields
    product_id: '',
    variant_id: '',
    
    // New product fields
    title: '',
    sku: '',
    category: 'Indoor',
    base_price: '',
    description: '',
    image_url: '',
    pixel_pitch: '',
    width_cm: '',
    height_cm: '',
    rent_price_per_day: '',

    // Common fields
    quantity: '1',
    serial_number: '',
    serial_number_prefix: '',
    status: 'available',
    location: '',
    inventory_type: 'rental' as 'rental' | 'sale'
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
      const data = await apiGet('/products?show_all=true');
      const productsList = Array.isArray(data) ? data : (data.products || []);
      setProducts(productsList);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
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
    
    // Validation
    if (addMultiple) {
      if (!formData.serial_number_prefix || !formData.quantity) {
        alert('Serial Number Prefix and Quantity are required for bulk addition');
        return;
      }
    } else {
      if (!formData.serial_number) {
        alert('Serial Number is required');
        return;
      }
    }

    if (isNewProduct) {
      if (!formData.title || !formData.sku || !formData.base_price) {
        alert('Title, SKU, and Base Price are required for new products');
        return;
      }
    } else {
      if (!formData.variant_id) {
        alert('Please select a product and variant');
        return;
      }
    }

    try {
      setLoading(true);
      
      const payload = {
        is_new_product: isNewProduct,
        quantity: addMultiple ? parseInt(formData.quantity) : 1,
        serial_number: !addMultiple ? formData.serial_number : undefined,
        serial_number_prefix: addMultiple ? formData.serial_number_prefix : undefined,
        status: formData.status,
        location: formData.location || null,
        inventory_type: formData.inventory_type,
        
        // Existing product
        variant_id: !isNewProduct ? formData.variant_id : undefined,
        
        // New product
        title: isNewProduct ? formData.title : undefined,
        sku: isNewProduct ? formData.sku : undefined,
        category: isNewProduct ? formData.category : undefined,
        base_price: isNewProduct ? parseFloat(formData.base_price) : undefined,
        description: isNewProduct ? formData.description : undefined,
        image_url: isNewProduct ? formData.image_url : undefined,
        pixel_pitch: isNewProduct ? formData.pixel_pitch : undefined,
        width_cm: isNewProduct ? formData.width_cm : undefined,
        height_cm: isNewProduct ? formData.height_cm : undefined,
        rent_price_per_day: isNewProduct && formData.rent_price_per_day ? parseFloat(formData.rent_price_per_day) : undefined,
      };

      await apiPost('/admin/inventory', payload);

      alert(addMultiple ? `Successfully added ${formData.quantity} units!` : 'Inventory unit added successfully!');
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
          <Link href="/admin/inventory" className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Inventory
          </Link>
          <h1 className="text-4xl font-black mt-2">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Add Inventory
            </span>
          </h1>
          <p className="text-gray-400 mt-2">Add new units to your inventory tracking system</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Product Selection Card */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-2xl">📦</span>
                  Product Details
                </h3>

                {/* Mode Toggle */}
                <div className="flex p-1 bg-black/20 rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => setIsNewProduct(false)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                      !isNewProduct ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Existing Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewProduct(true)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                      isNewProduct ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Create New Product
                  </button>
                </div>

                {!isNewProduct ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Select Product</label>
                      <select
                        value={formData.product_id}
                        onChange={(e) => handleProductChange(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none cursor-pointer"
                        required={!isNewProduct}
                      >
                        <option value="" className="bg-gray-900">Select a product...</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id} className="bg-gray-900">
                            {product.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Select Variant</label>
                      <select
                        value={formData.variant_id}
                        onChange={(e) => setFormData({ ...formData, variant_id: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none cursor-pointer disabled:opacity-50"
                        required={!isNewProduct}
                        disabled={!formData.product_id}
                      >
                        <option value="" className="bg-gray-900">Select a variant...</option>
                        {variants.map((variant) => (
                          <option key={variant.id} value={variant.id} className="bg-gray-900">
                            {variant.sku} - ${variant.base_price}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Product Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                        placeholder="e.g. P2.6 Indoor Poster Screen"
                        required={isNewProduct}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">SKU</label>
                        <input
                          type="text"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                          placeholder="e.g. P2.6-IN"
                          required={isNewProduct}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none cursor-pointer"
                        >
                          <option value="Indoor" className="bg-gray-900">Indoor</option>
                          <option value="Outdoor" className="bg-gray-900">Outdoor</option>
                          <option value="Rental" className="bg-gray-900">Rental</option>
                          <option value="Fixed" className="bg-gray-900">Fixed</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Base Price ($)</label>
                      <input
                        type="number"
                        value={formData.base_price}
                        onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required={isNewProduct}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Inventory Details Card */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-2xl">🔢</span>
                  Inventory Details
                </h3>

                {/* Bulk Add Toggle */}
                <div className="flex items-center gap-3 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${addMultiple ? 'bg-blue-600' : 'bg-gray-600'}`} onClick={() => setAddMultiple(!addMultiple)}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${addMultiple ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <span className="font-medium text-gray-300">Add Multiple Units</span>
                </div>

                <div className="space-y-4">
                  {addMultiple ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                        <input
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                          min="2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Serial Prefix</label>
                        <input
                          type="text"
                          value={formData.serial_number_prefix}
                          onChange={(e) => setFormData({ ...formData, serial_number_prefix: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                          placeholder="e.g. LED-2024"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Will generate: LED-2024-1, LED-2024-2...</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Serial Number</label>
                      <input
                        type="text"
                        value={formData.serial_number}
                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                        placeholder="e.g. LED-001-2024"
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none cursor-pointer"
                      >
                        <option value="available" className="bg-gray-900">Available</option>
                        <option value="rented" className="bg-gray-900">Rented</option>
                        <option value="maintenance" className="bg-gray-900">Maintenance</option>
                        <option value="damaged" className="bg-gray-900">Damaged</option>
                        <option value="retired" className="bg-gray-900">Retired</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                        placeholder="e.g. Warehouse A"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Inventory Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        formData.inventory_type === 'rental' 
                          ? 'bg-blue-500/20 border-blue-500/50' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="inventory_type"
                            value="rental"
                            checked={formData.inventory_type === 'rental'}
                            onChange={() => setFormData({ ...formData, inventory_type: 'rental' })}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 bg-gray-900 border-gray-600"
                          />
                          <div>
                            <p className="font-medium text-white">For Rental</p>
                            <p className="text-xs text-gray-400">Recurring revenue</p>
                          </div>
                        </div>
                      </label>
                      <label className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        formData.inventory_type === 'sale' 
                          ? 'bg-green-500/20 border-green-500/50' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="inventory_type"
                            value="sale"
                            checked={formData.inventory_type === 'sale'}
                            onChange={() => setFormData({ ...formData, inventory_type: 'sale' })}
                            className="w-4 h-4 text-green-600 focus:ring-green-500 bg-gray-900 border-gray-600"
                          />
                          <div>
                            <p className="font-medium text-white">For Sale</p>
                            <p className="text-xs text-gray-400">One-time purchase</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    addMultiple ? `Add ${formData.quantity} Units` : 'Add Inventory Unit'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin/inventory')}
                  className="px-8 py-4 bg-white/5 text-gray-300 rounded-xl font-semibold hover:bg-white/10 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/5 backdrop-blur-lg rounded-2xl border border-blue-500/20 p-6">
              <h4 className="text-lg font-bold text-white mb-4">Quick Tips</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  Use "Add Multiple Units" for bulk stock updates
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  Serial prefixes automatically number units (e.g. LED-1, LED-2)
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  Rental units track daily rates and availability
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  Sale units are removed from inventory after purchase
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
