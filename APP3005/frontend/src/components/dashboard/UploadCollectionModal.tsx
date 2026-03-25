import { useState, useCallback, useRef } from "react";
import {
  Upload, X, Loader2, Plus, Trash2,
  ChevronDown, ChevronUp,
  Image as ImageIcon, CheckCircle2, AlertCircle,
  Sparkles, Layers, Palette, Package2, Info,
  FolderTree, Tags, DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getCategories, type Category } from "@/lib/api";
import { useEffect } from "react";
import {
  BODY_SHAPES,
  SKIN_TONES,
  CLOTHING_COLORS,
  type BodyShapeValue,
  type SkinToneValue,
  type ClothingColorValue,
} from "@/constants/product-hierarchy.enums";
import { createProductHierarchy, fileToDataUri } from "@/api/creator-upload.api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColorVariantForm {
  id: string;
  color: ClothingColorValue | "";
  stock: number;
  skin_tones: SkinToneValue[];
  imageFiles: File[];
  imagePreviews: string[];
  errors: Record<string, string>;
}

interface PatternForm {
  id: string;
  name: string;
  body_shapes: BodyShapeValue[];
  color_variants: ColorVariantForm[];
  collapsed: boolean;
  errors: Record<string, string>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const makeVariant = (): ColorVariantForm => ({
  id: uid(), color: "", stock: 0, skin_tones: [],
  imageFiles: [], imagePreviews: [], errors: {},
});

const makePattern = (): PatternForm => ({
  id: uid(), name: "", body_shapes: [], color_variants: [makeVariant()],
  collapsed: false, errors: {},
});

// ─── Small shared components ──────────────────────────────────────────────────

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="flex items-center gap-1 mt-1 text-xs text-red-500">
      <AlertCircle size={11} /> {msg}
    </p>
  ) : null;

const SectionLabel = ({ children, hint, required }: {
  children: React.ReactNode; hint?: string; required?: boolean;
}) => (
  <div className="mb-1.5">
    <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "rgba(44,36,22,0.65)" }}>
      {children}{required && <span style={{ color: "#e74c3c" }}> *</span>}
    </p>
    {hint && <p className="text-[11px] mt-0.5" style={{ color: "rgba(44,36,22,0.4)" }}>{hint}</p>}
  </div>
);

// Pill-style chip
const Chip = ({
  label, selected, onClick, swatchColor, emoji,
}: { label: string; selected: boolean; onClick: () => void; swatchColor?: string; emoji?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all select-none"
    style={{
      borderColor: selected ? "#C9A75F" : "rgba(201,165,95,0.25)",
      background: selected
        ? "linear-gradient(135deg,rgba(201,165,95,0.18),rgba(201,165,95,0.08))"
        : "rgba(255,255,255,0.7)",
      color: selected ? "#2C2416" : "rgba(44,36,22,0.6)",
      boxShadow: selected ? "0 0 0 2px rgba(201,165,95,0.15)" : "none",
    }}
  >
    {emoji && <span>{emoji}</span>}
    {swatchColor && (
      <span
        className="w-3 h-3 rounded-full border border-white/50 shadow-sm flex-shrink-0"
        style={{ backgroundColor: swatchColor }}
      />
    )}
    {label}
  </button>
);

// Luxe-style text input
const LuxeInput = ({
  value, onChange, placeholder, type = "text", icon: Icon, required, min, step,
}: {
  value: string | number; onChange: (v: string) => void; placeholder?: string;
  type?: string; icon?: React.ElementType; required?: boolean; min?: number; step?: number;
}) => (
  <div className="relative">
    {Icon && (
      <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(201,165,95,0.7)", pointerEvents: "none" }}>
        <Icon size={16} />
      </div>
    )}
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      min={min}
      step={step}
      style={{
        width: "100%",
        padding: Icon ? "10px 12px 10px 38px" : "10px 12px",
        borderRadius: 10,
        border: "1.5px solid rgba(201,165,95,0.3)",
        background: "rgba(255,255,255,0.85)",
        color: "#1a1408",
        fontSize: 13,
        fontWeight: 600,
        outline: "none",
      }}
      onFocus={e => { e.target.style.borderColor = "#C9A75F"; e.target.style.boxShadow = "0 0 0 3px rgba(201,165,95,0.1)"; }}
      onBlur={e => { e.target.style.borderColor = "rgba(201,165,95,0.3)"; e.target.style.boxShadow = "none"; }}
    />
  </div>
);

// ─── Image Drop Zone ──────────────────────────────────────────────────────────

const ImageDropZone = ({ previews, onAdd, onRemove }: {
  previews: string[];
  onAdd: (files: File[]) => void;
  onRemove: (idx: number) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) onAdd(files);
  }, [onAdd]);

  return (
    <div className="space-y-2">
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden group"
              style={{ border: "1.5px solid rgba(201,165,95,0.3)" }}>
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => onRemove(i)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <X size={13} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-1 cursor-pointer transition-all rounded-xl p-3"
        style={{
          border: `2px dashed ${dragging ? "#C9A75F" : "rgba(201,165,95,0.3)"}`,
          background: dragging ? "rgba(201,165,95,0.06)" : "rgba(255,255,255,0.5)",
          minHeight: 72,
        }}
      >
        <ImageIcon size={18} style={{ color: "#C9A75F" }} />
        <p className="text-[11px]" style={{ color: "rgba(44,36,22,0.5)" }}>
          {previews.length === 0 ? "Drop images or click to upload" : "Add more images"}
        </p>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) onAdd(f); e.target.value = ""; }} />
      </div>
    </div>
  );
};

// ─── Color Variant Card ───────────────────────────────────────────────────────

const ColorVariantCard = ({ variant, varIdx, onChange, onRemove, canRemove }: {
  variant: ColorVariantForm; varIdx: number;
  onChange: (v: ColorVariantForm) => void;
  onRemove: () => void; canRemove: boolean;
}) => {
  const selectedColor = CLOTHING_COLORS.find(c => c.value === variant.color);

  const handleImages = (files: File[]) => {
    const newPreviews = files.map(f => URL.createObjectURL(f));
    onChange({
      ...variant,
      imageFiles: [...variant.imageFiles, ...files],
      imagePreviews: [...variant.imagePreviews, ...newPreviews],
      errors: { ...variant.errors, images: "" },
    });
  };

  const removeImage = (idx: number) => {
    const nf = [...variant.imageFiles]; nf.splice(idx, 1);
    const np = [...variant.imagePreviews]; np.splice(idx, 1);
    onChange({ ...variant, imageFiles: nf, imagePreviews: np });
  };

  return (
    <div className="rounded-xl p-3 space-y-3" style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(201,165,95,0.2)" }}>
      {/* Variant header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-white/50 shadow-sm flex-shrink-0"
            style={{ backgroundColor: selectedColor?.hex ?? "#e5e7eb" }} />
          <span className="text-[11px] font-bold" style={{ color: "#2C2416" }}>
            Color {varIdx + 1}{selectedColor ? ` — ${selectedColor.label}` : ""}
          </span>
        </div>
        {canRemove && (
          <button type="button" onClick={onRemove} className="p-1 rounded-lg transition-colors hover:bg-red-50">
            <Trash2 size={12} style={{ color: "#ef4444" }} />
          </button>
        )}
      </div>

      {/* Color picker */}
      <div>
        <SectionLabel required>Color</SectionLabel>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 hide-scrollbar">
          {CLOTHING_COLORS.map(c => (
            <Chip key={c.value} label={c.label} selected={variant.color === c.value}
              swatchColor={c.hex}
              onClick={() => onChange({ ...variant, color: c.value, errors: { ...variant.errors, color: "" } })} />
          ))}
        </div>
        <FieldError msg={variant.errors.color} />
      </div>

      {/* Stock */}
      <div>
        <SectionLabel required>Stock</SectionLabel>
        <div className="flex items-center gap-2">
          <input type="number" min={0} value={variant.stock}
            onChange={e => onChange({ ...variant, stock: parseInt(e.target.value) || 0, errors: { ...variant.errors, stock: "" } })}
            style={{ width: 90, padding: "8px 10px", borderRadius: 8, border: "1.5px solid rgba(201,165,95,0.3)", background: "rgba(255,255,255,0.85)", color: "#1a1408", fontSize: 13, fontWeight: 700, outline: "none" }}
            onFocus={e => e.target.style.borderColor = "#C9A75F"}
            onBlur={e => e.target.style.borderColor = "rgba(201,165,95,0.3)"}
          />
          <span className="text-[11px]" style={{ color: "rgba(44,36,22,0.45)" }}>units</span>
        </div>
        <FieldError msg={variant.errors.stock} />
      </div>

      {/* Skin tones */}
      <div>
        <SectionLabel required hint="Which skin tones does this color complement?">Skin Tones</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {SKIN_TONES.map(st => (
            <button key={st.value} type="button"
              onClick={() => {
                const next = variant.skin_tones.includes(st.value)
                  ? variant.skin_tones.filter(x => x !== st.value)
                  : [...variant.skin_tones, st.value];
                onChange({ ...variant, skin_tones: next, errors: { ...variant.errors, skin_tones: "" } });
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all"
              style={{
                borderColor: variant.skin_tones.includes(st.value) ? "#C9A75F" : "rgba(201,165,95,0.25)",
                background: variant.skin_tones.includes(st.value)
                  ? "linear-gradient(135deg,rgba(201,165,95,0.18),rgba(201,165,95,0.08))" : "rgba(255,255,255,0.7)",
                color: variant.skin_tones.includes(st.value) ? "#2C2416" : "rgba(44,36,22,0.6)",
              }}
            >
              <span className="w-3 h-3 rounded-full border border-white/40 shadow-sm" style={{ backgroundColor: st.hex }} />
              {st.label}
            </button>
          ))}
        </div>
        <FieldError msg={variant.errors.skin_tones} />
      </div>

      {/* Images */}
      <div>
        <SectionLabel required>Images</SectionLabel>
        <ImageDropZone previews={variant.imagePreviews} onAdd={handleImages} onRemove={removeImage} />
        <FieldError msg={variant.errors.images} />
      </div>
    </div>
  );
};

// ─── Pattern Card ─────────────────────────────────────────────────────────────

const PatternCard = ({ pattern, patIdx, onChange, onRemove, canRemove }: {
  pattern: PatternForm; patIdx: number;
  onChange: (p: PatternForm) => void;
  onRemove: () => void; canRemove: boolean;
}) => {
  const totalStock = pattern.color_variants.reduce((s, v) => s + v.stock, 0);

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      border: "1.5px solid rgba(201,165,95,0.3)",
      background: "linear-gradient(135deg,rgba(255,253,248,0.9),rgba(255,249,239,0.9))",
      boxShadow: "0 4px 20px rgba(201,165,95,0.08)",
    }}>
      {/* Pattern header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        style={{ borderBottom: "1.5px solid rgba(201,165,95,0.15)", background: "rgba(255,255,255,0.6)" }}
        onClick={() => onChange({ ...pattern, collapsed: !pattern.collapsed })}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,rgba(201,165,95,0.18),rgba(201,165,95,0.08))" }}>
            <Layers size={14} style={{ color: "#C9A75F" }} />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "#2C2416" }}>
              {pattern.name || `Pattern ${patIdx + 1}`}
            </p>
            <p className="text-[10px]" style={{ color: "rgba(44,36,22,0.45)" }}>
              {pattern.color_variants.length} color{pattern.color_variants.length !== 1 ? "s" : ""} · {totalStock} units
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button type="button"
              onClick={e => { e.stopPropagation(); onRemove(); }}
              className="p-1 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 size={13} style={{ color: "#ef4444" }} />
            </button>
          )}
          {pattern.collapsed
            ? <ChevronDown size={14} style={{ color: "#C9A75F" }} />
            : <ChevronUp size={14} style={{ color: "#C9A75F" }} />}
        </div>
      </div>

      {!pattern.collapsed && (
        <div className="p-4 space-y-4">
          {/* Pattern name */}
          <div>
            <SectionLabel required hint='e.g. "Slim Fit", "Relaxed Fit"'>Pattern Name</SectionLabel>
            <LuxeInput
              value={pattern.name}
              onChange={v => onChange({ ...pattern, name: v, errors: { ...pattern.errors, name: "" } })}
              placeholder='e.g. "Slim Fit"'
              icon={Layers}
            />
            <FieldError msg={pattern.errors.name} />
          </div>

          {/* Body shapes */}
          <div>
            <SectionLabel required hint="Which body shapes does this pattern suit?">Body Shapes</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {BODY_SHAPES.map(bs => (
                <Chip key={bs.value} label={bs.label} emoji={bs.icon}
                  selected={pattern.body_shapes.includes(bs.value as BodyShapeValue)}
                  onClick={() => {
                    const next = pattern.body_shapes.includes(bs.value as BodyShapeValue)
                      ? pattern.body_shapes.filter(x => x !== bs.value)
                      : [...pattern.body_shapes, bs.value as BodyShapeValue];
                    onChange({ ...pattern, body_shapes: next, errors: { ...pattern.errors, body_shapes: "" } });
                  }}
                />
              ))}
            </div>
            <FieldError msg={pattern.errors.body_shapes} />
          </div>

          {/* Color variants */}
          <div style={{ borderTop: "1.5px solid rgba(201,165,95,0.15)", paddingTop: 14 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Palette size={13} style={{ color: "#C9A75F" }} />
                <span className="text-xs font-bold" style={{ color: "#2C2416" }}>Color Variants</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(201,165,95,0.12)", color: "#C9A75F" }}>
                  {pattern.color_variants.length}
                </span>
              </div>
              <button type="button"
                onClick={() => onChange({ ...pattern, color_variants: [...pattern.color_variants, makeVariant()] })}
                className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
                style={{ background: "rgba(201,165,95,0.1)", color: "#C9A75F", border: "1px solid rgba(201,165,95,0.25)" }}>
                <Plus size={11} /> Add Color
              </button>
            </div>
            <div className="space-y-3">
              {pattern.color_variants.map((v, vi) => (
                <ColorVariantCard key={v.id} variant={v} varIdx={vi}
                  onChange={updated => {
                    const next = [...pattern.color_variants]; next[vi] = updated;
                    onChange({ ...pattern, color_variants: next });
                  }}
                  onRemove={() => {
                    if (pattern.color_variants.length <= 1) return;
                    onChange({ ...pattern, color_variants: pattern.color_variants.filter((_, i) => i !== vi) });
                  }}
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

// ─── Main Modal Component ─────────────────────────────────────────────────────

interface UploadCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (product?: any) => void;
  initialData?: any;
}

const UploadCollectionModal = ({ open, onOpenChange, onSuccess, initialData }: UploadCollectionModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Product-level fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");

  // Hierarchy
  const [patterns, setPatterns] = useState<PatternForm[]>([makePattern()]);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Load categories on open ────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    getCategories().then(c => setCategories(c || [])).catch(() => {});
  }, [open]);

  // ── Reset form on open (new product) ──────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (!initialData) {
      setTitle(""); setDescription(""); setPrice("");
      setCategoryId(""); setSubCategoryId("");
      setPatterns([makePattern()]); setErrors({});
    } else {
      // edit mode: populate base fields only (hierarchy editing not in scope)
      setTitle(initialData.title ?? "");
      setDescription(initialData.description ?? "");
      setPrice(initialData.price_cents ? (initialData.price_cents / 100).toFixed(2) : "");
      setCategoryId(initialData.category_id ?? "");
      setSubCategoryId(initialData.sub_category_id ?? "");
      setPatterns([makePattern()]);
    }
  }, [open, initialData]);

  const selectedCategory = categories.find(c => c.category_id === categoryId);
  const subCategories = selectedCategory?.subcategories?.filter(s => s.is_active) ?? [];

  // ── Validation ─────────────────────────────────────────────────────────
  const validate = () => {
    let valid = true;
    const errs: Record<string, string> = {};
    if (!title.trim()) { errs.title = "Title is required"; valid = false; }
    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) { errs.price = "Enter a valid price"; valid = false; }
    setErrors(errs);

    const updatedPatterns = patterns.map(p => {
      const patErr: Record<string, string> = {};
      if (!p.name.trim()) { patErr.name = "Pattern name is required"; valid = false; }
      if (p.body_shapes.length === 0) { patErr.body_shapes = "Select at least one body shape"; valid = false; }

      const updatedVariants = p.color_variants.map(v => {
        const vErr: Record<string, string> = {};
        if (!v.color) { vErr.color = "Select a color"; valid = false; }
        if (v.skin_tones.length === 0) { vErr.skin_tones = "Select at least one skin tone"; valid = false; }
        if (v.imageFiles.length === 0) { vErr.images = "Upload at least one image"; valid = false; }
        return { ...v, errors: vErr };
      });
      return { ...p, errors: patErr, color_variants: updatedVariants };
    });
    setPatterns(updatedPatterns);
    return valid;
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const patternsPayload = await Promise.all(
        patterns.map(async p => ({
          name: p.name,
          body_shapes: p.body_shapes,
          color_variants: await Promise.all(
            p.color_variants.map(async v => ({
              color: v.color as ClothingColorValue,
              stock: v.stock,
              skin_tones: v.skin_tones,
              images: await Promise.all(v.imageFiles.map(fileToDataUri)),
            }))
          ),
        }))
      );

      const result = await createProductHierarchy({
        title: title.trim(),
        description: description.trim() || undefined,
        price_cents: Math.round(parseFloat(price) * 100),
        category_id: categoryId || undefined,
        sub_category_id: subCategoryId || undefined,
        patterns: patternsPayload,
      });

      toast({
        title: "Product Submitted! 🎉",
        description: "Saved as DRAFT — it will go live after admin approval.",
      });

      setTimeout(() => {
        onOpenChange(false);
        if (onSuccess) onSuccess(result);
      }, 300);
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err?.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  const totalVariants = patterns.reduce((s, p) => s + p.color_variants.length, 0);
  const totalStock = patterns.reduce((s, p) => s + p.color_variants.reduce((ss, v) => ss + v.stock, 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-none [&>button]:hidden"
        style={{
          maxWidth: 680, width: "96vw", height: "92vh", maxHeight: "92vh",
          borderRadius: 20, overflow: "hidden",
          display: "flex", flexDirection: "column",
          background: "linear-gradient(135deg,#FFFDF8 0%,#FFF9EF 50%,#FFFDF8 100%)",
          border: "2px solid rgba(201,165,95,0.4)",
          boxShadow: "0 20px 60px rgba(201,165,95,0.25),0 0 40px rgba(201,165,95,0.1)",
        }}
      >
        {/* Inner top glow */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 24, pointerEvents: "none", zIndex: 0,
          background: "linear-gradient(to bottom,rgba(255,255,255,0.5),transparent 40%)",
        }} />

        {/* Close button */}
        <button type="button" onClick={() => onOpenChange(false)}
          style={{
            position: "absolute", top: 14, right: 14, zIndex: 10,
            width: 32, height: 32, borderRadius: "50%",
            border: "1.5px solid rgba(201,165,95,0.3)",
            background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#2C2416",
            boxShadow: "0 2px 8px rgba(201,165,95,0.15)",
          }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(201,165,95,0.15)"; }}
          onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.9)"; }}
        >
          <X size={15} strokeWidth={2.5} />
        </button>

        {/* Header */}
        <div style={{
          padding: "16px 20px", paddingRight: 52, flexShrink: 0, position: "relative", zIndex: 1,
          borderBottom: "1.5px solid rgba(201,165,95,0.2)",
          background: "linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,243,235,0.9))",
        }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 22, fontWeight: 700, color: "#2C2416", fontFamily: "'Playfair Display',serif" }}>
              {initialData ? "Edit " : "Upload "}
              <span style={{ background: "linear-gradient(135deg,#C9A75F,#D4B76E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Product
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Flow steps */}
          <div className="flex items-center gap-2 mt-3 text-[10px]">
            {[{ icon: Package2, label: "Product Info" }, { icon: Layers, label: "Patterns" }, { icon: Palette, label: "Colors" }].map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full"
                  style={{ background: "rgba(201,165,95,0.1)", border: "1px solid rgba(201,165,95,0.25)", color: "#2C2416" }}>
                  <Icon size={10} style={{ color: "#C9A75F" }} />
                  <span className="font-semibold">{i + 1}. {label}</span>
                </div>
                {i < 2 && <div style={{ width: 12, height: 1, background: "rgba(201,165,95,0.3)" }} />}
              </div>
            ))}
            {/* Stats pills */}
            <div className="ml-auto flex gap-1.5">
              <span className="px-2 py-0.5 rounded-full font-bold text-[10px]"
                style={{ background: "rgba(201,165,95,0.1)", color: "#C9A75F" }}>
                {patterns.length}P · {totalVariants}C · {totalStock}u
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <form id="hierarchy-upload-form" onSubmit={handleSubmit}
          className="hide-scrollbar"
          style={{ flex: 1, overflowY: "auto", padding: "14px 16px", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ══ STEP 1: Product Info ══ */}
          <div className="rounded-2xl p-4 space-y-3" style={{
            background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)",
            border: "1.5px solid rgba(201,165,95,0.25)",
            boxShadow: "0 4px 20px rgba(201,165,95,0.06)",
          }}>
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid rgba(201,165,95,0.15)" }}>
              <Package2 size={15} style={{ color: "#C9A75F" }} />
              <span className="text-xs font-bold" style={{ color: "#2C2416" }}>Product Info</span>
            </div>

            <div>
              <SectionLabel required>Title</SectionLabel>
              <LuxeInput value={title} onChange={setTitle} placeholder="e.g. Midnight Silk Blazer" icon={Tags} />
              <FieldError msg={errors.title} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <SectionLabel required>Price (₹)</SectionLabel>
                <LuxeInput value={price} onChange={setPrice} type="number" placeholder="499" icon={DollarSign} min={1} step={1} />
                <FieldError msg={errors.price} />
              </div>
              <div>
                <SectionLabel>Category</SectionLabel>
                <div className="relative">
                  <div style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(201,165,95,0.7)", pointerEvents: "none" }}>
                    <FolderTree size={14} />
                  </div>
                  <select value={categoryId}
                    onChange={e => { setCategoryId(e.target.value); setSubCategoryId(""); }}
                    style={{ width: "100%", padding: "10px 10px 10px 34px", borderRadius: 10, border: "1.5px solid rgba(201,165,95,0.3)", background: "rgba(255,255,255,0.85)", color: "#1a1408", fontSize: 12, fontWeight: 600, outline: "none" }}>
                    <option value="">Select category</option>
                    {categories.filter(c => c.is_active).map(c => (
                      <option key={c.category_id} value={c.category_id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {subCategories.length > 0 && (
              <div>
                <SectionLabel>Subcategory</SectionLabel>
                <select value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(201,165,95,0.3)", background: "rgba(255,255,255,0.85)", color: "#1a1408", fontSize: 12, fontWeight: 600, outline: "none" }}>
                  <option value="">Select subcategory</option>
                  {subCategories.map(s => (
                    <option key={s.sub_category_id} value={s.sub_category_id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <SectionLabel>Description</SectionLabel>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Tell the story behind this creation..."
                rows={2}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(201,165,95,0.3)", background: "rgba(255,255,255,0.85)", color: "#1a1408", fontSize: 13, fontWeight: 500, outline: "none", resize: "none" }}
                onFocus={e => e.target.style.borderColor = "#C9A75F"}
                onBlur={e => e.target.style.borderColor = "rgba(201,165,95,0.3)"}
              />
            </div>
          </div>

          {/* ══ STEP 2 & 3: Patterns + Colors ══ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Layers size={14} style={{ color: "#C9A75F" }} />
                <span className="text-xs font-bold" style={{ color: "#2C2416" }}>Patterns & Colors</span>
              </div>
            </div>

            {/* Hint */}
            <div className="flex items-start gap-2 rounded-xl px-3 py-2 mb-3"
              style={{ background: "rgba(201,165,95,0.07)", border: "1px solid rgba(201,165,95,0.2)" }}>
              <Info size={12} style={{ color: "#C9A75F", marginTop: 1, flexShrink: 0 }} />
              <p className="text-[11px]" style={{ color: "rgba(44,36,22,0.6)", lineHeight: 1.5 }}>
                Add <strong>Patterns</strong> (fits like Slim/Relaxed), then inside each pattern add
                <strong> Color Variants</strong> with stock and photos.
              </p>
            </div>

            <div className="space-y-3">
              {patterns.map((p, pi) => (
                <PatternCard key={p.id} pattern={p} patIdx={pi}
                  onChange={updated => {
                    const next = [...patterns]; next[pi] = updated; setPatterns(next);
                  }}
                  onRemove={() => {
                    if (!window.confirm("Remove this pattern?")) return;
                    setPatterns(prev => prev.filter((_, i) => i !== pi));
                  }}
                  canRemove={patterns.length > 1}
                />
              ))}
            </div>

            <button type="button"
              onClick={() => setPatterns(p => [...p, makePattern()])}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{
                border: "2px dashed rgba(201,165,95,0.3)", color: "#C9A75F",
                background: "rgba(201,165,95,0.03)",
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "#C9A75F"; e.currentTarget.style.background = "rgba(201,165,95,0.07)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(201,165,95,0.3)"; e.currentTarget.style.background = "rgba(201,165,95,0.03)"; }}
            >
              <Plus size={13} /> Add Pattern
            </button>
          </div>

          {/* Extra bottom padding for sticky footer */}
          <div style={{ height: 16 }} />
        </form>

        {/* ══ Sticky Footer ══ */}
        <div style={{
          flexShrink: 0, borderTop: "1.5px solid rgba(201,165,95,0.2)",
          background: "rgba(255,253,248,0.95)", backdropFilter: "blur(12px)",
          padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          position: "relative", zIndex: 5,
        }}>
          <div className="flex items-center gap-3 text-[11px]" style={{ color: "rgba(44,36,22,0.5)" }}>
            <span><strong style={{ color: "#2C2416" }}>{patterns.length}</strong> pattern{patterns.length !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span><strong style={{ color: "#2C2416" }}>{totalVariants}</strong> color{totalVariants !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span><strong style={{ color: "#2C2416" }}>{totalStock}</strong> units</span>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ border: "1.5px solid rgba(201,165,95,0.3)", color: "#2C2416", background: "rgba(255,255,255,0.7)" }}>
              Cancel
            </button>
            <button type="submit" form="hierarchy-upload-form" disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg,#C9A75F,#D4B76E)",
                color: "#2C2416", border: "none",
                boxShadow: "0 4px 16px rgba(201,165,95,0.35)",
              }}>
              {isLoading
                ? <><Loader2 size={13} className="animate-spin" /> Uploading…</>
                : <><Upload size={13} /> Submit Product</>}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadCollectionModal;
