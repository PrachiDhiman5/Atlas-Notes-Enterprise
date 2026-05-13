import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Local disk uploads (when Cloudinary is not configured) */
const defaultUploadDir = path.join(__dirname, "../../storage/uploads");
/** server/.env (always relative to this file, not process.cwd()) */
const serverEnvPath = path.join(__dirname, "../../.env");
/** monorepo root .env — optional fallback */
const rootEnvPath = path.join(__dirname, "../../../.env");

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: serverEnvPath, override: true });

const defaultDevOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:4173",
  "http://127.0.0.1:4173"
];

const defaultPrimaryClientUrl = "http://localhost:5173";

/** Strip repeated outer single/double quotes from pasted env values. */
const stripOuterQuotes = (value) => {
  let t = String(value).trim();
  while (t.length >= 2) {
    const dq = t.startsWith('"') && t.endsWith('"');
    const sq = t.startsWith("'") && t.endsWith("'");
    if (!dq && !sq) break;
    t = t.slice(1, -1).trim();
  }
  return t;
};

/**
 * Normalize for CORS `Origin` matching. With `credentials: true`, browsers reject `*`;
 * we never emit it from env (treat as absent).
 */
const normalizeCorsOrigin = (value) => {
  const collapsed = stripOuterQuotes(String(value).replace(/\r?\n/g, "")).trim();
  if (!collapsed || collapsed === "*") return null;
  const noTrailingSlash = collapsed.replace(/\/+$/, "");
  if (!noTrailingSlash || noTrailingSlash === "*") return null;
  return noTrailingSlash;
};

/** Split CLIENT_URL on commas / newlines; empty segments and lone commas are dropped. */
const splitClientUrlRaw = (raw) => {
  if (raw == null) return [];
  return String(raw)
    .replace(/\r?\n/g, ",")
    .split(",")
    .map((segment) => stripOuterQuotes(segment).trim())
    .filter(Boolean);
};

/**
 * Origins parsed only from CLIENT_URL (no dev merge). Used for primary client URL (emails, etc.).
 * Production: add your Vercel HTTPS origin here; if unset, `clientUrl` falls back to localhost.
 */
const parseExplicitClientOrigins = () => {
  const raw = process.env.CLIENT_URL;
  if (raw == null || !String(raw).trim()) return [];
  return splitClientUrlRaw(raw).map(normalizeCorsOrigin).filter(Boolean);
};

const explicitClientOrigins = parseExplicitClientOrigins();

/**
 * CORS + Socket.IO: explicit CLIENT_URL origins plus fixed dev hosts (Vite).
 * If CLIENT_URL is missing/empty in production, only the dev defaults apply — browsers on Vercel
 * will be blocked until CLIENT_URL includes the deployed app origin.
 */
const parseCorsOrigins = () => {
  const dev = defaultDevOrigins.map(normalizeCorsOrigin).filter(Boolean);
  return [...new Set([...explicitClientOrigins, ...dev])];
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "",
  /** First valid explicit CLIENT_URL origin, else localhost (emails / redirects). */
  clientUrl: explicitClientOrigins[0] || defaultPrimaryClientUrl,
  corsOrigins: parseCorsOrigins(),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "access-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "refresh-secret",
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:5173",
  smtpHost: (process.env.SMTP_HOST || "").trim(),
  smtpPort: Number(process.env.SMTP_PORT || 587),
  /** Trim + remove spaces so Gmail “xxxx xxxx …” app passwords paste correctly */
  smtpUser: (process.env.SMTP_USER || "").trim(),
  smtpPass: (process.env.SMTP_PASS || "").replace(/\s/g, ""),
  smtpFrom: (process.env.SMTP_FROM || "no-reply@collabnotes.local").trim(),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  uploadDir: process.env.UPLOAD_DIR || defaultUploadDir
};

export const envPaths = { serverEnvPath, rootEnvPath };
