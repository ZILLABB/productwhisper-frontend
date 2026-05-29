import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiBarChart2, FiCheck, FiX, FiPlus, FiSearch } from 'react-icons/fi';
import { GitCompareArrows, Search } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { apiService } from '../services/api';
import { useToast } from '../components/common/Toast';
import useSEO from '../hooks/useSEO';

interface Product {
  id: number | string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  rating: number;
  reviewCount: number;
  sentimentScore: number;
  imageUrl?: string;
  features: {
    [key: string]: {
      value: string;
      score?: number;
    };
  };
  pros: string[];
  cons: string[];
}

/** Slugify a product name for URL usage */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const ComparisonPage: React.FC = () => {
  useSEO({ title: 'Compare Products', description: 'Compare products side by side — features, prices, and sentiment across Nigerian marketplaces.' });
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  // Products are managed purely in local state — no API re-fetch on URL change.
  // The URL ?ids= param is kept in sync for shareability / bookmarking,
  // but all product data lives in-memory since we built the list interactively.
  const [products, setProducts] = useState<Product[]>([]);
  const [features, setFeatures] = useState<string[]>([]);

  // Search functionality
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  /** Recompute features from a product list */
  const recomputeFeatures = useCallback((prods: Product[]) => {
    const allFeatures = new Set<string>();
    prods.forEach(p => {
      if (p.features) Object.keys(p.features).forEach(f => allFeatures.add(f));
    });
    setFeatures(Array.from(allFeatures));
  }, []);

  // Search for products to add to comparison
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response: any = await apiService.searchProducts(searchQuery);
      const raw = response?.data?.products || response?.products || [];
      // Normalize API products into our Product interface
      const results: Product[] = raw.map((p: any) => ({
        id: p.id || slugify(p.name || p.title || ''),
        name: p.name || p.title || 'Unknown Product',
        brand: p.brand || p.category || 'Unknown',
        category: p.category || '',
        description: p.description || '',
        price: p.price || 0,
        rating: p.rating || p.sentimentScore || 0,
        reviewCount: p.reviewCount || 0,
        sentimentScore: p.sentimentScore || 0,
        imageUrl: p.imageUrl || p.image || undefined,
        features: p.features || {},
        pros: p.pros || [],
        cons: p.cons || [],
      }));
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching products:', error);
      showToast('error', 'Failed to search products');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add product to comparison
  const addProduct = (product: Product) => {
    if (products.length >= 4) {
      showToast('warning', 'You can compare up to 4 products at a time');
      return;
    }

    if (products.some(p => String(p.id) === String(product.id))) {
      showToast('info', 'This product is already in your comparison');
      return;
    }

    const newProducts = [...products, product];
    setProducts(newProducts);
    recomputeFeatures(newProducts);

    // Update URL for bookmarking
    const newIds = newProducts.map(p => String(p.id));
    setSearchParams({ ids: newIds.join(',') }, { replace: true });

    // Only close search when we have enough products for comparison
    if (newProducts.length >= 2) {
      setSearchQuery('');
      setSearchResults([]);
    } else {
      showToast('info', `Added! Pick ${2 - newProducts.length} more product(s) to compare.`);
    }
  };

  // Remove product from comparison
  const removeProduct = (productId: number | string) => {
    const newProducts = products.filter(p => String(p.id) !== String(productId));
    setProducts(newProducts);
    recomputeFeatures(newProducts);

    if (newProducts.length > 0) {
      setSearchParams({ ids: newProducts.map(p => String(p.id)).join(',') }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  if (products.length < 2) {
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
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Product Comparison</h1>
              <p className="text-white/80 text-lg">Compare features, reviews, and value across products</p>
            </div>
          </div>

          {/* Product Picker */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-display font-semibold text-gray-900 mb-4">Pick Products to Compare</h2>

            {/* Current selections */}
            {products.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {products.map((p) => (
                  <span key={p.id} className="flex items-center bg-primary/10 text-primary rounded-full pl-3 pr-1 py-1 text-sm font-medium">
                    {p.name}
                    <button
                      onClick={() => removeProduct(p.id)}
                      className="ml-1 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
                    >
                      <FiX size={12} />
                    </button>
                  </span>
                ))}
                <span className="text-sm text-gray-500 self-center">
                  {products.length < 2 ? `Add ${2 - products.length} more` : ''}
                </span>
              </div>
            )}

            <form onSubmit={handleSearch}>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for a product to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-24 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Inline search results */}
            {isSearching && (
              <div className="flex justify-center py-6">
                <LoadingSpinner size="small" />
              </div>
            )}

            {searchResults.length > 0 && (
              <ul className="mt-4 divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {searchResults.map((result) => {
                  const alreadyAdded = products.some((p) => String(p.id) === String(result.id));
                  return (
                    <li key={result.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">{result.name}</p>
                        <p className="text-sm text-gray-500">{result.brand} · ₦{result.price.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => addProduct(result)}
                        disabled={alreadyAdded}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          alreadyAdded
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-primary text-white hover:bg-primary-dark'
                        }`}
                      >
                        {alreadyAdded ? 'Added' : 'Add'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Empty State */}
          {searchResults.length === 0 && !isSearching && (
            <EmptyState
              icon={GitCompareArrows}
              title="Compare Products Side by Side"
              description="Search and pick at least two products above to compare their features, prices, pros, cons, and get a recommendation."
              actions={[
                { label: 'Browse Products', to: '/search', variant: 'primary', icon: Search },
              ]}
            />
          )}
        </div>
      </div>
    );
  }

  // Helper function to get sentiment color
  const getSentimentColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-green-500';
    if (score >= 0.4) return 'text-yellow-500';
    if (score >= 0.2) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        {/* Hero Section */}
        <div className="relative mb-10 bg-gradient-primary rounded-2xl overflow-hidden shadow-lg">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-secondary/30 blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-accent/20 blur-3xl"></div>
          </div>

          <div className="relative z-10 px-6 py-10 sm:px-12 sm:py-14 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Product Comparison</h1>
                <p className="text-white/80 text-lg">
                  Compare features, specs, and reviews across multiple products
                </p>
              </div>

              {/* Add product button */}
              {products.length < 4 && (
                <button
                  onClick={() => setShowSearch(true)}
                  className="mt-6 md:mt-0 flex items-center px-5 py-3 bg-white text-primary rounded-xl hover:bg-gray-100 transition-colors shadow-md"
                >
                  <FiPlus className="mr-2" size={18} />
                  Add Product
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Currently comparing section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
          <div className="flex items-center text-gray-700 mb-4">
            <span className="font-medium text-lg">Currently Comparing:</span>
            <span className="ml-2 px-2.5 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              {products.length} Products
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {products.map(product => (
              <div
                key={`chip-${product.id}`}
                className="flex items-center bg-gray-100 rounded-full pl-3 pr-1 py-1 text-sm"
              >
                <span className="mr-1">{product.name}</span>
                <button
                  onClick={() => removeProduct(product.id)}
                  className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300 hover:text-gray-700 transition-colors"
                >
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Search modal */}
        {showSearch && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-display font-semibold text-gray-900">Add Product to Compare</h2>
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={handleSearch} className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for a product..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <button
                      type="submit"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                    >
                      Search
                    </button>
                  </div>
                </form>

                <div className="max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="medium" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {searchResults.map(product => (
                        <li key={product.id} className="py-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                              <div className="flex items-center mt-1">
                                <p className="text-sm text-gray-500 mr-3">{product.brand}</p>
                                <div className="flex items-center text-sm">
                                  <span className="text-yellow-400 mr-1">★</span>
                                  <span className="text-gray-700">{product.rating.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => addProduct(product)}
                              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : searchQuery ? (
                    <div className="text-center py-10 px-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <FiSearch className="text-gray-400" size={24} />
                      </div>
                      <p className="text-gray-500 mb-4">No products found matching "{searchQuery}"</p>
                      <p className="text-sm text-gray-400">Try a different search term or browse popular products below</p>
                    </div>
                  ) : (
                    <div className="text-center py-10 px-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <FiSearch className="text-gray-400" size={24} />
                      </div>
                      <p className="text-gray-500 mb-4">Search for products to compare</p>
                      <p className="text-sm text-gray-400">Try searching for product names, brands, or categories</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-10">
          {/* Product Headers */}
          <div className="grid grid-cols-1 md:grid-cols-[220px_repeat(auto-fill,minmax(220px,1fr))]">
            <div className="bg-gray-50 p-6 font-medium text-gray-700 border-b border-gray-100">
              <h3 className="text-lg font-display font-semibold">Product Details</h3>
            </div>
            {products.map((product, index) => (
              <div key={product.id} className="p-6 border-l border-b border-gray-100 relative">
                {/* Product Image */}
                <div className="w-full h-48 bg-gray-50 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                  <img
                    src={(product as any).imageUrl || `https://placehold.co/300x300/1e3a5f/ffffff?text=${encodeURIComponent(product.name.substring(0, 20))}`}
                    alt={product.name}
                    className="h-full w-full object-contain p-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/300x300/1e3a5f/ffffff?text=${encodeURIComponent(product.name.substring(0, 20))}`;
                    }}
                  />
                </div>

                <h2 className="font-bold text-xl mb-1 pr-6 text-gray-900">{product.name}</h2>
                <p className="text-gray-600 text-sm mb-3">{product.brand} • {product.category}</p>

                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-xl text-primary">₦{product.price.toLocaleString()}</span>
                  <div className={`px-2.5 py-1 rounded-full text-sm font-medium ${
                    product.sentimentScore > 0.7 ? 'bg-green-100 text-green-700' :
                    product.sentimentScore > 0.4 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    <div className="flex items-center">
                      <FiBarChart2 className="mr-1.5" size={14} />
                      <span>{Math.round(product.sentimentScore * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= Math.round(product.rating) ? "text-yellow-400" : "text-gray-300"}>★</span>
                      ))}
                    </div>
                    <span className="text-gray-500 text-sm ml-2">({product.reviewCount.toLocaleString()})</span>
                  </div>

                  <button
                    onClick={() => removeProduct(product.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove product"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Features Comparison */}
          <div className="border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-[220px_repeat(auto-fill,minmax(220px,1fr))]">
              <div className="p-6 font-medium text-gray-700 bg-gray-50">
                <h3 className="text-lg font-display font-semibold">Key Features</h3>
              </div>
              <div className="col-span-full md:col-auto"></div>
            </div>

            {features.map((feature, featureIndex) => (
              <div
                key={feature}
                className={`grid grid-cols-1 md:grid-cols-[220px_repeat(auto-fill,minmax(220px,1fr))] ${
                  featureIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <div className="p-6 font-medium text-gray-700">
                  {feature}
                </div>
                {products.map((product) => {
                  const featureData = product.features[feature];
                  return (
                    <div key={`${product.id}-${feature}`} className="p-6 border-l border-gray-100">
                      {featureData ? (
                        <div className="space-y-2">
                          <div className="font-medium">{featureData.value}</div>
                          {featureData.score !== undefined && (
                            <div className="flex items-center mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                <div
                                  className={`h-2.5 rounded-full ${
                                    featureData.score > 0.7 ? 'bg-green-500' :
                                    featureData.score > 0.4 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${featureData.score * 100}%` }}
                                ></div>
                              </div>
                              <span className={`text-xs font-medium ${getSentimentColor(featureData.score)}`}>
                                {Math.round(featureData.score * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Not available</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Pros and Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-100">
            {/* Pros Section */}
            <div className="border-r border-gray-100">
              <div className="p-6 bg-gray-50 border-b border-gray-100">
                <h3 className="text-lg font-display font-semibold text-green-600 flex items-center">
                  <FiCheck className="mr-2" /> Pros
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                {products.map((product) => (
                  <div key={`${product.id}-pros`} className="p-6 border-b md:border-b-0 md:border-r border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-3">{product.name}</h4>
                    <ul className="space-y-2">
                      {product.pros && product.pros.length > 0 ? (
                        product.pros.map((pro, index) => (
                          <li key={index} className="flex items-start">
                            <FiCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" size={16} />
                            <span className="text-gray-700">{pro}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-400">No pros listed</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Cons Section */}
            <div>
              <div className="p-6 bg-gray-50 border-b border-gray-100">
                <h3 className="text-lg font-display font-semibold text-red-600 flex items-center">
                  <FiX className="mr-2" /> Cons
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                {products.map((product) => (
                  <div key={`${product.id}-cons`} className="p-6 border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0">
                    <h4 className="font-medium text-gray-900 mb-3">{product.name}</h4>
                    <ul className="space-y-2">
                      {product.cons && product.cons.length > 0 ? (
                        product.cons.map((con, index) => (
                          <li key={index} className="flex items-start">
                            <FiX className="text-red-500 mr-2 mt-1 flex-shrink-0" size={16} />
                            <span className="text-gray-700">{con}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-400">No cons listed</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendation Section */}
          <div className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Our Recommendation</h3>
            <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {products.map((product) => {
                // Calculate a recommendation score based on sentiment, rating, and price
                const maxPrice = Math.max(...products.map(p => p.price), 1);
                const recommendationScore = Math.min(1, Math.max(0, (product.sentimentScore * 0.5) + ((product.rating / 5) * 0.3) + ((1 - product.price / maxPrice) * 0.2)));
                const isRecommended = recommendationScore === Math.max(...products.map(p =>
                  Math.min(1, Math.max(0, (p.sentimentScore * 0.5) + ((p.rating / 5) * 0.3) + ((1 - p.price / maxPrice) * 0.2)))
                ));

                return (
                  <div
                    key={`${product.id}-recommendation`}
                    className={`p-4 rounded-lg ${isRecommended ? 'bg-primary/10 border border-primary/20' : 'bg-white border border-gray-100'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      {isRecommended && (
                        <span className="px-2 py-1 bg-primary text-white text-xs font-medium rounded-full">
                          Top Pick
                        </span>
                      )}
                    </div>
                    <div className="flex items-center mb-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div
                          className={`h-2.5 rounded-full ${isRecommended ? 'bg-primary' : 'bg-gray-400'}`}
                          style={{ width: `${recommendationScore * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {Math.round(recommendationScore * 100)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {isRecommended
                        ? `Best overall choice based on buyer reviews, ratings, and value for money.`
                        : `Good option with some trade-offs in ${product.sentimentScore < 0.7 ? 'buyer satisfaction' : product.rating < 4.3 ? 'ratings' : 'price'}.`
                      }
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonPage;
