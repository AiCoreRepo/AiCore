import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff, Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validation";
import { toast } from "sonner";
import heroImage from "@/assets/auth-hero-forgot.jpg";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type PageState = "form" | "success" | "error";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [pageState, setPageState] = useState<PageState>(token ? "form" : "error");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittedRef = useRef(false); // hard guard against double-submit
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    !token ? "Invalid reset link. No token found in the URL." : ""
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const passwordValue = watch("password", "");

  // Password strength indicators
  const hasMinLength = passwordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasLowercase = /[a-z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const strengthMet = [hasMinLength, hasUppercase, hasLowercase, hasNumber].filter(Boolean).length;

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    // Hard guard: prevent double-submission even on rapid re-clicks
    if (submittedRef.current || isSubmitting) return;
    submittedRef.current = true;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to reset password");
      }

      setPageState("success");
      toast.success("Password updated successfully!");

      // Auto-redirect to login after 4 seconds
      setTimeout(() => {
        navigate("/user-login");
      }, 4000);
    } catch (error: any) {
      // Allow retry on error — reset the guard
      submittedRef.current = false;
      setErrorMessage(
        error.message || "Something went wrong. Please try again."
      );
      setPageState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Strength bar color
  const getStrengthColor = () => {
    if (strengthMet <= 1) return "bg-red-500";
    if (strengthMet <= 2) return "bg-orange-500";
    if (strengthMet <= 3) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  return (
    <AuthLayout
      heroImage={heroImage}
      quote="A fresh start is always within reach."
      quoteAuthor="Renaissance Philosophy"
    >
      <AnimatePresence mode="wait">
        {/* ══════════ PASSWORD FORM ══════════ */}
        {pageState === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-7"
          >
            {/* Header */}
            <div className="space-y-3 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="flex justify-center"
              >
                <div className="rounded-full bg-luxury-gold/10 p-4 ring-1 ring-luxury-gold/20">
                  <KeyRound className="h-8 w-8 text-luxury-gold" />
                </div>
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-serif text-luxury-cream">
                Set New Password
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Choose a strong password to protect your account.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* New Password */}
              <div className="space-y-2 px-1">
                <Label
                  htmlFor="password"
                  className="text-xs uppercase tracking-widest text-luxury-gold font-medium"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    {...register("password")}
                    className="bg-luxury-cream border-neutral-200 text-luxury-black placeholder:text-neutral-500 h-12 rounded-xl shadow-sm focus:border-luxury-gold/50 focus:ring-4 focus:ring-luxury-gold/5 transition-all duration-300 pr-12"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1 ml-1">
                    {errors.password.message}
                  </p>
                )}

                {/* Strength Bar */}
                {passwordValue.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2 pt-1"
                  >
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i <= strengthMet ? getStrengthColor() : "bg-neutral-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {[
                        { met: hasMinLength, label: "8+ characters" },
                        { met: hasUppercase, label: "Uppercase (A-Z)" },
                        { met: hasLowercase, label: "Lowercase (a-z)" },
                        { met: hasNumber, label: "Number (0-9)" },
                      ].map(({ met, label }) => (
                        <p
                          key={label}
                          className={`text-[11px] flex items-center gap-1 transition-colors ${
                            met ? "text-emerald-600" : "text-neutral-400"
                          }`}
                        >
                          <span>{met ? "✓" : "○"}</span> {label}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2 px-1">
                <Label
                  htmlFor="confirmPassword"
                  className="text-xs uppercase tracking-widest text-luxury-gold font-medium"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                    className="bg-luxury-cream border-neutral-200 text-luxury-black placeholder:text-neutral-500 h-12 rounded-xl shadow-sm focus:border-luxury-gold/50 focus:ring-4 focus:ring-luxury-gold/5 transition-all duration-300 pr-12"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 ml-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="luxury"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Reset Password
                  </>
                )}
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
        )}

        {/* ══════════ SUCCESS STATE ══════════ */}
        {pageState === "success" && (
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
              <div className="rounded-full bg-emerald-500/20 p-6 ring-1 ring-emerald-500/30">
                <CheckCircle className="h-16 w-16 text-emerald-400" />
              </div>
            </motion.div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-serif text-luxury-cream">
                Password Updated!
              </h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Your password has been successfully changed. You'll be redirected
                to login shortly.
              </p>
            </div>

            {/* Progress bar for auto-redirect */}
            <div className="max-w-xs mx-auto">
              <motion.div
                className="h-1 bg-luxury-gold/30 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-luxury-gold rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 4, ease: "linear" }}
                />
              </motion.div>
              <p className="text-xs text-muted-foreground mt-2">
                Redirecting to login...
              </p>
            </div>

            <div className="pt-2">
              <Link to="/user-login">
                <Button type="button" variant="luxury" size="lg" className="w-full">
                  Go to Login Now
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* ══════════ ERROR STATE ══════════ */}
        {pageState === "error" && (
          <motion.div
            key="error"
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
              <div className="rounded-full bg-red-500/15 p-6 ring-1 ring-red-500/25">
                <AlertCircle className="h-16 w-16 text-red-400" />
              </div>
            </motion.div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-serif text-luxury-cream">
                Link Expired
              </h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {errorMessage ||
                  "This reset link is invalid or has expired. Please request a new one."}
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <Link to="/user-forgot-password">
                <Button
                  type="button"
                  variant="luxury"
                  size="lg"
                  className="w-full"
                >
                  Request New Reset Link
                </Button>
              </Link>

              <Link to="/user-login">
                <Button
                  type="button"
                  variant="luxury-ghost"
                  size="lg"
                  className="w-full mt-2"
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

export default ResetPassword;
