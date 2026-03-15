import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast"; // Import toast hook
import { EditableAttributeCard } from "@/components/aura/EditableAttributeCard";
import { AvatarDisplay } from "@/components/aura/AvatarDisplay";
import { ProcessingModal } from "@/components/aura/ProcessingModal";
import { BODY_SIZE_OPTIONS, SKIN_TONE_OPTIONS, BODY_SHAPE_OPTIONS, GENDER_OPTIONS } from "@/constants/aura.constants";
import "@/components/aura/aura-styles.css";
import { FeedbackBottomSheet } from "@/components/feedback/FeedbackBottomSheet";
import { FeedbackContextType } from "@/lib/api";
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
}

interface AttributeValues {
    bodyShape: string;
    bodySize: string;
    skinTone: string;
    gender: string;
    height: string;
}

type RecreateMode = "attributes-only" | "new-photo";

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
    const [userName, setUserName] = useState<string>('');
    const [avatarUserName, setAvatarUserName] = useState<string>('');
    const [exactAge, setExactAge] = useState<number | null>(null);
    const [maxRecreationAttempts, setMaxRecreationAttempts] = useState(DEFAULT_MAX_RECREATION_ATTEMPTS);
    const [recreateUsed, setRecreateUsed] = useState(0);
    const [showRecreateModal, setShowRecreateModal] = useState(false);
    const [recreateMode, setRecreateMode] = useState<RecreateMode>("attributes-only");
    const [recreateAttributes, setRecreateAttributes] = useState<AttributeValues>({
        bodyShape: '',
        bodySize: '',
        skinTone: '',
        gender: '',
        height: '',
    });
    const [recreatePhoto, setRecreatePhoto] = useState<File | null>(null);
    const [recreatePhotoPreview, setRecreatePhotoPreview] = useState<string | null>(null);
    const [recreateDraftError, setRecreateDraftError] = useState("");
    const [recreateJobId, setRecreateJobId] = useState<string | null>(null);
    const [recreateProgress, setRecreateProgress] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const [showFeedbackSheet, setShowFeedbackSheet] = useState(false);
    const [feedbackContext, setFeedbackContext] = useState<FeedbackContext | null>(null);
    const { toast } = useToast();
    const recreateEstimatedTime = Math.max(0, Math.ceil((100 - recreateProgress) / 5));
    const isRecreationInProgress = recreateJobId !== null;
    const hasReachedRecreationLimit = recreateUsed >= maxRecreationAttempts;
    const isRecreateDisabled = isRecreationInProgress || hasReachedRecreationLimit;

    // Editable attributes state
    const [attributes, setAttributes] = useState<AttributeValues>({
        bodyShape: '',
        bodySize: '',
        skinTone: '',
        gender: '',
        height: '',
    });

    // Store original values for cancel functionality
    const [originalAttributes, setOriginalAttributes] = useState<AttributeValues>({
        bodyShape: '',
        bodySize: '',
        skinTone: '',
        gender: '',
        height: '',
    });

    const calculateExactAge = (dobString?: string): number | null => {
        if (!dobString) return null;

        const birthDate = new Date(dobString);
        if (Number.isNaN(birthDate.getTime())) return null;

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age >= 0 ? age : null;
    };

    const toTitleCase = useCallback((value: string) =>
        value
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ')
    , []);

    const parseRecreationLimit = useCallback((value: unknown) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return DEFAULT_MAX_RECREATION_ATTEMPTS;
        }

        return Math.max(0, Math.floor(parsed));
    }, []);

    const isRecreationLimitError = useCallback((message: string) => {
        const normalizedMessage = message.toLowerCase();
        return normalizedMessage.includes('recreation limit')
            || normalizedMessage.includes('already used your aura recreation')
            || normalizedMessage.includes('only once');
    }, []);

    // Check for pending login from signup
    useEffect(() => {
        const pendingLogin = localStorage.getItem('pendingLogin');
        if (pendingLogin) {
            const { email, password } = JSON.parse(pendingLogin);
            // Auto-login
            const autoLogin = async () => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email, password }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        localStorage.setItem('access_token', data.access_token);
                        localStorage.setItem('refresh_token', data.refresh_token);
                        localStorage.removeItem('pendingLogin');
                    }
                } catch (error) {
                    console.error('Auto-login failed:', error);
                    localStorage.removeItem('pendingLogin');
                }
            };
            autoLogin();
        }
    }, []);

    const fetchAura = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                navigate('/user-login');
                return;
            }

            // Fetch user profile for name
            const userResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (userResponse.ok) {
                const userData = await userResponse.json();
                setUserName(userData.email.split('@')[0].toUpperCase());
                const rawName = String(userData.name || userData.store_name || userData.email.split('@')[0] || '');
                const cleanedName = toTitleCase(rawName.replace(/[._-]+/g, ' '));
                setAvatarUserName(cleanedName);
                const regenUsed = Number(userData.avatar_regenerations_used ?? 0);
                const normalizedMax = parseRecreationLimit(userData.max_avatar_regenerations);
                setMaxRecreationAttempts(normalizedMax);
                setRecreateUsed(Number.isFinite(regenUsed) ? Math.max(0, regenUsed) : 0);

                const localDobKey = `aivestire:dob:${(userData.email || '').toLowerCase()}`;
                const storedDob = userData?.dob || localStorage.getItem(localDobKey) || undefined;
                setExactAge(calculateExactAge(storedDob));
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/aura`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch Aura');
            }

            const data = await response.json();
            setAura(data);
            setLatestAuraId(data.aura_id || null);

            // Initialize attribute values
            const initialAttributes = {
                bodyShape: data.body_shape || '',
                bodySize: data.body_size || '',
                skinTone: data.skin_tone || '',
                gender: data.gender || '',
                height: data.height_cm ? String(data.height_cm) : '',
            };
            setAttributes(initialAttributes);
            setOriginalAttributes(initialAttributes);
            setRecreateAttributes(initialAttributes);
        } catch (error) {
            console.error('Error fetching Aura:', error);
            navigate('/aura-dashboard');
        } finally {
            setLoading(false);
        }
    }, [navigate, parseRecreationLimit, toTitleCase]);

    useEffect(() => {
        fetchAura();
    }, [fetchAura]);

    useEffect(() => {
        const state = location.state as { feedbackContext?: FeedbackContext } | null;
        const incomingContext = state?.feedbackContext;

        if (!incomingContext?.type) {
            return;
        }

        setFeedbackContext(incomingContext);
        setShowFeedbackSheet(true);
        navigate(location.pathname, { replace: true, state: null });
    }, [location.state, location.pathname, navigate]);

    const closeFeedbackSheet = () => {
        setShowFeedbackSheet(false);
        setFeedbackContext(null);
    };

    const handleAttributeChange = (key: keyof AttributeValues, value: string) => {
        setAttributes(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('access_token');

            const updateData = {
                bodyShape: attributes.bodyShape,
                bodySize: attributes.bodySize,
                skinTone: attributes.skinTone,
                gender: attributes.gender,
                ...(attributes.height ? { height: Number(attributes.height) } : {}),
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/aura`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                throw new Error('Failed to update Aura');
            }

            const updatedAura = await response.json();
            setAura(updatedAura);
            setOriginalAttributes(attributes);
            setIsEditing(false);

            // Show success toast
            toast({
                title: "Attributes Updated",
                description: "Your Aura profile has been successfully updated.",
                duration: 3000,
                className: "bg-[#F5F0E6] border-[#D4B76E] text-[#1A1A1A]", // Custom luxury styling
            });

        } catch (error) {
            console.error('Error updating Aura:', error);

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
    };

    const handleRecreateAttributeChange = (key: keyof AttributeValues, value: string) => {
        setRecreateAttributes(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const openRecreateFlow = () => {
        if (isRecreateDisabled) return;
        setRecreateAttributes(attributes);
        setRecreateMode("attributes-only");
        setRecreatePhoto(null);
        setRecreatePhotoPreview(null);
        setRecreateDraftError("");
        setShowRecreateModal(true);
    };

    const closeRecreateFlow = () => {
        setShowRecreateModal(false);
        setRecreatePhoto(null);
        setRecreatePhotoPreview(null);
        setRecreateDraftError("");
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
            setRecreateDraftError("Upload a new photo to use this recreation option.");
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            toast({
                variant: "destructive",
                title: "Authentication Required",
                description: "Please login to recreate your Aura.",
                duration: 3000,
            });
            navigate('/user-login');
            return;
        }

        try {
            setRecreateDraftError("");
            const formData = new FormData();
            if (recreateMode === "new-photo" && recreatePhoto) {
                formData.append('photo', recreatePhoto);
            }

            if (recreateAttributes.bodyShape) formData.append('bodyShape', recreateAttributes.bodyShape);
            if (recreateAttributes.bodySize) formData.append('bodySize', recreateAttributes.bodySize);
            if (recreateAttributes.skinTone) formData.append('skinTone', recreateAttributes.skinTone);
            if (recreateAttributes.gender) formData.append('gender', recreateAttributes.gender);
            if (recreateAttributes.height) formData.append('height', recreateAttributes.height);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/aura/recreate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            let payload: { [key: string]: unknown } = {};
            try {
                payload = await response.json();
            } catch (error) {
                // no-op: response may not always include JSON in rare edge cases
            }
            const payloadMessage =
                typeof payload.message === 'string' ? payload.message : 'Failed to recreate Aura';

            if (!response.ok) {
                if (response.status === 409 && isRecreationLimitError(payloadMessage)) {
                    setRecreateUsed(maxRecreationAttempts);
                }
                throw new Error(payloadMessage);
            }

            const nextJobId = payload.job_id ? String(payload.job_id) : null;
            if (nextJobId) {
                setRecreateJobId(nextJobId);
                setRecreateProgress(0);
            }

            setShowRecreateModal(false);

            toast({
                title: "Recreate Started",
                description: recreateMode === "new-photo"
                    ? "Using your new photo, we are creating a fresh Aura now."
                    : "Using your existing photo, we are recreating your Aura now.",
                duration: 3000,
                className: "bg-[#F5F0E6] border-[#D4B76E] text-[#1A1A1A]",
            });
        } catch (error) {
            setRecreateDraftError(error instanceof Error ? error.message : 'Failed to recreate Aura.');
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
                const token = localStorage.getItem('access_token');
                const response = await fetch(`${import.meta.env.VITE_API_URL}/aura/job/${recreateJobId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) return;
                const payload = await response.json();
                if (typeof payload.progress === 'number') {
                    setRecreateProgress(payload.progress);
                }

                if (payload.status === 'completed') {
                    clearInterval(interval);
                    setRecreateJobId(null);
                    setRecreateProgress(100);
                    const completedAuraId = payload?.data?.auraId
                        ? String(payload.data.auraId)
                        : payload?.result?.auraId
                            ? String(payload.result.auraId)
                            : latestAuraId;
                    fetchAura();
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
                } else if (payload.status === 'failed') {
                    clearInterval(interval);
                    setRecreateJobId(null);
                    setRecreateProgress(0);
                    toast({
                        variant: "destructive",
                        title: "Recreation Failed",
                        description: payload.error || "Something went wrong during recreation. Please try again.",
                        duration: 4000,
                    });
                }
            } catch (error) {
                console.error('Error polling recreation status:', error);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [recreateJobId, toast, fetchAura, latestAuraId, maxRecreationAttempts]);

    if (loading) {
        return (
            <div className="aura-profile-page">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-2xl font-serif text-charcoal">Loading your Aura...</div>
                </div>
            </div>
        );
    }

    const remainingRecreations = Math.max(0, maxRecreationAttempts - recreateUsed);

    if (!aura) {
        return (
            <div className="aura-profile-page">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-2xl font-serif text-charcoal">No Aura found</div>
                </div>
            </div>
        );
    }

    const tryOnCropPreviewUrl =
        aura.tryon_model_url && aura.tryon_model_url !== aura.model_url
            ? aura.tryon_model_url
            : null;

    return (
        <div className="aura-profile-page">
            {/* Simple header text - no bar */}
            <div className="simple-header">
                <button
                    onClick={() => navigate('/')}
                    className="header-left-text"
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                    <span style={{ fontSize: '20px' }}>←</span>
                    <span>Back</span>
                </button>
                <div className="header-center-text">AI Avatar Platform</div>
                <div className="header-right-text">{userName || 'USER'}</div>
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
                        {/* Body Shape */}
                        <EditableAttributeCard
                            label="BODY SHAPE"
                            value={attributes.bodyShape}
                            isEditing={isEditing}
                            onChange={(value) => handleAttributeChange('bodyShape', value)}
                            type="select"
                            options={BODY_SHAPE_OPTIONS}
                        />

                        {/* Skin Tone */}
                        <EditableAttributeCard
                            label="SKIN TONE"
                            value={attributes.skinTone}
                            isEditing={isEditing}
                            onChange={(value) => handleAttributeChange('skinTone', value)}
                            type="select"
                            options={SKIN_TONE_OPTIONS}
                        />

                        {/* Body Size */}
                        <EditableAttributeCard
                            label="BODY SIZE"
                            value={attributes.bodySize}
                            isEditing={isEditing}
                            onChange={(value) => handleAttributeChange('bodySize', value)}
                            type="select"
                            options={BODY_SIZE_OPTIONS}
                        />

                        <EditableAttributeCard
                            label="HEIGHT"
                            value={attributes.height}
                            isEditing={isEditing}
                            onChange={(value) => handleAttributeChange('height', value)}
                            type="number"
                            unit="cm"
                        />

                        {/* Gender */}
                        <EditableAttributeCard
                            label="GENDER"
                            value={attributes.gender}
                            isEditing={isEditing}
                            onChange={(value) => handleAttributeChange('gender', value)}
                            type="select"
                            options={GENDER_OPTIONS}
                        />

                        {/* Exact Age (Read-only) */}
                        <div className="editable-attribute-card">
                            <div className="attribute-label">AGE</div>
                            <div className="attribute-value">
                                {exactAge !== null ? `${exactAge} years` : 'Not specified'}
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
                                {isSaving ? 'Saving...' : 'Save Changes'}
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
                                {isRecreationInProgress ? "Recreating Avatar..." : "Recreate Avatar"}
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="action-btn continue-btn"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    <div className="recreate-note">
                        {isRecreationInProgress
                            ? 'Aura recreation is in progress.'
                            : hasReachedRecreationLimit
                                ? 'Recreation limit reached for this account.'
                                : `Recreation credits: ${remainingRecreations} of ${maxRecreationAttempts} remaining`}
                    </div>
                </div>

                {/* Right Panel - Avatar Display */}
                <div className="avatar-panel">
                    <AvatarDisplay imageUrl={aura.model_url || aura.image_url} userName={avatarUserName} />
                    {tryOnCropPreviewUrl && (
                        <div className="tryon-crop-preview">
                            <div className="tryon-crop-copy">
                                <p className="tryon-crop-eyebrow">Temporary Preview</p>
                                <h4 className="tryon-crop-title">Try-On Source Image</h4>
                                <p className="tryon-crop-description">
                                    This cropped avatar is stored in Cloudinary and used for virtual try-on so the base footwear does not interfere.
                                </p>
                            </div>
                            <div className="tryon-crop-frame">
                                <img
                                    src={tryOnCropPreviewUrl}
                                    alt="Cropped avatar used for try-on"
                                    className="tryon-crop-image"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showRecreateModal && (
                <div className="recreate-backdrop" onClick={closeRecreateFlow}>
                    <div className="recreate-modal-panel" onClick={(e) => e.stopPropagation()}>
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
                                <label htmlFor="recreate-photo" className="recreate-upload-label">
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
                                            className="w-full h-full object-cover object-top"
                                        />
                                    ) : (
                                        <div className="recreate-photo-placeholder">Drop image here or click to upload</div>
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
                                        className="w-full h-full object-cover object-top"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="recreate-attributes-wrap">
                            <EditableAttributeCard
                                label="HEIGHT"
                                value={recreateAttributes.height}
                                isEditing
                                onChange={(value) => handleRecreateAttributeChange("height", value)}
                                type="number"
                                unit="cm"
                            />
                            <EditableAttributeCard
                                label="BODY SHAPE"
                                value={recreateAttributes.bodyShape}
                                isEditing
                                onChange={(value) => handleRecreateAttributeChange("bodyShape", value)}
                                type="select"
                                options={BODY_SHAPE_OPTIONS}
                            />
                            <EditableAttributeCard
                                label="BODY SIZE"
                                value={recreateAttributes.bodySize}
                                isEditing
                                onChange={(value) => handleRecreateAttributeChange("bodySize", value)}
                                type="select"
                                options={BODY_SIZE_OPTIONS}
                            />
                            <EditableAttributeCard
                                label="SKIN TONE"
                                value={recreateAttributes.skinTone}
                                isEditing
                                onChange={(value) => handleRecreateAttributeChange("skinTone", value)}
                                type="select"
                                options={SKIN_TONE_OPTIONS}
                            />
                            <EditableAttributeCard
                                label="GENDER"
                                value={recreateAttributes.gender}
                                isEditing
                                onChange={(value) => handleRecreateAttributeChange("gender", value)}
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
                isOpen={!!recreateJobId}
                progress={Math.min(recreateProgress, 100)}
                estimatedTime={recreateEstimatedTime}
            />
        </div>
    );
}
