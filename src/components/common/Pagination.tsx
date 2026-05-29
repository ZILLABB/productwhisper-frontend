import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Show a compact version for mobile / tight spaces */
  compact?: boolean;
}

/**
 * Reusable pagination control.
 * Renders previous/next arrows and up to 7 page buttons with ellipsis.
 */
const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange, compact = false }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [1];

    if (page > 3) pages.push('...');

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (page < totalPages - 2) pages.push('...');

    pages.push(totalPages);
    return pages;
  };

  const btnBase = 'inline-flex items-center justify-center text-sm font-medium transition-colors rounded-lg disabled:opacity-40 disabled:cursor-not-allowed';
  const size = compact ? 'h-8 min-w-[2rem] px-2' : 'h-9 min-w-[2.25rem] px-3';

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      {/* Previous */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={`${btnBase} ${size} text-gray-600 hover:bg-gray-100`}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        {!compact && <span className="ml-1 hidden sm:inline">Prev</span>}
      </button>

      {/* Page numbers */}
      {getPageNumbers().map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className={`${size} flex items-center justify-center text-gray-400`}>
            &hellip;
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${size} ${
              p === page
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={`${btnBase} ${size} text-gray-600 hover:bg-gray-100`}
        aria-label="Next page"
      >
        {!compact && <span className="mr-1 hidden sm:inline">Next</span>}
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
};

export default Pagination;
