import { Router } from "express";
import {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  resendVerification,
  resetPasswordByToken,
  signup,
  verifyEmail
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  emailOnlySchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  tokenSchema
} from "../validators/auth.validator.js";

const router = Router();

router.post("/signup", validate(registerSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/verify-email", validate(tokenSchema), verifyEmail);
router.post("/resend-verification", validate(emailOnlySchema), resendVerification);
router.post("/forgot-password", validate(emailOnlySchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPasswordByToken);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);

export default router;
