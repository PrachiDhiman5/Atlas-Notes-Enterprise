import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret
});

export const uploadToCloudinary = async (fileBuffer, folder = "collab-notes") => {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    return null;
  }

  const base64 = fileBuffer.toString("base64");
  const dataUri = `data:application/octet-stream;base64,${base64}`;
  const result = await cloudinary.uploader.upload(dataUri, { folder, resource_type: "auto" });
  return result.secure_url;
};
