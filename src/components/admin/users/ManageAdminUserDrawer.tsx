"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApi } from "use-hook-api";
import { updateAdminUserApi } from "@/api/admin";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { RestoreAdminUserDialog } from "@/components/admin/users/RestoreAdminUserDialog";
import {
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  Lock,
  UserCog,
  CheckCircle2,
  BadgeCheck,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";

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

const manageAdminUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().optional(),
});

type ManageAdminUserFormData = z.infer<typeof manageAdminUserSchema>;

export interface ManageAdminUserDrawerProps {
  user: {
    id: string;
    name?: string;
    email: string;
    role?: string;
    is_verified?: boolean;
    admin_status?: string;
    status?: string;
    [key: string]: any;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (updatedUser: { id: string; name: string; email: string }) => void;
  onUserRestored?: () => void;
  onDelete?: (user: any) => void;
  isCurrentUser?: boolean;
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

export function ManageAdminUserDrawer({
  user,
  open,
  onOpenChange,
  onSuccess,
  onUserRestored,
  onDelete,
  isCurrentUser = false,
}: ManageAdminUserDrawerProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Deleted admin conflict state
  const [conflictPopupOpen, setConflictPopupOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deletedConflictData, setDeletedConflictData] = useState<{
    email: string;
    name?: string;
  } | null>(null);

  const isVerified = Boolean(user?.is_verified);

  const [callUpdateUser, { loading: updatingUser }] = useApi({
    successMsg: true,
    errMsg: false,
    resSuccessMsg: "Admin user updated successfully.",
    refetchApis: ["admin-users"],
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ManageAdminUserFormData>({
    resolver: zodResolver(manageAdminUserSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const watchName = watch("name");
  const watchEmail = watch("email");
  const currentPassword = watch("password");

  // Track if any change has been made to enable Save Changes button
  const hasChanges = useMemo(() => {
    if (!user) return false;
    const initialName = (user.name || "").trim();
    const initialEmail = (user.email || "").trim();

    const currentName = (watchName || "").trim();
    const currentEmail = (watchEmail || "").trim();
    const hasPassword = Boolean(currentPassword && currentPassword.trim().length > 0);

    const nameChanged = currentName !== initialName;
    const emailChanged = !isVerified && currentEmail !== initialEmail;

    return nameChanged || emailChanged || hasPassword;
  }, [user, watchName, watchEmail, currentPassword, isVerified]);

  // Pre-fill form when user or drawer changes
  useEffect(() => {
    if (user && open) {
      reset({
        name: user.name || "",
        email: user.email || "",
        password: "",
      });
      setShowPassword(false);
      setCopied(false);
      setConflictPopupOpen(false);
      setRestoreDialogOpen(false);
      setDeletedConflictData(null);
    }
  }, [user, open, reset]);

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

  const onSubmit: SubmitHandler<ManageAdminUserFormData> = (formData) => {
    if (!user) return;
    const trimmedName = formData.name.trim();
    const trimmedEmail = isVerified ? user.email : formData.email.trim();

    const payload: { name: string; email: string; password?: string } = {
      name: trimmedName,
      email: trimmedEmail,
    };

    if (formData.password?.trim()) {
      payload.password = formData.password.trim();
    }

    callUpdateUser(
      updateAdminUserApi(user.id, payload),
      () => {
        onOpenChange(false);
        onSuccess?.({
          id: user.id,
          name: trimmedName,
          email: trimmedEmail,
        });
      },
      (errorData: any) => {
        const status =
          errorData?.status ??
          errorData?.response?.status ??
          errorData?.fullRes?.status;

        const errorCode =
          errorData?.code ??
          errorData?.fullRes?.code ??
          errorData?.fullRes?.data?.code ??
          errorData?.data?.code ??
          errorData?.response?.data?.code ??
          errorData?.error?.code;

        const errorMsg =
          errorData?.message ??
          errorData?.fullRes?.message ??
          errorData?.data?.message ??
          errorData?.response?.data?.message ??
          errorData?.error;

        const isDeletedAdminEmail =
          errorCode === "DELETED_ADMIN_EMAIL" ||
          errorData?.fullRes?.code === "DELETED_ADMIN_EMAIL" ||
          ((status === 409 || Number(status) === 409) &&
            (String(errorCode).toLowerCase().includes("deleted_admin") ||
              String(errorMsg).toLowerCase().includes("deleted_admin")));

        if (isDeletedAdminEmail) {
          const conflictEmail =
            errorData?.fullRes?.data?.email ??
            errorData?.fullRes?.email ??
            errorData?.email ??
            errorData?.data?.email ??
            errorData?.data?.data?.email ??
            errorData?.response?.data?.data?.email ??
            errorData?.response?.data?.email ??
            trimmedEmail;

          const conflictName =
            errorData?.fullRes?.data?.name ??
            errorData?.fullRes?.name ??
            errorData?.name ??
            errorData?.data?.name ??
            errorData?.data?.data?.name ??
            errorData?.response?.data?.data?.name ??
            errorData?.response?.data?.name ??
            "";

          setDeletedConflictData({
            email: conflictEmail,
            name: conflictName,
          });
          setConflictPopupOpen(true);
        } else {
          const displayMsg =
            typeof errorMsg === "string"
              ? errorMsg
              : Array.isArray(errorMsg)
              ? errorMsg.join(", ")
              : "Failed to update admin user.";
          toast.error(displayMsg);
        }
      },
      { errMsg: false }
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md bg-white p-0 flex flex-col h-full shadow-2xl z-50 border-l border-gray-200"
        >
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/70">
            <SheetHeader className="p-0 text-left">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 shadow-2xs">
                  <UserCog className="h-5 w-5" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-bold text-gray-900 leading-tight">
                    Manage Admin User
                  </SheetTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Update profile details and account credentials
                  </p>
                </div>
              </div>
            </SheetHeader>
          </div>

          {/* Drawer Form Body */}
          <form
            id="manage-admin-user-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
          >
            {/* User Meta Card */}
            {user && (
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200/90 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Account Status
                    </span>
                    <div className="text-xs font-semibold text-slate-900 capitalize mt-0.5">
                      {user.admin_status || user.status || "Active"}
                    </div>
                  </div>
                  <div>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                        <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 fill-emerald-100" />
                        Verified Account
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-200 shadow-2xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
                        Pending Verification
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-1.5">
              <Label htmlFor="admin-name" className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                Full Name
              </Label>
              <Input
                id="admin-name"
                placeholder="e.g. Jane Doe"
                {...register("name")}
                className="border-gray-300 focus-visible:ring-primary focus-visible:border-primary"
              />
              <FieldError message={errors.name?.message} />
            </div>

            {/* Email Field with Verification Lock Logic */}
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                Email Address
              </Label>

              <div className="relative">
                <Input
                  id="admin-email"
                  type="email"
                  {...register("email")}
                  disabled={isVerified}
                  placeholder="admin@example.com"
                  className={
                    isVerified
                      ? "bg-slate-50 text-slate-700 cursor-not-allowed pr-9 border-slate-200 font-medium"
                      : "border-gray-300 focus-visible:ring-primary focus-visible:border-primary"
                  }
                />
                {isVerified && (
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                )}
              </div>

              {isVerified ? (
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-emerald-200/80 bg-emerald-50/60 text-xs text-emerald-950 mt-1">
                  <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-emerald-900 leading-tight">
                      Verified Account Email
                    </p>
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      This email address has been verified and is locked to protect account security. Full Name and Password can still be edited.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-gray-500">
                  This user is pending verification. You can update their email address before they verify.
                </p>
              )}
              <FieldError message={errors.email?.message} />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="admin-password" className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Password
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGeneratePassword}
                  className="h-7 px-2 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-violet-500" />
                  Generate
                </Button>
              </div>

              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Leave blank to keep current password"
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
              <p className="text-[11px] text-gray-400">
                Only fill this field if you want to update the user&apos;s password.
              </p>
              <FieldError message={errors.password?.message} />
            </div>
          </form>

          {/* Drawer Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/70 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (user && onDelete) {
                  onOpenChange(false);
                  onDelete(user);
                }
              }}
              disabled={isCurrentUser || updatingUser}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors h-9 px-3 text-xs font-semibold gap-1.5 disabled:opacity-40"
              title={isCurrentUser ? "You cannot delete your own account" : "Delete this admin user"}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500 shrink-0" />
              Delete User
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updatingUser}
                className="h-9 px-3 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="manage-admin-user-form"
                disabled={!hasChanges || updatingUser}
                className="bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm min-w-[110px] h-9 text-xs font-semibold disabled:opacity-50"
              >
                {updatingUser ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Deleted Admin Email Conflict Confirmation Popup */}
      <AlertDialog open={conflictPopupOpen} onOpenChange={setConflictPopupOpen}>
        <AlertDialogContent className="sm:max-w-md bg-white p-6 rounded-xl shadow-xl">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-base font-bold text-gray-900">
                Previously Deleted Admin Account
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-gray-600 mt-2 leading-relaxed">
                An Admin account with the email{" "}
                <span className="font-semibold text-gray-900">
                  {deletedConflictData?.email}
                </span>
                {deletedConflictData?.name && (
                  <> ({deletedConflictData.name})</>
                )}{" "}
                was previously deleted and can be restored.
                <br className="my-1" />
                Would you like to restore this account?
              </AlertDialogDescription>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <AlertDialogCancel
              onClick={() => {
                setConflictPopupOpen(false);
                // Keeps manage drawer open so Super Admin can enter a different email address
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConflictPopupOpen(false);
                setRestoreDialogOpen(true);
              }}
              className="bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm"
            >
              Restore Account
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Admin User Dialog */}
      <RestoreAdminUserDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        deletedUser={deletedConflictData}
        onCancel={() => {
          // If cancelled, return to Manage Drawer email editing
          setRestoreDialogOpen(false);
        }}
        onSuccess={() => {
          // Closes restore dialog & manage drawer, triggers parent refresh
          setRestoreDialogOpen(false);
          onOpenChange(false);
          onUserRestored?.();
        }}
      />
    </>
  );
}
