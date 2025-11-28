import { useState } from "react";
import { Upload, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createProduct, updateProduct } from "@/lib/api";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { LuxeButton } from "@/components/common/Buttons/LuxeButton";
import { compressImage } from "@/lib/utils";

interface UploadCollectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    initialData?: any;
}

const UploadCollectionModal = ({ open, onOpenChange, onSuccess, initialData }: UploadCollectionModalProps) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "0.00",
        currency: "INR",
        inventory: "0",
        tags: "",
    });
    const [images, setImages] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);

    useEffect(() => {
        if (initialData && open) {
            setFormData({
                title: initialData.title || "",
                description: initialData.description || "",
                price: initialData.price_cents ? (initialData.price_cents / 100).toFixed(2) : "0.00",
                currency: initialData.currency || "INR",
                inventory: initialData.inventory_count?.toString() || "0",
                tags: initialData.tags ? initialData.tags.map((t: any) => t.name || t).join(", ") : "",
            });

            // Robust image population: use images array if available, otherwise fallback to single image
            // Filter out placeholder images if possible, though checking for "placehold.co" is a simple heuristic
            let imgs = initialData.images || [];
            if (imgs.length === 0 && initialData.image && !initialData.image.includes("placehold.co")) {
                imgs = [initialData.image];
            }
            setImages(imgs);
        } else if (!initialData && open) {
            // Reset form for new upload
            setFormData({
                title: "",
                description: "",
                price: "0.00",
                currency: "INR",
                inventory: "0",
                tags: "",
            });
            setImages([]);
            setImageFiles([]);
        }
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (images.length === 0) {
            toast({
                title: "Error",
                description: "Please upload at least one image",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            // Parse tags
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
            };

            console.log("Submitting product data:", productData);

            if (initialData) {
                console.log("Updating product with ID:", initialData.product_id);
                await updateProduct(initialData.product_id, productData);
            } else {
                await createProduct(productData);
            }

            toast({
                title: "Success",
                description: `Product ${initialData ? "updated" : "uploaded"} successfully`,
            });

            // Reset form
            setFormData({
                title: "",
                description: "",
                price: "0.00",
                currency: "INR",
                inventory: "0",
                tags: "",
            });
            setImages([]);
            setImageFiles([]);
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `Failed to ${initialData ? "update" : "upload"} product`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const [isDragging, setIsDragging] = useState(false);

    const processFiles = async (files: File[]) => {
        // Process files sequentially to avoid freezing UI
        for (const file of files) {
            if (file.type.startsWith("image/")) {
                try {
                    const compressedBase64 = await compressImage(file);
                    setImages((prev) => [...prev, compressedBase64]);
                    setImageFiles((prev) => [...prev, file]);
                } catch (error) {
                    console.error("Error compressing image:", error);
                    // Fallback to original if compression fails
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

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files) {
            const filesArray = Array.from(e.dataTransfer.files);
            await processFiles(filesArray);
        }
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="dashboard-theme bg-foreground text-primary-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-primary-foreground">
                        {initialData ? "Edit Collection" : "Upload New Collection"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    {/* Product Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Product Title <span className="text-gold">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., Elegant Summer Dress"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 bg-muted-foreground/20 border border-gold/50 rounded-lg text-primary-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                            placeholder="Describe your product..."
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-muted-foreground/20 border border-muted-foreground/30 rounded-lg text-primary-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold resize-none"
                        />
                    </div>

                    {/* Inventory Count - Moved up as requested */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Inventory Count</label>
                        <input
                            type="number"
                            min="0"
                            value={formData.inventory}
                            onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                            className="w-full px-4 py-3 bg-muted-foreground/20 border border-muted-foreground/30 rounded-lg text-primary-foreground focus:outline-none focus:border-gold"
                        />
                    </div>

                    {/* Price and Currency */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Price (₹) <span className="text-gold">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-4 py-3 bg-muted-foreground/20 border border-muted-foreground/30 rounded-lg text-primary-foreground focus:outline-none focus:border-gold"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Currency</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full px-4 py-3 bg-muted-foreground/20 border border-muted-foreground/30 rounded-lg text-primary-foreground focus:outline-none focus:border-gold appearance-none cursor-pointer"
                            >
                                <option value="INR">INR - Indian Rupee</option>
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                            </select>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                        <input
                            type="text"
                            placeholder="e.g., dress, summer, elegant, casual"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            className="w-full px-4 py-3 bg-muted-foreground/20 border border-muted-foreground/30 rounded-lg text-primary-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold"
                        />
                        <p className="text-xs text-muted-foreground/60 mt-1">Separate tags with commas</p>
                    </div>

                    {/* Product Images */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Product Images <span className="text-gold">*</span>
                        </label>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <label
                                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging
                                    ? "border-gold bg-gold/10"
                                    : "border-muted-foreground/40 hover:border-gold"
                                    }`}
                            >
                                <Upload className={`w-8 h-8 mb-2 ${isDragging ? "text-gold" : "text-muted-foreground/60"}`} />
                                <span className={`text-sm ${isDragging ? "text-gold" : "text-muted-foreground/60"}`}>
                                    {images.length > 0
                                        ? `${images.length} file(s) selected`
                                        : "Click or Drag to upload images"}
                                </span>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        {/* Image Preview */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                {images.map((image, index) => (
                                    <div
                                        key={index}
                                        className="relative group rounded-lg overflow-hidden border border-muted-foreground/30"
                                    >
                                        <img
                                            src={image}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-24 object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                        <LuxeButton
                            type="button"
                            variant="luxury-outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </LuxeButton>
                        <LuxeButton
                            type="submit"
                            variant="luxury"
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isLoading ? (initialData ? "Updating..." : "Uploading...") : (initialData ? "Update Collection" : "Upload Collection")}
                        </LuxeButton>
                    </div>
                </form>
            </DialogContent >
        </Dialog >
    );
};

export default UploadCollectionModal;
