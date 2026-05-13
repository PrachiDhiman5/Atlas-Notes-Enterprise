import { useState } from "react";
import { Link } from "react-router-dom";
import { api, getApiErrorMessage } from "../services/api.js";
import AuthLayout from "../components/AuthLayout.jsx";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [mailNotice, setMailNotice] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setMailNotice("");
    try {
      const res = await api.post("/auth/signup", { name, email, password });
      setMessage(
        res.data.message ||
          "Account created. Check your email to verify, then log in."
      );
      if (res.data.emailVerificationSent === false) {
        setMailNotice(
          "No email was sent from this server. Add SMTP_USER and SMTP_PASS in server/.env (Gmail requires an app password). In development, the API terminal prints a token you can paste on the verify page."
        );
      }
    } catch (e) {
      setError(getApiErrorMessage(e, "Signup failed"));
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="After signup you’ll verify email, then access the dashboard and workspaces.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Full name
          </label>
          <input id="name" autoComplete="name" className="input-field" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Work email
          </label>
          <input id="email" type="email" autoComplete="email" className="input-field" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            className="input-field"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          Sign up
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Log in
        </Link>
      </p>
      {message ? (
        <div className="mt-4 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
          <p>{message}</p>
          <Link to="/verify-email" className="inline-block font-medium text-indigo-600 underline dark:text-indigo-400">
            Open email verification →
          </Link>
          {mailNotice ? (
            <p className="border-t border-emerald-200/80 pt-3 text-xs text-emerald-900/80 dark:border-emerald-800/50 dark:text-emerald-300/90">
              {mailNotice}
            </p>
          ) : null}
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
