import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { OTPInput } from '@/components/auth/OTPInput';
import { Button } from '@/components/ui/button';
import { useOTP } from '@/hooks/useOTP';
import { useToast } from '@/hooks/use-toast';
import { signup as signupApi, userSignup as userSignupApi, login as loginApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-utils';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { cloudinaryImages } from "@/constants/cloudinaryImages";

export const OTPVerification = () => {
    const heroImage = cloudinaryImages.auth.signup;
    const [otp, setOtp] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { verifyOTP, resendOTP, isLoading, countdown, canResend } = useOTP();
    const { toast } = useToast();

    // Get phone number and signup type from navigation state
    const phoneNumber = location.state?.phoneNumber || '';
    const signupData = location.state?.signupData;
    const signupType = location.state?.signupType || 'creator'; // 'creator' or 'user'

    useEffect(() => {
        if (!phoneNumber) {
            // If no phone number in state, redirect back to signup
            navigate('/signup');
        }
    }, [phoneNumber, navigate]);

    const handleVerify = async () => {
        if (otp.length !== 4 || isVerifying || isVerified) return;

        setIsVerifying(true);
        const result = await verifyOTP(phoneNumber, otp);

        if (result.success && signupData) {
            // Complete the signup process
            try {
                // Use the correct signup API based on signup type
                if (signupType === 'user') {
                    await userSignupApi({
                        email: signupData.email,
                        password: signupData.password,
                        name: signupData.brandName,
                        phoneNumber: phoneNumber,
                    });
                } else {
                    await signupApi({
                        email: signupData.email,
                        password: signupData.password,
                        brandName: signupData.brandName,
                        phoneNumber: phoneNumber,
                    });
                }

                setIsVerified(true);

                // Auto-login after successful signup
                try {
                    const loginResponse = await loginApi({
                        email: signupData.email,
                        password: signupData.password,
                    });

                    // Store the access token
                    if (loginResponse.access_token) {
                        localStorage.setItem('access_token', loginResponse.access_token);
                    }

                    // Determine redirect based on user role
                    const userRole = loginResponse.user?.role || signupType.toUpperCase();

                    // Wait for animation then navigate based on role
                    setTimeout(() => {
                        if (userRole === 'CREATOR') {
                            // Redirect creators to the onboarding flow
                            navigate('/creator-onboarding');
                        } else {
                            // Redirect buyers to collection page with Aura modal
                            navigate('/collection', {
                                state: { fromSignup: true, showAuraModal: true }
                            });
                        }
                    }, 2000);
                } catch (loginError) {
                    console.error('Auto-login failed:', loginError);
                    // If auto-login fails, redirect based on signup type
                    setTimeout(() => {
                        if (signupType === 'creator') {
                            navigate('/creator-onboarding');
                        } else {
                            navigate('/collection', {
                                state: { fromSignup: true, showAuraModal: true }
                            });
                        }
                    }, 2000);
                }
            } catch (error: unknown) {
                const errorMessage = getErrorMessage(error, 'Failed to create account. Please try again.');
                toast({
                    title: 'Registration Failed',
                    description: errorMessage,
                    variant: 'destructive',
                });
                setIsVerifying(false);
            }
        } else {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        if (canResend) {
            await resendOTP(phoneNumber);
            setOtp(''); // Clear OTP input
        }
    };

    const handleBack = () => {
        // Navigate back to the correct signup page based on signup type
        if (signupType === 'user') {
            navigate('/user-signup');
        } else {
            navigate('/signup');
        }
    };

    // Auto-verify when OTP is complete
    const handleOTPComplete = async (value: string) => {
        if (isVerifying || isVerified) return;

        setOtp(value);
        // Auto-submit after a brief delay
        setTimeout(async () => {
            if (isVerifying || isVerified) return;

            setIsVerifying(true);
            const result = await verifyOTP(phoneNumber, value);

            if (result.success && signupData) {
                // Complete the signup process
                try {
                    // Use the correct signup API based on signup type
                    if (signupType === 'user') {
                        await userSignupApi({
                            email: signupData.email,
                            password: signupData.password,
                            name: signupData.brandName,
                            phoneNumber: phoneNumber,
                        });
                    } else {
                        await signupApi({
                            email: signupData.email,
                            password: signupData.password,
                            brandName: signupData.brandName,
                            phoneNumber: phoneNumber,
                        });
                    }

                    setIsVerified(true);

                    // Auto-login after successful signup
                    try {
                        const loginResponse = await loginApi({
                            email: signupData.email,
                            password: signupData.password,
                        });

                        // Store the access token
                        if (loginResponse.access_token) {
                            localStorage.setItem('access_token', loginResponse.access_token);
                        }

                        // Determine redirect based on user role
                        const userRole = loginResponse.user?.role || signupType.toUpperCase();

                        // Wait for animation then navigate based on role
                        setTimeout(() => {
                            if (userRole === 'CREATOR') {
                                // Redirect creators to the onboarding flow
                                navigate('/creator-onboarding');
                            } else {
                                // Redirect buyers to collection page with Aura modal
                                navigate('/collection', {
                                    state: { fromSignup: true, showAuraModal: true }
                                });
                            }
                        }, 2000);
                    } catch (loginError) {
                        console.error('Auto-login failed:', loginError);
                        // If auto-login fails, redirect based on signup type
                        setTimeout(() => {
                            if (signupType === 'creator') {
                                navigate('/creator-onboarding');
                            } else {
                                navigate('/collection', {
                                    state: { fromSignup: true, showAuraModal: true }
                                });
                            }
                        }, 2000);
                    }
                } catch (error: unknown) {
                    const errorMessage = getErrorMessage(error, 'Failed to create account. Please try again.');
                    toast({
                        title: 'Registration Failed',
                        description: errorMessage,
                        variant: 'destructive',
                    });
                    setIsVerifying(false);
                }
            } else {
                setIsVerifying(false);
            }
        }, 300);
    };

    if (isVerified) {
        return (
            <AuthLayout
                heroImage={heroImage}
                quote="Verified Successfully!"
                quoteAuthor="Welcome to AiVestire"
            >
                <div className="flex flex-col items-center justify-center space-y-6 py-12">
                    <div className="relative">
                        <div className="absolute inset-0 bg-luxury-gold/20 rounded-full blur-2xl animate-pulse" />
                        <CheckCircle2 className="relative w-24 h-24 text-luxury-gold animate-bounce" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-serif text-luxury-cream">
                            Phone Verified!
                        </h2>
                        <p className="text-muted-foreground">
                            Setting up your Aura profile...
                        </p>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            heroImage={heroImage}
            quote="Verify Your Identity"
            quoteAuthor="Secure Your Account"
        >
            <div className="space-y-8">
                {/* Header */}
                <div className="space-y-2 text-center">
                    <h2 className="text-3xl sm:text-4xl font-serif text-luxury-cream">
                        Enter Verification Code
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        We've sent a 4-digit code to
                    </p>
                    <p className="text-luxury-gold font-medium">{phoneNumber}</p>
                </div>

                {/* OTP Input */}
                <div className="space-y-6">
                    <OTPInput
                        length={4}
                        value={otp}
                        onChange={setOtp}
                        onComplete={handleOTPComplete}
                        error={false}
                    />

                    {/* Verify Button */}
                    <Button
                        onClick={handleVerify}
                        variant="luxury"
                        size="lg"
                        className="w-full"
                        disabled={otp.length !== 4 || isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Verifying...
                            </span>
                        ) : (
                            'Verify Code'
                        )}
                    </Button>

                    {/* Resend OTP */}
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Didn't receive the code?
                        </p>
                        <Button
                            onClick={handleResend}
                            variant="ghost"
                            size="sm"
                            disabled={!canResend || isLoading}
                            className="text-luxury-gold hover:text-luxury-gold/80 hover:bg-luxury-gold/10"
                        >
                            {countdown > 0 ? (
                                `Resend in ${countdown}s`
                            ) : (
                                'Resend Code'
                            )}
                        </Button>
                    </div>

                    {/* Back to Signup */}
                    <Button
                        onClick={handleBack}
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground hover:text-luxury-cream"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Signup
                    </Button>
                </div>

                {/* Info Box */}
                <div className="mt-8 p-4 rounded-xl bg-luxury-gold/5 border border-luxury-gold/20">
                    <p className="text-xs text-center text-muted-foreground">
                        The code will expire in 5 minutes. For security reasons, please don't share this code with anyone.
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default OTPVerification;
