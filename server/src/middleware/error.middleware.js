import { StatusCodes } from "http-status-codes";
import { env } from "../config/env.js";

export const notFound = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
};

const duplicateKeyMessage = (err) => {
  const key = err.keyPattern ? Object.keys(err.keyPattern)[0] : null;
  if (key === "email") return "This email is already registered.";
  return "A record with this value already exists.";
};

export const errorHandler = (err, req, res, next) => {
  if (env.nodeEnv !== "production") {
    // eslint-disable-next-line no-console
    console.error("[API Error]", req.method, req.originalUrl, err);
  }

  let statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal server error";

  if (err.name === "MongoServerError" && err.code === 11000) {
    statusCode = StatusCodes.CONFLICT;
    message = duplicateKeyMessage(err);
  } else if (err.name === "ValidationError") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(". ") || message;
  } else if (err.name === "CastError") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Invalid id or data format.";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = "Invalid token.";
  } else if (err.name === "TokenExpiredError") {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = "Token expired.";
  } else if (err.name === "MongoServerSelectionError" || err.message?.includes("buffering timed out")) {
    statusCode = StatusCodes.SERVICE_UNAVAILABLE;
    message = "Cannot reach MongoDB. Start MongoDB (or Atlas), verify MONGO_URI in server/.env, then restart the API.";
  } else if (err.code === "ECONNREFUSED" || err.message?.includes("ECONNREFUSED")) {
    statusCode = StatusCodes.SERVICE_UNAVAILABLE;
    message = "Database connection refused. Check MONGO_URI and that MongoDB is running.";
  }

  const body = { success: false, message };
  if (env.nodeEnv !== "production" && statusCode === StatusCodes.INTERNAL_SERVER_ERROR) {
    body.detail = err.name || "Error";
    if (err.code) body.code = err.code;
  }

  res.status(statusCode).json(body);
};
