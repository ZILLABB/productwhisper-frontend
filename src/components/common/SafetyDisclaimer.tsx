import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, AlertTriangle, MapPin, Eye, Package, CreditCard } from 'lucide-react';

interface SafetyDisclaimerProps {
  /** Show the full expanded version (for product/deal pages) */
  variant?: 'full' | 'compact' | 'banner';
  /** Platform name — shows platform-specific tips */
  platform?: string;
  className?: string;
}

const SAFETY_TIPS = [
  {
    icon: CreditCard,
    title: 'Avoid paying in advance',
    desc: 'Never send money upfront, even for delivery. Pay only when you have the item in hand.',
  },
  {
    icon: MapPin,
    title: 'Meet in a safe public place',
    desc: 'Choose busy, well-lit locations for in-person transactions. Bring someone with you if possible.',
  },
  {
    icon: Eye,
    title: 'Inspect before you pay',
    desc: 'Check the product thoroughly. Make sure it matches the listing description, works properly, and has no hidden damage.',
  },
  {
    icon: Package,
    title: 'Verify the packed item',
    desc: 'If the seller packs the item, open and confirm it is the same one you inspected before completing payment.',
  },
  {
    icon: ShieldAlert,
    title: 'Only pay when satisfied',
    desc: 'If something feels off — wrong model, different condition, missing accessories — walk away. There will always be another deal.',
  },
];

const PLATFORM_WARNINGS: Record<string, string> = {
  JIJI: 'Jiji is a classifieds marketplace — listings are from individual sellers. Prices and quality vary widely. Always verify in person.',
  KONGA: 'Konga sellers are vetted but always confirm product specs and warranty before purchasing.',
  JUMIA: 'Jumia offers buyer protection on most items, but check seller ratings and return policies carefully.',
};

const SafetyDisclaimer: React.FC<SafetyDisclaimerProps> = ({ variant = 'full', platform, className = '' }) => {
  const [expanded, setExpanded] = useState(variant === 'full');

  // Banner — single-line warning strip
  if (variant === 'banner') {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 ${className}`}>
        <div className="flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">
            <span className="font-medium">Safety tip:</span> Never pay in advance. Meet in a safe public place and inspect items before paying.
            {platform && PLATFORM_WARNINGS[platform] && (
              <span className="text-amber-600 ml-1">{PLATFORM_WARNINGS[platform]}</span>
            )}
          </p>
        </div>
      </div>
    );
  }

  // Compact — collapsible
  if (variant === 'compact') {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-lg overflow-hidden ${className}`}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-100/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-amber-800">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">Buyer Safety Tips</span>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-amber-600" /> : <ChevronDown className="h-4 w-4 text-amber-600" />}
        </button>
        {expanded && (
          <div className="px-4 pb-4 border-t border-amber-200/50">
            {platform && PLATFORM_WARNINGS[platform] && (
              <p className="text-sm text-amber-700 mt-3 mb-3 italic">{PLATFORM_WARNINGS[platform]}</p>
            )}
            <ul className="space-y-2 mt-2">
              {SAFETY_TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <tip.icon className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-amber-800">{tip.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Full — always visible, detailed
  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-xl p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-amber-100 rounded-lg">
          <ShieldAlert className="h-5 w-5 text-amber-700" />
        </div>
        <h3 className="font-semibold text-amber-900">Stay Safe When Buying</h3>
      </div>

      {platform && PLATFORM_WARNINGS[platform] && (
        <div className="bg-amber-100/50 rounded-lg px-3 py-2 mb-4">
          <p className="text-sm text-amber-800">{PLATFORM_WARNINGS[platform]}</p>
        </div>
      )}

      <div className="space-y-3">
        {SAFETY_TIPS.map((tip, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="p-1 bg-amber-100 rounded flex-shrink-0 mt-0.5">
              <tip.icon className="h-3.5 w-3.5 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-900">{tip.title}</p>
              <p className="text-xs text-amber-700 mt-0.5">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-amber-200/50">
        <p className="text-xs text-amber-600">
          ProductWhisper aggregates listings from third-party platforms. We do not sell products directly and are not responsible for transactions between buyers and sellers. Always exercise caution.
        </p>
      </div>
    </div>
  );
};

export default SafetyDisclaimer;
