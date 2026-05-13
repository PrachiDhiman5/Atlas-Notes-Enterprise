import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { api, getApiErrorMessage, setApiAccessToken, setApiRefreshToken } from "../services/api.js";
import { setSession } from "../redux/store.js";
import AuthLayout from "../components/AuthLayout.jsx";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const res = await api.post("/auth/login", { email, password });
      const { user, accessToken, refreshToken } = res.data.data;
      dispatch(setSession({ user, accessToken, refreshToken }));
      setApiAccessToken(accessToken);
      setApiRefreshToken(refreshToken);
      navigate("/dashboard");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Login failed"));
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to your workspaces and notes.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Email
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
            autoComplete="current-password"
            className="input-field"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          Sign in
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6 text-center text-sm dark:border-slate-700">
        <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          Forgot password?
        </Link>
        <p className="text-slate-500 dark:text-slate-400">
          New here?{" "}
          <Link to="/signup" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Create an account
          </Link>
        </p>
        <p className="text-slate-500 dark:text-slate-400">
          <Link to="/" className="font-medium text-slate-600 hover:underline dark:text-slate-300">
            ← Back to landing
          </Link>
        </p>
      </div>
      {message ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {message}
        </div>
      ) : null}
    </AuthLayout>
  );
}
