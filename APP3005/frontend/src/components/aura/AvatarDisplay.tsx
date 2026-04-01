import React from 'react';
import { AuraFramedImage } from './AuraFramedImage';

interface AvatarDisplayProps {
    imageUrl: string;
    userName?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ imageUrl, userName }) => {
    const firstName = userName?.trim().split(/\s+/)[0];
    const avatarLabel = firstName ? `${firstName}'s Avatar` : "Your Avatar";

    return (
        <div className="avatar-display-container">
            <div className="avatar-display-shell">
                <div className="avatar-display-heading">
                    <div className="avatar-display-copy">
                        <p className="avatar-eyebrow">Active Aura</p>
                        <p className="avatar-label-caption">Current avatar for try-ons</p>
                        <div className="avatar-label">{avatarLabel}</div>
                    </div>
                    <div className="avatar-status-pill">Ready</div>
                </div>

                <div className="avatar-frame">
                    <div className="sparkle sparkle-1">✦</div>
                    <div className="sparkle sparkle-2">✦</div>
                    <div className="sparkle sparkle-3">✦</div>
                    <div className="sparkle sparkle-4">✦</div>
                    <div className="sparkle sparkle-5">✦</div>
                    <div className="sparkle sparkle-6">✦</div>

                    <AuraFramedImage
                        src={imageUrl}
                        alt={userName ? `${userName}'s Aura` : "User's Aura"}
                        className="avatar-image-wrapper"
                        foregroundClassName="avatar-image"
                        loading="eager"
                    />
                </div>

                <p className="avatar-display-note">
                    This avatar is currently selected across your Aura profile and virtual try-on flow.
                </p>
            </div>
        </div>
    );
};
