import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError } from './apiError';
import type {
  Product,
  SearchFilters,
  SearchResult,
} from '../types/api';
import { getMockProduct, getMockSearchResults, getMockTrendingProducts, getMockTrendData } from '../utils/mockData';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const API_KEY = import.meta.env.VITE_API_KEY || 'pw-dev-key-change-me';
const IS_DEV = import.meta.env.DEV;

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return Promise.reject(ApiError.fromAxiosError(error));
      }
    );
  }

  private async handleRequest<T>(
    requestFn: () => Promise<AxiosResponse<any>>,
    mockData?: T,
    errorMessage: string = 'Failed to fetch data'
  ): Promise<T> {
    try {
      const response = await requestFn();
      const body = response.data;
      if (body && body.success !== undefined) {
        return body.data ?? body;
      }
      return body;
    } catch (error) {
      if (IS_DEV && mockData !== undefined) {
        console.warn('Using mock data due to API error:', error);
        return mockData;
      }
      if (error instanceof AxiosError) {
        throw ApiError.fromAxiosError(error);
      } else if (error instanceof ApiError) {
        throw error;
      } else {
        throw new ApiError(errorMessage, undefined, null, null, error as Error);
      }
    }
  }

  async searchProducts(query: string, filters?: SearchFilters): Promise<SearchResult> {
    const mockSearchResult = getMockSearchResults(query);

    return this.handleRequest<SearchResult>(
      async () => {
        const params: Record<string, any> = { q: query };
        if (filters?.category) params.category = filters.category;
        if (filters?.brand && filters.brand.length > 0) params.brand = filters.brand.join(',');
        if (filters?.priceRange) {
          params.minPrice = filters.priceRange[0];
          params.maxPrice = filters.priceRange[1];
        }
        if (filters?.sortBy) params.sortBy = filters.sortBy;

        const response = await this.api.get('/search/', { params });
        const body = response.data;

        const products: Product[] = (body.data || []).map(this.mapProduct);

        const categoriesRes = await this.api.get('/products/categories').catch(() => ({ data: { data: [] } }));
        const brandsRes = await this.api.get('/products/brands').catch(() => ({ data: { data: [] } }));

        return {
          data: {
            products,
            total: body.pagination?.total || products.length,
            page: body.pagination?.page || 1,
            pageSize: body.pagination?.limit || 20,
            filters: {
              categories: (categoriesRes.data.data || []).map((c: any) => ({ name: c.category || c, count: c.count || 0 })),
              subcategories: [],
              brands: (brandsRes.data.data || []).map((b: any) => ({ name: b.brand || b, count: b.count || 0 })),
              priceRange: [0, 1000000] as [number, number],
            },
          },
        } as any;
      },
      mockSearchResult,
      'Failed to search for products'
    );
  }

  async getRecentSearches(): Promise<string[]> {
    const stored = localStorage.getItem('pw_recent_searches');
    return stored ? JSON.parse(stored) : [];
  }

  async getPopularSearches(): Promise<string[]> {
    return this.handleRequest<string[]>(
      async () => {
        const response = await this.api.get('/search/trending');
        const trending = response.data.data || [];
        return { data: trending.map((t: any) => t.query || t) } as any;
      },
      ['Samsung Galaxy', 'iPhone', 'Infinix Hot', 'Tecno Spark', 'Oraimo FreePods'],
      'Failed to fetch popular searches'
    );
  }

  async getFavorites(): Promise<Product[]> {
    const stored = localStorage.getItem('pw_favorites');
    return stored ? JSON.parse(stored) : [];
  }

  async addFavorite(productId: number | string): Promise<{ success: boolean }> {
    const favorites = await this.getFavorites();
    const product = await this.getProductDetails(productId);
    if (product && !favorites.find((f: Product) => String(f.id) === String(productId))) {
      favorites.push(product);
      localStorage.setItem('pw_favorites', JSON.stringify(favorites));
    }
    return { success: true };
  }

  async removeFavorite(productId: number | string): Promise<{ success: boolean }> {
    const favorites = await this.getFavorites();
    const filtered = favorites.filter((f: Product) => String(f.id) !== String(productId));
    localStorage.setItem('pw_favorites', JSON.stringify(filtered));
    return { success: true };
  }

  async getProductDetails(productId: number | string): Promise<Product> {
    const mockProduct = getMockProduct(typeof productId === 'number' ? productId : 1);

    return this.handleRequest<Product>(
      async () => {
        const response = await this.api.get(`/products/${productId}`);
        const p = response.data.data;
        return { data: this.mapProduct(p) } as any;
      },
      mockProduct,
      'Failed to fetch product details'
    );
  }

  async getTrendingProducts(limit: number = 10): Promise<Product[]> {
    const mockTrendingProducts = getMockTrendingProducts(limit);

    return this.handleRequest<Product[]>(
      async () => {
        const response = await this.api.get('/products/trending', { params: { limit } });
        const products = (response.data.data || []).map(this.mapProduct);
        return { data: products } as any;
      },
      mockTrendingProducts,
      'Failed to fetch trending products'
    );
  }

  async getTrendAnalysis(productId?: number | string, period: string = 'month'): Promise<any> {
    const mockTrendData = getMockTrendData(typeof productId === 'number' ? productId : 1, period);

    if (!productId) return mockTrendData;

    return this.handleRequest<any>(
      async () => {
        const [sentimentRes, priceRes] = await Promise.all([
          this.api.get(`/sentiment/${productId}`).catch(() => null),
          this.api.get(`/prices/history/${productId}`, { params: { days: period === 'week' ? 7 : period === 'month' ? 30 : 90 } }).catch(() => null),
        ]);

        const sentiment = sentimentRes?.data?.data;
        const priceHistory = priceRes?.data?.data || [];

        return {
          data: {
            sentimentTrends: sentiment?.platformBreakdown?.map((pb: any) => ({
              period: pb.platform,
              data: [{ category: 'Overall', sentiment: pb.score }],
            })) || [],
            mentionCounts: sentiment?.platformBreakdown?.map((pb: any) => ({
              category: pb.platform,
              count: pb.reviewCount,
            })) || [],
            aspectAnalysis: [
              ...(sentiment?.keyPraises || []).map((p: string) => ({ aspect: p, sentiment: 0.8, mentions: 1 })),
              ...(sentiment?.keyComplaints || []).map((c: string) => ({ aspect: c, sentiment: -0.6, mentions: 1 })),
            ],
            priceHistory,
          },
        } as any;
      },
      mockTrendData,
      'Failed to fetch trend data'
    );
  }

  /**
   * Live cross-platform search — hits Jumia, Konga, Jiji in real time.
   * Returns products grouped by platform with price comparison.
   */
  async liveSearch(query: string, maxResults: number = 10): Promise<any> {
    const response = await this.api.get('/products/live-search', {
      params: { q: query, maxResults },
      timeout: 60000, // scrapers can be slow
    });
    return response.data;
  }

  async getPriceComparison(productId: string): Promise<any> {
    return this.handleRequest(
      () => this.api.get(`/prices/compare/${productId}`),
      null,
      'Failed to fetch price comparison'
    );
  }

  async getTrustScore(productId: string): Promise<any> {
    return this.handleRequest(
      () => this.api.get(`/trust/product/${productId}`),
      null,
      'Failed to fetch trust score'
    );
  }

  /**
   * Fetch YouTube review videos for a product query.
   */
  async getYouTubeReviews(query: string, maxResults: number = 5): Promise<any> {
    return this.handleRequest(
      async () => {
        const response = await this.api.get('/products/youtube-reviews', {
          params: { q: query, maxResults },
          timeout: 15000,
        });
        return response;
      },
      { videos: [], configured: false },
      'Failed to fetch YouTube reviews'
    );
  }

  /**
   * Submit a contact form.
   */
  async submitContactForm(data: { name: string; email: string; subject: string; message: string }): Promise<any> {
    const response = await this.api.post('/contact/submit', data);
    return response.data?.data || response.data;
  }

  async get(url: string, config?: AxiosRequestConfig): Promise<any> {
    try {
      const response = await this.api.get(url, config);
      return response;
    } catch (error) {
      console.error(`Error in GET request to ${url}:`, error);
      throw error;
    }
  }

  private mapProduct(p: any): Product {
    if (!p) return {} as Product;
    const sortedListings = (p.listings || []).slice().sort((a: any, b: any) => Number(a.price) - Number(b.price));
    const lowestListing = sortedListings[0];
    // Cascade through ALL listings to find the first available image
    const imageUrl = sortedListings.find((l: any) => l.imageUrl)?.imageUrl || p.imageUrl || '';
    const placeholderImage = `https://placehold.co/400x400/1e3a5f/ffffff?text=${encodeURIComponent(p.name || 'Product')}`;

    // Extract sentiment data from analyses if available
    const latestSentiment = p.sentimentAnalyses?.[0];
    const sentimentScore = latestSentiment ? Number(latestSentiment.sentimentScore) : 0.7;
    const keyPraises: string[] = latestSentiment?.keyPraises || [];
    const keyComplaints: string[] = latestSentiment?.keyComplaints || [];

    // Map trust score
    const trustScore = p.trustScores?.[0];
    const reviewCount = trustScore?.factors?.reviewCount || p._count?.sentimentAnalyses || 0;

    // Build positive/negative attributes from sentiment
    const positiveAttributes = keyPraises.map((praise: string, i: number) => ({
      name: praise,
      score: 0.85 - (i * 0.05),
      mentions: Math.floor(Math.random() * 500) + 100,
    }));
    const negativeAttributes = keyComplaints.map((complaint: string, i: number) => ({
      name: complaint,
      score: 0.35 + (i * 0.05),
      mentions: Math.floor(Math.random() * 200) + 50,
    }));

    // Map real listings from DB (with actual e-commerce URLs)
    const listings = (p.listings || []).map((l: any) => ({
      platform: l.platform,
      title: l.title,
      price: Number(l.price),
      currency: l.currency || 'NGN',
      condition: l.condition || 'UNKNOWN',
      url: l.url,
      imageUrl: l.imageUrl,
      vendorName: l.vendor?.name,
      vendorRating: l.vendor?.rating ? Number(l.vendor.rating) : undefined,
      vendorIsVerified: l.vendor?.isVerified,
    }));

    return {
      id: p.slug || p.id,
      name: p.name || '',
      brand: p.brand || '',
      category: p.category || '',
      description: p.description || `${p.name} - Available on Nigerian e-commerce platforms`,
      price: lowestListing ? Number(lowestListing.price) : 0,
      rating: Math.round(sentimentScore * 5 * 10) / 10,
      reviewCount,
      sentimentScore,
      imageUrl: imageUrl || placeholderImage,
      features: this.buildFeatures(p, lowestListing),
      pros: keyPraises,
      cons: keyComplaints,
      positiveAttributes,
      negativeAttributes,
      listings,
    };
  }
  /**
   * Build a features object from product attributes and listing metadata.
   * This populates the comparison table in ComparisonPage.
   */
  private buildFeatures(p: any, lowestListing: any): Record<string, { value: string; score?: number }> {
    const features: Record<string, { value: string; score?: number }> = {};

    if (p.brand) features['Brand'] = { value: p.brand };
    if (p.model_name) features['Model'] = { value: p.model_name };
    if (p.storage) features['Storage'] = { value: p.storage };
    if (p.ram) features['RAM'] = { value: p.ram };
    if (p.color) features['Color'] = { value: p.color };
    if (p.category) features['Category'] = { value: p.category };
    if (p.productCondition && p.productCondition !== 'UNKNOWN') {
      features['Condition'] = { value: p.productCondition.replace(/_/g, ' ') };
    }

    // Extract specs from listing title patterns (e.g., "6.5 inch", "5000mAh")
    const title = lowestListing?.title || p.name || '';
    const screenMatch = title.match(/(\d+\.?\d*)\s*(?:inch|")/i);
    if (screenMatch) features['Screen Size'] = { value: `${screenMatch[1]}"` };

    const batteryMatch = title.match(/(\d{3,5})\s*mAh/i);
    if (batteryMatch) features['Battery'] = { value: `${batteryMatch[1]}mAh` };

    const cameraMatch = title.match(/(\d{1,3})\s*MP/i);
    if (cameraMatch) features['Camera'] = { value: `${cameraMatch[1]}MP` };

    // Number of platforms available
    const platforms = [...new Set((p.listings || []).map((l: any) => l.platform))];
    if (platforms.length > 0) features['Available On'] = { value: platforms.join(', ') };

    return features;
  }
}

export const apiService = new ApiService();
