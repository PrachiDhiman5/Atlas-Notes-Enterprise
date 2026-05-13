import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { Bell, Check, X } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";

const fetchNotifications = async () => {
  const res = await api.get("/notifications");
  return res.data.data;
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });

  const dismiss = useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });

  const acceptInvite = useMutation({
    mutationFn: (inviteId) => api.post(`/workspaces/invites/${inviteId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    }
  });

  const declineInvite = useMutation({
    mutationFn: (inviteId) => api.post(`/workspaces/invites/${inviteId}/decline`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  if (isLoading) {
    return (
      <section>
        <PageHeader title="Inbox" description="Workspace invites, mentions, and updates." />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <PageHeader title="Inbox" description="Accept workspace invites with the checkmark, or decline with ✕. Other items can be dismissed." />

      <div className="space-y-3">
        {data.length ? (
          data.map((n) => {
            const isInvite = n.type === "workspace_invite";
            const inviteId = n.metadata?.inviteId;

            return (
              <div
                key={n._id}
                className={`card-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                  !n.isRead ? "border-indigo-200/80 bg-indigo-50/40 dark:border-indigo-500/30 dark:bg-indigo-500/5" : ""
                }`}
              >
                <div className="flex gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      n.isRead ? "bg-slate-100 dark:bg-slate-800" : "bg-indigo-100 dark:bg-indigo-500/20"
                    }`}
                  >
                    <Bell className={`h-5 w-5 ${n.isRead ? "text-slate-400" : "text-indigo-600 dark:text-indigo-400"}`} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{n.message}</p>
                    <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{n.type}</p>
                    {n.actor?.name ? (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">From {n.actor.name}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  {isInvite && inviteId ? (
                    <>
                      <button
                        type="button"
                        disabled={acceptInvite.isPending || declineInvite.isPending}
                        onClick={() => acceptInvite.mutate(inviteId)}
                        className="btn-primary inline-flex items-center gap-1.5 px-3 py-2 text-sm"
                        title="Join workspace"
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={acceptInvite.isPending || declineInvite.isPending}
                        onClick={() => declineInvite.mutate(inviteId)}
                        className="btn-secondary inline-flex items-center gap-1.5 border-rose-200 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                        title="Decline invitation"
                      >
                        <X className="h-4 w-4" />
                        Decline
                      </button>
                    </>
                  ) : (
                    <>
                      {!n.isRead ? (
                        <button
                          type="button"
                          onClick={() => markRead.mutate(n._id)}
                          className="btn-secondary inline-flex items-center gap-1.5"
                        >
                          <Check className="h-4 w-4" />
                          Mark read
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => dismiss.mutate(n._id)}
                        className="btn-secondary inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300"
                        title="Remove from inbox"
                      >
                        <X className="h-4 w-4" />
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-14 text-center dark:border-slate-700">
            <Bell className="h-11 w-11 text-slate-300 dark:text-slate-600" strokeWidth={1} />
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">You’re all caught up</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Invites and mentions will show up here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
