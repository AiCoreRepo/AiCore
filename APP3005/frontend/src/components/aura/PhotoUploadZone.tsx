import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, Info, CheckCircle2, AlertTriangle, Camera, FileImage } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
    DialogClose,
    DialogHeader,
    DialogDescription,
} from "@/components/ui/dialog";

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface PhotoUploadZoneProps {
    onPhotoSelect: (file: File, preview: string) => void;
    photoPreview: string | null;
    onRemove: () => void;
}

export const PhotoUploadZone = ({ onPhotoSelect, photoPreview, onRemove }: PhotoUploadZoneProps) => {
    const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);
    const [instructionsConfirmed, setInstructionsConfirmed] = useState(false);
    const [sizeErrorFile, setSizeErrorFile] = useState<{ name: string; sizeMB: string } | null>(null);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        accept: { "image/*": [] },
        maxFiles: 1,
        noClick: true,   // we control click ourselves
        onDrop: (acceptedFiles, rejectedFiles) => {
            if (rejectedFiles.length > 0) {
                const rejected = rejectedFiles[0];
                const fileSizeMB = (rejected.file.size / (1024 * 1024)).toFixed(1);
                setSizeErrorFile({ name: rejected.file.name, sizeMB: fileSizeMB });
                return;
            }

            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
                    setSizeErrorFile({ name: file.name, sizeMB: fileSizeMB });
                    return;
                }
                const preview = URL.createObjectURL(file);
                onPhotoSelect(file, preview);
            }
        },
    });

    // Click handler: show instructions first; after confirmed, open picker directly
    const handleUploadAreaClick = () => {
        if (instructionsConfirmed) {
            open();
        } else {
            setShowInstructionsDialog(true);
        }
    };

    // User has read & acknowledged — just close dialog; they click the zone to pick
    const handleConfirmInstructions = () => {
        setInstructionsConfirmed(true);
        setShowInstructionsDialog(false);
    };

    // Also reset confirmed when photo is removed (handled by parent via onRemove)
    const handleRemove = () => {
        setInstructionsConfirmed(false);
        onRemove();
    };

    return (
        <div className="w-full">
            {/* ── Upload Instructions Dialog ── */}
            <Dialog open={showInstructionsDialog} onOpenChange={setShowInstructionsDialog}>
                <DialogContent className="max-w-md w-full rounded-3xl border-2 border-gold/30 bg-gradient-to-br from-white via-cream/60 to-gold/5 p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="px-6 pt-6 pb-0">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold/10 border border-gold/20">
                                <Camera className="h-5 w-5 text-gold" />
                            </div>
                            <DialogTitle className="text-xl font-serif text-charcoal">
                                Photo Guidelines
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-sm text-charcoal/55 mt-1">
                            Follow these tips for the best avatar result
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 py-5 space-y-3">
                        {/* Size limit — highlighted */}
                        <div className="flex items-start gap-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 px-4 py-3.5">
                            <FileImage className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-amber-800">File size limit: {MAX_FILE_SIZE_MB} MB</p>
                                <p className="text-xs text-amber-700/80 mt-0.5">
                                    Images larger than {MAX_FILE_SIZE_MB} MB cannot be uploaded. Compress your photo if needed.
                                </p>
                            </div>
                        </div>

                        {/* Good practices */}
                        <div className="space-y-2">
                            {[
                                {
                                    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />,
                                    text: "Full-body photo — head to toe, standing upright",
                                },
                                {
                                    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />,
                                    text: "Well-lit, clear background — natural daylight works best",
                                },
                                {
                                    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />,
                                    text: "Supported formats: JPG, PNG, WEBP, HEIC",
                                },
                                {
                                    icon: <X className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />,
                                    text: "Avoid heavy filters, blurry, or heavily cropped photos",
                                },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-2.5 rounded-xl bg-white/70 border border-gold/10 px-3.5 py-2.5">
                                    {item.icon}
                                    <p className="text-xs text-charcoal/70 leading-relaxed">{item.text}</p>
                                </div>
                            ))}
                        </div>

                        {/* Privacy note */}
                        <div className="flex items-center gap-2 rounded-xl bg-blue-50/60 border border-blue-100 px-3.5 py-2.5">
                            <Info className="h-4 w-4 text-blue-400 flex-shrink-0" />
                            <p className="text-xs text-blue-700/80 leading-relaxed">
                                Your photo is used only to create your avatar and can be deleted anytime.
                            </p>
                        </div>
                    </div>

                    <div className="px-6 pb-6 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setShowInstructionsDialog(false)}
                            className="flex-1 rounded-2xl border-2 border-gold/30 px-4 py-2.5 text-sm font-semibold text-charcoal/60 transition-all hover:border-gold/50 hover:text-charcoal"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmInstructions}
                            className="flex-1 rounded-2xl bg-gradient-to-r from-gold via-amber-400 to-gold px-4 py-2.5 text-sm font-bold text-charcoal shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{ boxShadow: '0 4px 16px rgba(201,165,95,0.35)' }}
                        >
                            Got it, Upload Photo
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── File Too Large Error Dialog ── */}
            <Dialog open={!!sizeErrorFile} onOpenChange={(open) => { if (!open) setSizeErrorFile(null); }}>
                <DialogContent className="max-w-sm w-full rounded-3xl border-2 border-red-200 bg-gradient-to-br from-white via-red-50/40 to-white p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="px-6 pt-6 pb-0">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 border border-red-200">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                            <DialogTitle className="text-lg font-serif text-charcoal">
                                File Too Large
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-sm text-charcoal/55 mt-1">
                            This image exceeds the upload limit
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 py-5 space-y-3">
                        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3.5">
                            <p className="text-sm font-semibold text-red-700 truncate">
                                {sizeErrorFile?.name}
                            </p>
                            <p className="text-xs text-red-600/80 mt-1">
                                Size: <span className="font-semibold">{sizeErrorFile?.sizeMB} MB</span>
                                {" "}· Limit: <span className="font-semibold">{MAX_FILE_SIZE_MB} MB</span>
                            </p>
                        </div>

                        <div className="space-y-2 text-xs text-charcoal/60 leading-relaxed">
                            <p className="font-medium text-charcoal/70">How to reduce your file size:</p>
                            {[
                                "Use a free tool like TinyPNG, Squoosh, or iLoveIMG",
                                "Export as JPG at 80% quality instead of PNG",
                                "Resize the image to under 4000 × 4000 px",
                            ].map((tip, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-gold/60 flex-shrink-0" />
                                    <span>{tip}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="px-6 pb-6 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setSizeErrorFile(null)}
                            className="flex-1 rounded-2xl border-2 border-gold/30 px-4 py-2.5 text-sm font-semibold text-charcoal/60 transition-all hover:border-gold/50 hover:text-charcoal"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={() => { setSizeErrorFile(null); open(); }}
                            className="flex-1 rounded-2xl bg-gradient-to-r from-gold via-amber-400 to-gold px-4 py-2.5 text-sm font-bold text-charcoal shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{ boxShadow: '0 4px 16px rgba(201,165,95,0.35)' }}
                        >
                            Try Again
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Upload Zone ── */}
            {!photoPreview ? (
                <div
                    {...getRootProps()}
                    onClick={handleUploadAreaClick}
                    className="relative group h-[190px] cursor-pointer sm:h-[220px]"
                >
                    <input {...getInputProps()} />

                    <div className={`
                        relative h-full overflow-hidden rounded-[22px] sm:rounded-2xl
                        border-2 border-dashed
                        transition-all duration-500 ease-out
                        ${isDragActive
                            ? 'scale-[1.02] border-gold/60'
                            : 'hover:scale-[1.01] border-gold/40'
                        }
                    `}>
                        {/* Inner Glass Container */}
                        <div className={`
                                h-full w-full rounded-[22px] sm:rounded-2xl
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

                            {/* Content */}
                            <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
                                {/* Upload Icon */}
                                <div className={`
                                    mb-4 flex h-11 w-11 items-center justify-center rounded-lg sm:h-12 sm:w-12
                                    bg-gold/5
                                    border border-gold/15
                                    transition-all duration-300
                                    ${isDragActive ? 'bg-gold/15 border-gold/30 scale-105' : ''}
                                `}>
                                    <Upload className={`h-5 w-5 ${isDragActive ? 'text-gold' : 'text-gold/40'} transition-colors`} />
                                </div>

                                <h3 className="mb-1 text-[15px] font-medium text-charcoal sm:text-base">
                                    {isDragActive ? "Drop your photo here" : "Upload your photo"}
                                </h3>
                                <p className="mb-4 text-xs text-charcoal/40 sm:mb-5">Tap or click to browse</p>

                                {/* Instruction Box */}
                                <div className={`
                                    w-full rounded-lg px-3.5 py-3 sm:px-4
                                    bg-cream/15
                                    border border-gold/15
                                    transition-all duration-300
                                    ${isDragActive ? 'bg-cream/25 border-gold/25' : ''}
                                `}>
                                    <div className="flex items-start gap-2">
                                        <span className="text-base flex-shrink-0">📸</span>
                                        <div className="flex-1">
                                            <p className="text-xs leading-relaxed text-charcoal/65">
                                                Full-body photo, standing upright ·{" "}
                                                <span className="text-gold font-medium">Max {MAX_FILE_SIZE_MB} MB</span>
                                            </p>
                                            <p className="mt-1 text-xs leading-relaxed text-charcoal/45">
                                                Click to see photo guidelines before uploading
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
                        <div className="relative group h-[190px] cursor-pointer overflow-hidden rounded-[22px] border-2 border-gold/40 shadow-lg transition-all duration-300 hover:shadow-xl sm:h-[220px] sm:rounded-2xl">
                            <img
                                src={photoPreview}
                                alt="Preview"
                                className="w-full h-full object-cover object-top"
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Expand Hint */}
                            <div className="absolute bottom-3 left-3 right-3 flex translate-y-0 items-center gap-2 opacity-100 transition-all duration-300 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                                <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
                                    <ImageIcon className="w-4 h-4 text-gold" />
                                    <span className="text-xs text-charcoal font-semibold">Click to expand</span>
                                </div>
                            </div>

                            {/* Remove Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove();
                                }}
                                className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-charcoal/90 opacity-100 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
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
            )}

            <p className="mt-2.5 flex items-start gap-2 px-1 text-xs text-grey-soft sm:mt-3">
                <span className="text-gold/80 mt-0.5 text-sm">ℹ</span>
                <span className="leading-relaxed">We only use this photo to create your avatar. You can delete it anytime.</span>
            </p>
        </div>
    );
};
