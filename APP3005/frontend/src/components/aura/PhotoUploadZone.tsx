import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
                    className="relative group cursor-pointer"
                    style={{ height: "220px" }}
                >
                    <input {...getInputProps()} />

                    <div className={`
                        relative h-full rounded-2xl overflow-hidden
                        border-2 border-dashed
                        transition-all duration-500 ease-out
                        ${isDragActive
                            ? 'scale-[1.02] border-gold/60'
                            : 'hover:scale-[1.01] border-gold/40'
                        }
                    `}>
                        {/* Inner Glass Container */}
                        <div className={`
                                h-full w-full rounded-2xl
                                bg-gradient-to-br from-cream/30 via-ivory/25 to-cream/40
                                backdrop-blur-md
                                border border-gold/30
                                shadow-xl
                                transition-all duration-300
                                ${isDragActive
                                ? 'bg-gradient-to-br from-cream/40 via-ivory/35 to-cream/50 border-gold/50'
                                : 'group-hover:from-cream/40 group-hover:via-ivory/35 group-hover:to-cream/50'
                            }
                            `}>
                            {/* Shimmer Effect on Hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </div>

                            {/* Content - Clean Professional Layout */}
                            <div className="relative h-full flex flex-col items-center justify-center px-6 py-8 z-10">
                                {/* Upload Icon - Smaller & More Subtle */}
                                <div className={`
                                    w-12 h-12 rounded-lg mb-4
                                    bg-gold/5
                                    flex items-center justify-center
                                    border border-gold/15
                                    transition-all duration-300
                                    ${isDragActive ? 'bg-gold/15 border-gold/30 scale-105' : ''}
                                `}>
                                    <Upload className={`w-5 h-5 ${isDragActive ? 'text-gold' : 'text-gold/40'} transition-colors`} />
                                </div>

                                {/* Main Heading - Improved Typography */}
                                <h3 className="text-base font-medium text-charcoal mb-1">
                                    {isDragActive ? "Drop your photo here" : "Drag & drop your photo"}
                                </h3>
                                <p className="text-xs text-charcoal/40 mb-5">or click to browse</p>

                                {/* Instruction Box - More Refined */}
                                <div className={`
                                    w-full px-4 py-3 rounded-lg
                                    bg-cream/15
                                    border border-gold/15
                                    transition-all duration-300
                                    ${isDragActive ? 'bg-cream/25 border-gold/25' : ''}
                                `}>
                                    <div className="flex items-start gap-2">
                                        <span className="text-base flex-shrink-0">📸</span>
                                        <div className="flex-1">
                                            <p className="text-xs text-charcoal/65 leading-relaxed">
                                                Please upload a full-body photo of yourself{" "}
                                                <span className="text-gold font-medium">standing upright</span>
                                            </p>
                                            <p className="text-xs text-charcoal/45 mt-1 leading-relaxed">
                                                Standing poses help our AI detect your body shape more accurately
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Glow Effect */}
                            <div className={`
                                    absolute -bottom-2 left-1/2 -translate-x-1/2 
                                    w-3/4 h-8 
                                    bg-gold/30 blur-2xl rounded-full
                                    transition-all duration-300
                                    ${isDragActive ? 'opacity-100 h-12' : 'opacity-0 group-hover:opacity-60'}
                                `} />
                        </div>
                    </div>
                </div>
            ) : (
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="relative rounded-2xl overflow-hidden border-2 border-gold/40 group cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300" style={{ height: "220px" }}>
                            <img
                                src={photoPreview}
                                alt="Preview"
                                className="w-full h-full object-cover object-top"
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Expand Hint */}
                            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
                                    <ImageIcon className="w-4 h-4 text-gold" />
                                    <span className="text-xs text-charcoal font-semibold">Click to expand</span>
                                </div>
                            </div>

                            {/* Remove Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove();
                                }}
                                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-charcoal/90 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 shadow-lg hover:scale-110"
                            >
                                <X className="w-5 h-5 text-white" />
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
            )
            }

            <p className="text-xs text-grey-soft mt-3 flex items-start gap-2 px-1">
                <span className="text-gold/80 mt-0.5 text-sm">ℹ</span>
                <span className="leading-relaxed">We only use this photo to create your avatar. You can delete it anytime.</span>
            </p>
        </div >
    );
};
