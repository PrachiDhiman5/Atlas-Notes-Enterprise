let ioInstance;

export const initializeSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    socket.on("workspace:join", (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
    });

    socket.on("presence:update", (payload) => {
      socket.broadcast.emit("presence:changed", payload);
    });
  });
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.IO not initialized");
  }

  return ioInstance;
};
