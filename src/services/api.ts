import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiError } from './apiError';
import type {
  Product,
  SearchFilters,
  SearchResult,
  TrendData,
  User,
  AuthTokens,
  Notification
} from '../types/api';
import { getMockProduct, getMockSearchResults, getMockTrendingProducts, getMockTrendData } from '../utils/mockData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
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

  // Auth stubs — NG backend uses API key auth, no user accounts
  async register(_username: string, _email: string, _password: string): Promise<User> {
    return { id: 1, name: 'API User', email: '', createdAt: new Date().toISOString() };
  }

  async login(_email: string, _password: string): Promise<User> {
    return { id: 1, name: 'API User', email: _email, createdAt: new Date().toISOString() };
  }

  logout(): void {}

  async getCurrentUser(): Promise<any> {
    return { id: 1, username: 'ProductWhisper User', name: 'ProductWhisper User', email: 'user@productwhisper.ng', createdAt: new Date().toISOString() };
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    return { ...profileData, id: 1, createdAt: new Date().toISOString() } as User;
  }

  async updatePassword(_currentPassword: string, _newPassword: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async searchProducts(query: string, filters?: SearchFilters): Promise<SearchResult> {
    const mockSearchResult = getMockSearchResults(query);

    return this.handleRequest<SearchResult>(
      async () => {
        const params: Record<string, any> = { q: query };
        if (filters?.category) params.category = filters.category;
        if (filters?.brand && filters.brand.length > 0) params.brand = filters.brand[0];
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

  async addFavorite(productId: number): Promise<{ success: boolean }> {
    const favorites = await this.getFavorites();
    const product = await this.getProductDetails(productId);
    if (product && !favorites.find((f: Product) => f.id === productId)) {
      favorites.push(product);
      localStorage.setItem('pw_favorites', JSON.stringify(favorites));
    }
    return { success: true };
  }

  async removeFavorite(productId: number): Promise<{ success: boolean }> {
    const favorites = await this.getFavorites();
    const filtered = favorites.filter((f: Product) => f.id !== productId);
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

  async getNotifications(): Promise<Notification[]> {
    return [];
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
    const lowestListing = p.listings?.sort((a: any, b: any) => Number(a.price) - Number(b.price))[0];
    return {
      id: p.id,
      name: p.name || '',
      brand: p.brand || '',
      category: p.category || '',
      description: p.description || `${p.name} - Available on Nigerian e-commerce platforms`,
      price: lowestListing ? Number(lowestListing.price) : 0,
      rating: 4.0,
      reviewCount: p._count?.sentimentAnalyses || 0,
      sentimentScore: 0.7,
      imageUrl: lowestListing?.imageUrl || p.imageUrl || '',
      features: {},
      pros: [],
      cons: [],
    };
  }
}

export const apiService = new ApiService();
