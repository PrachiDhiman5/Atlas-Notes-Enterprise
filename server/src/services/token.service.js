import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const pickExpires = (value, fallback) => {
  const v = (value || "").trim();
  return v.length ? v : fallback;
};

export const signAccessToken = (payload) =>
  jwt.sign(payload, env.jwtAccessSecret, { expiresIn: pickExpires(env.accessTokenExpiresIn, "15m") });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: pickExpires(env.refreshTokenExpiresIn, "7d") });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);
