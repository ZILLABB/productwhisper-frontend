import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { getPendingFollowUp, recordFollowUp, type ClickEvent } from '../../utils/purchaseTracker';
import { formatPrice } from '../../utils/formatPrice';

const PLATFORM_COLORS: Record<string, string> = {
  JUMIA: 'text-orange-600',
  KONGA: 'text-blue-600',
  JIJI: 'text-green-600',
};

/**
 * Non-intrusive follow-up toast that appears after a user previously
 * clicked through to buy a product. Shows once per session, only after
 * a 30+ minute delay from the click.
 */
const PurchaseFollowUp: React.FC = () => {
  const [event, setEvent] = useState<ClickEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [answer, setAnswer] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    // Check for pending follow-ups after a short delay (don't block page load)
    const timer = setTimeout(() => {
      const pending = getPendingFollowUp();
      if (pending) {
        setEvent(pending);
        // Slide in after another moment
        setTimeout(() => setVisible(true), 500);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleResponse = (result: 'yes' | 'no') => {
    if (!event) return;
    setAnswer(result);
    setAnswered(true);
    recordFollowUp(event.id, result);

    // Auto-dismiss after showing thank you
    setTimeout(() => setVisible(false), 2500);
  };

  const handleDismiss = () => {
    if (event) recordFollowUp(event.id, 'dismissed');
    setVisible(false);
  };

  if (!event) return null;

  const platformColor = PLATFORM_COLORS[event.platform] || 'text-gray-600';
  const shortName = event.productName.length > 40
    ? event.productName.slice(0, 37) + '...'
    : event.productName;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-sm transition-all duration-500 ease-out ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-8 opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Quick question</span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4">
          {!answered ? (
            <>
              <p className="text-sm text-gray-900 mb-1">
                Did you end up buying{' '}
                <span className="font-medium">{shortName}</span>
                {' '}on <span className={`font-medium ${platformColor}`}>{event.platform}</span>?
              </p>
              <p className="text-xs text-gray-400 mb-4">
                {formatPrice(event.price)} — clicked{' '}
                {formatTimeAgo(event.clickedAt)}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleResponse('yes')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Yes, I bought it
                </button>
                <button
                  onClick={() => handleResponse('no')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  No
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              {answer === 'yes' ? (
                <>
                  <p className="text-sm font-medium text-green-700">
                    Great choice! Hope you enjoy it.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Thanks for letting us know
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">
                    No worries! Better deals come around.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    We'll keep tracking prices for you
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return 'recently';
}

export default PurchaseFollowUp;
