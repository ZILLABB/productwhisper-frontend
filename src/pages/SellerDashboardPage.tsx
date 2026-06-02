import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import useSEO from '../hooks/useSEO';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { TrendingDown, TrendingUp, CheckCircle, AlertTriangle, Store } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  platform: string;
  isVerified: boolean;
  listingCount: number;
}

interface DashItem {
  productId: string;
  productName: string;
  platform: string;
  condition: string;
  comparedWithinCondition: boolean;
  myPrice: number;
  marketMin: number;
  marketAvg: number;
  marketMax: number;
  competitorCount: number;
  competitiveness: 'cheapest' | 'competitive' | 'above_market';
  overpricedBy: number;
  sentimentScore: number | null;
  analysisCount: number;
  listingUrl: string;
}

interface Dashboard {
  vendor: { id: string; name: string; platform: string; isVerified: boolean };
  summary: {
    totalProducts: number;
    cheapestCount: number;
    aboveMarketCount: number;
    competitivePct: number;
    avgSentiment: number | null;
    totalOverpricedNaira: number;
  };
  items: DashItem[];
}

const COMPETE_BADGE: Record<DashItem['competitiveness'], { label: string; cls: string }> = {
  cheapest: { label: 'Cheapest', cls: 'bg-green-100 text-green-700' },
  competitive: { label: 'Competitive', cls: 'bg-blue-100 text-blue-700' },
  above_market: { label: 'Above market', cls: 'bg-red-100 text-red-700' },
};

function sentimentLabel(score: number | null): { text: string; cls: string } {
  if (score == null) return { text: '—', cls: 'text-gray-400' };
  if (score >= 0.3) return { text: 'Positive', cls: 'text-green-600' };
  if (score <= -0.3) return { text: 'Negative', cls: 'text-red-600' };
  return { text: 'Mixed', cls: 'text-yellow-600' };
}

const SellerDashboardPage: React.FC = () => {
  useSEO({ title: 'Seller Intelligence Dashboard', description: 'See how your prices compare to the market across Jumia, Konga and Jiji, and track review sentiment on your products.' });

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadingDash, setLoadingDash] = useState(false);

  useEffect(() => {
    apiService
      .getVendors(50)
      .then((v: Vendor[]) => {
        setVendors(v || []);
        if (v && v.length) setSelected(v[0].id);
      })
      .catch(() => setVendors([]))
      .finally(() => setLoadingVendors(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingDash(true);
    apiService
      .getVendorDashboard(selected)
      .then((d: Dashboard) => setDashboard(d))
      .catch(() => setDashboard(null))
      .finally(() => setLoadingDash(false));
  }, [selected]);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-12 max-w-6xl">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-primary-light rounded-2xl px-4 py-8 sm:px-8 sm:py-10 text-white mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Store className="w-5 h-5" />
          <span className="text-sm font-medium text-white/80">For Sellers & Brands</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Seller Intelligence Dashboard</h1>
        <p className="text-base sm:text-lg text-white/80 mt-2 max-w-2xl">
          See exactly where your prices beat or trail the market across Jumia, Konga & Jiji — and what buyers are saying about your products.
        </p>
      </div>

      {/* Vendor picker */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select a seller</label>
        {loadingVendors ? (
          <LoadingSpinner size="small" text="Loading sellers..." />
        ) : vendors.length === 0 ? (
          <p className="text-gray-500 text-sm">No sellers found yet. Run a few scrapes to populate vendor data.</p>
        ) : (
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full sm:w-auto min-w-[280px] border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.platform}) — {v.listingCount} listings{v.isVerified ? ' ✓' : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Dashboard */}
      {loadingDash ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="medium" text="Crunching the numbers..." /></div>
      ) : dashboard ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <SummaryCard label="Products tracked" value={String(dashboard.summary.totalProducts)} icon={<Store className="w-5 h-5 text-primary" />} />
            <SummaryCard label="Price-competitive" value={`${dashboard.summary.competitivePct}%`} icon={<CheckCircle className="w-5 h-5 text-green-600" />} sub={`${dashboard.summary.cheapestCount} cheapest`} />
            <SummaryCard label="Above market" value={String(dashboard.summary.aboveMarketCount)} icon={<TrendingUp className="w-5 h-5 text-red-600" />} sub="losing on price" />
            <SummaryCard label="Left on the table" value={formatPrice(dashboard.summary.totalOverpricedNaira)} icon={<TrendingDown className="w-5 h-5 text-amber-600" />} sub="vs cheapest rival" />
          </div>

          {/* Items table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[700px] w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Product</th>
                    <th className="text-right font-medium px-4 py-3">Your price</th>
                    <th className="text-right font-medium px-4 py-3">Market min</th>
                    <th className="text-right font-medium px-4 py-3">Market avg</th>
                    <th className="text-center font-medium px-4 py-3">Position</th>
                    <th className="text-center font-medium px-4 py-3">Sentiment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dashboard.items.map((it, idx) => {
                    const badge = COMPETE_BADGE[it.competitiveness];
                    const sent = sentimentLabel(it.sentimentScore);
                    return (
                      <tr key={`${it.productId}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 max-w-[280px]">
                          <span className="line-clamp-2 text-gray-900">{it.productName}</span>
                          <span className="flex flex-wrap items-center gap-1 mt-1">
                            {it.condition && it.condition !== 'UNKNOWN' && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                {it.condition.replace(/_/g, ' ').toLowerCase()}
                                {it.comparedWithinCondition && ' · like-for-like'}
                              </span>
                            )}
                            {it.overpricedBy > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-red-600">
                                <AlertTriangle className="w-3 h-3" /> {formatPrice(it.overpricedBy)} above cheapest
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatPrice(it.myPrice)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatPrice(it.marketMin)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatPrice(it.marketAvg)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                        </td>
                        <td className={`px-4 py-3 text-center font-medium ${sent.cls}`}>
                          {sent.text}
                          {it.analysisCount > 0 && <span className="block text-xs text-gray-400">{it.analysisCount} signals</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Market figures are computed from live listings across Jumia, Konga & Jiji. Sentiment is derived from aggregated buyer reviews.
          </p>
        </>
      ) : (
        <p className="text-gray-500 text-sm">Select a seller to view their dashboard.</p>
      )}
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: string; icon: React.ReactNode; sub?: string }> = ({ label, value, icon, sub }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-gray-500">{label}</span>
      {icon}
    </div>
    <div className="text-xl sm:text-2xl font-bold text-gray-900">{value}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
  </div>
);

export default SellerDashboardPage;
