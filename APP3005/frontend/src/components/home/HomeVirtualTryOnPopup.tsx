import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  LogIn,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "@/context/AuthContext";

const POPUP_DISMISSED_KEY = "aivestire:home-virtual-tryon-dismissed";
const SESSION_AVATAR_KEY = "aivestire:home-tryon-avatar";
const SESSION_AVATAR_LOOK_KEY = "aivestire:home-tryon-avatar-look";

type TryOnMode = "static" | "upload";

interface HomeTryOnLook {
  id: string;
  title: string;
  subtitle: string;
  collectionImage: string;
  staticResultImage: string;
}

const HOME_TRY_ON_LOOKS: HomeTryOnLook[] = [
  {
    id: "terracotta-heritage",
    title: "Terracotta Heritage Set",
    subtitle: "Warm handwork for festive evenings",
    collectionImage: "/images/product-1.png",
    staticResultImage: "/images/product-1.png",
  },
  {
    id: "emerald-lehenga",
    title: "Emerald Lehenga",
    subtitle: "Statement green with antique gold detail",
    collectionImage: "/images/product-2.png",
    staticResultImage: "/images/tryon-realistic.png",
  },
  {
    id: "ivory-kurta",
    title: "Ivory Kurta Set",
    subtitle: "Clean everyday elegance",
    collectionImage: "/images/product-3.png",
    staticResultImage: "/images/product-3.png",
  },
];

const readSessionAvatar = () => {
  try {
    return sessionStorage.getItem(SESSION_AVATAR_KEY) || "";
  } catch {
    return "";
  }
};

const readSessionAvatarLook = () => {
  try {
    return sessionStorage.getItem(SESSION_AVATAR_LOOK_KEY) || "";
  } catch {
    return "";
  }
};

export function HomeVirtualTryOnPopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<TryOnMode>("static");
  const [selectedLookId, setSelectedLookId] = useState(HOME_TRY_ON_LOOKS[0].id);
  const [staticPreviewReady, setStaticPreviewReady] = useState(false);
  const [uploadedAvatar, setUploadedAvatar] = useState("");
  const [avatarPreviewReady, setAvatarPreviewReady] = useState(false);
  const [fileError, setFileError] = useState("");

  const selectedLook = useMemo(
    () =>
      HOME_TRY_ON_LOOKS.find((look) => look.id === selectedLookId) ||
      HOME_TRY_ON_LOOKS[0],
    [selectedLookId],
  );

  useEffect(() => {
    const sessionAvatar = readSessionAvatar();
    const sessionLookId = readSessionAvatarLook();

    if (sessionAvatar) {
      setUploadedAvatar(sessionAvatar);
      setAvatarPreviewReady(true);
      setMode("upload");
    }

    if (sessionLookId) {
      setSelectedLookId(sessionLookId);
    }

    const shouldForceOpen =
      Boolean(sessionAvatar && user) ||
      Boolean((location.state as { openHomeVirtualTryOn?: boolean } | null)?.openHomeVirtualTryOn);

    if (!shouldForceOpen && sessionStorage.getItem(POPUP_DISMISSED_KEY) === "true") {
      return;
    }

    const timer = window.setTimeout(() => setOpen(true), shouldForceOpen ? 350 : 1400);
    return () => window.clearTimeout(timer);
  }, [location.state, user]);

  const closePopup = () => {
    sessionStorage.setItem(POPUP_DISMISSED_KEY, "true");
    setOpen(false);
  };

  const handleLookSelect = (lookId: string) => {
    setSelectedLookId(lookId);
    setStaticPreviewReady(false);
    setAvatarPreviewReady(false);

    if (uploadedAvatar) {
      sessionStorage.setItem(SESSION_AVATAR_LOOK_KEY, lookId);
    }
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError("");

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFileError("Upload an image file to create your session avatar.");
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setFileError("Use an image below 6MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = String(reader.result || "");
      setUploadedAvatar(image);
      setAvatarPreviewReady(false);
      sessionStorage.setItem(SESSION_AVATAR_KEY, image);
      sessionStorage.setItem(SESSION_AVATAR_LOOK_KEY, selectedLook.id);
    };
    reader.readAsDataURL(file);
  };

  const handleLogin = () => {
    closePopup();
    navigate("/user-login", {
      state: {
        returnUrl: "/",
        returnState: { openHomeVirtualTryOn: true },
      },
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
          />

          <div className="fixed inset-0 z-[131] flex items-center justify-center p-4">
            <motion.section
              aria-label="Home virtual try-on"
              className="relative grid max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-white/15 bg-[#F8F1E6] shadow-[0_32px_90px_rgba(0,0,0,0.55)] lg:grid-cols-[0.92fr_1.08fr]"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <button
                type="button"
                aria-label="Close virtual try-on popup"
                className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-stone-700 transition hover:bg-white"
                onClick={closePopup}
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex max-h-[92vh] flex-col overflow-y-auto border-b border-black/10 p-5 sm:p-6 lg:border-b-0 lg:border-r lg:p-8">
                <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6821]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Virtual Try-On
                </div>

                <h2 className="font-serif text-3xl leading-tight text-[#2C2416] sm:text-4xl">
                  Preview a collection look from home.
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#6B5D4F]">
                  Pick one of three collection pieces, then choose a quick static
                  preview or upload an image to create a session avatar.
                </p>

                {user && uploadedAvatar && (
                  <div className="mt-5 flex items-center gap-3 rounded-lg border border-[#D4AF37]/35 bg-white/75 p-3">
                    <img
                      src={uploadedAvatar}
                      alt="Session avatar"
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#2C2416]">
                        Session avatar ready
                      </p>
                      <p className="text-xs leading-5 text-[#6B5D4F]">
                        You are logged in, so the avatar created before login is
                        still visible in this session.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-[#E9DDC8] p-1">
                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                      mode === "static"
                        ? "bg-[#2C2416] text-[#F8F1E6]"
                        : "text-[#5E503F] hover:bg-white/60"
                    }`}
                    onClick={() => setMode("static")}
                  >
                    <ImagePlus className="h-4 w-4" />
                    Static
                  </button>
                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                      mode === "upload"
                        ? "bg-[#2C2416] text-[#F8F1E6]"
                        : "text-[#5E503F] hover:bg-white/60"
                    }`}
                    onClick={() => setMode("upload")}
                  >
                    <Camera className="h-4 w-4" />
                    Upload
                  </button>
                </div>

                <div className="mt-6 grid gap-3">
                  {HOME_TRY_ON_LOOKS.map((look) => (
                    <button
                      type="button"
                      key={look.id}
                      className={`grid grid-cols-[74px_1fr] gap-3 rounded-lg border bg-white p-2 text-left transition ${
                        selectedLook.id === look.id
                          ? "border-[#D4AF37] shadow-[0_12px_28px_rgba(44,36,22,0.12)]"
                          : "border-[#E0D0B7] hover:border-[#C7A34D]"
                      }`}
                      onClick={() => handleLookSelect(look.id)}
                    >
                      <img
                        src={look.collectionImage}
                        alt={look.title}
                        className="h-24 w-full rounded-md object-cover object-top"
                      />
                      <span className="flex min-w-0 flex-col justify-center">
                        <span className="text-sm font-semibold text-[#2C2416]">
                          {look.title}
                        </span>
                        <span className="mt-1 text-xs leading-5 text-[#6B5D4F]">
                          {look.subtitle}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[92vh] overflow-y-auto bg-[#211A12] p-5 text-[#F8F1E6] sm:p-6 lg:p-8">
                <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                      Selected Collection
                    </p>
                    <h3 className="mt-2 font-serif text-2xl text-white">
                      {selectedLook.title}
                    </h3>
                    <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-black/20">
                      <img
                        src={selectedLook.collectionImage}
                        alt={selectedLook.title}
                        className="h-72 w-full object-cover object-top sm:h-80"
                      />
                    </div>
                  </div>

                  <div>
                    {mode === "static" ? (
                      <div className="flex h-full flex-col">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                          Static Preview
                        </p>
                        <div className="mt-4 overflow-hidden rounded-lg border border-[#D4AF37]/30 bg-[#F8F1E6] text-[#2C2416]">
                          {staticPreviewReady ? (
                            <img
                              src={selectedLook.staticResultImage}
                              alt={`${selectedLook.title} static try-on`}
                              className="h-80 w-full object-cover object-top"
                            />
                          ) : (
                            <div className="flex h-80 flex-col items-center justify-center px-5 text-center">
                              <ImagePlus className="h-10 w-10 text-[#C7A34D]" />
                              <p className="mt-4 text-lg font-semibold">
                                Ready to render
                              </p>
                              <p className="mt-2 text-sm leading-6 text-[#6B5D4F]">
                                Tap try on to show the static model image mapped
                                to your selected collection item.
                              </p>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 text-sm font-bold uppercase tracking-[0.14em] text-[#211A12] transition hover:bg-[#E0BE54]"
                          onClick={() => setStaticPreviewReady(true)}
                        >
                          Try On
                          <Sparkles className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                          Upload Avatar
                        </p>

                        {!uploadedAvatar ? (
                          <label className="mt-4 flex h-80 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#D4AF37]/50 bg-white/5 px-5 text-center transition hover:bg-white/10">
                            <Upload className="h-10 w-10 text-[#D4AF37]" />
                            <span className="mt-4 text-base font-semibold">
                              Upload image
                            </span>
                            <span className="mt-2 text-sm leading-6 text-white/60">
                              This creates a temporary avatar for the current
                              browser session.
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleUpload}
                            />
                          </label>
                        ) : avatarPreviewReady ? (
                          <div className="mt-4 overflow-hidden rounded-lg border border-[#D4AF37]/30 bg-[#F8F1E6] text-[#2C2416]">
                            <div className="grid h-80 grid-cols-2">
                              <img
                                src={uploadedAvatar}
                                alt="Uploaded session avatar"
                                className="h-full w-full object-cover object-top"
                              />
                              <img
                                src={selectedLook.staticResultImage}
                                alt={`${selectedLook.title} avatar try-on`}
                                className="h-full w-full object-cover object-top"
                              />
                            </div>
                            <div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold">
                              <CheckCircle2 className="h-4 w-4 text-[#C7A34D]" />
                              Avatar try-on preview created
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                            <img
                              src={uploadedAvatar}
                              alt="Uploaded session avatar"
                              className="h-80 w-full object-cover object-top"
                            />
                          </div>
                        )}

                        {fileError && (
                          <p className="mt-3 text-sm font-medium text-red-200">
                            {fileError}
                          </p>
                        )}

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            disabled={!uploadedAvatar}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-4 text-sm font-bold uppercase tracking-[0.12em] text-[#211A12] transition hover:bg-[#E0BE54] disabled:cursor-not-allowed disabled:opacity-45"
                            onClick={() => {
                              setAvatarPreviewReady(true);
                              sessionStorage.setItem(
                                SESSION_AVATAR_LOOK_KEY,
                                selectedLook.id,
                              );
                            }}
                          >
                            Try On
                            <Sparkles className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/15"
                            onClick={handleLogin}
                          >
                            Login
                            <LogIn className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
