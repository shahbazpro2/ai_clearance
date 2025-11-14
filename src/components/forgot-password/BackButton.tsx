"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
    onClick: () => void;
}

export function BackButton({ onClick }: BackButtonProps) {
    return (
        <Button
            variant="ghost"
            onClick={onClick}
            className="absolute top-4 left-4 text-gray-600 hover:text-gray-800"
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
        </Button>
    );
}
