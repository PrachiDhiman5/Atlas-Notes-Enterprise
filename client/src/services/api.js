import axios from "axios";

let accessToken = null;

export function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // Dev: Vite proxies /api → backend (see vite.config.js). Same origin = no CORS issues.
  if (import.meta.env.DEV) return "/api/v1";
  return "http://localhost:5000/api/v1";
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

/** Redux restores session after this module loads; sync token before the first query runs. */
try {
  if (typeof localStorage !== "undefined") {
    const raw = localStorage.getItem("session");
    if (raw) {
      const s = JSON.parse(raw);
      if (s?.accessToken) accessToken = s.accessToken;
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
