import http from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { initializeSocket } from "./config/socket.js";
import { verifySmtpAtStartup } from "./services/mail.service.js";

const bootstrap = async () => {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: env.corsOrigins, credentials: true }
  });

  initializeSocket(io);

  server.listen(env.port, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on 0.0.0.0:${env.port}`);
    verifySmtpAtStartup().catch(() => {});
  });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Server failed to start:", error);
  process.exit(1);
});
