import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import AuthLayout from "../components/AuthLayout.jsx";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
      if (res.data.passwordResetEmailSent === false) {
        setMessage(
          (m) =>
            `${m} No email was sent — configure SMTP in server/.env. In development, check the API terminal for a reset token.`
        );
      }
    } catch (e) {
      setError(e.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We’ll email you a secure link if an account exists for this address."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="input-field"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          Send reset link
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Remembered your password?{" "}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Sign in
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
