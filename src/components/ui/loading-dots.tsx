import { cn } from "@/lib/utils";

interface LoadingDotsProps {
    size?: "sm" | "md" | "lg";
    className?: string;
    color?: "primary" | "secondary" | "white";
}

const sizeClasses = {
    sm: "h-1 w-1",
    md: "h-2 w-2",
    lg: "h-3 w-3"
};

const colorClasses = {
    primary: "bg-primary",
    secondary: "bg-gray-600",
    white: "bg-white"
};

export function LoadingDots({
    size = "md",
    className,
    color = "primary"
}: LoadingDotsProps) {
    return (
        <div className={cn("flex space-x-1", className)}>
            <div
                className={cn(
                    "rounded-full animate-pulse",
                    sizeClasses[size],
                    colorClasses[color],
                    "animate-bounce"
                )}
                style={{ animationDelay: "0ms" }}
            />
            <div
                className={cn(
                    "rounded-full animate-pulse",
                    sizeClasses[size],
                    colorClasses[color],
                    "animate-bounce"
                )}
                style={{ animationDelay: "150ms" }}
            />
            <div
                className={cn(
                    "rounded-full animate-pulse",
                    sizeClasses[size],
                    colorClasses[color],
                    "animate-bounce"
                )}
                style={{ animationDelay: "300ms" }}
            />
        </div>
    );
}
