import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast"; // Import toast hook
import { EditableAttributeCard } from "@/components/aura/EditableAttributeCard";
import { AvatarDisplay } from "@/components/aura/AvatarDisplay";
import { AuraFramedImage } from "@/components/aura/AuraFramedImage";
import { ProcessingModal } from "@/components/aura/ProcessingModal";
import {
  BODY_SIZE_OPTIONS,
  SKIN_TONE_OPTIONS,
  BODY_SHAPE_OPTIONS,
  GENDER_OPTIONS,
} from "@/constants/aura.constants";
import "@/components/aura/aura-styles.css";
import { updateBirthdayApi } from "@/api/coupons.api";
import { FeedbackBottomSheet } from "@/components/feedback/FeedbackBottomSheet";
import { FeedbackContextType, selectAuraAvatarForTryOns } from "@/lib/api";
import { RefreshCw, Upload, Wand2, XCircle } from "lucide-react";

const DEFAULT_MAX_RECREATION_ATTEMPTS = 2;

interface AuraData {
  aura_id: string;
  user_id: string;
  image_url: string;
  model_url?: string;
  tryon_model_url?: string;
  height_cm?: number;
  weight_kg?: number;
  skin_tone?: string;
  gender?: string;
  body_shape?: string;
  body_size?: string;
  age_range?: string;
  status: string;
  created_at: string;
  selected_avatar_id?: string | null;
  selected_avatar?: AuraAvatarHistoryItem | null;
  avatar_history?: AuraAvatarHistoryItem[];
}

interface AuraAvatarAttributes {
  height_cm?: number | null;
  weight_kg?: number | null;
  skin_tone?: string | null;
  gender?: string | null;
  body_shape?: string | null;
  body_size?: string | null;
  age_range?: string | null;
  hair_style?: string | null;
}

interface AuraAvatarHistoryItem {
  avatar_id: string;
  model_url: string;
  tryon_model_url: string;
  source: "creation" | "recreation";
  generation_type: "generated" | "original";
  created_at: string;
  attributes: AuraAvatarAttributes;
}

interface AttributeValues {
  bodyShape: string;
  bodySize: string;
  skinTone: string;
  gender: string;
  height: string;
  dateOfBirth: string;
}

type RecreateMode = "attributes-only" | "new-photo";
type RequiredAuraAttribute = "bodyShape" | "bodySize" | "skinTone";

const REQUIRED_AURA_ATTRIBUTE_MESSAGES: Record<RequiredAuraAttribute, string> =
  {
    bodyShape: "Select a body shape.",
    bodySize: "Select a body size.",
    skinTone: "Select a skin tone.",
  };

interface FeedbackContext {
  type: FeedbackContextType;
  referenceId?: string;
  label?: string;
}

export default function AuraProfile() {
  const [aura, setAura] = useState<AuraData | null>(null);
  const [latestAuraId, setLatestAuraId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [avatarUserName, setAvatarUserName] = useState<string>("");
  const [exactAge, setExactAge] = useState<number | null>(null);
  const [maxRecreationAttempts, setMaxRecreationAttempts] = useState(
    DEFAULT_MAX_RECREATION_ATTEMPTS,
  );
  const [recreateUsed, setRecreateUsed] = useState(0);
  const [showRecreateModal, setShowRecreateModal] = useState(false);
  const [recreateMode, setRecreateMode] =
    useState<RecreateMode>("attributes-only");
  const [recreateAttributes, setRecreateAttributes] = useState<AttributeValues>(
    {
      bodyShape: "",
      bodySize: "",
      skinTone: "",
      gender: "",
      height: "",
      dateOfBirth: "",
    },
  );
  const [recreatePhoto, setRecreatePhoto] = useState<File | null>(null);
  const [recreatePhotoPreview, setRecreatePhotoPreview] = useState<
    string | null
  >(null);
  const [recreateDraftError, setRecreateDraftError] = useState("");
  const [recreateJobId, setRecreateJobId] = useState<string | null>(null);
  const [recreateProgress, setRecreateProgress] = useState(0);
  const [isStartingRecreation, setIsStartingRecreation] = useState(false);
  const [showEditValidation, setShowEditValidation] = useState(false);
  const [showRecreateValidation, setShowRecreateValidation] = useState(false);
  const [selectingAvatarId, setSelectingAvatarId] = useState<string | null>(
    null,
  );
  const navigate = useNavigate();
  const location = useLocation();
  const [showFeedbackSheet, setShowFeedbackSheet] = useState(false);
  const [feedbackContext, setFeedbackContext] =
    useState<FeedbackContext | null>(null);
  const [hideAuraLibrary, setHideAuraLibrary] = useState(false);
  const [pendingAvatarScroll, setPendingAvatarScroll] = useState(false);
  const avatarPanelRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const displayedRecreateProgress = recreateJobId
    ? recreateProgress
    : isStartingRecreation
      ? 8
      : 0;
  const recreateEstimatedTime = Math.max(
    0,
    Math.ceil((100 - displayedRecreateProgress) / 5),
  );
  const isRecreationInProgress = recreateJobId !== null || isStartingRecreation;
  const hasReachedRecreationLimit = recreateUsed >= maxRecreationAttempts;
  const isRecreateDisabled =
    isRecreationInProgress || hasReachedRecreationLimit;

  // Editable attributes state
  const [attributes, setAttributes] = useState<AttributeValues>({
    bodyShape: "",
    bodySize: "",
    skinTone: "",
    gender: "",
    height: "",
    dateOfBirth: "",
  });

  // Store original values for cancel functionality
  const [originalAttributes, setOriginalAttributes] = useState<AttributeValues>(
    {
      bodyShape: "",
      bodySize: "",
      skinTone: "",
      gender: "",
      height: "",
      dateOfBirth: "",
    },
  );

  const calculateExactAge = (dobString?: string): number | null => {
    if (!dobString) return null;

    const birthDate = new Date(dobString);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 0 ? age : null;
  };

  const formatDateInputValue = useCallback((value?: string | null): string => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toISOString().split("T")[0];
  }, []);

  const toTitleCase = useCallback(
    (value: string) =>
      value
        .split(/\s+/)
        .filter(Boolean)
        .map(
          (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join(" "),
    [],
  );

  const formatAvatarDate = useCallback((value?: string | null) => {
    if (!value) return "Saved recently";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Saved recently";
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }, []);

  const formatAvatarAttributeValue = useCallback(
    (value?: string | number | null, suffix?: string) => {
      if (value === undefined || value === null || value === "") {
        return null;
      }

      if (typeof value === "number") {
        return suffix ? `${value} ${suffix}` : String(value);
      }

      const cleaned = value.replace(/[_-]+/g, " ").trim();
      if (!cleaned) {
        return null;
      }

      const titled = toTitleCase(cleaned);
      return suffix ? `${titled} ${suffix}` : titled;
    },
    [toTitleCase],
  );

  const parseRecreationLimit = useCallback((value: unknown) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_MAX_RECREATION_ATTEMPTS;
    }

    return Math.max(0, Math.floor(parsed));
  }, []);

  const isRecreationLimitError = useCallback((message: string) => {
    const normalizedMessage = message.toLowerCase();
    return (
      normalizedMessage.includes("recreation limit") ||
      normalizedMessage.includes("already used your aura recreation") ||
      normalizedMessage.includes("only once")
    );
  }, []);

  // Check for pending login from signup
  useEffect(() => {
    const pendingLogin = localStorage.getItem("pendingLogin");
    if (pendingLogin) {
      const { email, password } = JSON.parse(pendingLogin);
      // Auto-login
      const autoLogin = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/auth/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email, password }),
            },
          );

          if (response.ok) {
            const data = await response.json();
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("refresh_token", data.refresh_token);
            localStorage.removeItem("pendingLogin");
          }
        } catch (error) {
          console.error("Auto-login failed:", error);
          localStorage.removeItem("pendingLogin");
        }
      };
      autoLogin();
    }
  }, []);

  const fetchAura = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/user-login");
        return;
      }

      let dateOfBirth = "";

      // Fetch user profile for name
      const userResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserName(userData.email.split("@")[0].toUpperCase());
        const rawName = String(
          userData.name ||
            userData.store_name ||
            userData.email.split("@")[0] ||
            "",
        );
        const cleanedName = toTitleCase(rawName.replace(/[._-]+/g, " "));
        setAvatarUserName(cleanedName);
        const regenUsed = Number(userData.avatar_regenerations_used ?? 0);
        const normalizedMax = parseRecreationLimit(
          userData.max_avatar_regenerations,
        );
        setMaxRecreationAttempts(normalizedMax);
        setRecreateUsed(
          Number.isFinite(regenUsed) ? Math.max(0, regenUsed) : 0,
        );

        const localDobKey = `aivestire:dob:${(userData.email || "").toLowerCase()}`;
        const storedDob =
          userData?.dob ||
          userData?.date_of_birth ||
          localStorage.getItem(localDobKey) ||
          undefined;
        dateOfBirth = formatDateInputValue(storedDob);
        if (dateOfBirth) {
          localStorage.setItem(localDobKey, dateOfBirth);
        }
        setExactAge(calculateExactAge(dateOfBirth || undefined));
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/aura`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Aura");
      }

      const data = await response.json();
      setAura(data);
      setLatestAuraId(data.aura_id || null);

      // Initialize attribute values
      const initialAttributes = {
        bodyShape: data.body_shape || "",
        bodySize: data.body_size || "",
        skinTone: data.skin_tone || "",
        gender: data.gender || "",
        height: data.height_cm ? String(data.height_cm) : "",
        dateOfBirth,
      };
      setAttributes(initialAttributes);
      setOriginalAttributes(initialAttributes);
      setRecreateAttributes(initialAttributes);
    } catch (error) {
      console.error("Error fetching Aura:", error);
      navigate("/aura-dashboard");
    } finally {
      setLoading(false);
    }
  }, [navigate, parseRecreationLimit, toTitleCase, formatDateInputValue]);

  useEffect(() => {
    fetchAura();
  }, [fetchAura]);

  useEffect(() => {
    const state = location.state as {
      feedbackContext?: FeedbackContext;
      hideAuraLibrary?: boolean;
    } | null;
    const incomingContext = state?.feedbackContext;
    const shouldHideAuraLibrary = Boolean(state?.hideAuraLibrary);

    if (shouldHideAuraLibrary) {
      setHideAuraLibrary(true);
      setPendingAvatarScroll(true);
    }

    if (!incomingContext?.type && !shouldHideAuraLibrary) {
      return;
    }

    if (incomingContext?.type) {
      setFeedbackContext(incomingContext);
      setShowFeedbackSheet(true);
    }
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!pendingAvatarScroll || loading || !aura) {
      return;
    }

    const shouldAutoScroll =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1024px)").matches;

    if (!shouldAutoScroll) {
      setPendingAvatarScroll(false);
      return;
    }

    requestAnimationFrame(() => {
      avatarPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setPendingAvatarScroll(false);
    });
  }, [pendingAvatarScroll, loading, aura]);

  const closeFeedbackSheet = () => {
    setShowFeedbackSheet(false);
    setFeedbackContext(null);
  };

  const handleAttributeChange = (key: keyof AttributeValues, value: string) => {
    setAttributes((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    const missingRequiredAttributes = getRequiredAttributeErrors(attributes);
    if (Object.keys(missingRequiredAttributes).length > 0) {
      setShowEditValidation(true);
      toast({
        variant: "destructive",
        title: "Required Fields Missing",
        description: "Body shape, body size, and skin tone are required.",
        duration: 3500,
      });
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("access_token");

      const updateData = {
        bodyShape: attributes.bodyShape,
        bodySize: attributes.bodySize,
        skinTone: attributes.skinTone,
        gender: attributes.gender,
        ...(attributes.height ? { height: Number(attributes.height) } : {}),
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/aura`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update Aura");
      }

      const updatedAura = await response.json();
      setAura(updatedAura);

      let nextSavedAttributes = {
        ...attributes,
        dateOfBirth: originalAttributes.dateOfBirth,
      };

      const normalizedDob = formatDateInputValue(attributes.dateOfBirth);
      if (
        normalizedDob &&
        normalizedDob !== originalAttributes.dateOfBirth
      ) {
        await updateBirthdayApi(new Date(normalizedDob).toISOString());
        setExactAge(calculateExactAge(normalizedDob));
        nextSavedAttributes = {
          ...nextSavedAttributes,
          dateOfBirth: normalizedDob,
        };
      } else if (!normalizedDob && !originalAttributes.dateOfBirth) {
        setExactAge(null);
        nextSavedAttributes = {
          ...nextSavedAttributes,
          dateOfBirth: "",
        };
      }

      setAttributes(nextSavedAttributes);
      setOriginalAttributes(nextSavedAttributes);
      setIsEditing(false);
      setShowEditValidation(false);

      // Show success toast
      toast({
        title: "Attributes Updated",
        description: "Your Aura profile has been successfully updated.",
        duration: 3000,
        className: "bg-[#F5F0E6] border-[#D4B76E] text-[#1A1A1A]", // Custom luxury styling
      });
    } catch (error) {
      console.error("Error updating Aura:", error);

      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update Aura attributes. Please try again.",
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setAttributes(originalAttributes);
    setIsEditing(false);
    setShowEditValidation(false);
  };

  const handleRecreateAttributeChange = (
    key: keyof AttributeValues,
    value: string,
  ) => {
    setRecreateAttributes((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSelectAvatar = async (avatarId: string) => {
    if (!aura || aura.selected_avatar_id === avatarId || selectingAvatarId) {
      return;
    }

    try {
      setSelectingAvatarId(avatarId);
      const updatedAura = await selectAuraAvatarForTryOns(avatarId);
      setAura(updatedAura);
      toast({
        title: "Try-On Avatar Updated",
        description: "This avatar will now be used for your try-ons.",
        duration: 3000,
        className: "bg-[#F5F0E6] border-[#D4B76E] text-[#1A1A1A]",
      });
    } catch (error) {
      console.error("Error selecting Aura avatar:", error);
      toast({
        variant: "destructive",
        title: "Selection Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update your try-on avatar.",
        duration: 4000,
      });
    } finally {
      setSelectingAvatarId(null);
    }
  };

  const openRecreateFlow = () => {
    if (isRecreateDisabled) return;
    setRecreateAttributes(attributes);
    setRecreateMode("attributes-only");
    setRecreatePhoto(null);
    setRecreatePhotoPreview(null);
    setRecreateDraftError("");
    setShowRecreateValidation(false);
    setShowRecreateModal(true);
  };

  const closeRecreateFlow = () => {
    setShowRecreateModal(false);
    setRecreatePhoto(null);
    setRecreatePhotoPreview(null);
    setRecreateDraftError("");
    setShowRecreateValidation(false);
  };

  const getRequiredAttributeErrors = (values: AttributeValues) => {
    const nextErrors: Partial<Record<RequiredAuraAttribute, string>> = {};

    (
      Object.keys(REQUIRED_AURA_ATTRIBUTE_MESSAGES) as RequiredAuraAttribute[]
    ).forEach((field) => {
      if (!values[field]) {
        nextErrors[field] = REQUIRED_AURA_ATTRIBUTE_MESSAGES[field];
      }
    });

    return nextErrors;
  };

  const handleRecreatePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setRecreatePhoto(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setRecreateDraftError("Please upload a valid image.");
      setRecreatePhoto(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setRecreateDraftError("Photo must be smaller than 10MB.");
      setRecreatePhoto(null);
      return;
    }

    setRecreateDraftError("");
    setRecreatePhoto(file);
  };

  const handleRecreateAvatar = async () => {
    if (isRecreateDisabled) return;
    if (recreateMode === "new-photo" && !recreatePhoto) {
      setRecreateDraftError(
        "Upload a new photo to use this recreation option.",
      );
      return;
    }

    const missingRequiredAttributes =
      getRequiredAttributeErrors(recreateAttributes);
    if (Object.keys(missingRequiredAttributes).length > 0) {
      setShowRecreateValidation(true);
      setRecreateDraftError(
        "Body shape, body size, and skin tone are required.",
      );
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please login to recreate your Aura.",
        duration: 3000,
      });
      navigate("/user-login");
      return;
    }

    try {
      setRecreateDraftError("");
      setShowRecreateModal(false);
      setIsStartingRecreation(true);
      setRecreateProgress(8);
      const formData = new FormData();
      if (recreateMode === "new-photo" && recreatePhoto) {
        formData.append("photo", recreatePhoto);
      }

      if (recreateAttributes.bodyShape)
        formData.append("bodyShape", recreateAttributes.bodyShape);
      if (recreateAttributes.bodySize)
        formData.append("bodySize", recreateAttributes.bodySize);
      if (recreateAttributes.skinTone)
        formData.append("skinTone", recreateAttributes.skinTone);
      if (recreateAttributes.gender)
        formData.append("gender", recreateAttributes.gender);
      if (recreateAttributes.height)
        formData.append("height", recreateAttributes.height);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/aura/recreate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      let payload: { [key: string]: unknown } = {};
      try {
        payload = await response.json();
      } catch (error) {
        // no-op: response may not always include JSON in rare edge cases
      }
      const payloadMessage =
        typeof payload.message === "string"
          ? payload.message
          : "Failed to recreate Aura";

      if (!response.ok) {
        if (response.status === 409 && isRecreationLimitError(payloadMessage)) {
          setRecreateUsed(maxRecreationAttempts);
        }
        throw new Error(payloadMessage);
      }

      const nextJobId = payload.job_id ? String(payload.job_id) : null;
      if (nextJobId) {
        setRecreateJobId(nextJobId);
        setRecreateProgress((prev) => Math.max(prev, 12));
      } else {
        setRecreateProgress(0);
      }

      setIsStartingRecreation(false);

      toast({
        title: "Recreate Started",
        description:
          recreateMode === "new-photo"
            ? "Using your new photo, we are creating a fresh Aura now."
            : "Using your existing photo, we are recreating your Aura now.",
        duration: 3000,
        className: "bg-[#F5F0E6] border-[#D4B76E] text-[#1A1A1A]",
      });
    } catch (error) {
      setIsStartingRecreation(false);
      setRecreateProgress(0);
      setShowRecreateModal(true);
      setRecreateDraftError(
        error instanceof Error ? error.message : "Failed to recreate Aura.",
      );
    }
  };

  useEffect(() => {
    if (!recreatePhoto) {
      setRecreatePhotoPreview(null);
      return;
    }

    const nextPreview = URL.createObjectURL(recreatePhoto);
    setRecreatePhotoPreview(nextPreview);

    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [recreatePhoto]);

  useEffect(() => {
    if (!showRecreateModal) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showRecreateModal]);

  useEffect(() => {
    if (!recreateJobId) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/aura/job/${recreateJobId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) return;
        const payload = await response.json();
        if (typeof payload.progress === "number") {
          setRecreateProgress(payload.progress);
        }

        if (payload.status === "completed") {
          clearInterval(interval);
          setIsStartingRecreation(false);
          setRecreateJobId(null);
          setRecreateProgress(100);
          const completedAuraId = payload?.data?.auraId
            ? String(payload.data.auraId)
            : payload?.result?.auraId
              ? String(payload.result.auraId)
              : latestAuraId;
          fetchAura();
          setPendingAvatarScroll(true);
          setRecreateUsed((prev) => Math.min(prev + 1, maxRecreationAttempts));
          setFeedbackContext({
            type: "AVATAR_RECREATION",
            referenceId: completedAuraId,
            label: "Avatar Recreation",
          });
          setShowFeedbackSheet(true);
          toast({
            title: "Recreation Complete",
            description: "Your Aura has been recreated successfully.",
            duration: 3000,
            className: "bg-[#F5F0E6] border-[#D4B76E] text-[#1A1A1A]",
          });
        } else if (payload.status === "failed") {
          clearInterval(interval);
          setIsStartingRecreation(false);
          setRecreateJobId(null);
          setRecreateProgress(0);
          toast({
            variant: "destructive",
            title: "Recreation Failed",
            description:
              payload.error ||
              "Something went wrong during recreation. Please try again.",
            duration: 4000,
          });
        }
      } catch (error) {
        console.error("Error polling recreation status:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [recreateJobId, toast, fetchAura, latestAuraId, maxRecreationAttempts]);

  if (loading) {
    return (
      <div className="aura-profile-page">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-2xl font-serif text-charcoal">
            Loading your Aura...
          </div>
        </div>
      </div>
    );
  }

  const remainingRecreations = Math.max(
    0,
    maxRecreationAttempts - recreateUsed,
  );
  const editRequiredAttributeErrors = getRequiredAttributeErrors(attributes);
  const recreateRequiredAttributeErrors =
    getRequiredAttributeErrors(recreateAttributes);
  const showEditMissingFields =
    showEditValidation && Object.keys(editRequiredAttributeErrors).length > 0;
  const showRecreateMissingFields =
    showRecreateValidation &&
    Object.keys(recreateRequiredAttributeErrors).length > 0;
  const displayedAge =
    calculateExactAge(attributes.dateOfBirth || undefined) ?? exactAge;

  if (!aura) {
    return (
      <div className="aura-profile-page">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-2xl font-serif text-charcoal">No Aura found</div>
        </div>
      </div>
    );
  }

  const activeAvatarImageUrl =
    aura.selected_avatar?.model_url || aura.model_url || aura.image_url;
  const avatarHistory = aura.avatar_history ?? [];

  return (
    <div className="aura-profile-page">
      {/* Simple header text - no bar */}
      <div className="simple-header">
        <button
          onClick={() => navigate("/user-dashboard")}
          className="header-left-text"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "8px",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(0,0,0,0.05)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <span style={{ fontSize: "20px" }}>←</span>
          <span>Back</span>
        </button>
        <div className="header-center-text">AI Avatar Platform</div>
        <div className="header-right-text">{userName || "USER"}</div>
      </div>

      <div className="aura-profile-container">
        {/* Left Panel - Attributes */}
        <div className="attributes-panel">
          <div className="attributes-header">
            <h2 className="attributes-title">Your Attributes</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="edit-toggle-btn"
              >
                Edit
              </button>
            )}
          </div>

          <div className="attributes-grid">
            {isEditing && (
              <div className="rounded-2xl border border-gold/25 bg-white/70 px-4 py-3 shadow-[0_12px_28px_rgba(201,165,95,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6936]">
                  Required For Your Aura
                </p>
                <p className="mt-1 text-sm text-charcoal/70">
                  Body shape, body size, and skin tone must stay filled.
                </p>
              </div>
            )}

            {/* Body Shape */}
            <EditableAttributeCard
              label="BODY SHAPE"
              value={attributes.bodyShape}
              isEditing={isEditing}
              onChange={(value) => handleAttributeChange("bodyShape", value)}
              type="select"
              options={BODY_SHAPE_OPTIONS}
              required
              hasError={
                showEditMissingFields &&
                Boolean(editRequiredAttributeErrors.bodyShape)
              }
              helperText={
                showEditMissingFields
                  ? editRequiredAttributeErrors.bodyShape
                  : undefined
              }
            />

            {/* Skin Tone */}
            <EditableAttributeCard
              label="SKIN TONE"
              value={attributes.skinTone}
              isEditing={isEditing}
              onChange={(value) => handleAttributeChange("skinTone", value)}
              type="select"
              options={SKIN_TONE_OPTIONS}
              required
              hasError={
                showEditMissingFields &&
                Boolean(editRequiredAttributeErrors.skinTone)
              }
              helperText={
                showEditMissingFields
                  ? editRequiredAttributeErrors.skinTone
                  : undefined
              }
            />

            {/* Body Size */}
            <EditableAttributeCard
              label="BODY SIZE"
              value={attributes.bodySize}
              isEditing={isEditing}
              onChange={(value) => handleAttributeChange("bodySize", value)}
              type="select"
              options={BODY_SIZE_OPTIONS}
              required
              hasError={
                showEditMissingFields &&
                Boolean(editRequiredAttributeErrors.bodySize)
              }
              helperText={
                showEditMissingFields
                  ? editRequiredAttributeErrors.bodySize
                  : undefined
              }
            />

            <EditableAttributeCard
              label="HEIGHT"
              value={attributes.height}
              isEditing={isEditing}
              onChange={(value) => handleAttributeChange("height", value)}
              type="number"
              unit="cm"
            />

            {/* Gender */}
            <EditableAttributeCard
              label="GENDER"
              value={attributes.gender}
              isEditing={isEditing}
              onChange={(value) => handleAttributeChange("gender", value)}
              type="select"
              options={GENDER_OPTIONS}
            />

            <EditableAttributeCard
              label="DATE OF BIRTH"
              value={attributes.dateOfBirth}
              isEditing={isEditing}
              onChange={(value) => handleAttributeChange("dateOfBirth", value)}
              type="date"
            />

            {/* Exact Age (Read-only) */}
            <div className="editable-attribute-card">
              <div className="attribute-label">AGE</div>
              <div className="attribute-value">
                {displayedAge !== null ? `${displayedAge} years` : "Not specified"}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing ? (
            <div className="action-buttons">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="action-btn save-btn"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="action-btn cancel-btn"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="action-buttons">
              <button
                onClick={openRecreateFlow}
                disabled={isRecreateDisabled}
                className={`action-btn cancel-btn ${isRecreateDisabled ? "disabled-btn" : ""}`}
              >
                {isRecreationInProgress
                  ? "Recreating Avatar..."
                  : "Recreate Avatar"}
              </button>
              <button
                onClick={() => navigate("/user-dashboard")}
                className="action-btn continue-btn"
              >
                Continue
              </button>
            </div>
          )}

          <div className="recreate-note">
            {isRecreationInProgress
              ? "Aura recreation is in progress."
              : hasReachedRecreationLimit
                ? "Recreation limit reached for this account."
                : `Recreation credits: ${remainingRecreations} of ${maxRecreationAttempts} remaining`}
          </div>
        </div>

        {/* Right Panel - Avatar Display */}
        <div ref={avatarPanelRef} className="avatar-panel">
          <AvatarDisplay
            imageUrl={activeAvatarImageUrl}
            userName={avatarUserName}
          />

          {!hideAuraLibrary && (
            <div className="avatar-library-shell">
              <div className="avatar-library-header">
                <div className="avatar-library-copy">
                  <p className="avatar-library-eyebrow">Aura Library</p>
                  <h3 className="avatar-library-title">Generated Avatars</h3>
                  <p className="avatar-library-description">
                    Recreated avatars stay here in your Aura Profile. Pick the
                    one you want to use for try-ons.
                  </p>
                </div>
                <div className="avatar-library-count">
                  {avatarHistory.length} saved avatars
                </div>
              </div>

              {avatarHistory.length > 0 ? (
                <div className="avatar-library-list">
                  {avatarHistory.map((avatarItem) => {
                    const isSelected =
                      aura.selected_avatar_id === avatarItem.avatar_id;
                    const summaryAttributes = [
                      {
                        label: "Body Shape",
                        value: formatAvatarAttributeValue(
                          avatarItem.attributes.body_shape,
                        ),
                      },
                      {
                        label: "Body Size",
                        value: formatAvatarAttributeValue(
                          avatarItem.attributes.body_size,
                        ),
                      },
                      {
                        label: "Skin Tone",
                        value: formatAvatarAttributeValue(
                          avatarItem.attributes.skin_tone,
                        ),
                      },
                      {
                        label: "Gender",
                        value: formatAvatarAttributeValue(
                          avatarItem.attributes.gender,
                        ),
                      },
                      {
                        label: "Height",
                        value: formatAvatarAttributeValue(
                          avatarItem.attributes.height_cm,
                          "cm",
                        ),
                      },
                    ].filter(
                      (
                        attribute,
                      ): attribute is { label: string; value: string } =>
                        Boolean(attribute.value),
                    );

                    return (
                      <article
                        key={avatarItem.avatar_id}
                        className={`avatar-library-card ${isSelected ? "selected" : ""}`}
                      >
                        <div className="avatar-library-preview">
                          <AuraFramedImage
                            src={avatarItem.model_url}
                            alt="Generated Aura avatar"
                            className="avatar-library-image-frame"
                            foregroundClassName="avatar-library-image"
                          />

                          <div className="avatar-library-badges">
                            <span className="avatar-library-badge avatar-library-badge-light">
                              {avatarItem.source === "recreation"
                                ? "Recreated"
                                : "Created"}
                            </span>
                            <span className="avatar-library-badge avatar-library-badge-dark">
                              {avatarItem.generation_type === "generated"
                                ? "AI Generated"
                                : "Source Based"}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="avatar-library-active-pill">
                              Active For Try-Ons
                            </div>
                          )}
                        </div>

                        <div className="avatar-library-content">
                          <div className="avatar-library-card-head">
                            <div className="avatar-library-date-block">
                              <p className="avatar-library-date-label">
                                Saved On
                              </p>
                              <p className="avatar-library-date-value">
                                {formatAvatarDate(avatarItem.created_at)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectAvatar(avatarItem.avatar_id)
                              }
                              disabled={
                                isSelected ||
                                selectingAvatarId === avatarItem.avatar_id
                              }
                              className={`avatar-library-action ${isSelected ? "active" : ""} ${selectingAvatarId === avatarItem.avatar_id ? "busy" : ""}`}
                            >
                              {isSelected
                                ? "Current Avatar"
                                : selectingAvatarId === avatarItem.avatar_id
                                  ? "Switching..."
                                  : "Use This Avatar"}
                            </button>
                          </div>

                          {summaryAttributes.length > 0 && (
                            <div className="avatar-library-attributes">
                              {summaryAttributes.map((attribute) => (
                                <div
                                  key={`${avatarItem.avatar_id}-${attribute.label}`}
                                  className="avatar-library-attribute"
                                >
                                  <span className="font-semibold">
                                    {attribute.label}:
                                  </span>{" "}
                                  {attribute.value}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="avatar-library-empty">
                  Your generated avatars will appear here after Aura creation
                  and each recreation.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showRecreateModal && (
        <div className="recreate-backdrop" onClick={closeRecreateFlow}>
          <div
            className="recreate-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="recreate-modal-header">
              <div>
                <h3 className="recreate-modal-title">Recreate Your Avatar</h3>
                <p className="recreate-modal-subtitle">
                  Pick one option. No need to fill the entire form again.
                </p>
              </div>
              <button
                type="button"
                className="recreate-close-btn"
                onClick={closeRecreateFlow}
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="recreate-mode-switch">
              <button
                type="button"
                className={`recreate-mode-pill ${recreateMode === "attributes-only" ? "active" : ""}`}
                onClick={() => setRecreateMode("attributes-only")}
              >
                <Wand2 size={16} />
                <span>Change attributes</span>
              </button>
              <button
                type="button"
                className={`recreate-mode-pill ${recreateMode === "new-photo" ? "active" : ""}`}
                onClick={() => {
                  setRecreateMode("new-photo");
                  setRecreateDraftError("");
                }}
              >
                <Upload size={16} />
                <span>Use new photo</span>
              </button>
            </div>

            <p className="recreate-photo-helper">
              {recreateMode === "attributes-only"
                ? "Keep old source photo + refresh only selected attributes."
                : "Upload a brand-new source photo and keep old values if you want."}
            </p>

            {recreateMode === "new-photo" ? (
              <div className="recreate-upload-area">
                <label
                  htmlFor="recreate-photo"
                  className="recreate-upload-label"
                >
                  Upload the new source photo for this recreation
                </label>
                <input
                  id="recreate-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleRecreatePhotoChange}
                  className="recreate-upload-input"
                />
                <label
                  htmlFor="recreate-photo"
                  className="relative rounded-2xl overflow-hidden border-2 border-gold/40 group cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 block"
                  style={{ height: "220px" }}
                >
                  {recreatePhotoPreview ? (
                    <img
                      src={recreatePhotoPreview}
                      alt="Selected photo preview"
                      className="w-full h-full object-contain object-center bg-[#F5EDDD]"
                    />
                  ) : (
                    <div className="recreate-photo-placeholder">
                      Drop image here or click to upload
                    </div>
                  )}
                </label>
              </div>
            ) : (
              <div className="recreate-photo-source">
                <p>Current source photo will be kept.</p>
                <div
                  className="relative rounded-2xl overflow-hidden border-2 border-gold/40 shadow-lg transition-all duration-300"
                  style={{ height: "220px" }}
                >
                  <img
                    src={aura.image_url}
                    alt="Current source photo"
                    className="w-full h-full object-contain object-center bg-[#F5EDDD]"
                  />
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-gold/25 bg-white/70 px-4 py-3 shadow-[0_12px_28px_rgba(201,165,95,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6936]">
                Required For Recreation
              </p>
              <p className="mt-1 text-sm text-charcoal/70">
                Keep body shape, body size, and skin tone filled before starting
                a recreation.
              </p>
            </div>

            <div className="recreate-attributes-wrap">
              <EditableAttributeCard
                label="HEIGHT"
                value={recreateAttributes.height}
                isEditing
                onChange={(value) =>
                  handleRecreateAttributeChange("height", value)
                }
                type="number"
                unit="cm"
              />
              <EditableAttributeCard
                label="BODY SHAPE"
                value={recreateAttributes.bodyShape}
                isEditing
                onChange={(value) =>
                  handleRecreateAttributeChange("bodyShape", value)
                }
                type="select"
                options={BODY_SHAPE_OPTIONS}
                required
                hasError={
                  showRecreateMissingFields &&
                  Boolean(recreateRequiredAttributeErrors.bodyShape)
                }
                helperText={
                  showRecreateMissingFields
                    ? recreateRequiredAttributeErrors.bodyShape
                    : undefined
                }
              />
              <EditableAttributeCard
                label="BODY SIZE"
                value={recreateAttributes.bodySize}
                isEditing
                onChange={(value) =>
                  handleRecreateAttributeChange("bodySize", value)
                }
                type="select"
                options={BODY_SIZE_OPTIONS}
                required
                hasError={
                  showRecreateMissingFields &&
                  Boolean(recreateRequiredAttributeErrors.bodySize)
                }
                helperText={
                  showRecreateMissingFields
                    ? recreateRequiredAttributeErrors.bodySize
                    : undefined
                }
              />
              <EditableAttributeCard
                label="SKIN TONE"
                value={recreateAttributes.skinTone}
                isEditing
                onChange={(value) =>
                  handleRecreateAttributeChange("skinTone", value)
                }
                type="select"
                options={SKIN_TONE_OPTIONS}
                required
                hasError={
                  showRecreateMissingFields &&
                  Boolean(recreateRequiredAttributeErrors.skinTone)
                }
                helperText={
                  showRecreateMissingFields
                    ? recreateRequiredAttributeErrors.skinTone
                    : undefined
                }
              />
              <EditableAttributeCard
                label="GENDER"
                value={recreateAttributes.gender}
                isEditing
                onChange={(value) =>
                  handleRecreateAttributeChange("gender", value)
                }
                type="select"
                options={GENDER_OPTIONS}
              />
            </div>

            {recreateDraftError && (
              <p className="recreate-error">{recreateDraftError}</p>
            )}

            <div className="recreate-actions">
              <button
                type="button"
                onClick={handleRecreateAvatar}
                className="recreate-submit-btn"
                disabled={recreateMode === "new-photo" && !recreatePhoto}
              >
                <RefreshCw size={16} />
                <span>Start Recreation</span>
              </button>
              <button
                type="button"
                onClick={closeRecreateFlow}
                className="recreate-keep-btn"
              >
                Keep old avatar only
              </button>
            </div>
          </div>
        </div>
      )}

      {feedbackContext && (
        <FeedbackBottomSheet
          isOpen={showFeedbackSheet}
          context={feedbackContext}
          onClose={closeFeedbackSheet}
        />
      )}

      <ProcessingModal
        isOpen={isRecreationInProgress}
        progress={Math.min(displayedRecreateProgress, 100)}
        estimatedTime={recreateEstimatedTime}
      />
    </div>
  );
}
