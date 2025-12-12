import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LogoutConfirmDialogProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function LogoutConfirmDialog({ isOpen, onConfirm, onCancel }: LogoutConfirmDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onCancel}>
            <AlertDialogContent className="bg-stone-900 border-stone-800 text-stone-200 shadow-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-stone-100 font-serif text-xl">
                        Sign out of AiVestire?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-stone-400 text-base">
                        You will be returned to the login screen.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel className="bg-transparent border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white transition-colors">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-neutral-900 hover:from-[#F4D03F] hover:to-[#D4AF37] font-semibold transition-all shadow-lg"
                    >
                        Logout
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
