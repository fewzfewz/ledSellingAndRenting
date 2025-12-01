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
  
  const [isNewProduct, setIsNewProduct] = useState(false);
  
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
    serial_number: '',
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
    if (!formData.serial_number) {
      alert('Serial Number is required');
      return;
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
        serial_number: formData.serial_number,
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
          
          {/* Toggle Mode */}
          <div className="flex p-1 bg-gray-100 rounded-lg mb-8">
            <button
              type="button"
              onClick={() => setIsNewProduct(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                !isNewProduct ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Add to Existing Product
            </button>
            <button
              type="button"
              onClick={() => setIsNewProduct(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                isNewProduct ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Create New Product
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {!isNewProduct ? (
              /* Existing Product Selection */
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={!isNewProduct}
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variant <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.variant_id}
                    onChange={(e) => setFormData({ ...formData, variant_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={!isNewProduct}
                    disabled={!formData.product_id}
                  >
                    <option value="">Select a variant</option>
                    {variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.sku} - ${variant.base_price}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              /* New Product Fields */
              <div className="space-y-4 border-b border-gray-200 pb-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">New Product Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g. P2.6 Indoor Poster Screen"
                    required={isNewProduct}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g. P2.6-IN"
                      required={isNewProduct}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="Indoor">Indoor</option>
                      <option value="Outdoor">Outdoor</option>
                      <option value="Rental">Rental</option>
                      <option value="Fixed">Fixed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required={isNewProduct}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pixel Pitch (mm)</label>
                    <input
                      type="text"
                      value={formData.pixel_pitch}
                      onChange={(e) => setFormData({ ...formData, pixel_pitch: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="2.6"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
                    <input
                      type="text"
                      value={formData.width_cm}
                      onChange={(e) => setFormData({ ...formData, width_cm: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                    <input
                      type="text"
                      value={formData.height_cm}
                      onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="100"
                    />
                  </div>
                </div>

                {/* Rental Price - Highlighted if rental type selected */}
                <div className={`transition-all duration-300 ${formData.inventory_type === 'rental' ? 'bg-blue-50 p-4 rounded-lg border border-blue-100' : ''}`}>
                  <label className={`block text-sm font-medium mb-1 ${formData.inventory_type === 'rental' ? 'text-blue-800' : 'text-gray-700'}`}>
                    Rental Price / Day ($)
                    {formData.inventory_type === 'rental' && <span className="ml-2 text-xs font-normal text-blue-600">(Recommended for rentals)</span>}
                  </label>
                  <input
                    type="number"
                    value={formData.rent_price_per_day}
                    onChange={(e) => setFormData({ ...formData, rent_price_per_day: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg ${formData.inventory_type === 'rental' ? 'border-blue-300 focus:ring-blue-500' : 'border-gray-300'}`}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            )}

            {/* Common Fields */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Details</h3>
              
              {/* Serial Number */}
              <div className="mb-4">
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
              </div>

              {/* Status */}
              <div className="mb-4">
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

              {/* Inventory Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Inventory Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="inventory_type"
                      value="rental"
                      checked={formData.inventory_type === 'rental'}
                      onChange={(e) => setFormData({ ...formData, inventory_type: 'rental' })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">For Rental</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="inventory_type"
                      value="sale"
                      checked={formData.inventory_type === 'sale'}
                      onChange={(e) => setFormData({ ...formData, inventory_type: 'sale' })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">For Sale</span>
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-2">⚠️ This cannot be changed after creation</p>
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
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : (isNewProduct ? 'Create Product & Add Unit' : 'Add Inventory Unit')}
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
