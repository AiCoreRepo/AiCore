import { useState, type KeyboardEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuraPromptDialog } from "@/components/aura/AuraPromptDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupSchema, type SignupFormData } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";
// OTP BYPASSED: commented out - not needed currently
// import { useOTP } from "@/hooks/useOTP";
import { userSignup, googleAuth, getAuraStatus, login as loginApi } from "@/lib/api";
import { useGoogleLogin } from "@react-oauth/google";
import { getErrorMessage } from "@/lib/error-utils";
import { cloudinaryImages } from "@/constants/cloudinaryImages";

const UserSignup = () => {
    const heroImage = cloudinaryImages.auth.userModel;
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingAuraDob, setPendingAuraDob] = useState<string>("");
    const navigate = useNavigate();
    const { toast } = useToast();
    // OTP BYPASSED: commented out - not needed currently
    // const { sendOTP } = useOTP();

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            phoneNumber: "+91",
        },
    });

    const normalizePhoneNumber = (value: string) => {
        const cleaned = value.replace(/[^\d+]/g, "");
        if (!cleaned.startsWith("+91")) {
            const localNumber = cleaned.replace(/^\+?91/, "").replace(/\D/g, "");
            return `+91${localNumber}`.slice(0, 13);
        }
        return `+91${cleaned.slice(3).replace(/\D/g, "")}`.slice(0, 13);
    };

    const handlePhoneKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;
        const touchesPrefix = start < 3 || end < 3;
        const isDeleteKey = event.key === "Backspace" || event.key === "Delete";

        if (isDeleteKey && touchesPrefix) {
            event.preventDefault();
        }
    };

    const onSubmit = async (data: SignupFormData) => {
        setIsLoading(true);
        try {
            // First, check if email is already registered
            const emailCheckResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/check-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: data.email }),
            });

            if (emailCheckResponse.ok) {
                const { available } = await emailCheckResponse.json();
                if (!available) {
                    toast({
                        title: "Email Already Registered",
                        description: "Dear user, this email is already registered. Please try with another one or login to your existing account.",
                        variant: "destructive",
                    });
                    setIsLoading(false);
                    return;
                }
            }

            // OTP BYPASSED: Register directly without OTP verification
            // ---- OLD OTP FLOW (commented out) ----
            // const otpSent = await sendOTP(phoneNumber);
            // if (otpSent) {
            //     navigate('/verify-otp', {
            //         state: {
            //             phoneNumber: phoneNumber,
            //             signupType: 'user',
            //             signupData: {
            //                 email: data.email!,
            //                 password: data.password!,
            //                 brandName: data.brandName!,
            //                 phoneNumber: phoneNumber,
            //             },
            //         },
            //     });
            // }
            // ---- END OLD OTP FLOW ----

            // Directly register the user (phone number stored in DB, no OTP needed)
            await userSignup({
                email: data.email!,
                password: data.password!,
                name: data.brandName!,
                phoneNumber: data.phoneNumber,
                dateOfBirth: data.dateOfBirth,
            });

            // Auto-login after successful registration
            const loginResult = await loginApi({
                email: data.email!,
                password: data.password!,
            });

            if (loginResult.access_token) {
                localStorage.setItem("access_token", loginResult.access_token);
            }

            if (data.email && data.dateOfBirth) {
                localStorage.setItem(`aivestire:dob:${data.email.toLowerCase()}`, data.dateOfBirth);
            }
            setPendingAuraDob(data.dateOfBirth || "");

            toast({
                title: "Welcome to AiVestire! 🎉",
                description: "Your account has been created successfully.",
            });

            // Trigger auth refresh
            window.dispatchEvent(new Event('auth-refresh'));
            window.dispatchEvent(new Event('aura-updated'));

            // Check if user already has an Aura
            const auraStatus = await getAuraStatus();

            if (auraStatus.hasAura) {
                navigate('/collection');
            } else {
                // Show Aura prompt modal
                setShowAuraPrompt(true);
            }
        } catch (error: unknown) {
            let message = getErrorMessage(error, "Something went wrong. Please try again.");

            // Customize message for duplicate email
            if (message.toLowerCase().includes('email already registered') || message.toLowerCase().includes('already exists')) {
                message = "Dear user, this email is already registered. Please try with another one or login to your existing account.";
            }

            // Customize message for duplicate phone number
            if (message.toLowerCase().includes('phone number is already registered')) {
                message = "This phone number is already registered. Please try with another number or login to your existing account.";
            }

            toast({
                title: "Registration Error",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const [showAuraPrompt, setShowAuraPrompt] = useState(false);

    const handleGoogleSignUp = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            try {
                const result = await googleAuth({
                    token: tokenResponse.access_token,
                    role: 'BUYER',
                });

                if (result.access_token) {
                    localStorage.setItem("access_token", result.access_token);
                }

                setPendingAuraDob("");

                toast({
                    title: "Welcome to AiVestire!",
                    description: "Your account has been created successfully.",
                });

                // Trigger auth refresh
                window.dispatchEvent(new Event('auth-refresh'));
                window.dispatchEvent(new Event('aura-updated'));

                // Check if user already has an Aura
                const auraStatus = await getAuraStatus();

                if (auraStatus.hasAura) {
                    navigate('/collection');
                } else {
                    // Show Aura prompt modal instead of directly navigating
                    setShowAuraPrompt(true);
                }
            } catch (error: unknown) {
                toast({
                    title: "Google Sign-Up Failed",
                    description: getErrorMessage(error, "Something went wrong. Please try again."),
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => {
            toast({
                title: "Google Sign-Up Failed",
                description: "Could not connect to Google. Please try again.",
                variant: "destructive",
            });
        },
        flow: 'implicit',
    });

    const handleAuraAccept = () => {
        setShowAuraPrompt(false);
        navigate("/aura-dashboard", {
            state: pendingAuraDob ? { prefilledDob: pendingAuraDob } : undefined,
        });
    };

    const handleAuraDecline = () => {
        setShowAuraPrompt(false);
        navigate("/collection");
    };

    return (
        <>
            <AuraPromptDialog
                isOpen={showAuraPrompt}
                onAccept={handleAuraAccept}
                onDecline={handleAuraDecline}
            />
            <AuthLayout
                heroImage={heroImage}
                quote="Style is a way to say who you are without having to speak."
            >
                <div className="space-y-3 sm:space-y-4 w-full">
                    <div className="space-y-1 text-center lg:text-left">
                        <h2 className="text-2xl sm:text-3xl font-serif text-luxury-cream tracking-tight">Create Account</h2>
                        <p className="text-neutral-400 text-sm sm:text-base">Begin your personalized fashion experience.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5 w-full">
                        <div className="space-y-2.5">
                            <div className="space-y-1.5">
                                <Label htmlFor="brandName" className="text-xs uppercase tracking-widest text-luxury-gold font-medium ml-1">
                                    Full Name
                                </Label>
                                <Input
                                    id="brandName"
                                    type="text"
                                    placeholder="Your Name"
                                    {...register("brandName")}
                                    className="bg-luxury-cream border-neutral-200 text-luxury-black placeholder:text-neutral-500 h-9 text-sm rounded-xl shadow-sm focus:border-luxury-gold/50 focus:ring-2 focus:ring-luxury-gold/5 transition-all duration-300"
                                />
                                {errors.brandName && (
                                    <p className="text-xs text-red-500 mt-1 ml-1">{errors.brandName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth" className="text-xs uppercase tracking-widest text-luxury-gold font-medium ml-1">
                                    Date of Birth
                                </Label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    {...register("dateOfBirth")}
                                    className="bg-luxury-cream border-neutral-200 text-luxury-black h-9 text-sm rounded-xl shadow-sm focus:border-luxury-gold/50 focus:ring-2 focus:ring-luxury-gold/5 transition-all duration-300 [color-scheme:light]"
                                />
                                {errors.dateOfBirth && (
                                    <p className="text-xs text-red-500 mt-1 ml-1">{errors.dateOfBirth.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs uppercase tracking-widest text-luxury-gold font-medium ml-1">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    {...register("email")}
                                    className="bg-luxury-cream border-neutral-200 text-luxury-black placeholder:text-neutral-500 h-9 text-sm rounded-xl shadow-sm focus:border-luxury-gold/50 focus:ring-2 focus:ring-luxury-gold/5 transition-all duration-300"
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber" className="text-xs uppercase tracking-widest text-luxury-gold font-medium ml-1">
                                    Phone Number
                                </Label>
                                <Controller
                                    name="phoneNumber"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id="phoneNumber"
                                            type="tel"
                                            placeholder="+919876543210"
                                            value={field.value ?? "+91"}
                                            onChange={(event) => field.onChange(normalizePhoneNumber(event.target.value))}
                                            onKeyDown={handlePhoneKeyDown}
                                            className="bg-luxury-cream border-neutral-200 text-luxury-black placeholder:text-neutral-500 h-9 text-sm rounded-xl shadow-sm focus:border-luxury-gold/50 focus:ring-2 focus:ring-luxury-gold/5 transition-all duration-300"
                                        />
                                    )}
                                />
                                {errors.phoneNumber && (
                                    <p className="text-xs text-red-500 mt-1 ml-1">{errors.phoneNumber.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs uppercase tracking-widest text-luxury-gold font-medium ml-1">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 8 characters"
                                        {...register("password")}
                                        className="bg-luxury-cream border-neutral-200 text-luxury-black placeholder:text-neutral-500 h-9 text-sm rounded-xl shadow-sm focus:border-luxury-gold/50 focus:ring-2 focus:ring-luxury-gold/5 transition-all duration-300 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-luxury-gold transition-colors z-10 cursor-pointer p-2"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-red-500 mt-1 ml-1">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-widest text-luxury-gold font-medium ml-1">
                                    Confirm Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Repeat your password"
                                        {...register("confirmPassword")}
                                        className="bg-luxury-cream border-neutral-200 text-luxury-black placeholder:text-neutral-500 h-9 text-sm rounded-xl shadow-sm focus:border-luxury-gold/50 focus:ring-2 focus:ring-luxury-gold/5 transition-all duration-300 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-luxury-gold transition-colors z-10 cursor-pointer p-2"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-xs text-red-500 mt-1 ml-1">{errors.confirmPassword.message}</p>
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black font-bold h-10 text-sm rounded-full transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-luxury-black/30 border-t-luxury-black animate-spin rounded-full" />
                                    <span>Creating Account...</span>
                                </div>
                            ) : (
                                "Create Account"
                            )}
                        </Button>

                        <div className="relative py-3">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/5" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
                                <span className="bg-luxury-black lg:bg-transparent px-4 text-neutral-600">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium h-10 text-sm rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
                            onClick={() => handleGoogleSignUp()}
                        >
                            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span className="text-sm font-medium">Sign up with Google</span>
                        </Button>
                    </form>

                    <div className="text-center">
                        <p className="text-neutral-500 text-sm">
                            Already have an account?{" "}
                            <Link to="/user-login" className="text-luxury-gold hover:text-luxury-cream transition-colors font-semibold">
                                Sign in instead
                            </Link>
                        </p>
                    </div>
                </div>
            </AuthLayout>
        </>
    );
};

export default UserSignup;
