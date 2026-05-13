import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

const { version: pkgVersion } = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"),
    "utf8"
  )
);

const rootJson = {
  success: true,
  message: "Enterprise Notes API",
  version: pkgVersion,
  health: "/api/v1/health",
  api: "/api/v1"
};

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true
  })
);
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300
  })
);

app.get("/", (req, res) => {
  res.status(200).json(rootJson);
});
app.head("/", (req, res) => {
  res.status(200).json(rootJson);
});

app.use("/api/v1", routes);
app.use(notFound);
app.use(errorHandler);
