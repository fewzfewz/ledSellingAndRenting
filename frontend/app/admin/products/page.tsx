'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { useAuth } from '../../../contexts/AuthContext';
import { apiGet, apiPost } from '../../../lib/api';

interface Product {
  id: string;
  title: string;
  sku: string;
  category: string;
  base_price: string;
  for_rent: boolean;
  for_sale: boolean;
}

export default function AdminProductsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    if (user && token) {
      fetchProducts();
    }
  }, [user, token, authLoading, router]);

  const fetchProducts = async () => {
    try {
      const data = await apiGet('/products?limit=100'); // Fetch all for now
      setProducts(data.products || data);
      setLoading(false);
    } catch (err: any) {
      setError('Failed to load products');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      // Need to implement DELETE endpoint in backend first if not exists
      // Assuming it exists or I will add it
      const res = await fetch(`http://localhost:4000/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        alert('Failed to delete product');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting product');
    }
  };

  if (authLoading || loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-12 text-center">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <Link href="/admin/products/new" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Add New Product
          </Link>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">Title</th>
                <th className="px-6 py-4 font-semibold text-gray-700">SKU</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Category</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Price</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{product.title}</td>
                  <td className="px-6 py-4 text-gray-600">{product.sku}</td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{product.category}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">${product.base_price}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-3">
                      <Link href={`/admin/products/${product.id}/edit`} className="text-blue-600 hover:text-blue-800 font-medium">
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No products found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
