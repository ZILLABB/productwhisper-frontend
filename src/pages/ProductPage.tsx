import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiBarChart2,
  FiShare2,
  FiInfo,
  FiCheck,
  FiX,
  FiTrendingUp,
  FiTrendingDown,
  FiMessageCircle,
  FiList,
  FiExternalLink,
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { apiService } from '../services/api';
import useApi from '../hooks/useApi';
import ApiErrorFallback from '../components/common/ApiErrorFallback';
import LazyImage from '../components/common/LazyImage';
import SentimentChart from '../components/product/SentimentChart';
import ReviewCard from '../components/product/ReviewCard';
import useSEO from '../hooks/useSEO';
import SafetyDisclaimer from '../components/common/SafetyDisclaimer';
import { recordClick, incrementClickStat } from '../utils/purchaseTracker';

import type { Product } from '../types/api';

interface ProductData extends Product {}

/* ─── Platform config ──────────────────────────────────── */

const PLATFORM_CONFIG: Record<string, {
  label: string;
  logo: string;
  color: string;
  ctaText: string;
}> = {
  JUMIA: { label: 'Jumia', logo: '/logos/jumia.svg', color: '#F68B1E', ctaText: 'Buy on Jumia' },
  KONGA: { label: 'Konga', logo: '/logos/konga.svg', color: '#ED017F', ctaText: 'Buy on Konga' },
  JIJI: { label: 'Jiji', logo: '/logos/jiji.svg', color: '#00A651', ctaText: 'View on Jiji' },
};

const fmtNGN = (n: number) => '₦' + n.toLocaleString();

/* ─── Trust Badge ───────────────────────────────────────── */

const TrustBadge: React.FC<{ level?: string; score?: number }> = ({ level, score }) => {
  const cfg: Record<string, { icon: React.ReactNode; text: string; cls: string }> = {
    trusted:  { icon: <FiCheckCircle size={12} />, text: 'Trusted Seller',  cls: 'text-green-700 bg-green-50 border-green-200' },
    verified: { icon: <FiShield size={12} />,      text: 'Verified Seller', cls: 'text-blue-700 bg-blue-50 border-blue-200' },
    average:  { icon: <FiShield size={12} />,      text: 'Average Seller',  cls: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
    caution:  { icon: <FiAlertTriangle size={12} />, text: 'Use Caution', cls: 'text-red-700 bg-red-50 border-red-200' },
  };
  const c = cfg[level || ''] || { icon: <FiInfo size={12} />, text: 'Marketplace Seller', cls: 'text-gray-500 bg-gray-50 border-gray-200' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-2.5 py-1 ${c.cls}`}
      title={score ? `Trust score: ${score}/100` : undefined}
    >
      {c.icon} {c.text}{score ? ` (${score}/100)` : ''}
    </span>
  );
};

/* ─── Main Page ─────────────────────────────────────────── */

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [relatedProducts, setRelatedProducts] = React.useState<Product[]>([]);

  const { data: product, loading, error, refetch } = useApi<ProductData>(
    () => apiService.getProductDetails(id || '1'),
    {
      cacheKey: `product-${id}`,
      dependencies: [id],
      onError: (err) => console.error('Error fetching product:', err)
    }
  );

  // Fetch related products when product loads
  React.useEffect(() => {
    if (!product?.brand) return;
    const fetchRelated = async () => {
      try {
        const result = await apiService.searchProducts(product.brand);
        const items = result?.products || (result as any)?.data?.products || [];
        // Filter out current product and limit to 4
        setRelatedProducts(items.filter((p: Product) => String(p.id) !== String(id)).slice(0, 4));
      } catch {
        // Non-critical
      }
    };
    fetchRelated();
  }, [product?.brand, id]);

  useSEO({
    title: product ? `${product.name} — Price Comparison & Reviews` : 'Product Details',
    description: product
      ? `Compare ${product.name} prices across Jumia, Konga & Jiji. ${product.brand} ${product.category}. Find the best deal in Nigeria.`
      : 'Product price comparison and reviews across Nigerian marketplaces.',
  });

  const getSentimentColor = useMemo(() => (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-green-500';
    if (score >= 0.4) return 'text-yellow-500';
    if (score >= 0.2) return 'text-orange-500';
    return 'text-red-500';
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="large" text="Loading product details..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <ApiErrorFallback
          error={error instanceof Error ? error : new Error(String(error))}
          message="We couldn't load this product's information."
          retry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/prices" className="hover:text-primary">Compare</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800">{product.name}</span>
      </nav>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {/* Product Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-gray-900">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                {product.brand && <span className="bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">{product.brand}</span>}
                {product.category && <span className="bg-gray-100 px-2.5 py-0.5 rounded-full">{product.category}</span>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-lg">★</span>
                <span className="font-semibold text-gray-900">{product.rating}</span>
                <span className="text-gray-500 text-sm">({product.reviewCount} reviews)</span>
              </div>
              <div className={`flex items-center gap-1 ${getSentimentColor(product.sentimentScore)}`}>
                <FiBarChart2 size={16} />
                <span className="font-semibold">{Math.round(product.sentimentScore * 100)}%</span>
                <span className="text-gray-500 text-xs">buyer satisfaction</span>
              </div>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: product.name, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                aria-label="Share product"
              >
                <FiShare2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">

          {/* ── Left Column: Image + Marketplace Actions ── */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 space-y-6">
              {/* Product Image */}
              <div className="bg-white rounded-xl overflow-hidden border border-gray-100 aspect-square">
                <LazyImage
                  src={product.imageUrl || `https://placehold.co/600x600/1e3a5f/ffffff?text=${encodeURIComponent(product.name)}`}
                  alt={product.name || 'Product Image'}
                  className="w-full h-full object-contain p-4"
                  fallbackSrc={`https://placehold.co/600x600/1e3a5f/ffffff?text=${encodeURIComponent(product.name)}`}
                />
              </div>

              {/* ── Marketplace Actions — external buy links ── */}
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <FiExternalLink size={14} />
                  Where to Buy
                </h3>

                <div className="space-y-3">
                  {/* Main price display */}
                  {product.price > 0 && (
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">{fmtNGN(product.price)}</span>
                        <span className="text-xs text-gray-400 ml-1">lowest</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <>
                            <span className="text-gray-400 line-through text-sm ml-2">{fmtNGN(product.originalPrice)}</span>
                            <span className="ml-2 text-green-600 text-xs font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                              Save {fmtNGN(product.originalPrice - product.price)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Real listing links from DB */}
                  {product.listings && product.listings.length > 0 ? (
                    <>
                      {product.listings.map((listing, idx) => {
                        const pConfig = PLATFORM_CONFIG[listing.platform] || {
                          label: listing.platform, logo: '', color: '#666', ctaText: `View on ${listing.platform}`,
                        };
                        const isCheapest = listing.price === product.price;
                        return (
                          <a
                            key={`${listing.platform}-${idx}`}
                            href={listing.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              recordClick(product.name, listing.platform, listing.price, listing.url);
                              incrementClickStat(listing.platform);
                            }}
                            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border transition-all group ${
                              isCheapest
                                ? 'border-green-200 bg-green-50 hover:border-green-300 hover:shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                          >
                            {pConfig.logo ? (
                              <img src={pConfig.logo} alt={pConfig.label} className="h-6 rounded" />
                            ) : (
                              <span className="text-xs font-bold text-gray-500">{pConfig.label}</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm font-bold ${isCheapest ? 'text-green-700' : 'text-gray-900'}`}>
                                {fmtNGN(listing.price)}
                              </span>
                              {isCheapest && (
                                <span className="ml-2 text-[10px] font-bold text-green-600 uppercase">Best Price</span>
                              )}
                              <p className="text-[10px] text-gray-500 truncate">
                                {listing.vendorName || pConfig.label}
                                {listing.condition && listing.condition !== 'UNKNOWN' && ` · ${listing.condition.replace(/_/g, ' ')}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: pConfig.color }}>
                              {pConfig.ctaText} <FiExternalLink size={12} />
                            </div>
                          </a>
                        );
                      })}
                    </>
                  ) : (
                    /* Fallback: search links when no listings in DB */
                    <>
                      {Object.entries(PLATFORM_CONFIG).map(([key, platform]) => (
                        <a
                          key={key}
                          href={`https://www.${platform.label.toLowerCase()}.${key === 'JIJI' ? 'ng' : key === 'JUMIA' ? 'com.ng' : 'com'}/search?query=${encodeURIComponent(product.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
                        >
                          <img src={platform.logo} alt={platform.label} className="h-6 rounded" />
                          <span className="flex-1 text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                            Search on {platform.label}
                          </span>
                          <FiExternalLink size={14} className="text-gray-400 group-hover:text-gray-600" />
                        </a>
                      ))}
                    </>
                  )}

                  <p className="text-[10px] text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
                    <FiInfo size={10} />
                    Links open in a new tab on the marketplace website
                  </p>
                </div>
              </div>

              {/* ── Safety Tips ── */}
              <SafetyDisclaimer
                variant="compact"
                platform={product.listings?.[0]?.platform}
              />

              {/* ── Sentiment Summary Card ── */}
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-full ${
                    product.sentimentScore > 0.7 ? 'bg-green-100 text-green-700' :
                    product.sentimentScore > 0.4 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    <FiBarChart2 size={18} />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900">Buyer Satisfaction</h3>
                </div>

                <SentimentChart score={product.sentimentScore} size="lg" />

                {product.positiveAttributes && product.positiveAttributes.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-600 block mb-2">Top Strengths</span>
                    <div className="space-y-1.5">
                      {product.positiveAttributes.slice(0, 3).map((attr, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <FiCheck className="text-green-500 mr-1.5 flex-shrink-0" size={13} />
                          <span className="text-gray-600 text-xs">{attr.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Column: Tabs Content ── */}
          <div className="lg:col-span-7">
            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-100 mb-6 overflow-hidden">
              <nav className="flex border-b border-gray-100">
                {[
                  { id: 'overview', label: 'Overview', icon: FiInfo },
                  { id: 'sentiment', label: 'Reviews', icon: FiBarChart2 },
                  { id: 'specifications', label: 'Specs', icon: FiList },
                  { id: 'reviews', label: 'Reviews', icon: FiMessageCircle }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3.5 px-4 font-medium text-sm flex items-center flex-1 justify-center transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary/5 text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="mr-1.5" size={15} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'overview' && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 transition-opacity duration-200">
                  <div className="flex items-center mb-4">
                    <div className="bg-primary/10 p-2 rounded-full text-primary mr-3">
                      <FiInfo size={18} />
                    </div>
                    <h2 className="text-xl font-semibold font-display text-gray-900">Product Overview</h2>
                  </div>

                  <p className="text-gray-700 mb-8 leading-relaxed">{product.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {product.positiveAttributes && product.positiveAttributes.length > 0 && (
                      <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                        <h3 className="font-semibold text-base mb-3 text-green-700 flex items-center">
                          <FiCheck className="mr-2" />
                          What People Love
                        </h3>
                        <ul className="space-y-2.5">
                          {product.positiveAttributes.map((attr, index) => (
                            <li key={index} className="flex items-start">
                              <div className="bg-white p-0.5 rounded-full text-green-500 mr-2 mt-0.5">
                                <FiCheck size={12} />
                              </div>
                              <div>
                                <span className="font-medium text-sm text-gray-900">{attr.name}</span>
                                <div className="flex items-center mt-0.5">
                                  <div className="w-20 bg-gray-200 rounded-full h-1">
                                    <div className="bg-green-500 h-1 rounded-full" style={{ width: `${attr.score * 100}%` }}></div>
                                  </div>
                                  <span className="text-[10px] text-gray-500 ml-1.5">{attr.mentions} mentions</span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {product.negativeAttributes && product.negativeAttributes.length > 0 && (
                      <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                        <h3 className="font-semibold text-base mb-3 text-red-700 flex items-center">
                          <FiX className="mr-2" />
                          Common Complaints
                        </h3>
                        <ul className="space-y-2.5">
                          {product.negativeAttributes.map((attr, index) => (
                            <li key={index} className="flex items-start">
                              <div className="bg-white p-0.5 rounded-full text-red-500 mr-2 mt-0.5">
                                <FiX size={12} />
                              </div>
                              <div>
                                <span className="font-medium text-sm text-gray-900">{attr.name}</span>
                                <div className="flex items-center mt-0.5">
                                  <div className="w-20 bg-gray-200 rounded-full h-1">
                                    <div className="bg-red-500 h-1 rounded-full" style={{ width: `${(1 - attr.score) * 100}%` }}></div>
                                  </div>
                                  <span className="text-[10px] text-gray-500 ml-1.5">{attr.mentions} mentions</span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Scam Warning / Trust Advisory */}
                  <div className="mt-6 bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-start gap-3">
                    <FiAlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={18} />
                    <div>
                      <h4 className="text-sm font-semibold text-amber-800">Shopping Safety Tip</h4>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        Always verify the seller's rating and reviews before purchasing. Compare prices across platforms — if a deal looks too good to be true, it probably is. ProductWhisper helps you compare, but the final purchase happens on the marketplace.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sentiment' && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 transition-opacity duration-200">
                  <div className="flex items-center mb-4">
                    <div className="bg-primary/10 p-2 rounded-full text-primary mr-3">
                      <FiBarChart2 size={18} />
                    </div>
                    <h2 className="text-xl font-semibold font-display text-gray-900">What Buyers Are Saying</h2>
                  </div>

                  <p className="text-gray-600 mb-6 text-sm">
                    Analysis of {product.reviewCount.toLocaleString()} reviews to understand what buyers really think.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Overall Sentiment */}
                    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-gray-100">
                      <h3 className="font-semibold mb-4 text-gray-900">Overall Satisfaction</h3>
                      <div className="flex items-center justify-center mb-4">
                        <div className={`relative w-28 h-28 rounded-full flex items-center justify-center border-8 ${
                          product.sentimentScore > 0.7 ? 'border-green-500 text-green-700' :
                          product.sentimentScore > 0.4 ? 'border-yellow-500 text-yellow-700' :
                          'border-red-500 text-red-700'
                        }`}>
                          <span className="text-2xl font-bold">{Math.round(product.sentimentScore * 100)}%</span>
                        </div>
                      </div>
                      <p className="text-center text-gray-600 text-xs">
                        Based on {product.reviewCount.toLocaleString()} reviews
                      </p>
                    </div>

                    {/* Distribution */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100">
                      <h3 className="font-semibold mb-4 text-gray-900">Review Breakdown</h3>
                      <div className="space-y-3">
                        {[
                          { label: 'Very Positive', pct: 65, color: 'bg-green-500' },
                          { label: 'Positive', pct: 20, color: 'bg-green-300' },
                          { label: 'Neutral', pct: 8, color: 'bg-gray-300' },
                          { label: 'Negative', pct: 5, color: 'bg-red-300' },
                          { label: 'Very Negative', pct: 2, color: 'bg-red-500' },
                        ].map((item, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="text-gray-600">{item.label}</span>
                              <span className="font-medium text-gray-800">{item.pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'specifications' && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 transition-opacity duration-200">
                  <div className="flex items-center mb-4">
                    <div className="bg-primary/10 p-2 rounded-full text-primary mr-3">
                      <FiList size={18} />
                    </div>
                    <h2 className="text-xl font-semibold font-display text-gray-900">Specifications</h2>
                  </div>

                  {product.specifications && product.specifications.length > 0 ? (
                    <div className="space-y-4">
                      {product.specifications.map((specGroup, gi) => (
                        <div key={gi} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                          <div className="bg-gray-50 px-5 py-2.5 border-b border-gray-100">
                            <h3 className="font-medium text-sm text-gray-800">{specGroup.category}</h3>
                          </div>
                          <div className="divide-y divide-gray-50">
                            {specGroup.items.map((spec, si) => (
                              <div key={si} className="px-5 py-3 flex flex-wrap">
                                <div className="w-full sm:w-1/3 text-gray-500 text-xs">{spec.name}</div>
                                <div className="w-full sm:w-2/3 text-gray-900 text-sm font-medium">{spec.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400">
                      <FiList className="mx-auto mb-3" size={32} />
                      <p className="text-sm">No specifications available yet.</p>
                      <p className="text-xs mt-1">Specifications are collected from marketplace listings.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 transition-opacity duration-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="bg-primary/10 p-2 rounded-full text-primary mr-3">
                        <FiMessageCircle size={18} />
                      </div>
                      <h2 className="text-xl font-semibold font-display text-gray-900">Reviews</h2>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="font-semibold text-gray-900">{product.rating}</span>
                      <span className="text-gray-500 text-sm">({product.reviewCount.toLocaleString()})</span>
                    </div>
                  </div>

                  {product.reviews && product.reviews.length > 0 ? (
                    <>
                      {/* Filter */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        <button className="px-3 py-1.5 bg-primary text-white rounded-full text-xs font-medium">All</button>
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <button key={rating} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-xs font-medium transition-colors">
                            {rating} ★
                          </button>
                        ))}
                      </div>

                      <div className="space-y-4">
                        {product.reviews.map((review) => (
                          <ReviewCard
                            key={review.id}
                            id={review.id.toString()}
                            author={review.user}
                            date={review.date}
                            rating={review.rating}
                            title={review.title}
                            content={review.comment}
                            sentimentScore={review.sentiment}
                            verified={true}
                            helpfulCount={review.helpful}
                            unhelpfulCount={0}
                            onMarkHelpful={() => {}}
                            onMarkUnhelpful={() => {}}
                            onReport={() => {}}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 text-gray-400">
                      <FiMessageCircle className="mx-auto mb-3" size={32} />
                      <p className="text-sm">No reviews collected yet.</p>
                      <p className="text-xs mt-1">Reviews are gathered from marketplace platforms over time.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Compare Prices CTA ── */}
            <div className="mt-6 bg-gradient-to-r from-primary/5 to-blue-50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-start gap-3">
                <FiTrendingDown className="text-primary mt-1 flex-shrink-0" size={20} />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">Want to compare prices?</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Search for this product across all Nigerian marketplaces to find the best deal right now.
                  </p>
                  <Link
                    to={`/prices?q=${encodeURIComponent(product.name)}`}
                    className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-dark transition-colors"
                  >
                    Compare Prices Now <FiExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Related Products ── */}
            {relatedProducts.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Similar Products</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {relatedProducts.map((rp) => (
                    <Link
                      key={rp.id}
                      to={`/product/${rp.id}`}
                      className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="h-28 bg-gray-50 flex items-center justify-center p-2">
                        <img
                          src={rp.imageUrl || `https://placehold.co/200x200/1e3a5f/ffffff?text=${encodeURIComponent(rp.name.split(' ').slice(0, 2).join(' '))}`}
                          alt={rp.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://placehold.co/200x200/1e3a5f/ffffff?text=${encodeURIComponent(rp.name.split(' ').slice(0, 2).join(' '))}`;
                          }}
                        />
                      </div>
                      <div className="p-2.5">
                        <h4 className="text-xs font-medium text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {rp.name}
                        </h4>
                        {rp.price > 0 && (
                          <div className="text-sm font-bold text-green-700 mt-1">
                            {fmtNGN(rp.price)}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
