import { ApiError } from "./api";

/**
 * Utility to provide user-friendly error messages based on API response status codes
 */
export const getErrorMessage = (error: ApiError | unknown, defaultMessage: string = "An unexpected error occurred.") => {
    if (!error) return defaultMessage;

    let status: number | undefined;
    let message: string | undefined;

    if (error instanceof Error) {
        message = error.message;
        status = (error as ApiError).status;
    }

    // If the message is already very specific (e.g., from backend validation), use it
    if (message && message !== "Error" && message !== "Login failed" && message !== "Signup failed") {
        // Check for specific backend messages we want to beautify
        if (message.includes("User already exists") || message.includes("Email already in use")) {
            return "An account with this email already exists.";
        }
        if (message.includes("Invalid credentials") || message.includes("wrong password")) {
            return "Invalid email or password. Please try again.";
        }
        return message;
    }

    // Fallback to status code based messages
    switch (status) {
        case 400:
            return "Invalid request. Please check your information and try again.";
        case 401:
            return "Unauthorized. Please check your credentials.";
        case 403:
            return "Access denied. You don't have permission to perform this action.";
        case 404:
            return "Resource not found. Please try again later.";
        case 409:
            return "Conflict detected. This account may already exist.";
        case 429:
            return "Too many requests. Please slow down and try again later.";
        case 500:
            return "Server error. Our team has been notified. Please try again later.";
        case 502:
        case 503:
        case 504:
            return "The service is temporarily unavailable. Please try again in a few moments.";
        default:
            return message || defaultMessage;
    }
};
