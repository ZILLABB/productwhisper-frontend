import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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

interface GroupListing {
  platform: string;
  product: ScrapedProduct;
  vendorName?: string;
  trustLevel?: string;
}

interface ProductGroup {
  groupId: string;
  name: string;
  listings: GroupListing[];
  lowestPrice: number;
  highestPrice: number;
  cheapestPlatform: string;
  savings: number;
  platformCount: number;
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

interface PlatformResult {
  platform: string;
  products: ScrapedProduct[];
  count: number;
  error?: string;
}

interface LiveSearchData {
  query: string;
  totalResults: number;
  searchTimeMs: number;
  priceSummary: PriceSummary;
  recommendation: Recommendation | null;
  groups: ProductGroup[];
  unmatchedProducts: ScrapedProduct[];
  platforms: Record<string, PlatformResult>;
  allProducts: ScrapedProduct[];
}

/* ─── Platform Branding ────────────────────────────────── */

const PLATFORMS = ['JUMIA', 'KONGA', 'JIJI'] as const;

const PLATFORM_META: Record<string, { color: string; bg: string; border: string; logoUrl: string; siteUrl: string }> = {
  JUMIA: {
    color: '#f68b1e',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Jumia_logo.svg/512px-Jumia_logo.svg.png',
    siteUrl: 'https://www.jumia.com.ng',
  },
  KONGA: {
    color: '#ed1c24',
    bg: 'bg-red-50',
    border: 'border-red-200',
    logoUrl: 'https://www-konga-com-res.cloudinary.com/image/upload/v1618837814/content/konga_logo.png',
    siteUrl: 'https://www.konga.com',
  },
  JIJI: {
    color: '#00a651',
    bg: 'bg-green-50',
    border: 'border-green-200',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Jiji-logo.svg/512px-Jiji-logo.svg.png',
    siteUrl: 'https://jiji.ng',
  },
};

/* ─── Helpers ──────────────────────────────────────────── */

function formatNGN(amount: number): string {
  return '₦' + amount.toLocaleString();
}

function trustBadge(level?: string) {
  switch (level) {
    case 'trusted':
      return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-100 rounded-full px-1.5 py-0.5"><FiCheckCircle size={10} /> Trusted</span>;
    case 'verified':
      return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-100 rounded-full px-1.5 py-0.5"><FiShield size={10} /> Verified</span>;
    case 'average':
      return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-yellow-700 bg-yellow-100 rounded-full px-1.5 py-0.5"><FiShield size={10} /> Average</span>;
    case 'caution':
      return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 rounded-full px-1.5 py-0.5"><FiAlertTriangle size={10} /> Caution</span>;
    default:
      return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 rounded-full px-1.5 py-0.5">Unknown</span>;
  }
}

/* ─── Platform Logo Component ──────────────────────────── */

const PlatformLogo: React.FC<{ platform: string; size?: number }> = ({ platform, size = 24 }) => {
  const meta = PLATFORM_META[platform];
  const [imgError, setImgError] = useState(false);

  if (!meta || imgError) {
    return (
      <div
        className="rounded flex items-center justify-center text-white font-bold"
        style={{ width: size, height: size, backgroundColor: meta?.color || '#666', fontSize: size * 0.5 }}
      >
        {platform?.[0] || '?'}
      </div>
    );
  }

  return (
    <img
      src={meta.logoUrl}
      alt={platform}
      className="object-contain"
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
    />
  );
};

/* ─── Comparison Row (one product across platforms) ─────── */

const ComparisonRow: React.FC<{
  group: ProductGroup;
  index: number;
}> = ({ group, index }) => {
  const [expanded, setExpanded] = useState(false);

  // Build a map: platform → listing (or null if not found)
  const listingMap: Record<string, GroupListing | null> = {};
  for (const p of PLATFORMS) {
    listingMap[p] = group.listings.find(l => l.platform === p) || null;
  }

  // Best image from any listing
  const bestImage = group.listings.find(l => l.product.imageUrl)?.product.imageUrl;
  const placeholder = `https://placehold.co/120x120/f3f4f6/9ca3af?text=${encodeURIComponent(group.name.substring(0, 12))}`;

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow ${index === 0 ? 'ring-2 ring-green-200' : ''}`}>
      {/* Main row */}
      <div className="p-4 sm:p-5">
        <div className="flex gap-4">
          {/* Product image */}
          <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
            {bestImage ? (
              <img src={bestImage} alt={group.name} loading="lazy" decoding="async" className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).src = placeholder; }} />
            ) : (
              <div className="text-gray-300 text-3xl font-bold">{group.name[0]}</div>
            )}
          </div>

          {/* Product info + platform prices */}
          <div className="flex-1 min-w-0">
            {/* Title + savings badge */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2">{group.name}</h3>
              {group.savings > 0 && (
                <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full whitespace-nowrap">
                  <FiTrendingDown size={12} />
                  Save {formatNGN(group.savings)}
                </span>
              )}
            </div>

            {/* Platform price columns */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {PLATFORMS.map((platform) => {
                const listing = listingMap[platform];
                const meta = PLATFORM_META[platform];
                const isCheapest = listing && listing.product.price === group.lowestPrice;

                return (
                  <div
                    key={platform}
                    className={`relative rounded-lg p-2 sm:p-3 text-center transition-colors ${
                      listing
                        ? isCheapest
                          ? 'bg-green-50 border-2 border-green-300'
                          : `${meta.bg} border border-gray-200`
                        : 'bg-gray-50 border border-dashed border-gray-200'
                    }`}
                  >
                    {/* Platform logo */}
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      <PlatformLogo platform={platform} size={18} />
                      <span className="text-[11px] font-medium text-gray-600">{platform}</span>
                    </div>

                    {listing ? (
                      <>
                        {/* Price */}
                        <div className={`text-base sm:text-lg font-bold ${isCheapest ? 'text-green-600' : 'text-gray-900'}`}>
                          {formatNGN(listing.product.price)}
                        </div>

                        {/* Cheapest badge */}
                        {isCheapest && (
                          <div className="text-[10px] font-semibold text-green-600 mt-0.5">BEST PRICE</div>
                        )}

                        {/* How much more */}
                        {!isCheapest && listing.product.price > group.lowestPrice && (
                          <div className="flex items-center justify-center gap-0.5 text-[10px] text-red-500 mt-0.5">
                            <FiTrendingUp size={10} />
                            +{formatNGN(listing.product.price - group.lowestPrice)}
                          </div>
                        )}

                        {/* Vendor */}
                        <div className="mt-1.5">
                          {listing.vendorName ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-[10px] text-gray-500 truncate max-w-full">{listing.vendorName}</span>
                              {trustBadge(listing.trustLevel)}
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400">Seller N/A</span>
                          )}
                        </div>

                        {/* Buy button */}
                        <a
                          href={listing.product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-semibold text-white transition-colors"
                          style={{ backgroundColor: isCheapest ? '#16a34a' : meta.color }}
                        >
                          {isCheapest ? 'Buy Here' : 'View'} <FiExternalLink size={10} />
                        </a>
                      </>
                    ) : (
                      <div className="py-3">
                        <span className="text-xs text-gray-400">Not found</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Expand toggle for details */}
        {group.listings.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {expanded ? 'Hide details' : 'Show details'}
            {expanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 sm:px-5 py-3 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {group.listings.map((listing, idx) => {
              const meta = PLATFORM_META[listing.platform];
              return (
                <div key={idx} className="bg-white rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <PlatformLogo platform={listing.platform} size={16} />
                    <span className="text-xs font-medium" style={{ color: meta?.color }}>{listing.platform}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 rounded px-1 py-0.5">
                      {listing.product.condition.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-2 mb-1">{listing.product.title}</p>
                  {listing.product.description && (
                    <p className="text-[10px] text-gray-500 line-clamp-2">{listing.product.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Unmatched product card (single platform) ─────────── */

const UnmatchedCard: React.FC<{ product: ScrapedProduct }> = ({ product }) => {
  const meta = PLATFORM_META[product.platform];
  const placeholder = `https://placehold.co/80x80/${meta?.color?.replace('#', '') || '666'}/ffffff?text=${product.platform[0]}`;

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3 hover:shadow-sm transition-shadow">
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.title} loading="lazy" decoding="async" className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).src = placeholder; }} />
          ) : (
            <div className="text-gray-300 text-xl font-bold">{product.title[0]}</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <PlatformLogo platform={product.platform} size={14} />
            <span className="text-[10px] font-medium text-gray-500">{product.platform}</span>
          </div>
          <h4 className="text-xs font-medium text-gray-900 line-clamp-1">{product.title}</h4>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-bold" style={{ color: meta?.color || '#333' }}>{formatNGN(product.price)}</span>
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-medium text-gray-500 hover:text-gray-700 flex items-center gap-0.5"
            >
              View <FiExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ────────────────────────────────────────── */

const PriceComparePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<LiveSearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUnmatched, setShowUnmatched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;

    setLoading(true);
    setError('');
    setData(null);
    setSearchParams({ q: q.trim() });

    try {
      const response = await apiService.liveSearch(q.trim(), 10);
      if (response?.data) {
        setData(response.data);
      }
    } catch (err: any) {
      console.error('Live search failed:', err);
      setError(err?.message || 'Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

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

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-10 sm:py-14 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
            Compare Prices Across Nigeria
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Search any product and instantly see prices from Jumia, Konga & Jiji side-by-side.
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <FiLoader className="animate-spin text-primary mb-4" size={48} />
            <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">
              Searching across platforms...
            </h3>
            <p className="text-gray-500 mb-6">Finding the best prices for you</p>
            <div className="flex gap-6">
              {PLATFORMS.map((p) => (
                <div key={p} className="flex flex-col items-center gap-2 animate-pulse">
                  <PlatformLogo platform={p} size={40} />
                  <span className="text-xs text-gray-500">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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

              {/* Platform status pills */}
              <div className="flex gap-2">
                {PLATFORMS.map((p) => {
                  const plat = data.platforms[p];
                  const meta = PLATFORM_META[p];
                  return (
                    <div key={p} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${plat?.error ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
                      <PlatformLogo platform={p} size={16} />
                      <span className="text-xs font-medium text-gray-700">{p}</span>
                      {plat?.error ? (
                        <span className="text-[10px] text-red-500">Failed</span>
                      ) : (
                        <span className="text-[10px] text-gray-500">{plat?.count || 0}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── Column Headers ───────────────────────────── */}
            <div className="hidden sm:flex items-center bg-gray-100 rounded-xl px-5 py-3 mb-4">
              <div className="w-24 mr-4" /> {/* image spacer */}
              <div className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</div>
              <div className="grid grid-cols-3 gap-3 w-[420px] flex-shrink-0">
                {PLATFORMS.map((p) => (
                  <div key={p} className="flex items-center justify-center gap-1.5">
                    <PlatformLogo platform={p} size={20} />
                    <span className="text-xs font-semibold text-gray-700">{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Grouped Comparison Rows ──────────────────── */}
            {data.groups && data.groups.length > 0 && (
              <div className="space-y-3 mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" size={16} />
                  Cross-Platform Matches ({data.groups.length})
                </h2>
                {data.groups.map((group, idx) => (
                  <ComparisonRow key={group.groupId} group={group} index={idx} />
                ))}
              </div>
            )}

            {/* ─── No groups found message ──────────────────── */}
            {data.groups && data.groups.length === 0 && data.totalResults > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-8 text-center">
                <FiAlertTriangle className="mx-auto text-yellow-500 mb-2" size={24} />
                <p className="text-sm text-yellow-800 font-medium">
                  No exact cross-platform matches found for this search.
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Try a more specific search (e.g. "iPhone 15 128GB" instead of just "iPhone")
                </p>
              </div>
            )}

            {/* ─── Unmatched / Other Results ────────────────── */}
            {data.unmatchedProducts && data.unmatchedProducts.length > 0 && (
              <div>
                <button
                  onClick={() => setShowUnmatched(!showUnmatched)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 hover:text-gray-700 transition-colors"
                >
                  Other Results ({data.unmatchedProducts.length})
                  {showUnmatched ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                </button>

                {showUnmatched && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data.unmatchedProducts.map((product, idx) => (
                      <UnmatchedCard key={`${product.platform}-${product.externalId}-${idx}`} product={product} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No results at all */}
            {data.totalResults === 0 && (
              <div className="text-center py-16">
                <FiSearch className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-xl font-display font-semibold text-gray-700 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6">Try a different search term or check back later.</p>
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
                <p className="text-sm text-gray-500">See the same product on all platforms</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <FiCheckCircle className="text-green-600" size={20} />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">3. Save</h3>
                <p className="text-sm text-gray-500">Buy from the cheapest trusted seller</p>
              </div>
            </div>

            {/* Platform logos */}
            <div className="mt-10 flex items-center justify-center gap-8">
              {PLATFORMS.map((p) => (
                <div key={p} className="flex flex-col items-center gap-2 opacity-60">
                  <PlatformLogo platform={p} size={40} />
                  <span className="text-xs text-gray-500">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceComparePage;
