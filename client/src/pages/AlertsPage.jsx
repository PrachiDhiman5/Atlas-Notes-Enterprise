import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { api, getApiErrorMessage } from "../services/api.js";
import PageHeader from "../components/PageHeader.jsx";
import { Activity, ChevronRight, FileText } from "lucide-react";

const fetchActivity = async () => {
  const res = await api.get("/analytics/activity", { params: { limit: 50 } });
  return res.data.data;
};

export default function AlertsPage() {
  const sessionReady = useSelector((s) => Boolean(s.auth.user && s.auth.accessToken));
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["analytics-activity"],
    queryFn: fetchActivity,
    enabled: sessionReady
  });

  if (!sessionReady || isLoading) {
    return (
      <section>
        <PageHeader title="Alerts" description="Updates in workspaces you belong to—who changed what and when." />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section>
        <PageHeader title="Alerts" description="Updates in workspaces you belong to—who changed what and when." />
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          <p className="font-medium">Could not load alerts.</p>
          <p className="mt-1 text-rose-700/90 dark:text-rose-200/80">{getApiErrorMessage(error, "Try again in a moment.")}</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <PageHeader
        title="Alerts"
        description="Note edits, comments, and restores across your workspaces and teams you participate in."
      />

      {data.length ? (
        <ul className="space-y-3">
          {data.map((row) => (
            <li key={row.id}>
              {row.targetType === "note" && row.targetId ? (
                <Link
                  to={`/notes/${row.targetId}`}
                  className="card-surface flex flex-col gap-2 p-4 transition hover:border-indigo-200/80 dark:hover:border-indigo-500/30 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{row.headline}</p>
                    {row.detail ? (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{row.detail}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{row.actorName}</span>
                      {" · "}
                      {row.workspaceName}
                      {" · "}
                      {new Date(row.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    Open note <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              ) : (
                <div className="card-surface flex flex-col gap-2 p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{row.headline}</p>
                  {row.detail ? <p className="text-sm text-slate-600 dark:text-slate-400">{row.detail}</p> : null}
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {row.actorName} · {row.workspaceName} · {new Date(row.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
          <Activity className="h-11 w-11 text-slate-300 dark:text-slate-600" strokeWidth={1} />
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">No alerts yet</p>
          <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
            When you or teammates edit notes or add comments in your workspaces, entries will appear here with who did it
            and when.
          </p>
          <Link to="/notes" className="btn-primary mt-6 inline-flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Go to notes
          </Link>
        </div>
      )}
    </section>
  );
}
