import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./loading-spinner";
import { LoadingDots } from "./loading-dots";

interface LoadingOverlayProps {
    isLoading: boolean;
    message?: string;
    variant?: "spinner" | "dots";
    className?: string;
    children?: React.ReactNode;
}

export function LoadingOverlay({
    isLoading,
    message = "Loading...",
    variant = "spinner",
    className,
    children
}: LoadingOverlayProps) {
    if (!isLoading) return <>{children}</>;

    return (
        <div className={cn("relative", className)}>
            {/* Overlay */}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-3">
                    {variant === "spinner" ? (
                        <LoadingSpinner size="lg" color="primary" />
                    ) : (
                        <LoadingDots size="lg" color="primary" />
                    )}
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
