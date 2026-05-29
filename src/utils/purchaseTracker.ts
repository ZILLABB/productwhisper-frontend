/**
 * Purchase Tracker — non-intrusive follow-up after users click through to buy.
 *
 * Flow:
 * 1. User clicks "Buy on Jumia/Konga/Jiji" → we record a ClickEvent
 * 2. On their NEXT visit to ProductWhisper (or after some idle time),
 *    we show a small, dismissible toast asking "Did you end up buying X?"
 * 3. User can respond: Yes / No / Dismiss
 * 4. We store the feedback in localStorage and optionally send to backend
 *
 * Design principles:
 * - Never interrupt the current flow
 * - Only ask about the MOST RECENT click (not all of them)
 * - Max 1 follow-up per session
 * - Don't ask if they clicked less than 30 minutes ago
 * - Don't ask if they already answered or dismissed
 */

const STORAGE_KEY = 'pw_click_events';
const FOLLOWUP_KEY = 'pw_followup_shown';
const PURCHASE_STATS_KEY = 'pw_purchase_stats';

// Minimum time after click before asking (30 minutes)
const MIN_DELAY_MS = 30 * 60 * 1000;
// Maximum age of a click to still ask about (7 days)
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface ClickEvent {
  id: string;
  productName: string;
  platform: string;
  price: number;
  url: string;
  clickedAt: number; // timestamp
  followedUp: boolean;
  purchaseResult?: 'yes' | 'no' | 'dismissed';
}

export interface PurchaseStats {
  totalClicks: number;
  totalPurchases: number;
  totalDeclined: number;
  totalDismissed: number;
  byPlatform: Record<string, { clicks: number; purchases: number }>;
}

/**
 * Record that a user clicked through to buy a product.
 * Call this when they click a "Buy on X" or external listing link.
 */
export function recordClick(
  productName: string,
  platform: string,
  price: number,
  url: string,
): void {
  const events = getClickEvents();

  const event: ClickEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productName,
    platform,
    price,
    url,
    clickedAt: Date.now(),
    followedUp: false,
  };

  // Keep only last 20 events to prevent localStorage bloat
  events.push(event);
  if (events.length > 20) events.splice(0, events.length - 20);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

/**
 * Get the most recent unfollowed-up click that's old enough to ask about.
 * Returns null if there's nothing to follow up on.
 */
export function getPendingFollowUp(): ClickEvent | null {
  // Only 1 follow-up per session
  const sessionShown = sessionStorage.getItem(FOLLOWUP_KEY);
  if (sessionShown) return null;

  const events = getClickEvents();
  const now = Date.now();

  // Find most recent click that:
  // - hasn't been followed up
  // - is at least MIN_DELAY_MS old (don't bug them immediately)
  // - is at most MAX_AGE_MS old (don't ask about ancient clicks)
  const pending = events
    .filter(e =>
      !e.followedUp &&
      (now - e.clickedAt) >= MIN_DELAY_MS &&
      (now - e.clickedAt) <= MAX_AGE_MS
    )
    .sort((a, b) => b.clickedAt - a.clickedAt);

  return pending[0] || null;
}

/**
 * Record the user's response to the follow-up question.
 */
export function recordFollowUp(eventId: string, result: 'yes' | 'no' | 'dismissed'): void {
  const events = getClickEvents();
  const event = events.find(e => e.id === eventId);

  if (event) {
    event.followedUp = true;
    event.purchaseResult = result;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }

  // Mark this session as having shown a follow-up
  sessionStorage.setItem(FOLLOWUP_KEY, 'true');

  // Update aggregate stats
  const stats = getStats();
  if (result === 'yes') {
    stats.totalPurchases++;
    if (event) {
      const plat = event.platform;
      if (!stats.byPlatform[plat]) stats.byPlatform[plat] = { clicks: 0, purchases: 0 };
      stats.byPlatform[plat].purchases++;
    }
  } else if (result === 'no') {
    stats.totalDeclined++;
  } else {
    stats.totalDismissed++;
  }
  localStorage.setItem(PURCHASE_STATS_KEY, JSON.stringify(stats));
}

/**
 * Get all click events from storage.
 */
function getClickEvents(): ClickEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Get aggregate purchase stats.
 */
export function getStats(): PurchaseStats {
  try {
    const raw = localStorage.getItem(PURCHASE_STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return {
    totalClicks: 0,
    totalPurchases: 0,
    totalDeclined: 0,
    totalDismissed: 0,
    byPlatform: {},
  };
}

/**
 * Increment click count in stats (call alongside recordClick).
 */
export function incrementClickStat(platform: string): void {
  const stats = getStats();
  stats.totalClicks++;
  if (!stats.byPlatform[platform]) stats.byPlatform[platform] = { clicks: 0, purchases: 0 };
  stats.byPlatform[platform].clicks++;
  localStorage.setItem(PURCHASE_STATS_KEY, JSON.stringify(stats));
}
