import { io } from "socket.io-client";

let socket;

const missingProdSocketUrl =
  "Production build requires VITE_SOCKET_URL (Socket.IO origin, e.g. https://your-api.onrender.com). Set it in client/.env.production or your host’s env before building.";

function getSocketConnectUrl() {
  const fromEnv = String(import.meta.env.VITE_SOCKET_URL ?? "").trim();
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return undefined;
  if (import.meta.env.PROD) {
    console.error(missingProdSocketUrl);
    throw new Error(missingProdSocketUrl);
  }
  return undefined;
}

export const getSocket = () => {
  if (!socket) {
    const opts = { path: "/socket.io", withCredentials: true };
    const url = getSocketConnectUrl();
    socket = url ? io(url, opts) : io(opts);
  }
  return socket;
};
