import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import useSEO from '../hooks/useSEO';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SearchAutocomplete from '../components/common/SearchAutocomplete';
import useApi from '../hooks/useApi';
import {
  Search,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  ArrowDown,
  Star,
  Tag,
  BarChart3,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../common/components';

interface TrendingProduct {
  id: number | string;
  name: string;
  brand: string;
  category: string;
  sentimentScore: number;
  reviewCount: number;
  imageUrl?: string;
  price?: number;
  listings?: Array<{
    platform: string;
    price: number;
    url: string;
  }>;
}

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
  JUMIA: 'bg-orange-100 text-orange-800 border-orange-200',
  KONGA: 'bg-blue-100 text-blue-800 border-blue-200',
  JIJI: 'bg-green-100 text-green-800 border-green-200',
};

const PLATFORM_ACCENT: Record<string, string> = {
  JUMIA: 'text-orange-600',
  KONGA: 'text-blue-600',
  JIJI: 'text-green-600',
};

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const navigate = useNavigate();

  useSEO({
    title: 'Find the Best Prices Across Nigeria',
    description: 'Compare prices across Jumia, Konga & Jiji in real-time. Save money, avoid scam sellers, and shop with confidence in Nigeria.',
    keywords: 'price comparison Nigeria, Jumia, Konga, Jiji, best prices, online shopping Nigeria',
  });

  // Fetch trending products
  const { data: trendingData, loading: trendingLoading } = useApi(
    () => apiService.getTrendingProducts(8),
    { cacheKey: 'home-trending', cacheDuration: 5 * 60 * 1000 }
  );

  const trending: TrendingProduct[] = trendingData
    ? trendingData.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand || '',
        category: p.category || '',
        sentimentScore: p.sentimentScore || 0,
        reviewCount: p.reviewCount || 0,
        imageUrl: p.imageUrl,
        price: p.price,
        listings: p.listings,
      }))
    : [];

  // Fetch deals
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await apiService.get('/prices/deals?limit=6');
        const data = response.data?.data || response.data || [];
        setDeals(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch {
        setDeals([]);
      } finally {
        setDealsLoading(false);
      }
    };
    fetchDeals();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/prices?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const popular = [
    'iPhone 15',
    'Samsung Galaxy A15',
    'Tecno Spark 20',
    'PlayStation 5',
    'MacBook Air',
    'Infinix Hot 40',
  ];

  return (
    <div className="min-h-screen">
      {/* ─── Hero ─── */}
      <section className="relative bg-gradient-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-[15%] w-96 h-96 rounded-full bg-yellow-300/20 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl tracking-tight">
              Find the <span className="text-yellow-300">Best Prices</span> Across Nigeria
            </h1>
            <p className="mt-6 text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
              Compare prices on Jumia, Konga & Jiji in real-time. Save money, avoid scam sellers, and shop with confidence.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="mt-10 max-w-xl mx-auto">
              <SearchAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={(q) => navigate(`/prices?q=${encodeURIComponent(q)}`)}
                placeholder="Search any product — phones, laptops, TVs..."
                buttonLabel="Compare"
                hintText="Pick a specific product for better price comparison"
              />
            </form>

            {/* Popular tags */}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <span className="text-white/50 text-sm py-1">Popular:</span>
              {popular.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSearchQuery(s);
                    navigate(`/prices?q=${encodeURIComponent(s)}`);
                  }}
                  className="px-3 py-1 text-sm bg-white/10 text-white/80 rounded-full hover:bg-white/20 transition-colors border border-white/10"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Platform pills */}
            <div className="flex items-center justify-center gap-3 mt-8">
              {[
                { name: 'Jumia', logo: '/logos/jumia.svg' },
                { name: 'Konga', logo: '/logos/konga.svg' },
                { name: 'Jiji', logo: '/logos/jiji.svg' },
              ].map((p) => (
                <div key={p.name} className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
                  <img src={p.logo} alt={p.name} className="h-6 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Today's Best Deals ─── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-display">Today's Best Deals</h2>
                <p className="text-sm text-gray-500">Products with the biggest recent price drops</p>
              </div>
            </div>
            <Link
              to="/deals"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              View all deals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {dealsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="medium" text="Finding deals..." />
            </div>
          ) : deals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {deals.map((deal) => {
                const savings = deal.previousPrice - deal.currentPrice;
                return (
                  <Link
                    key={deal.id}
                    to={`/product/${deal.slug || deal.id}`}
                    className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className="relative">
                      {/* Badges */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full shadow">
                          <ArrowDown className="w-3 h-3" />
                          {deal.dropPercent.toFixed(0)}% OFF
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${PLATFORM_COLORS[deal.platform] || 'bg-gray-100 text-gray-600'}`}>
                          {deal.platform}
                        </span>
                      </div>

                      {/* Image */}
                      <div className="h-36 bg-gray-50 flex items-center justify-center p-3">
                        {deal.imageUrl ? (
                          <img
                            src={deal.imageUrl}
                            alt={deal.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://placehold.co/300x300/1e3a5f/ffffff?text=${encodeURIComponent(deal.name.split(' ').slice(0, 2).join(' '))}`;
                            }}
                          />
                        ) : (
                          <Tag className="w-8 h-8 text-gray-300" />
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {deal.name}
                      </h3>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-lg font-bold text-green-700">{formatPrice(deal.currentPrice)}</div>
                          <div className="text-xs text-gray-400 line-through">{formatPrice(deal.previousPrice)}</div>
                        </div>
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                          Save {formatPrice(savings, true)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
              <Tag className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No price drops detected yet. Deals appear as we track prices over time.</p>
            </div>
          )}

          {deals.length > 0 && (
            <div className="mt-6 text-center sm:hidden">
              <Link to="/deals" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                View all deals &rarr;
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── Trending Products ─── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-display">Trending Products</h2>
                <p className="text-sm text-gray-500">Most searched and compared products right now</p>
              </div>
            </div>
            <Link
              to="/prices"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              Browse all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {trendingLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="medium" text="Loading trending..." />
            </div>
          ) : trending.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trending.slice(0, 8).map((product) => {
                const platformCount = product.listings
                  ? new Set(product.listings.map((l) => l.platform)).size
                  : 0;

                return (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                  >
                    {/* Image */}
                    <div className="h-40 bg-gray-50 flex items-center justify-center overflow-hidden p-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-gray-300">
                          <Tag className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-2 min-h-[2.5rem]">
                        {product.name}
                      </h3>

                      {/* Price */}
                      {product.price != null && product.price > 0 && (
                        <div className="text-lg font-bold text-gray-900 mb-2">
                          {formatPrice(product.price)}
                        </div>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <span className="font-medium text-gray-700">{product.brand || product.category}</span>
                        <div className="flex items-center gap-2">
                          {product.sentimentScore > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              {(product.sentimentScore * 5).toFixed(1)}
                            </span>
                          )}
                          {platformCount > 1 && (
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-medium">
                              {platformCount} platforms
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
              <TrendingUp className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No trending products yet. Search for a product to get started!</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 font-display">How ProductWhisper Works</h2>
            <p className="mt-2 text-gray-500">Three steps to smarter shopping in Nigeria</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                step: '1',
                title: 'Search Any Product',
                desc: 'Type what you want — phones, laptops, TVs, appliances. We search Jumia, Konga, and Jiji simultaneously.',
                color: 'blue',
              },
              {
                icon: BarChart3,
                step: '2',
                title: 'Compare Prices & Sellers',
                desc: 'See prices side by side, check seller ratings, and read what real buyers are saying about each product.',
                color: 'green',
              },
              {
                icon: ExternalLink,
                step: '3',
                title: 'Buy at the Best Price',
                desc: 'Click through to the platform with the best deal. We link you directly to the listing — no middleman.',
                color: 'purple',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-${item.color}-100 flex items-center justify-center`}>
                    <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                  </div>
                  <div className="text-3xl font-bold text-gray-200 font-display">{item.step}</div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 font-display mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Platform Comparison Callout ─── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#1c3454] to-[#2a4a6e] rounded-2xl overflow-hidden shadow-xl">
            <div className="p-8 sm:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                {/* Left text */}
                <div>
                  <h2 className="text-3xl font-bold text-white font-display mb-4">
                    One Search. Three Platforms. Best Price.
                  </h2>
                  <p className="text-white/70 text-lg leading-relaxed mb-8">
                    Stop opening Jumia, Konga, and Jiji in separate tabs. We compare prices, check seller ratings, and flag scams — all in one place.
                  </p>

                  <div className="space-y-4">
                    {[
                      { icon: Zap, text: 'Real-time prices from all platforms', color: 'text-yellow-300' },
                      { icon: ShieldCheck, text: 'Seller ratings and trust indicators', color: 'text-green-400' },
                      { icon: TrendingDown, text: 'Price history & drop alerts', color: 'text-red-400' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <item.icon className={`h-5 w-5 ${item.color} flex-shrink-0`} />
                        <span className="text-white/90">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <Button to="/prices" size="lg" className="bg-white text-[#1c3454] hover:bg-gray-100 font-semibold px-8">
                      Start Comparing Prices
                    </Button>
                  </div>
                </div>

                {/* Right — platform cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      name: 'Jumia',
                      logo: '/logos/jumia.svg',
                      tagline: 'Largest marketplace',
                      accent: 'border-orange-400',
                      bg: 'bg-orange-50',
                    },
                    {
                      name: 'Konga',
                      logo: '/logos/konga.svg',
                      tagline: 'Electronics focus',
                      accent: 'border-blue-400',
                      bg: 'bg-blue-50',
                    },
                    {
                      name: 'Jiji',
                      logo: '/logos/jiji.svg',
                      tagline: 'New & used deals',
                      accent: 'border-green-400',
                      bg: 'bg-green-50',
                    },
                  ].map((p) => (
                    <div
                      key={p.name}
                      className={`${p.bg} rounded-xl p-5 border-t-4 ${p.accent} text-center`}
                    >
                      <img src={p.logo} alt={p.name} className="h-8 mx-auto mb-3 rounded" />
                      <div className="font-semibold text-gray-900 text-sm">{p.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{p.tagline}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 font-display mb-4">
            Stop Overpaying for Products in Nigeria
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Thousands of smart shoppers use ProductWhisper to find the best deals across Jumia, Konga, and Jiji.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button to="/prices" size="lg" className="px-8 font-semibold">
              Compare Prices Now
            </Button>
            <Button to="/about" size="lg" variant="outline" className="px-8 font-semibold">
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
