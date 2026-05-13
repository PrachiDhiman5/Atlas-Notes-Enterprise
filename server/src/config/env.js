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
  "http://127.0.0.1:5174"
];

const parseCorsOrigins = () => {
  const raw = process.env.CLIENT_URL || "http://localhost:5173";
  const fromEnv = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...fromEnv, ...defaultDevOrigins])];
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "",
  /** First entry is primary (e.g. emails); full list used for CORS + Socket.IO */
  clientUrl: (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim(),
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
