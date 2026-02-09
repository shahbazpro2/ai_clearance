"use client";

import { fetchAdminUsersApi } from "@/api/admin";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { useApi } from "use-hook-api";
import { AdminUserRow } from "@/components/admin/users/AdminUserRow";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

type AdminStatus = "active" | "pending" | "suspended" | "rejected";

interface AdminUser {
  id: string;
  name?: string;
  email: string;
  role: string;
  admin_status?: AdminStatus;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

const STATUS_OPTIONS: AdminStatus[] = ["active", "pending", "suspended", "rejected"];

export default function AdminUsersPage() {
  const [statusFilter, setStatusFilter] = useState<AdminStatus | "all">("all");
  const [getUsers, { data, loading, error }] = useApi({ cache: 'admin-users' });

  useEffect(() => {
    const params = statusFilter === "all" ? undefined : { status: statusFilter };
    getUsers(fetchAdminUsersApi(params));
  }, [statusFilter]);

  const users: AdminUser[] = useMemo(() => {
    const raw = (data?.data as AdminUser[]) ?? (data as AdminUser[]) ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);


  return (
    <ProtectedRoute requiredRole="super_admin">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold">Admin Users</h1>
          <div className="flex items-center gap-3">
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
          </div>
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

                {!loading && !error && users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                      No admin users found.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  users.map((user) => (
                    <AdminUserRow key={user.id} user={user} />
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
