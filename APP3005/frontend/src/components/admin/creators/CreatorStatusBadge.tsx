import React from 'react';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import { cn } from '@/utils/cn';

interface CreatorStatusBadgeProps {
  isActive: boolean;
  size?: 'sm' | 'md';
}

/**
 * CreatorStatusBadge – Shows Active / Inactive state with icon
 */
export const CreatorStatusBadge: React.FC<CreatorStatusBadgeProps> = ({
  isActive,
  size = 'md',
}) => {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  if (isActive) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-semibold',
          'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
          sizeClass,
        )}
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        Active
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        'bg-red-500/15 text-red-400 border border-red-500/30',
        sizeClass,
      )}
    >
      <ShieldOff className="w-3.5 h-3.5" />
      Inactive
    </span>
  );
};
