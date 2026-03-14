import { useState, useEffect } from "react";
import {
    Upload, X, Loader2, Check, ChevronDown, ChevronRight,
    Package, Tags, DollarSign, Search, Sparkles, Heart,
    Users, Palette, Ruler, CalendarRange, ImageIcon, ArrowRight,
    FolderTree, Layers
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createProduct, updateProduct, getCreatorGroups, getCategories, type ProductGroup, type Category, type SubCategory } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { LuxeButton } from "@/components/common/Buttons/LuxeButton";
import { compressImage } from "@/lib/utils";

// ─── Option Constants (matching recommendation enums) ───────────────────────
const OCCASIONS = ['Formal', 'Party', 'Wedding', 'Casual luxury', 'Resort'];
const BODY_SHAPES = ['Rectangle', 'Hourglass', 'Pear Shape', 'Apple Shape', 'Inverted Triangle'];
const SKIN_TONES = ['Light', 'Medium', 'Dusky', 'Deep'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'];

// ─── Group Helpers ──────────────────────────────────────────────────────────
interface GroupOption extends ProductGroup {
    level: number;
}

const flattenGroupsTree = (groups: ProductGroup[], result: GroupOption[] = [], level = 0): GroupOption[] => {
    for (const group of groups) {
        result.push({ ...group, level });
        if (group.children_groups && group.children_groups.length > 0) {
            flattenGroupsTree(group.children_groups, result, level + 1);
        }
    }
    return result;
};

// ─── Collapsible Section (Aura-style) ───────────────────────────────────────
const CollapsibleSection = ({
    title,
    icon: Icon,
    defaultOpen = true,
    children,
    badge,
}: {
    title: string;
    icon: React.ElementType;
    defaultOpen?: boolean;
    children: React.ReactNode;
    badge?: string;
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div
            className="rounded-2xl overflow-hidden transition-all duration-300"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(248,243,235,0.8))',
                border: '1.5px solid rgba(201, 165, 95, 0.25)',
                boxShadow: isOpen ? '0 4px 20px rgba(201, 165, 95, 0.1)' : 'none',
            }}
        >
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-5 py-4 transition-all duration-200 hover:bg-white/40"
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(201,165,95,0.15), rgba(201,165,95,0.08))' }}
                    >
                        <Icon size={16} className="text-gold" style={{ color: '#C9A75F' }} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2C2416' }}>
                        {title}
                    </span>
                    {badge && (
                        <span
                            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                            style={{
                                background: 'linear-gradient(135deg, rgba(201,165,95,0.15), rgba(201,165,95,0.08))',
                                color: '#C9A75F',
                            }}
                        >
                            {badge}
                        </span>
                    )}
                </div>
                <ChevronDown
                    size={16}
                    className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: '#C9A75F' }}
                />
            </button>

            <div
                style={{
                    maxHeight: isOpen ? '2500px' : '0px',
                    opacity: isOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.4s ease-in-out, opacity 0.3s ease-in-out',
                }}
            >
                <div style={{ padding: '4px 20px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

// ─── Attribute Multi-Select Dropdown (Aura-style) ───────────────────────────
const AttributeDropdown = ({
    label,
    options,
    selected,
    onToggle,
    icon: Icon,
    placeholder,
}: {
    label: string;
    options: string[];
    selected: string[];
    onToggle: (value: string) => void;
    icon: React.ElementType;
    placeholder?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(44,36,22,0.7)' }}>
                {label}
            </label>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className="w-full relative transition-all duration-300"
                        style={{
                            padding: '12px 16px 12px 44px',
                            borderRadius: '12px',
                            border: isOpen ? '2px solid #C9A75F' : '2px solid rgba(201,165,95,0.3)',
                            background: 'rgba(255,255,255,0.8)',
                            backdropFilter: 'blur(8px)',
                            color: '#2C2416',
                            fontSize: '14px',
                            fontWeight: 500,
                            textAlign: 'left',
                            cursor: 'pointer',
                            boxShadow: isOpen ? '0 0 0 3px rgba(201,165,95,0.1)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        {/* Left icon */}
                        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,165,95,0.7)', pointerEvents: 'none' }}>
                            <Icon size={18} />
                        </div>
                        <span style={{ color: selected.length > 0 ? '#2C2416' : 'rgba(44,36,22,0.4)', fontWeight: selected.length > 0 ? 600 : 400 }}>
                            {selected.length > 0
                                ? `${selected.length} selected — ${selected.slice(0, 3).join(', ')}${selected.length > 3 ? '...' : ''}`
                                : placeholder || `Select ${label}`}
                        </span>
                        <ChevronDown
                            size={16}
                            style={{
                                color: '#C9A75F',
                                transition: 'transform 0.3s ease',
                                transform: isOpen ? 'rotate(180deg)' : 'none',
                                flexShrink: 0,
                            }}
                        />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="p-0 shadow-2xl"
                    align="start"
                    style={{
                        width: 'var(--radix-popover-trigger-width)',
                        borderRadius: '14px',
                        border: '1.5px solid rgba(201,165,95,0.3)',
                        background: 'linear-gradient(135deg, #FFFDF8, #FFF9EF)',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ padding: '6px' }}>
                        {options.map((option) => {
                            const isSelected = selected.includes(option);
                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => onToggle(option)}
                                    className="w-full transition-all duration-200"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: isSelected
                                            ? 'linear-gradient(135deg, rgba(201,165,95,0.12), rgba(201,165,95,0.06))'
                                            : 'transparent',
                                        marginBottom: '2px',
                                    }}
                                >
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: isSelected ? 700 : 500,
                                        color: isSelected ? '#2C2416' : 'rgba(44,36,22,0.7)',
                                    }}>
                                        {option}
                                    </span>
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '6px',
                                        border: isSelected ? '2px solid #C9A75F' : '2px solid rgba(201,165,95,0.25)',
                                        background: isSelected ? 'linear-gradient(135deg, #C9A75F, #D4B76E)' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                        flexShrink: 0,
                                    }}>
                                        {isSelected && <Check size={12} strokeWidth={3} style={{ color: '#fff' }} />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Selected chips below */}
            {selected.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {selected.map(item => (
                        <span
                            key={item}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '3px 10px 3px 12px',
                                borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                                background: 'linear-gradient(135deg, rgba(201,165,95,0.12), rgba(201,165,95,0.06))',
                                border: '1px solid rgba(201,165,95,0.3)',
                                color: '#2C2416',
                            }}
                        >
                            {item}
                            <button
                                type="button"
                                onClick={() => onToggle(item)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'rgba(44,36,22,0.5)', display: 'flex' }}
                            >
                                <X size={10} strokeWidth={3} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────────
interface UploadCollectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (product?: any) => void;
    initialData?: any;
}

const UploadCollectionModal = ({ open, onOpenChange, onSuccess, initialData }: UploadCollectionModalProps) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [formData, setFormData] = useState({
        title: "", description: "", price: "0.00", currency: "INR",
        inventory: "0", tags: "", group_ids: [] as string[],
        category_id: "", sub_category_id: "",
        occasions: [] as string[], body_shapes: [] as string[],
        skin_tones: [] as string[], sizes: [] as string[], age_ranges: [] as string[],
    });
    const [images, setImages] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [rawGroups, setRawGroups] = useState<ProductGroup[]>([]);
    const [availableGroups, setAvailableGroups] = useState<GroupOption[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [groupSearchQuery, setGroupSearchQuery] = useState("");

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [groupsData, catsData] = await Promise.all([
                    getCreatorGroups(),
                    getCategories()
                ]);
                setRawGroups(groupsData || []);
                setAvailableGroups(flattenGroupsTree(groupsData || []));
                setCategories(catsData || []);
            } catch (e) { /* ignore */ }
        };
        if (open) fetchInitialData();
    }, [open]);

    const toggleExpand = (groupId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
            return next;
        });
    };

    const renderGroupNode = (group: ProductGroup, level: number) => {
        const hasChildren = group.children_groups && group.children_groups.length > 0;
        const isExpanded = expandedGroups.has(group.group_id);
        const isSelected = formData.group_ids.includes(group.group_id);
        return (
            <div key={group.group_id} style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                    onClick={() => toggleGroup(group.group_id)}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                        marginLeft: `${level * 16}px`, marginTop: '3px',
                        border: isSelected ? '1.5px solid rgba(201,165,95,0.5)' : '1.5px solid transparent',
                        background: isSelected ? 'rgba(201,165,95,0.08)' : 'transparent',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        {hasChildren ? (
                            <button type="button" onClick={(e) => toggleExpand(group.group_id, e)} style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#C9A75F', flexShrink: 0 }}>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        ) : <div style={{ width: 24, flexShrink: 0 }} />}
                        <span style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 500, color: '#2C2416' }}>{group.name}</span>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: isSelected ? '2px solid #C9A75F' : '2px solid rgba(201,165,95,0.25)', background: isSelected ? 'linear-gradient(135deg, #C9A75F, #D4B76E)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isSelected && <Check size={10} strokeWidth={4} style={{ color: '#fff' }} />}
                    </div>
                </div>
                {hasChildren && isExpanded && group.children_groups.map(child => renderGroupNode(child, level + 1))}
            </div>
        );
    };

    useEffect(() => {
        if (initialData && open) {
            const meta = initialData.metadata || {};
            setFormData({
                title: initialData.title || "", description: initialData.description || "",
                price: initialData.price_cents ? (initialData.price_cents / 100).toFixed(2) : "0.00",
                currency: initialData.currency || "INR",
                inventory: initialData.inventory_count?.toString() || "0",
                tags: initialData.tags ? initialData.tags.map((t: any) => t.name || t).join(", ") : "",
                group_ids: initialData.group_assignments ? initialData.group_assignments.map((g: any) => g.group_id) : [],
                category_id: initialData.category_id || "",
                sub_category_id: initialData.sub_category_id || "",
                occasions: initialData.occasions || meta.occasions || [],
                body_shapes: initialData.body_shapes || meta.body_shapes || [],
                skin_tones: initialData.skin_tones || meta.skin_tones || [],
                sizes: initialData.sizes || meta.sizes || [],
                age_ranges: initialData.age_ranges || meta.age_ranges || [],
            });
            let imgs = initialData.images || [];
            if (imgs.length === 0 && initialData.image && !initialData.image.includes("placehold.co")) imgs = [initialData.image];
            setImages(imgs);
        } else if (!initialData && open) {
            setFormData({ title: "", description: "", price: "0.00", currency: "INR", inventory: "0", tags: "", group_ids: [], category_id: "", sub_category_id: "", occasions: [], body_shapes: [], skin_tones: [], sizes: [], age_ranges: [] });
            setImages([]); setImageFiles([]);
        }
    }, [initialData, open]);

    const toggleGroup = (groupId: string) => {
        setFormData(prev => ({ ...prev, group_ids: prev.group_ids.includes(groupId) ? prev.group_ids.filter(id => id !== groupId) : [...prev.group_ids, groupId] }));
    };

    const toggleAttribute = (field: 'occasions' | 'body_shapes' | 'skin_tones' | 'sizes' | 'age_ranges', value: string) => {
        setFormData(prev => ({ ...prev, [field]: prev[field].includes(value) ? prev[field].filter((v: string) => v !== value) : [...prev[field], value] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (images.length === 0) {
            toast({ title: "Image Required", description: "Please upload at least one product image.", variant: "destructive" });
            return;
        }
        setIsLoading(true); setUploadProgress("Finalizing...");
        try {
            const tags = formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(t => t).map(t => ({ name: t })) : [];
            const productData = {
                title: formData.title, description: formData.description || undefined,
                price_cents: Math.round(parseFloat(formData.price) * 100), currency: formData.currency,
                inventory_count: parseInt(formData.inventory) || 0, images,
                tags: tags.length > 0 ? tags : undefined,
                group_ids: formData.group_ids.length > 0 ? formData.group_ids : undefined,
                category_id: formData.category_id || undefined,
                sub_category_id: formData.sub_category_id || undefined,
                occasions: formData.occasions, body_shapes: formData.body_shapes,
                skin_tones: formData.skin_tones, sizes: formData.sizes, age_ranges: formData.age_ranges,
            };
            setUploadProgress(initialData ? "Updating..." : "Uploading...");
            const response = initialData ? await updateProduct(initialData.product_id, productData) : await createProduct(productData);
            toast({ title: "Success!", description: initialData ? "Product updated." : "Product launched!" });
            setTimeout(() => { onOpenChange(false); if (onSuccess) onSuccess(response); }, 300);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Something went wrong.", variant: "destructive" });
        } finally { setIsLoading(false); setUploadProgress(""); }
    };

    const processFiles = async (files: File[]) => {
        for (const file of files) {
            if (file.type.startsWith("image/")) {
                try {
                    const compressed = await compressImage(file);
                    setImages(p => [...p, compressed]); setImageFiles(p => [...p, file]);
                } catch {
                    const reader = new FileReader();
                    reader.onloadend = () => { setImages(p => [...p, reader.result as string]); setImageFiles(p => [...p, file]); };
                    reader.readAsDataURL(file);
                }
            }
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) await processFiles(Array.from(e.target.files)); };
    const removeImage = (i: number) => { setImages(p => p.filter((_, idx) => idx !== i)); setImageFiles(p => p.filter((_, idx) => idx !== i)); };
    const selectedGroupNames = availableGroups.filter(g => formData.group_ids.includes(g.group_id)).map(g => g.name);
    const filteredGroups = availableGroups.filter(g => g.name.toLowerCase().includes(groupSearchQuery.toLowerCase()));
    const totalAttrs = formData.occasions.length + formData.body_shapes.length + formData.skin_tones.length + formData.sizes.length + formData.age_ranges.length;

    const selectedCategory = categories.find(c => c.category_id === formData.category_id);
    const availableSubCategories = selectedCategory?.subcategories?.filter(s => s.is_active) || [];

    // Aura-style input class
    const inputCls: React.CSSProperties = {
        width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px',
        border: '2px solid rgba(201,165,95,0.3)', background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)', color: '#1a1408', fontSize: '14px', fontWeight: 600,
        outline: 'none', transition: 'all 0.3s ease', textAlign: 'left' as const,
    };

    // Force placeholder + input text color/alignment via CSS
    const inputStyleOverrides = `
      .upload-modal-form input,
      .upload-modal-form textarea,
      .upload-modal-form select {
        color: #1a1408 !important;
        text-align: left !important;
      }
      .upload-modal-form input::placeholder,
      .upload-modal-form textarea::placeholder {
        color: rgba(44,36,22,0.4) !important;
        text-align: left !important;
        font-weight: 400 !important;
      }
    `;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="p-0 border-none [&>button]:hidden"
                style={{
                    // @ts-ignore
                    '--input-color': '#1a1408',
                    maxWidth: '680px', width: '95vw', height: '90vh', maxHeight: '90vh',
                    borderRadius: '24px', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    background: 'linear-gradient(135deg, #FFFDF8 0%, #FFF9EF 50%, #FFFDF8 100%)',
                    border: '2px solid rgba(201,165,95,0.4)',
                    boxShadow: '0 20px 60px rgba(201,165,95,0.25), 0 0 40px rgba(201,165,95,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
            >
                {/* Inner glow */}
                <div style={{ position: 'absolute', inset: 0, borderRadius: '24px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent 40%)', pointerEvents: 'none', zIndex: 0 }} />

                {/* Custom Close Button */}
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    style={{
                        position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                        width: '34px', height: '34px', borderRadius: '50%',
                        border: '1.5px solid rgba(201,165,95,0.3)',
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s ease',
                        color: '#2C2416',
                        boxShadow: '0 2px 8px rgba(201,165,95,0.15)',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(201,165,95,0.15)'; e.currentTarget.style.borderColor = '#C9A75F'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.borderColor = 'rgba(201,165,95,0.3)'; }}
                >
                    <X size={16} strokeWidth={2.5} />
                </button>

                {/* Header */}
                <div style={{
                    padding: '20px 28px', paddingRight: '60px', flexShrink: 0, position: 'relative', zIndex: 1,
                    borderBottom: '1.5px solid rgba(201,165,95,0.2)',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,243,235,0.9))',
                }}>
                    <DialogHeader>
                        <DialogTitle style={{
                            fontSize: '24px', fontWeight: 700, color: '#2C2416',
                            fontFamily: "'Playfair Display', serif",
                        }}>
                            {initialData ? "Edit " : "Upload "}
                            <span style={{
                                background: 'linear-gradient(135deg, #C9A75F, #D4B76E)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>Product</span>
                        </DialogTitle>
                    </DialogHeader>
                    <p style={{ fontSize: '13px', color: 'rgba(44,36,22,0.55)', marginTop: '4px', fontWeight: 500 }}>
                        Fill in your product details and choose who it's designed for.
                    </p>
                </div>

                {/* Style overrides for input visibility & alignment */}
                <style>{inputStyleOverrides}</style>

                {/* Scrollable Body */}
                <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', position: 'relative', zIndex: 1 }}>
                    <form onSubmit={handleSubmit} className="upload-modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                        {/* ─── 1. Product Information ──────────────────── */}
                        <CollapsibleSection title="Product Details" icon={Package} defaultOpen={true}>
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(44,36,22,0.7)' }}>
                                    Title <span style={{ color: '#e74c3c' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,165,95,0.7)', pointerEvents: 'none' }}>
                                        <Tags size={18} />
                                    </div>
                                    <input
                                        type="text" required placeholder="e.g., Midnight Silk Blazer"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        style={inputCls}
                                        onFocus={(e) => { e.target.style.borderColor = '#C9A75F'; e.target.style.boxShadow = '0 0 0 3px rgba(201,165,95,0.1)'; }}
                                        onBlur={(e) => { e.target.style.borderColor = 'rgba(201,165,95,0.3)'; e.target.style.boxShadow = 'none'; }}
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(44,36,22,0.7)' }}>Description</label>
                                <textarea
                                    placeholder="Tell the story behind this creation..."
                                    rows={3} value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    style={{ ...inputCls, paddingLeft: '16px', resize: 'none' }}
                                    onFocus={(e) => { e.target.style.borderColor = '#C9A75F'; }}
                                    onBlur={(e) => { e.target.style.borderColor = 'rgba(201,165,95,0.3)'; }}
                                />
                            </div>

                            {/* Price + Stock row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(44,36,22,0.7)' }}>
                                        Price (INR) <span style={{ color: '#e74c3c' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,165,95,0.7)', pointerEvents: 'none' }}>
                                            <DollarSign size={18} />
                                        </div>
                                        <input
                                            type="number" required step="0.01" min="0" value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            style={{ ...inputCls, fontWeight: 700 }}
                                            onFocus={(e) => { e.target.style.borderColor = '#C9A75F'; }}
                                            onBlur={(e) => { e.target.style.borderColor = 'rgba(201,165,95,0.3)'; }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(44,36,22,0.7)' }}>Stock</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,165,95,0.7)', pointerEvents: 'none' }}>
                                            <Package size={18} />
                                        </div>
                                        <input
                                            type="number" min="0" value={formData.inventory}
                                            onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                                            style={{ ...inputCls, fontWeight: 700 }}
                                            onFocus={(e) => { e.target.style.borderColor = '#C9A75F'; }}
                                            onBlur={(e) => { e.target.style.borderColor = 'rgba(201,165,95,0.3)'; }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* ─── 2. Classification & Targeting ─────────────────────── */}
                        <CollapsibleSection
                            title="Classification & Targeting"
                            icon={Sparkles}
                            defaultOpen={true}
                            badge={totalAttrs > 0 ? `${totalAttrs} filters` : undefined}
                        >
                            {/* Gradient accent bar + Quote */}
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                                    borderRadius: '4px',
                                    background: 'linear-gradient(to bottom, #C9A75F, #D4B76E, #C9A75F)',
                                    boxShadow: '0 0 8px rgba(201,165,95,0.3)',
                                }} />
                                <div style={{ paddingLeft: '16px' }}>
                                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', fontWeight: 700, color: '#2C2416', marginBottom: '4px' }}>
                                        Help us classify your creation ✨
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'rgba(44,36,22,0.55)', lineHeight: 1.5, fontWeight: 500 }}>
                                        Select category and attributes to power our AI recommendation engine.
                                    </p>
                                </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(44,36,22,0.7)' }}>
                                        Category <span style={{ color: '#e74c3c' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,165,95,0.7)', pointerEvents: 'none', zIndex: 10 }}>
                                            <FolderTree size={18} />
                                        </div>
                                        <select
                                            required
                                            value={formData.category_id}
                                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value, sub_category_id: "" })}
                                            style={inputCls}
                                            onFocus={(e) => { e.target.style.borderColor = '#C9A75F'; }}
                                            onBlur={(e) => { e.target.style.borderColor = 'rgba(201,165,95,0.3)'; }}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.filter(c => c.is_active).map(c => (
                                                <option key={c.category_id} value={c.category_id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(44,36,22,0.7)' }}>
                                        Subcategory
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,165,95,0.7)', pointerEvents: 'none', zIndex: 10 }}>
                                            <Layers size={18} />
                                        </div>
                                        <select
                                            value={formData.sub_category_id}
                                            onChange={(e) => setFormData({ ...formData, sub_category_id: e.target.value })}
                                            style={inputCls}
                                            disabled={!formData.category_id || availableSubCategories.length === 0}
                                            onFocus={(e) => { e.target.style.borderColor = '#C9A75F'; }}
                                            onBlur={(e) => { e.target.style.borderColor = 'rgba(201,165,95,0.3)'; }}
                                        >
                                            <option value="">Select Subcategory</option>
                                            {availableSubCategories.map(s => (
                                                <option key={s.sub_category_id} value={s.sub_category_id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <AttributeDropdown
                                label="Occasions" icon={Heart} options={OCCASIONS}
                                selected={formData.occasions}
                                onToggle={(v) => toggleAttribute('occasions', v)}
                                placeholder="What occasions does this suit?"
                            />
                            <AttributeDropdown
                                label="Body Shapes" icon={Users} options={BODY_SHAPES}
                                selected={formData.body_shapes}
                                onToggle={(v) => toggleAttribute('body_shapes', v)}
                                placeholder="Which body shapes fit best?"
                            />
                            <AttributeDropdown
                                label="Skin Tones" icon={Palette} options={SKIN_TONES}
                                selected={formData.skin_tones}
                                onToggle={(v) => toggleAttribute('skin_tones', v)}
                                placeholder="Which skin tones complement?"
                            />
                            <AttributeDropdown
                                label="Sizes" icon={Ruler} options={SIZES}
                                selected={formData.sizes}
                                onToggle={(v) => toggleAttribute('sizes', v)}
                                placeholder="Available sizes?"
                            />
                            <AttributeDropdown
                                label="Age Range" icon={CalendarRange} options={AGE_RANGES}
                                selected={formData.age_ranges}
                                onToggle={(v) => toggleAttribute('age_ranges', v)}
                                placeholder="Target age groups?"
                            />
                        </CollapsibleSection>

                        {/* ─── 3. Tags, Collections & Media ──────────────── */}
                        <CollapsibleSection title="Tags & Images" icon={ImageIcon} defaultOpen={true}>
                            {/* Search tags */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(44,36,22,0.7)' }}>Search Tags</label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,165,95,0.7)', pointerEvents: 'none' }}>
                                        <Tags size={18} />
                                    </div>
                                    <input
                                        type="text" placeholder="silk, blazer, evening..."
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        style={inputCls}
                                        onFocus={(e) => { e.target.style.borderColor = '#C9A75F'; }}
                                        onBlur={(e) => { e.target.style.borderColor = 'rgba(201,165,95,0.3)'; }}
                                    />
                                </div>
                            </div>

                            {/* Collections */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(44,36,22,0.7)' }}>Collections</label>
                                <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                                    <PopoverTrigger asChild>
                                        <button type="button" className="w-full transition-all" style={{
                                            ...inputCls, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            textAlign: 'left', cursor: 'pointer', paddingLeft: '16px',
                                            color: 'rgba(44,36,22,0.4)', fontStyle: 'italic',
                                        }}>
                                            <span>Select collections...</span>
                                            <ChevronDown size={16} style={{ color: '#C9A75F', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0 shadow-2xl" align="start" style={{
                                        width: '380px', borderRadius: '14px', border: '1.5px solid rgba(201,165,95,0.3)',
                                        background: 'linear-gradient(135deg, #FFFDF8, #FFF9EF)', overflow: 'hidden',
                                    }}>
                                        <div style={{ padding: '10px', borderBottom: '1px solid rgba(201,165,95,0.1)' }}>
                                            <div style={{ position: 'relative' }}>
                                                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,165,95,0.5)' }} />
                                                <input type="text" placeholder="Search..." value={groupSearchQuery} onChange={(e) => setGroupSearchQuery(e.target.value)}
                                                    style={{ ...inputCls, paddingLeft: '34px', fontSize: '13px', padding: '8px 12px 8px 34px' }} />
                                            </div>
                                        </div>
                                        <div className="hide-scrollbar" style={{ maxHeight: '260px', overflowY: 'auto', padding: '6px' }}>
                                            {groupSearchQuery.trim() !== "" ? (
                                                filteredGroups.length > 0 ? filteredGroups.map(g => (
                                                    <div key={g.group_id} onClick={() => toggleGroup(g.group_id)}
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', background: formData.group_ids.includes(g.group_id) ? 'rgba(201,165,95,0.08)' : 'transparent', border: formData.group_ids.includes(g.group_id) ? '1px solid rgba(201,165,95,0.4)' : '1px solid transparent' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: formData.group_ids.includes(g.group_id) ? 700 : 500, color: '#2C2416' }}>{g.name}</span>
                                                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: formData.group_ids.includes(g.group_id) ? '2px solid #C9A75F' : '2px solid rgba(201,165,95,0.25)', background: formData.group_ids.includes(g.group_id) ? '#C9A75F' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {formData.group_ids.includes(g.group_id) && <Check size={9} strokeWidth={4} style={{ color: '#fff' }} />}
                                                        </div>
                                                    </div>
                                                )) : <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(44,36,22,0.4)', fontSize: '12px' }}>No results</div>
                                            ) : rawGroups.length > 0 ? rawGroups.map(g => renderGroupNode(g, 0)) : <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(44,36,22,0.4)', fontSize: '12px' }}>No categories</div>}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                {selectedGroupNames.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                                        {selectedGroupNames.map(name => {
                                            const gid = availableGroups.find(g => g.name === name)?.group_id;
                                            return (
                                                <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px 3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: 'rgba(201,165,95,0.1)', border: '1px solid rgba(201,165,95,0.3)', color: '#2C2416' }}>
                                                    {name}
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); if (gid) toggleGroup(gid); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'rgba(44,36,22,0.5)', display: 'flex' }}>
                                                        <X size={10} strokeWidth={3} />
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(44,36,22,0.7)' }}>
                                    Product Images <span style={{ color: '#e74c3c' }}>*</span>
                                </label>
                                <label style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    width: '100%', minHeight: '140px', borderRadius: '16px', cursor: 'pointer',
                                    border: '2.5px dashed rgba(201,165,95,0.35)', background: 'rgba(255,255,255,0.6)',
                                    transition: 'all 0.3s ease',
                                }}
                                    onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#C9A75F'; (e.currentTarget as HTMLElement).style.background = 'rgba(201,165,95,0.04)'; }}
                                    onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,165,95,0.35)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.6)'; }}
                                >
                                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(201,165,95,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                                        <Upload size={20} style={{ color: '#C9A75F' }} />
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#2C2416' }}>
                                        {images.length > 0 ? `${images.length} Selected` : "Drop Images Here"}
                                    </span>
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(44,36,22,0.4)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        JPG • PNG • WEBP
                                    </span>
                                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                </label>

                                {images.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '10px' }}>
                                        {images.map((img, idx) => (
                                            <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid rgba(201,165,95,0.25)' }}>
                                                <img src={img} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                    <X size={10} strokeWidth={3} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CollapsibleSection>

                        {/* ─── Actions ────────────────────────────────── */}
                        <div style={{ display: 'flex', gap: '10px', paddingTop: '4px', paddingBottom: '12px' }}>
                            <button
                                type="button" onClick={() => onOpenChange(false)}
                                style={{
                                    flex: 1, height: '48px', borderRadius: '16px',
                                    fontWeight: 700, fontSize: '13px',
                                    color: '#2C2416', border: '2px solid rgba(201,165,95,0.3)',
                                    background: 'white', cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit" disabled={isLoading}
                                className="group"
                                style={{
                                    flex: 2, height: '48px', borderRadius: '16px',
                                    fontWeight: 700, fontSize: '14px',
                                    color: '#2C2416', border: 'none', cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #C9A75F 0%, #D4B76E 100%)',
                                    boxShadow: '0 8px 24px rgba(201,165,95,0.35), 0 0 30px rgba(201,165,95,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    transition: 'all 0.3s ease',
                                    opacity: isLoading ? 0.7 : 1,
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span style={{ fontSize: '12px' }}>{uploadProgress || "Launching..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        {initialData ? "Save Changes" : "Launch Product"}
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UploadCollectionModal;
