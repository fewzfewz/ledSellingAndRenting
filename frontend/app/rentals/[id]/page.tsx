'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { useAuth } from '../../../contexts/AuthContext';
import { apiGet } from '../../../lib/api';

export default function RentalDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [rental, setRental] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/rentals/' + id);
      return;
    }

    fetchRental();
  }, [user, id, router]);

  const fetchRental = async () => {
    try {
      setLoading(true);
      const data = await apiGet(`/rentals/${id}`);
      setRental(data);
    } catch (err) {
      console.error('Failed to fetch rental:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-3 py-1 text-sm rounded-full font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading rental details...</p>
        </div>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Rental Not Found</h1>
          <p className="text-gray-600 mb-6">The rental you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const duration = calculateDuration(rental.start_date, rental.end_date);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
          >
            ← Back to Dashboard
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rental #{rental.id.slice(0, 8)}</h1>
              <p className="text-gray-600 mt-1">
                {formatDate(rental.start_date)} - {formatDate(rental.end_date)} ({duration} days)
              </p>
            </div>
            {getStatusBadge(rental.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rental Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Rental Items</h2>
              <div className="space-y-4">
                {rental.items && rental.items.map((item: any) => (
                  <div key={item.id} className="flex items-center py-4 border-b last:border-0">
                    <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">
                      Img
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold text-gray-900">LED Screen Unit</h3>
                      <p className="text-sm text-gray-500">Variant ID: {item.variant_id}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Quantity: {item.quantity} × ${item.unit_rent_price}/day
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ${(item.quantity * parseFloat(item.unit_rent_price) * duration).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">for {duration} days</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rental Timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h2 className="text-xl font-bold mb-4">Rental Timeline</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-24 text-sm text-gray-500">Start Date</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{formatDate(rental.start_date)}</p>
                    <p className="text-sm text-gray-600">Equipment pickup/delivery</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-24 text-sm text-gray-500">End Date</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{formatDate(rental.end_date)}</p>
                    <p className="text-sm text-gray-600">Equipment return</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rental Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Rental Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Duration</span>
                  <span>{duration} days</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Rental Amount</span>
                  <span>${rental.total_amount}</span>
                </div>
                {rental.deposit_amount && (
                  <div className="flex justify-between text-gray-600">
                    <span>Deposit</span>
                    <span>${rental.deposit_amount}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>${rental.total_amount}</span>
                </div>
              </div>

              {/* Status Info */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Rental Status</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Current Status:</span> {rental.status}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Booked on:</span> {formatDate(rental.created_at)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {rental.status === 'pending' && (
                <div className="border-t pt-6 mt-6">
                  <button className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium">
                    Cancel Rental
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
