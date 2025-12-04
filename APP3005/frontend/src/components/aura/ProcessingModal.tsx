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
}

export const ProcessingModal = ({ isOpen, progress, estimatedTime }: ProcessingModalProps) => {
    const [steps, setSteps] = useState<ProcessingStep[]>([
        { id: "upload", label: "Upload verified", status: "pending" },
        { id: "sending", label: "Sending to AI", status: "pending" },
        { id: "generating", label: "Generating your Aura", status: "pending" },
        { id: "finalizing", label: "Finalizing", status: "pending" },
    ]);

    useEffect(() => {
        // Update steps based on progress
        const newSteps = [...steps];

        if (progress >= 25) {
            newSteps[0].status = "completed";
        }
        if (progress >= 50) {
            newSteps[1].status = "completed";
        }
        if (progress >= 75) {
            newSteps[2].status = "completed";
            newSteps[3].status = "processing";
        } else if (progress >= 50) {
            newSteps[2].status = "processing";
        } else if (progress >= 25) {
            newSteps[1].status = "processing";
        } else {
            newSteps[0].status = "processing";
        }

        if (progress >= 100) {
            newSteps[3].status = "completed";
        }

        setSteps(newSteps);
    }, [progress]);

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
                            className="w-full max-w-md rounded-2xl shadow-2xl border-2 border-gold/40 p-8"
                            style={{
                                background: "linear-gradient(135deg, #FFFDF8 0%, #F5F1E8 50%, #FFFDF8 100%)",
                            }}
                        >
                            {/* Title */}
                            <h2 className="text-2xl font-serif text-charcoal text-center mb-6">
                                Creating Your Aura
                            </h2>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="h-2 bg-grey-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
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
                                <p className="text-center text-sm text-charcoal font-medium mt-2">
                                    {progress}% Complete
                                </p>
                            </div>

                            {/* Processing Steps */}
                            <div className="space-y-3 mb-6">
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
                                            className={`text-base ${step.status === "completed"
                                                ? "text-grey-soft line-through"
                                                : step.status === "processing"
                                                    ? "text-charcoal font-medium"
                                                    : "text-grey-soft"
                                                }`}
                                        >
                                            {step.label}
                                            {step.status === "processing" && "..."}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Estimated Time */}
                            <p className="text-center text-sm text-grey-soft">
                                Estimated time: <span className="font-medium text-charcoal">{estimatedTime} seconds</span>
                            </p>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
