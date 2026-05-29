import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { FiTrendingUp, FiTrendingDown, FiAlertCircle, FiFilter, FiCalendar, FiSearch, FiBarChart2 } from 'react-icons/fi';
import { TrendingUp, Search, BarChart3 } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { apiService } from '../services/api';
import { useToast } from '../components/common/Toast';
import useSEO from '../hooks/useSEO';

interface TrendDataPoint {
  date: string;
  value: number;
  confidence?: number;
}

interface AspectData {
  aspect: string;
  sentiment: number;
  mentions: number;
}

interface TrendResult {
  sentimentTrends: { period: string; data: { category: string; sentiment: number }[] }[];
  mentionCounts: { category: string; count: number }[];
  aspectAnalysis: AspectData[];
  priceHistory?: any[];
}

interface ProductInfo {
  id: number | string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  rating: number;
  reviewCount: number;
  sentimentScore: number;
}

const TrendsPage: React.FC = () => {
  useSEO({ title: 'Sentiment Trends', description: 'Track product sentiment and price trends across Nigerian marketplaces.' });
  const { productId } = useParams<{ productId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [trendData, setTrendData] = useState<TrendResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(searchParams.get('period') || 'month');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Search for products to pick from
  const handleProductSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response: any = await apiService.searchProducts(query);
      const results = response?.data?.products || response?.products || [];
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        if (period !== searchParams.get('period')) {
          setSearchParams({ period });
        }

        const [productDetails, trendsData] = await Promise.all([
          apiService.getProductDetails(productId),
          apiService.getTrendAnalysis(productId, period)
        ]);

        setProduct(productDetails);
        setTrendData(trendsData);
      } catch (err) {
        setError('Failed to load trend data');
        console.error('Error fetching trend data:', err);
        showToast('error', 'Failed to load trend data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, period]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="large" text="Loading trend data..." />
      </div>
    );
  }

  if (!productId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero header */}
          <div className="relative mb-10 bg-gradient-primary rounded-2xl overflow-hidden shadow-lg">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-secondary/30 blur-3xl"></div>
              <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-accent/20 blur-3xl"></div>
            </div>
            <div className="relative z-10 px-6 py-10 sm:px-12 sm:py-14 text-white text-center">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Sentiment Trends</h1>
              <p className="text-white/80 text-lg">Track how people feel about products over time</p>
            </div>
          </div>

          {/* Product Search */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-display font-semibold text-gray-900 mb-4">Select a Product</h2>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for a product to view its trends..."
                value={searchQuery}
                onChange={(e) => handleProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30"
              />
            </div>

            {/* Search Results */}
            {isSearching && (
              <div className="flex justify-center py-6">
                <LoadingSpinner size="small" />
              </div>
            )}

            {searchResults.length > 0 && (
              <ul className="mt-4 divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <button
                      onClick={() => navigate(`/trends/${result.id}`)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{result.name}</p>
                        <p className="text-sm text-gray-500">{result.brand} · {result.category}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                          result.sentimentScore > 0.7 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {Math.round(result.sentimentScore * 100)}%
                        </span>
                        <BarChart3 className="text-primary" size={18} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-6">No products found matching "{searchQuery}"</p>
            )}
          </div>

          {/* Empty State */}
          {searchQuery.length < 2 && (
            <EmptyState
              icon={TrendingUp}
              title="No Product Selected"
              description="Search for a product above to view its sentiment trends, platform mentions, and key aspects over time."
              actions={[
                { label: 'Browse Products', to: '/search', variant: 'primary', icon: Search },
              ]}
            />
          )}
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <EmptyState
            icon={TrendingUp}
            title="Trend Data Unavailable"
            description={error || "We couldn't load trend data for this product. It may not have enough reviews yet."}
            actions={[
              { label: 'Browse Products', to: '/search', variant: 'primary', icon: Search },
              { label: 'Go Back', onClick: () => navigate(-1), variant: 'secondary' },
            ]}
          />
        </div>
      </div>
    );
  }

  const sentimentTrends = trendData?.sentimentTrends || [];
  const mentionCounts = trendData?.mentionCounts || [];
  const aspectAnalysis = trendData?.aspectAnalysis || [];

  const avgSentiment = sentimentTrends.length > 0
    ? sentimentTrends.reduce((sum, t) => sum + (t.data?.[0]?.sentiment || 0), 0) / sentimentTrends.length
    : product.sentimentScore;

  const totalMentions = mentionCounts.reduce((sum, m) => sum + m.count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="relative mb-10 bg-gradient-primary rounded-2xl overflow-hidden shadow-lg">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-secondary/30 blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-accent/20 blur-3xl"></div>
          </div>

          <div className="relative z-10 px-6 py-10 sm:px-12 sm:py-14 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">{product.name}</h1>
                <p className="text-white/80 text-lg flex items-center">
                  <span className="font-medium">{product.brand}</span>
                  <span className="mx-2 text-white/40">•</span>
                  <span>{product.category}</span>
                </p>
              </div>

              <div className="mt-6 md:mt-0">
                <div className="inline-flex items-center px-4 py-2 rounded-xl backdrop-blur-sm bg-white/20 text-white border border-white/30">
                  <FiTrendingUp className="mr-2" size={20} />
                  <span className="font-medium">{Math.round(avgSentiment * 100)}% sentiment</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time range filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center text-gray-700">
              <FiCalendar className="text-primary mr-2" size={18} />
              <span className="font-medium">Time Period:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['week', 'month', 'quarter'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === p
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Quarter'}
                </button>
              ))}
            </div>

            <div className="ml-auto">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FiSearch size={16} />
                Search Products
              </button>
            </div>
          </div>

          {showSearch && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for a product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          )}
        </div>

        {/* Notice when no real sentiment data exists */}
        {totalMentions === 0 && aspectAnalysis.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <FiAlertCircle className="text-amber-500 mt-0.5 flex-shrink-0" size={18} />
            <div>
              <p className="text-sm font-medium text-amber-800">Limited sentiment data</p>
              <p className="text-xs text-amber-700 mt-1">
                This product doesn't have enough reviews yet for detailed sentiment analysis.
                Data improves as more reviews are collected from marketplaces.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {/* Sentiment Score Card */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-gray-900">Average Sentiment</h2>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                <FiTrendingUp size={20} />
              </div>
            </div>

            <div className="flex items-end justify-between mb-6">
              <div className="text-4xl font-bold text-gray-900">
                {(avgSentiment * 100).toFixed(1)}%
              </div>
              <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                avgSentiment > 0.6 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {avgSentiment > 0.6 ? (
                  <FiTrendingUp className="mr-1.5" size={14} />
                ) : (
                  <FiTrendingDown className="mr-1.5" size={14} />
                )}
                <span>{avgSentiment > 0.6 ? 'Positive' : 'Mixed'}</span>
              </div>
            </div>

            <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500"
                style={{ width: '100%' }}
              ></div>
            </div>
            <div className="mt-2 flex justify-between text-xs font-medium">
              <span className="text-red-600">Negative</span>
              <span className="text-yellow-600">Neutral</span>
              <span className="text-green-600">Positive</span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                Based on {product.reviewCount} reviews
              </div>
            </div>
          </div>

          {/* Mentions Card */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-gray-900">Platform Mentions</h2>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/10 text-secondary">
                <FiBarChart2 size={20} />
              </div>
            </div>

            <div className="flex items-end justify-between mb-6">
              <div className="text-4xl font-bold text-gray-900">
                {totalMentions.toLocaleString()}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {mentionCounts.slice(0, 4).map((m) => (
                <div key={m.category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">{m.category}</span>
                    <span className="text-sm font-bold text-gray-900">{m.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary"
                      style={{ width: `${totalMentions > 0 ? (m.count / totalMentions) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                Across {mentionCounts.length} platforms
              </div>
            </div>
          </div>

          {/* Top Aspects Card */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-gray-900">Key Aspects</h2>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent">
                <FiFilter size={20} />
              </div>
            </div>

            <div className="space-y-4">
              {aspectAnalysis.slice(0, 5).map((aspect) => {
                const sentimentColor = aspect.sentiment > 0 ? 'text-green-600' : 'text-red-600';
                const barColor = aspect.sentiment > 0 ? 'bg-green-500' : 'bg-red-500';
                const barWidth = Math.min(Math.abs(aspect.sentiment) * 100, 100);

                return (
                  <div key={aspect.aspect}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-gray-800 capitalize">
                        {aspect.aspect}
                      </span>
                      <span className={`text-sm font-medium ${sentimentColor}`}>
                        {aspect.sentiment > 0 ? '+' : ''}{(aspect.sentiment * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor}`}
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {aspect.mentions} mentions
                    </div>
                  </div>
                );
              })}
            </div>

            {aspectAnalysis.length === 0 && (
              <p className="text-sm text-gray-500 py-4">No aspect data available yet.</p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to={`/product/${productId}`} className="text-sm text-primary font-medium hover:text-primary-dark transition-colors">
                View product details →
              </Link>
            </div>
          </div>
        </div>

        {/* Sentiment by Platform */}
        {sentimentTrends.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300 mb-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-display font-semibold text-gray-900">Sentiment by Platform</h2>
                <p className="text-sm text-gray-500 mt-1">How sentiment compares across different sources</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sentimentTrends.map((trend) => (
                <div key={trend.period} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h3 className="font-medium text-gray-900 capitalize mb-2">{trend.period}</h3>
                  {trend.data.map((d) => (
                    <div key={d.category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{d.category}</span>
                      <span className={`text-sm font-medium ${d.sentiment > 0.6 ? 'text-green-600' : d.sentiment > 0.4 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {(d.sentiment * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price History placeholder */}
        {trendData?.priceHistory && trendData.priceHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300 mb-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-display font-semibold text-gray-900">Price History</h2>
                <p className="text-sm text-gray-500 mt-1">Price changes over time across platforms</p>
              </div>
            </div>

            <div className="h-64 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center">
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <FiTrendingUp className="text-primary" size={24} />
                </div>
                <p className="text-gray-500 text-sm">{trendData.priceHistory.length} price data points available</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendsPage;
