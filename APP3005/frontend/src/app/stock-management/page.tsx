import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Layers,
  Package,
  Palette,
  RefreshCw,
  Save,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import LuxeSidebar from "../../components/common/LuxeSidebar";
import { creatorNavLinks } from "@/components/creator/creatorNavLinks";
import { LuxeColors } from "../../lib/luxe-theme";
import {
  fetchCreatorStockManagement,
  updateSizeStock,
  type StockLabel,
  type StockProduct,
} from "../../api/creator-stock.api";

// ── Helpers ──────────────────────────────────────────────────────────────────

const CLOTHING_COLOR_HEX: Record<string, string> = {
  BLACK: "#1a1a1a",
  WHITE: "#f8f8f8",
  GREY: "#9e9e9e",
  CHARCOAL: "#3c3c3c",
  NAVY: "#1a2a5e",
  ROYAL_BLUE: "#2952c0",
  SKY_BLUE: "#88c9e8",
  TEAL: "#008080",
  GREEN: "#2e7d32",
  OLIVE_GREEN: "#6b7c3a",
  MINT: "#98d8c8",
  RED: "#c62828",
  MAROON: "#6a0032",
  PINK: "#f48fb1",
  HOT_PINK: "#e91e8c",
  CORAL: "#ff6b6b",
  ORANGE: "#f57c00",
  YELLOW: "#f9c41a",
  GOLD: "#d4af37",
  BEIGE: "#f5e6d3",
  CREAM: "#fffdd0",
  BROWN: "#795548",
  CHOCOLATE: "#4e342e",
  CARAMEL: "#c5884f",
  LAVENDER: "#c7b8e8",
  PURPLE: "#6a1b9a",
  INDIGO: "#303f9f",
  RUST: "#b84a2c",
  OFF_WHITE: "#f0ede5",
  MULTI_COLOR: "linear-gradient(135deg,#f00,#0f0,#00f)",
  PRINTED: "linear-gradient(135deg,#d4af37,#c62828,#2e7d32)",
  OTHER: "#aaa",
};

function getColorHex(color: string, hex_code?: string | null): string {
  if (hex_code) return hex_code;
  return CLOTHING_COLOR_HEX[color] ?? "#888";
}

function formatColorLabel(color: string): string {
  return color
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface StockBadgeProps {
  label: StockLabel;
  count?: number;
  size?: "sm" | "md";
}
const StockBadge: React.FC<StockBadgeProps> = ({
  label,
  count,
  size = "md",
}) => {
  const isSmall = size === "sm";
  const cfg = {
    OUT_OF_STOCK: {
      cls: "bg-red-500/15 text-red-400 border-red-500/30",
      icon: <AlertTriangle size={isSmall ? 10 : 12} className="shrink-0" />,
      text: count !== undefined ? `${count} · Out of Stock` : "Out of Stock",
    },
    LOW: {
      cls: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      icon: <AlertTriangle size={isSmall ? 10 : 12} className="shrink-0" />,
      text: count !== undefined ? `${count} · Low Stock` : "Low Stock",
    },
    OK: {
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      icon: <CheckCircle2 size={isSmall ? 10 : 12} className="shrink-0" />,
      text: count !== undefined ? `${count} · In Stock` : "In Stock",
    },
  }[label];

  return (
    <span
      className={`inline-flex items-center gap-1 border rounded-full font-semibold tracking-wide ${cfg.cls} ${isSmall ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"}`}
    >
      {cfg.icon}
      {cfg.text}
    </span>
  );
};

interface StatusBadgeProps {
  status: StockProduct["status"];
}
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cfg: Record<string, string> = {
    Active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Draft: "bg-stone-500/15 text-stone-400 border-stone-500/30",
    Pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 border rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${cfg[status] ?? cfg.Draft}`}
    >
      {status}
    </span>
  );
};

// ── Inline editable stock cell ────────────────────────────────────────────────

interface EditableStockCellProps {
  variantId: string;
  size: string;
  initialStock: number;
  onSuccess: (variantId: string, size: string, newStock: number, productInventory: number) => void;
}

const EditableStockCell: React.FC<EditableStockCellProps> = ({
  variantId,
  size,
  initialStock,
  onSuccess,
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(initialStock));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync when parent data refreshes
  useEffect(() => {
    if (!editing) setValue(String(initialStock));
  }, [initialStock, editing]);

  const startEdit = () => {
    setEditing(true);
    setError(null);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const cancel = () => {
    setEditing(false);
    setValue(String(initialStock));
    setError(null);
  };

  const save = useCallback(async () => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) {
      setError("Must be ≥ 0");
      return;
    }
    if (parsed === initialStock) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await updateSizeStock(variantId, size, parsed);
      onSuccess(variantId, size, res.stock, res.product_inventory_count);
      setEditing(false);
    } catch (err: any) {
      setError(err?.message ?? "Update failed");
      setValue(String(initialStock)); // rollback
    } finally {
      setSaving(false);
    }
  }, [value, initialStock, variantId, size, onSuccess]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  };

  const stockLabel: StockLabel =
    initialStock === 0 ? "OUT_OF_STOCK" : initialStock <= 10 ? "LOW" : "OK";

  if (!editing) {
    return (
      <div className="flex items-center gap-2 group/cell">
        <StockBadge label={stockLabel} count={initialStock} size="sm" />
        <button
          id={`edit-stock-${variantId}-${size}`}
          onClick={startEdit}
          className="opacity-0 group-hover/cell:opacity-100 transition-opacity p-1 rounded text-stone-500 hover:text-luxury-gold hover:bg-luxury-gold/10"
          title="Edit stock"
          aria-label={`Edit stock for size ${size}`}
        >
          <Edit2 size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          id={`stock-input-${variantId}-${size}`}
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={save}
          disabled={saving}
          className="w-20 px-2 py-1 text-xs rounded border border-luxury-gold/40 bg-stone-900 text-stone-100 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/30 disabled:opacity-50"
          aria-label={`Stock quantity for size ${size}`}
        />
        {saving ? (
          <RefreshCw size={13} className="text-luxury-gold animate-spin" />
        ) : (
          <>
            <button
              onClick={save}
              className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10"
              title="Save"
              aria-label="Save stock"
            >
              <Save size={13} />
            </button>
            <button
              onClick={cancel}
              className="p-1 rounded text-stone-500 hover:bg-red-500/10 hover:text-red-400"
              title="Cancel"
              aria-label="Cancel edit"
            >
              <X size={13} />
            </button>
          </>
        )}
      </div>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
};

// ── Skeleton loader ───────────────────────────────────────────────────────────

const SkeletonRow: React.FC = () => (
  <div className="animate-pulse rounded-2xl border border-stone-800 bg-stone-900/50 p-4 flex items-center gap-4">
    <div className="w-14 h-14 rounded-lg bg-stone-800 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-1/3 rounded bg-stone-800" />
      <div className="h-3 w-1/4 rounded bg-stone-800" />
    </div>
    <div className="h-6 w-20 rounded-full bg-stone-800" />
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

type LocalProducts = StockProduct[];

const StockManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { sidebarWidth, isMobile } = useSidebar();
  const navigate = useNavigate();

  const [products, setProducts] = useState<LocalProducts>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const sidebarUser = user
    ? {
        name: (user as any).store_name || user.email || "Creator",
        avatar:
          (user as any).avatar ||
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
        role: user.role || "Creator",
      }
    : {
        name: "Loading…",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
        role: "Creator",
      };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await fetchCreatorStockManagement();
      setProducts(data);
    } catch (err: any) {
      setFetchError(err?.message ?? "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const toggleExpand = (productId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  /** Optimistically update the local stock value after a successful PATCH */
  const handleStockUpdate = useCallback(
    (variantId: string, size: string, newStock: number, productInventory: number) => {
      setProducts((prev) =>
        prev.map((product) => {
          const hasVariant = product.patterns.some((pat) =>
            pat.color_variants.some((cv) => cv.variant_id === variantId),
          );
          if (!hasVariant) return product;

          const newPatterns = product.patterns.map((pat) => ({
            ...pat,
            color_variants: pat.color_variants.map((cv) => {
              if (cv.variant_id !== variantId) return cv;
              const newSizeStocks = cv.size_stocks.map((ss) =>
                ss.size === size
                  ? {
                      ...ss,
                      stock: newStock,
                      stock_label: (
                        newStock === 0
                          ? "OUT_OF_STOCK"
                          : newStock <= 10
                            ? "LOW"
                            : "OK"
                      ) as StockLabel,
                    }
                  : ss,
              );
              const variantStock = newSizeStocks.reduce(
                (s, ss) => s + ss.stock,
                0,
              );
              return {
                ...cv,
                size_stocks: newSizeStocks,
                total_stock: variantStock,
                stock_label: (
                  variantStock === 0
                    ? "OUT_OF_STOCK"
                    : variantStock <= 10
                      ? "LOW"
                      : "OK"
                ) as StockLabel,
              };
            }),
          }));

          return {
            ...product,
            inventory_count: productInventory,
            total_stock: productInventory,
            stock_label: (
              productInventory === 0
                ? "OUT_OF_STOCK"
                : productInventory <= 10
                  ? "LOW"
                  : "OK"
            ) as StockLabel,
            patterns: newPatterns,
          };
        }),
      );
    },
    [],
  );

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderPatterns = (product: StockProduct) => {
    if (!product.patterns || product.patterns.length === 0) {
      // Legacy product with no hierarchy
      return (
        <div className="mt-4 px-4 pb-4">
          <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-4 text-center text-stone-500 text-sm">
            <Package size={20} className="mx-auto mb-2 text-stone-600" />
            No size variants configured — total inventory:{" "}
            <span className="text-stone-300 font-semibold">
              {product.inventory_count}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-1 px-4 pb-4 space-y-4">
        {product.patterns.map((pattern) => (
          <div
            key={pattern.pattern_id}
            className="rounded-xl border border-stone-800/70 bg-stone-950/40 overflow-hidden"
          >
            {/* Pattern header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-800/50 bg-stone-900/30">
              <Layers size={14} className="text-luxury-gold shrink-0" />
              <span className="font-semibold text-stone-200 text-sm">
                {pattern.name || "Pattern"}
              </span>
              {pattern.body_shapes && pattern.body_shapes.length > 0 && (
                <div className="flex flex-wrap gap-1 ml-auto">
                  {pattern.body_shapes.map((shape) => (
                    <span
                      key={shape}
                      className="px-1.5 py-0.5 rounded-md bg-luxury-gold/10 text-luxury-gold text-[10px] font-medium border border-luxury-gold/20"
                    >
                      {String(shape)
                        .toLowerCase()
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Color variants */}
            <div className="divide-y divide-stone-800/40">
              {pattern.color_variants.length === 0 ? (
                <p className="px-4 py-3 text-sm text-stone-500">
                  No colour variants
                </p>
              ) : (
                pattern.color_variants.map((variant) => (
                  <div key={variant.variant_id} className="p-4">
                    {/* Variant header */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <Palette size={13} className="text-stone-400 shrink-0" />
                      {/* Color swatch */}
                      <div
                        className="w-5 h-5 rounded-full border border-stone-600 shrink-0"
                        style={{
                          background: getColorHex(
                            variant.color,
                            variant.hex_code,
                          ),
                        }}
                        aria-label={`Colour swatch: ${formatColorLabel(variant.color)}`}
                      />
                      <span className="text-stone-200 text-sm font-medium">
                        {formatColorLabel(variant.color)}
                      </span>
                      {variant.hex_code && (
                        <span className="text-[10px] text-stone-500 font-mono">
                          {variant.hex_code}
                        </span>
                      )}
                      <div className="ml-auto">
                        <StockBadge
                          label={variant.stock_label}
                          count={variant.total_stock}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* Size-stock table */}
                    {variant.size_stocks.length === 0 ? (
                      <p className="text-xs text-stone-500 ml-6">
                        No sizes configured
                      </p>
                    ) : (
                      <div className="ml-6 overflow-x-auto">
                        <table className="w-full text-xs min-w-[300px]">
                          <thead>
                            <tr className="border-b border-stone-800/60">
                              <th className="text-left pb-2 text-stone-500 font-medium w-16">
                                <Tag
                                  size={10}
                                  className="inline mr-1 mb-0.5"
                                />
                                Size
                              </th>
                              <th className="text-left pb-2 text-stone-500 font-medium">
                                Stock
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {variant.size_stocks.map((ss) => (
                              <tr
                                key={ss.size_stock_id}
                                className="border-b border-stone-800/30 last:border-0"
                              >
                                <td className="py-2 pr-4 text-stone-300 font-mono font-semibold">
                                  {ss.size}
                                </td>
                                <td className="py-2">
                                  <EditableStockCell
                                    variantId={variant.variant_id}
                                    size={ss.size}
                                    initialStock={ss.stock}
                                    onSuccess={handleStockUpdate}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── Full render ─────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex overflow-x-hidden"
      style={{ background: LuxeColors.background }}
    >
      <LuxeSidebar user={sidebarUser} navLinks={creatorNavLinks} />

      <div
        className="flex-1 min-w-0 transition-all duration-300 ease-in-out"
        style={{ marginLeft: isMobile ? "0px" : sidebarWidth }}
      >
        <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 max-w-5xl mx-auto">

          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-100 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-luxury-gold/10 border border-luxury-gold/20">
                  <Package size={22} className="text-luxury-gold" />
                </div>
                Stock Management
              </h1>
              <p className="text-stone-500 text-sm mt-1.5 ml-12 sm:ml-14">
                View and update stock levels for all your uploaded products
              </p>
            </div>
            <button
              id="refresh-stock"
              onClick={loadProducts}
              disabled={loading}
              className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-700 text-stone-400 hover:border-luxury-gold/40 hover:text-luxury-gold hover:bg-luxury-gold/5 transition-all text-sm font-medium disabled:opacity-50"
              aria-label="Refresh stock data"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* Error state */}
          {fetchError && !loading && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 mb-6 text-red-400">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Failed to load stock data</p>
                <p className="text-xs mt-0.5 text-red-400/70">{fetchError}</p>
              </div>
              <button
                onClick={loadProducts}
                className="ml-auto text-xs underline underline-offset-2 hover:text-red-300"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !fetchError && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 mb-6">
                <Package size={40} className="text-stone-600" />
              </div>
              <h2 className="text-stone-300 font-semibold text-lg mb-2">
                No products yet
              </h2>
              <p className="text-stone-500 text-sm mb-6 max-w-sm">
                Upload your first product and its stock will appear here for
                easy management.
              </p>
              <button
                id="go-to-upload"
                onClick={() => navigate("/creator-upload")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-luxury-gold text-stone-950 font-semibold text-sm hover:bg-luxury-gold/90 transition-colors"
              >
                <Upload size={15} />
                Upload Product
              </button>
            </div>
          )}

          {/* Product list */}
          {!loading && products.length > 0 && (
            <div className="space-y-3">
              {products.map((product) => {
                const isOpen = expandedIds.has(product.product_id);
                return (
                  <div
                    key={product.product_id}
                    className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden transition-all hover:border-stone-700"
                    id={`product-row-${product.product_id}`}
                  >
                    {/* Clickable product row */}
                    <button
                      className="w-full text-left p-4 flex items-center gap-4 hover:bg-stone-800/30 transition-colors"
                      onClick={() => toggleExpand(product.product_id)}
                      aria-expanded={isOpen}
                      aria-controls={`product-detail-${product.product_id}`}
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-stone-800 shrink-0 border border-stone-700">
                        {product.primary_image ? (
                          <img
                            src={product.primary_image}
                            alt={product.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={20} className="text-stone-600" />
                          </div>
                        )}
                      </div>

                      {/* Title + meta */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-100 text-sm sm:text-base truncate">
                          {product.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <StatusBadge status={product.status} />
                          {product.category_name && (
                            <span className="text-stone-500 text-xs">
                              {product.category_name}
                              {product.sub_category_name
                                ? ` · ${product.sub_category_name}`
                                : ""}
                            </span>
                          )}
                          <span className="text-stone-600 text-xs">
                            {formatPrice(product.price_cents, product.currency)}
                          </span>
                        </div>
                      </div>

                      {/* Stock badge + expand chevron */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:block">
                          <StockBadge
                            label={product.stock_label}
                            count={product.total_stock}
                          />
                        </div>
                        <div className="sm:hidden">
                          <StockBadge
                            label={product.stock_label}
                            size="sm"
                          />
                        </div>
                        {isOpen ? (
                          <ChevronUp
                            size={18}
                            className="text-stone-500 shrink-0"
                          />
                        ) : (
                          <ChevronDown
                            size={18}
                            className="text-stone-500 shrink-0"
                          />
                        )}
                      </div>
                    </button>

                    {/* Expandable pattern / variant / stock tree */}
                    {isOpen && (
                      <div
                        id={`product-detail-${product.product_id}`}
                        className="border-t border-stone-800/60"
                      >
                        {renderPatterns(product)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockManagementPage;
