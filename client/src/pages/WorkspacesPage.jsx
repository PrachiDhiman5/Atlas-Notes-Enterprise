import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { api, getApiErrorMessage } from "../services/api.js";
import { Building2, Plus, UserPlus, X } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { useState } from "react";

export default function WorkspacesPage() {
  const user = useSelector((s) => s.auth.user);
  const accessToken = useSelector((s) => s.auth.accessToken);
  const sessionReady = Boolean(user && accessToken);
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => (await api.get("/workspaces")).data.data,
    enabled: sessionReady
  });

  const createWs = useMutation({
    mutationFn: () => api.post("/workspaces", { name: newName.trim(), description: newDesc.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
    }
  });

  const invite = useMutation({
    mutationFn: ({ id }) => api.post(`/workspaces/${id}/invite`, { email: inviteEmail.trim(), role: inviteRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setInviteOpen(null);
      setInviteEmail("");
      setInviteRole("member");
    }
  });

  if (!sessionReady) {
    return (
      <section>
        <PageHeader
          title="Workspaces"
          description="Create a space → you become owner → invite teammates → assign roles. Matches the workspace management flow in the platform diagram."
          actions={
            <button type="button" disabled className="btn-primary inline-flex items-center gap-2 opacity-50">
              <Plus className="h-4 w-4" />
              Create workspace
            </button>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <PageHeader
        title="Workspaces"
        description="Create a space → you become owner → invite teammates → assign roles. Matches the workspace management flow in the platform diagram."
        actions={
          <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create workspace
          </button>
        }
      />

      {createOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog">
          <div className="card-surface relative max-w-md flex-1 p-6 shadow-soft-lg">
            <button type="button" className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setCreateOpen(false)} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">New workspace</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Generates a workspace ID and sets your role to owner.</p>
            <div className="mt-4 space-y-3">
              <input className="input-field" placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <input className="input-field" placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>
            <button
              type="button"
              disabled={!newName.trim() || createWs.isPending}
              onClick={() => createWs.mutate()}
              className="btn-primary mt-4 w-full"
            >
              {createWs.isPending ? "Creating…" : "Create"}
            </button>
            {createWs.isError ? <p className="mt-2 text-sm text-rose-600">Could not create workspace.</p> : null}
          </div>
        </div>
      ) : null}

      {inviteOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog">
          <div className="card-surface relative max-w-md flex-1 p-6 shadow-soft-lg">
            <button type="button" className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setInviteOpen(null)} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Invite member</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              They must have an account. They’ll get an inbox invite and join only after they accept.
            </p>
            <div className="mt-4 space-y-3">
              <input className="input-field" type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              <select className="input-field" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="button"
              disabled={!inviteEmail.trim() || invite.isPending}
              onClick={() => invite.mutate({ id: inviteOpen })}
              className="btn-primary mt-4 w-full"
            >
              {invite.isPending ? "Sending…" : "Invite"}
            </button>
            {invite.isError ? (
              <p className="mt-2 text-sm text-rose-600">
                {invite.error?.response?.data?.message || invite.error?.message || "Invite failed."}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          <p className="font-medium">Unable to load workspaces.</p>
          <p className="mt-1 text-rose-700/90 dark:text-rose-200/80">{getApiErrorMessage(error, "Check the API URL (VITE_API_URL must end with /api/v1) and that you are signed in.")}</p>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.length ? (
            data.map((ws) => (
              <article key={ws._id} className="card-surface flex flex-col p-6 transition hover:border-indigo-200/80 dark:hover:border-indigo-500/30">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/15">
                    <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </span>
                  <button
                    type="button"
                    onClick={() => setInviteOpen(ws._id)}
                    className="btn-secondary inline-flex items-center gap-1.5 py-1.5 pl-2 pr-3 text-xs"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Invite
                  </button>
                </div>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{ws.name}</h3>
                {ws.description ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{ws.description}</p> : null}
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  {(ws.members?.length ?? 0) + " members"} · Owner role on create
                </p>
              </article>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-14 text-center dark:border-slate-700">
              <Building2 className="h-11 w-11 text-slate-300 dark:text-slate-600" strokeWidth={1} />
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">No workspaces yet</p>
              <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Create your first workspace to align with the journey: Dashboard → Workspaces → shared notes.
              </p>
              <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary mt-6">
                Create workspace
              </button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
