import React, { memo } from 'react';
import { User, Phone, Store, Clock, TrendingUp, Layers } from 'lucide-react';
import { CreatorDetail } from '@/api/admin-creators.api';

interface Props {
  detail: CreatorDetail;
}

const formatDate = (date: string | null | undefined) =>
  date
    ? new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

export const CreatorInfoPanel = memo<Props>(({ detail }) => {
  const rows = [
    { icon: User, label: 'Email', value: detail.user.email },
    { icon: Phone, label: 'Phone', value: detail.user.phone || 'Not Provided' },
    { icon: Store, label: 'Store Slug', value: `/@${detail.store_slug}` },
    { icon: Clock, label: 'Joined', value: formatDate(detail.created_at) },
    { icon: TrendingUp, label: 'Last Login', value: formatDate(detail.user.last_login) },
    {
      icon: Layers,
      label: 'Upload Limit',
      value: detail.limits
        ? `${detail.limits.max_products} products / ${detail.limits.max_images_per_product} images each`
        : 'Default (30 / 20)',
    },
  ];

  return (
    <div className="bg-black/20 rounded-2xl border border-white/10 p-5 space-y-4 h-full">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-1">
        Creator Info
      </h3>

      {detail.about && (
        <p className="text-sm text-neutral-400 leading-relaxed pb-3 border-b border-white/5">
          {detail.about}
        </p>
      )}

      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
              <row.icon className="w-4 h-4 text-neutral-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">{row.label}</p>
              <p className="text-sm text-neutral-200 font-medium break-all">{row.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
CreatorInfoPanel.displayName = 'CreatorInfoPanel';
