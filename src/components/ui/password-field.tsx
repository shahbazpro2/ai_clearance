import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, Eye, EyeOff, Info } from "lucide-react";
import { UseFormReturn, FieldError } from "react-hook-form";
import { useState } from "react";

interface PasswordFieldProps {
    name: string;
    label: string;
    placeholder: string;
    form: UseFormReturn<any>;
    className?: string;
    required?: boolean;
    showInfo?: boolean;
}

export function PasswordField({
    name,
    label,
    placeholder,
    form,
    className = "",
    required = false,
    showInfo = false
}: PasswordFieldProps) {
    const [showPassword, setShowPassword] = useState(false);
    const { register, formState: { errors } } = form;
    const error = errors[name] as FieldError | undefined;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label htmlFor={name} className="text-sm font-medium">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {showInfo && <Info className="h-4 w-4 text-gray-400" />}
            </div>
            <div className="relative">
                <Input
                    id={name}
                    type={showPassword ? "text" : "password"}
                    placeholder={placeholder}
                    {...register(name)}
                    className={`pr-10 ${error ? 'border-red-500' : ''} ${className}`}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                    )}
                </Button>
            </div>
            {error && (
                <div className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {error.message}
                </div>
            )}
        </div>
    );
}
