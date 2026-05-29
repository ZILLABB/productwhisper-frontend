import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  FiAward,
  FiTag,
  FiX,
  FiYoutube,
  FiZap,
  FiGrid,
} from 'react-icons/fi';
import { apiService } from '../services/api';
import {
  addAlert,
  updateAlertPrice,
  isTracked,
  getTriggeredAlerts,
  dismissAlert,
  getAlerts,
  getPriceChange,
  type PriceAlert,
} from '../utils/priceAlerts';
import useSEO from '../hooks/useSEO';
import SafetyDisclaimer from '../components/common/SafetyDisclaimer';
import { recordClick, incrementClickStat } from '../utils/purchaseTracker';
import SearchAutocomplete from '../components/common/SearchAutocomplete';

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
  trustScore?: number;
  scamFlags?: string[];
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
  matchConfidence: number;
  matchExplanation: string;
  matchedAttributes: string[];
  mismatchedAttributes: string[];
  attributes: {
    brand: string | null;
    model: string | null;
    storage: string | null;
    category: string;
    condition: string;
  };
  conditionWarning?: string;
}

interface PlatformResult {
  platform: string;
  products: ScrapedProduct[];
  count: number;
  error?: string;
}

interface MatchingStats {
  totalInput: number;
  totalGrouped: number;
  totalUnmatched: number;
  totalFilteredAccessories: number;
  groupCount: number;
  avgConfidence: number;
}

interface LiveSearchData {
  query: string;
  totalResults: number;
  searchTimeMs: number;
  priceSummary: {
    lowestPrice: number;
    highestPrice: number;
    averagePrice: number;
    currency: string;
    cheapestPlatform: string;
    savings: number;
  };
  recommendation: {
    platform: string;
    title: string;
    price: number;
    url: string;
    vendor: string;
    reason: string;
  } | null;
  groups: ProductGroup[];
  unmatchedProducts: ScrapedProduct[];
  filteredAsAccessories: number;
  matchingStats?: MatchingStats;
  platforms: Record<string, PlatformResult>;
  allProducts: ScrapedProduct[];
}

interface YouTubeVideo {
  videoId: string;
  title: string;
  channelName: string;
  publishedAt: string;
  viewCount?: number;
  likeCount?: number;
  url: string;
}

/* ─── Platform Config ──────────────────────────────────── */

const PLATFORMS = ['JUMIA', 'KONGA', 'JIJI'] as const;

const PM: Record<string, {
  color: string;
  lightBg: string;
  logo: string;
  label: string;
}> = {
  JUMIA: { color: '#F68B1E', lightBg: '#FFF7ED', logo: '/logos/jumia.svg', label: 'Jumia' },
  KONGA: { color: '#ED017F', lightBg: '#FDF2F8', logo: '/logos/konga.svg', label: 'Konga' },
  JIJI:  { color: '#00A651', lightBg: '#F0FDF4', logo: '/logos/jiji.svg',  label: 'Jiji' },
};

/* ─── localStorage helpers ────────────────────────────── */

const LS_RECENT_KEY = 'pw_price_recent_searches';
const LS_MAX_RECENT = 10;

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_RECENT_KEY) || '[]');
  } catch { return []; }
}

function addRecentSearch(q: string) {
  const recent = getRecentSearches().filter(s => s.toLowerCase() !== q.toLowerCase());
  recent.unshift(q);
  localStorage.setItem(LS_RECENT_KEY, JSON.stringify(recent.slice(0, LS_MAX_RECENT)));
}

/* ─── Helpers ──────────────────────────────────────────── */

const fmtNGN = (n: number) => '₦' + n.toLocaleString();

const TrustBadge: React.FC<{ level?: string; score?: number }> = ({ level, score }) => {
  const cfg: Record<string, { icon: React.ReactNode; text: string; cls: string }> = {
    trusted:  { icon: <FiCheckCircle size={10} />, text: 'Trusted',  cls: 'text-green-700 bg-green-50 border-green-200' },
    verified: { icon: <FiShield size={10} />,      text: 'Verified', cls: 'text-blue-700 bg-blue-50 border-blue-200' },
    average:  { icon: <FiShield size={10} />,      text: 'Average',  cls: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
    caution:  { icon: <FiAlertTriangle size={10} />, text: 'Caution', cls: 'text-red-700 bg-red-50 border-red-200' },
    unknown:  { icon: <FiShield size={10} />,      text: 'Unrated',  cls: 'text-gray-500 bg-gray-50 border-gray-200' },
  };
  const c = cfg[level || ''] || { icon: null, text: 'Unrated', cls: 'text-gray-500 bg-gray-50 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium border rounded-full px-1.5 py-0.5 ${c.cls}`} title={score ? `Trust score: ${score}/100` : undefined}>
      {c.icon} {c.text}{score ? ` ${score}` : ''}
    </span>
  );
};

/* ─── Platform Logo (local SVG) ────────────────────────── */

const PlatformBadge: React.FC<{ platform: string; size?: 'sm' | 'md' | 'lg' }> = ({ platform, size = 'md' }) => {
  const p = PM[platform];
  if (!p) return null;
  const h = size === 'sm' ? 'h-5' : size === 'md' ? 'h-7' : 'h-9';
  return <img src={p.logo} alt={p.label} className={`${h} rounded`} />;
};

/* ─── Skeleton loader ─────────────────────────────────── */

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
    <div className="flex items-start gap-4 p-5 pb-4">
      <div className="w-20 h-20 rounded-xl bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
    <div className="grid grid-cols-3 border-t border-gray-100">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-4 text-center border-r last:border-r-0 border-gray-100 space-y-2">
          <div className="h-6 bg-gray-200 rounded mx-auto w-16" />
          <div className="h-5 bg-gray-200 rounded mx-auto w-20" />
          <div className="h-3 bg-gray-200 rounded mx-auto w-12" />
          <div className="h-8 bg-gray-200 rounded mx-auto w-24 mt-2" />
        </div>
      ))}
    </div>
  </div>
);

/* ─── Comparison Card ──────────────────────────────────── */

const ComparisonCard: React.FC<{ group: ProductGroup; rank: number; searchQuery: string; onTrack?: () => void }> = ({ group, rank, searchQuery, onTrack }) => {
  const [open, setOpen] = useState(false);
  const bestImg = group.listings.find(l => l.product.imageUrl)?.product.imageUrl;
  const bestListing = group.listings.find(l => l.product.price === group.lowestPrice) || group.listings[0];
  const tracked = isTracked(bestListing.product.url);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${rank === 0 ? 'border-green-200 ring-1 ring-green-100' : 'border-gray-200'}`}>

      {/* ── Header row ── */}
      <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 pb-3 sm:pb-4">
        {/* Image */}
        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-100">
          {bestImg ? (
            <img src={bestImg} alt="" loading="lazy" decoding="async" className="w-full h-full object-contain p-1.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <FiTag className="text-gray-300" size={28} />
          )}
        </div>

        {/* Title + badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            {rank === 0 && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                <FiAward size={10} /> TOP DEAL
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2">{group.name}</h3>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
            <span>{group.platformCount} platform{group.platformCount > 1 ? 's' : ''}</span>
            {group.matchConfidence > 0 && (
              <span className={`inline-flex items-center gap-1 font-semibold ${
                group.matchConfidence >= 80 ? 'text-green-600' :
                group.matchConfidence >= 60 ? 'text-blue-600' :
                'text-yellow-600'
              }`} title={group.matchExplanation || 'Match confidence'}>
                <FiShield size={11} /> {group.matchConfidence}% match
              </span>
            )}
            {group.savings > 0 && (
              <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                <FiTrendingDown size={12} /> Save {fmtNGN(group.savings)}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!tracked) {
                  addAlert({
                    query: searchQuery,
                    productTitle: group.name,
                    platform: bestListing.platform,
                    url: bestListing.product.url,
                    imageUrl: bestImg,
                    price: group.lowestPrice,
                  });
                  onTrack?.();
                }
              }}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                tracked
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-transparent'
              }`}
              title={tracked ? 'Tracking this price' : 'Get notified when price drops'}
            >
              <FiClock size={10} />
              {tracked ? 'Tracking' : 'Track Price'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Platform price grid ── */}
      <div className="grid grid-cols-3 border-t border-gray-100">
        {PLATFORMS.map((platform) => {
          const listing = group.listings.find(l => l.platform === platform);
          const p = PM[platform];
          const isBest = listing && listing.product.price === group.lowestPrice;

          return (
            <div
              key={platform}
              className={`relative p-3 sm:p-4 text-center border-r last:border-r-0 border-gray-100 ${
                isBest ? 'bg-green-50' : listing ? '' : 'bg-gray-50'
              }`}
            >
              {/* Platform logo */}
              <div className="flex justify-center mb-2">
                <PlatformBadge platform={platform} size="md" />
              </div>

              {listing ? (
                <>
                  {/* Price */}
                  <div className={`text-base sm:text-lg font-bold mb-0.5 ${isBest ? 'text-green-600' : 'text-gray-900'}`}>
                    {fmtNGN(listing.product.price)}
                  </div>

                  {isBest ? (
                    <div className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Best Price</div>
                  ) : (
                    <div className="flex items-center justify-center gap-0.5 text-[10px] text-red-400">
                      <FiTrendingUp size={10} /> +{fmtNGN(listing.product.price - group.lowestPrice)}
                    </div>
                  )}

                  {/* Vendor + Trust */}
                  <div className="mt-2 flex flex-col items-center gap-1">
                    {listing.vendorName && (
                      <span className="text-[10px] text-gray-500 truncate max-w-[110px]">{listing.vendorName}</span>
                    )}
                    <TrustBadge level={listing.trustLevel} score={listing.trustScore} />
                    {listing.scamFlags && listing.scamFlags.length > 0 && (
                      <span className="text-[9px] text-red-500 leading-tight text-center" title={listing.scamFlags.join(', ')}>
                        <FiAlertTriangle className="inline" size={9} /> {listing.scamFlags.length} warning{listing.scamFlags.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <a
                    href={listing.product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      recordClick(listing.product.title, listing.product.platform, listing.product.price, listing.product.url);
                      incrementClickStat(listing.product.platform);
                    }}
                    className={`mt-3 inline-flex items-center justify-center gap-1 w-full py-2 rounded-lg text-xs font-semibold text-white transition-colors ${
                      isBest ? 'bg-green-500 hover:bg-green-600' : 'hover:opacity-90'
                    }`}
                    style={isBest ? {} : { backgroundColor: p.color }}
                  >
                    {isBest ? `Buy on ${p.label}` : `View on ${p.label}`} <FiExternalLink size={11} />
                  </a>
                </>
              ) : (
                <div className="py-6">
                  <div className="text-xs text-gray-400">Not available</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Expandable details ── */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-1 py-2.5 text-xs text-gray-400 hover:text-gray-600 transition-colors border-t border-gray-100 bg-gray-50/50"
      >
        {open ? 'Hide' : 'Details'} {open ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
      </button>

      {open && (
        <div className="px-4 sm:px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-3">
          {/* Condition warning */}
          {group.conditionWarning && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-700">
              <FiAlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
              <span>{group.conditionWarning}</span>
            </div>
          )}

          {/* Match details */}
          {(group.matchedAttributes?.length > 0 || group.attributes) && (
            <div className="flex flex-wrap gap-1.5 items-center">
              {group.attributes?.brand && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-medium">
                  {group.attributes.brand}
                </span>
              )}
              {group.attributes?.model && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[10px] font-medium">
                  {group.attributes.model}
                </span>
              )}
              {group.attributes?.storage && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-medium">
                  {group.attributes.storage}
                </span>
              )}
              {group.attributes?.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-[10px] font-medium">
                  {group.attributes.category.replace(/_/g, ' ')}
                </span>
              )}
              {group.matchExplanation && (
                <span className="text-[10px] text-gray-400 ml-1">{group.matchExplanation}</span>
              )}
            </div>
          )}

          {group.listings.map((l, i) => (
            <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-100">
              <PlatformBadge platform={l.platform} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-800 line-clamp-1">{l.product.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {l.product.condition.replace(/_/g, ' ')}
                  {l.product.metadata?.location ? ` · ${l.product.metadata.location}` : ''}
                </p>
                {l.scamFlags && l.scamFlags.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {l.scamFlags.map((flag, fi) => (
                      <p key={fi} className="text-[10px] text-red-500 flex items-center gap-1">
                        <FiAlertTriangle size={9} /> {flag}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Unmatched Card ───────────────────────────────────── */

const UnmatchedCard: React.FC<{ product: ScrapedProduct }> = ({ product }) => {
  const p = PM[product.platform];
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 hover:shadow-sm transition-shadow flex gap-3 items-center">
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-contain p-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <FiTag className="text-gray-300" size={16} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <PlatformBadge platform={product.platform} size="sm" />
        </div>
        <h4 className="text-xs font-medium text-gray-800 line-clamp-1">{product.title}</h4>
        <span className="text-sm font-bold" style={{ color: p?.color }}>{fmtNGN(product.price)}</span>
      </div>
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          recordClick(product.title, product.platform, product.price, product.url);
          incrementClickStat(product.platform);
        }}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
      >
        <FiExternalLink size={14} />
      </a>
    </div>
  );
};

/* ─── Browse Product Card (for broad queries) ────────── */

const BrowseProductCard: React.FC<{ product: ScrapedProduct; onRefineSearch: (q: string) => void }> = ({ product, onRefineSearch }) => {
  const p = PM[product.platform];
  // Extract a short product type from title for the "search this" button
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all group">
      {/* Image */}
      <div className="relative h-36 bg-gray-50 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain p-3"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <FiTag className="text-gray-200" size={40} />
        )}
        {/* Platform badge */}
        <div className="absolute top-2 left-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-1.5 py-1 shadow-sm">
            <PlatformBadge platform={product.platform} size="sm" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="text-xs font-medium text-gray-800 line-clamp-2 leading-relaxed mb-2 min-h-[2.5rem]">{product.title}</h4>
        <div className="flex items-center justify-between">
          <span className="text-base font-bold" style={{ color: p?.color }}>{fmtNGN(product.price)}</span>
          {product.condition && product.condition !== 'UNKNOWN' && (
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              {product.condition.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onRefineSearch(product.title.split(/\s+/).slice(0, 4).join(' '))}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-primary/5 text-primary text-xs font-medium rounded-lg hover:bg-primary/10 transition-colors"
            title="Search for this specific product to compare prices"
          >
            <FiSearch size={11} /> Compare Prices
          </button>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              recordClick(product.title, product.platform, product.price, product.url);
              incrementClickStat(product.platform);
            }}
            className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-80 text-white"
            style={{ backgroundColor: p?.color }}
          >
            View <FiExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  );
};

/* ─── Category Label Helper ──────────────────────────── */

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  AUDIO: { label: 'Audio & Earphones', icon: '🎧' },
  PHONE: { label: 'Phones', icon: '📱' },
  PHONE_ACCESSORY: { label: 'Phone Accessories', icon: '📱' },
  APPLIANCE: { label: 'Home & Appliances', icon: '🏠' },
  LAPTOP: { label: 'Laptops', icon: '💻' },
  LAPTOP_ACCESSORY: { label: 'Laptop Accessories', icon: '💻' },
  WEARABLE: { label: 'Smartwatches & Wearables', icon: '⌚' },
  TV: { label: 'TVs & Displays', icon: '📺' },
  GAMING_CONSOLE: { label: 'Gaming', icon: '🎮' },
  GAMING_ACCESSORY: { label: 'Gaming Accessories', icon: '🎮' },
  STORAGE_DEVICE: { label: 'Storage Devices', icon: '💾' },
  NETWORKING: { label: 'Networking', icon: '📡' },
  SOLAR_POWER: { label: 'Solar & Power', icon: '☀️' },
  GENERAL_ACCESSORY: { label: 'Accessories', icon: '🔌' },
  OTHER: { label: 'Other Products', icon: '📦' },
};

/** Guess product category from title using simple keywords */
function guessCategory(title: string): string {
  const t = title.toLowerCase();
  if (/\b(earbuds?|earpods?|headphones?|speakers?|soundbar|earphones?|freepods|spacebuds|necklace)\b/.test(t)) return 'AUDIO';
  if (/\b(power\s*bank|charger|cable|adapter|case|screen\s*protector|tempered\s*glass|phone\s*holder)\b/.test(t)) return 'PHONE_ACCESSORY';
  if (/\b(iphone|galaxy\s*[asz]|redmi|tecno|infinix|itel|smartphone|android\s*phone)\b/.test(t)) return 'PHONE';
  if (/\b(laptop|macbook|thinkpad|chromebook|notebook)\b/.test(t)) return 'LAPTOP';
  if (/\b(smart\s*watch|smartwatch|watch|band|fitbit)\b/.test(t)) return 'WEARABLE';
  if (/\b(extension|stabilizer|surge|blender|iron|fan|kettle|microwave|fridge|cooker)\b/.test(t)) return 'APPLIANCE';
  if (/\b(tv|television|oled|qled)\b/.test(t)) return 'TV';
  if (/\b(playstation|ps[45]|xbox|nintendo|controller|gamepad)\b/.test(t)) return 'GAMING_CONSOLE';
  if (/\b(ssd|hdd|hard\s*drive|flash\s*drive|memory\s*card|sd\s*card)\b/.test(t)) return 'STORAGE_DEVICE';
  if (/\b(router|wifi|modem|mesh)\b/.test(t)) return 'NETWORKING';
  if (/\b(solar|inverter|generator)\b/.test(t)) return 'SOLAR_POWER';
  if (/\b(clipper|trimmer|hair)\b/.test(t)) return 'OTHER';
  return 'OTHER';
}

/* ─── Browse Grid (broad query results) ──────────────── */

const BrowseGrid: React.FC<{
  products: ScrapedProduct[];
  query: string;
  onRefineSearch: (q: string) => void;
}> = ({ products, query, onRefineSearch }) => {
  // Group products by guessed category
  const grouped = useMemo(() => {
    const map = new Map<string, ScrapedProduct[]>();
    for (const p of products) {
      const cat = guessCategory(p.title);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    // Sort categories by count descending
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [products]);

  return (
    <div className="space-y-8">
      {/* Hint banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <FiGrid className="flex-shrink-0 text-blue-500 mt-0.5" size={18} />
        <div>
          <p className="text-sm font-medium text-blue-800">
            Showing all "{query}" products — pick one to compare prices
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            Tap "Compare Prices" on any product to find the same item across Jumia, Konga & Jiji
          </p>
        </div>
      </div>

      {grouped.map(([category, items]) => {
        const catInfo = CATEGORY_LABELS[category] || { label: category, icon: '📦' };
        return (
          <div key={category}>
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
              <span>{catInfo.icon}</span>
              {catInfo.label}
              <span className="text-xs font-normal text-gray-400 lowercase tracking-normal">({items.length})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.slice(0, 8).map((product, idx) => (
                <BrowseProductCard
                  key={`${product.platform}-${product.externalId}-${idx}`}
                  product={product}
                  onRefineSearch={onRefineSearch}
                />
              ))}
            </div>
            {items.length > 8 && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                + {items.length - 8} more — search for a specific product to see all
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ─── YouTube Review Card ─────────────────────────────── */

const YouTubeCard: React.FC<{ video: YouTubeVideo }> = ({ video }) => (
  <a
    href={video.url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex gap-3 bg-white rounded-xl border border-gray-100 p-3 hover:shadow-sm transition-shadow group"
  >
    <div className="flex-shrink-0 w-28 h-20 rounded-lg bg-gray-100 overflow-hidden relative">
      <img
        src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
        <FiYoutube className="text-red-500" size={24} />
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">{video.title}</h4>
      <p className="text-[10px] text-gray-500 mt-1">{video.channelName}</p>
      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
        {video.viewCount != null && <span>{video.viewCount.toLocaleString()} views</span>}
      </div>
    </div>
  </a>
);

/* ─── Main Page ────────────────────────────────────────── */

const PriceComparePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<LiveSearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUnmatched, setShowUnmatched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);
  const [cacheInfo, setCacheInfo] = useState<{ hit: boolean; layer: string; ageSeconds?: number } | null>(null);

  // YouTube reviews
  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([]);
  const [ytLoading, setYtLoading] = useState(false);

  // Platform search progress
  const [searchPhase, setSearchPhase] = useState('');

  // Price alerts
  const [, setTrackedCount] = useState(() => getAlerts().filter(a => !a.dismissed).length);
  const [triggeredAlerts, setTriggeredAlerts] = useState<PriceAlert[]>([]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    setData(null);
    setCacheInfo(null);
    setYtVideos([]);
    setSearchParams({ q: q.trim() });

    setSearchPhase('Connecting to platforms...');

    try {
      const response = await apiService.liveSearch(q.trim(), 10);
      if (response?.data) {
        setData(response.data);
        setCacheInfo(response._cache || null);
      }

      // Save to recent searches
      addRecentSearch(q.trim());
      setRecentSearches(getRecentSearches());

      // Update tracked price alerts with new prices
      if (response?.data?.allProducts) {
        for (const product of response.data.allProducts) {
          updateAlertPrice(product.url, product.price);
        }
        setTriggeredAlerts(getTriggeredAlerts());
        setTrackedCount(getAlerts().filter((a: PriceAlert) => !a.dismissed).length);
      }

      // Fetch YouTube reviews in background
      setYtLoading(true);
      apiService.getYouTubeReviews(q.trim(), 4)
        .then((ytData: any) => {
          if (ytData?.videos?.length > 0) setYtVideos(ytData.videos);
        })
        .catch(() => {})
        .finally(() => setYtLoading(false));

    } catch (err: any) {
      setError(err?.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
      setSearchPhase('');
    }
  }, [setSearchParams]);

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  /** Refine search from browse mode — user tapped "Compare Prices" on a product */
  const handleRefineSearch = useCallback((refinedQuery: string) => {
    setQuery(refinedQuery);
    doSearch(refinedQuery);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [doSearch]);

  /**
   * Detect "browse mode" — when query is broad (brand-only or very short)
   * and results are mostly unmatched (no good cross-platform matches).
   * In browse mode we show all products organized by category instead of
   * the comparison view.
   */
  const isBrowseMode = useMemo(() => {
    if (!data) return false;
    const groupedCount = data.groups?.length || 0;
    const unmatchedCount = data.unmatchedProducts?.length || 0;
    const totalProducts = data.totalResults || 0;
    // Browse mode triggers when:
    //  - Very few groups relative to total (< 20% matched) OR no groups at all
    //  - AND we have a decent number of unmatched products
    //  - AND query is short (likely brand-only or broad)
    const queryWords = data.query.trim().split(/\s+/).length;
    const matchRatio = totalProducts > 0 ? (groupedCount / Math.max(totalProducts, 1)) : 0;

    return (
      (groupedCount === 0 || matchRatio < 0.15) &&
      unmatchedCount >= 4 &&
      queryWords <= 2
    );
  }, [data]);

  const popular = ['iPhone 15', 'Samsung Galaxy A15', 'Tecno Spark 20', 'PlayStation 5', 'MacBook Air', 'Infinix Hot 40'];

  useSEO({
    title: data ? `${data.query} prices — Compare across Jumia, Konga & Jiji` : 'Compare Prices',
    description: data
      ? `Compare ${data.query} prices across Nigerian stores. Found ${data.totalResults} listings. Lowest: ₦${data.priceSummary?.lowestPrice?.toLocaleString()}.`
      : 'Compare product prices across Jumia, Konga & Jiji in Nigeria. Find the best deals and avoid scam sellers.',
    keywords: data ? `${data.query}, price comparison, Nigeria, Jumia, Konga, Jiji, best price` : 'price comparison Nigeria, Jumia prices, Konga prices, Jiji prices',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Hero ─── */}
      <div className="bg-gradient-primary">
        <div className="max-w-4xl mx-auto px-4 pt-8 sm:pt-10 pb-10 sm:pb-12 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-2">
            Compare Prices Across Nigeria
          </h1>
          <p className="text-white/70 text-sm sm:text-base mb-6 sm:mb-8">
            Real-time prices from Jumia, Konga & Jiji — side by side
          </p>

          {/* Platform logos */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            {PLATFORMS.map((p) => (
              <div key={p} className="bg-white/10 rounded-xl px-3 sm:px-4 py-2">
                <PlatformBadge platform={p} size="lg" />
              </div>
            ))}
          </div>

          {/* Search bar with autocomplete */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <SearchAutocomplete
              value={query}
              onChange={setQuery}
              onSearch={doSearch}
              loading={loading}
              recentSearches={recentSearches}
              placeholder="Search a product... e.g. Oraimo FreePods, iPhone 15"
            />
          </form>

          {/* Popular searches (when no results shown) */}
          {!data && !loading && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {popular.map((s) => (
                <button key={s} onClick={() => { setQuery(s); doSearch(s); }} className="px-3 py-1 text-sm bg-white/15 text-white/80 rounded-full hover:bg-white/25 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">

        {/* Loading — skeleton cards */}
        {loading && (
          <div className="space-y-4">
            <div className="flex flex-col items-center py-6">
              <FiLoader className="animate-spin text-primary mb-3" size={32} />
              <p className="text-gray-600 font-medium text-sm">{searchPhase || 'Searching all platforms...'}</p>
              <div className="flex gap-5 mt-4">
                {PLATFORMS.map((p) => (
                  <div key={p} className="animate-pulse"><PlatformBadge platform={p} size="lg" /></div>
                ))}
              </div>
            </div>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <FiAlertTriangle className="mx-auto text-red-500 mb-2" size={28} />
            <p className="text-red-700 font-medium text-sm">{error}</p>
            <button onClick={() => doSearch(query)} className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">
              Retry
            </button>
          </div>
        )}

        {/* ─── Triggered price alerts ─── */}
        {triggeredAlerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {triggeredAlerts.map(alert => (
              <div key={alert.id} className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                <FiTrendingDown className="text-green-500 flex-shrink-0" size={20} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800">Price drop alert!</p>
                  <p className="text-xs text-green-600 truncate">
                    <strong>{alert.productTitle}</strong> dropped to {fmtNGN(alert.currentPrice)} (was {fmtNGN(alert.initialPrice)}, {getPriceChange(alert)}%)
                  </p>
                </div>
                <a href={alert.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600">
                  Buy Now
                </a>
                <button onClick={() => { dismissAlert(alert.id); setTriggeredAlerts(getTriggeredAlerts()); }} className="flex-shrink-0 text-green-400 hover:text-green-600">
                  <FiX size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ─── Results ─── */}
        {data && !loading && (
          <>
            {/* Meta bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-800">{data.totalResults}</span> results for "<span className="font-semibold text-gray-800">{data.query}</span>"
                  <span className="ml-2 text-gray-400"><FiClock className="inline -mt-0.5 mr-0.5" size={12} />{(data.searchTimeMs / 1000).toFixed(1)}s</span>
                </p>
                {cacheInfo?.hit && (
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <FiZap size={10} className="text-yellow-500" />
                    Cached result ({cacheInfo.ageSeconds ? `${Math.round(cacheInfo.ageSeconds / 60)}min ago` : 'instant'}) — <button onClick={() => { apiService.liveSearch(data.query, 10).then(r => { if (r?.data) { setData(r.data); setCacheInfo(r._cache || null); } }); }} className="text-blue-500 hover:underline">refresh</button>
                  </p>
                )}
              </div>

              {/* Platform pills */}
              <div className="flex gap-2">
                {PLATFORMS.map((platform) => {
                  const pl = data.platforms[platform];
                  return (
                    <div key={platform} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${pl?.error ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 bg-white text-gray-600'}`}>
                      <PlatformBadge platform={platform} size="sm" />
                      <span>{pl?.count ?? 0}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── BROWSE MODE: Broad query with mixed products ── */}
            {isBrowseMode ? (
              <>
                <BrowseGrid
                  products={[
                    ...(data.allProducts || []),
                    ...(data.unmatchedProducts || []),
                  ].filter((p, i, arr) =>
                    arr.findIndex(x => x.externalId === p.externalId && x.platform === p.platform) === i
                  )}
                  query={data.query}
                  onRefineSearch={handleRefineSearch}
                />

                {/* Safety Disclaimer */}
                <SafetyDisclaimer variant="compact" className="mt-8 mb-8" />
              </>
            ) : (
              <>
                {/* ── Matching intelligence bar ── */}
                {data.matchingStats && (data.filteredAsAccessories > 0 || data.matchingStats.avgConfidence > 0) && (
                  <div className="flex flex-wrap items-center gap-3 mb-4 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <FiShield size={12} /> Smart Matching
                    </span>
                    {data.matchingStats.avgConfidence > 0 && (
                      <span>Avg confidence: <strong>{data.matchingStats.avgConfidence}%</strong></span>
                    )}
                    {data.filteredAsAccessories > 0 && (
                      <span className="text-blue-500">{data.filteredAsAccessories} accessor{data.filteredAsAccessories === 1 ? 'y' : 'ies'} filtered out</span>
                    )}
                    {data.matchingStats.totalGrouped > 0 && (
                      <span>{data.matchingStats.totalGrouped} products matched across platforms</span>
                    )}
                  </div>
                )}

                {/* ── Cross-platform groups ── */}
                {data.groups && data.groups.length > 0 && (
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-2 mb-1">
                      <FiCheckCircle className="text-green-500" size={16} />
                      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                        Price Comparison ({data.groups.length} matched)
                      </h2>
                    </div>

                    {data.groups.map((group, idx) => (
                      <ComparisonCard key={group.groupId} group={group} rank={idx} searchQuery={data.query} onTrack={() => setTrackedCount(getAlerts().filter(a => !a.dismissed).length)} />
                    ))}
                  </div>
                )}

                {/* ── No matches hint ── */}
                {data.groups?.length === 0 && data.totalResults > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center mb-8">
                    <FiAlertTriangle className="mx-auto text-amber-500 mb-2" size={22} />
                    <p className="text-sm font-medium text-amber-800">No cross-platform matches found</p>
                    <p className="text-xs text-amber-600 mt-1">Try a more specific search like "iPhone 15 Pro Max 256GB"</p>
                  </div>
                )}

                {/* ── Safety Disclaimer ── */}
                <SafetyDisclaimer variant="compact" className="mb-8" />

                {/* ── YouTube Reviews ── */}
                {(ytVideos.length > 0 || ytLoading) && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <FiYoutube className="text-red-500" size={16} />
                      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                        Video Reviews
                      </h2>
                    </div>
                    {ytLoading ? (
                      <div className="flex gap-3 overflow-hidden">
                        {[1, 2].map(i => (
                          <div key={i} className="flex gap-3 bg-white rounded-xl border border-gray-100 p-3 animate-pulse w-1/2">
                            <div className="w-28 h-20 rounded-lg bg-gray-200" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-gray-200 rounded w-full" />
                              <div className="h-3 bg-gray-200 rounded w-3/4" />
                              <div className="h-2 bg-gray-200 rounded w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ytVideos.map(v => <YouTubeCard key={v.videoId} video={v} />)}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Other results ── */}
                {data.unmatchedProducts && data.unmatchedProducts.length > 0 && (
                  <div className="mb-8">
                    <button
                      onClick={() => setShowUnmatched(!showUnmatched)}
                      className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 hover:text-gray-700"
                    >
                      Other Results ({data.unmatchedProducts.length})
                      {showUnmatched ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                    </button>

                    {showUnmatched && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {data.unmatchedProducts.map((product, idx) => (
                          <UnmatchedCard key={`${product.platform}-${product.externalId}-${idx}`} product={product} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Zero results */}
            {data.totalResults === 0 && (
              <div className="text-center py-16">
                <FiSearch className="mx-auto text-gray-300 mb-4" size={40} />
                <p className="text-gray-700 font-medium">No products found</p>
                <p className="text-sm text-gray-500 mt-1 mb-6">Try a different search term</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {popular.slice(0, 4).map((s) => (
                    <button key={s} onClick={() => { setQuery(s); doSearch(s); }} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── Empty state ─── */}
        {!data && !loading && !error && (
          <div className="text-center py-12">
            <h2 className="text-xl font-display font-semibold text-gray-900 mb-2">
              How it works
            </h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-10">
              Search for any product and we compare prices across all major Nigerian platforms in real-time.
            </p>

            <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-lg mx-auto">
              {[
                { step: '1', title: 'Search', desc: 'Type a product name', color: 'bg-orange-100 text-orange-600' },
                { step: '2', title: 'Compare', desc: 'See prices side-by-side', color: 'bg-blue-100 text-blue-600' },
                { step: '3', title: 'Save', desc: 'Buy the cheapest deal', color: 'bg-green-100 text-green-600' },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className={`w-10 h-10 rounded-full ${s.color} flex items-center justify-center mx-auto mb-2 text-sm font-bold`}>{s.step}</div>
                  <h3 className="text-sm font-semibold text-gray-800">{s.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
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
