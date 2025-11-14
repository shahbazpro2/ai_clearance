import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    color?: "primary" | "secondary" | "white";
}

const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
};

const colorClasses = {
    primary: "text-primary",
    secondary: "text-gray-600",
    white: "text-white"
};

export function LoadingSpinner({
    size = "md",
    className,
    color = "primary"
}: LoadingSpinnerProps) {
    return (
        <Loader2
            className={cn(
                "animate-spin",
                sizeClasses[size],
                colorClasses[color],
                className
            )}
        />
    );
}
