import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TrendingDown, AlertTriangle, RefreshCw, Tag, ArrowDown } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import { apiService } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import SafetyDisclaimer from '../components/common/SafetyDisclaimer';
import useSEO from '../hooks/useSEO';

interface Deal {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  platform: string;
  currentPrice: number;
  previousPrice: number;
  dropPercent: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  JUMIA: 'bg-orange-100 text-orange-800',
  KONGA: 'bg-blue-100 text-blue-800',
  JIJI: 'bg-green-100 text-green-800',
};

const PAGE_SIZE = 12;

const DealsPage: React.FC = () => {
  useSEO({
    title: 'Price Drops & Deals',
    description: 'Find the best price drops across Nigerian e-commerce platforms. Track savings on phones, laptops, and electronics.',
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;

  const [deals, setDeals] = useState<Deal[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'dropPercent' | 'currentPrice' | 'savings'>('dropPercent');

  const fetchDeals = useCallback(async (page: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.get(`/prices/deals?limit=${PAGE_SIZE}&page=${page}`);
      const body = response.data;
      const data = body?.data || [];
      const pagination = body?.pagination;
      setDeals(Array.isArray(data) ? data : []);
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotal(pagination.total || data.length);
      }
    } catch (err) {
      console.error('Failed to fetch deals:', err);
      setError('Failed to load deals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals(currentPage);
  }, [currentPage, fetchDeals]);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: String(page) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sortedDeals = [...deals].sort((a, b) => {
    switch (sortBy) {
      case 'dropPercent': return b.dropPercent - a.dropPercent;
      case 'currentPrice': return a.currentPrice - b.currentPrice;
      case 'savings': return (b.previousPrice - b.currentPrice) - (a.previousPrice - a.currentPrice);
      default: return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="large" text="Finding best deals..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load deals"
          description={error}
          actions={[{ label: 'Retry', onClick: () => fetchDeals(currentPage), variant: 'primary', icon: RefreshCw }]}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-100 rounded-lg">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Price Drops & Deals</h1>
        </div>
        <p className="text-gray-600">
          Products with the biggest price drops across Jumia, Konga, and Jiji. Updated automatically.
        </p>
      </div>

      {/* Safety Banner */}
      <SafetyDisclaimer variant="banner" className="mb-6" />

      {/* Sort Controls */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-gray-500">Sort by:</span>
        {[
          { key: 'dropPercent' as const, label: 'Biggest Drop %' },
          { key: 'savings' as const, label: 'Most Savings' },
          { key: 'currentPrice' as const, label: 'Lowest Price' },
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              sortBy === opt.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => fetchDeals(currentPage)}
          className="ml-auto p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh deals"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Deals Grid */}
      {sortedDeals.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No deals found"
          description="No price drops detected yet. Deals appear after products are scraped multiple times to detect price changes."
        />
      ) : (
        <>
          <div className="text-sm text-gray-500 mb-4">
            {total} deal{total !== 1 ? 's' : ''} found
            {totalPages > 1 && ` — page ${currentPage} of ${totalPages}`}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedDeals.map((deal, idx) => {
              const savings = deal.previousPrice - deal.currentPrice;

              return (
                <Link
                  key={`${deal.id}-${deal.platform}-${idx}`}
                  to={`/product/${deal.slug || deal.id}`}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 group"
                >
                  {/* Deal Badge */}
                  <div className="relative">
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white text-sm font-bold rounded-full shadow-sm">
                        <ArrowDown className="w-3.5 h-3.5" />
                        {deal.dropPercent.toFixed(0)}% OFF
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 z-10">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${PLATFORM_COLORS[deal.platform] || 'bg-gray-100 text-gray-600'}`}>
                        {deal.platform}
                      </span>
                    </div>
                    {/* Image */}
                    <div className="h-44 bg-gray-50 flex items-center justify-center p-4">
                      {deal.imageUrl ? (
                        <img
                          src={deal.imageUrl}
                          alt={deal.name}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://placehold.co/300x300/1e3a5f/ffffff?text=${encodeURIComponent(deal.name.split(' ').slice(0, 3).join(' '))}`;
                          }}
                        />
                      ) : (
                        <div className="text-center text-gray-400">
                          <Tag className="w-10 h-10 mx-auto mb-1" />
                          <span className="text-xs">No image</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-3">
                      {deal.name}
                    </h3>

                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-lg font-bold text-green-700">
                          {formatPrice(deal.currentPrice)}
                        </div>
                        <div className="text-sm text-gray-400 line-through">
                          {formatPrice(deal.previousPrice)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-red-600">
                          Save {formatPrice(savings, true)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DealsPage;
