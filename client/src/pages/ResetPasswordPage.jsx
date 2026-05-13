import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import AuthLayout from "../components/AuthLayout.jsx";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const effectiveToken = token || searchParams.get("token") || "";

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/auth/reset-password", { token: effectiveToken, password });
      setMessage("Password updated. You can sign in with your new password.");
    } catch (e) {
      setError(e.response?.data?.message || "Reset failed.");
    }
  };

  return (
    <AuthLayout title="Choose a new password" subtitle="Use a strong password you haven’t used elsewhere.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="token" className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Reset token
          </label>
          <input
            id="token"
            className="input-field font-mono text-xs"
            placeholder="Paste token from email"
            value={effectiveToken}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="input-field"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          Update password
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Back to sign in
        </Link>
      </p>
      {message ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}
    </AuthLayout>
  );
}
