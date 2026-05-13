import { User } from "../models/User.js";
import { verifyAccessToken } from "../services/token.service.js";
import { ApiError } from "../utils/ApiError.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    let token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token || typeof token !== "string") {
      throw new ApiError(401, "Unauthorized");
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(401, "Invalid or expired token"));
  }
};

/** Same as requireAuth but also accepts ?token= for opening files in a new browser tab. */
export const requireAuthFlexible = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    let token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token && typeof req.query.token === "string") {
      token = req.query.token;
    }
    if (!token || typeof token !== "string") {
      throw new ApiError(401, "Unauthorized");
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    req.user = user;
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
};

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, "Forbidden"));
  }
  return next();
};
