import { Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  Cloud,
  GitBranch,
  Layers,
  Lock,
  MessageSquare,
  Moon,
  Rocket,
  Search,
  Server,
  Shield,
  Sun,
  Upload,
  Zap,
  Database
} from "lucide-react";

const flowMain = [
  { label: "Landing", desc: "Discover the platform" },
  { label: "Authentication", desc: "Signup · Login · JWT & refresh" },
  { label: "Dashboard", desc: "Your command center" },
  { label: "Workspaces", desc: "Create · Invite · Permissions" },
  { label: "Notes", desc: "Rich editor · Autosave · Search" },
  { label: "Collaborate", desc: "Sockets · Comments · Files" }
];

const systems = [
  { title: "Real-time collaboration", icon: Zap, text: "Socket.IO rooms, live note updates, presence." },
  { title: "Comment system", icon: MessageSquare, text: "Threaded discussion, mentions, notifications." },
  { title: "File uploads", icon: Upload, text: "Multer + Cloudinary, validated metadata in MongoDB." },
  { title: "Search", icon: Search, text: "Indexed text search, filters, sorting, pagination." },
  { title: "Version history", icon: GitBranch, text: "Snapshots on edit, restore previous versions." },
  { title: "Analytics", icon: BarChart3, text: "Aggregations for usage, storage, and activity." },
  { title: "Admin panel", icon: Shield, text: "Role-gated user and workspace oversight." },
  { title: "Security layer", icon: Lock, text: "JWT, validation, rate limits, Helmet headers." }
];

const journey = [
  "Signup",
  "Create workspace",
  "Invite team",
  "Create notes",
  "Upload files",
  "Collaborate in real time",
  "Notifications & analytics",
  "Manage at scale"
];

export default function LandingPage() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const t = localStorage.getItem("theme");
    if (t === "light") return false;
    return true;
  });

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(99,102,241,0.18),transparent)] dark:bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(99,102,241,0.12),transparent)]" />

        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
                <Layers className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-tight">Atlas Notes</p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Enterprise</p>
              </div>
            </Link>
            <nav className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Toggle theme"
              >
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <Link to="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 sm:inline-block">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm">
                Sign up
                <ArrowRight className="h-4 w-4" />
              </Link>
            </nav>
          </div>
        </header>

        <main>
          <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3 py-1 text-xs font-medium text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
                <Rocket className="h-3.5 w-3.5" />
                Notion · Slack · Confluence · Trello inspired
              </p>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                Enterprise collaboration platform
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                Landing → secure auth → dashboard → workspaces → notes → real-time collaboration. One aligned journey from first visit to team productivity.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link to="/signup" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base">
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/login" className="btn-secondary px-6 py-3 text-base">
                  Log in
                </Link>
              </div>
              <p className="mt-6 flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                <ChevronDown className="h-4 w-4 animate-bounce" />
                Follow the flow below
              </p>
            </div>

            <div className="mt-16">
              <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                Primary user flow
              </p>
              <div className="space-y-3 lg:hidden">
                {flowMain.map((step, i) => (
                  <div key={step.label}>
                    <div className="card-surface p-4 text-center">
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Step {i + 1}</p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">{step.label}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{step.desc}</p>
                    </div>
                    {i < flowMain.length - 1 ? (
                      <div className="flex justify-center py-2">
                        <ChevronDown className="h-5 w-5 text-indigo-400" aria-hidden />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="hidden gap-2 lg:grid lg:grid-cols-6">
                {flowMain.map((step, i) => (
                  <div key={step.label} className="flex items-center gap-1">
                    <div className="card-surface flex min-h-[120px] flex-1 flex-col justify-center p-3 text-center transition hover:border-indigo-300/60 dark:hover:border-indigo-500/40">
                      <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">Step {i + 1}</p>
                      <p className="mt-1 text-sm font-semibold leading-tight text-slate-900 dark:text-white">{step.label}</p>
                      <p className="mt-1 text-[10px] leading-snug text-slate-500 dark:text-slate-400">{step.desc}</p>
                    </div>
                    {i < flowMain.length - 1 ? <ArrowRight className="h-4 w-4 shrink-0 text-indigo-400" aria-hidden /> : null}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-y border-slate-200/80 bg-white/60 py-16 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Complete user journey</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">From signup to enterprise ecosystem—linear, traceable, and mirrored in the product UI.</p>
              </div>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {journey.map((step, i) => (
                  <div key={step} className="flex items-center gap-2 sm:gap-3">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                      {step}
                    </span>
                    {i < journey.length - 1 ? (
                      <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                        →
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Platform systems</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Each capability maps to REST, MongoDB, and realtime channels—production-shaped, not a prototype.</p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {systems.map(({ title, icon: Icon, text }) => (
                <div key={title} className="card-surface p-5 transition hover:border-indigo-200/80 dark:hover:border-indigo-500/30">
                  <Icon className="h-6 w-6 text-indigo-500 dark:text-indigo-400" strokeWidth={1.5} />
                  <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200/80 bg-gradient-to-b from-slate-100/80 to-transparent py-16 dark:border-slate-800 dark:from-slate-900/50">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
              <div className="card-surface p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                  <Database className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">Database architecture</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li>Users → workspaces, notes, comments</li>
                  <li>Workspaces → members, teams, activity</li>
                  <li>Notes → versions, uploads, tags</li>
                </ul>
              </div>
              <div className="card-surface p-6">
                <Server className="h-8 w-8 text-violet-500" strokeWidth={1.25} />
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">Deployment flow</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Git push → CI/CD → tests & build → Vercel (frontend), Render (API), Atlas + Cloudinary.
                </p>
              </div>
              <div className="card-surface p-6 sm:col-span-2 lg:col-span-1">
                <Cloud className="h-8 w-8 text-sky-500" strokeWidth={1.25} />
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">Security layer</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  JWT verification → role checks → Zod validation → rate limiting → Helmet → audited responses.
                </p>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-center text-white shadow-xl shadow-indigo-500/20 sm:p-12">
              <h2 className="text-2xl font-semibold sm:text-3xl">Ready to enter the app?</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-indigo-100">Authenticate, open your dashboard, then workspaces and notes—same order as this page.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/signup" className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-md transition hover:bg-indigo-50">
                  Create account
                </Link>
                <Link
                  to="/login"
                  className="rounded-lg border-2 border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Log in
                </Link>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-200/80 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
          Atlas Notes — enterprise collaboration · MERN · Socket.IO · MongoDB Atlas
        </footer>
      </div>
    </div>
  );
}
