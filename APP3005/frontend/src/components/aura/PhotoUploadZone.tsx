import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose } from "@/components/ui/dialog";

interface PhotoUploadZoneProps {
    onPhotoSelect: (file: File, preview: string) => void;
    photoPreview: string | null;
    onRemove: () => void;
}

export const PhotoUploadZone = ({ onPhotoSelect, photoPreview, onRemove }: PhotoUploadZoneProps) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "image/*": [] },
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                const preview = URL.createObjectURL(file);
                onPhotoSelect(file, preview);
            }
        },
    });

    return (
        <div className="w-full">
            {!photoPreview ? (
                <div
                    {...getRootProps()}
                    className={`relative border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group
            ${isDragActive
                            ? "border-gold bg-gold/5 scale-[1.02]"
                            : "border-gold/40 hover:border-gold hover:bg-gold/5"
                        }`}
                    style={{ height: "180px" }}
                >
                    <input {...getInputProps()} />

                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 1 }}
                            animate={{ scale: isDragActive ? 1.1 : 1 }}
                            className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-3"
                        >
                            <Upload className="w-6 h-6 text-gold" />
                        </motion.div>

                        <p className="text-sm font-medium text-charcoal mb-1">
                            {isDragActive ? "Drop your photo here" : "Drag & drop your photo"}
                        </p>
                        <p className="text-xs text-grey-soft mb-1">or click to browse</p>
                        <p className="text-xs text-gold/70">Full-body photo recommended</p>
                    </div>
                </div>
            ) : (
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="relative rounded-xl overflow-hidden border-2 border-gold/30 group cursor-pointer" style={{ height: "180px" }}>
                            <img
                                src={photoPreview}
                                alt="Preview"
                                className="w-full h-full object-cover object-top"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ImageIcon className="w-4 h-4 text-ivory" />
                                <span className="text-xs text-ivory font-medium">Click to expand</span>
                            </div>

                            {/* Move X button outside of the click interaction for expansion if possible, or stop propagation */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove();
                                }}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-charcoal/80 hover:bg-charcoal flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
                            >
                                <X className="w-4 h-4 text-ivory" />
                            </button>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl w-full h-[80vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center [&>button]:hidden">
                        <DialogTitle className="sr-only">Photo Preview</DialogTitle>
                        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                            <img
                                src={photoPreview}
                                alt="Full size preview"
                                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl pointer-events-auto"
                            />

                            {/* Custom Close Button */}
                            <div className="absolute top-4 right-4 pointer-events-auto">
                                <DialogClose className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/20">
                                    <X className="w-5 h-5" />
                                    <span className="sr-only">Close</span>
                                </DialogClose>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            <p className="text-xs text-grey-soft mt-2 flex items-start gap-1.5">
                <span className="text-gold mt-0.5">ℹ</span>
                <span>We only use this photo to create your avatar. You can delete it anytime.</span>
            </p>
        </div>
    );
};
