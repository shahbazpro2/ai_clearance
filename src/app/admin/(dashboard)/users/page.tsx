"use client";

import { fetchAdminUsersApi } from "@/api/admin";
import { AdminUserRow, type AdminStatus } from "@/components/admin/users/AdminUserRow";
import { AddAdminUserDialog } from "@/components/admin/users/AddAdminUserDialog";
import { ManageAdminUserDrawer } from "@/components/admin/users/ManageAdminUserDrawer";
import { DeleteAdminUserDialog } from "@/components/admin/users/DeleteAdminUserDialog";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMe } from "@/hooks/useMe";
import { usePagination } from "@/hooks/usePagination";
import { DEFAULT_PER_PAGE } from "@/lib/pagination";
import { UserPlus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "use-hook-api";

interface AdminUser {
  id: string;
  name?: string;
  email: string;
  role: string;
  admin_status?: AdminStatus;
  status?: AdminStatus;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

const STATUS_OPTIONS: AdminStatus[] = ["active", "pending", "suspended", "rejected"];

export default function AdminUsersPage() {
  const userData = useMe();
  const [statusFilter, setStatusFilter] = useState<AdminStatus | "all">("all");
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [managingUser, setManagingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [getUsers, { data, fullRes, loading, error }] = useApi({ fullRes: true });

  const { page, currentPage, paginationBarProps } = usePagination({
    pagination: fullRes?.pagination ?? null,
    loading,
    resetPageWhen: statusFilter,
  });

  const [localUsers, setLocalUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    const raw = (data?.data as AdminUser[]) ?? (fullRes?.data as AdminUser[]) ?? (data as AdminUser[]) ?? [];
    if (Array.isArray(raw)) {
      setLocalUsers(raw);
    }
  }, [data, fullRes]);

  const getUsersRef = useRef(getUsers);
  getUsersRef.current = getUsers;

  const refetchUsers = () => {
    const params =
      statusFilter === "all"
        ? { page, per_page: DEFAULT_PER_PAGE }
        : { status: statusFilter, page, per_page: DEFAULT_PER_PAGE };
    getUsersRef.current(fetchAdminUsersApi(params));
  };

  useEffect(() => {
    if (!userData || userData.role !== "super_admin") return;
    const params =
      statusFilter === "all"
        ? { page, per_page: DEFAULT_PER_PAGE }
        : { status: statusFilter, page, per_page: DEFAULT_PER_PAGE };
    getUsersRef.current(fetchAdminUsersApi(params));
  }, [statusFilter, page, userData]);

  const handleStatusUpdated = (userId: string, newStatus: AdminStatus) => {
    setLocalUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, admin_status: newStatus } : u))
    );
    refetchUsers();
  };

  const handleUserUpdated = (updatedUser: { id: string; name: string; email: string }) => {
    setLocalUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );
    refetchUsers();
  };

  const handleUserDeleted = (deletedUserId: string) => {
    setLocalUsers((prev) => prev.filter((u) => u.id !== deletedUserId));
    refetchUsers();
  };


  return (
    <ProtectedRoute requiredRole="super_admin">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-end mb-6 gap-3">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as AdminStatus | "all")}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => setAddUserOpen(true)}
            className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add New User
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
                        <LoadingSpinner size="lg" />
                        Fetching admin users...
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-red-600">
                      Failed to load admin users.
                    </td>
                  </tr>
                )}

                {!loading && !error && localUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                      No admin users found.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  localUsers.map((user) => (
                    <AdminUserRow
                      key={user.id}
                      user={user}
                      onStatusUpdated={handleStatusUpdated}
                      onManage={(u) => setManagingUser(u)}
                      isCurrentUser={userData?.id === user.id || userData?.email === user.email}
                    />
                  ))}
              </tbody>
            </table>
          </div>
          <PaginationBar {...paginationBarProps} />
        </div>

        <AddAdminUserDialog
          open={addUserOpen}
          onOpenChange={setAddUserOpen}
          onSuccess={refetchUsers}
        />

        <ManageAdminUserDrawer
          user={managingUser}
          open={!!managingUser}
          onOpenChange={(open) => !open && setManagingUser(null)}
          onSuccess={handleUserUpdated}
          onUserRestored={refetchUsers}
          onDelete={(u) => {
            setManagingUser(null);
            setDeletingUser(u);
          }}
          isCurrentUser={userData?.id === managingUser?.id || userData?.email === managingUser?.email}
        />

        <DeleteAdminUserDialog
          user={deletingUser}
          open={!!deletingUser}
          onOpenChange={(open) => !open && setDeletingUser(null)}
          onSuccess={handleUserDeleted}
        />
      </main>
    </ProtectedRoute>
  );
}
