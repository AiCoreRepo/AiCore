import { useState } from 'react';
import { X } from 'lucide-react';
import './TermsModal.css';

interface TermsModalProps {
    isOpen: boolean;
    onAccept: () => void;
    onDecline: () => void;
}

export default function TermsModal({ isOpen, onAccept, onDecline }: TermsModalProps) {
    const [isChecked, setIsChecked] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="terms-modal-overlay">
            <div className="terms-modal">
                <div className="terms-document">
                    {/* Close Button */}
                    <button className="terms-close-btn" onClick={onDecline} aria-label="Close">
                        <X size={24} />
                    </button>

                    {/* Logo */}
                    <div className="terms-logo">
                        <h1 className="logo-text">AiVestire</h1>
                    </div>

                    {/* Title */}
                    <h1 className="terms-title">Creator Terms & Conditions</h1>

                    {/* Content */}
                    <div className="terms-content-simple">
                        {/* Rewards Section */}
                        <section className="terms-section-simple terms-highlight">
                            <h3>🏆 Rank & Earn Monthly Rewards</h3>
                            <p>Top-performing creators with the highest rankings and sales receive exclusive monthly cash rewards. Stand out and get crowned Creator of the Month with special recognition and bonuses.</p>
                        </section>

                        <section className="terms-section-simple terms-highlight">
                            <h3>💎 Quality Standards & Visibility</h3>
                            <p>Premium, high-quality products boost your creator rating, increase visibility, and improve your platform ranking. Quality directly impacts your success and earnings.</p>
                        </section>

                        {/* Platform Fees */}
                        <section className="terms-section-simple terms-pricing">
                            <h3>💰 Platform Fees & Pricing</h3>
                            <p><strong>Commission:</strong> 15% platform fee on all sales</p>
                            <p><strong>Payment:</strong> Weekly payouts via bank transfer or digital wallet</p>
                            <p><strong>Minimum Payout:</strong> $50 threshold for withdrawals</p>
                            <p><strong>Pricing Freedom:</strong> Set your own product prices with transparent fee disclosure</p>
                        </section>

                        {/* Product Requirements */}
                        <section className="terms-section-simple">
                            <h3>📸 Image & Product Requirements</h3>
                            <p><strong>Resolution:</strong> Minimum 1000x1000 pixels, high-quality photography</p>
                            <p><strong>Quantity:</strong> 3-20 images per product</p>
                            <p><strong>Formats:</strong> JPEG, PNG, WebP (max 10MB per image)</p>
                            <p><strong>Presentation:</strong> Clear, well-lit, professional shots. No watermarks except brand logos</p>
                        </section>

                        {/* Prohibited Items */}
                        <section className="terms-section-simple">
                            <h3>🚫 Prohibited Content</h3>
                            <p>Counterfeit products, replicas, used/damaged items, inappropriate content, and intellectual property violations are strictly forbidden and will result in immediate removal.</p>
                        </section>

                        {/* Creator Responsibilities */}
                        <section className="terms-section-simple">
                            <h3>✅ Your Responsibilities</h3>
                            <p><strong>Authenticity:</strong> Guarantee all products are genuine and as described</p>
                            <p><strong>Inventory:</strong> Maintain accurate stock levels and update availability</p>
                            <p><strong>Communication:</strong> Respond to customer inquiries within 24 hours</p>
                            <p><strong>Compliance:</strong> Follow all platform policies and quality guidelines</p>
                        </section>

                        {/* Account & Security */}
                        <section className="terms-section-simple">
                            <h3>🔒 Account Security & Compliance</h3>
                            <p>Maintain account security, provide accurate business information, respect intellectual property rights, and understand that policy violations may result in warnings, product removal, or account suspension.</p>
                        </section>

                        {/* Success Formula */}
                        <section className="terms-section-simple terms-highlight">
                            <h3>✨ Success Formula</h3>
                            <p><strong>Create Better:</strong> High-quality products and professional presentation</p>
                            <p><strong>Rank Higher:</strong> Boost visibility through ratings and customer satisfaction</p>
                            <p><strong>Earn More:</strong> Maximize sales and unlock monthly reward opportunities</p>
                        </section>
                    </div>

                    {/* Actions */}
                    <div className="terms-actions-simple">
                        <label className="terms-checkbox-simple">
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => setIsChecked(e.target.checked)}
                            />
                            <span>I have read and agree to the Terms & Conditions</span>
                        </label>

                        <div className="terms-buttons-simple">
                            <button
                                className="terms-btn-simple terms-btn-decline-simple"
                                onClick={onDecline}
                            >
                                Decline
                            </button>
                            <button
                                className="terms-btn-simple terms-btn-accept-simple"
                                onClick={onAccept}
                                disabled={!isChecked}
                            >
                                Accept & Continue
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
