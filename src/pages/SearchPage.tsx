import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "../components/ui/input";
import Button from "../common/components/Button";
import { Badge } from "../components/ui/badge";
import { Slider } from "../components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "../components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { Checkbox } from "../components/ui/checkbox";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Search,
  Star,
  X,
  Filter,
  Grid,
  List,
  TrendingUp,
  History,
  Loader2,
  Info
} from "lucide-react";
import ProductCard from "../components/product/ProductCard";
import { apiService } from "../services/api";
import type { Product, SearchFilters } from "../types/api";
import useSEO from "../hooks/useSEO";

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={`${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

const formatPrice = (price: number) => {
  return '₦' + new Intl.NumberFormat('en-NG').format(price);
};

export default function SearchPage() {
  useSEO({ title: 'Search Products', description: 'Search and compare products across Nigerian e-commerce platforms.' });
  const [searchParams, setSearchParams] = useSearchParams();
  const navigateTo = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const [search, setSearch] = useState(initialQuery);
  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [brands, setBrands] = useState<string[]>(["All"]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    apiService.getPopularSearches().then(setTrendingSearches).catch(() => {});
    apiService.getRecentSearches().then(setRecentSearches).catch(() => {});
  }, []);

  const doSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const filters: SearchFilters = {};
      if (category !== "All") filters.category = category;
      if (brand !== "All") filters.brand = [brand];
      if (priceRange[0] > 0 || priceRange[1] < maxPrice) filters.priceRange = priceRange;
      if (sortBy === "price-low") { filters.sortBy = 'price'; filters.sortOrder = 'asc'; }
      else if (sortBy === "price-high") { filters.sortBy = 'price'; filters.sortOrder = 'desc'; }
      else if (sortBy === "rating") { filters.sortBy = 'rating'; filters.sortOrder = 'desc'; }

      const result = await apiService.searchProducts(query || '', filters);

      const searchResult = (result as any)?.products ? result : (result as any);
      const productList = searchResult?.products || [];
      setProducts(productList);
      setTotal(searchResult?.total || productList.length);

      if (searchResult?.filters) {
        const cats = (searchResult.filters.categories || []).map((c: any) => c.name || c);
        setCategories(["All", ...cats]);
        const brs = (searchResult.filters.brands || []).map((b: any) => b.name || b);
        setBrands(["All", ...brs]);
        if (searchResult.filters.priceRange) {
          setMaxPrice(searchResult.filters.priceRange[1] || 1000000);
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
      setProducts([]);
      setTotal(0);
    } finally {
      setIsSearching(false);
    }
  }, [category, brand, priceRange, maxPrice, sortBy]);

  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery);
    }
  }, []);

  const filteredProducts = React.useMemo(() => {
    let result = [...products];
    if (minRating > 0) result = result.filter(p => p.rating >= minRating);
    if (inStockOnly) result = result.filter(() => true);
    return result;
  }, [products, minRating, inStockOnly]);

  useEffect(() => {
    const filters: string[] = [];
    if (category !== "All") filters.push(`Category: ${category}`);
    if (brand !== "All") filters.push(`Brand: ${brand}`);
    if (priceRange[0] > 0 || priceRange[1] < maxPrice)
      filters.push(`Price: ${formatPrice(priceRange[0])} - ${formatPrice(priceRange[1])}`);
    if (minRating > 0) filters.push(`Rating: ${minRating}+ stars`);
    if (inStockOnly) filters.push("In Stock Only");
    setActiveFilters(filters);
  }, [category, brand, priceRange, minRating, inStockOnly, maxPrice]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (q) {
      setSearchParams({ q });
      const stored = JSON.parse(localStorage.getItem('pw_recent_searches') || '[]');
      if (!stored.includes(q)) {
        const updated = [q, ...stored].slice(0, 5);
        localStorage.setItem('pw_recent_searches', JSON.stringify(updated));
        setRecentSearches(updated);
      }
    }
    doSearch(q);
  };

  const resetFilters = () => {
    setCategory("All");
    setBrand("All");
    setPriceRange([0, maxPrice]);
    setMinRating(0);
    setInStockOnly(false);
    setSortBy("relevance");
  };

  const removeFilter = (filter: string) => {
    if (filter.startsWith("Category:")) setCategory("All");
    else if (filter.startsWith("Brand:")) setBrand("All");
    else if (filter.startsWith("Price:")) setPriceRange([0, maxPrice]);
    else if (filter.startsWith("Rating:")) setMinRating(0);
    else if (filter === "In Stock Only") setInStockOnly(false);
  };

  useEffect(() => {
    if (hasSearched) {
      doSearch(search);
    }
  }, [category, brand, sortBy]);

  const handleQuickSearch = (term: string) => {
    setSearch(term);
    setSearchParams({ q: term });
    doSearch(term);
  };

  const FilterSidebar = ({ idPrefix = "" }: { idPrefix?: string }) => (
    <Accordion type="multiple" defaultValue={["category", "brand", "price", "rating"]} className="space-y-1">
      <AccordionItem value="category" className="border-b border-gray-100 pb-0.5">
        <AccordionTrigger className="hover:text-primary hover:no-underline py-2 text-gray-800 font-medium text-sm">
          Category
        </AccordionTrigger>
        <AccordionContent className="pt-1 pb-2">
          <div className="space-y-1.5">
            {categories.map((cat) => (
              <div key={cat} className="flex items-center group">
                <Checkbox
                  id={`${idPrefix}category-${cat}`}
                  checked={category === cat}
                  onCheckedChange={() => setCategory(cat)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-3.5 w-3.5"
                />
                <label
                  htmlFor={`${idPrefix}category-${cat}`}
                  className="ml-2 text-xs text-gray-700 cursor-pointer group-hover:text-primary transition-colors"
                >
                  {cat}
                </label>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="brand" className="border-b border-gray-100 pb-1">
        <AccordionTrigger className="hover:text-primary hover:no-underline py-3 text-gray-800 font-medium">
          Brand
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-3">
          <ScrollArea className="h-44 pr-4">
            <div className="space-y-2.5 pr-4">
              {brands.map((b) => (
                <div key={b} className="flex items-center group">
                  <Checkbox
                    id={`${idPrefix}brand-${b}`}
                    checked={brand === b}
                    onCheckedChange={() => setBrand(b)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label
                    htmlFor={`${idPrefix}brand-${b}`}
                    className="ml-2.5 text-sm text-gray-700 cursor-pointer group-hover:text-primary transition-colors"
                  >
                    {b}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="price" className="border-b border-gray-100 pb-1">
        <AccordionTrigger className="hover:text-primary hover:no-underline py-3 text-gray-800 font-medium">
          Price Range
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-3">
          <div className="space-y-6">
            <Slider
              defaultValue={[0, maxPrice]}
              value={priceRange}
              max={maxPrice}
              step={1000}
              onValueChange={(value) => setPriceRange(value as [number, number])}
              className="mt-6"
            />
            <div className="flex items-center justify-between">
              <div className="px-3 py-1.5 bg-gray-50 rounded-md text-sm font-medium text-gray-700">
                {formatPrice(priceRange[0])}
              </div>
              <div className="px-3 py-1.5 bg-gray-50 rounded-md text-sm font-medium text-gray-700">
                {formatPrice(priceRange[1])}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="rating" className="border-b border-gray-100 pb-1">
        <AccordionTrigger className="hover:text-primary hover:no-underline py-3 text-gray-800 font-medium">
          Rating
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-3">
          <div className="space-y-3">
            {[4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center group">
                <Checkbox
                  id={`${idPrefix}rating-${rating}`}
                  checked={minRating === rating}
                  onCheckedChange={() => setMinRating(minRating === rating ? 0 : rating)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label
                  htmlFor={`${idPrefix}rating-${rating}`}
                  className="ml-2.5 flex items-center cursor-pointer group-hover:text-primary transition-colors"
                >
                  <StarRating rating={rating} />
                  <span className="text-sm ml-2 text-gray-700">& Up</span>
                </label>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="availability" className="border-b-0">
        <AccordionTrigger className="hover:text-primary hover:no-underline py-3 text-gray-800 font-medium">
          Availability
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-3">
          <div className="flex items-center group">
            <Checkbox
              id={`${idPrefix}in-stock`}
              checked={inStockOnly}
              onCheckedChange={() => setInStockOnly(!inStockOnly)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label
              htmlFor={`${idPrefix}in-stock`}
              className="ml-2.5 text-sm text-gray-700 cursor-pointer group-hover:text-primary transition-colors"
            >
              In Stock Only
            </label>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="relative mb-10 bg-gradient-primary rounded-2xl overflow-hidden shadow-lg">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-secondary/30 blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-accent/20 blur-3xl"></div>
          </div>
          <div className="relative z-10 px-6 py-12 sm:px-12 sm:py-16 text-white text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4 text-white">
              Discover Products in Nigeria
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8 font-light">
              Search and compare products across Nigerian e-commerce platforms with AI-powered sentiment analysis
            </p>

            <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
              <div className="flex shadow-xl rounded-xl overflow-hidden">
                <div className="relative flex-grow bg-white/10 backdrop-blur-sm">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70" size={20} />
                  <Input
                    type="text"
                    placeholder="Search for phones, laptops, accessories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 pr-4 py-4 text-white placeholder:text-white/60 bg-transparent border-0 focus-visible:ring-2 focus-visible:ring-white/30 text-lg"
                  />
                </div>
                <Button
                  type="submit"
                  className="rounded-l-none px-8 py-4 bg-secondary hover:bg-secondary-light text-white font-medium text-base"
                  disabled={isSearching}
                >
                  {isSearching ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Search"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Search suggestions */}
        {!hasSearched && (
          <div className="relative z-20 max-w-3xl mx-auto mb-8">
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 backdrop-blur-sm">
              {trendingSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center text-sm text-primary mb-3">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <span className="font-medium">Trending Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((term) => (
                      <Badge
                        key={term}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/10 hover:text-secondary transition-colors py-1.5 px-3"
                        onClick={() => handleQuickSearch(term)}
                      >
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center text-sm text-primary mb-3">
                    <History className="h-4 w-4 mr-2" />
                    <span className="font-medium">Recent Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <Badge
                        key={term}
                        variant="outline"
                        className="cursor-pointer hover:bg-gray-50 transition-colors py-1.5 px-3"
                        onClick={() => handleQuickSearch(term)}
                      >
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              {activeFilters.map((filter) => (
                <Badge
                  key={filter}
                  variant="secondary"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {filter}
                  <X
                    size={14}
                    className="cursor-pointer hover:text-primary-dark transition-colors"
                    onClick={() => removeFilter(filter)}
                  />
                </Badge>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="text-xs ml-auto border-gray-200 hover:bg-gray-50 hover:text-primary transition-colors"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters - Desktop */}
          <div className="hidden lg:block w-60 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-display text-base text-gray-900 font-semibold">Refine Results</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-7 text-xs hover:text-primary hover:bg-primary/5 transition-colors px-2"
                >
                  Reset
                </Button>
              </div>
              <FilterSidebar />
              <div className="mt-8 pt-6 border-t border-gray-100">
                <Button
                  className="w-full bg-primary hover:bg-primary-dark text-white"
                  onClick={() => doSearch(search)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Filters */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 hover:text-primary transition-colors"
                  onClick={() => setShowMobileFilters(true)}
                >
                  <Filter size={16} />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-xl font-display text-gray-900">Filters</SheetTitle>
                  <SheetDescription className="text-gray-600">
                    Refine your product search
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <FilterSidebar idPrefix="mobile-" />
                </div>
                <SheetFooter className="flex-col gap-3 sm:flex-col mt-6">
                  <Button
                    onClick={() => { setShowMobileFilters(false); doSearch(search); }}
                    className="w-full bg-primary hover:bg-primary-dark text-white"
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="w-full border-gray-200"
                  >
                    Reset All
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px] border-gray-200">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`rounded-full ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-gray-500"}`}
              >
                <Grid size={18} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`rounded-full ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-gray-500"}`}
              >
                <List size={18} />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-grow">
            {/* Results Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    {isSearching ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Searching...</span>
                    ) : (
                      <>
                        Showing <span className="font-semibold text-gray-900">{filteredProducts.length}</span> results
                        {search && <span> for "<span className="font-semibold text-primary">{search}</span>"</span>}
                      </>
                    )}
                  </p>
                </div>
                <div className="hidden lg:flex items-center gap-4">
                  <div className="flex-grow-0">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[200px] border-gray-200">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className={`rounded-full ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-gray-500"}`}
                    >
                      <Grid size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className={`rounded-full ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-gray-500"}`}
                    >
                      <List size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Grid/List */}
            {isSearching ? (
              <div className="text-center py-16 px-8 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-500">Searching products...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={`grid gap-4 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              }`}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    brand={product.brand}
                    category={product.category}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    sentimentScore={product.sentimentScore}
                    image={product.imageUrl || "https://via.placeholder.com/500x500?text=Product"}
                    description={product.description}
                    inStock={true}
                    discount={0}
                    tags={[]}
                    viewMode={viewMode}
                    onAddToCompare={() => {
                      setCompareIds(prev => {
                        const id = String(product.id);
                        if (prev.includes(id)) return prev.filter(x => x !== id);
                        const next = [...prev, id];
                        if (next.length >= 2) {
                          navigateTo(`/compare?ids=${next.join(',')}`);
                        }
                        return next;
                      });
                    }}
                  />
                ))}
              </div>
            ) : hasSearched ? (
              <div className="text-center py-16 px-8 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-6">
                  <Info size={28} className="text-gray-400" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-3 text-gray-900">No products found</h2>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  We couldn't find any products matching your criteria. Try adjusting your filters or searching for something else.
                </p>
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="border-gray-200 hover:bg-primary hover:text-white transition-colors"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="text-center py-16 px-8 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <Search size={28} className="text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-3 text-gray-900">Search for products</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Enter a product name, brand, or category to find products across Nigerian e-commerce platforms.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
