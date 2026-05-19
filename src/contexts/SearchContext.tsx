import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { apiService } from '../services/api';
import type { Product } from '../types/api';

interface SearchFilters {
  minScore?: number;
  sources?: string[];
  minConfidence?: number;
  sortBy?: 'score' | 'confidence' | 'mentions';
  category?: string;
  brand?: string;
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
}

interface RecentSearch {
  id: number;
  query: string;
  created_at: string;
  results_count: number;
}

interface SearchContextType {
  searchResults: Product[];
  recentSearches: RecentSearch[];
  popularSearches: { query: string; count: number }[];
  favorites: any[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filters: SearchFilters;
  search: (query: string, filters?: SearchFilters) => Promise<void>;
  updateFilters: (newFilters: SearchFilters) => void;
  clearFilters: () => void;
  loadRecentSearches: () => Promise<void>;
  loadPopularSearches: () => Promise<void>;
  loadFavorites: () => Promise<void>;
  addFavorite: (productId: number) => Promise<void>;
  removeFavorite: (productId: number) => Promise<void>;
  isFavorite: (productId: number) => boolean;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
}

const defaultFilters: SearchFilters = {
  minScore: 0,
  sortBy: 'score',
};

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [popularSearches, setPopularSearches] = useState<{ query: string; count: number }[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);

  const search = async (query: string, newFilters?: SearchFilters) => {
    setLoading(true);
    setError(null);
    setSearchQuery(query);

    try {
      const data = await apiService.searchProducts(query);
      setSearchResults(data.products);

      if (newFilters) {
        setFilters(newFilters);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Search failed');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: SearchFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    if (searchQuery) {
      search(searchQuery, updatedFilters);
    }
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    if (searchQuery) {
      search(searchQuery, defaultFilters);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const data = await apiService.getRecentSearches();
      setRecentSearches(data.map((q: string, i: number) => ({
        id: i,
        query: q,
        created_at: new Date().toISOString(),
        results_count: 0
      })));
    } catch (err) {
      console.error('Failed to load recent searches:', err);
    }
  };

  const loadPopularSearches = async () => {
    try {
      const data = await apiService.getPopularSearches();
      setPopularSearches(data.map((q: string) => ({ query: q, count: 0 })));
    } catch (err) {
      console.error('Failed to load popular searches:', err);
    }
  };

  const loadFavorites = async () => {
    try {
      const data = await apiService.getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  };

  const addFavorite = async (productId: number) => {
    try {
      await apiService.addFavorite(productId);
      await loadFavorites();
    } catch (err) {
      console.error('Failed to add favorite:', err);
    }
  };

  const removeFavorite = async (productId: number) => {
    try {
      await apiService.removeFavorite(productId);
      await loadFavorites();
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  const isFavorite = (productId: number): boolean => {
    return favorites.some((fav: any) => fav.product_id === productId || fav.id === productId);
  };

  const value = {
    searchResults,
    recentSearches,
    popularSearches,
    favorites,
    loading,
    error,
    searchQuery,
    filters,
    search,
    updateFilters,
    clearFilters,
    loadRecentSearches,
    loadPopularSearches,
    loadFavorites,
    addFavorite,
    removeFavorite,
    isFavorite
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
