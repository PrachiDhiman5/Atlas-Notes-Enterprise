import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter;

const getTransporter = () => {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }

  if (!transporter) {
    const useTls = env.smtpPort === 587;
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      requireTLS: useTls,
      pool: true,
      maxConnections: 2,
      maxMessages: 50,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      },
      tls: {
        minVersion: "TLSv1.2"
      }
    });
  }

  return transporter;
};

/** Run once after server starts; logs whether Gmail/SMTP accepts your credentials */
export const verifySmtpAtStartup = async () => {
  const mailer = getTransporter();
  if (!mailer) {
    // eslint-disable-next-line no-console
    console.warn(
      "[mail] Verification emails disabled: set SMTP_HOST, SMTP_USER, and SMTP_PASS in server/.env (file next to server/package.json)."
    );
    return;
  }
  // eslint-disable-next-line no-console
  console.log(`[mail] Checking SMTP (${env.smtpHost}:${env.smtpPort})…`);
  try {
    await mailer.verify();
    // eslint-disable-next-line no-console
    console.log("[mail] SMTP OK — server can send mail.");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[mail] SMTP verify failed — emails will not send until this is fixed:", err.message);
  }
};

const redactRecipient = (email) => {
  const s = String(email || "");
  const at = s.indexOf("@");
  if (at < 1) return "(invalid)";
  return `${s.slice(0, 2)}…@${s.slice(at + 1)}`;
};

export const sendVerificationEmail = async ({ to, token }) => {
  const mailer = getTransporter();
  if (!mailer) return false;

  const verifyLink = `${env.appBaseUrl}/verify-email?token=${encodeURIComponent(token)}`;
  try {
    const info = await mailer.sendMail({
      from: env.smtpFrom,
      to,
      subject: "Verify your account",
      html: `<p>Welcome! Verify your account using this link:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`
    });
    // eslint-disable-next-line no-console
    console.log("[mail] Verification email accepted by SMTP for", redactRecipient(to), info.messageId ? `(id ${info.messageId})` : "");
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[mail] Verification email failed:", err.message, err.response || "");
    return false;
  }
};

export const sendPasswordResetEmail = async ({ to, token }) => {
  const mailer = getTransporter();
  if (!mailer) return false;

  const resetLink = `${env.appBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  try {
    await mailer.sendMail({
      from: env.smtpFrom,
      to,
      subject: "Reset your password",
      html: `<p>Reset your password using this link:</p><p><a href="${resetLink}">${resetLink}</a></p>`
    });
    // eslint-disable-next-line no-console
    console.log("[mail] Password reset email sent to", redactRecipient(to));
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[mail] Password reset email failed:", err.message, err.response || "");
    return false;
  }
};
