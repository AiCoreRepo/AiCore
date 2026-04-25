import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validation";
import { cloudinaryImages } from "@/constants/cloudinaryImages";

const UserForgotPassword = () => {
    const heroImage = cloudinaryImages.auth.forgot;
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setSubmittedEmail(data.email);
            setIsSuccess(true);
        } catch (error) {
            console.error("Error sending reset link:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            heroImage={heroImage}
            quote="Simplicity is the ultimate sophistication."
            quoteAuthor="Leonardo da Vinci"
        >
            <AnimatePresence mode="wait">
                {!isSuccess ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-8"
                    >
                        <div className="space-y-2 text-center">
                            <h2 className="text-4xl font-serif text-luxury-cream">Forgot Password?</h2>
                            <p className="text-muted-foreground">
                                No worries, we'll send you reset instructions.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2 px-1">
                                <Label htmlFor="email" className="text-xs uppercase tracking-widest text-luxury-gold font-medium">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    {...register("email")}
                                    className="bg-luxury-cream border-neutral-200 text-luxury-black placeholder:text-neutral-500 h-12 rounded-xl shadow-sm focus:border-luxury-gold/50 focus:ring-4 focus:ring-luxury-gold/5 transition-all duration-300"
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                variant="luxury"
                                size="lg"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? "Sending..." : "Send Reset Link"}
                            </Button>
                        </form>

                        <div className="text-center">
                            <Link
                                to="/user-login"
                                className="inline-flex items-center text-sm text-luxury-gold hover:underline font-medium"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Login
                            </Link>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-8 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="flex justify-center"
                        >
                            <div className="rounded-full bg-luxury-gold/20 p-6">
                                <CheckCircle className="h-16 w-16 text-luxury-gold" />
                            </div>
                        </motion.div>

                        <div className="space-y-3">
                            <h2 className="text-4xl font-serif text-luxury-cream">Check Your Inbox</h2>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                We've sent password reset instructions to{" "}
                                <span className="text-luxury-gold font-medium">{submittedEmail}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Didn't receive the email? Check your spam folder or try again.
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <Button
                                type="button"
                                variant="luxury"
                                size="lg"
                                className="w-full"
                                onClick={() => setIsSuccess(false)}
                            >
                                Try Another Email
                            </Button>

                            <Link to="/user-login">
                                <Button
                                    type="button"
                                    variant="luxury-ghost"
                                    size="lg"
                                    className="w-full"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Login
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthLayout>
    );
};

export default UserForgotPassword;
