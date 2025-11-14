import { Facebook, Instagram, Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VERSION } from "@/constant";

interface DashboardFooterProps {
    className?: string;
}

export function DashboardFooter({ className = "" }: DashboardFooterProps) {
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        {
            name: "Facebook",
            icon: Facebook,
            href: "https://facebook.com/AIStampID",
            color: "hover:text-blue-600"
        },
        {
            name: "Instagram",
            icon: Instagram,
            href: "https://instagram.com/ai_stamp_id",
            color: "hover:text-pink-600"
        },
        {
            name: "LinkedIn",
            icon: Linkedin,
            href: "https://linkedin.com/company/ai-stamp-id",
            color: "hover:text-blue-700"
        }
    ];

    return (
        <footer className={`bg-gray-50 border-t border-gray-200 py-6 mb-20 md:mb-0   ${className}`}>
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center space-y-4">
                    {/* Social Media Links */}
                    <div className="flex space-x-4">
                        {socialLinks.map(({ name, icon: Icon, href, color }) => (
                            <Button
                                key={name}
                                variant="ghost"
                                size="sm"
                                asChild
                                className={`p-2 text-gray-500 ${color} transition-colors`}
                            >
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Follow us on ${name}`}
                                >
                                    <Icon className="h-5 w-5" />
                                </a>
                            </Button>
                        ))}
                    </div>

                    {/* Email Link */}
                    <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <a
                            href="mailto:info@aistampid.com"
                            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            info@aistampid.com
                        </a>
                    </div>

                    {/* Version */}
                    <div className="text-center">
                        <p className="text-sm text-gray-500">
                            Version {VERSION}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
