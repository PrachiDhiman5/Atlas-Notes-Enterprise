import { asyncHandler } from "../utils/asyncHandler.js";
import {
  loginUser,
  logoutUser,
  registerUser,
  requestEmailVerification,
  requestPasswordReset,
  resetPassword,
  rotateRefreshToken,
  verifyEmailToken
} from "../services/auth.service.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/mail.service.js";
import { env } from "../config/env.js";

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
});

export const signup = asyncHandler(async (req, res) => {
  const { user, verificationToken } = await registerUser(req.body);
  const mailed = await sendVerificationEmail({ to: user.email, token: verificationToken });
  if (!mailed && env.nodeEnv !== "production") {
    // eslint-disable-next-line no-console
    console.warn(
      "[mail] Verification email was not sent (set SMTP_HOST, SMTP_USER, SMTP_PASS in server/.env). Paste this token on /verify-email:",
      verificationToken
    );
  }
  res.status(201).json({
    success: true,
    data: sanitizeUser(user),
    message: mailed ? "Signup successful. Verification email sent." : "Signup successful.",
    emailVerificationSent: mailed
  });
});

export const login = asyncHandler(async (req, res) => {
  const data = await loginUser(req.body);
  res.status(200).json({
    success: true,
    data: {
      user: sanitizeUser(data.user),
      accessToken: data.accessToken,
      refreshToken: data.refreshToken
    }
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken;
  const data = await rotateRefreshToken(token);
  res.status(200).json({ success: true, data });
});

export const me = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: sanitizeUser(req.user) });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  await verifyEmailToken(req.body.token);
  res.status(200).json({ success: true, message: "Email verified successfully" });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { verificationToken } = await requestEmailVerification(req.body.email);
  let mailed = false;
  if (verificationToken) {
    mailed = await sendVerificationEmail({ to: req.body.email, token: verificationToken });
    if (!mailed && env.nodeEnv !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        "[mail] Resend verification email failed. Token for /verify-email:",
        verificationToken
      );
    }
  }
  res.status(200).json({
    success: true,
    message: "If an account exists, verification instructions were generated.",
    emailVerificationSent: verificationToken ? mailed : undefined
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { resetToken } = await requestPasswordReset(req.body.email);
  let mailed = false;
  if (resetToken) {
    mailed = await sendPasswordResetEmail({ to: req.body.email, token: resetToken });
    if (!mailed && env.nodeEnv !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[mail] Password reset email failed. Token for /reset-password:", resetToken);
    }
  }
  res.status(200).json({
    success: true,
    message: "If an account exists, reset instructions were generated.",
    passwordResetEmailSent: resetToken ? mailed : undefined
  });
});

export const resetPasswordByToken = asyncHandler(async (req, res) => {
  await resetPassword(req.body);
  res.status(200).json({ success: true, message: "Password reset successful" });
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser(req.user.id);
  res.status(200).json({ success: true, message: "Logged out successfully" });
});
