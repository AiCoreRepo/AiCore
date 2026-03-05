import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, PartyPopper, CheckCircle } from 'lucide-react';
import { getSpecialCouponsApi, SpecialCouponsResponse } from '@/api/coupons.api';
import confetti from 'canvas-confetti';

const GOLD = '#D4AF37';

interface BirthdayBannerProps {
    onApplyCode: (code: string) => void;
    appliedCode?: string | null;
}

export const BirthdayBanner: React.FC<BirthdayBannerProps> = ({ onApplyCode, appliedCode }) => {
    const [specialData, setSpecialData] = useState<SpecialCouponsResponse | null>(null);

    useEffect(() => {
        const fetchSpecials = async () => {
            try {
                const data = await getSpecialCouponsApi();
                setSpecialData(data);

                // If there's a birthday today, pop confetti once!
                if (data.isBirthdayToday) {
                    const hasPopped = sessionStorage.getItem('bday_confetti_popped');
                    if (!hasPopped) {
                        launchConfetti();
                        sessionStorage.setItem('bday_confetti_popped', 'true');
                    }
                }
            } catch (err) {
                console.error('Failed to fetch special coupons', err);
            }
        };
        fetchSpecials();
    }, []);

    const launchConfetti = () => {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#D4AF37', '#ffffff']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#D4AF37', '#ffffff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    if (!specialData) return null;

    const allCoupons = [...specialData.birthdayCoupons, ...specialData.anniversaryCoupons];
    if (allCoupons.length === 0) return null;

    // Just show the first available special coupon for the banner
    const coupon = allCoupons[0];
    const isBirthday = specialData.birthdayCoupons.length > 0;
    const isApplied = appliedCode === coupon.code;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                className="mb-6 overflow-hidden"
            >
                <div
                    className="relative overflow-hidden rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
                    style={{
                        background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
                        border: `1px solid ${GOLD}40`,
                        boxShadow: `0 4px 20px ${GOLD}15`
                    }}
                >
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] opacity-10 blur-[80px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37] opacity-10 blur-[50px] rounded-full" />

                    {/* Icon */}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
                        style={{ background: `linear-gradient(135deg, ${GOLD}20, ${GOLD}40)` }}>
                        {isBirthday ? <Gift className="w-6 h-6" style={{ color: GOLD }} /> : <PartyPopper className="w-6 h-6" style={{ color: GOLD }} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-center sm:text-left relative z-10">
                        <h3 className="text-lg font-bold text-white mb-1 tracking-wide flex items-center justify-center sm:justify-start gap-2">
                            {isBirthday ? '🎂 Happy Birthday!' : '🎉 Special Anniversary Offer!'}
                        </h3>
                        <p className="text-sm text-gray-300">
                            {isBirthday
                                ? "It's your special day! Here's a gift from us to make it even better."
                                : "We're celebrating our anniversary, and you get the gifts!"}
                        </p>
                        <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
                            <span className="text-xs text-gray-400">Code:</span>
                            <span className="px-2 py-0.5 rounded font-bold text-xs tracking-widest text-[#1a1a1a]" style={{ backgroundColor: GOLD }}>
                                {coupon.code}
                            </span>
                            <span className="text-xs font-semibold" style={{ color: GOLD }}>
                                • {coupon.discountLabel}
                            </span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="w-full sm:w-auto flex-shrink-0 relative z-10">
                        <button
                            onClick={() => !isApplied && onApplyCode(coupon.code)}
                            disabled={isApplied}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold tracking-wider transition-all flex items-center justify-center gap-2 overflow-hidden relative group"
                            style={{
                                backgroundColor: isApplied ? '#16a34a' : GOLD,
                                color: isApplied ? '#fff' : '#1A1A1A',
                            }}
                        >
                            {isApplied ? (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    APPLIED
                                </>
                            ) : (
                                <>
                                    <span className="relative z-10">APPLY NOW</span>
                                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
