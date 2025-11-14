import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface AuthLayoutProps {
    children: ReactNode;
    maxWidth?: string;
}

export function AuthLayout({ children, maxWidth = "max-w-md" }: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className={`w-full ${maxWidth}`}>
                <Card className="shadow-lg border-0">
                    <CardContent className="p-6 space-y-4">
                        {children}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
