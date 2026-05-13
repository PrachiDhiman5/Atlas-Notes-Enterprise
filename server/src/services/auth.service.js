import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./token.service.js";

const hashToken = (rawToken) => crypto.createHash("sha256").update(rawToken).digest("hex");
const createRawToken = () => crypto.randomBytes(32).toString("hex");

export const registerUser = async ({ name, email, password }) => {
  const exists = await User.findOne({ email });
  if (exists) {
    throw new ApiError(409, "Email already in use");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const verificationToken = createRawToken();
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    emailVerificationTokenHash: hashToken(verificationToken),
    emailVerificationExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
  });
  return { user, verificationToken };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const payload = { sub: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();

  return { user, accessToken, refreshToken };
};

export const rotateRefreshToken = async (refreshToken) => {
  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub).select("+password");
  if (!user || !user.refreshTokenHash) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!isValid) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const nextPayload = { sub: user.id, role: user.role };
  const nextAccessToken = signAccessToken(nextPayload);
  const nextRefreshToken = signRefreshToken(nextPayload);
  user.refreshTokenHash = await bcrypt.hash(nextRefreshToken, 10);
  await user.save();

  return { accessToken: nextAccessToken, refreshToken: nextRefreshToken };
};

export const requestEmailVerification = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    return { verificationToken: null };
  }

  const verificationToken = createRawToken();
  user.emailVerificationTokenHash = hashToken(verificationToken);
  user.emailVerificationExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await user.save();
  return { verificationToken };
};

export const verifyEmailToken = async (token) => {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: { $gt: new Date() }
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();
  return user;
};

export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    return { resetToken: null };
  }

  const resetToken = createRawToken();
  user.passwordResetTokenHash = hashToken(resetToken);
  user.passwordResetExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
  await user.save();
  return { resetToken };
};

export const resetPassword = async ({ token, password }) => {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() }
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  user.password = await bcrypt.hash(password, 12);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.refreshTokenHash = undefined;
  await user.save();
};

export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
};
