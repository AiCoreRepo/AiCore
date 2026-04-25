
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { creatorLogin } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/error-utils";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { cloudinaryImages } from "@/constants/cloudinaryImages";

const CreatorLogin = () => {
  const heroImage = cloudinaryImages.auth.login;
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await creatorLogin(email);
      if (result.access_token) {
        localStorage.setItem("access_token", result.access_token);
      }
      toast({
        title: "Logged in as Creator!",
        description: "Welcome back to your workspace.",
      });
      window.dispatchEvent(new Event("auth-refresh"));
      navigate("/creator-onboarding");
    } catch (error: unknown) {
      toast({
        title: "Login Failed",
        description: getErrorMessage(error, "Login failed."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      heroImage={heroImage}
      quote="Empowering creators to shape the future of digital fashion."
      quoteAuthor="AiVestire Creative"
    >
      <div className="space-y-6">
        <div className="space-y-2 text-center lg:text-left">
          <h1 className="text-3xl font-serif text-luxury-cream">Creator Access</h1>
          <p className="text-neutral-400">Enter your credentials to manage your store.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Enter your creator email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-luxury-cream border-neutral-200 text-luxury-black placeholder:text-neutral-500 h-12 rounded-xl shadow-sm focus:border-luxury-gold/50 focus:ring-4 focus:ring-luxury-gold/5 transition-all duration-300"
            />
          </div>
          <div className="flex justify-end mt-1">
            <Link
              to="/forgot-password"
              className="text-[13px] text-neutral-400 hover:text-luxury-gold transition-colors font-medium tracking-wide pr-1 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Button
            type="submit"
            disabled={isLoading || !email}
            className="w-full bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black font-semibold h-12 transition-all duration-300"
          >
            {isLoading ? "Authenticating..." : "Login as Creator"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default CreatorLogin;
