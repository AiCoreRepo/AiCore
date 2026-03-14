import React, { useState, useEffect } from "react";
import { Loader2, FolderTree } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createCategory, updateCategory, createSubCategory, updateSubCategory } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface CategoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any; // Category or SubCategory
    parentId?: string | null; // If provided, we are creating/editing a subcategory
}

export const CategoryModal = ({
    open,
    onOpenChange,
    onSuccess,
    initialData,
    parentId
}: CategoryModalProps) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        slug: "",
        is_active: true,
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    name: initialData.name || "",
                    description: initialData.description || "",
                    slug: initialData.slug || "",
                    is_active: initialData.is_active ?? true,
                });
            } else {
                setFormData({
                    name: "",
                    description: "",
                    slug: "",
                    is_active: true,
                });
            }
        }
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast({
                title: "Error",
                description: "Name is required",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                name: formData.name,
                description: formData.description || undefined,
                slug: formData.slug || undefined,
                is_active: formData.is_active,
            };

            const isSub = !!parentId;
            const isEdit = !!initialData;
            const targetId = isSub ? initialData?.sub_category_id : initialData?.category_id;

            if (isSub) {
                if (isEdit) {
                    await updateSubCategory(targetId, payload);
                } else {
                    await createSubCategory(parentId, payload);
                }
            } else {
                if (isEdit) {
                    await updateCategory(targetId, payload);
                } else {
                    await createCategory(payload);
                }
            }

            toast({
                title: "✅ Success!",
                description: isEdit
                    ? "Updated successfully."
                    : "Created successfully.",
                duration: 5000,
            });

            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            toast({
                title: "❌ Save Failed",
                description: error.message || `Failed to save. Please try again.`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const isSub = !!parentId;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* 
              Midnight Luxury Theme for Modal 
              Matches UploadCollectionModal styles 
            */}
            <DialogContent className="bg-[#0f0a05] border border-[#D4AF37]/30 text-white w-[95vw] max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl p-0 hide-scrollbar">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a140d] to-[#0f0a05] pointer-events-none" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative p-4 sm:p-6 sm:px-8 z-10 w-full h-full">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-serif text-[#D4AF37] flex items-center gap-3">
                            <FolderTree className="w-6 h-6" />
                            {initialData ? `Edit ${isSub ? 'SubCategory' : 'Category'}` : `Create ${isSub ? 'SubCategory' : 'Category'}`}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 admin-dark-form">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-neutral-300">
                                Name <span className="text-[#D4AF37]">*</span>
                            </label>
                            {/* CRITICAL FIX: Ensure input text color is visible (e.g. white instead of dark on dark) */}
                            <input
                                type="text"
                                required
                                placeholder="e.g., Summer Collection"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                            />
                        </div>

                        {/* URL Identifier */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-neutral-300">
                                URL Identifier (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., summer-collection"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                            />
                            <p className="text-xs text-neutral-500 mt-2">Unique link for this category. Leave blank to auto-generate.</p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-neutral-300">Description</label>
                            <textarea
                                placeholder="Optional explanation..."
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all resize-none"
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-5 h-5 rounded border-neutral-700 text-[#D4AF37] focus:ring-[#D4AF37] bg-neutral-900/50"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-neutral-300 cursor-pointer">
                                Active (visible to creators)
                            </label>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-5 sm:pt-6 pb-2 border-t border-neutral-800">
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="flex-1 py-3 px-4 bg-transparent border border-neutral-700 text-neutral-300 rounded-xl hover:bg-neutral-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 py-3 px-4 bg-[#D4AF37] text-neutral-950 rounded-xl hover:bg-[#F3E5AB] font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};
