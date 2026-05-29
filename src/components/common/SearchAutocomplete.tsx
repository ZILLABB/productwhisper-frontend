import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiSearch, FiClock, FiTrendingUp, FiArrowRight } from 'react-icons/fi';
import { apiService } from '../../services/api';

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  recentSearches?: string[];
  loading?: boolean;
  className?: string;
  /**
   * 'hero' — big rounded box with built-in Compare button (PriceComparePage hero)
   * 'inline' — plain input that fits inside an existing form/container (no button, no outer shell)
   */
  variant?: 'hero' | 'inline';
  /** CSS classes applied to the <input> element (inline variant only) */
  inputClassName?: string;
  /** Hint text shown at the bottom of the dropdown */
  hintText?: string;
  /** Label for the submit button (hero variant only) */
  buttonLabel?: string;
}

const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search a product... e.g. iPhone 15, Samsung Galaxy',
  recentSearches = [],
  loading = false,
  className = '',
  variant = 'hero',
  inputClassName = '',
  hintText = 'Pick a specific product for better results',
  buttonLabel = 'Compare',
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [fetchingHint, setFetchingHint] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fetch suggestions as user types (debounced 250ms)
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setFetchingHint(true);
    try {
      const results = await apiService.getSearchSuggestions(q.trim());
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    } finally {
      setFetchingHint(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, fetchSuggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (q: string) => {
    onChange(q);
    setShowDropdown(false);
    setActiveIndex(-1);
    onSearch(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = getDropdownItems();
    if (!showDropdown || items.length === 0) {
      if (e.key === 'ArrowDown' && value.length === 0) {
        setShowDropdown(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < items.length) {
        e.preventDefault();
        handleSelect(items[activeIndex].text);
      }
      // Otherwise, let the form handle the submit
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  // Build dropdown items: suggestions first, then recent searches
  const getDropdownItems = (): { text: string; type: 'suggestion' | 'recent' }[] => {
    const items: { text: string; type: 'suggestion' | 'recent' }[] = [];
    const seen = new Set<string>();

    // API suggestions (product names from DB)
    for (const s of suggestions) {
      const lower = s.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        items.push({ text: s, type: 'suggestion' });
      }
    }

    // Recent searches (only when input is short/empty, and not already in suggestions)
    if (value.trim().length < 3 && recentSearches.length > 0) {
      for (const r of recentSearches.slice(0, 4)) {
        const lower = r.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          items.push({ text: r, type: 'recent' });
        }
      }
    }

    return items.slice(0, 8);
  };

  const dropdownItems = getDropdownItems();
  const shouldShow = showDropdown && (dropdownItems.length > 0 || fetchingHint);

  // Highlight matching portion
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong className="text-gray-900 font-semibold">{text.slice(idx, idx + query.length)}</strong>
        {text.slice(idx + query.length)}
      </>
    );
  };

  // ── Shared dropdown JSX ──
  const dropdown = shouldShow ? (
    <div
      className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
      role="listbox"
    >
      {fetchingHint && suggestions.length === 0 && value.trim().length >= 2 && (
        <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Finding products...
        </div>
      )}

      {dropdownItems.map((item, idx) => (
        <button
          key={`${item.type}-${item.text}`}
          id={`suggestion-${idx}`}
          role="option"
          aria-selected={idx === activeIndex}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
            idx === activeIndex ? 'bg-primary/5 text-primary' : 'text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => handleSelect(item.text)}
          onMouseEnter={() => setActiveIndex(idx)}
        >
          {item.type === 'suggestion' ? (
            <FiSearch className="flex-shrink-0 text-gray-400" size={14} />
          ) : (
            <FiClock className="flex-shrink-0 text-gray-400" size={14} />
          )}
          <span className="flex-1 truncate text-gray-600">
            {highlightMatch(item.text, value)}
          </span>
          <FiArrowRight className="flex-shrink-0 text-gray-300" size={12} />
        </button>
      ))}

      {/* Hint at bottom when suggestions exist */}
      {suggestions.length > 0 && value.trim().length >= 2 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400 flex items-center gap-1">
          <FiTrendingUp size={10} />
          {hintText}
        </div>
      )}
    </div>
  ) : null;

  // ── Shared input props ──
  const inputProps = {
    ref: inputRef,
    type: 'text' as const,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      setShowDropdown(true);
      setActiveIndex(-1);
    },
    onFocus: () => setShowDropdown(true),
    onKeyDown: handleKeyDown,
    placeholder,
    autoComplete: 'off',
    role: 'combobox' as const,
    'aria-expanded': shouldShow,
    'aria-autocomplete': 'list' as const,
    'aria-activedescendant': activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined,
  };

  // ── INLINE variant: bare input + dropdown, no shell ──
  if (variant === 'inline') {
    return (
      <div ref={wrapperRef} className={`relative ${className}`}>
        <input
          {...inputProps}
          className={inputClassName || 'w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30'}
        />
        {dropdown}
      </div>
    );
  }

  // ── HERO variant: full search bar with button ──
  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative flex bg-white rounded-2xl shadow-xl overflow-hidden">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          {...inputProps}
          className="flex-1 min-w-0 pl-12 pr-2 py-3.5 sm:py-4 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 outline-none"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="flex-shrink-0 m-1.5 px-3 sm:px-6 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            buttonLabel
          )}
        </button>
      </div>

      {dropdown}
    </div>
  );
};

export default SearchAutocomplete;
