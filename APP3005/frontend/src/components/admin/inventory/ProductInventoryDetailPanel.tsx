import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { useUpdateProductStock, useProductStockDetails } from '@/hooks/useAdminInventory';
import {
  Loader2,
  Package,
  Boxes,
  AlertTriangle,
  CheckCircle,
  PackageX,
  PackageOpen,
  Settings2,
  Pencil,
  X,
  ZoomIn,
  Check,
} from 'lucide-react';
import { CLOTHING_COLORS } from '@/constants/product-hierarchy.enums';
import { INVENTORY_SIZES } from '@/constants/inventory'; // used for sort order only
import { InventoryImageLightbox, type LightboxImage } from './InventoryImageLightbox';

interface ProductInventoryDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    product_id: string;
    title: string;
    thumbnail?: string | null;
    stock_label?: string;
    stock_label_override?: string | null;
    creator?: { store_name?: string };
  } | null;
}

const STATUS_CONFIGS: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  OUT_OF_STOCK: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: PackageX },
  LOW: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: AlertTriangle },
  OK: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: CheckCircle },
  HIGH: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: PackageOpen },
};

function StockStatusBadge({ label, isOverride }: { label: string; isOverride?: boolean }) {
  const config = STATUS_CONFIGS[label] || STATUS_CONFIGS.OK;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${config.bg} ${config.color} ${config.border}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label.replace('_', ' ')}
      {isOverride && <Settings2 className="w-3 h-3 opacity-70" />}
    </span>
  );
}

function getColorHex(color: string, hexCode?: string | null) {
  if (hexCode) return hexCode;
  return CLOTHING_COLORS.find((c) => c.value === color)?.hex ?? '#9E9E9E';
}

function formatColorLabel(color: string) {
  return CLOTHING_COLORS.find((c) => c.value === color)?.label ?? color.replace(/_/g, ' ');
}

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ia = INVENTORY_SIZES.indexOf(a as (typeof INVENTORY_SIZES)[number]);
    const ib = INVENTORY_SIZES.indexOf(b as (typeof INVENTORY_SIZES)[number]);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

/** Sizes configured for this colour (from creator upload) — admin cannot add/remove */
function configuredSizesForVariant(variant: ColorVariant): string[] {
  return sortSizes((variant.size_stocks ?? []).map((ss) => ss.size));
}

function buildStockDrafts(
  variants: ColorVariant[],
  stock: Record<string, Record<string, number>>,
): Record<string, Record<string, string>> {
  const drafts: Record<string, Record<string, string>> = {};
  for (const variant of variants) {
    const vid = variant.variant_id;
    drafts[vid] = {};
    for (const sz of configuredSizesForVariant(variant)) {
      const q = stock[vid]?.[sz] ?? 0;
      drafts[vid][sz] = String(q);
    }
  }
  return drafts;
}

function commitDraftsToStock(
  variants: ColorVariant[],
  drafts: Record<string, Record<string, string>>,
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const variant of variants) {
    const vid = variant.variant_id;
    result[vid] = {};
    for (const sz of configuredSizesForVariant(variant)) {
      const raw = (drafts[vid]?.[sz] ?? '0').trim();
      const n = raw === '' ? 0 : parseInt(raw, 10);
      result[vid][sz] = Number.isNaN(n) || n < 0 ? 0 : n;
    }
  }
  return result;
}

function sumStock(stock: Record<string, Record<string, number>>): number {
  return Object.values(stock).reduce(
    (sum, d) => sum + Object.values(d).reduce((s, v) => s + v, 0),
    0,
  );
}

type ColorVariant = {
  variant_id: string;
  color: string;
  hex_code?: string | null;
  thumbnail?: string | null;
  images?: { url: string }[];
  size_stocks?: { size: string; stock: number }[];
  fitName?: string;
};

/** Flatten patterns → colour list */
function flattenColorVariants(patterns: any[]): ColorVariant[] {
  const list: ColorVariant[] = [];
  for (const pattern of patterns ?? []) {
    for (const v of pattern.color_variants ?? []) {
      list.push({
        ...v,
        fitName: patterns.length > 1 ? pattern.name || 'Standard' : undefined,
      });
    }
  }
  return list;
}

export const ProductInventoryDetailPanel: React.FC<ProductInventoryDetailPanelProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const updateStock = useUpdateProductStock();
  const { data: details, isLoading, isFetching } = useProductStockDetails(
    isOpen && product ? product.product_id : null,
  );

  const [variantsStock, setVariantsStock] = useState<Record<string, Record<string, number>>>({});
  const [savedSnapshot, setSavedSnapshot] = useState<Record<string, Record<string, number>>>({});
  const [lightbox, setLightbox] = useState<{
    images: LightboxImage[];
    index: number;
  } | null>(null);
  const [stockDrafts, setStockDrafts] = useState<Record<string, Record<string, string>>>({});
  const [editingCell, setEditingCell] = useState<{ variantId: string; size: string } | null>(null);

  const colorVariants = useMemo(
    () => flattenColorVariants(details?.patterns ?? []),
    [details],
  );

  useEffect(() => {
    if (product) setEditingCell(null);
  }, [product]);

  useEffect(() => {
    if (!isOpen) {
      setLightbox(null);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const buildStockMap = (patterns: any[]) => {
    const stockMap: Record<string, Record<string, number>> = {};
    for (const pattern of patterns) {
      for (const variant of pattern.color_variants) {
        stockMap[variant.variant_id] = {};
        for (const ss of variant.size_stocks ?? []) {
          stockMap[variant.variant_id][ss.size] = ss.stock;
        }
      }
    }
    return stockMap;
  };

  useEffect(() => {
    if (!details?.patterns || editingCell) return;
    const map = buildStockMap(details.patterns);
    setVariantsStock(map);
    setSavedSnapshot(JSON.parse(JSON.stringify(map)));
    setStockDrafts(buildStockDrafts(flattenColorVariants(details.patterns), map));
  }, [details, editingCell]);

  const liveTotalStock = useMemo(() => sumStock(variantsStock), [variantsStock]);

  const startEditCell = (variantId: string, size: string) => {
    setStockDrafts(buildStockDrafts(colorVariants, variantsStock));
    setEditingCell({ variantId, size });
  };

  const cancelEditCell = () => {
    setStockDrafts(buildStockDrafts(colorVariants, variantsStock));
    setEditingCell(null);
  };

  const updateDraft = (variantId: string, size: string, raw: string) => {
    if (raw !== '' && !/^\d+$/.test(raw)) return;
    setStockDrafts((prev) => ({
      ...prev,
      [variantId]: { ...prev[variantId], [size]: raw },
    }));
  };

  const liveStockLabel = useMemo(() => {
    const override = product?.stock_label_override;
    if (override) return override;
    if (liveTotalStock === 0) return 'OUT_OF_STOCK';
    if (liveTotalStock <= 20) return 'LOW';
    if (liveTotalStock >= 80) return 'HIGH';
    return 'OK';
  }, [liveTotalStock, product?.stock_label_override]);

  const saveStock = (drafts = stockDrafts) => {
    if (!product) return;

    const committed = commitDraftsToStock(colorVariants, drafts);
    const total = sumStock(committed);

    const payloadVariants = colorVariants
      .filter((v) => configuredSizesForVariant(v).length > 0)
      .map((variant) => ({
        variant_id: variant.variant_id,
        size_stocks: configuredSizesForVariant(variant).map((size) => ({
          size,
          stock: committed[variant.variant_id]?.[size] ?? 0,
        })),
      }));

    updateStock.mutate(
      {
        productId: product.product_id,
        data: {
          inventory_count: total,
          variants: payloadVariants,
        },
      },
      {
        onSuccess: () => {
          setVariantsStock(committed);
          setSavedSnapshot(JSON.parse(JSON.stringify(committed)));
          setStockDrafts(buildStockDrafts(colorVariants, committed));
          setEditingCell(null);
        },
      },
    );
  };

  const saveEditCell = () => {
    saveStock(stockDrafts);
  };

  const getVariantImages = (variant: ColorVariant): LightboxImage[] => {
    const imgs: LightboxImage[] = (variant.images ?? [])
      .filter((i) => i?.url)
      .map((i) => ({ url: i.url, label: formatColorLabel(variant.color) }));
    if (!imgs.length && variant.thumbnail) {
      imgs.push({ url: variant.thumbnail, label: formatColorLabel(variant.color) });
    }
    return imgs;
  };

  if (!isOpen || !product) return null;

  return createPortal(
    <>
      {lightbox && (
        <InventoryImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      <div
        className="fixed inset-0 bg-black/60 z-[100]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed inset-y-0 right-0 z-[101] flex h-screen w-full max-w-lg flex-col border-l border-white/10 bg-neutral-950 text-neutral-100 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-start justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2
              id="inventory-drawer-title"
              className="text-[#D4AF37] text-lg font-semibold flex items-center gap-2"
            >
              <Package className="w-5 h-5" />
              Product Inventory
            </h2>
            <p className="text-neutral-400 text-sm mt-1">Colours → sizes → stock</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-neutral-800 border border-white/20 text-white hover:bg-neutral-700 transition-colors"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#D4AF37]" size={32} />
          </div>
        ) : (
          <>
            {/* Product summary */}
            <div className="shrink-0 px-5 py-4 border-b border-white/10">
              <h3 className="font-bold text-white text-base leading-snug">{product?.title}</h3>
              {product?.creator?.store_name && (
                <p className="text-sm text-neutral-400 mt-0.5">{product.creator.store_name}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <StockStatusBadge label={liveStockLabel} isOverride={!!product?.stock_label_override} />
                <span className="text-sm font-bold text-[#D4AF37] flex items-center gap-1">
                  <Boxes className="w-4 h-4" />
                  {liveTotalStock} total units
                </span>
                {isFetching && <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />}
              </div>

            </div>

            {/* Colour list */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-6">
              {colorVariants.length === 0 && (
                <p className="text-center text-neutral-500 py-8">No colours found.</p>
              )}

              {colorVariants.map((variant) => {
                const hex = getColorHex(variant.color, variant.hex_code);
                const localSizes = variantsStock[variant.variant_id] ?? {};
                const configuredSizes = configuredSizesForVariant(variant);
                const variantTotal = Object.values(localSizes).reduce((s, v) => s + v, 0);
                const images = getVariantImages(variant);

                return (
                  <section
                    key={variant.variant_id}
                    className="rounded-2xl border border-white/10 bg-neutral-900/80 overflow-hidden"
                  >
                    {/* Colour header + image */}
                    <div className="p-4 flex gap-4 border-b border-white/10">
                      <div className="w-28 h-36 shrink-0">
                        {images.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setLightbox({ images, index: 0 })
                            }
                            className="group relative w-28 h-36 rounded-xl overflow-hidden border-2 border-white/15 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                          >
                            <img
                              src={images[0].url}
                              alt={formatColorLabel(variant.color)}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ZoomIn className="w-6 h-6 text-white" />
                            </span>
                          </button>
                        ) : (
                          <div
                            className="w-28 h-36 rounded-xl border border-white/10"
                            style={{ backgroundColor: hex }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="w-5 h-5 rounded-full border-2 border-white/30 shrink-0"
                            style={{ backgroundColor: hex }}
                          />
                          <h4 className="text-lg font-bold text-white">
                            {formatColorLabel(variant.color)}
                          </h4>
                        </div>
                        {variant.fitName && (
                          <p className="text-xs text-neutral-500 mb-2">Fit: {variant.fitName}</p>
                        )}
                        <p className="text-sm font-semibold text-[#D4AF37]">
                          {variantTotal} units in stock
                        </p>
                        {images.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setLightbox({ images, index: 0 })}
                            className="mt-2 text-xs font-semibold text-neutral-400 hover:text-[#D4AF37] text-left"
                          >
                            Tap image to view full size
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sizes — only sizes with stock (or editable set) */}
                    <div className="px-4 py-3">
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                        Sizes & stock
                      </p>

                      {configuredSizes.length === 0 && (
                        <p className="text-sm text-neutral-500 py-2">
                          No sizes configured for this colour (set by creator).
                        </p>
                      )}

                      {configuredSizes.length > 0 && (
                        <div className="rounded-xl overflow-hidden border border-white/10 divide-y divide-white/10">
                          {configuredSizes.map((size) => {
                            const qty = localSizes[size] ?? 0;
                            const isRowEditing =
                              editingCell?.variantId === variant.variant_id &&
                              editingCell?.size === size;
                            const draftVal = stockDrafts[variant.variant_id]?.[size] ?? String(qty);

                            return (
                              <div
                                key={size}
                                className={`flex items-center gap-2 px-4 py-3 ${
                                  isRowEditing ? 'bg-[#D4AF37]/10' : 'bg-neutral-950/50'
                                }`}
                              >
                                <span className="w-10 shrink-0 text-sm font-bold text-white">
                                  {size}
                                </span>
                                <span className="text-neutral-600 shrink-0">—</span>

                                {isRowEditing ? (
                                  <>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={draftVal}
                                      onChange={(e) =>
                                        updateDraft(variant.variant_id, size, e.target.value)
                                      }
                                      className="flex-1 min-w-0 h-9 px-3 text-base font-bold text-neutral-900 bg-white border-2 border-[#D4AF37] rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                                      autoComplete="off"
                                      autoFocus
                                    />
                                    <span className="text-xs text-neutral-400 shrink-0">units</span>
                                    <button
                                      type="button"
                                      onClick={saveEditCell}
                                      disabled={updateStock.isPending}
                                      className="p-2 rounded-lg bg-[#D4AF37] text-neutral-950 hover:bg-[#F4D03F] disabled:opacity-50"
                                      aria-label="Save stock"
                                    >
                                      {updateStock.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelEditCell}
                                      className="p-2 rounded-lg bg-neutral-800 border border-white/20 text-white hover:bg-neutral-700"
                                      aria-label="Cancel"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span
                                      className={`flex-1 text-base font-bold tabular-nums ${
                                        qty > 0 ? 'text-white' : 'text-neutral-500'
                                      }`}
                                    >
                                      {qty}{' '}
                                      <span className="text-sm font-medium text-neutral-400">units</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => startEditCell(variant.variant_id, size)}
                                      disabled={!!editingCell}
                                      className="p-2 rounded-lg text-[#D4AF37] hover:bg-[#D4AF37]/15 border border-transparent hover:border-[#D4AF37]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                      aria-label={`Edit stock for size ${size}`}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="shrink-0 border-t border-white/10 bg-neutral-950 px-5 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full h-10 border-white/30 bg-neutral-800 text-white hover:bg-neutral-700"
              >
                Close panel
              </Button>
            </div>
          </>
        )}
      </div>
    </>,
    document.body,
  );
};
