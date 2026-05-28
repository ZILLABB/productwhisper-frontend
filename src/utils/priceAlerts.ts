/**
 * Browser-based Price Alert System
 *
 * Stores price tracking data in localStorage so users can:
 * 1. Track products and see their price history over time
 * 2. Get visual alerts when a price drops below a target
 * 3. See price trend (up/down/stable) since they started tracking
 *
 * No auth required — everything lives in the browser.
 */

const LS_ALERTS_KEY = 'pw_price_alerts';
const LS_HISTORY_KEY = 'pw_price_history';

export interface PriceAlert {
  id: string;                  // unique alert ID
  query: string;               // search query that found this product
  productTitle: string;        // product name
  platform: string;            // JUMIA | KONGA | JIJI
  url: string;                 // product URL
  imageUrl?: string;           // product image
  initialPrice: number;        // price when tracking started
  targetPrice: number;         // user's desired price (default: 10% below initial)
  currentPrice: number;        // last known price
  lowestSeen: number;          // lowest price ever seen
  highestSeen: number;         // highest price ever seen
  createdAt: string;           // ISO date
  lastChecked: string;         // ISO date
  triggered: boolean;          // has the alert fired?
  dismissed: boolean;          // user dismissed the alert
}

export interface PriceSnapshot {
  alertId: string;
  price: number;
  timestamp: string;
}

/** Get all tracked alerts */
export function getAlerts(): PriceAlert[] {
  try {
    return JSON.parse(localStorage.getItem(LS_ALERTS_KEY) || '[]');
  } catch { return []; }
}

/** Get a single alert by ID */
export function getAlert(id: string): PriceAlert | undefined {
  return getAlerts().find(a => a.id === id);
}

/** Check if a product URL is being tracked */
export function isTracked(url: string): boolean {
  return getAlerts().some(a => a.url === url && !a.dismissed);
}

/** Add a new price alert */
export function addAlert(params: {
  query: string;
  productTitle: string;
  platform: string;
  url: string;
  imageUrl?: string;
  price: number;
  targetPrice?: number;
}): PriceAlert {
  const alerts = getAlerts();

  // Check if already tracking this URL
  const existing = alerts.find(a => a.url === params.url);
  if (existing) {
    existing.dismissed = false;
    existing.currentPrice = params.price;
    existing.lastChecked = new Date().toISOString();
    saveAlerts(alerts);
    return existing;
  }

  const alert: PriceAlert = {
    id: `pa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    query: params.query,
    productTitle: params.productTitle,
    platform: params.platform,
    url: params.url,
    imageUrl: params.imageUrl,
    initialPrice: params.price,
    targetPrice: params.targetPrice || Math.round(params.price * 0.9), // default: 10% drop
    currentPrice: params.price,
    lowestSeen: params.price,
    highestSeen: params.price,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    triggered: false,
    dismissed: false,
  };

  alerts.push(alert);
  saveAlerts(alerts);

  // Record initial price snapshot
  addSnapshot(alert.id, params.price);

  return alert;
}

/** Remove an alert */
export function removeAlert(id: string): void {
  const alerts = getAlerts().filter(a => a.id !== id);
  saveAlerts(alerts);
  // Clean up history
  const history = getHistory().filter(h => h.alertId !== id);
  saveHistory(history);
}

/** Dismiss an alert (keeps history but stops notifications) */
export function dismissAlert(id: string): void {
  const alerts = getAlerts();
  const alert = alerts.find(a => a.id === id);
  if (alert) {
    alert.dismissed = true;
    saveAlerts(alerts);
  }
}

/** Update price for a tracked product — call after each search */
export function updateAlertPrice(url: string, newPrice: number): PriceAlert | null {
  const alerts = getAlerts();
  const alert = alerts.find(a => a.url === url && !a.dismissed);
  if (!alert) return null;

  alert.currentPrice = newPrice;
  alert.lastChecked = new Date().toISOString();
  alert.lowestSeen = Math.min(alert.lowestSeen, newPrice);
  alert.highestSeen = Math.max(alert.highestSeen, newPrice);

  // Check if target price reached
  if (newPrice <= alert.targetPrice && !alert.triggered) {
    alert.triggered = true;
  }

  saveAlerts(alerts);
  addSnapshot(alert.id, newPrice);

  return alert;
}

/** Get price trend for an alert: 'down' | 'up' | 'stable' */
export function getPriceTrend(alert: PriceAlert): 'down' | 'up' | 'stable' {
  if (alert.currentPrice < alert.initialPrice) return 'down';
  if (alert.currentPrice > alert.initialPrice) return 'up';
  return 'stable';
}

/** Get price change percentage */
export function getPriceChange(alert: PriceAlert): number {
  if (alert.initialPrice === 0) return 0;
  return Math.round(((alert.currentPrice - alert.initialPrice) / alert.initialPrice) * 100);
}

/** Get alerts that have been triggered (price dropped below target) */
export function getTriggeredAlerts(): PriceAlert[] {
  return getAlerts().filter(a => a.triggered && !a.dismissed);
}

/** Get active (non-dismissed) alerts count */
export function getActiveAlertCount(): number {
  return getAlerts().filter(a => !a.dismissed).length;
}

/* ── Price History Snapshots ── */

function getHistory(): PriceSnapshot[] {
  try {
    return JSON.parse(localStorage.getItem(LS_HISTORY_KEY) || '[]');
  } catch { return []; }
}

function addSnapshot(alertId: string, price: number): void {
  const history = getHistory();

  // Don't add duplicate if the last snapshot for this alert has the same price
  // and was within the last hour
  const lastForAlert = [...history].reverse().find(h => h.alertId === alertId);
  if (lastForAlert) {
    const hourAgo = Date.now() - 3600000;
    if (lastForAlert.price === price && new Date(lastForAlert.timestamp).getTime() > hourAgo) {
      return;
    }
  }

  history.push({
    alertId,
    price,
    timestamp: new Date().toISOString(),
  });

  // Keep max 500 snapshots total
  saveHistory(history.slice(-500));
}

export function getAlertHistory(alertId: string): PriceSnapshot[] {
  return getHistory().filter(h => h.alertId === alertId);
}

/* ── Persistence ── */

function saveAlerts(alerts: PriceAlert[]): void {
  localStorage.setItem(LS_ALERTS_KEY, JSON.stringify(alerts));
}

function saveHistory(history: PriceSnapshot[]): void {
  localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(history));
}
