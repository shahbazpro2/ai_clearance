import { Button } from "./button";
import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    loadingText?: string;
    children: React.ReactNode;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
}

export function LoadingButton({
    isLoading = false,
    loadingText,
    children,
    className,
    disabled,
    ...props
}: LoadingButtonProps) {
    return (
        <Button
            className={cn(className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <LoadingSpinner size="sm" color="white" className="mr-2" />
            )}
            {isLoading ? (loadingText || children) : children}
        </Button>
    );
}
