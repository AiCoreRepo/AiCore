import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast"; // Import toast hook
import { EditableAttributeCard } from "@/components/aura/EditableAttributeCard";
import { AvatarDisplay } from "@/components/aura/AvatarDisplay";
import { BODY_SIZE_OPTIONS, SKIN_TONE_OPTIONS, BODY_SHAPE_OPTIONS, GENDER_OPTIONS } from "@/constants/aura.constants";
import "@/components/aura/aura-styles.css";

interface AuraData {
    aura_id: string;
    user_id: string;
    image_url: string;
    model_url?: string;
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
}

export default function AuraProfile() {
    const [aura, setAura] = useState<AuraData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [userName, setUserName] = useState<string>('');
    const [avatarUserName, setAvatarUserName] = useState<string>('');
    const [exactAge, setExactAge] = useState<number | null>(null);
    const [isRecreateDisabled, setIsRecreateDisabled] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    // Editable attributes state
    const [attributes, setAttributes] = useState<AttributeValues>({
        bodyShape: '',
        bodySize: '',
        skinTone: '',
        gender: '',
    });

    // Store original values for cancel functionality
    const [originalAttributes, setOriginalAttributes] = useState<AttributeValues>({
        bodyShape: '',
        bodySize: '',
        skinTone: '',
        gender: '',
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

    const toTitleCase = (value: string) =>
        value
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');

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

    useEffect(() => {
        const fetchAura = async () => {
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
                    const regenMax = Number(userData.max_avatar_regenerations ?? 2);
                    setIsRecreateDisabled(regenUsed >= regenMax);

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

                // Initialize attribute values
                const initialAttributes = {
                    bodyShape: data.body_shape || '',
                    bodySize: data.body_size || '',
                    skinTone: data.skin_tone || '',
                    gender: data.gender || '',
                };
                setAttributes(initialAttributes);
                setOriginalAttributes(initialAttributes);
            } catch (error) {
                console.error('Error fetching Aura:', error);
                navigate('/aura-dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchAura();
    }, [navigate]);

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

    const handleCreateAgain = () => {
        setIsRecreateDisabled(true);
        navigate('/aura-dashboard');
    };

    if (loading) {
        return (
            <div className="aura-profile-page">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-2xl font-serif text-charcoal">Loading your Aura...</div>
                </div>
            </div>
        );
    }

    if (!aura) {
        return (
            <div className="aura-profile-page">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-2xl font-serif text-charcoal">No Aura found</div>
                </div>
            </div>
        );
    }

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
                                onClick={handleCreateAgain}
                                disabled={isRecreateDisabled}
                                className="action-btn cancel-btn"
                            >
                                Recreate Avatar
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="action-btn continue-btn"
                            >
                                Continue
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Panel - Avatar Display */}
                <div className="avatar-panel">
                    <AvatarDisplay imageUrl={aura.model_url || aura.image_url} userName={avatarUserName} />
                </div>
            </div>
        </div>
    );
}
