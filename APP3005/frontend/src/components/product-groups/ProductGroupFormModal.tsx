import React, { useState, useEffect } from "react";
import { Loader2, FolderTree } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createProductGroup, updateProductGroup, type ProductGroup } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ProductGroupFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    initialData?: Partial<ProductGroup>;
    availableParents?: ProductGroup[];
}

export const ProductGroupFormModal = ({
    open,
    onOpenChange,
    onSuccess,
    initialData,
    availableParents = []
}: ProductGroupFormModalProps) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        parent_id: "",
    });

    useEffect(() => {
        if (initialData && open) {
            setFormData({
                name: initialData.name || "",
                description: initialData.description || "",
                parent_id: initialData.parent_id || "",
            });
        } else if (!initialData && open) {
            setFormData({
                name: "",
                description: "",
                parent_id: "",
            });
        }
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast({
                title: "Error",
                description: "Grouping name is required",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                name: formData.name,
                description: formData.description || undefined,
                parent_id: formData.parent_id || null,
            };

            if (initialData && initialData.group_id) {
                // Determine if we need to send empty string or actually null to clear the parent
                await updateProductGroup(initialData.group_id, {
                  ...payload,
                  parent_id: payload.parent_id === null ? null : payload.parent_id,
                });
            } else {
                await createProductGroup({
                  ...payload,
                  parent_id: payload.parent_id === null ? undefined : payload.parent_id,
                });
            }

            toast({
                title: "✅ Success!",
                description: initialData
                    ? "Grouping updated successfully."
                    : "Grouping created successfully.",
                duration: 5000,
            });

            setTimeout(() => {
                onOpenChange(false);
                if (onSuccess) onSuccess();
            }, 300);

        } catch (error: any) {
            console.error("Save error:", error);
            toast({
                title: "❌ Save Failed",
                description: error.message || `Failed to ${initialData ? "update" : "create"} grouping. Please try again.`,
                variant: "destructive",
                duration: 5000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Filter out the current group and any of its descendants if editing
    // so user can't pick themselves or their children as a parent
    const safeParents = availableParents.filter(p => p.group_id !== initialData?.group_id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-gradient-to-br from-luxury-cream via-white to-luxury-cream/80 text-luxury-charcoal max-w-lg border-2 border-luxury-gold shadow-2xl rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif text-luxury-charcoal bg-gradient-to-r from-luxury-gold to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
                        <FolderTree className="w-6 h-6 text-luxury-gold" />
                        {initialData && initialData.group_id ? "Edit Grouping" : "Create New Grouping"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-luxury-charcoal">
                            Grouping Name <span className="text-luxury-gold">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., Summer Collection"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-luxury-gold/30 rounded-xl text-luxury-charcoal placeholder:text-gray-400 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold outline-none transition-all"
                        />
                    </div>

                    {/* Parent Grouping */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-luxury-charcoal">Parent Grouping (Optional)</label>
                        <select
                            value={formData.parent_id}
                            onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-luxury-gold/30 rounded-xl text-luxury-charcoal focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold outline-none appearance-none cursor-pointer transition-all"
                        >
                            <option value="">None (Top Level)</option>
                            {safeParents.map((parent) => (
                                <option key={parent.group_id} value={parent.group_id}>
                                    {parent.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-stone-500 mt-2">Nesting groupings helps categorize your collection.</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-luxury-charcoal">Description</label>
                        <textarea
                            placeholder="Optional explanation of this category..."
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-luxury-gold/30 rounded-xl text-luxury-charcoal placeholder:text-gray-400 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold outline-none resize-none transition-all"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 py-3 px-4 bg-transparent border border-stone-300 text-stone-600 rounded-xl hover:bg-stone-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 py-3 px-4 bg-luxury-gold text-white rounded-xl hover:bg-luxury-gold/90 shadow hover:shadow-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Grouping"
                            )}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
