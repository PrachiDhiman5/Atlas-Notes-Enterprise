import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api.js";
import { Activity, BarChart3, Bell, FileText, FolderKanban, HardDrive } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: async () => (await api.get("/analytics/overview")).data.data
  });

  if (isLoading) {
    return (
      <section>
        <PageHeader title="Analytics" description="Organization-wide usage and storage at a glance." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </section>
    );
  }

  const statCards = [
    { label: "Notes", value: data.notesCount, icon: FileText, accent: "from-violet-500/20 to-indigo-500/10" },
    { label: "Workspaces", value: data.workspaceCount, icon: FolderKanban, accent: "from-indigo-500/20 to-blue-500/10" },
    { label: "Uploads", value: data.uploadsCount, icon: BarChart3, accent: "from-blue-500/20 to-cyan-500/10" },
    { label: "Alerts (7d)", value: data.alertsWeekCount ?? 0, icon: Bell, accent: "from-amber-500/20 to-orange-500/10" },
    { label: "All activity", value: data.activityCount, icon: Activity, accent: "from-cyan-500/20 to-emerald-500/10" },
    {
      label: "Storage",
      value: `${(data.totalStorageBytes / (1024 * 1024)).toFixed(2)} MB`,
      icon: HardDrive,
      accent: "from-emerald-500/20 to-slate-500/10"
    }
  ];

  const series = [
    { label: "Notes", value: data.notesCount, icon: FileText },
    { label: "Workspaces", value: data.workspaceCount, icon: FolderKanban },
    { label: "Uploads", value: data.uploadsCount, icon: BarChart3 },
    { label: "Alerts (7d)", value: data.alertsWeekCount ?? 0, icon: Bell },
    { label: "Activity (all time)", value: data.activityCount, icon: Activity }
  ];
  const max = Math.max(...series.map((x) => x.value), 1);

  return (
    <section>
      <PageHeader
        title="Analytics"
        description="Counts are scoped to workspaces you belong to. Open Alerts for a timeline of note edits and comments."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className={`card-surface overflow-hidden bg-gradient-to-br p-5 ${accent} dark:from-slate-900 dark:to-slate-900`}
          >
            <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Relative distribution</h3>
        <div className="space-y-4">
          {series.map((item) => {
            const ItemIcon = item.icon;
            return (
            <div key={item.label}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <ItemIcon className="h-4 w-4 text-indigo-500" />
                  {item.label}
                </span>
                <span className="font-medium tabular-nums text-slate-900 dark:text-white">{item.value}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
            </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <Link to="/alerts" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          View full alerts timeline →
        </Link>
      </div>
    </section>
  );
}
