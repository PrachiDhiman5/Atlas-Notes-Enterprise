import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api.js";
import { useState } from "react";
import { Shield } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [roleEdits, setRoleEdits] = useState({});
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await api.get("/admin/users")).data.data
  });
  const updateRole = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] })
  });

  if (isLoading) {
    return (
      <section>
        <PageHeader title="Administration" description="Users and roles for your organization." />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <PageHeader
        title="Administration"
        description="Adjust user roles with care—admins can access organization-wide data."
        badge={
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200">
            <Shield className="h-3.5 w-3.5" />
            Admin
          </span>
        }
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-[1fr,auto,auto] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 sm:px-6">
          <span>User</span>
          <span className="hidden sm:block">Role</span>
          <span className="text-right">Actions</span>
        </div>
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {users.map((user) => (
            <li key={user._id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900 dark:text-white">{user.email}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user.name}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <select
                  className="input-field max-w-[10rem] py-2 text-sm"
                  value={roleEdits[user._id] || user.role}
                  onChange={(e) => setRoleEdits((prev) => ({ ...prev, [user._id]: e.target.value }))}
                  aria-label={`Role for ${user.email}`}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="button"
                  onClick={() => updateRole.mutate({ id: user._id, role: roleEdits[user._id] || user.role })}
                  className="btn-primary px-4 py-2 text-xs"
                >
                  Save
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
