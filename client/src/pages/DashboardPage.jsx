import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bell, Building2, Check, ChevronRight, FileText, Globe, HardDrive, LayoutGrid, Upload } from "lucide-react";
import { api } from "../services/api.js";
import PageHeader from "../components/PageHeader.jsx";

const journeySteps = [
  { label: "Landing", state: "done" },
  { label: "Authentication", state: "done" },
  { label: "Dashboard", state: "current" },
  { label: "Workspaces", state: "upcoming" },
  { label: "Notes", state: "upcoming" },
  { label: "Collaborate", state: "upcoming" }
];

function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export default function DashboardPage() {
  const user = useSelector((state) => state.auth.user);

  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => (await api.get("/workspaces")).data.data
  });

  const primaryWorkspaceId = workspaces[0]?._id;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: async () => (await api.get("/analytics/overview")).data.data
  });

  const { data: recentNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["notes", "recent", primaryWorkspaceId],
    queryFn: async () => {
      if (!primaryWorkspaceId) return [];
      return (await api.get("/notes", { params: { limit: 5, workspace: primaryWorkspaceId } })).data.data;
    },
    enabled: Boolean(primaryWorkspaceId)
  });

  const { data: publicNotes = [], isLoading: publicNotesLoading } = useQuery({
    queryKey: ["notes", "public-recent"],
    queryFn: async () => (await api.get("/notes", { params: { limit: 5 } })).data.data
  });

  return (
    <section>
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Your hub after authentication—open workspaces, recent notes, or inbox. This mirrors the platform journey: Dashboard → Workspaces → Notes → collaboration."
      />

      <div className="mb-8 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 to-indigo-50/30 p-4 dark:border-slate-700 dark:from-slate-900 dark:to-indigo-950/20 sm:p-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Journey position</p>
        <div className="flex flex-wrap items-center gap-y-2">
          {journeySteps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              {i > 0 ? <ChevronRight className="mx-1 h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden /> : null}
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ${
                  step.state === "current"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                    : step.state === "done"
                      ? "text-slate-700 dark:text-slate-300"
                      : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {step.state === "done" ? <Check className="h-3 w-3 text-emerald-500" /> : null}
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Where to next</h2>
      <div className="mb-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/workspaces"
          className="group card-surface flex flex-col p-6 transition hover:border-indigo-300/80 hover:shadow-soft dark:hover:border-indigo-500/40"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/15">
            <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="mt-4 font-semibold text-slate-900 dark:text-white">Workspaces</p>
          <p className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-400">Create a space, invite members, assign roles.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Manage workspaces <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
        <Link
          to="/notes"
          className="group card-surface flex flex-col p-6 transition hover:border-indigo-300/80 hover:shadow-soft dark:hover:border-indigo-500/40"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/15">
            <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="mt-4 font-semibold text-slate-900 dark:text-white">Recent notes</p>
          <p className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-400">Rich editor, autosave, search, and versions.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Open all notes <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
        <Link
          to="/alerts"
          className="group card-surface flex flex-col p-6 transition hover:border-indigo-300/80 hover:shadow-soft dark:hover:border-indigo-500/40"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-500/15">
            <Bell className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="mt-4 font-semibold text-slate-900 dark:text-white">Alerts</p>
          <p className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-400">
            See who updated notes and comments in your workspaces (last 7 days: {stats?.alertsWeekCount ?? 0}).
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Open alerts <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
        <Link
          to="/notifications"
          className="group card-surface flex flex-col p-6 transition hover:border-indigo-300/80 hover:shadow-soft dark:hover:border-indigo-500/40"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/15">
            <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-4 font-semibold text-slate-900 dark:text-white">Notifications</p>
          <p className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-400">Mentions, invites, and realtime alerts.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Open inbox <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>

      {statsLoading ? (
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : stats ? (
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[
            { label: "Notes", value: stats.notesCount, icon: FileText },
            { label: "Workspaces", value: stats.workspaceCount, icon: LayoutGrid },
            { label: "Uploads", value: stats.uploadsCount, icon: Upload },
            { label: "Alerts (7d)", value: stats.alertsWeekCount ?? 0, icon: Bell },
            { label: "Storage (MB)", value: (stats.totalStorageBytes / (1024 * 1024)).toFixed(1), icon: HardDrive }
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card-surface flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/15">
                <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-8 dark:border-slate-700">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recently opened</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">From your first workspace (includes private notes).</p>
        </div>
        <Link to="/notes" state={{ listScope: "workspace" }} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          View all
        </Link>
      </div>
      <div className="mt-4 space-y-2">
        {notesLoading ? (
          <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        ) : recentNotes.length ? (
          recentNotes.map((note) => (
            <Link
              key={note._id}
              to={`/notes/${note._id}`}
              className="card-surface flex items-center justify-between gap-4 p-4 transition hover:border-indigo-200/80 dark:hover:border-indigo-500/30"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-white">{note.title || "Untitled"}</p>
                <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{stripHtml(note.content) || "No preview"}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
            </Link>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No notes yet. Create one from{" "}
            <Link to="/notes" className="font-medium text-indigo-600 underline dark:text-indigo-400">
              Notes
            </Link>{" "}
            after selecting a workspace.
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-8 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Public notes</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Published by anyone, visible to all signed-in users.</p>
        </div>
        <Link
          to="/notes"
          state={{ listScope: "explore" }}
          className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Open public library
        </Link>
      </div>
      <div className="mt-4 space-y-2">
        {publicNotesLoading ? (
          <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        ) : publicNotes.length ? (
          publicNotes.map((note) => (
            <Link
              key={`pub-${note._id}`}
              to={`/notes/${note._id}`}
              className="card-surface flex items-center justify-between gap-4 border-sky-100/80 p-4 transition hover:border-sky-200/80 dark:border-sky-900/30 dark:hover:border-sky-800/50"
            >
              <div className="min-w-0 flex items-start gap-3">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white">{note.title || "Untitled"}</p>
                  <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{stripHtml(note.content) || "No preview"}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
            </Link>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No public notes yet. Publish one with the Public toggle in Notes, or ask a teammate to share.
          </div>
        )}
      </div>
    </section>
  );
}
