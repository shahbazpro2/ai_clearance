import { cn } from "@/lib/utils";

interface AnimatedLoaderProps {
    variant?: "pulse" | "wave" | "dots" | "spinner" | "stamp";
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
    primary: "bg-primary",
    secondary: "bg-gray-600",
    white: "bg-white"
};

export function AnimatedLoader({
    variant = "spinner",
    size = "md",
    className,
    color = "primary"
}: AnimatedLoaderProps) {
    if (variant === "pulse") {
        return (
            <div
                className={cn(
                    "animate-pulse rounded-full",
                    sizeClasses[size],
                    colorClasses[color],
                    className
                )}
            />
        );
    }

    if (variant === "wave") {
        return (
            <div className={cn("flex space-x-1", className)}>
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            "rounded-full animate-pulse",
                            sizeClasses[size],
                            colorClasses[color]
                        )}
                        style={{
                            animationDelay: `${i * 150}ms`,
                            animationDuration: "1s"
                        }}
                    />
                ))}
            </div>
        );
    }

    if (variant === "dots") {
        return (
            <div className={cn("flex space-x-1", className)}>
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            "rounded-full animate-bounce",
                            sizeClasses[size],
                            colorClasses[color]
                        )}
                        style={{
                            animationDelay: `${i * 150}ms`,
                            animationDuration: "0.6s"
                        }}
                    />
                ))}
            </div>
        );
    }

    if (variant === "stamp") {
        return (
            <div className={cn("relative", className)}>
                <div className={cn(
                    "animate-pulse rounded-lg border-2 border-dashed",
                    sizeClasses[size],
                    "bg-gradient-to-br from-blue-50 to-indigo-100"
                )}>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className={cn(
                            "rounded-full animate-pulse",
                            "h-6 w-6",
                            colorClasses[color]
                        )} />
                    </div>
                </div>
            </div>
        );
    }

    // Default spinner
    return (
        <div
            className={cn(
                "animate-spin rounded-full border-2 border-solid border-t-transparent",
                sizeClasses[size],
                colorClasses[color],
                className
            )}
        />
    );
}
