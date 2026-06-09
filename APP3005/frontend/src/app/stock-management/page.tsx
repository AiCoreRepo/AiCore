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
import {
  fetchCreatorStockManagement,
  updateSizeStock,
  type StockLabel,
  type StockProduct,
} from "../../api/creator-stock.api";

// ── Color map for ClothingColor enum ─────────────────────────────────────────
const CLOTHING_COLOR_HEX: Record<string, string> = {
  BLACK: "#1a1a1a", WHITE: "#f8f8f8", GREY: "#9e9e9e", CHARCOAL: "#3c3c3c",
  NAVY: "#1a2a5e", ROYAL_BLUE: "#2952c0", SKY_BLUE: "#88c9e8", TEAL: "#008080",
  GREEN: "#2e7d32", OLIVE_GREEN: "#6b7c3a", MINT: "#98d8c8", RED: "#c62828",
  MAROON: "#6a0032", PINK: "#f48fb1", HOT_PINK: "#e91e8c", CORAL: "#ff6b6b",
  ORANGE: "#f57c00", YELLOW: "#f9c41a", GOLD: "#d4af37", BEIGE: "#f5e6d3",
  CREAM: "#fffdd0", BROWN: "#795548", CHOCOLATE: "#4e342e", CARAMEL: "#c5884f",
  LAVENDER: "#c7b8e8", PURPLE: "#6a1b9a", INDIGO: "#303f9f", RUST: "#b84a2c",
  OFF_WHITE: "#f0ede5", MULTI_COLOR: "#888", PRINTED: "#888", OTHER: "#aaa",
};

function getColorHex(color: string, hex_code?: string | null): string {
  if (hex_code) return hex_code;
  return CLOTHING_COLOR_HEX[color] ?? "#888";
}
function formatColorLabel(c: string) {
  return c.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

// ── Theme constants (matches app's warm gold palette) ─────────────────────────
const T = {
  bg: "linear-gradient(135deg, #FFF9E6 0%, #FFF4D6 25%, #FFE8B3 50%, #FFF4D6 75%, #FFF9E6 100%)",
  card: "#FFFFFF",
  cardBorder: "rgba(201,165,95,0.25)",
  cardShadow: "0 2px 12px rgba(201,165,95,0.1)",
  cardHover: "#FFFBF0",
  headerBg: "rgba(201,165,95,0.08)",
  headerBorder: "rgba(201,165,95,0.2)",
  gold: "#C9A75F",
  goldLight: "rgba(201,165,95,0.12)",
  goldBorder: "rgba(201,165,95,0.3)",
  text: "#2C2416",
  textMid: "#6B5A3E",
  textLight: "#9C8B6E",
  divider: "rgba(201,165,95,0.15)",
  patternBg: "#FFFBF2",
  patternBorder: "rgba(201,165,95,0.2)",
  tableBorder: "rgba(201,165,95,0.12)",
  inputBorder: "rgba(201,165,95,0.5)",
  inputFocus: "#C9A75F",
};

// ── Stock badge ───────────────────────────────────────────────────────────────
interface StockBadgeProps { label: StockLabel; count?: number; size?: "sm" | "md" }
const StockBadge: React.FC<StockBadgeProps> = ({ label, count, size = "md" }) => {
  const sm = size === "sm";
  const styles: Record<StockLabel, { bg: string; color: string; border: string; text: string }> = {
    OUT_OF_STOCK: { bg: "rgba(220,38,38,0.08)", color: "#DC2626", border: "rgba(220,38,38,0.25)", text: count !== undefined ? `${count} · Out of Stock` : "Out of Stock" },
    LOW:          { bg: "rgba(217,119,6,0.08)",  color: "#D97706", border: "rgba(217,119,6,0.25)",  text: count !== undefined ? `${count} · Low Stock`    : "Low Stock"    },
    OK:           { bg: "rgba(22,163,74,0.08)",   color: "#16A34A", border: "rgba(22,163,74,0.25)",   text: count !== undefined ? `${count} · In Stock`     : "In Stock"     },
  };
  const s = styles[label];
  const Icon = label === "OK" ? CheckCircle2 : AlertTriangle;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 999, fontWeight: 700, letterSpacing: "0.02em",
      padding: sm ? "2px 8px" : "4px 10px",
      fontSize: sm ? 10 : 11,
    }}>
      <Icon size={sm ? 10 : 11} style={{ flexShrink: 0 }} />
      {s.text}
    </span>
  );
};

// ── Status badge ──────────────────────────────────────────────────────────────
interface StatusBadgeProps { status: StockProduct["status"] }
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    Active:   { bg: "rgba(22,163,74,0.08)",   color: "#16A34A", border: "rgba(22,163,74,0.3)"   },
    Draft:    { bg: "rgba(107,114,128,0.1)",   color: "#6B7280", border: "rgba(107,114,128,0.3)" },
    Pending:  { bg: "rgba(217,119,6,0.08)",    color: "#D97706", border: "rgba(217,119,6,0.3)"   },
    Rejected: { bg: "rgba(220,38,38,0.08)",    color: "#DC2626", border: "rgba(220,38,38,0.3)"   },
  };
  const s = styles[status] ?? styles.Draft;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 999, fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
      textTransform: "uppercase", padding: "2px 8px",
    }}>
      {status}
    </span>
  );
};

// ── Inline editable stock cell ────────────────────────────────────────────────
interface EditableCellProps {
  variantId: string; size: string; initialStock: number;
  onSuccess: (variantId: string, size: string, newStock: number, inv: number) => void;
}
const EditableStockCell: React.FC<EditableCellProps> = ({ variantId, size, initialStock, onSuccess }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(initialStock));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!editing) setValue(String(initialStock)); }, [initialStock, editing]);

  const startEdit = () => { setEditing(true); setError(null); setTimeout(() => inputRef.current?.select(), 0); };
  const cancel = () => { setEditing(false); setValue(String(initialStock)); setError(null); };

  const save = useCallback(async () => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) { setError("Must be ≥ 0"); return; }
    if (parsed === initialStock) { setEditing(false); return; }
    setSaving(true); setError(null);
    try {
      const res = await updateSizeStock(variantId, size, parsed);
      onSuccess(variantId, size, res.stock, res.product_inventory_count);
      setEditing(false);
    } catch (err: any) {
      setError(err?.message ?? "Update failed");
      setValue(String(initialStock));
    } finally { setSaving(false); }
  }, [value, initialStock, variantId, size, onSuccess]);

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); };

  const stockLabel: StockLabel = initialStock === 0 ? "OUT_OF_STOCK" : initialStock <= 10 ? "LOW" : "OK";

  if (!editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="group/cell">
        <StockBadge label={stockLabel} count={initialStock} size="sm" />
        <button
          id={`edit-stock-${variantId}-${size}`}
          onClick={startEdit}
          title={`Edit stock for size ${size}`}
          aria-label={`Edit stock for size ${size}`}
          style={{
            opacity: 0, background: "transparent", border: "none", cursor: "pointer",
            padding: "3px 5px", borderRadius: 6, color: T.gold, transition: "all .15s",
            display: "flex", alignItems: "center",
          }}
          className="group-hover/cell:!opacity-100"
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.goldLight; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.opacity = "0"; }}
        >
          <Edit2 size={12} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          ref={inputRef}
          id={`stock-input-${variantId}-${size}`}
          type="number" min={0} value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={onKey} onBlur={save} disabled={saving}
          aria-label={`Stock quantity for size ${size}`}
          style={{
            width: 72, padding: "4px 8px", fontSize: 12, borderRadius: 8,
            border: `1.5px solid ${saving ? T.textLight : T.inputBorder}`,
            background: "#FFF9F0", color: T.text, outline: "none",
            boxShadow: `0 0 0 3px ${T.goldLight}`,
          }}
        />
        {saving ? (
          <RefreshCw size={13} style={{ color: T.gold, animation: "spin 1s linear infinite" }} />
        ) : (
          <>
            <button onClick={save} title="Save" aria-label="Save stock"
              style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.3)", borderRadius: 6, padding: "3px 5px", cursor: "pointer", color: "#16A34A", display: "flex" }}>
              <Save size={12} />
            </button>
            <button onClick={cancel} title="Cancel" aria-label="Cancel edit"
              style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "3px 5px", cursor: "pointer", color: "#DC2626", display: "flex" }}>
              <X size={12} />
            </button>
          </>
        )}
      </div>
      {error && <p style={{ fontSize: 10, color: "#DC2626", margin: 0 }}>{error}</p>}
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonRow: React.FC = () => (
  <div style={{
    background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16,
    padding: 16, display: "flex", alignItems: "center", gap: 14, animation: "pulse 1.5s ease-in-out infinite",
  }}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(201,165,95,0.15)", flexShrink: 0 }} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ height: 14, width: "35%", borderRadius: 6, background: "rgba(201,165,95,0.15)" }} />
      <div style={{ height: 11, width: "20%", borderRadius: 6, background: "rgba(201,165,95,0.1)" }} />
    </div>
    <div style={{ height: 22, width: 88, borderRadius: 999, background: "rgba(201,165,95,0.15)" }} />
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

  const sidebarUser = user ? {
    name: (user as any).store_name || user.email || "Creator",
    avatar: (user as any).avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    role: user.role || "Creator",
  } : {
    name: "Loading…",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    role: "Creator",
  };

  const loadProducts = useCallback(async () => {
    setLoading(true); setFetchError(null);
    try { setProducts(await fetchCreatorStockManagement()); }
    catch (err: any) { setFetchError(err?.message ?? "Failed to load products"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleStockUpdate = useCallback((variantId: string, size: string, newStock: number, productInventory: number) => {
    setProducts(prev => prev.map(product => {
      const hasVariant = product.patterns.some(p => p.color_variants.some(cv => cv.variant_id === variantId));
      if (!hasVariant) return product;
      const toLabel = (n: number): StockLabel => n === 0 ? "OUT_OF_STOCK" : n <= 10 ? "LOW" : "OK";
      return {
        ...product,
        inventory_count: productInventory, total_stock: productInventory,
        stock_label: toLabel(productInventory),
        patterns: product.patterns.map(pat => ({
          ...pat,
          color_variants: pat.color_variants.map(cv => {
            if (cv.variant_id !== variantId) return cv;
            const newSS = cv.size_stocks.map(ss => ss.size === size ? { ...ss, stock: newStock, stock_label: toLabel(newStock) } : ss);
            const vs = newSS.reduce((s, ss) => s + ss.stock, 0);
            return { ...cv, size_stocks: newSS, total_stock: vs, stock_label: toLabel(vs) };
          }),
        })),
      };
    }));
  }, []);

  // ── Render pattern tree ────────────────────────────────────────────────────
  const renderPatterns = (product: StockProduct) => {
    if (!product.patterns || product.patterns.length === 0) {
      return (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ background: T.patternBg, border: `1px solid ${T.patternBorder}`, borderRadius: 12, padding: 16, textAlign: "center" }}>
            <Package size={20} style={{ color: T.textLight, marginBottom: 6 }} />
            <p style={{ color: T.textMid, fontSize: 13, margin: 0 }}>
              No size variants configured — total inventory:{" "}
              <strong style={{ color: T.text }}>{product.inventory_count}</strong>
            </p>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {product.patterns.map(pattern => (
          <div key={pattern.pattern_id} style={{
            background: T.patternBg, border: `1px solid ${T.patternBorder}`, borderRadius: 14, overflow: "hidden",
          }}>
            {/* Pattern header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
              borderBottom: `1px solid ${T.divider}`, background: "rgba(201,165,95,0.06)",
              flexWrap: "wrap",
            }}>
              <Layers size={14} style={{ color: T.gold, flexShrink: 0 }} />
              <span style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>{pattern.name || "Pattern"}</span>
              {pattern.body_shapes?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginLeft: "auto" }}>
                  {pattern.body_shapes.map(shape => (
                    <span key={String(shape)} style={{
                      padding: "2px 8px", borderRadius: 6,
                      background: T.goldLight, color: T.gold,
                      fontSize: 10, fontWeight: 600,
                      border: `1px solid ${T.goldBorder}`,
                    }}>
                      {String(shape).toLowerCase().replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Color variants */}
            {pattern.color_variants.length === 0 ? (
              <p style={{ padding: "12px 16px", color: T.textLight, fontSize: 12, margin: 0 }}>No colour variants</p>
            ) : (
              pattern.color_variants.map((variant, vi) => (
                <div key={variant.variant_id} style={{
                  padding: 16,
                  borderBottom: vi < pattern.color_variants.length - 1 ? `1px solid ${T.divider}` : "none",
                }}>
                  {/* Variant header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                    <Palette size={13} style={{ color: T.textLight, flexShrink: 0 }} />
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: getColorHex(variant.color, variant.hex_code),
                      border: "2px solid rgba(0,0,0,0.12)", flexShrink: 0,
                    }} aria-label={`Colour: ${formatColorLabel(variant.color)}`} />
                    <span style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>
                      {formatColorLabel(variant.color)}
                    </span>
                    {variant.hex_code && (
                      <span style={{ fontSize: 10, color: T.textLight, fontFamily: "monospace" }}>{variant.hex_code}</span>
                    )}
                    <div style={{ marginLeft: "auto" }}>
                      <StockBadge label={variant.stock_label} count={variant.total_stock} size="sm" />
                    </div>
                  </div>

                  {/* Size-stock table */}
                  {variant.size_stocks.length === 0 ? (
                    <p style={{ marginLeft: 36, color: T.textLight, fontSize: 12 }}>No sizes configured</p>
                  ) : (
                    <div style={{ marginLeft: 36, overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 280 }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${T.tableBorder}` }}>
                            <th style={{ textAlign: "left", paddingBottom: 8, color: T.textLight, fontSize: 11, fontWeight: 600, width: 64 }}>
                              <Tag size={9} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                              Size
                            </th>
                            <th style={{ textAlign: "left", paddingBottom: 8, color: T.textLight, fontSize: 11, fontWeight: 600 }}>
                              Stock
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {variant.size_stocks.map(ss => (
                            <tr key={ss.size_stock_id} style={{ borderBottom: `1px solid ${T.tableBorder}` }}>
                              <td style={{ padding: "10px 16px 10px 0", color: T.text, fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}>
                                {ss.size}
                              </td>
                              <td style={{ padding: "10px 0" }}>
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
        ))}
      </div>
    );
  };

  // ── Full render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", display: "flex", overflowX: "hidden", background: T.bg, backgroundSize: "400% 400%", animation: "gradientShift 15s ease infinite" }}>
      <style>{`
        @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
        .group\/cell:hover .group-hover\/cell\\:\\!opacity-100 { opacity: 1 !important; }
        .stock-row:hover { background: ${T.cardHover} !important; }
        .refresh-btn:hover { background: ${T.goldLight} !important; border-color: ${T.gold} !important; color: ${T.gold} !important; }
        .upload-btn:hover { opacity: .88; }
      `}</style>

      <LuxeSidebar user={sidebarUser} navLinks={creatorNavLinks} />

      <div style={{ flex: 1, minWidth: 0, transition: "margin .3s ease", marginLeft: isMobile ? 0 : sidebarWidth }}>
        <div style={{ minHeight: "100vh", padding: "32px 16px", maxWidth: 900, margin: "0 auto" }}>

          {/* ── Page header ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ display: "flex", alignItems: "center", gap: 12, margin: 0, fontSize: 26, fontWeight: 800, color: T.text }}>
                <div style={{
                  padding: 10, borderRadius: 14,
                  background: T.goldLight, border: `1.5px solid ${T.goldBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Package size={22} style={{ color: T.gold }} />
                </div>
                Stock Management
              </h1>
              <p style={{ margin: "6px 0 0 50px", fontSize: 13, color: T.textMid }}>
                View and update stock levels for all your uploaded products
              </p>
            </div>
            <button
              id="refresh-stock"
              onClick={loadProducts}
              disabled={loading}
              className="refresh-btn"
              aria-label="Refresh stock data"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 18px", borderRadius: 12,
                border: `1.5px solid ${T.cardBorder}`,
                background: T.card, color: T.textMid,
                fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1, transition: "all .2s", boxShadow: T.cardShadow,
              }}
            >
              <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          </div>

          {/* ── Error state ── */}
          {fetchError && !loading && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
              borderRadius: 14, padding: 16, marginBottom: 24,
            }}>
              <AlertTriangle size={18} style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#DC2626" }}>Failed to load stock data</p>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#EF4444" }}>{fetchError}</p>
              </div>
              <button onClick={loadProducts} style={{ background: "none", border: "none", color: "#DC2626", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                Retry
              </button>
            </div>
          )}

          {/* ── Loading skeletons ── */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && !fetchError && products.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 16px", textAlign: "center" }}>
              <div style={{
                padding: 24, borderRadius: 20, marginBottom: 20,
                background: T.card, border: `1.5px solid ${T.cardBorder}`, boxShadow: T.cardShadow,
              }}>
                <Package size={44} style={{ color: T.textLight }} />
              </div>
              <h2 style={{ margin: "0 0 8px", color: T.text, fontWeight: 700, fontSize: 18 }}>No products yet</h2>
              <p style={{ margin: "0 0 24px", color: T.textMid, fontSize: 14, maxWidth: 320 }}>
                Upload your first product and its stock will appear here for easy management.
              </p>
              <button
                id="go-to-upload"
                onClick={() => navigate("/creator-upload")}
                className="upload-btn"
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "11px 22px", borderRadius: 12,
                  background: `linear-gradient(135deg, ${T.gold} 0%, #D4B76E 100%)`,
                  color: T.text, border: "none", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", boxShadow: "0 4px 16px rgba(201,165,95,0.35)",
                }}
              >
                <Upload size={15} /> Upload Product
              </button>
            </div>
          )}

          {/* ── Product list ── */}
          {!loading && products.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {products.map(product => {
                const isOpen = expandedIds.has(product.product_id);
                return (
                  <div
                    key={product.product_id}
                    id={`product-row-${product.product_id}`}
                    style={{
                      background: T.card, border: `1.5px solid ${T.cardBorder}`,
                      borderRadius: 18, overflow: "hidden",
                      boxShadow: T.cardShadow, transition: "all .2s",
                    }}
                  >
                    {/* Clickable header row */}
                    <button
                      onClick={() => toggleExpand(product.product_id)}
                      aria-expanded={isOpen}
                      aria-controls={`product-detail-${product.product_id}`}
                      className="stock-row"
                      style={{
                        width: "100%", textAlign: "left",
                        display: "flex", alignItems: "center", gap: 14,
                        padding: 14, background: "transparent",
                        border: "none", cursor: "pointer", transition: "background .18s", borderRadius: isOpen ? "18px 18px 0 0" : 18,
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{
                        width: 56, height: 56, borderRadius: 12, overflow: "hidden", flexShrink: 0,
                        border: `1.5px solid ${T.cardBorder}`, background: "#F5F0E8",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {product.primary_image ? (
                          <img src={product.primary_image} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                        ) : (
                          <Package size={20} style={{ color: T.textLight }} />
                        )}
                      </div>

                      {/* Title + meta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, color: T.text, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {product.title}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 5 }}>
                          <StatusBadge status={product.status} />
                          {product.category_name && (
                            <span style={{ color: T.textLight, fontSize: 11 }}>
                              {product.category_name}{product.sub_category_name ? ` · ${product.sub_category_name}` : ""}
                            </span>
                          )}
                          <span style={{ color: T.textLight, fontSize: 11 }}>
                            {formatPrice(product.price_cents, product.currency)}
                          </span>
                        </div>
                      </div>

                      {/* Stock badge + chevron */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <StockBadge label={product.stock_label} count={product.total_stock} />
                        {isOpen
                          ? <ChevronUp size={18} style={{ color: T.gold }} />
                          : <ChevronDown size={18} style={{ color: T.textLight }} />}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div id={`product-detail-${product.product_id}`}
                        style={{ borderTop: `1px solid ${T.divider}` }}>
                        <div style={{ padding: "12px 0 0" }}>
                          {renderPatterns(product)}
                        </div>
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
