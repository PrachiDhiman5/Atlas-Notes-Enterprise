import axios from "axios";
import { clearSession, setSession, store } from "../redux/store.js";

let accessToken = null;
let refreshToken = null;
let refreshInFlight = null;

const missingProdApiUrl =
  "Production build requires VITE_API_URL (full API base, e.g. https://your-api.onrender.com/api/v1). Set it in client/.env.production or your host’s env before building.";

/**
 * When VITE_API_URL is set to an origin only (or /api without v1), requests like GET /workspaces
 * miss the Express mount at /api/v1 and return 404 ("Route not found: /workspaces").
 */
function normalizeViteApiBase(raw) {
  let s = String(raw).trim().replace(/\/+$/, "");
  if (!s) return s;
  if (s.endsWith("/api/v1")) return s;
  if (s.endsWith("/api")) return `${s}/v1`;
  try {
    const u = new URL(s);
    const p = (u.pathname || "").replace(/\/+$/, "") || "";
    if (p === "" || p === "/") return `${u.origin}/api/v1`;
    if (p === "/api") return `${u.origin}/api/v1`;
    if (!p.includes("/api/v1")) return `${u.origin}/api/v1`;
  } catch {
    /* relative or invalid URL — leave for axios; dev proxy uses "/api/v1" */
  }
  return s;
}

export function getApiBaseUrl() {
  const fromEnv = String(import.meta.env.VITE_API_URL ?? "").trim();
  if (fromEnv) return normalizeViteApiBase(fromEnv);
  // Dev: Vite proxies /api → backend (see vite.config.js). Same origin = no CORS issues.
  if (import.meta.env.DEV) return "/api/v1";
  if (import.meta.env.PROD) {
    console.error(missingProdApiUrl);
    throw new Error(missingProdApiUrl);
  }
  return "/api/v1";
}

function isDevProxy() {
  return import.meta.env.DEV && getApiBaseUrl().startsWith("/");
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true
});

export const setApiAccessToken = (token) => {
  accessToken = token;
};

export const setApiRefreshToken = (token) => {
  refreshToken = token;
};

/** Redux restores session after this module loads; sync tokens before the first query runs. */
try {
  if (typeof localStorage !== "undefined") {
    const raw = localStorage.getItem("session");
    if (raw) {
      const s = JSON.parse(raw);
      if (s?.accessToken) accessToken = s.accessToken;
      if (s?.refreshToken) refreshToken = s.refreshToken;
    }
  }
} catch {
  /* ignore */
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

function requestPath(config) {
  let u = String(config?.url || "").replace(/\?.*$/, "");
  if (!u) return "";
  if (!u.startsWith("/")) u = `/${u}`;
  return u;
}

async function rotateRefreshAndApply() {
  const rt = refreshToken;
  if (!rt) throw new Error("No refresh token");
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const { data } = await axios.post(`${base}/auth/refresh`, { refreshToken: rt }, { withCredentials: true });
  const nextAccess = data?.data?.accessToken;
  const nextRefresh = data?.data?.refreshToken;
  if (!nextAccess || !nextRefresh) throw new Error("Refresh response missing tokens");
  accessToken = nextAccess;
  refreshToken = nextRefresh;
  const user = store.getState().auth.user;
  store.dispatch(setSession({ user, accessToken: nextAccess, refreshToken: nextRefresh }));
  return nextAccess;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (status !== 401 || !original || original._authRetry) {
      return Promise.reject(error);
    }
    const path = requestPath(original);
    if (path.includes("/auth/refresh") || path.includes("/auth/login") || path.includes("/auth/signup")) {
      return Promise.reject(error);
    }
    if (!refreshToken) {
      return Promise.reject(error);
    }
    original._authRetry = true;
    try {
      refreshInFlight ??= rotateRefreshAndApply().finally(() => {
        refreshInFlight = null;
      });
      const newAccess = await refreshInFlight;
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch {
      accessToken = null;
      refreshToken = null;
      store.dispatch(clearSession());
      return Promise.reject(error);
    }
  }
);

const proxyBackendHint =
  "The API is not running on port 5000 (Vite proxy refused the connection). Fix: (1) Copy server/.env.example to server/.env and set MONGO_URI. (2) Start MongoDB. (3) Run npm run dev:server until you see \"MongoDB connected\". (4) Or run npm run dev:all from the project root to start API + client together.";

/**
 * Human-readable message for failed API calls (network, CORS, validation, etc.)
 */
export function getApiErrorMessage(error, fallback = "Something went wrong") {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.message) return data.message;
    if (Array.isArray(data?.errors) && data.errors.length) {
      return data.errors.map((e) => e.message || JSON.stringify(e)).join(". ");
    }

    const status = error.response?.status;
    if (isDevProxy()) {
      if (
        error.code === "ERR_NETWORK" ||
        error.message === "Network Error" ||
        (status && status >= 502 && status <= 504) ||
        (status === 500 && (!data?.message || data?.message === "Internal Server Error"))
      ) {
        return proxyBackendHint;
      }
    }

    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      if (import.meta.env.DEV) {
        return "Cannot reach the API. If you use the Vite proxy, run npm run dev:server and ensure MONGO_URI is set in server/.env. Otherwise set VITE_API_URL in client/.env.";
      }
      return "Cannot reach the API. Set VITE_API_URL in client/.env to your deployed API (e.g. https://your-api.onrender.com/api/v1) and ensure the server allows your site’s origin in CORS (CLIENT_URL).";
    }
    if (error.response?.status === 429) {
      return "Too many requests. Wait a minute and try again.";
    }
    if (error.response?.status) {
      return `Request failed (${error.response.status}).`;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
