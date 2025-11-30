'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [editMode, setEditMode] = useState(false);
  const [heroContent, setHeroContent] = useState({
    title: 'Premium LED Screens',
    subtitle: 'For Sale & Rent',
    description: 'Transform your events and spaces with our high-definition indoor and outdoor LED displays.'
  });

  const [features, setFeatures] = useState([
    { icon: '💎', title: 'Premium Quality', description: 'Top-tier LED panels with high refresh rates and vibrant colors.' },
    { icon: '🛠️', title: 'Expert Installation', description: 'Our professional team handles setup, operation, and teardown.' },
    { icon: '🚀', title: 'Fast Delivery', description: 'Quick turnaround for rentals and sales with reliable logistics.' }
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Admin Controls */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">👑 Admin Mode</span>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              {editMode ? '✓ Save Changes' : '✏️ Edit Page'}
            </button>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <div className="relative bg-gray-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="h-full w-full bg-gradient-to-r from-blue-900 to-purple-900"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-32 flex flex-col items-center text-center">
          {editMode ? (
            <div className="w-full max-w-2xl space-y-4">
              <input
                type="text"
                value={heroContent.title}
                onChange={(e) => setHeroContent({...heroContent, title: e.target.value})}
                className="w-full px-4 py-3 text-4xl font-bold text-center bg-white/10 border-2 border-white/30 rounded-lg text-white placeholder-white/50"
              />
              <input
                type="text"
                value={heroContent.subtitle}
                onChange={(e) => setHeroContent({...heroContent, subtitle: e.target.value})}
                className="w-full px-4 py-3 text-3xl font-bold text-center bg-white/10 border-2 border-blue-400 rounded-lg text-blue-400 placeholder-blue-300"
              />
              <textarea
                value={heroContent.description}
                onChange={(e) => setHeroContent({...heroContent, description: e.target.value})}
                className="w-full px-4 py-3 text-lg text-center bg-white/10 border-2 border-white/30 rounded-lg text-gray-300 placeholder-gray-400"
                rows={3}
              />
            </div>
          ) : (
            <>
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                {heroContent.title} <br />
                <span className="text-blue-400">{heroContent.subtitle}</span>
              </h1>
              <p className="text-xl md:text-2xl mb-10 max-w-2xl text-gray-300">
                {heroContent.description}
              </p>
            </>
          )}
          
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 mt-6">
            <Link href="/products" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition-colors">
              Shop Screens
            </Link>
            <Link href="/products" className="px-8 py-4 bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 rounded-lg text-lg font-semibold transition-colors">
              Rent a Screen
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">Why Choose Us?</h2>
          {isAdmin && editMode && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              + Add Feature
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow relative group">
              {isAdmin && editMode && (
                <button className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  Delete
                </button>
              )}
              <div className="text-blue-500 text-4xl mb-4">{feature.icon}</div>
              {editMode ? (
                <>
                  <input
                    type="text"
                    value={feature.title}
                    onChange={(e) => {
                      const newFeatures = [...features];
                      newFeatures[index].title = e.target.value;
                      setFeatures(newFeatures);
                    }}
                    className="w-full px-3 py-2 text-xl font-bold mb-2 border-2 border-blue-300 rounded"
                  />
                  <textarea
                    value={feature.description}
                    onChange={(e) => {
                      const newFeatures = [...features];
                      newFeatures[index].description = e.target.value;
                      setFeatures(newFeatures);
                    }}
                    className="w-full px-3 py-2 text-gray-600 border-2 border-gray-300 rounded"
                    rows={3}
                  />
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
