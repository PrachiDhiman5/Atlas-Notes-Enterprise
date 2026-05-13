import { io } from "socket.io-client";

let socket;

export const getSocket = () => {
  if (!socket) {
    const opts = { path: "/socket.io", withCredentials: true };
    if (import.meta.env.DEV && !import.meta.env.VITE_SOCKET_URL) {
      socket = io(opts);
    } else {
      socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", opts);
    }
  }
  return socket;
};
