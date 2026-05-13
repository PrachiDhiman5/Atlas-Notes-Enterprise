import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    avatarUrl: String,
    isEmailVerified: { type: Boolean, default: false },
    refreshTokenHash: String,
    emailVerificationTokenHash: String,
    emailVerificationExpiresAt: Date,
    passwordResetTokenHash: String,
    passwordResetExpiresAt: Date
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
