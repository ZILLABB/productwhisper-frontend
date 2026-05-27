import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FiSearch,
  FiExternalLink,
  FiTrendingDown,
  FiTrendingUp,
  FiShield,
  FiAlertTriangle,
  FiClock,
  FiCheckCircle,
  FiLoader,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { apiService } from '../services/api';

/* ─── Types ─────────────────────────────────────────────── */

interface ScrapedVendor {
  externalId: string;
  name: string;
  profileUrl?: string;
  rating?: number;
  isVerified?: boolean;
}

interface ScrapedProduct {
  externalId: string;
  platform: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  url: string;
  imageUrl?: string;
  description?: string;
  vendor?: ScrapedVendor;
  metadata?: Record<string, unknown>;
}

interface PriceSummary {
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  currency: string;
  cheapestPlatform: string;
  savings: number;
}

interface Recommendation {
  platform: string;
  title: string;
  price: number;
  url: string;
  vendor: string;
  reason: string;
}

interface VendorSummary {
  platform: string;
  vendorName: string;
  vendorRating?: number;
  isVerified?: boolean;
  profileUrl?: string;
  trustLevel: 'trusted' | 'average' | 'caution' | 'verified' | 'unknown';
}

interface PlatformResult {
  platform: string;
  products: ScrapedProduct[];
  count: number;
  error?: string;
}

interface LiveSearchResponse {
  success: boolean;
  data: {
    query: string;
    totalResults: number;
    searchTimeMs: number;
    priceSummary: PriceSummary;
    recommendation: Recommendation | null;
    platforms: Record<string, PlatformResult>;
    allProducts: ScrapedProduct[];
    vendors: VendorSummary[];
  };
}

/* ─── Platform Branding ────────────────────────────────── */

const PLATFORM_META: Record<string, { color: string; bg: string; logo: string; url: string }> = {
  JUMIA: { color: '#f68b1e', bg: 'bg-orange-50', logo: 'https://placehold.co/40x40/f68b1e/ffffff?text=J', url: 'https://www.jumia.com.ng' },
  KONGA: { color: '#ed1c24', bg: 'bg-red-50', logo: 'https://placehold.co/40x40/ed1c24/ffffff?text=K', url: 'https://www.konga.com' },
  JIJI:  { color: '#00a651', bg: 'bg-green-50', logo: 'https://placehold.co/40x40/00a651/ffffff?text=Ji', url: 'https://jiji.ng' },
};

/* ─── Helpers ──────────────────────────────────────────── */

function formatNGN(amount: number): string {
  return '₦' + amount.toLocaleString();
}

function trustBadge(level: string) {
  switch (level) {
    case 'trusted':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 rounded-full px-2 py-0.5">
          <FiCheckCircle size={12} /> Trusted
        </span>
      );
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full px-2 py-0.5">
          <FiShield size={12} /> Verified
        </span>
      );
    case 'average':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full px-2 py-0.5">
          <FiShield size={12} /> Average
        </span>
      );
    case 'caution':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 rounded-full px-2 py-0.5">
          <FiAlertTriangle size={12} /> Caution
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
          Unknown Seller
        </span>
      );
  }
}

function conditionBadge(condition: string) {
  const lower = condition.toLowerCase();
  if (lower.includes('new') || lower === 'new')
    return <span className="text-xs font-medium text-green-700 bg-green-50 rounded px-1.5 py-0.5">New</span>;
  if (lower.includes('refurbished'))
    return <span className="text-xs font-medium text-blue-700 bg-blue-50 rounded px-1.5 py-0.5">Refurbished</span>;
  if (lower.includes('uk_used'))
    return <span className="text-xs font-medium text-purple-700 bg-purple-50 rounded px-1.5 py-0.5">UK Used</span>;
  return <span className="text-xs font-medium text-gray-600 bg-gray-100 rounded px-1.5 py-0.5">{condition.replace(/_/g, ' ')}</span>;
}

/* ─── Components ───────────────────────────────────────── */

const SearchingAnimation: React.FC<{ platforms: string[] }> = ({ platforms }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative mb-8">
      <FiLoader className="animate-spin text-primary" size={48} />
    </div>
    <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">
      Searching across platforms...
    </h3>
    <p className="text-gray-500 mb-6">Finding the best prices for you</p>
    <div className="flex gap-4">
      {platforms.map((p, i) => (
        <div
          key={p}
          className="flex flex-col items-center gap-1 animate-pulse"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
            style={{ backgroundColor: PLATFORM_META[p]?.color || '#666' }}
          >
            {p[0]}
          </div>
          <span className="text-xs text-gray-500">{p}</span>
        </div>
      ))}
    </div>
  </div>
);

const ProductCard: React.FC<{
  product: ScrapedProduct;
  isLowest: boolean;
  lowestPrice: number;
  vendor?: VendorSummary;
}> = ({ product, isLowest, lowestPrice, vendor }) => {
  const meta = PLATFORM_META[product.platform] || { color: '#666', bg: 'bg-gray-50' };
  const priceDiff = product.price - lowestPrice;
  const placeholder = `https://placehold.co/200x200/${meta.color.replace('#', '')}/ffffff?text=${encodeURIComponent(product.platform)}`;

  return (
    <div
      className={`relative rounded-xl border overflow-hidden transition-shadow hover:shadow-lg ${
        isLowest ? 'border-green-300 ring-2 ring-green-100' : 'border-gray-200'
      }`}
    >
      {isLowest && (
        <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-xs font-bold text-center py-1 z-10">
          LOWEST PRICE
        </div>
      )}

      <div className={`p-4 ${isLowest ? 'pt-8' : ''}`}>
        {/* Platform badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: meta.color }}
            >
              {product.platform[0]}
            </div>
            <span className="text-sm font-medium text-gray-700">{product.platform}</span>
          </div>
          {conditionBadge(product.condition)}
        </div>

        {/* Image */}
        <div className="w-full h-32 bg-gray-50 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain p-2"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: meta.color + '22' }}
            >
              {product.platform[0]}
            </div>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
          {product.title}
        </h4>

        {/* Price */}
        <div className="mb-3">
          <span className="text-2xl font-bold" style={{ color: isLowest ? '#16a34a' : meta.color }}>
            {formatNGN(product.price)}
          </span>
          {!isLowest && priceDiff > 0 && (
            <div className="flex items-center gap-1 text-xs text-red-500 mt-0.5">
              <FiTrendingUp size={12} />
              <span>{formatNGN(priceDiff)} more</span>
            </div>
          )}
          {isLowest && (
            <div className="flex items-center gap-1 text-xs text-green-600 mt-0.5">
              <FiTrendingDown size={12} />
              <span>Best deal!</span>
            </div>
          )}
        </div>

        {/* Vendor trust */}
        <div className="mb-3">
          {vendor ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 truncate max-w-[120px]">{vendor.vendorName}</span>
              {trustBadge(vendor.trustLevel)}
            </div>
          ) : product.vendor?.name ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 truncate max-w-[120px]">{product.vendor.name}</span>
              {trustBadge('unknown')}
            </div>
          ) : (
            <span className="text-xs text-gray-400">Seller info unavailable</span>
          )}
        </div>

        {/* CTA */}
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: meta.color }}
        >
          View on {product.platform} <FiExternalLink size={14} />
        </a>
      </div>
    </div>
  );
};

/* ─── Main Page ────────────────────────────────────────── */

const PriceComparePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<LiveSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'platform'>('grid');
  const [expandedPlatforms, setExpandedPlatforms] = useState<Record<string, boolean>>({
    JUMIA: true, KONGA: true, JIJI: true,
  });

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);
    setSearchParams({ q: q.trim() });

    try {
      const response = await apiService.liveSearch(q.trim(), 10);
      setResults(response);
    } catch (err: any) {
      console.error('Live search failed:', err);
      setError(err?.message || 'Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  // Run search on mount if query in URL
  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const togglePlatform = (p: string) => {
    setExpandedPlatforms(prev => ({ ...prev, [p]: !prev[p] }));
  };

  const data = results?.data;
  const vendorMap: Record<string, VendorSummary> = {};
  if (data?.vendors) {
    for (const v of data.vendors) {
      vendorMap[`${v.platform}-${v.vendorName}`] = v;
    }
  }

  const popularSearches = [
    'iPhone 15', 'Samsung Galaxy', 'Tecno Spark', 'Infinix Hot',
    'PlayStation 5', 'MacBook', 'Oraimo FreePods', 'Hisense TV',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero / Search */}
      <div className="relative bg-gradient-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-secondary/30 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-accent/20 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
            Compare Prices Across Nigeria
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Search any product and instantly see prices from Jumia, Konga & Jiji side-by-side.
            Find the lowest price and buy with confidence.
          </p>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl overflow-hidden">
              <FiSearch className="absolute left-4 text-gray-400" size={22} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What product are you looking for?"
                className="flex-1 pl-12 pr-4 py-4 sm:py-5 text-lg text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="mr-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Compare'}
              </button>
            </div>
          </form>

          {/* Popular searches */}
          {!data && !loading && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="text-white/60 text-sm mr-1">Popular:</span>
              {popularSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); doSearch(s); }}
                  className="px-3 py-1 text-sm bg-white/15 text-white rounded-full hover:bg-white/25 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading state */}
        {loading && <SearchingAnimation platforms={['JUMIA', 'KONGA', 'JIJI']} />}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <FiAlertTriangle className="mx-auto text-red-500 mb-2" size={32} />
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={() => doSearch(query)}
              className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div>
              {/* Search meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div className="text-gray-600">
                  <span className="font-medium text-gray-900">{data.totalResults}</span> results for{' '}
                  <span className="font-medium text-gray-900">"{data.query}"</span>
                  <span className="text-gray-400 ml-2 text-sm">
                    <FiClock className="inline mr-1" size={12} />
                    {(data.searchTimeMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All Results
                  </button>
                  <button
                    onClick={() => setViewMode('platform')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'platform' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    By Platform
                  </button>
                </div>
              </div>

              {/* Price summary banner */}
              {data.priceSummary.lowestPrice > 0 && (
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Lowest Price</p>
                      <p className="text-2xl font-bold text-green-600">{formatNGN(data.priceSummary.lowestPrice)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">on {data.priceSummary.cheapestPlatform}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Highest Price</p>
                      <p className="text-2xl font-bold text-red-500">{formatNGN(data.priceSummary.highestPrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Average</p>
                      <p className="text-2xl font-bold text-gray-700">{formatNGN(data.priceSummary.averagePrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">You Could Save</p>
                      <p className="text-2xl font-bold text-primary">{formatNGN(data.priceSummary.savings)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">by choosing the cheapest</p>
                    </div>
                  </div>

                  {/* Recommendation */}
                  {data.recommendation && (
                    <div className="mt-6 pt-5 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-green-50 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                            <FiTrendingDown className="text-white" size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-800">
                              Best Deal: {formatNGN(data.recommendation.price)} on {data.recommendation.platform}
                            </p>
                            <p className="text-xs text-green-700 line-clamp-1">{data.recommendation.title}</p>
                          </div>
                        </div>
                        <a
                          href={data.recommendation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="sm:ml-auto inline-flex items-center gap-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                        >
                          Go to Deal <FiExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Platform status bar */}
              <div className="flex flex-wrap gap-3 mb-6">
                {Object.entries(data.platforms).map(([key, plat]) => {
                  const meta = PLATFORM_META[key];
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                        plat.error ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: meta?.color || '#666' }}
                      >
                        {key[0]}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{key}</span>
                      {plat.error ? (
                        <span className="text-xs text-red-500">Failed</span>
                      ) : (
                        <span className="text-xs text-gray-500">{plat.count} found</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Grid view — all products sorted by price */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {data.allProducts.map((product, idx) => (
                    <ProductCard
                      key={`${product.platform}-${product.externalId}-${idx}`}
                      product={product}
                      isLowest={product.price === data.priceSummary.lowestPrice && idx === 0}
                      lowestPrice={data.priceSummary.lowestPrice}
                      vendor={vendorMap[`${product.platform}-${product.vendor?.name}`]}
                    />
                  ))}
                </div>
              )}

              {/* Platform view — grouped by platform */}
              {viewMode === 'platform' && (
                <div className="space-y-6">
                  {(['JUMIA', 'KONGA', 'JIJI'] as const).map((platformKey) => {
                    const plat = data.platforms[platformKey];
                    if (!plat) return null;
                    const meta = PLATFORM_META[platformKey];
                    const isExpanded = expandedPlatforms[platformKey];

                    return (
                      <div key={platformKey} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <button
                          onClick={() => togglePlatform(platformKey)}
                          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                              style={{ backgroundColor: meta.color }}
                            >
                              {platformKey[0]}
                            </div>
                            <div className="text-left">
                              <h3 className="font-display font-semibold text-gray-900">{platformKey}</h3>
                              <p className="text-sm text-gray-500">
                                {plat.error ? (
                                  <span className="text-red-500">Search failed</span>
                                ) : (
                                  `${plat.count} product${plat.count !== 1 ? 's' : ''} found`
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {plat.products.length > 0 && (
                              <span className="text-sm font-medium" style={{ color: meta.color }}>
                                from {formatNGN(Math.min(...plat.products.map(p => p.price)))}
                              </span>
                            )}
                            {isExpanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                          </div>
                        </button>

                        {isExpanded && plat.products.length > 0 && (
                          <div className="overflow-hidden">
                            <div className="px-6 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {plat.products.map((product, idx) => (
                                <ProductCard
                                  key={`${product.platform}-${product.externalId}-${idx}`}
                                  product={product}
                                  isLowest={product.price === data.priceSummary.lowestPrice}
                                  lowestPrice={data.priceSummary.lowestPrice}
                                  vendor={vendorMap[`${product.platform}-${product.vendor?.name}`]}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No results */}
              {data.totalResults === 0 && (
                <div className="text-center py-16">
                  <FiSearch className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-xl font-display font-semibold text-gray-700 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Try a different search term or check back later.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {popularSearches.slice(0, 4).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setQuery(s); doSearch(s); }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
        )}

        {/* Empty state — no search yet */}
        {!data && !loading && !error && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <FiSearch className="text-primary" size={32} />
            </div>
            <h2 className="text-2xl font-display font-semibold text-gray-900 mb-3">
              Find the Best Price in Nigeria
            </h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              Search for any product and we'll check Jumia, Konga, and Jiji in real-time to find you the lowest price.
            </p>

            {/* How it works */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                  <FiSearch className="text-orange-600" size={20} />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">1. Search</h3>
                <p className="text-sm text-gray-500">Type the product you want to buy</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <FiTrendingDown className="text-blue-600" size={20} />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">2. Compare</h3>
                <p className="text-sm text-gray-500">See prices from all major platforms</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <FiCheckCircle className="text-green-600" size={20} />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">3. Save</h3>
                <p className="text-sm text-gray-500">Buy from the cheapest trusted seller</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceComparePage;
