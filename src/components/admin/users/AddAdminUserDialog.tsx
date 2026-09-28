"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApi } from "use-hook-api";
import { createAdminUserApi } from "@/api/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, Eye, EyeOff, Sparkles, Copy, Check } from "lucide-react";

function generateRandomPassword(length = 14): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*()_+~|}{[]:;?";
  const all = upper + lower + numbers + special;

  const getRandomChar = (chars: string) => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return chars[array[0] % chars.length];
  };

  const passwordChars = [
    getRandomChar(upper),
    getRandomChar(lower),
    getRandomChar(numbers),
    getRandomChar(special),
  ];

  for (let i = passwordChars.length; i < length; i++) {
    passwordChars.push(getRandomChar(all));
  }

  // Shuffle using Fisher-Yates
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const jArray = new Uint32Array(1);
    crypto.getRandomValues(jArray);
    const j = jArray[0] % (i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join("");
}

const addAdminUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().optional(),
});

type AddAdminUserFormData = z.infer<typeof addAdminUserSchema>;

interface AddAdminUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </div>
  );
}

export function AddAdminUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddAdminUserDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [callCreateUser, { loading: creatingUser }] = useApi({
    both: true,
    resSuccessMsg: "Admin user created successfully.",
    refetchApis: ["admin-users"],
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddAdminUserFormData>({
    resolver: zodResolver(addAdminUserSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const currentPassword = watch("password");

  // Reset form each time the dialog opens
  useEffect(() => {
    if (open) {
      reset({ name: "", email: "", password: "" });
      setShowPassword(false);
      setCopied(false);
    }
  }, [open, reset]);

  const handleGeneratePassword = () => {
    const pwd = generateRandomPassword(14);
    setValue("password", pwd, { shouldValidate: true, shouldDirty: true });
    setShowPassword(true);
  };

  const handleCopyPassword = () => {
    if (!currentPassword) return;
    navigator.clipboard.writeText(currentPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit: SubmitHandler<AddAdminUserFormData> = (formData) => {
    const payload: { name: string; email: string; password?: string } = {
      name: formData.name.trim(),
      email: formData.email.trim(),
    };

    if (formData.password?.trim()) {
      payload.password = formData.password.trim();
    }

    callCreateUser(
      createAdminUserApi(payload),
      () => {
        onOpenChange(false);
        reset();
        onSuccess?.();
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add New Admin User</DialogTitle>
        </DialogHeader>

        <form
          id="add-admin-user-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 py-2"
        >
          {/* Name */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g. Test User"
              {...register("name")}
              aria-invalid={!!errors.name}
              disabled={creatingUser}
            />
            <FieldError message={errors.name?.message} />
          </div>

          {/* Email */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              placeholder="e.g. example@gmail.com"
              {...register("email")}
              aria-invalid={!!errors.email}
              disabled={creatingUser}
            />
            <FieldError message={errors.email?.message} />
          </div>

          {/* Password (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-sm font-medium block">
                Password <span className="text-gray-400 font-normal text-xs">(Optional)</span>
              </Label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                disabled={creatingUser}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate Password
              </button>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Leave blank to auto-generate"
                {...register("password")}
                disabled={creatingUser}
                className="pr-16"
              />
              <div className="absolute right-1 top-0 h-full flex items-center gap-0.5">
                {currentPassword && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                    onClick={handleCopyPassword}
                    title="Copy password"
                    tabIndex={-1}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              If left blank, a temporary password is generated automatically.
            </p>
          </div>
        </form>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={creatingUser}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="add-admin-user-form"
            disabled={creatingUser}
            className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
          >
            {creatingUser ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              "Add User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
