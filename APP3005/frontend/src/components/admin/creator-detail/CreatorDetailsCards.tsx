import React, { memo } from 'react';
import { User, Phone, Store, Clock, TrendingUp, Layers, Info } from 'lucide-react';
import { CreatorDetail } from '@/api/admin-creators.api';
import { typography } from '@/constants/theme';

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

export const CreatorDetailsCards = memo<Props>(({ detail }) => {
  const cards = [
    { icon: User, label: 'Email', value: detail.user.email },
    { icon: Phone, label: 'Phone', value: detail.user.phone || 'Not Provided' },
    { icon: Store, label: 'Store Slug', value: `/@${detail.store_slug}` },
    { icon: Clock, label: 'Joined', value: formatDate(detail.created_at) },
    { icon: TrendingUp, label: 'Last Login', value: formatDate(detail.user.last_login) },
    {
      icon: Layers,
      label: 'Upload Limit',
      value: detail.limits
        ? `${detail.limits.max_products} (Max images: ${detail.limits.max_images_per_product})`
        : 'Default (30 / 20)',
    },
  ];

  return (
    <div className="space-y-6 mt-6">
      <h3 className="text-lg font-bold text-neutral-200" style={{ fontFamily: typography.fontSerif }}>
        Creator Information
      </h3>

      {detail.about && (
        <div className="bg-black/20 rounded-xl border border-white/10 p-5 flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-neutral-500" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1 font-semibold uppercase tracking-wider">About</p>
            <p className="text-sm text-neutral-300 leading-relaxed">{detail.about}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-black/20 rounded-xl border border-white/10 p-5 flex items-center gap-4 hover:border-[#D4AF37]/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
              <card.icon className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500 mb-0.5 font-semibold uppercase tracking-wider">{card.label}</p>
              <p className="text-sm text-neutral-200 font-medium truncate">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
CreatorDetailsCards.displayName = 'CreatorDetailsCards';
