import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { creatorTermsContent } from '@/content/creatorTerms';
import './TermsModal.css';

interface TermsModalProps {
    isOpen: boolean;
    onAccept: () => void;
    onDecline: () => void;
    isSubmitting?: boolean;
}

export default function TermsModal({
    isOpen,
    onAccept,
    onDecline,
    isSubmitting = false,
}: TermsModalProps) {
    const [isChecked, setIsChecked] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIsChecked(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="terms-modal-overlay">
            <div className="terms-modal">
                <button
                    className="terms-close-btn"
                    onClick={onDecline}
                    aria-label="Close"
                    disabled={isSubmitting}
                >
                    <X size={24} />
                </button>

                <div className="terms-header">
                    <h2>{creatorTermsContent.title}</h2>
                    <p className="terms-subtitle">
                        {creatorTermsContent.brand} • {creatorTermsContent.intro}
                    </p>
                </div>

                <div className="terms-content">
                    {creatorTermsContent.sections.map((section, index) => (
                        <section className="terms-section" key={`${section.title}-${index}`}>
                            <h3>{section.title}</h3>
                            <ul>
                                {section.items.map((item, itemIndex) => (
                                    <li key={`${section.title}-${itemIndex}`}>{item}</li>
                                ))}
                            </ul>
                        </section>
                    ))}

                    <div className="terms-footer-note">
                        <p>
                            <strong>{creatorTermsContent.closingNote}</strong>{" "}
                            {creatorTermsContent.welcomeMessage}
                        </p>
                    </div>
                </div>

                <div className="terms-actions">
                    <label className="terms-checkbox">
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setIsChecked(e.target.checked)}
                            disabled={isSubmitting}
                        />
                        <span>I have read and agree to the creator onboarding terms.</span>
                    </label>

                    <div className="terms-buttons">
                        <button
                            className="terms-btn terms-btn-decline"
                            onClick={onDecline}
                            disabled={isSubmitting}
                        >
                            Decline
                        </button>
                        <button
                            className="terms-btn terms-btn-accept"
                            onClick={onAccept}
                            disabled={!isChecked || isSubmitting}
                        >
                            {isSubmitting ? 'Processing...' : 'Accept & Continue'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
