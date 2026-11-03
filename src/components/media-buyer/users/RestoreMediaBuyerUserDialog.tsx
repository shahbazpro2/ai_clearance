"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApi } from "use-hook-api";
import { createMediaBuyerUserApi } from "@/api/mediaBuyer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, Eye, EyeOff, KeyRound, Copy, Check, Lock } from "lucide-react";

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

  for (let i = passwordChars.length - 1; i > 0; i--) {
    const jArray = new Uint32Array(1);
    crypto.getRandomValues(jArray);
    const j = jArray[0] % (i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join("");
}

const restoreMediaBuyerUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Maximum 100 characters"),
  password: z.string().optional(),
});

type RestoreMediaBuyerUserFormData = z.infer<typeof restoreMediaBuyerUserSchema>;

interface RestoreMediaBuyerUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deletedUser: {
    email: string;
    name?: string;
  } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
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

export function RestoreMediaBuyerUserDialog({
  open,
  onOpenChange,
  deletedUser,
  onSuccess,
  onCancel,
}: RestoreMediaBuyerUserDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const [callCreateUser, { loading: creatingUser }] = useApi({
    both: true,
    resSuccessMsg: "Media Buyer user restored successfully.",
    errMsg: true,
    refetchApis: ["media-buyer-users"],
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RestoreMediaBuyerUserFormData>({
    resolver: zodResolver(restoreMediaBuyerUserSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      password: "",
    },
  });

  const currentPassword = watch("password");

  useEffect(() => {
    if (open && deletedUser) {
      reset({
        name: deletedUser.name || "",
        password: "",
      });
      setShowPassword(false);
      setCopied(false);
    }
  }, [open, deletedUser, reset]);

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

  const handleClose = () => {
    onOpenChange(false);
    onCancel?.();
  };

  const onSubmit: SubmitHandler<RestoreMediaBuyerUserFormData> = (formData) => {
    if (!deletedUser?.email) return;

    const payload: { name: string; email: string; password?: string } = {
      name: formData.name.trim(),
      email: deletedUser.email.trim(),
    };

    if (formData.password?.trim()) {
      payload.password = formData.password.trim();
    }

    callCreateUser(
      createMediaBuyerUserApi(payload),
      () => {
        onOpenChange(false);
        reset();
        onSuccess?.();
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent
        className="sm:max-w-md bg-white p-6 rounded-xl shadow-xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Restore Media Buyer User
          </DialogTitle>
          <p className="text-xs text-gray-500">
            Re-create this previously deleted account with updated name and password.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Email (locked/read-only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                Email Address
              </Label>
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border border-amber-200">
                <Lock className="h-3 w-3" />
                Locked
              </span>
            </div>
            <div className="relative">
              <Input
                type="email"
                value={deletedUser?.email || ""}
                disabled
                className="bg-gray-100 text-gray-600 cursor-not-allowed pr-9 border-gray-200 font-medium"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <p className="text-[11px] text-gray-500">
              The email address is pre-filled from the deleted account and cannot be modified.
            </p>
          </div>

          {/* Name (editable) */}
          <div className="space-y-1.5">
            <Label htmlFor="restore-mb-name" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              Full Name
            </Label>
            <Input
              id="restore-mb-name"
              placeholder="e.g. John Doe"
              {...register("name")}
              className="border-gray-300 focus-visible:ring-primary focus-visible:border-primary"
            />
            <FieldError message={errors.name?.message} />
          </div>

          {/* Password (empty & editable) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="restore-mb-password" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                New Password
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGeneratePassword}
                className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <KeyRound className="h-3.5 w-3.5 mr-1 text-blue-500" />
                Generate
              </Button>
            </div>
            <div className="relative">
              <Input
                id="restore-mb-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password (optional)"
                {...register("password")}
                className="pr-20 border-gray-300 focus-visible:ring-primary focus-visible:border-primary font-mono text-sm"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {currentPassword && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyPassword}
                    className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                    title={copied ? "Copied!" : "Copy password"}
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
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <FieldError message={errors.password?.message} />
          </div>

          <DialogFooter className="gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={creatingUser}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creatingUser}
              className="bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm min-w-[90px]"
            >
              {creatingUser ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
