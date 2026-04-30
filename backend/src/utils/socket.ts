import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { logger } from "../config/logger";

let io: SocketServer;

interface JwtPayload {
  userId: string;
}

export function initSocket(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: {
      origin: env.frontendUrl,
      methods: ["GET", "POST"],
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    logger.debug(`Socket connected: ${socket.id}, user: ${socket.data.userId}`);

    socket.on("join-tenant", (tenantId: string) => {
      socket.join(`tenant:${tenantId}`);
      logger.debug(`Socket ${socket.id} joined tenant:${tenantId}`);
    });

    socket.on("join-conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("leave-conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("disconnect", () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

export function emitToTenant(tenantId: string, event: string, data: unknown) {
  if (io) {
    io.to(`tenant:${tenantId}`).emit(event, data);
  }
}

export function emitToConversation(conversationId: string, event: string, data: unknown) {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
}
