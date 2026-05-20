import { useEffect, useState } from 'react';
import { CheckCircle2, FileText, X } from 'lucide-react';
import {
    creatorTermsAcknowledgements,
    creatorTermsContent,
    creatorTermsPdfUrl,
} from '@/content/creatorTerms';
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
    const [checkedItems, setCheckedItems] = useState<boolean[]>(
        creatorTermsAcknowledgements.map(() => false),
    );
    const [showDocument, setShowDocument] = useState(false);
    const allChecked = checkedItems.every(Boolean);

    useEffect(() => {
        if (!isOpen) {
            setCheckedItems(creatorTermsAcknowledgements.map(() => false));
            setShowDocument(false);
        }
    }, [isOpen]);

    const toggleItem = (index: number) => {
        setCheckedItems((current) =>
            current.map((checked, itemIndex) =>
                itemIndex === index ? !checked : checked,
            ),
        );
    };

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
                        Confirm the essentials before continuing.
                    </p>
                </div>

                <div className="terms-summary">
                    <div className="terms-summary-list">
                        {creatorTermsAcknowledgements.map((item, index) => (
                            <label
                                key={item}
                                className={`terms-summary-check ${checkedItems[index] ? 'is-checked' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checkedItems[index]}
                                    onChange={() => toggleItem(index)}
                                    disabled={isSubmitting}
                                />
                                <span className="terms-summary-box">
                                    {checkedItems[index] && <CheckCircle2 size={16} strokeWidth={3} />}
                                </span>
                                <span>{item}</span>
                            </label>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="terms-read-full"
                        onClick={() => setShowDocument((current) => !current)}
                    >
                        <FileText size={18} />
                        {showDocument ? 'Hide full terms' : 'Read full terms'}
                    </button>

                    {showDocument && (
                        <div className="terms-pdf-panel">
                            <iframe
                                title="AIVESTIRE partner terms and conditions"
                                src={`${creatorTermsPdfUrl}#toolbar=1&navpanes=0`}
                            />
                        </div>
                    )}
                </div>

                <div className="terms-actions">
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
                            disabled={!allChecked || isSubmitting}
                        >
                            {isSubmitting ? 'Processing...' : 'Accept & Continue'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
