import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { X, Upload, Plus, X as XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createProduct } from "@/lib/api";
import CurrencySelect from "@/components/common/CurrencySelect";
import { showApprovalToast, showErrorToast } from "@/components/common/ToastNotification";

interface UploadProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  currency: string;
  inventory_count: string;
  tags: string;
}

const UploadProductForm: React.FC<UploadProductFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    defaultValues: {
      currency: "INR",
      inventory_count: "0",
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setImages((prev) => [...prev, result]);
          setImageFiles((prev) => [...prev, file]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
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
      // Convert base64 images to data URLs (or you can upload to a storage service)
      const imageUrls = images; // For now, using base64. In production, upload to S3/Cloudinary

      // Parse tags
      const tags = data.tags
        ? data.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
            .map((tag) => ({ name: tag }))
        : [];

      await createProduct({
        title: data.title,
        description: data.description || undefined,
        price_cents: Math.round(parseFloat(data.price) * 100),
        currency: data.currency,
        inventory_count: parseInt(data.inventory_count) || 0,
        image_urls: imageUrls,
        tags: tags.length > 0 ? tags : undefined,
      });

      // Show approval toast notification
      showApprovalToast(
        "Product Submitted for Approval",
        "Your product has been uploaded successfully. Please wait for admin approval. It will be listed on the dashboard once approved."
      );

      // Reset form
      reset();
      setImages([]);
      setImageFiles([]);
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      showErrorToast(
        "Upload Failed",
        (error as Error).message || "Failed to upload product. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-luxury-black border-luxury-charcoal">
        <DialogHeader>
          <DialogTitle className="text-3xl font-serif text-luxury-gold">
            Upload New Outfit
          </DialogTitle>
          <DialogDescription className="text-luxury-cream/70">
            Fill in the details below to add your product to the marketplace
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Product Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-luxury-cream">
              Product Title *
            </Label>
            <Input
              id="title"
              {...register("title", { required: "Product title is required" })}
              placeholder="e.g., Elegant Summer Dress"
              className="bg-luxury-charcoal border-luxury-charcoal text-luxury-cream placeholder:text-muted-foreground focus:border-luxury-gold focus:ring-luxury-gold"
            />
            {errors.title && (
              <p className="text-sm text-red-400">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-luxury-cream">
              Description
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe your product..."
              rows={4}
              className="bg-luxury-charcoal border-luxury-charcoal text-luxury-cream placeholder:text-muted-foreground focus:border-luxury-gold focus:ring-luxury-gold resize-none"
            />
          </div>

          {/* Price and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-luxury-cream">
                Price (₹) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register("price", {
                  required: "Price is required",
                  min: { value: 0, message: "Price must be positive" },
                })}
                placeholder="0.00"
                className="bg-luxury-charcoal border-luxury-charcoal text-luxury-cream placeholder:text-muted-foreground focus:border-luxury-gold focus:ring-luxury-gold"
              />
              {errors.price && (
                <p className="text-sm text-red-400">{errors.price.message}</p>
              )}
            </div>

            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <CurrencySelect
                  value={field.value}
                  onValueChange={field.onChange}
                  label="Currency"
                  className="space-y-2"
                />
              )}
            />
          </div>

          {/* Inventory */}
          <div className="space-y-2">
            <Label htmlFor="inventory_count" className="text-luxury-cream">
              Inventory Count
            </Label>
            <Input
              id="inventory_count"
              type="number"
              min="0"
              {...register("inventory_count")}
              placeholder="0"
              className="bg-luxury-charcoal border-luxury-charcoal text-luxury-cream placeholder:text-muted-foreground focus:border-luxury-gold focus:ring-luxury-gold"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-luxury-cream">
              Tags (comma-separated)
            </Label>
            <Input
              id="tags"
              {...register("tags")}
              placeholder="e.g., dress, summer, elegant, casual"
              className="bg-luxury-charcoal border-luxury-charcoal text-luxury-cream placeholder:text-muted-foreground focus:border-luxury-gold focus:ring-luxury-gold"
            />
            <p className="text-xs text-luxury-cream/60">
              Separate tags with commas
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-luxury-cream">Product Images *</Label>
            <div className="border-2 border-dashed border-luxury-charcoal rounded-lg p-6 hover:border-luxury-gold transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="w-12 h-12 text-luxury-gold mb-2" />
                <p className="text-luxury-cream font-medium">
                  Click to upload images
                </p>
                <p className="text-sm text-luxury-cream/60 mt-1">
                  PNG, JPG, GIF up to 10MB
                </p>
              </label>
            </div>

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="relative group rounded-lg overflow-hidden border border-luxury-charcoal"
                  >
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                reset();
                setImages([]);
                setImageFiles([]);
                onOpenChange(false);
              }}
              className="px-6 py-3 rounded-md border-2 border-luxury-charcoal bg-transparent text-luxury-cream hover:bg-luxury-charcoal hover:text-luxury-cream font-medium transition-all duration-300"
              style={{ 
                color: 'hsl(var(--luxury-cream))',
                borderColor: 'hsl(var(--luxury-charcoal))'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-md font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                color: '#0a0a0a',
                backgroundColor: 'hsl(var(--luxury-gold))'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#e2c670';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'hsl(var(--luxury-gold))';
                }
              }}
            >
              {isLoading ? "Uploading..." : "Upload Product"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadProductForm;

