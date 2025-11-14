import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AuthFooterProps {
    primaryText: string;
    primaryActionText: string;
    onPrimaryAction: () => void;
    showTerms?: boolean;
}

export function AuthFooter({
    primaryText,
    primaryActionText,
    onPrimaryAction,
    showTerms = true
}: AuthFooterProps) {
    return (
        <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-gray-600">
                {primaryText}{" "}
                <Button
                    variant="link"
                    onClick={onPrimaryAction}
                    className="text-primary hover:text-primary/90 p-0 h-auto text-sm cursor-pointer"
                >
                    {primaryActionText}
                </Button>
            </p>

            {showTerms && (
                <p className="text-xs text-gray-500">
                    By continuing, you agree to our{" "}
                    <Link href="/terms-and-conditions">
                        <Button variant="link" className="text-xs p-0 h-auto text-primary hover:text-primary/90">
                            Terms of Service
                        </Button>
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy-policy">
                        <Button variant="link" className="text-xs p-0 h-auto text-primary hover:text-primary/90">
                            Privacy Policy
                        </Button>
                    </Link>
                </p>
            )}
        </div>
    );
}
