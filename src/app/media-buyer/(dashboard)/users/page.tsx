"use client";

import { fetchMediaBuyerUsersApi, type MediaBuyerUser, type MediaBuyerUserStatus } from "@/api/mediaBuyer";
import { MediaBuyerUserRow } from "@/components/media-buyer/users/MediaBuyerUserRow";
import { AddMediaBuyerUserDialog } from "@/components/media-buyer/users/AddMediaBuyerUserDialog";
import { ManageMediaBuyerUserDrawer } from "@/components/media-buyer/users/ManageMediaBuyerUserDrawer";
import { DeleteMediaBuyerUserDialog } from "@/components/media-buyer/users/DeleteMediaBuyerUserDialog";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMe } from "@/hooks/useMe";
import { usePagination } from "@/hooks/usePagination";
import { DEFAULT_PER_PAGE } from "@/lib/pagination";
import { UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApi } from "use-hook-api";

const STATUS_OPTIONS: MediaBuyerUserStatus[] = ["active", "pending", "inactive"];

export default function MediaBuyerUsersPage() {
  const userData = useMe();
  const [statusFilter, setStatusFilter] = useState<MediaBuyerUserStatus | "all">("all");
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [managingUser, setManagingUser] = useState<MediaBuyerUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<MediaBuyerUser | null>(null);
  const [getUsers, { data, fullRes, loading, error }] = useApi({ fullRes: true });

  const { page, paginationBarProps } = usePagination({
    pagination: fullRes?.pagination ?? null,
    loading,
    resetPageWhen: statusFilter,
  });

  const [localUsers, setLocalUsers] = useState<MediaBuyerUser[]>([]);

  useEffect(() => {
    const raw =
      (data?.data as MediaBuyerUser[]) ??
      (fullRes?.data as MediaBuyerUser[]) ??
      (data as MediaBuyerUser[]) ??
      [];
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
    getUsersRef.current(fetchMediaBuyerUsersApi(params));
  };

  useEffect(() => {
    if (!userData || userData.role !== "media_buyer_admin") return;
    const params =
      statusFilter === "all"
        ? { page, per_page: DEFAULT_PER_PAGE }
        : { status: statusFilter, page, per_page: DEFAULT_PER_PAGE };
    getUsersRef.current(fetchMediaBuyerUsersApi(params));
  }, [statusFilter, page, userData]);

  const handleStatusUpdated = (userId: string, newStatus: MediaBuyerUserStatus) => {
    setLocalUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, user_status: newStatus, status: newStatus } : u
      )
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
    <ProtectedRoute requiredRole="media_buyer_admin">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-end mb-6 gap-3">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as MediaBuyerUserStatus | "all")}
          >
            <SelectTrigger className="w-48 bg-white">
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
            className="bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm"
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
                        Fetching media buyer users...
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-red-600">
                      Failed to load media buyer users.
                    </td>
                  </tr>
                )}

                {!loading && !error && localUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                      No media buyer users found.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  localUsers.map((user) => (
                    <MediaBuyerUserRow
                      key={user.id}
                      user={user}
                      onStatusUpdated={handleStatusUpdated}
                      onManage={(u) => setManagingUser(u)}
                      isCurrentUser={
                        userData?.id === user.id || userData?.email === user.email
                      }
                    />
                  ))}
              </tbody>
            </table>
          </div>
          <PaginationBar {...paginationBarProps} />
        </div>

        <AddMediaBuyerUserDialog
          open={addUserOpen}
          onOpenChange={setAddUserOpen}
          onSuccess={refetchUsers}
        />

        <ManageMediaBuyerUserDrawer
          user={managingUser}
          open={!!managingUser}
          onOpenChange={(open) => !open && setManagingUser(null)}
          onSuccess={handleUserUpdated}
          onUserRestored={refetchUsers}
          onDelete={(u) => {
            setManagingUser(null);
            setDeletingUser(u);
          }}
          isCurrentUser={
            userData?.id === managingUser?.id ||
            userData?.email === managingUser?.email
          }
        />

        <DeleteMediaBuyerUserDialog
          user={deletingUser}
          open={!!deletingUser}
          onOpenChange={(open) => !open && setDeletingUser(null)}
          onSuccess={handleUserDeleted}
        />
      </main>
    </ProtectedRoute>
  );
}
