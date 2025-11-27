import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LuxeButtonProps extends ButtonProps {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "luxury" | "luxury-outline" | "luxury-ghost";
}

export const LuxeButton = React.forwardRef<HTMLButtonElement, LuxeButtonProps>(
    ({ className, variant = "luxury", ...props }, ref) => {
        return (
            <Button
                ref={ref}
                variant={variant}
                className={cn("font-serif tracking-wide", className)}
                {...props}
            />
        );
    }
);

LuxeButton.displayName = "LuxeButton";
