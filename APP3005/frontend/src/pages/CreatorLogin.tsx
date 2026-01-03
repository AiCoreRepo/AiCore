
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { creatorLogin } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const CreatorLogin = () => {
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
        description: "You are now logged in as a creator.",
      });
      navigate("/creator-dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Login failed.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Creator Login</h1>
      <form onSubmit={handleLogin} className="w-full max-w-xs flex flex-col gap-4">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Button type="submit" disabled={isLoading || !email}>
          {isLoading ? "Logging in..." : "Login as Creator"}
        </Button>
      </form>
    </div>
  );
};

export default CreatorLogin;
