import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Layers } from "lucide-react";

export default function AuthLayout({ title, subtitle, children }) {
  const location = useLocation();
  const showBackToMarketing = ["/login", "/signup"].includes(location.pathname);

  const [dark] = useState(() => {
    if (typeof window === "undefined") return true;
    const t = localStorage.getItem("theme");
    if (t === "light") return false;
    if (t === "dark") return true;
    return true;
  });

  return (
    <div className={dark ? "dark" : ""}>
      <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.25),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
        <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/10" />
        <div className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/10" />

        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8">
          <header className="mb-8 flex items-center justify-between sm:mb-10">
            <Link to="/" className="group flex items-center gap-2.5 text-slate-900 dark:text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
                <Layers className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="text-sm font-semibold tracking-tight">Atlas Notes</span>
            </Link>
            {showBackToMarketing ? (
              <Link
                to="/"
                className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Back to landing
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Sign in
              </Link>
            )}
          </header>

          <div className="flex flex-1 flex-col items-center justify-center pb-8">
            <div className="w-full max-w-md">
              <div className="mb-6 text-center sm:mb-8">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
                {subtitle ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p> : null}
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-black/20">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
