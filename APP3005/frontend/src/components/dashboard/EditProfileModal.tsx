import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LuxeButton } from "@/components/common/Buttons/LuxeButton";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "@/lib/api";
import { Upload, X } from "lucide-react";
import { compressImage } from "@/lib/utils";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/cropImage"; // We'll need to create this utility

interface EditProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: {
        name: string;
        subtitle: string;
        avatar: string;
    };
    onSuccess: () => void;
}

const EditProfileModal = ({ open, onOpenChange, user, onSuccess }: EditProfileModalProps) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user.name,
        subtitle: user.subtitle,
        avatar: user.avatar,
    });
    const [isDragging, setIsDragging] = useState(false);

    // Cropper state
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropping, setIsCropping] = useState(false);

    useEffect(() => {
        if (open) {
            setFormData({
                name: user.name,
                subtitle: user.subtitle,
                avatar: user.avatar,
            });
            setImageSrc(null);
            setIsCropping(false);
        }
    }, [open, user]);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleImageUpload = async (file: File) => {
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setImageSrc(reader.result as string);
                setIsCropping(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await handleImageUpload(e.target.files[0]);
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
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleImageUpload(e.dataTransfer.files[0]);
        }
    };

    const handleSaveCrop = async () => {
        try {
            if (imageSrc && croppedAreaPixels) {
                const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
                // Compress the cropped image
                // Convert blob url to file/blob for compression if needed, 
                // but getCroppedImg usually returns a blob URL or base64. 
                // Let's assume getCroppedImg returns base64 for simplicity here or we convert.

                setFormData(prev => ({ ...prev, avatar: croppedImage }));
                setIsCropping(false);
                setImageSrc(null);
            }
        } catch (e) {
            console.error(e);
            toast({
                title: "Error",
                description: "Failed to crop image",
                variant: "destructive",
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await updateProfile(formData);
            toast({
                title: "Success",
                description: "Profile updated successfully",
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="dashboard-theme bg-foreground text-primary-foreground max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-primary-foreground">
                        Edit Profile
                    </DialogTitle>
                </DialogHeader>

                {isCropping && imageSrc ? (
                    <div className="flex flex-col h-[400px]">
                        <div className="relative flex-1 bg-black rounded-lg overflow-hidden mb-4">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>
                        <div className="flex gap-3">
                            <LuxeButton
                                type="button"
                                variant="luxury-outline"
                                onClick={() => {
                                    setIsCropping(false);
                                    setImageSrc(null);
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </LuxeButton>
                            <LuxeButton
                                type="button"
                                variant="luxury"
                                onClick={handleSaveCrop}
                                className="flex-1"
                            >
                                Apply Crop
                            </LuxeButton>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 bg-muted-foreground/20 border border-muted-foreground/30 rounded-lg text-primary-foreground focus:outline-none focus:border-gold"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Subtitle</label>
                            <input
                                type="text"
                                value={formData.subtitle}
                                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                className="w-full px-4 py-2 bg-muted-foreground/20 border border-muted-foreground/30 rounded-lg text-primary-foreground focus:outline-none focus:border-gold"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Avatar</label>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden ${isDragging
                                    ? "border-gold bg-gold/10"
                                    : "border-muted-foreground/40 hover:border-gold"
                                    }`}
                            >
                                {formData.avatar && !formData.avatar.startsWith('data:') ? (
                                    <div className="relative w-full h-full group">
                                        <div className="w-full h-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center">
                                            <span className="text-4xl font-bold text-neutral-950">
                                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                            </span>
                                        </div>
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <p className="text-white text-sm font-medium">Click to change</p>
                                        </div>
                                    </div>
                                ) : formData.avatar ? (
                                    <div className="relative w-full h-full group">
                                        <img
                                            src={formData.avatar}
                                            alt="Avatar Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <p className="text-white text-sm font-medium">Click to change</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFormData(prev => ({ ...prev, avatar: "" }));
                                            }}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10 pointer-events-auto"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className={`w-8 h-8 mb-2 ${isDragging ? "text-gold" : "text-muted-foreground/60"}`} />
                                        <span className={`text-sm ${isDragging ? "text-gold" : "text-muted-foreground/60"}`}>
                                            Click or Drag to upload
                                        </span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={onFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

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
                                {isLoading ? "Saving..." : "Save Changes"}
                            </LuxeButton>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default EditProfileModal;
