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

          <div className="flex items-center space-x-6">
            {/* Shopping Cart */}
            <Link href="/cart" className="relative group">
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                <svg 
                  className="w-6 h-6 text-gray-300 group-hover:text-blue-400 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>

            {/* User Section */}
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-gray-300 hover:text-blue-400 transition-colors">
                  {user.name || user.email}
                </Link>
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
