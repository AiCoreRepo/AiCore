import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginFormData } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";
import { login as loginApi } from "@/lib/api";
import { usePopup } from "@/components/common/popups/PopupTime";
import heroImage from "@/assets/auth-hero-login.jpg";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { showPopup } = usePopup();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await loginApi({ email: data.email!, password: data.password! });
      // Store token if returned
      if (result.access_token) {
        localStorage.setItem("access_token", result.access_token);
      }
      // toast({
      //   title: "Welcome back!",
      //   description: "You've successfully signed in.",
      // });
      showPopup("Welcome back!", "You've successfully signed in.", "success");
      navigate("/creator-dashboard");
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: (error as Error).message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    toast({
      title: "Coming Soon",
      description: "Google Sign-In will be available shortly.",
    });
  };

  return (
    <AuthLayout
      heroImage={heroImage}
      quote="Luxury isn't worn. It's owned."
      quoteAuthor="AiVestire Philosophy"
    >

      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h2 className="text-4xl font-serif text-luxury-cream">Welcome Back</h2>
          <p className="text-muted-foreground">Sign in to your creator account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-luxury-cream">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="designer@aivestire.com"
              {...register("email")}
              className="bg-luxury-cream border-neutral-200 text-luxury-black placeholder:text-neutral-500 h-12 rounded-xl shadow-sm focus:border-luxury-gold/50 focus:ring-4 focus:ring-luxury-gold/5 transition-all duration-300"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <Label htmlFor="password" className="text-xs uppercase tracking-widest text-luxury-gold font-medium">
                Password
              </Label>
              <Link
                to="/forgot-password"
                className="text-[10px] uppercase tracking-widest text-neutral-400 hover:text-luxury-gold transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password")}
                className="bg-luxury-cream border-neutral-200 text-luxury-black placeholder:text-neutral-500 h-12 rounded-xl shadow-sm focus:border-luxury-gold/50 focus:ring-4 focus:ring-luxury-gold/5 transition-all duration-300 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-luxury-gold transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>


          <Button
            type="submit"
            variant="luxury"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-luxury-charcoal" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-luxury-black px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="luxury-outline"
            size="lg"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          New Creator?{" "}
          <Link to="/signup" className="text-luxury-gold hover:underline font-medium">
            Apply here
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
