'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminProductsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to main products page where admins have full control
    router.push('/products');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Redirecting to products...</p>
      </div>
    </div>
  );
}
