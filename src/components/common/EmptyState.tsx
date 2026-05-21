import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateAction {
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  compact?: boolean;
}

/**
 * A professional empty state component for pages/sections with no data.
 * Supports primary/secondary actions, icons, and compact mode.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actions = [],
  compact = false,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10 px-4' : 'py-20 px-6'}`}>
      {/* Decorative icon container */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/5 rounded-full scale-150 blur-xl" />
        <div className={`relative bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/10 rounded-2xl ${compact ? 'p-4' : 'p-6'}`}>
          <Icon className={`text-primary/70 ${compact ? 'h-8 w-8' : 'h-10 w-10'}`} strokeWidth={1.5} />
        </div>
      </div>

      {/* Text */}
      <h3 className={`font-display font-semibold text-gray-900 mb-2 ${compact ? 'text-lg' : 'text-xl'}`}>
        {title}
      </h3>
      <p className={`text-gray-500 max-w-md leading-relaxed ${compact ? 'text-sm mb-5' : 'text-base mb-8'}`}>
        {description}
      </p>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actions.map((action, i) => {
            const isPrimary = action.variant !== 'secondary';
            const classes = isPrimary
              ? 'bg-primary hover:bg-primary-dark text-white shadow-sm'
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm';

            const content = (
              <>
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </>
            );

            if (action.to) {
              return (
                <Link
                  key={i}
                  to={action.to}
                  className={`inline-flex items-center px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${classes}`}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={i}
                onClick={action.onClick}
                className={`inline-flex items-center px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${classes}`}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
