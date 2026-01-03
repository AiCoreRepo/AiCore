import { toast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, AlertCircle, Info, Clock } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info" | "approval";

interface ShowToastOptions {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

const getIcon = (type: ToastType) => {
  switch (type) {
    case "success":
      return <CheckCircle2 className="h-5 w-5 text-green-400" />;
    case "error":
      return <XCircle className="h-5 w-5 text-red-400" />;
    case "warning":
      return <AlertCircle className="h-5 w-5 text-yellow-400" />;
    case "info":
      return <Info className="h-5 w-5 text-blue-400" />;
    case "approval":
      return <Clock className="h-5 w-5" style={{ color: 'hsl(var(--luxury-gold))' }} />;
    default:
      return null;
  }
};

const getVariant = (type: ToastType) => {
  if (type === "error") return "destructive";
  return "default";
};

const getClassName = (type: ToastType) => {
  const baseClasses = "border-l-4";
  switch (type) {
    case "success":
      return `${baseClasses} border-green-500 bg-luxury-charcoal text-luxury-cream`;
    case "error":
      return `${baseClasses} border-red-500`;
    case "warning":
      return `${baseClasses} border-yellow-500 bg-luxury-charcoal text-luxury-cream`;
    case "info":
      return `${baseClasses} border-blue-500 bg-luxury-charcoal text-luxury-cream`;
    case "approval":
      return `${baseClasses} border-luxury-gold bg-luxury-charcoal text-luxury-cream`;
    default:
      return `${baseClasses} bg-luxury-charcoal text-luxury-cream`;
  }
};

export const showToast = ({ type, title, description, duration = 5000 }: ShowToastOptions) => {
  toast({
    title: (
      <div className="flex items-center gap-2">
        {getIcon(type)}
        <span className="font-semibold text-luxury-cream">{title}</span>
      </div>
    ),
    description: description ? (
      <p className="text-sm text-luxury-cream/80 mt-1">{description}</p>
    ) : undefined,
    variant: getVariant(type),
    className: getClassName(type),
    duration: duration,
  });
};

// Convenience functions for different toast types
export const showSuccessToast = (title: string, description?: string) => {
  showToast({ type: "success", title, description });
};

export const showErrorToast = (title: string, description?: string) => {
  showToast({ type: "error", title, description });
};

export const showWarningToast = (title: string, description?: string) => {
  showToast({ type: "warning", title, description });
};

export const showInfoToast = (title: string, description?: string) => {
  showToast({ type: "info", title, description });
};

export const showApprovalToast = (title: string, description?: string) => {
  showToast({ 
    type: "approval", 
    title, 
    description,
    duration: 6000 // Longer duration for approval messages
  });
};

