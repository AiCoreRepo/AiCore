import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

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
                <div className="relative rounded-xl overflow-hidden border-2 border-gold/30 group" style={{ height: "180px" }}>
                    <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <button
                        onClick={onRemove}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-charcoal/80 hover:bg-charcoal flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                        <X className="w-4 h-4 text-ivory" />
                    </button>

                    <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon className="w-4 h-4 text-ivory" />
                        <span className="text-xs text-ivory font-medium">Photo uploaded</span>
                    </div>
                </div>
            )}

            <p className="text-xs text-grey-soft mt-2 flex items-start gap-1.5">
                <span className="text-gold mt-0.5">ℹ</span>
                <span>We only use this photo to create your avatar. You can delete it anytime.</span>
            </p>
        </div>
    );
};
