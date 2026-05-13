import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api.js";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Shield,
  Sun,
  X
} from "lucide-react";
import { clearSession } from "../redux/store.js";
import { getSocket } from "../services/socket.js";

const navGroups = [
  {
    label: "Your flow",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/notes", label: "Notes", icon: FileText },
      { to: "/workspaces", label: "Workspaces", icon: Building2 }
    ]
  },
  {
    label: "Collaboration",
    items: [
      { to: "/notifications", label: "Inbox", icon: Bell },
      { to: "/alerts", label: "Alerts", icon: Activity }
    ]
  },
  {
    label: "Insights",
    items: [{ to: "/analytics", label: "Analytics", icon: BarChart3 }]
  }
];

function NavItem({ to, label, icon: Icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80"
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-indigo-600 dark:group-hover:text-indigo-400" strokeWidth={2} />
      {label}
    </NavLink>
  );
}

async function fetchWorkspaces() {
  return (await api.get("/workspaces")).data.data;
}

export default function Layout() {
  const queryClient = useQueryClient();
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const t = localStorage.getItem("theme");
    if (t === "light") return false;
    if (t === "dark") return true;
    return true;
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (!user) return;
    queryClient.prefetchQuery({
      queryKey: ["workspaces"],
      queryFn: fetchWorkspaces
    });
  }, [user, queryClient]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    socket.emit("presence:update", { userId: user.id, status: "online" });
    return () => {
      socket.emit("presence:update", { userId: user.id, status: "offline" });
    };
  }, [user]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const closeMobile = () => setMobileNavOpen(false);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "?";

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200/80 px-4 py-5 dark:border-slate-800">
        <Link to="/dashboard" className="flex items-center gap-3" onClick={closeMobile}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
            <LayoutDashboard className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">Atlas Notes</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">Knowledge & collaboration</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.to} {...item} onNavigate={closeMobile} />
              ))}
            </div>
          </div>
        ))}

        {user?.role === "admin" ? (
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Administration
            </p>
            <NavItem to="/admin" label="Admin" icon={Shield} onNavigate={closeMobile} />
          </div>
        ) : null}
      </nav>

      <div className="border-t border-slate-200/80 p-3 dark:border-slate-800">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{user.name || "Account"}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDark((v) => !v)}
            className="btn-secondary flex flex-1 items-center justify-center gap-2 py-2 text-xs"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Theme
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch(clearSession());
              navigate("/", { replace: true });
            }}
            className="btn-secondary flex flex-1 items-center justify-center gap-2 py-2 text-xs text-rose-600 dark:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
        <Link to="/" className="mt-3 block text-center text-[11px] text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">
          View landing page
        </Link>
      </div>
    </div>
  );

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <div className="lg:flex">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
            <Link to="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                <LayoutDashboard className="h-4 w-4" />
              </span>
              Atlas Notes
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </header>

          {mobileNavOpen ? (
            <div
              className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileNavOpen(false)}
              aria-hidden
            />
          ) : null}

          <aside
            className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,88vw)] transform border-r border-slate-200/80 bg-white shadow-soft-lg transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 lg:static lg:z-0 lg:flex lg:w-64 lg:translate-x-0 lg:shadow-none ${
              mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            }`}
          >
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>

          <main className="min-h-[calc(100vh-3.5rem)] flex-1 lg:min-h-screen">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
              <div className="animate-fade-in rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-700/80 dark:bg-slate-900/40 dark:shadow-none sm:p-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
