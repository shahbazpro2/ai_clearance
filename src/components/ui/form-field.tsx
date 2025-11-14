import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { UseFormReturn, FieldError } from "react-hook-form";

interface FormFieldProps {
    name: string;
    label: string;
    placeholder: string;
    type?: string;
    form: UseFormReturn<any>;
    className?: string;
    required?: boolean;
    maxLength?: number;
    [key: string]: any; // Allow additional props to be passed through
}

export function FormField({
    name,
    label,
    placeholder,
    type = "text",
    form,
    className = "",
    required = false,
    maxLength,
    ...rest
}: FormFieldProps) {
    const { register, formState: { errors } } = form;
    const error = errors[name] as FieldError | undefined;

    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="text-sm font-medium">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
                id={name}
                type={type}
                placeholder={placeholder}
                maxLength={maxLength}
                {...register(name)}
                className={`${error ? 'border-red-500' : ''} ${className}`}
                {...rest}
            />
            {error && (
                <div className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {error.message}
                </div>
            )}
        </div>
    );
}
