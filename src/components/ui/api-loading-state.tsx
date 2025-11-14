import { cn } from "@/lib/utils";
import { AnimatedLoader } from "./animated-loader";

interface ApiLoadingStateProps {
    isLoading: boolean;
    message?: string;
    variant?: "overlay" | "inline" | "button" | "skeleton";
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    children?: React.ReactNode;
}

export function ApiLoadingState({
    isLoading,
    message = "Loading...",
    variant = "overlay",
    size = "md",
    className,
    children
}: ApiLoadingStateProps) {
    if (!isLoading) return <>{children}</>;

    if (variant === "overlay") {
        return (
            <div className={cn("relative", className)}>
                {/* Overlay */}
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-3">
                        <AnimatedLoader variant="dots" size={size} color="primary" />
                        <p className="text-sm font-medium text-gray-700">{message}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="opacity-50 pointer-events-none">
                    {children}
                </div>
            </div>
        );
    }

    if (variant === "inline") {
        return (
            <div className={cn("flex items-center space-x-2", className)}>
                <AnimatedLoader variant="spinner" size={size} color="primary" />
                <span className="text-sm text-gray-600">{message}</span>
            </div>
        );
    }

    if (variant === "button") {
        return (
            <div className={cn("flex items-center space-x-2", className)}>
                <AnimatedLoader variant="spinner" size="sm" color="white" />
                <span>{message}</span>
            </div>
        );
    }

    if (variant === "skeleton") {
        return (
            <div className={cn("animate-pulse", className)}>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>
        );
    }

    return null;
}
