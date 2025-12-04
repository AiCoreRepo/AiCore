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
            <AlertDialogContent className="bg-gradient-to-br from-ivory via-[#f2ead8] to-ivory border-2 border-gold/40 shadow-2xl shadow-gold/20 rounded-2xl max-w-sm p-6">
                <AlertDialogHeader className="space-y-3">
                    <AlertDialogTitle className="text-xl font-serif text-charcoal text-center bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 py-2 rounded-xl border border-gold/20">
                        Logout Confirmation
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-charcoal/80 text-sm leading-relaxed text-center">
                        Are you sure you want to logout? You'll need to sign in again to access your Aura and AI Try-On features.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row mt-4">
                    <AlertDialogCancel
                        onClick={onCancel}
                        className="w-full sm:w-auto bg-ivory border-2 border-gold/40 text-charcoal hover:bg-gold/10 hover:border-gold hover:scale-105 transition-all duration-300 px-6 py-2 rounded-full font-medium shadow-md hover:shadow-lg hover:shadow-gold/20 order-2 sm:order-1"
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="w-full sm:w-auto bg-gradient-to-r from-[#c9a55c] via-[#d4b068] to-[#c9a55c] text-white hover:from-[#b8944a] hover:via-[#c9a55c] hover:to-[#b8944a] hover:scale-105 border-2 border-gold/60 transition-all duration-300 px-6 py-2 rounded-full font-medium shadow-lg hover:shadow-xl hover:shadow-gold/40 order-1 sm:order-2"
                    >
                        Logout
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
