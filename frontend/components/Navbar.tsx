'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold tracking-wider text-blue-500">
            LED<span className="text-white">Master</span>
          </Link>
          
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="hover:text-blue-400 transition-colors">Home</Link>
            <Link href="/products" className="hover:text-blue-400 transition-colors">Products</Link>
            {user && user.role === 'admin' && (
              <Link href="/admin/dashboard" className="hover:text-blue-400 transition-colors">Admin</Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-300">
                  {user.name || user.email}
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded hover:bg-gray-800 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 rounded hover:bg-gray-800 transition-colors">
                  Login
                </Link>
                <Link href="/register" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
