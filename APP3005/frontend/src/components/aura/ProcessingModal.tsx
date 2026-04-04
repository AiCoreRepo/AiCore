import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check } from "lucide-react";

interface ProcessingStep {
    id: string;
    label: string;
    status: "pending" | "processing" | "completed";
}

interface ProcessingModalProps {
    isOpen: boolean;
    progress: number;
    estimatedTime: number;
    statusMessage?: string | null;
}

const BASE_STEPS: ProcessingStep[] = [
    { id: "upload", label: "Upload verified", status: "pending" },
    { id: "sending", label: "Sending to AI", status: "pending" },
    { id: "generating", label: "Generating your Aura", status: "pending" },
    { id: "finalizing", label: "Finalizing", status: "pending" },
];

const getSoftProgressCap = (serverProgress: number): number => {
    if (serverProgress >= 100) return 100;
    if (serverProgress >= 90) return 97;
    if (serverProgress >= 70) return 94;
    if (serverProgress >= 50) return 88;
    if (serverProgress >= 20) return 82;
    if (serverProgress >= 10) return 30;
    if (serverProgress > 0) return 18;
    return 12;
};

export const ProcessingModal = ({ isOpen, progress, estimatedTime, statusMessage }: ProcessingModalProps) => {
    const [steps, setSteps] = useState<ProcessingStep[]>(BASE_STEPS);
    const [displayProgress, setDisplayProgress] = useState(0);

    useEffect(() => {
        if (!isOpen) {
            setDisplayProgress(0);
            return;
        }

        if (progress >= 100) {
            setDisplayProgress(100);
            return;
        }

        const minimumVisibleProgress = progress > 0 ? Math.max(progress, 8) : 8;
        setDisplayProgress((prev) => Math.max(prev, minimumVisibleProgress));
    }, [isOpen, progress]);

    useEffect(() => {
        if (!isOpen) return;

        const interval = window.setInterval(() => {
            setDisplayProgress((prev) => {
                if (progress >= 100) {
                    return 100;
                }

                const minimumVisibleProgress = progress > 0 ? Math.max(progress, 8) : 8;
                const current = Math.max(prev, minimumVisibleProgress);
                const softCap = getSoftProgressCap(progress);

                if (current >= softCap) {
                    return current;
                }

                const increment =
                    current < 20
                        ? 1.1
                        : current < 40
                            ? 0.8
                            : current < 60
                                ? 0.55
                                : current < 78
                                    ? 0.3
                                    : 0.15;

                return Math.min(softCap, Number((current + increment).toFixed(1)));
            });
        }, 350);

        return () => window.clearInterval(interval);
    }, [isOpen, progress]);

    const visibleProgress = Math.min(Math.round(displayProgress), 100);
    const visibleEstimatedTime =
        progress >= 100 ? 0 : Math.max(0, Math.ceil((100 - visibleProgress) / 4));

    useEffect(() => {
        // Update steps based on progress
        const newSteps = BASE_STEPS.map((step) => ({ ...step }));

        if (visibleProgress >= 15) {
            newSteps[0].status = "completed";
        }
        if (visibleProgress >= 35) {
            newSteps[1].status = "completed";
        }
        if (visibleProgress >= 85) {
            newSteps[2].status = "completed";
            newSteps[3].status = "processing";
        } else if (visibleProgress >= 35) {
            newSteps[2].status = "processing";
        } else if (visibleProgress >= 15) {
            newSteps[1].status = "processing";
        } else {
            newSteps[0].status = "processing";
        }

        if (visibleProgress >= 100) {
            newSteps[3].status = "completed";
        }

        setSteps(newSteps);
    }, [visibleProgress]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-charcoal/60 backdrop-blur-md z-50"
                    />

                    {/* Modal - Golden Theme */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-md rounded-[24px] border-2 border-gold/40 p-5 shadow-2xl sm:rounded-2xl sm:p-8"
                            style={{
                                background: "linear-gradient(135deg, #FFFDF8 0%, #F5F1E8 50%, #FFFDF8 100%)",
                            }}
                        >
                            {/* Title */}
                            <h2 className="mb-5 text-center text-xl font-serif text-charcoal sm:mb-6 sm:text-2xl">
                                Creating Your Aura
                            </h2>

                            {statusMessage && (
                                <p className="mb-4 -mt-2 text-center text-sm text-grey-soft sm:mb-5">
                                    {statusMessage}
                                </p>
                            )}

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="h-2 bg-grey-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${visibleProgress}%` }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        className="h-full rounded-full relative overflow-hidden"
                                        style={{
                                            background: "linear-gradient(135deg, #C9A75F 0%, #D4B76E 100%)",
                                        }}
                                    >
                                        {/* Shimmer effect */}
                                        <motion.div
                                            animate={{
                                                x: ["-100%", "100%"],
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: "linear",
                                            }}
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                        />
                                    </motion.div>
                                </div>
                                <p className="mt-2 text-center text-sm font-medium text-charcoal">
                                    {visibleProgress}% Complete
                                </p>
                            </div>

                            {/* Processing Steps */}
                            <div className="mb-6 space-y-3">
                                {steps.map((step) => (
                                    <div
                                        key={step.id}
                                        className="flex items-center gap-3"
                                    >
                                        {/* Icon */}
                                        <div className="flex-shrink-0">
                                            {step.status === "completed" ? (
                                                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            ) : step.status === "processing" ? (
                                                <Loader2 className="w-5 h-5 text-gold animate-spin" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-grey-muted" />
                                            )}
                                        </div>

                                        {/* Label */}
                                        <p
                                            className={`text-[15px] ${step.status === "completed"
                                                ? "text-grey-soft line-through"
                                                : step.status === "processing"
                                                    ? "text-charcoal font-medium"
                                                    : "text-grey-soft"
                                                } sm:text-base`}
                                        >
                                            {step.label}
                                            {step.status === "processing" && "..."}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Estimated Time */}
                            <p className="text-center text-sm text-grey-soft">
                                Estimated time: <span className="font-medium text-charcoal">{Math.min(estimatedTime, visibleEstimatedTime)} seconds</span>
                            </p>

                            <p className="mt-3 text-center text-xs text-grey-soft/80">
                                AI-generated output may occasionally make mistakes.
                            </p>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
