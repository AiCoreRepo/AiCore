import { ChangeEvent, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ImagePlus, Sparkles, Upload, UserRound } from "lucide-react";
import { getProductImageUrl } from "@/lib/product-image";
import type { PublicProduct } from "@/hooks/useInfinitePublicProducts";

const GUEST_TRY_ON_USED_KEY = "aivestire_guest_try_on_used";

const SAMPLE_USER_IMAGES = [
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=900&auto=format&fit=crop",
];

const escapeSvgText = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const buildStaticTryOnPreview = ({
    userImage,
    garmentImage,
    productTitle,
}: {
    userImage: string;
    garmentImage: string;
    productTitle: string;
}) => {
    const title = escapeSvgText(productTitle || "Selected Look");
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 1080 1440">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fbf7ef"/>
      <stop offset="1" stop-color="#eee0c5"/>
    </linearGradient>
    <clipPath id="personClip"><rect x="100" y="145" width="410" height="790" rx="30"/></clipPath>
    <clipPath id="garmentClip"><rect x="570" y="145" width="410" height="790" rx="30"/></clipPath>
  </defs>
  <rect width="1080" height="1440" fill="url(#bg)"/>
  <rect x="54" y="62" width="972" height="1316" rx="54" fill="#fffaf1" stroke="#d4af37" stroke-width="3"/>
  <text x="540" y="108" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#2c2416">Virtual Try-On Preview</text>
  <image href="${userImage}" x="100" y="145" width="410" height="790" preserveAspectRatio="xMidYMid slice" clip-path="url(#personClip)"/>
  <image href="${garmentImage}" x="570" y="145" width="410" height="790" preserveAspectRatio="xMidYMid slice" clip-path="url(#garmentClip)"/>
  <rect x="100" y="145" width="410" height="790" rx="30" fill="none" stroke="#2c2416" stroke-opacity="0.1" stroke-width="3"/>
  <rect x="570" y="145" width="410" height="790" rx="30" fill="none" stroke="#2c2416" stroke-opacity="0.1" stroke-width="3"/>
  <path d="M510 520 C548 520 548 560 570 560" stroke="#d4af37" stroke-width="8" fill="none" stroke-linecap="round"/>
  <circle cx="540" cy="540" r="34" fill="#2c2416"/>
  <text x="540" y="550" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#d4af37">AI</text>
  <text x="305" y="985" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#2c2416">Your Photo</text>
  <text x="775" y="985" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#2c2416">Selected Outfit</text>
  <rect x="128" y="1058" width="824" height="132" rx="28" fill="#2c2416"/>
  <text x="540" y="1118" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#f8f4ec">${title}</text>
  <text x="540" y="1166" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#d4af37">Static guest preview complete</text>
  <text x="540" y="1264" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#6b5d4f">Log in to generate the full AI drape on your saved avatar.</text>
</svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

interface GuestTryOnModalProps {
    isOpen: boolean;
    product: PublicProduct | null;
    onClose: () => void;
    onComplete: (payload: {
        resultImage: string;
        userPhoto: string;
        garmentImage: string;
        garmentTitle: string;
    }) => void;
    onLogin: () => void;
}

export const hasUsedGuestTryOn = () =>
    localStorage.getItem(GUEST_TRY_ON_USED_KEY) === "true";

export const GuestTryOnModal = ({
    isOpen,
    product,
    onClose,
    onComplete,
    onLogin,
}: GuestTryOnModalProps) => {
    const [step, setStep] = useState(0);
    const [userPhoto, setUserPhoto] = useState("");
    const [selectedSample, setSelectedSample] = useState(0);
    const [fileError, setFileError] = useState("");
    const garmentImage = product ? getProductImageUrl(product) || product.thumbnail || "" : "";
    const alreadyUsed = useMemo(() => hasUsedGuestTryOn(), [isOpen]);
    const canContinue = Boolean(userPhoto || SAMPLE_USER_IMAGES[selectedSample]);
    const resolvedUserPhoto = userPhoto || SAMPLE_USER_IMAGES[selectedSample];

    if (!isOpen || !product) return null;

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setFileError("");
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setFileError("Please upload an image file.");
            return;
        }
        if (file.size > 6 * 1024 * 1024) {
            setFileError("Please upload an image below 6MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => setUserPhoto(String(reader.result || ""));
        reader.readAsDataURL(file);
    };

    const finishPreview = () => {
        const resultImage = buildStaticTryOnPreview({
            userImage: resolvedUserPhoto,
            garmentImage,
            productTitle: product.title,
        });

        localStorage.setItem(GUEST_TRY_ON_USED_KEY, "true");
        onComplete({
            resultImage,
            userPhoto: resolvedUserPhoto,
            garmentImage,
            garmentTitle: product.title,
        });
        setStep(0);
        setUserPhoto("");
    };

    return (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-[#F8F4EC] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#E8DCC4] px-5 py-4">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9B7A22]">
                            Guest Virtual Try-On
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-[#2C2416]">
                            {alreadyUsed ? "Create an account to continue" : "Preview this look"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-[#D4C5A9] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6B5D4F]"
                    >
                        Close
                    </button>
                </div>

                {alreadyUsed ? (
                    <div className="px-6 py-10 text-center">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-[#D4AF37]" />
                        <h3 className="mt-4 text-2xl font-semibold text-[#2C2416]">
                            Your free guest try-on is used
                        </h3>
                        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#6B5D4F]">
                            Log in to use your saved avatar, view clearer AI try-ons, and keep your results.
                        </p>
                        <button
                            type="button"
                            onClick={onLogin}
                            className="mt-7 rounded-full bg-[#2C2416] px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#F8F4EC]"
                        >
                            Login for Full Try-On
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-3 border-b border-[#E8DCC4] bg-white/60">
                            {["Choose photo", "Check outfit", "Preview"].map((label, index) => (
                                <div
                                    key={label}
                                    className="flex items-center justify-center gap-2 px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em]"
                                    style={{ color: index === step ? "#2C2416" : "#9B8B7E" }}
                                >
                                    <span
                                        className="flex h-6 w-6 items-center justify-center rounded-full text-[11px]"
                                        style={{
                                            background: index <= step ? "#D4AF37" : "#EEE4D3",
                                            color: "#2C2416",
                                        }}
                                    >
                                        {index + 1}
                                    </span>
                                    {label}
                                </div>
                            ))}
                        </div>

                        <div className="p-6">
                            {step === 0 && (
                                <div className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
                                    <label className="flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#D4AF37] bg-white p-6 text-center">
                                        <Upload className="h-10 w-10 text-[#D4AF37]" />
                                        <span className="mt-4 text-sm font-semibold text-[#2C2416]">
                                            Upload your photo
                                        </span>
                                        <span className="mt-2 text-xs leading-5 text-[#6B5D4F]">
                                            Front-facing image works best. Guests get one static preview.
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={handleFileChange}
                                        />
                                        {fileError && (
                                            <span className="mt-3 text-xs font-medium text-red-600">
                                                {fileError}
                                            </span>
                                        )}
                                    </label>

                                    <div>
                                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#6B5D4F]">
                                            Or try a sample
                                        </p>
                                        <div className="grid grid-cols-3 gap-3">
                                            {SAMPLE_USER_IMAGES.map((image, index) => (
                                                <button
                                                    key={image}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedSample(index);
                                                        setUserPhoto("");
                                                    }}
                                                    className="overflow-hidden rounded-xl border bg-white"
                                                    style={{
                                                        borderColor:
                                                            !userPhoto && selectedSample === index
                                                                ? "#D4AF37"
                                                                : "#E8DCC4",
                                                    }}
                                                >
                                                    <img
                                                        src={image}
                                                        alt={`Sample ${index + 1}`}
                                                        className="h-36 w-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        {resolvedUserPhoto && (
                                            <div className="mt-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-[#2C2416]">
                                                <UserRound className="h-4 w-4 text-[#D4AF37]" />
                                                Photo selected
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 1 && (
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="rounded-xl bg-white p-3">
                                        <img
                                            src={resolvedUserPhoto}
                                            alt="Selected user"
                                            className="h-[380px] w-full rounded-lg object-cover"
                                        />
                                        <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#6B5D4F]">
                                            Your photo
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-white p-3">
                                        <img
                                            src={garmentImage}
                                            alt={product.title}
                                            className="h-[380px] w-full rounded-lg object-cover"
                                        />
                                        <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#6B5D4F]">
                                            {product.title}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="rounded-xl bg-white p-5 text-center">
                                    <Sparkles className="mx-auto h-10 w-10 text-[#D4AF37]" />
                                    <h3 className="mt-4 text-2xl font-semibold text-[#2C2416]">
                                        Ready to create your preview
                                    </h3>
                                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#6B5D4F]">
                                        This guest mode creates one clear static preview. Log in afterward for the full AI try-on using your Aura avatar.
                                    </p>
                                    <div className="mt-6 flex items-center justify-center gap-3">
                                        <ImagePlus className="h-5 w-5 text-[#D4AF37]" />
                                        <span className="text-sm font-medium text-[#2C2416]">
                                            One free guest preview
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t border-[#E8DCC4] px-6 py-4">
                            <button
                                type="button"
                                onClick={() => (step === 0 ? onClose() : setStep((value) => value - 1))}
                                className="flex items-center gap-2 rounded-full border border-[#D4C5A9] bg-white px-5 py-2.5 text-sm font-medium text-[#6B5D4F]"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                {step === 0 ? "Cancel" : "Back"}
                            </button>
                            {step < 2 ? (
                                <button
                                    type="button"
                                    disabled={!canContinue}
                                    onClick={() => setStep((value) => value + 1)}
                                    className="flex items-center gap-2 rounded-full bg-[#2C2416] px-6 py-2.5 text-sm font-semibold text-[#F8F4EC] disabled:opacity-50"
                                >
                                    Next
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={finishPreview}
                                    className="flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-[#2C2416]"
                                >
                                    Show Preview
                                    <Sparkles className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
