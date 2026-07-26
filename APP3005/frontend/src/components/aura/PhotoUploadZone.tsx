import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, Info, AlertTriangle, Camera, FileImage } from "lucide-react";
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

    const { getRootProps, getInputProps, isDragActive, open, inputRef } = useDropzone({
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

    const openFilePicker = () => {
        if (inputRef.current) {
            inputRef.current.value = "";
        }
        open();
    };

    // Click handler: show instructions first; after confirmed, open picker directly
    const handleUploadAreaClick = () => {
        if (instructionsConfirmed) {
            openFilePicker();
        } else {
            setShowInstructionsDialog(true);
        }
    };

    // User has read & acknowledged — open the picker immediately from the same gesture
    const handleConfirmInstructions = () => {
        setInstructionsConfirmed(true);
        setShowInstructionsDialog(false);
        openFilePicker();
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
                <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg overflow-hidden rounded-[28px] border border-gold/25 bg-gradient-to-br from-white via-[#fffaf0] to-[#f8eed8] p-0 shadow-2xl [&>button]:hidden">
                    <div className="max-h-[min(82vh,720px)] overflow-y-auto">
                        <DialogHeader className="border-b border-gold/10 px-5 pb-4 pt-5 text-left sm:px-6 sm:pb-5 sm:pt-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
                                        <Camera className="h-5 w-5 text-gold" />
                                    </div>
                                    <div className="min-w-0">
                                        <DialogTitle className="font-serif text-[1.35rem] leading-tight text-charcoal sm:text-2xl">
                                            Before you upload
                                        </DialogTitle>
                                        <DialogDescription className="mt-1 text-sm leading-relaxed text-charcoal/60">
                                            A quick check helps us create a better avatar from your photo.
                                        </DialogDescription>
                                    </div>
                                </div>

                                <DialogClose asChild>
                                    <button
                                        type="button"
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/15 bg-white/80 text-charcoal/70 transition-colors hover:bg-white hover:text-charcoal"
                                    >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Close</span>
                                    </button>
                                </DialogClose>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
                            <div className="grid gap-3">
                                {[
                                    "Full body is preferred so we can read your body shape better. A selfie or half-body photo still works.",
                                    "Use a clear, well-lit photo with a simple background if possible.",
                                    "Avoid black-and-white filters, blur, heavy edits, and very tight crops.",
                                ].map((text, index) => (
                                    <div
                                        key={text}
                                        className="flex items-start gap-3 rounded-2xl border border-gold/12 bg-white/75 px-4 py-3.5 shadow-[0_8px_24px_rgba(201,165,95,0.08)]"
                                    >
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-600">
                                            {index + 1}
                                        </div>
                                        <p className="text-sm leading-6 text-charcoal/75">{text}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3.5">
                                    <FileImage className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-amber-900">Up to {MAX_FILE_SIZE_MB} MB</p>
                                        <p className="mt-1 text-xs leading-5 text-amber-800/80">
                                            Bigger files will not upload. Compress first if needed.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3.5">
                                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
                                    <div>
                                        <p className="text-sm font-semibold text-sky-900">Formats we accept</p>
                                        <p className="mt-1 text-xs leading-5 text-sky-800/80">
                                            JPG, PNG, WEBP, and HEIC
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gold/12 bg-white/70 px-4 py-3 text-xs leading-5 text-charcoal/60">
                                Your photo is only used to create your avatar, and you can remove it anytime.
                            </div>
                        </div>

                        <div className="border-t border-gold/10 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => setShowInstructionsDialog(false)}
                                    className="rounded-2xl border border-gold/25 px-4 py-3 text-sm font-semibold text-charcoal/65 transition-all hover:border-gold/45 hover:bg-white/70 hover:text-charcoal"
                                >
                                    Not now
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmInstructions}
                                    className="rounded-2xl bg-gradient-to-r from-gold via-amber-400 to-gold px-4 py-3 text-sm font-bold text-charcoal shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
                                    style={{ boxShadow: '0 8px 20px rgba(201, 165, 95, 0.28)' }}
                                >
                                    Choose photo
                                </button>
                            </div>
                        </div>
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
                            onClick={() => { setSizeErrorFile(null); openFilePicker(); }}
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
                    className="group relative h-[198px] cursor-pointer touch-manipulation select-none sm:h-[228px]"
                >
                    <input {...getInputProps()} />

                    <div className={`
                        relative h-full overflow-hidden rounded-[24px] sm:rounded-[26px]
                        border-2 border-dashed
                        transition-all duration-500 ease-out
                        ${isDragActive
                            ? 'scale-[1.01] border-gold/60'
                            : 'hover:scale-[1.005] border-gold/40'
                        }
                    `}>
                        {/* Inner Glass Container */}
                        <div className={`
                                h-full w-full rounded-[24px] sm:rounded-[26px]
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
                            <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 px-4 py-6 sm:px-6 sm:py-8">
                                {/* Upload Icon */}
                                <div className={`
                                    flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/15 bg-white/80 p-0.5 shadow-[0_10px_30px_rgba(201,165,95,0.12)] sm:h-16 sm:w-16
                                    transition-all duration-300
                                    ${isDragActive ? 'bg-gold/15 border-gold/30 scale-[1.03]' : 'group-hover:-translate-y-0.5'}
                                `}>
                                    <Upload className={`h-6 w-6 shrink-0 sm:h-7 sm:w-7 ${isDragActive ? 'text-gold' : 'text-gold/55'} transition-colors`} />
                                </div>

                                <h3 className="text-center text-[15px] font-semibold text-charcoal sm:text-base">
                                    {isDragActive ? "Drop your photo here" : "Upload your photo"}
                                </h3>
                                <p className="text-center text-xs text-charcoal/45">Tap or click to browse</p>

                                {/* Instruction Box */}
                                <div className={`
                                    w-full max-w-sm rounded-2xl px-4 py-3.5
                                    bg-cream/15
                                    border border-gold/15
                                    transition-all duration-300
                                    ${isDragActive ? 'bg-cream/25 border-gold/25' : ''}
                                `}>
                                    <div className="flex items-start gap-2">
                                        <span className="text-base flex-shrink-0">📸</span>
                                        <div className="flex-1">
                                            <p className="text-xs leading-relaxed text-charcoal/65 sm:text-[13px]">
                                                Full body is best, but selfie or half body also works.{" "}
                                                <span className="font-medium text-gold">Max {MAX_FILE_SIZE_MB} MB</span>
                                            </p>
                                            <p className="mt-1 text-xs leading-relaxed text-charcoal/45 sm:text-[13px]">
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
                        <div className="relative group h-[300px] cursor-pointer overflow-hidden rounded-[22px] border-2 border-gold/40 bg-white shadow-lg transition-all duration-300 hover:shadow-xl sm:h-[360px] sm:rounded-2xl">
                            <img
                                src={photoPreview}
                                alt="Uploaded portrait preview"
                                className="h-full w-full object-contain object-top"
                                loading="eager"
                                decoding="sync"
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

                            <div className="absolute left-3 top-3 rounded-full border border-white/70 bg-charcoal/75 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-sm">
                                Face preview
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
