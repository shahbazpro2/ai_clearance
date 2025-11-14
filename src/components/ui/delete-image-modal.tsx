"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export function DeleteImageModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false
}: DeleteImageModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                    <h3 className="text-lg font-semibold">Delete Image</h3>
                </div>
                <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this image? This action cannot be undone and will permanently remove the image from your collection.
                </p>
                <div className="flex gap-3 justify-end">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? "Deleting..." : "Delete Image"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
