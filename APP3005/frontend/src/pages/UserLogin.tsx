import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginFormData } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";
import { AuraPromptDialog } from "@/components/aura/AuraPromptDialog";
import { login, getAuraStatus, googleAuth } from "@/lib/api";
import { useGoogleLogin } from "@react-oauth/google";
import { getErrorMessage } from "@/lib/error-utils";
import { cloudinaryImages } from "@/constants/cloudinaryImages";
import { markWorkflowDiscoveryPending } from "@/constants/featureDiscovery";
import {
    clearGuestTryOnHandoff,
    readGuestTryOnHandoff,
    resumeGuestTryOnAfterAuth,
} from "@/lib/guest-tryon-handoff";
import { PULKIT_DEMO_EMAIL } from "@/constants/pulkitDemo";

const UserLogin = () => {
    const heroImage = cloudinaryImages.auth.userModel;
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showAuraPrompt, setShowAuraPrompt] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const { returnUrl, returnState } = location.state || {};
    const postLoginUrl = returnUrl || "/collection";
    const isPulkitAccount = (email?: string | null) =>
        email?.trim().toLowerCase() === PULKIT_DEMO_EMAIL;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const continueAfterLogin = async (email?: string | null) => {
        if (isPulkitAccount(email)) {
            clearGuestTryOnHandoff();
            navigate("/collection?section=mens", {
                replace: true,
                state: { scrollToProducts: true },
            });
            return;
        }

        const auraStatus = await getAuraStatus();
        markWorkflowDiscoveryPending();

        try {
            const resume = await resumeGuestTryOnAfterAuth(auraStatus.hasAura);
            if (resume.kind === "navigate") {
                navigate(resume.to, { state: resume.state });
                return;
            }
            if (resume.kind === "requires-aura") {
                setShowAuraPrompt(true);
                return;
            }
        } catch (error) {
            toast({
                title: "Try-On Saved for Retry",
                description: getErrorMessage(
                    error,
                    "We could not attach your guest try-on yet. Your handoff is still saved in this tab.",
                ),
                variant: "destructive",
            });
        }

        if (auraStatus.hasAura || returnState?.openHomeVirtualTryOn) {
            navigate(postLoginUrl, { state: returnState });
        } else {
            setShowAuraPrompt(true);
        }
    };

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            // Call the actual login API
            const result = await login({ email: data.email, password: data.password });

            // Save the access token to localStorage
            if (result.access_token) {
                localStorage.setItem('access_token', result.access_token);
            }

            // Check if user has BUYER role
            const userRole = result.user?.role;

            if (userRole !== 'BUYER') {
                // Don't reveal role information - show generic error
                // Clear the token since they shouldn't be logging in here
                localStorage.removeItem("access_token");

                toast({
                    title: "Login Failed",
                    description: "Invalid credentials. Please try again.",
                    variant: "destructive",
                });

                setIsLoading(false);
                return;
            }

            // Success - user is a buyer
            if (!isPulkitAccount(result.user?.email || data.email)) {
                toast({
                    title: "Welcome back!",
                    description: "You've successfully signed in.",
                });
            }

            // Trigger AuthContext to refresh user data
            window.dispatchEvent(new Event('auth-refresh'));

            // Notify Navbar to refresh Aura status
            window.dispatchEvent(new Event('aura-updated'));

            await continueAfterLogin(result.user?.email || data.email);
        } catch (error: unknown) {
            toast({
                title: "Login Failed",
                description: getErrorMessage(error, "Invalid credentials. Please try again."),
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = useGoogleLogin({
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

                // Validate user is a buyer
                if (result.user?.role !== 'BUYER') {
                    localStorage.removeItem("access_token");
                    toast({
                        title: "Login Failed",
                        description: "Invalid credentials. Please try again.",
                        variant: "destructive",
                    });
                    return;
                }

                if (!isPulkitAccount(result.user?.email)) {
                    toast({
                        title: "Welcome back!",
                        description: "You've successfully signed in.",
                    });
                }

                // Trigger auth refresh
                window.dispatchEvent(new Event('auth-refresh'));
                window.dispatchEvent(new Event('aura-updated'));

                await continueAfterLogin(result.user?.email);
            } catch (error: unknown) {
                toast({
                    title: "Google Sign-In Failed",
                    description: getErrorMessage(error, "Invalid credentials. Please try again."),
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => {
            toast({
                title: "Google Sign-In Failed",
                description: "Could not connect to Google. Please try again.",
                variant: "destructive",
            });
        },
        flow: 'implicit',
    });

    const handleAuraAccept = () => {
        setShowAuraPrompt(false);
        navigate("/aura-dashboard", {
            state: {
                resumeGuestTryOn: Boolean(readGuestTryOnHandoff()),
            },
        });
    };

    const handleAuraDecline = () => {
        setShowAuraPrompt(false);
        const handoff = readGuestTryOnHandoff();
        clearGuestTryOnHandoff();
        navigate(
            handoff
                ? `/collection?section=${handoff.gender === "male" ? "mens" : "womens"}`
                : postLoginUrl,
            handoff ? undefined : { state: returnState },
        );
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
                quote="Your Aura defines your style."
            >
                <div className="space-y-6 sm:space-y-8">
                    <div className="space-y-2 text-center lg:text-left">
                        <h2 className="text-3xl sm:text-4xl font-serif text-luxury-cream tracking-tight">Welcome Back</h2>
                        <p className="text-neutral-400 text-base sm:text-lg">Continue your bespoke fashion journey.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs uppercase tracking-widest text-luxury-gold font-medium ml-1">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    {...register("email")}
                                    className="bg-luxury-cream border-neutral-200 text-luxury-black placeholder:text-neutral-500 h-11 rounded-xl shadow-sm focus:border-luxury-gold/50 focus:ring-4 focus:ring-luxury-gold/5 transition-all duration-300"
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <Label htmlFor="password" className="text-xs uppercase tracking-widest text-luxury-gold font-medium">
                                        Password
                                    </Label>
                                    <Link
                                        to="/user-forgot-password"
                                        className="text-[10px] uppercase tracking-widest text-neutral-400 hover:text-luxury-gold transition-colors"
                                    >
                                        Forgot?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        {...register("password")}
                                        className="bg-luxury-cream border-neutral-200 text-luxury-black placeholder:text-neutral-500 h-11 rounded-xl shadow-sm focus:border-luxury-gold/50 focus:ring-4 focus:ring-luxury-gold/5 transition-all duration-300 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-luxury-gold transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-red-500 mt-1 ml-1">{errors.password.message}</p>
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black font-bold h-11 rounded-full transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-luxury-black/30 border-t-luxury-black animate-spin rounded-full" />
                                    <span>Authenticating...</span>
                                </div>
                            ) : (
                                "Enter Boutique"
                            )}
                        </Button>

                        <div className="relative py-2">
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
                            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium h-11 rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
                            onClick={() => handleGoogleSignIn()}
                        >
                            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span className="text-sm font-medium">Sign in with Google</span>
                        </Button>
                    </form>

                    <div className="text-center">
                        <p className="text-neutral-500 text-sm">
                            New to AiVestire?{" "}
                            <Link to="/user-signup" className="text-luxury-gold hover:text-luxury-cream transition-colors font-semibold">
                                Create your account
                            </Link>
                        </p>
                    </div>
                </div>
            </AuthLayout>
        </>
    );
};

export default UserLogin;
