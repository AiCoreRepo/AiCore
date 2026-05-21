import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LuxeSidebar from "../../components/common/LuxeSidebar";
import { creatorNavLinks } from "@/components/creator/creatorNavLinks";
import { useSidebar } from "@/context/SidebarContext";
import { getProfile, getCategories, type Category } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Menu, Plus, Trash2, ChevronDown, ChevronUp,
  Image as ImageIcon, Loader2, CheckCircle2, AlertCircle,
  Sparkles, Layers, Palette, Package2, Info, ArrowLeft, X,
  FolderTree, IndianRupee,
} from "lucide-react";
import { BODY_SHAPE_ICONS } from "../../constants/body-shape-icons";
import {
  BODY_SHAPES, SKIN_TONES, CLOTHING_COLORS,
  type BodyShapeValue, type SkinToneValue, type ClothingColorValue,
} from "../../constants/product-hierarchy.enums";
import { AGE_RANGE_OPTIONS } from "@/constants/aura.constants";
import { createProductHierarchy, fileToDataUri } from "../../api/creator-upload.api";
import {
  parseStockInput,
  commitSizeStockDrafts,
} from "@/utils/inventory";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColorVariantForm {
  id: string;
  color: ClothingColorValue | "";
  skin_tones: SkinToneValue[];
  imageFiles: File[];
  imagePreviews: string[];
  errors: Record<string, string>;
  size_stocks?: { [size: string]: number };
  /** String drafts while typing — prevents number-input digit glitches (e.g. 50 → 505). */
  size_stock_drafts?: { [size: string]: string };
}

interface PatternForm {
  id: string;
  name: string;
  body_shapes: BodyShapeValue[];
  color_variants: ColorVariantForm[];
  collapsed: boolean;
  errors: Record<string, string>;
}

const uid = () => Math.random().toString(36).slice(2, 9);
const makeVariant = (): ColorVariantForm => ({
  id: uid(), color: "", skin_tones: [], imageFiles: [], imagePreviews: [], errors: {},
  size_stocks: {}, size_stock_drafts: {},
});

function sumVariantStockDrafts(variant: ColorVariantForm): number {
  const drafts = variant.size_stock_drafts ?? {};
  const sizes = new Set([
    ...Object.keys(variant.size_stocks ?? {}),
    ...Object.keys(drafts),
  ]);
  let total = 0;
  for (const sz of sizes) {
    const raw = drafts[sz];
    total += raw !== undefined ? parseStockInput(raw) : (variant.size_stocks?.[sz] ?? 0);
  }
  return total;
}
const makePattern = (): PatternForm => ({ id: uid(), name: "", body_shapes: [], color_variants: [makeVariant()], collapsed: false, errors: {} });

// ─── Micro Components ─────────────────────────────────────────────────────────

const FieldErr = ({ msg }: { msg?: string }) =>
  msg ? <p className="flex items-center gap-1.5 mt-2 text-sm text-red-500 font-medium"><AlertCircle size={14} />{msg}</p> : null;

const SLabel = ({ children, hint, req }: { children: React.ReactNode; hint?: string; req?: boolean }) => (
  <div className="mb-2 md:mb-3">
    <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#2C2416]/70">
      {children}{req && <span className="text-red-500 ml-1">*</span>}
    </span>
    {hint && <span className="text-xs md:text-sm ml-2 text-[#2C2416]/40 lowercase">— {hint}</span>}
  </div>
);

const LuxeInput = ({ value, onChange, placeholder, type = "text", icon: Icon, min, step, error }: {
  value: string | number; onChange: (v: string) => void;
  placeholder?: string; type?: string; icon?: React.ElementType; min?: number; step?: number; error?: string;
}) => (
  <div className="relative">
    {Icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C9A75F]/70 pointer-events-none"><Icon size={20} /></div>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} min={min} step={step}
      className={`w-full py-3.5 md:py-4 rounded-xl md:rounded-2xl border-2 transition-all outline-none font-semibold text-[#1a1408] text-sm md:text-base bg-white/90 ${error ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-[#C9A75F]/30 focus:border-[#C9A75F] focus:ring-4 focus:ring-[#C9A75F]/15'} ${Icon ? 'pl-12' : 'pl-4'} pr-4`}
    />
  </div>
);

// ─── Custom Color Select ───────────────────────────────────────────────────────

const ColorSelect = ({ value, onChange, error }: { value: string, onChange: (v: string) => void, error?: string }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = CLOTHING_COLORS.find(c => c.value === value);

  useEffect(() => {
    const act = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", act);
    return () => document.removeEventListener("mousedown", act);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${open ? 'z-[100]' : 'z-10'}`}>
      <div 
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between min-h-[50px] md:min-h-[56px] px-4 py-3 cursor-pointer bg-white/90 border-2 rounded-xl md:rounded-2xl transition-all ${open ? 'border-[#C9A75F] ring-4 ring-[#C9A75F]/15' : error ? 'border-red-400' : 'border-[#C9A75F]/30 hover:border-[#C9A75F]/60'}`}
      >
        {selected ? (
          <div className="flex items-center gap-3 md:gap-4">
             <div className="w-6 h-6 md:w-7 md:h-7 rounded-full shadow-md border border-black/10" style={{ backgroundColor: selected.hex }} />
             <span className="font-bold text-gray-800 text-sm md:text-base">{selected.label}</span>
          </div>
        ) : (
          <span className="text-gray-400 font-semibold text-sm md:text-base">Select a garment colour...</span>
        )}
        <ChevronDown size={20} className={`text-[#C9A75F]/70 transition-transform duration-300 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 max-h-[300px] overflow-y-auto bg-white border-2 border-[#C9A75F]/20 rounded-xl md:rounded-2xl shadow-2xl py-2 custom-scrollbar">
          {CLOTHING_COLORS.map(c => (
            <div 
              key={c.value}
              onClick={() => { onChange(c.value); setOpen(false); }}
              className={`flex items-center gap-3 md:gap-4 px-4 py-3 cursor-pointer hover:bg-[#C9A75F]/10 transition-colors ${value === c.value ? 'bg-[#C9A75F]/15' : ''}`}
            >
               <div className="w-6 h-6 md:w-8 md:h-8 rounded-full shadow-sm border border-black/10 shrink-0" style={{ backgroundColor: c.hex }} />
               <span className="font-semibold text-gray-800 text-sm md:text-base">{c.label}</span>
               {value === c.value && <CheckCircle2 size={20} className="text-[#C9A75F] ml-auto shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// ─── Multi Select Dropdown ─────────────────────────────────────────────────────

const MultiSelectDropdown = ({ options, selected, onChange, placeholder }: {
  options: { value: string, label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const act = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", act);
    return () => document.removeEventListener("mousedown", act);
  }, [open]);

  const selectedLabels = selected.map(v => options.find(o => o.value === v)?.label || v);
  const displayLabel = selectedLabels.length > 0 
    ? (selectedLabels.length <= 2 ? selectedLabels.join(', ') : `${selectedLabels.slice(0, 2).join(', ')} (+${selectedLabels.length - 2})`)
    : placeholder;

  return (
    <div ref={ref} className={`relative ${open ? 'z-[100]' : 'z-10'}`}>
      <div 
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between min-h-[50px] md:min-h-[56px] px-4 py-3 cursor-pointer bg-white/90 border-2 rounded-xl md:rounded-2xl transition-all ${open ? 'border-[#C9A75F] ring-4 ring-[#C9A75F]/15' : 'border-[#C9A75F]/30 hover:border-[#C9A75F]/60'}`}
      >
        <span className={`text-sm md:text-base font-semibold ${selected.length ? 'text-[#1a1408] truncate pr-4' : 'text-gray-400'}`}>
          {displayLabel}
        </span>
        <ChevronDown size={20} className={`text-[#C9A75F]/70 transition-transform duration-300 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 max-h-[300px] overflow-y-auto bg-white border-2 border-[#C9A75F]/20 rounded-xl md:rounded-2xl shadow-2xl py-2 custom-scrollbar">
          {options.map(opt => {
            const sel = selected.includes(opt.value);
            return (
              <div 
                key={opt.value}
                onClick={e => { e.stopPropagation(); onChange(sel ? selected.filter(v => v !== opt.value) : [...selected, opt.value]); }}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#C9A75F]/10 transition-colors ${sel ? 'bg-[#C9A75F]/15' : ''}`}
              >
                <span className="font-semibold text-gray-800 text-sm md:text-base">{opt.label}</span>
                {sel && <CheckCircle2 size={20} className="text-[#C9A75F] shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


// ─── Image Drop Zone ──────────────────────────────────────────────────────────

const ImageZone = ({ previews, onAdd, onRemove, error }: {
  previews: string[]; onAdd: (files: File[]) => void; onRemove: (i: number) => void; error?: string;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const drop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) onAdd(files);
  }, [onAdd]);

  return (
    <div className="space-y-4">
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-3 md:gap-4">
          {previews.map((src, i) => (
            <div key={i} className="relative group w-20 h-20 md:w-28 md:h-28 rounded-xl md:rounded-2xl overflow-hidden border-2 border-[#C9A75F]/30 shadow-md">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => onRemove(i)}
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <X size={24} className="text-white drop-shadow-md hover:scale-110 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={drop}
        onClick={() => ref.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 md:gap-3 cursor-pointer transition-all border-2 border-dashed rounded-xl md:rounded-2xl py-6 md:py-10 px-4 min-h-[100px] md:min-h-[140px] ${drag ? 'border-[#C9A75F] bg-[#C9A75F]/10 scale-[1.02]' : error ? 'border-red-400 bg-red-50/50' : 'border-[#C9A75F]/40 bg-white/50 hover:bg-[#C9A75F]/5 hover:border-[#C9A75F]'}`}
      >
        <div className="p-3 md:p-4 rounded-full bg-[#C9A75F]/10 text-[#C9A75F] mb-1 md:mb-2">
          <ImageIcon size={28} className="md:w-8 md:h-8" />
        </div>
        <p className="text-sm md:text-base text-[#2C2416]/60 font-semibold text-center">
          {previews.length ? "Tap or drag to add more images" : "Tap or drag images here to upload"}
        </p>
        <input ref={ref} type="file" accept="image/*" multiple className="hidden"
          onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) onAdd(f); e.target.value = ""; }} />
      </div>
    </div>
  );
};

// ─── Color Variant Card ───────────────────────────────────────────────────────

const ColorCard = ({ variant, idx, onChange, onRemove, canRemove }: {
  variant: ColorVariantForm; idx: number;
  onChange: (v: ColorVariantForm) => void; onRemove: () => void; canRemove: boolean;
}) => {
  const selected = CLOTHING_COLORS.find(c => c.value === variant.color);

  const handleSizeToggle = (size: string) => {
    const stocks = { ...(variant.size_stocks || {}) };
    const drafts = { ...(variant.size_stock_drafts || {}) };
    if (size in stocks) {
      delete stocks[size];
      delete drafts[size];
    } else {
      stocks[size] = 0;
      drafts[size] = "";
    }
    onChange({
      ...variant,
      size_stocks: stocks,
      size_stock_drafts: drafts,
      errors: { ...variant.errors, stock: "" },
    });
  };

  const handleSizeStockDraftChange = (size: string, raw: string) => {
    if (raw !== "" && !/^\d+$/.test(raw)) return;
    onChange({
      ...variant,
      size_stock_drafts: { ...(variant.size_stock_drafts || {}), [size]: raw },
      errors: { ...variant.errors, stock: "" },
    });
  };

  const commitSizeStockDraft = (size: string) => {
    const raw = variant.size_stock_drafts?.[size] ?? "";
    const qty = parseStockInput(raw);
    onChange({
      ...variant,
      size_stocks: { ...(variant.size_stocks || {}), [size]: qty },
      size_stock_drafts: {
        ...(variant.size_stock_drafts || {}),
        [size]: qty === 0 ? "" : String(qty),
      },
    });
  };

  return (
    <div className="rounded-2xl md:rounded-[24px] p-4 md:p-6 lg:p-8 bg-white/85 backdrop-blur-md border-[1.5px] border-[#C9A75F]/20 shadow-[0_8px_30px_rgba(201,165,95,0.08)] relative transition-all hover:border-[#C9A75F]/40 hover:shadow-[0_8px_30px_rgba(201,165,95,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8 pb-4 border-b border-[#C9A75F]/10">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-inner border-[3px] border-white ring-1 ring-black/5" style={{ backgroundColor: selected?.hex ?? "#f3f4f6" }}>
            {!selected && <Palette size={16} className="text-gray-400" />}
          </div>
          <span className="font-bold text-base md:text-lg text-[#2C2416]">
            Colour {idx + 1}{selected ? <span className="text-[#2C2416]/60 font-medium"> — {selected.label}</span> : ""}
          </span>
        </div>
        {canRemove && (
          <button type="button" onClick={onRemove}
            className="p-2 md:p-2.5 rounded-xl border border-red-100 bg-red-50/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-200">
            <Trash2 size={18} className="md:w-5 md:h-5" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6 mb-6 md:mb-8">
        {/* ── Color Swatch Dropdown ── */}
        <div className="w-full">
          <SLabel req hint="select actual colour">Garment Colour</SLabel>
          <ColorSelect 
            value={variant.color} 
            onChange={v => onChange({ ...variant, color: v as ClothingColorValue, errors: { ...variant.errors, color: "" } })} 
            error={variant.errors.color}
          />
          <FieldErr msg={variant.errors.color} />
        </div>

        {/* ── Dynamic Size & Stock section ── */}
        {variant.color && (
          <div className="p-4 sm:p-6 rounded-2xl border bg-white/60 transition-all border-[#C9A75F]/20" style={{ boxShadow: "inset 0 2px 8px rgba(201,165,95,0.03)" }}>
            <SLabel req hint="Choose available sizes and enter stock for each size.">Available Sizes & Stock</SLabel>
            
            {/* Size Chips */}
            <div className="flex flex-wrap gap-2 mt-2">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map(sz => {
                const isSelected = sz in (variant.size_stocks || {});
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSizeToggle(sz)}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all active:scale-95 duration-200"
                    style={{
                      borderColor: isSelected ? "#C9A75F" : "rgba(201,165,95,0.25)",
                      background: isSelected ? "linear-gradient(135deg,rgba(201,165,95,0.18),rgba(201,165,95,0.08))" : "rgba(255,255,255,0.8)",
                      color: isSelected ? "#2C2416" : "rgba(44,36,22,0.6)",
                      boxShadow: isSelected ? "0 4px 12px rgba(201,165,95,0.12)" : "none",
                    }}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>

            {/* Size Stock Input Fields */}
            {Object.keys(variant.size_stocks || {}).length > 0 ? (
              <div className="space-y-3 mt-4 pt-4 border-t border-[#C9A75F]/15">
                {Object.entries(variant.size_stocks || {}).map(([sz]) => (
                  <div key={sz} className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-white border border-[#C9A75F]/10 shadow-sm">
                    <span className="text-xs sm:text-sm font-bold text-[#2C2416]">Size {sz}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={variant.size_stock_drafts?.[sz] ?? ""}
                        placeholder="0"
                        onChange={e => handleSizeStockDraftChange(sz, e.target.value)}
                        onBlur={() => commitSizeStockDraft(sz)}
                        className="w-24 px-3 py-2 text-center text-sm font-bold rounded-lg border focus:border-[#C9A75F] focus:ring-2 focus:ring-[#C9A75F]/15 outline-none bg-white transition-all"
                        style={{
                          borderColor: "rgba(201,165,95,0.3)",
                          color: "#1a1408",
                        }}
                      />
                      <span className="text-xs font-bold text-[#2C2416]/50">units</span>
                    </div>
                  </div>
                ))}
                
                {/* Total Stock Summary */}
                <div className="flex items-center justify-between pt-2 px-1 text-sm font-extrabold text-[#C9A75F]">
                  <span>Total Variant Stock:</span>
                  <span>{sumVariantStockDrafts(variant)} units</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-center py-4 font-semibold text-[#2C2416]/40 mt-2 bg-[#C9A75F]/5 rounded-xl border border-dashed border-[#C9A75F]/15">
                Select one or more sizes above to input stock levels
              </div>
            )}
            <FieldErr msg={variant.errors.stock} />
          </div>
        )}
      </div>

      {/* ── Skin Tone Swatches ── */}
      <div className="mb-6 md:mb-8 bg-[#C9A75F]/5 rounded-2xl p-4 md:p-6 border border-[#C9A75F]/10">
        <SLabel req hint="select tones this colour flatters">Flattering Skin Tones</SLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3 mt-3">
          {SKIN_TONES.map(st => {
            const sel = variant.skin_tones.includes(st.value);
            return (
              <button key={st.value} type="button"
                onClick={() => {
                  const next = sel ? variant.skin_tones.filter(x => x !== st.value) : [...variant.skin_tones, st.value];
                  onChange({ ...variant, skin_tones: next, errors: { ...variant.errors, skin_tones: "" } });
                }}
                className={`group flex items-center justify-start gap-2.5 py-2 px-3 sm:px-4 rounded-full cursor-pointer transition-all duration-200 border-2 w-full ${sel ? 'border-[#C9A75F] bg-white shadow-md scale-[1.02]' : 'border-transparent bg-white/60 hover:bg-white hover:border-[#C9A75F]/30 hover:shadow-sm'}`}
              >
                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full shadow-inner border border-black/10 shrink-0" style={{ backgroundColor: st.hex }} />
                <span className={`text-[10px] sm:text-xs md:text-sm truncate transition-colors ${sel ? 'font-bold text-[#2C2416]' : 'font-semibold text-[#2C2416]/60'}`}>{st.label}</span>
                {sel && <CheckCircle2 size={12} className="text-[#C9A75F] shrink-0 ml-auto" />}
              </button>
            );
          })}
        </div>
        <FieldErr msg={variant.errors.skin_tones} />
      </div>

      {/* ── Images ── */}
      <div>
        <SLabel req>Product Images</SLabel>
        <ImageZone
          previews={variant.imagePreviews}
          error={variant.errors.images}
          onAdd={files => {
            const newPreviews = files.map(f => URL.createObjectURL(f));
            onChange({ ...variant, imageFiles: [...variant.imageFiles, ...files], imagePreviews: [...variant.imagePreviews, ...newPreviews], errors: { ...variant.errors, images: "" } });
          }}
          onRemove={i => {
            const nf = [...variant.imageFiles]; nf.splice(i, 1);
            const np = [...variant.imagePreviews]; np.splice(i, 1);
            onChange({ ...variant, imageFiles: nf, imagePreviews: np });
          }}
        />
        <FieldErr msg={variant.errors.images} />
      </div>
    </div>
  );
};

// ─── Pattern Card ─────────────────────────────────────────────────────────────


const PatternCard = ({ pattern, pi, onChange, onRemove, canRemove }: {
  pattern: PatternForm; pi: number;
  onChange: (p: PatternForm) => void; onRemove: () => void; canRemove: boolean;
}) => {
  const totalStock = pattern.color_variants.reduce((s, v) => s + sumVariantStockDrafts(v), 0);

  return (
    <div className={`rounded-2xl md:rounded-[28px] transition-all duration-300 border-2 ${pattern.collapsed ? 'border-[#C9A75F]/20' : 'border-[#C9A75F]/40 shadow-[0_12px_40px_rgba(201,165,95,0.12)] bg-gradient-to-br from-[#FFFDF8] to-[#FFF6E5]'}`}>
      {/* Header row */}
      <div className={`flex items-center justify-between cursor-pointer select-none p-4 md:p-6 transition-colors rounded-2xl md:rounded-[28px] ${pattern.collapsed ? 'bg-white/80 hover:bg-[#C9A75F]/5' : 'bg-white/95 border-b-2 border-[#C9A75F]/10 rounded-b-none'}`}
        onClick={() => onChange({ ...pattern, collapsed: !pattern.collapsed })}>
        <div className="flex items-center gap-4 md:gap-5">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl shrink-0 bg-gradient-to-br from-[#C9A75F]/20 to-[#C9A75F]/5 flex items-center justify-center shadow-inner">
            <Layers size={22} className="text-[#C9A75F] md:w-7 md:h-7" />
          </div>
          <div>
            <p className="font-serif font-bold text-lg md:text-xl text-[#2C2416]">
              {pattern.name || `Silhouette ${pi + 1}`}
            </p>
            <div className="flex items-center gap-2 md:gap-3 mt-1 md:mt-1.5 flex-wrap">
              <span className="text-xs md:text-sm text-[#2C2416]/60 font-semibold bg-[#C9A75F]/10 px-2.5 py-1 rounded-md">
                {pattern.color_variants.length} Colour{pattern.color_variants.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs md:text-sm text-[#2C2416]/60 font-semibold bg-[#C9A75F]/10 px-2.5 py-1 rounded-md">
                {totalStock} Units Total
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {canRemove && (
            <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }}
              className="p-2 md:p-3 rounded-xl border border-red-100 bg-red-50/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-200 flex items-center justify-center">
              <Trash2 size={18} className="md:w-5 md:h-5" />
            </button>
          )}
          <div className={`p-2 rounded-full transition-transform duration-300 ${pattern.collapsed ? 'rotate-0 text-[#C9A75F]/60' : 'rotate-180 text-[#C9A75F] bg-[#C9A75F]/10'}`}>
            <ChevronDown size={24} />
          </div>
        </div>
      </div>

      {!pattern.collapsed && (
        <div className="p-4 md:p-6 lg:p-8 flex flex-col gap-8 md:gap-10">
          {/* Name */}
          <div className="bg-white/50 p-4 md:p-6 rounded-2xl md:rounded-[20px] border border-[#C9A75F]/10">
            <SLabel req hint='e.g. "Slim Fit", "Relaxed Fit", "Oversized"'>Silhouette Name / Fit</SLabel>
            <LuxeInput value={pattern.name} onChange={v => onChange({ ...pattern, name: v, errors: { ...pattern.errors, name: "" } })}
              placeholder='e.g. "Relaxed Fit"' icon={Layers} error={pattern.errors.name} />
            <FieldErr msg={pattern.errors.name} />
          </div>

          {/* Body Shapes */}
          <div className="bg-white/50 p-4 md:p-6 rounded-2xl md:rounded-[20px] border border-[#C9A75F]/10">
            <SLabel req hint="choose shapes this fit compliments">Complimentary Body Shapes</SLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-4 mt-3">
              {BODY_SHAPES.map(bs => {
                const sel = pattern.body_shapes.includes(bs.value as BodyShapeValue);
                const IconComponent = BODY_SHAPE_ICONS[bs.value];
                return (
                  <button key={bs.value} type="button"
                    onClick={() => {
                      const next = sel ? pattern.body_shapes.filter(x => x !== bs.value) : [...pattern.body_shapes, bs.value as BodyShapeValue];
                      onChange({ ...pattern, body_shapes: next, errors: { ...pattern.errors, body_shapes: "" } });
                    }}
                    className={`group flex flex-col items-center justify-center gap-2 p-2.5 sm:p-4 rounded-xl md:rounded-2xl cursor-pointer transition-all duration-200 border-2 ${sel ? 'border-[#C9A75F] bg-gradient-to-b from-[#C9A75F]/10 to-[#C9A75F]/5 shadow-[0_4px_12px_rgba(201,165,95,0.15)] scale-[1.03]' : 'border-[#C9A75F]/20 bg-white hover:bg-[#C9A75F]/5 hover:border-[#C9A75F]/40'}`}
                  >
                    {IconComponent && (
                      <IconComponent
                        className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 transition-all duration-300 ${sel ? 'text-[#C9A75F]' : 'text-[#C9A75F]/45 group-hover:text-[#C9A75F]/75'}`}
                      />
                    )}
                    <span className={`text-[10px] sm:text-xs md:text-sm text-center leading-tight transition-colors ${sel ? 'font-bold text-[#2C2416]' : 'font-semibold text-[#2C2416]/60'}`}>{bs.label}</span>
                  </button>
                );
              })}
            </div>
            <FieldErr msg={pattern.errors.body_shapes} />
          </div>

          {/* Color Variants */}
          <div className="pt-6 border-t-2 border-[#C9A75F]/15">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8 bg-[#C9A75F]/5 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#C9A75F]/20 text-[#C9A75F]">
                  <Palette size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg text-[#2C2416]">Colour Variants</h3>
                  <p className="text-xs md:text-sm text-[#2C2416]/50 font-medium">Add available colours for this pattern</p>
                </div>
              </div>
              <button type="button"
                onClick={() => onChange({ ...pattern, color_variants: [...pattern.color_variants, makeVariant()] })}
                className="flex items-center justify-center gap-2 py-3 px-5 md:px-6 rounded-xl border-2 border-[#C9A75F]/40 bg-white hover:bg-[#C9A75F]/10 text-[#C9A75F] text-sm md:text-base font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap">
                <Plus size={18} /> Add New Colour
              </button>
            </div>
            
            <div className="space-y-6 md:space-y-8">
              {pattern.color_variants.map((v, vi) => (
                <ColorCard key={v.id} variant={v} idx={vi}
                  onChange={updated => { const next = [...pattern.color_variants]; next[vi] = updated; onChange({ ...pattern, color_variants: next }); }}
                  onRemove={() => { if (pattern.color_variants.length <= 1) return; onChange({ ...pattern, color_variants: pattern.color_variants.filter((_, i) => i !== vi) }); }}
                  canRemove={pattern.color_variants.length > 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CreatorUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { sidebarWidth, toggleSidebar, isMobile } = useSidebar();
  const { toast } = useToast();

  const [user, setUser] = useState({ name: "Loading...", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face", role: "Creator", subtitle: "" });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Product fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hierarchy
  const [patterns, setPatterns] = useState<PatternForm[]>([makePattern()]);
  const [patternToDelete, setPatternToDelete] = useState<number | null>(null);

  useEffect(() => {
    getProfile().then(p => setUser({ name: p.name || p.store_name || "Creator", avatar: p.avatar || user.avatar, role: p.role || "Creator", subtitle: p.subtitle || "" })).catch(() => {});
    getCategories().then(c => setCategories(c || [])).catch(() => {});
  }, []);

  const selectedCategory = categories.find(c => c.category_id === categoryId);
  const subCategories = selectedCategory?.subcategories?.filter(s => s.is_active) ?? [];

  const validate = () => {
    let valid = true;
    const errs: Record<string, string> = {};
    if (!title.trim()) { errs.title = "Product title is required"; valid = false; }
    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) { errs.price = "Enter a valid price"; valid = false; }
    if (!categoryId) { errs.category = "Select a category"; valid = false; }
    
    setErrors(errs);

    const updated = patterns.map(p => {
      const pe: Record<string, string> = {};
      if (!p.name.trim()) { pe.name = "Silhouette name required"; valid = false; }
      if (!p.body_shapes.length) { pe.body_shapes = "Select at least one complimentary body shape"; valid = false; }
      const updatedV = p.color_variants.map(v => {
        const ve: Record<string, string> = {};
        if (!v.color) { ve.color = "Select a garment colour"; valid = false; }
        if (sumVariantStockDrafts(v) <= 0) { ve.stock = "Add stock for at least one size"; valid = false; }
        if (!v.skin_tones.length) { ve.skin_tones = "Select at least one skin tone"; valid = false; }
        if (!v.imageFiles.length) { ve.images = "Upload at least one image for this variant"; valid = false; }
        return { ...v, errors: ve };
      });
      return { ...p, errors: pe, color_variants: updatedV, collapsed: p.collapsed && Object.keys(pe).length === 0 && updatedV.every(v => Object.keys(v.errors).length === 0) ? true : false };
    });
    setPatterns(updated);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({ title: "Incomplete Form", description: "Please fill all required fields highlighted in red.", variant: "destructive" });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setIsLoading(true);
    try {
      const patternsPayload = await Promise.all(
        patterns.map(async p => ({
          name: p.name, body_shapes: p.body_shapes,
          color_variants: await Promise.all(p.color_variants.map(async v => ({
            color: v.color as ClothingColorValue,
            skin_tones: v.skin_tones, images: await Promise.all(v.imageFiles.map(fileToDataUri)),
            size_stocks: Object.entries(
              commitSizeStockDrafts(
                Object.fromEntries(
                  Object.keys(v.size_stocks || {}).map((s) => [
                    s,
                    v.size_stock_drafts?.[s] ?? String(v.size_stocks?.[s] ?? 0),
                  ]),
                ),
              ),
            ).map(([size, stock]) => ({ size, stock })),
          }))),
        }))
      );
      await createProductHierarchy({
        title: title.trim(), description: description.trim() || undefined,
        price_cents: Math.round(parseFloat(price) * 100),
        category_id: categoryId || undefined, sub_category_id: subCategoryId || undefined,
        age_ranges: selectedAgeRanges,
        patterns: patternsPayload,
      });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast({ title: "Product Submitted! 🎉", description: "Saved as DRAFT — goes live after admin approval." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err?.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setPrice(""); setCategoryId(""); setSubCategoryId("");
    setSelectedAgeRanges([]);
    setPatterns([makePattern()]); setErrors({}); setDone(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalVariants = patterns.reduce((s, p) => s + p.color_variants.length, 0);
  const totalStock = patterns.reduce((s, p) => s + p.color_variants.reduce((ss, v) => ss + sumVariantStockDrafts(v), 0), 0);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#FFF9E6] via-[#FFF4D6] to-[#FFE8B3] bg-[length:400%_400%] animate-gradientShift">
      <style>{`
        @keyframes gradientShift { 0%, 100% { background-position: 0% 50% } 50% { background-position: 100% 50% } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(201,165,95,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(201,165,95,0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(201,165,95,0.5); }
      `}</style>
      
      <LuxeSidebar user={user} navLinks={creatorNavLinks} />

      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300" style={{ marginLeft: sidebarWidth }}>
        {isMobile && (
          <div className="sticky top-0 z-30 bg-[#FFF9E6]/90 backdrop-blur-md border-b border-[#C9A75F]/20 px-4 py-3 flex items-center justify-between">
            <button onClick={toggleSidebar} className="p-2.5 rounded-xl bg-white shadow-sm border border-[#C9A75F]/20 active:scale-95 transition-transform text-[#C9A75F]">
              <Menu size={22} />
            </button>
            <div className="font-serif font-bold text-[#2C2416] text-lg">Upload Product</div>
            <div className="w-10"></div>{/* Spacer for centering */}
          </div>
        )}

        <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10 pb-[140px] md:pb-[140px]">

          {/* ── Page Header ── */}
          <div className="mb-6 md:mb-10">
            <button onClick={() => navigate("/creator-dashboard")}
              className="group flex items-center gap-2 mb-6 md:mb-8 text-[#2C2416]/60 hover:text-[#C9A75F] font-bold text-sm transition-all">
              <div className="p-1.5 rounded-lg bg-white/50 border border-[#C9A75F]/20 group-hover:bg-[#C9A75F]/10 group-hover:border-[#C9A75F]/40 transition-all">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              </div>
              Back to Dashboard
            </button>

            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 bg-white/40 p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-[#C9A75F]/20 shadow-[0_8px_32px_rgba(201,165,95,0.05)] backdrop-blur-md">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-[20px] md:rounded-[24px] shrink-0 bg-gradient-to-br from-[#C9A75F] to-[#D4B76E] flex items-center justify-center shadow-[0_12px_30px_rgba(201,165,95,0.4)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xNSkiLz48L3N2Zz4=')]"></div>
                <Sparkles size={32} className="text-white relative z-10 md:w-10 md:h-10" />
              </div>
              <div>
                <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#2C2416] mb-2 md:mb-3">
                  Upload Product
                </h1>
                <p className="text-sm md:text-base text-[#2C2416]/60 font-medium max-w-2xl leading-relaxed">
                  Showcase your creation to the world. Follow our guided flow: <span className="font-bold text-[#C9A75F]">Details → Silhouettes/Fits → Colour Variants.</span>
                </p>
              </div>
            </div>

            {/* Progress steps (Visible mainly on desktop or adapted for mobile) */}
            <div className="hidden sm:flex items-center gap-3 mt-8 ml-2">
              {[{ icon: Package2, label: "1. Info" }, { icon: Layers, label: "2. Silhouettes" }, { icon: Palette, label: "3. Images" }].map(({ icon: Icon, label }, i) => (
                <React.Fragment key={i}>
                  <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 border-2 border-[#C9A75F]/30 shadow-sm">
                    <Icon size={16} className="text-[#C9A75F]" />
                    <span className="text-xs md:text-sm font-bold text-[#2C2416] uppercase tracking-wide">{label}</span>
                  </div>
                  {i < 2 && <div className="w-10 md:w-16 h-0.5 bg-gradient-to-r from-[#C9A75F]/30 to-[#C9A75F]/10 rounded-full" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── Success state ── */}
          {done ? (
            <div className="rounded-[32px] p-8 md:p-16 text-center bg-white/90 backdrop-blur-xl border-2 border-[#C9A75F]/30 shadow-[0_20px_60px_rgba(201,165,95,0.15)] flex flex-col items-center">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-[#C9A75F] to-[#D4B76E] flex items-center justify-center mb-6 md:mb-8 shadow-[0_12px_30px_rgba(201,165,95,0.4)] animate-bounce" style={{ animationDuration: '2s' }}>
                <CheckCircle2 size={48} className="text-white md:w-16 md:h-16" />
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2C2416] mb-4">Masterpiece Submitted!</h2>
              <p className="text-base md:text-lg text-[#2C2416]/60 mb-10 max-w-lg leading-relaxed font-medium">
                Your exquisite product has been saved as a <strong className="text-[#C9A75F] px-2 py-1 bg-[#C9A75F]/10 rounded-lg">DRAFT</strong>. Our curation team will review it shortly.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
                <button onClick={resetForm} className="px-8 py-4 rounded-2xl border-2 border-[#C9A75F]/40 bg-white hover:bg-[#C9A75F]/5 text-[#C9A75F] font-bold text-base transition-all active:scale-95 shadow-sm">
                  Upload Another
                </button>
                <button onClick={() => navigate("/creator-dashboard")} className="px-8 py-4 rounded-2xl border-none bg-gradient-to-br from-[#C9A75F] to-[#D4B76E] text-[#2C2416] font-bold text-base transition-all active:scale-95 shadow-[0_8px_20px_rgba(201,165,95,0.4)] hover:shadow-[0_12px_24px_rgba(201,165,95,0.5)]">
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 md:gap-10">

              {/* ══ STEP 1: Product Info ══ */}
              <div className="rounded-[24px] md:rounded-[32px] p-5 sm:p-6 md:p-8 lg:p-10 bg-white/80 backdrop-blur-xl border-2 border-[#C9A75F]/20 shadow-[0_12px_40px_rgba(201,165,95,0.06)] relative z-10">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#C9A75F]/10 to-transparent rounded-[24px] md:rounded-[32px] rounded-br-none rounded-tl-none pointer-events-none -z-10"></div>
                
                <div className="flex items-center gap-4 mb-6 md:mb-8 pb-4 border-b-2 border-[#C9A75F]/10">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#C9A75F]/20 to-[#C9A75F]/5 flex items-center justify-center shadow-inner">
                    <Package2 size={24} className="text-[#C9A75F] md:w-6 md:h-6" />
                  </div>
                  <h2 className="font-serif font-bold text-2xl md:text-3xl text-[#2C2416]">Basic Details</h2>
                </div>

                <div className="flex flex-col gap-5 md:gap-8">
                  <div>
                    <SLabel req>Product Title</SLabel>
                    <LuxeInput value={title} onChange={v => { setTitle(v); setErrors(e => ({...e, title: ""})); }} placeholder="e.g. Midnight Silk Blazer..." icon={Sparkles} error={errors.title} />
                    <FieldErr msg={errors.title} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                    <div>
                      <SLabel req>Price (₹)</SLabel>
                      <LuxeInput value={price} onChange={v => { setPrice(v); setErrors(e => ({...e, price: ""})); }} type="number" placeholder="4999" icon={IndianRupee} min={1} step={1} error={errors.price} />
                      <FieldErr msg={errors.price} />
                    </div>
                    <div>
                      <SLabel req>Category</SLabel>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C9A75F]/70 pointer-events-none"><FolderTree size={20} /></div>
                        <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubCategoryId(""); setErrors(err => ({...err, category: ""})); }}
                          className={`w-full py-3.5 md:py-4 pl-12 pr-10 rounded-xl md:rounded-2xl border-2 transition-all outline-none font-semibold text-[#1a1408] text-sm md:text-base appearance-none bg-white/90 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%23C9A75F%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:calc(100%-1rem)_center] bg-no-repeat ${errors.category ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-[#C9A75F]/30 focus:border-[#C9A75F] focus:ring-4 focus:ring-[#C9A75F]/15'}`}>
                          <option value="" disabled>Choose a category...</option>
                          {categories.filter(c => c.is_active).map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                        </select>
                      </div>
                      <FieldErr msg={errors.category} />
                    </div>
                  </div>

                  {subCategories.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300 relative z-20">
                      <SLabel>Subcategory (Optional)</SLabel>
                      <select value={subCategoryId} onChange={e => { setSubCategoryId(e.target.value); setErrors(err => ({...err, subCategory: ""})); }}
                        className={`w-full py-3.5 md:py-4 pl-4 pr-10 rounded-xl md:rounded-2xl border-2 transition-all outline-none font-semibold text-[#1a1408] text-sm md:text-base appearance-none bg-white/90 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%23C9A75F%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:calc(100%-1rem)_center] bg-no-repeat ${errors.subCategory ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-[#C9A75F]/30 focus:border-[#C9A75F] focus:ring-4 focus:ring-[#C9A75F]/15'}`}>
                        <option value="" disabled>Select a subcategory...</option>
                        {subCategories.map(s => <option key={s.sub_category_id} value={s.sub_category_id}>{s.name}</option>)}
                      </select>
                      <FieldErr msg={errors.subCategory} />
                    </div>
                  )}

                  <div>
                    <SLabel>Story & Description</SLabel>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                      placeholder="Share the inspiration, fabric details, and styling tips..."
                      className="w-full p-4 rounded-xl md:rounded-2xl border-2 border-[#C9A75F]/30 focus:border-[#C9A75F] focus:ring-4 focus:ring-[#C9A75F]/15 transition-all outline-none font-medium text-[#1a1408] text-sm md:text-base bg-white/90 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="animate-in fade-in duration-300 mt-2">
                    <SLabel hint="Who is this suited for?">Target Audience</SLabel>
                    <MultiSelectDropdown
                      options={AGE_RANGE_OPTIONS}
                      selected={selectedAgeRanges}
                      onChange={setSelectedAgeRanges}
                      placeholder="Select target audience..."
                    />
                  </div>

                </div>
              </div>

              {/* ══ STEP 2 + 3: Silhouettes & Colours ══ */}
              <div className="flex flex-col gap-4 md:gap-6 mt-4 md:mt-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-2">
                  <div className="flex flex-col gap-2">
                    <h2 className="font-serif font-bold text-2xl md:text-3xl text-[#2C2416] flex items-center gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#C9A75F]/20 to-[#C9A75F]/5 flex items-center justify-center shadow-inner">
                        <Layers size={24} className="text-[#C9A75F] md:w-6 md:h-6" />
                      </div>
                      Fits & Colours
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2 md:gap-3 shrink-0">
                    <div className="flex flex-col bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl border border-[#C9A75F]/20 shadow-sm items-center">
                      <span className="text-xl md:text-2xl font-bold text-[#C9A75F] leading-none">{patterns.length}</span>
                      <span className="text-[10px] md:text-xs font-bold text-[#2C2416]/50 uppercase tracking-widest mt-1">Fits</span>
                    </div>
                    <div className="flex flex-col bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl border border-green-500/20 shadow-sm items-center">
                      <span className="text-xl md:text-2xl font-bold text-green-600 leading-none">{totalVariants}</span>
                      <span className="text-[10px] md:text-xs font-bold text-[#2C2416]/50 uppercase tracking-widest mt-1">Colours</span>
                    </div>
                    <div className="flex flex-col bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl border border-blue-500/20 shadow-sm items-center">
                      <span className="text-xl md:text-2xl font-bold text-blue-600 leading-none">{totalStock}</span>
                      <span className="text-[10px] md:text-xs font-bold text-[#2C2416]/50 uppercase tracking-widest mt-1">Stock</span>
                    </div>
                  </div>
                </div>

                {/* Hint */}
                <div className="flex items-start gap-4 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-[#C9A75F]/10 to-transparent border-l-4 border-[#C9A75F]">
                  <div className="p-1.5 rounded-full bg-white/80 shadow-sm shrink-0 mt-0.5">
                    <Info size={18} className="text-[#C9A75F]" />
                  </div>
                  <p className="text-sm md:text-base text-[#2C2416]/75 leading-relaxed font-medium">
                    Define each <strong className="text-[#2C2416]">Silhouette & Fit</strong> (e.g., Slim Fit, A-Line) and select its complimentary body shapes. Under each silhouette, specify its <strong className="text-[#2C2416]">Colour Variants</strong> along with flattering skin tones, stock, and product images.
                  </p>
                </div>

                <div className="space-y-6 md:space-y-8 mt-2">
                  {patterns.map((p, pi) => (
                    <PatternCard key={p.id} pattern={p} pi={pi}
                      onChange={updated => { const next = [...patterns]; next[pi] = updated; setPatterns(next); }}
                      onRemove={() => setPatternToDelete(pi)}
                      canRemove={patterns.length > 1}
                    />
                  ))}
                </div>

                <button type="button" onClick={() => {
                  const np = makePattern();
                  np.collapsed = false;
                  // Collapse all others
                  setPatterns(p => p.map(x => ({...x, collapsed: true})).concat(np));
                  // Smooth scroll could be added here
                }}
                  className="group flex flex-col items-center justify-center gap-3 w-full mt-4 md:mt-8 py-8 md:py-12 rounded-[24px] md:rounded-[32px] transition-all border-2 border-dashed border-[#C9A75F]/40 bg-white/40 hover:bg-[#C9A75F]/10 hover:border-[#C9A75F] cursor-pointer">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-[0_8px_24px_rgba(201,165,95,0.15)] flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_12px_32px_rgba(201,165,95,0.25)] transition-all">
                    <Plus size={28} className="text-[#C9A75F] md:w-8 md:h-8" />
                  </div>
                  <span className="font-bold text-base md:text-lg text-[#C9A75F]">Add New Silhouette / Fit</span>
                </button>
              </div>

              {/* ── Custom Delete Confirm Dialog ── */}
              {patternToDelete !== null && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
                  onClick={() => setPatternToDelete(null)}>
                  <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-[0_20px_60px_rgba(0,0,0,0.15)] mx-4 animate-in zoom-in-95 duration-300 pointer-events-auto"
                    onClick={e => e.stopPropagation()}>
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6 mx-auto">
                      <Trash2 size={32} className="text-red-500" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-serif font-bold text-center text-[#2C2416] mb-3">Remove Silhouette?</h3>
                    <p className="text-center text-[#2C2416]/60 text-sm md:text-base font-medium mb-8">
                      This will permanently remove this silhouette and all its associated colour variants. Are you sure?
                    </p>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setPatternToDelete(null)}
                        className="flex-1 py-3 md:py-3.5 rounded-[14px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors outline-none focus:ring-4 focus:ring-gray-200">
                        Cancel
                      </button>
                      <button type="button" onClick={() => {
                        setPatterns(prev => prev.filter((_, i) => i !== patternToDelete));
                        setPatternToDelete(null);
                        toast({ title: "Silhouette Removed", description: "The silhouette was deleted successfully." });
                      }}
                        className="flex-1 py-3 md:py-3.5 rounded-[14px] font-bold text-white bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg transition-all active:scale-95 outline-none focus:ring-4 focus:ring-red-500/20">
                        Yes, Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ Sticky Bottom Bar ══ */}
              <div className="fixed bottom-0 left-0 md:left-[80px] lg:left-[300px] right-0 z-50 transition-all duration-300 transform translate-y-0" style={{ left: isMobile ? 0 : sidebarWidth }}>
                {/* Gradient shadow above bar */}
                <div className="absolute bottom-full left-0 right-0 h-16 md:h-24 bg-gradient-to-t from-[#FFFDF8] to-transparent pointer-events-none"></div>
                
                <div className="bg-white/90 backdrop-blur-xl border-t-2 border-[#C9A75F]/20 shadow-[0_-10px_40px_rgba(201,165,95,0.1)] px-4 sm:px-6 md:px-10 py-4 md:py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  
                  <div className="hidden sm:flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-widest font-bold text-[#C9A75F]">Ready to Launch</span>
                    <div className="text-sm text-[#2C2416] font-semibold flex items-center gap-2">
                      <span>{patterns.length} Fits</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C9A75F]/30"></span>
                      <span>{totalVariants} Colours</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C9A75F]/30"></span>
                      <span>{totalStock} Total Units</span>
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 md:px-12 py-4 md:py-4 rounded-2xl md:rounded-[20px] transition-all duration-300 shadow-[0_8px_24px_rgba(201,165,95,0.3)] hover:shadow-[0_12px_32px_rgba(201,165,95,0.5)] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-[#C9A75F] to-[#D4B76E] text-[#2C2416] font-bold text-base md:text-lg overflow-hidden relative group">
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                    <span className="relative z-10 flex items-center gap-2">
                       {isLoading ? <><Loader2 size={22} className="animate-spin md:w-6 md:h-6" /> Uploading...</> : <><Sparkles size={22} className="md:w-6 md:h-6" /> Submit Masterpiece</>}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorUploadPage;
