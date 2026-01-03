import React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LuxeAlertDialogProps {
    trigger: React.ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    cancelLabel?: string;
    onAction: () => void;
    variant?: "default" | "destructive";
}

export const LuxeAlertDialog: React.FC<LuxeAlertDialogProps> = ({
    trigger,
    title,
    description,
    actionLabel = "Continue",
    cancelLabel = "Cancel",
    onAction,
    variant = "default",
}) => {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent className="bg-stone-900 border-stone-800 text-stone-200 shadow-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-stone-100 font-serif text-xl">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-stone-400 text-base">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel className="bg-transparent border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white transition-colors">
                        {cancelLabel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onAction}
                        className={`font-medium transition-all ${variant === "destructive"
                                ? "bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50"
                                : "bg-luxury-gold text-luxury-black hover:bg-luxury-gold/90"
                            }`}
                    >
                        {actionLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
