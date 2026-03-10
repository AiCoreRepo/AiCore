import { useState, useEffect } from "react";
import { Upload, X, Loader2, Check, ChevronDown, Package, Tags, DollarSign, Search } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createProduct, updateProduct, getCreatorGroups, type ProductGroup } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { LuxeButton } from "@/components/common/Buttons/LuxeButton";
import { compressImage } from "@/lib/utils";

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
        title: "",
        description: "",
        price: "0.00",
        currency: "INR",
        inventory: "0",
        tags: "",
        group_ids: [] as string[],
    });
    const [images, setImages] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    
    // Groupings State
    const [availableGroups, setAvailableGroups] = useState<GroupOption[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [groupSearchQuery, setGroupSearchQuery] = useState("");

    useEffect(() => {
        const fetchGroups = async () => {
             try {
                const data = await getCreatorGroups();
                setAvailableGroups(flattenGroupsTree(data || []));
             } catch (e) {
                // Not a creator or fetch failed
             }
        };
        if (open) fetchGroups();
    }, [open]);

    useEffect(() => {
        if (initialData && open) {
            setFormData({
                title: initialData.title || "",
                description: initialData.description || "",
                price: initialData.price_cents ? (initialData.price_cents / 100).toFixed(2) : "0.00",
                currency: initialData.currency || "INR",
                inventory: initialData.inventory_count?.toString() || "0",
                tags: initialData.tags ? initialData.tags.map((t: any) => t.name || t).join(", ") : "",
                group_ids: initialData.group_assignments ? initialData.group_assignments.map((g: any) => g.group_id) : [],
            });

            let imgs = initialData.images || [];
            if (imgs.length === 0 && initialData.image && !initialData.image.includes("placehold.co")) {
                imgs = [initialData.image];
            }
            setImages(imgs);
        } else if (!initialData && open) {
            setFormData({
                title: "",
                description: "",
                price: "0.00",
                currency: "INR",
                inventory: "0",
                tags: "",
                group_ids: [],
            });
            setImages([]);
            setImageFiles([]);
        }
    }, [initialData, open]);

    const toggleGroup = (groupId: string) => {
        setFormData(prev => ({
            ...prev,
            group_ids: prev.group_ids.includes(groupId)
                ? prev.group_ids.filter(id => id !== groupId)
                : [...prev.group_ids, groupId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (images.length === 0) {
            toast({
                title: "Validation Error",
                description: "At least one product image is required.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        setUploadProgress("Finalizing product details...");

        try {
            const tags = formData.tags
                ? formData.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag.length > 0)
                    .map((tag) => ({ name: tag }))
                : [];

            const productData = {
                title: formData.title,
                description: formData.description || undefined,
                price_cents: Math.round(parseFloat(formData.price) * 100),
                currency: formData.currency,
                inventory_count: parseInt(formData.inventory) || 0,
                images: images,
                tags: tags.length > 0 ? tags : undefined,
                group_ids: formData.group_ids.length > 0 ? formData.group_ids : undefined,
            };

            setUploadProgress(initialData ? "Updating masterpiece..." : "Uploading new product...");

            let response;
            if (initialData) {
                response = await updateProduct(initialData.product_id, productData);
            } else {
                response = await createProduct(productData);
            }

            toast({
                title: "Success",
                description: initialData ? "Product updated successfully." : "Product launched successfully!",
                duration: 5000,
            });

            setTimeout(() => {
                onOpenChange(false);
                if (onSuccess) onSuccess(response);
            }, 300);

        } catch (error: any) {
            console.error("Upload error:", error);
            toast({
                title: "Action Failed",
                description: error.message || "Something went wrong during product upload.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            setUploadProgress("");
        }
    };

    const processFiles = async (files: File[]) => {
        for (const file of files) {
            if (file.type.startsWith("image/")) {
                try {
                    const compressedBase64 = await compressImage(file);
                    setImages((prev) => [...prev, compressedBase64]);
                    setImageFiles((prev) => [...prev, file]);
                } catch (error) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImages((prev) => [...prev, reader.result as string]);
                        setImageFiles((prev) => [...prev, file]);
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            await processFiles(filesArray);
        }
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const filteredGroups = availableGroups.filter(g => 
        g.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
    );

    const selectedGroupNames = availableGroups
        .filter(g => formData.group_ids.includes(g.group_id))
        .map(g => g.name);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white text-luxury-charcoal max-w-5xl h-[92vh] md:h-auto md:max-h-[92vh] overflow-hidden p-0 border-none shadow-2xl rounded-[1.5rem]">
                <div className="flex flex-col h-full max-h-[92vh]">
                    {/* High-Visibility Header */}
                    <div className="p-8 pb-4 bg-slate-50 flex justify-between items-center border-b border-slate-200">
                        <DialogHeader>
                            <DialogTitle className="text-3xl md:text-4xl font-serif font-black tracking-tight text-luxury-charcoal">
                                {initialData ? "Edit" : "Upload"} <span className="text-luxury-gold">Product</span>
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Left Column: Essential Info */}
                            <div className="lg:col-span-7 space-y-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-6 bg-luxury-gold rounded-full" />
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Product Information</h3>
                                    </div>
                                    
                                    {/* Product Title */}
                                    <div className="group">
                                        <label className="block text-xs font-black uppercase tracking-wider mb-2 text-slate-700 group-focus-within:text-luxury-gold transition-colors">
                                            Product Title <span className="text-red-500 font-bold">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g., Midnight Silk Blazer"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-luxury-charcoal placeholder:text-slate-400 focus:outline-none focus:border-luxury-gold focus:bg-white transition-all font-semibold"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider mb-2 text-slate-700">Description</label>
                                        <textarea
                                            placeholder="Tell the story of this creation..."
                                            rows={4}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-luxury-charcoal placeholder:text-slate-400 focus:outline-none focus:border-luxury-gold focus:bg-white resize-none transition-all font-medium h-[120px]"
                                        />
                                    </div>

                                    {/* Pricing Row */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="group">
                                            <label className="block text-xs font-black uppercase tracking-wider mb-2 text-slate-700 flex items-center gap-1.5">
                                                <DollarSign size={14} className="text-luxury-gold" /> Price (INR) <span className="text-red-500 font-bold">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    required
                                                    step="0.01"
                                                    min="0"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-luxury-charcoal focus:outline-none focus:border-luxury-gold focus:bg-white transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-wider mb-2 text-slate-700 flex items-center gap-1.5">
                                                <Package size={14} className="text-luxury-gold" /> Stock
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.inventory}
                                                onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-luxury-charcoal focus:outline-none focus:border-luxury-gold focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-6 bg-luxury-gold rounded-full" />
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Classification</h3>
                                    </div>
                                    
                                    {/* Tags */}
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider mb-2 text-slate-700 flex items-center gap-1.5">
                                            <Tags size={14} className="text-luxury-gold" /> Search Tags
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., silk, blazer, evening"
                                            value={formData.tags}
                                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-luxury-charcoal placeholder:text-slate-400 focus:outline-none focus:border-luxury-gold transition-all font-semibold"
                                        />
                                    </div>

                                    {/* Simplified Structured Category Dropdown */}
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider mb-2 text-slate-700">Add to Collections</label>
                                        <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                                            <PopoverTrigger asChild>
                                                <button 
                                                    type="button"
                                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-between text-left hover:border-slate-300 transition-all focus:border-luxury-gold outline-none"
                                                >
                                                    <span className="text-slate-400 font-semibold italic">Select collections...</span>
                                                    <ChevronDown className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-luxury-gold' : ''}`} size={20} />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0 bg-white border-slate-200 shadow-2xl rounded-xl overflow-hidden" align="start">
                                                <div className="p-3 border-b border-slate-100 bg-slate-50">
                                                    <div className="relative">
                                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input 
                                                            type="text" 
                                                            placeholder="Search categories..."
                                                            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-sm text-luxury-charcoal focus:outline-none focus:border-luxury-gold transition-all font-semibold"
                                                            value={groupSearchQuery}
                                                            onChange={(e) => setGroupSearchQuery(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar space-y-1">
                                                    {filteredGroups.length > 0 ? (
                                                        filteredGroups.map(group => (
                                                            <div 
                                                                key={group.group_id}
                                                                onClick={() => toggleGroup(group.group_id)}
                                                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                                                                    formData.group_ids.includes(group.group_id)
                                                                        ? 'bg-luxury-gold/10 text-luxury-charcoal font-black border border-luxury-gold/50'
                                                                        : 'hover:bg-slate-50 text-slate-600 font-semibold'
                                                                }`}
                                                                style={{ paddingLeft: `${(group.level * 16) + 12}px` }}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {group.level > 0 && <div className="w-1 h-1 rounded-full bg-slate-300" />}
                                                                    <span className="text-sm truncate max-w-[200px]">{group.name}</span>
                                                                </div>
                                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                                    formData.group_ids.includes(group.group_id)
                                                                        ? 'bg-luxury-gold border-luxury-gold text-white'
                                                                        : 'border-slate-200'
                                                                }`}>
                                                                    {formData.group_ids.includes(group.group_id) && <Check size={12} strokeWidth={4} />}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="py-8 text-center text-slate-400 italic text-xs">
                                                            No categories found.
                                                        </div>
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>

                                        {/* Selected Categories Display Below */}
                                        {formData.group_ids.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                                {selectedGroupNames.map(name => {
                                                    const groupId = availableGroups.find(g => g.name === name)?.group_id;
                                                    return (
                                                        <span key={name} className="inline-flex items-center gap-1.5 bg-luxury-gold/10 text-luxury-charcoal text-[11px] font-black px-3 py-1.5 rounded-lg border border-luxury-gold/30">
                                                            {name}
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (groupId) toggleGroup(groupId);
                                                                }}
                                                                className="hover:text-red-500 transition-colors"
                                                            >
                                                                <X size={12} strokeWidth={3} />
                                                            </button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Visuals */}
                            <div className="lg:col-span-5 flex flex-col gap-10">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-6 bg-luxury-gold rounded-full" />
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Product Media</h3>
                                    </div>

                                    {/* Simplified Quote Box - Light & Re-styled */}
                                    <div className="p-8 bg-slate-50 rounded-[2rem] text-center border-2 border-slate-100 shadow-sm relative overflow-hidden group/quote">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/5 rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover/quote:scale-150" />
                                        <p className="font-serif text-3xl font-black italic text-luxury-gold mb-3 relative z-10">Expose the Soul</p>
                                        <div className="w-12 h-1 bg-luxury-gold/20 mx-auto mb-4 rounded-full" />
                                        <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed px-4 relative z-10">
                                            Multiple angles show the quality of your creation.
                                        </p>
                                    </div>

                                    {/* Image Upload Area */}
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">Product Images <span className="text-red-500 font-bold">*</span></label>
                                        <div className="relative min-h-[300px]">
                                            <label className="flex flex-col items-center justify-center w-full min-h-[300px] border-[3px] border-dashed border-slate-200 rounded-[2rem] cursor-pointer transition-all hover:border-luxury-gold hover:bg-slate-50 group/upload bg-white shadow-inner">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover/upload:scale-110 group-hover/upload:bg-luxury-gold/10 transition-all duration-500">
                                                    <Upload className="w-8 h-8 text-luxury-gold" />
                                                </div>
                                                <span className="text-lg font-black tracking-tight text-luxury-charcoal">
                                                    {images.length > 0 ? `${images.length} Selected` : "Drop Images Here"}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">JPG • PNG • WEBP</span>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>

                                        {/* Image Grid Preview */}
                                        {images.length > 0 && (
                                            <div className="grid grid-cols-3 gap-4 pt-2">
                                                {images.map((image, index) => (
                                                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group/img shadow-md hover:border-luxury-gold transition-all">
                                                        <img src={image} alt={`Preview ${index}`} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all hover:bg-red-500"
                                                        >
                                                            <X size={12} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-auto pt-10 flex flex-col sm:flex-row gap-4">
                                    <button
                                        type="button"
                                        onClick={() => onOpenChange(false)}
                                        className="h-16 flex-1 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 hover:text-luxury-charcoal hover:bg-slate-100 transition-all border-2 border-slate-200"
                                    >
                                        Cancel
                                    </button>
                                    <LuxeButton
                                        type="submit"
                                        variant="luxury"
                                        disabled={isLoading}
                                        className="h-16 flex-[2] rounded-xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest shadow-lg active:scale-95"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span className="text-[10px]">{uploadProgress || "Launching..."}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check size={20} strokeWidth={4} />
                                                {initialData ? "Save Changes" : "Launch Product"}
                                            </>
                                        )}
                                    </LuxeButton>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UploadCollectionModal;
