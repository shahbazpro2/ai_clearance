"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApi } from "use-hook-api";
import {
    fetchAccountUsersApi,
    createAccountUserApi,
    updateAccountUserStatusApi,
} from "@/api/retailer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AlertCircle, UserPlus } from "lucide-react";

// ─── Public types ─────────────────────────────────────────────────────────────

export type UserRole = "retailer" | "finance";
export type UserStatus = "active" | "inactive";

export interface AccountUser {
    contact_id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    role: UserRole;
    status: UserStatus;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const addUserSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    role: z.enum(["retailer", "finance"]).refine((v) => !!v, { message: "Role is required" }),
});

export type AddUserFormData = z.infer<typeof addUserSchema>;

// ─── Small helpers ────────────────────────────────────────────────────────────

export function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {message}
        </div>
    );
}

export function StatusBadge({ status }: { status: UserStatus }) {
    return (
        <Badge
            className={
                status === "active"
                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-100"
            }
        >
            {status === "active" ? "Active" : "Inactive"}
        </Badge>
    );
}

export function RoleBadge({ role }: { role: UserRole }) {
    return (
        <Badge variant="outline" className="capitalize text-xs">
            {role === "finance" ? "Finance" : "Stakeholder"}
        </Badge>
    );
}

// ─── Add User Dialog ──────────────────────────────────────────────────────────

interface AddUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
    const [callCreateUser, { loading: creatingUser }] = useApi({ errMsg: true });

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<AddUserFormData>({
        resolver: zodResolver(addUserSchema),
        mode: "onChange",
        defaultValues: { role: "retailer" },
    });

    const selectedRole = watch("role");

    // Reset form each time the dialog opens
    useEffect(() => {
        if (open) reset({ role: "retailer" });
    }, [open, reset]);

    const onSubmit: SubmitHandler<AddUserFormData> = (formData) => {
        callCreateUser(
            createAccountUserApi({
                current_step_name: "user_management",
                form_data: {
                    contact_id: "",
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone,
                    role: formData.role,
                    status: "",
                },
            }),
            () => {
                onOpenChange(false);
                reset();
                onSuccess();
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
                    <DialogTitle>Add User</DialogTitle>
                </DialogHeader>

                <form
                    id="add-user-dialog-form"
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4 py-2"
                >
                    {/* Role */}
                    <div>
                        <Label className="text-sm font-medium mb-1.5 block">
                            Role <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={selectedRole}
                            onValueChange={(val) => setValue("role", val as UserRole, { shouldValidate: true })}
                            disabled={creatingUser}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="retailer">Stakeholder User</SelectItem>
                                <SelectItem value="finance">Finance User</SelectItem>
                            </SelectContent>
                        </Select>
                        <FieldError message={errors.role?.message} />
                    </div>

                    {/* First / Last name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                First Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                placeholder="John"
                                {...register("first_name")}
                                aria-invalid={!!errors.first_name}
                                disabled={creatingUser}
                            />
                            <FieldError message={errors.first_name?.message} />
                        </div>
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                Last Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                placeholder="Doe"
                                {...register("last_name")}
                                aria-invalid={!!errors.last_name}
                                disabled={creatingUser}
                            />
                            <FieldError message={errors.last_name?.message} />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <Label className="text-sm font-medium mb-1.5 block">
                            Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="email"
                            placeholder="john.doe@example.com"
                            {...register("email")}
                            aria-invalid={!!errors.email}
                            disabled={creatingUser}
                        />
                        <FieldError message={errors.email?.message} />
                    </div>

                    {/* Phone */}
                    <div>
                        <Label className="text-sm font-medium mb-1.5 block">
                            Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            {...register("phone")}
                            aria-invalid={!!errors.phone}
                            disabled={creatingUser}
                        />
                        <FieldError message={errors.phone?.message} />
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
                        form="add-user-dialog-form"
                        disabled={creatingUser}
                        className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
                    >
                        {creatingUser ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Creating...
                            </>
                        ) : (
                            "Create User"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Status Confirm Dialog ────────────────────────────────────────────────────

interface StatusConfirmDialogProps {
    open: boolean;
    user: AccountUser | null;
    newStatus: UserStatus | null;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}

export function StatusConfirmDialog({
    open,
    user,
    newStatus,
    onConfirm,
    onCancel,
    loading,
}: StatusConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Confirm Status Change</DialogTitle>
                </DialogHeader>

                {user && newStatus && (
                    <p className="text-sm text-gray-600 py-2">
                        Are you sure you want to{" "}
                        <span className="font-semibold">
                            {newStatus === "active" ? "activate" : "deactivate"}
                        </span>{" "}
                        <span className="font-semibold">
                            {user.first_name} {user.last_name}
                        </span>
                        ?
                    </p>
                )}

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Users Table ──────────────────────────────────────────────────────────────

interface UsersTableProps {
    users: AccountUser[];
    onStatusToggle: (user: AccountUser) => void;
}

export function UsersTable({ users, onStatusToggle }: UsersTableProps) {
    return (
        <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Email</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Phone</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Role</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                        <tr key={user.contact_id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-800">
                                {user.first_name} {user.last_name}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{user.email}</td>
                            <td className="px-4 py-3 text-gray-600">{user.phone || "—"}</td>
                            <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                            <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                            <td className="px-4 py-3">
                                <Button
                                    size="sm"
                                    variant={user.status === "active" ? "destructive" : "outline"}
                                    onClick={() => onStatusToggle(user)}
                                    className={user.status !== "active" ? "border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800" : ""}
                                >
                                    {user.status === "active" ? "Deactivate" : "Activate"}
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── useUserManagement hook ───────────────────────────────────────────────────


export function useUserManagement() {
    const [users, setUsers] = useState<AccountUser[]>([]);
    const [addUserOpen, setAddUserOpen] = useState(false);
    const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
    const [pendingStatusChange, setPendingStatusChange] = useState<{
        user: AccountUser;
        newStatus: UserStatus;
    } | null>(null);

    const [callFetchUsers, { loading: loadingUsers, data }] = useApi({ errMsg: true });
    const [callUpdateStatus, { loading: updatingStatus }] = useApi({ errMsg: true });

    useEffect(() => {
        if (!data)
            loadUsers()
    }, [])

    const loadUsers = () => {
        callFetchUsers(
            fetchAccountUsersApi(),
            ({ data }: any) => setUsers(data?.users ?? [])
        );
    };


    const handleStatusToggleRequest = (user: AccountUser) => {
        setPendingStatusChange({
            user,
            newStatus: user.status === "active" ? "inactive" : "active",
        });
        setStatusConfirmOpen(true);
    };

    const handleStatusConfirm = () => {
        if (!pendingStatusChange) return;
        const { user, newStatus } = pendingStatusChange;
        callUpdateStatus(
            updateAccountUserStatusApi({
                current_step_name: "user_management",
                form_data: { contact_id: user.contact_id, role: user.role, status: newStatus },
            }),
            () => {
                setStatusConfirmOpen(false);
                setPendingStatusChange(null);
                loadUsers();
            }
        );
    };

    const handleStatusCancel = () => {
        setStatusConfirmOpen(false);
        setPendingStatusChange(null);
    };

    return {
        loadUsers,
        users,
        loadingUsers,
        addUserOpen,
        setAddUserOpen,
        statusConfirmOpen,
        pendingUser: pendingStatusChange?.user ?? null,
        pendingNewStatus: pendingStatusChange?.newStatus ?? null,
        updatingStatus,
        handleStatusToggleRequest,
        handleStatusConfirm,
        handleStatusCancel
    };
}

// ─── Shared content block (toolbar + table/empty states + dialogs) ────────────

interface UserManagementContentProps {
    /** Optional extra element rendered to the right of the Add User button (e.g. Next button in setup) */
    toolbar?: React.ReactNode;
}

export function UserManagementContent({ toolbar }: UserManagementContentProps) {
    const {
        users,
        loadingUsers,
        addUserOpen,
        setAddUserOpen,
        statusConfirmOpen,
        pendingUser,
        pendingNewStatus,
        updatingStatus,
        handleStatusToggleRequest,
        handleStatusConfirm,
        handleStatusCancel,
        loadUsers
    } = useUserManagement();

    return (
        <>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5">
                <Button
                    variant="outline"
                    onClick={() => setAddUserOpen(true)}
                    className="flex items-center gap-2"
                >
                    <UserPlus className="h-4 w-4" />
                    Add User
                </Button>
                {toolbar}
            </div>

            {/* Table / empty states */}
            {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="md" />
                </div>
            ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm font-medium text-gray-700">No users yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Click "Add User" to create Stakeholder or Finance users.
                    </p>
                </div>
            ) : (
                <UsersTable users={users} onStatusToggle={handleStatusToggleRequest} />
            )}

            {/* Dialogs */}
            <AddUserDialog
                open={addUserOpen}
                onOpenChange={setAddUserOpen}
                onSuccess={loadUsers}
            />
            <StatusConfirmDialog
                open={statusConfirmOpen}
                user={pendingUser}
                newStatus={pendingNewStatus}
                onConfirm={handleStatusConfirm}
                onCancel={handleStatusCancel}
                loading={updatingStatus}
            />
        </>
    );
}
