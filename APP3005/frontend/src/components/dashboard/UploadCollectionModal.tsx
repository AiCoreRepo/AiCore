import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createProduct, updateProduct } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { LuxeButton } from "@/components/common/Buttons/LuxeButton";
import { compressImage } from "@/lib/utils";

interface UploadCollectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (product?: any) => void;
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

            let response;
            if (initialData) {
                response = await updateProduct(initialData.product_id, productData);
            } else {
                response = await createProduct(productData);
            }

            toast({
                title: "Success",
                description: `Product ${initialData ? "updated" : "uploaded"} successfully`,
            });

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
            if (onSuccess) onSuccess(response);
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
        for (const file of files) {
            if (file.type.startsWith("image/")) {
                try {
                    const compressedBase64 = await compressImage(file);
                    setImages((prev) => [...prev, compressedBase64]);
                    setImageFiles((prev) => [...prev, file]);
                } catch (error) {
                    console.error("Error compressing image:", error);
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
            <DialogContent className="bg-gradient-to-br from-luxury-cream via-white to-luxury-cream/80 text-luxury-charcoal max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-luxury-gold shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-serif text-luxury-charcoal bg-gradient-to-r from-luxury-gold to-amber-600 bg-clip-text text-transparent">
                        {initialData ? "Edit Collection" : "Upload New Collection"}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                    {/* Left Side: Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Product Title */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-luxury-charcoal">
                                Product Title <span className="text-luxury-gold">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g., Elegant Summer Dress"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 bg-white border-2 border-luxury-gold/30 rounded-lg text-luxury-charcoal placeholder:text-gray-400 focus:outline-none focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/20 transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-luxury-charcoal">Description</label>
                            <textarea
                                placeholder="Describe your product..."
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-white border-2 border-luxury-gold/30 rounded-lg text-luxury-charcoal placeholder:text-gray-400 focus:outline-none focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/20 resize-none transition-all"
                            />
                        </div>

                        {/* Inventory Count */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-luxury-charcoal">Inventory Count</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.inventory}
                                onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                                className="w-full px-4 py-3 bg-white border-2 border-luxury-gold/30 rounded-lg text-luxury-charcoal focus:outline-none focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/20 transition-all"
                            />
                        </div>

                        {/* Price and Currency */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-luxury-charcoal">
                                    Price (₹) <span className="text-luxury-gold">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    min="0"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-luxury-gold/30 rounded-lg text-luxury-charcoal focus:outline-none focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-luxury-charcoal">Currency</label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-luxury-gold/30 rounded-lg text-luxury-charcoal focus:outline-none focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/20 appearance-none cursor-pointer transition-all"
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
                            <label className="block text-sm font-medium mb-2 text-luxury-charcoal">Tags (comma-separated)</label>
                            <input
                                type="text"
                                placeholder="e.g., dress, summer, elegant, casual"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                className="w-full px-4 py-3 bg-white border-2 border-luxury-gold/30 rounded-lg text-luxury-charcoal placeholder:text-gray-400 focus:outline-none focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/20 transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                        </div>

                        {/* Submit Buttons (Mobile only) */}
                        <div className="flex gap-3 pt-4 md:hidden">
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

                    {/* Right Side: Image Upload & Quote */}
                    <div className="flex flex-col h-full">
                        {/* Quote Section */}
                        <div className="mb-6 p-6 bg-gradient-to-br from-luxury-gold/20 via-amber-100/30 to-luxury-gold/10 rounded-xl border-2 border-luxury-gold/40 text-center shadow-lg">
                            <p className="font-serif text-xl text-luxury-gold italic mb-2 drop-shadow-sm">
                                "Capture the Essence."
                            </p>
                            <p className="text-sm text-luxury-charcoal/80 leading-relaxed">
                                Upload multiple angles to help our AI reveal the true spirit of your design.
                            </p>
                        </div>

                        {/* Product Images */}
                        <div className="flex-1 flex flex-col">
                            <label className="block text-sm font-medium mb-2 text-luxury-charcoal">
                                Product Images <span className="text-luxury-gold">*</span>
                            </label>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className="flex-1 min-h-[200px]"
                            >
                                <label
                                    className={`flex flex-col items-center justify-center w-full h-full min-h-[200px] border-2 border-dashed rounded-lg cursor-pointer transition-all ${isDragging
                                        ? "border-luxury-gold bg-luxury-gold/20 shadow-lg"
                                        : "border-luxury-gold/40 hover:border-luxury-gold hover:bg-luxury-gold/5"
                                        }`}
                                >
                                    <Upload className={`w-10 h-10 mb-3 ${isDragging ? "text-luxury-gold" : "text-luxury-gold/60"}`} />
                                    <span className={`text-base font-medium ${isDragging ? "text-luxury-gold" : "text-luxury-charcoal/70"}`}>
                                        {images.length > 0
                                            ? `${images.length} file(s) selected`
                                            : "Click or Drag to upload images"}
                                    </span>
                                    <span className="text-xs text-gray-500 mt-2">
                                        Supports JPG, PNG, WEBP
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
                                <div className="grid grid-cols-3 gap-3 mt-4 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                    {images.map((image, index) => (
                                        <div
                                            key={index}
                                            className="relative group rounded-lg overflow-hidden border-2 border-luxury-gold/30 aspect-square hover:border-luxury-gold transition-all"
                                        >
                                            <img
                                                src={image}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit Buttons (Desktop) */}
                        <div className="hidden md:flex gap-3 pt-6 mt-auto">
                            <LuxeButton
                                type="button"
                                variant="luxury-outline"
                                onClick={() => onOpenChange(false)}
                                className="flex-1"
                            >
                                Cancel
                            </LuxeButton>
                            <LuxeButton
                                type="button"
                                onClick={(e) => handleSubmit(e as any)}
                                variant="luxury"
                                disabled={isLoading}
                                className="flex-1"
                            >
                                {isLoading ? (initialData ? "Updating..." : "Uploading...") : (initialData ? "Update Collection" : "Upload Collection")}
                            </LuxeButton>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UploadCollectionModal;
