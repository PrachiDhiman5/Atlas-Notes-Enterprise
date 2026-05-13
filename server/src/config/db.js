import mongoose from "mongoose";
import { env, envPaths } from "./env.js";

export const connectDB = async () => {
  if (!env.mongoUri?.trim()) {
    throw new Error(
      `MONGO_URI is not set. Copy server/.env.example to server/.env and set MONGO_URI (e.g. mongodb://127.0.0.1:27017/collab_notes for local MongoDB). Env files tried: ${envPaths.serverEnvPath} then ${envPaths.rootEnvPath}`
    );
  }

  await mongoose.connect(env.mongoUri.trim());
  // eslint-disable-next-line no-console
  console.log("MongoDB connected");
};
