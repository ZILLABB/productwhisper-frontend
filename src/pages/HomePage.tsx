import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import useSEO from '../hooks/useSEO';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useApi from '../hooks/useApi';
import ApiErrorFallback from '../components/common/ApiErrorFallback';
import {
  Search as MagnifyingGlassIcon,
  BarChart as ChartBarIcon,
  ArrowLeftRight as ArrowsRightLeftIcon,
  ShieldCheck as ShieldCheckIcon,
  TrendingDown,
  Youtube,
  Star as StarIcon
} from 'lucide-react';
import { Button } from '../common/components';

interface TrendingProduct {
  id: number | string;
  name: string;
  description: string;
  brand: string;
  category: string;
  score: number;
  mention_count: number;
  imageUrl?: string;
  price?: number;
}

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useSEO({
    title: 'Find the Best Prices Across Nigeria',
    description: 'Compare prices across Jumia, Konga & Jiji in real-time. Save money, avoid scam sellers, and shop with confidence in Nigeria.',
    keywords: 'price comparison Nigeria, Jumia, Konga, Jiji, best prices, online shopping Nigeria',
  });

  const { data, loading, error, refetch } = useApi(
    () => apiService.getTrendingProducts(6),
    {
      cacheKey: 'trending-products',
      cacheDuration: 5 * 60 * 1000,
    }
  );

  const trendingProducts: TrendingProduct[] = data ? data.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description || '',
    brand: product.brand || '',
    category: product.category || '',
    score: Math.max(0, product.sentimentScore || 0),
    mention_count: product.reviewCount || 0,
    imageUrl: product.imageUrl,
    price: product.price,
  })) : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/prices?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const popular = ['iPhone 15', 'Samsung Galaxy A15', 'Tecno Spark 20', 'PlayStation 5', 'MacBook Air', 'Infinix Hot 40'];

  return (
    <div>
      {/* ─── Hero ─── */}
      <div
        className="relative bg-gradient-primary rounded-premium shadow-premium overflow-hidden mb-12"
      >
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-28 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl sm:tracking-tight">
              Find the <span className="text-yellow-300">Best Prices</span> Across Nigeria
            </h1>
            <p className="mt-8 text-xl font-light text-white leading-relaxed">
              Compare prices on Jumia, Konga & Jiji in real-time. Save money, avoid scams, and shop with confidence.
            </p>

            {/* Platform logos */}
            <div className="flex items-center justify-center gap-4 mt-8 mb-4">
              {[
                { logo: '/logos/jumia.svg', label: 'Jumia' },
                { logo: '/logos/konga.svg', label: 'Konga' },
                { logo: '/logos/jiji.svg', label: 'Jiji' },
              ].map((p) => (
                <div key={p.label} className="bg-white/10 rounded-xl px-4 py-2">
                  <img src={p.logo} alt={p.label} className="h-7 rounded" />
                </div>
              ))}
            </div>

            <div className="mt-8">
              <form onSubmit={handleSearch} className="max-w-xl mx-auto">
                <div className="flex shadow-premium rounded-premium overflow-hidden">
                  <div className="relative flex-grow focus-within:z-10">
                    <input
                      type="text"
                      className="block w-full border-0 py-4 px-6 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-lg font-medium"
                      placeholder="Search for a product..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="rounded-l-none px-8 text-base font-semibold"
                    leftIcon={<MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />}
                  >
                    Compare
                  </Button>
                </div>
              </form>

              {/* Popular searches */}
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {popular.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSearchQuery(s); navigate(`/prices?q=${encodeURIComponent(s)}`); }}
                    className="px-3 py-1 text-sm bg-white/15 text-white/80 rounded-full hover:bg-white/25 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Features ─── */}
      <div
        className="py-16 bg-gray-50 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase font-sans">Why ProductWhisper</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 font-display">
              Shop Smarter Across Nigeria
            </p>
            <p className="mt-6 max-w-2xl text-xl text-gray-600 lg:mx-auto font-sans leading-relaxed">
              We search every major Nigerian e-commerce platform so you don't have to. Find the best price, the safest seller, and make informed decisions.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: TrendingDown,
                title: 'Real-Time Price Comparison',
                color: 'blue',
                desc: 'Search once, see prices from Jumia, Konga, and Jiji side by side. We match the same product across platforms so you instantly see who has the cheapest deal.'
              },
              {
                icon: ShieldCheckIcon,
                title: 'Seller Trust Scores',
                color: 'green',
                desc: 'Every listing shows a trust badge for the seller. We analyze ratings, verification status, and sales history to flag trustworthy merchants and warn about risky ones.'
              },
              {
                icon: ArrowsRightLeftIcon,
                title: 'Product Comparison',
                color: 'purple',
                desc: 'Compare products side-by-side based on price, condition, and seller reputation. Perfect for deciding between similar models or different brands.'
              },
            ].map((feature, index) => (
              <div key={index} className="relative p-6 bg-white rounded-premium shadow-premium hover:shadow-premium-hover transition-shadow duration-300">
                <div className={`flex items-center justify-center h-16 w-16 rounded-full bg-${feature.color}-100 text-${feature.color}-600 mb-6`}>
                  <feature.icon className="h-8 w-8" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 font-display mb-3">{feature.title}</h3>
                <p className="text-base text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: ChartBarIcon,
                title: 'Price Trend Tracking',
                color: 'indigo',
                desc: 'See how prices change over time. Know if you\'re getting a deal or if the price was raised before a "sale". Coming soon: price drop alerts.'
              },
              {
                icon: Youtube,
                title: 'Video Reviews',
                color: 'red',
                desc: 'See what real Nigerians are saying in YouTube reviews before you buy. We find the most relevant video reviews for every product you search.'
              },
              {
                icon: MagnifyingGlassIcon,
                title: 'Smart Search',
                color: 'yellow',
                desc: 'Search "iPhone 15" and we filter out cases, chargers, and screen protectors. You see actual phones, not accessories cluttering your results.'
              },
            ].map((feature, index) => (
              <div key={index} className="relative p-6 bg-white rounded-premium shadow-premium hover:shadow-premium-hover transition-shadow duration-300">
                <div className={`flex items-center justify-center h-16 w-16 rounded-full bg-${feature.color}-100 text-${feature.color}-600 mb-6`}>
                  <feature.icon className="h-8 w-8" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 font-display mb-3">{feature.title}</h3>
                <p className="text-base text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Trending ─── */}
      <div
        className="py-16 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:text-center mb-12">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase font-sans">Trending Now</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 font-display">
              Popular Products Nigerians Are Comparing
            </p>
            <p className="mt-6 max-w-2xl text-xl text-gray-600 lg:mx-auto font-sans leading-relaxed">
              See what products are being searched and compared right now.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" text="Loading trending products..." />
            </div>
          ) : error ? (
            <div className="max-w-lg mx-auto py-8">
              <ApiErrorFallback
                error={error instanceof Error ? error : new Error(String(error))}
                message="We couldn't load trending products at this time."
                retry={refetch}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {trendingProducts.length > 0 ? (
                trendingProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="group block h-full bg-white rounded-premium shadow-premium overflow-hidden hover:shadow-premium-hover transition-all duration-300 hover:-translate-y-1"
                  >
                    {product.imageUrl && (
                      <div className="h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors font-display line-clamp-2 flex-1 mr-2">
                          {product.name}
                        </h3>
                        <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full shrink-0">
                          <StarIcon className="h-4 w-4" />
                          <span className="text-sm font-semibold">{(product.score * 5).toFixed(1)}</span>
                        </div>
                      </div>
                      {product.price && product.price > 0 && (
                        <p className="mt-2 text-xl font-bold text-gray-900">
                          {'₦'}{product.price.toLocaleString()}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2 font-sans leading-relaxed">
                        {product.description}
                      </p>
                      <div className="mt-4 flex justify-between items-center pt-3 border-t border-gray-100">
                        <span className="text-sm font-semibold text-gray-700">{product.brand || product.category}</span>
                        {product.mention_count > 0 && (
                          <span className="text-sm font-medium text-blue-600">{product.mention_count.toLocaleString()} reviews</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No trending products found. Try searching for a product above!
                </div>
              )}
            </div>
          )}

          <div className="mt-12 text-center">
            <Button
              to="/prices"
              size="lg"
              className="px-8 py-3 text-base font-semibold"
              rightIcon={<MagnifyingGlassIcon className="h-5 w-5 ml-2" />}
            >
              Compare Prices Now
            </Button>
          </div>
        </div>
      </div>

      {/* ─── CTA ─── */}
      <div className="bg-gradient-secondary py-16 mt-12 rounded-premium mx-4 sm:mx-8 lg:mx-12 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-display mb-6">
            Stop Overpaying for Products in Nigeria
          </h2>
          <p className="text-xl text-white/90 font-light max-w-3xl mx-auto mb-10 leading-relaxed">
            Join thousands of smart shoppers who use ProductWhisper to find the best deals and avoid scam sellers across Jumia, Konga, and Jiji.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              to="/prices"
              size="lg"
              className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-3 text-base font-semibold"
            >
              Start Comparing
            </Button>
            <Button
              to="/about"
              variant="outline"
              size="lg"
              className="bg-transparent border-white text-white hover:bg-white/10 px-8 py-3 text-base font-semibold"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
