import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(120)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(120)
});

export const tokenSchema = z.object({
  token: z.string().min(32)
});

export const emailOnlySchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8).max(120)
});
