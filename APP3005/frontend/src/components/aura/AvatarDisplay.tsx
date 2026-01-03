import React from 'react';

interface AvatarDisplayProps {
    imageUrl: string;
    userName?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ imageUrl, userName }) => {
    return (
        <div className="avatar-display-container">
            <div className="avatar-frame">
                {/* Sparkle decorations */}
                <div className="sparkle sparkle-1">✦</div>
                <div className="sparkle sparkle-2">✦</div>
                <div className="sparkle sparkle-3">✦</div>
                <div className="sparkle sparkle-4">✦</div>
                <div className="sparkle sparkle-5">✦</div>
                <div className="sparkle sparkle-6">✦</div>

                {/* Avatar image */}
                <div className="avatar-image-wrapper">
                    <img
                        src={imageUrl}
                        alt={userName ? `${userName}'s Aura` : "User's Aura"}
                        className="avatar-image"
                    />
                </div>
            </div>
            <div className="avatar-label">User's 2D Avatar</div>
        </div>
    );
};
