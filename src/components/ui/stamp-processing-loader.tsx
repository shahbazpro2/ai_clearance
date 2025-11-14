import { cn } from "@/lib/utils";
import { Camera, Sparkles, Brain } from "lucide-react";

interface StampProcessingLoaderProps {
    isLoading: boolean;
    message?: string;
    className?: string;
    children?: React.ReactNode;
}

export function StampProcessingLoader({
    isLoading,
    message = "Analyzing your stamp...",
    className,
    children
}: StampProcessingLoaderProps) {
    if (!isLoading) return <>{children}</>;

    return (
        <div className={cn("relative overflow-hidden", className)}>
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/95 to-indigo-100/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                <div className="flex flex-col items-center space-y-3 sm:space-y-4 p-4 sm:p-6">
                    {/* Animated Icon */}
                    <div className="relative">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center animate-pulse">
                            <Camera className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                            <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-800" />
                        </div>
                        <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-400 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: "0.5s" }}>
                            <Brain className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-800" />
                        </div>
                    </div>

                    {/* Loading Text */}
                    <div className="text-center space-y-1">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-800">{message}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">This will take a few moments…</p>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex space-x-2">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce"
                                style={{
                                    animationDelay: `${i * 0.2}s`,
                                    animationDuration: "1s"
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className={cn("opacity-30 pointer-events-none", isLoading && "opacity-30")}>
                {children}
            </div>
        </div>
    );
}
