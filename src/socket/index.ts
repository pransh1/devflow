// Socket.io server
import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { db } from '../db';
import { workspaceMembers } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  email: string;
};

let io: SocketServer;

export function initSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: '*', 
      // origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: false,
    },
    pingTimeout: 60000,    // 60s before considering connection dead
    pingInterval: 25000,   // ping every 25s to keep connection alive
  });

  // ─── Auth Middleware ──────────────────────────────────────
  // Every socket connection must send a valid JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization?.replace('Bearer ', '');

      if(!token) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyAccessToken(token);
      (socket as AuthenticatedSocket).userId = payload.userId;
      (socket as AuthenticatedSocket).email = payload.email;

      next();
    } catch (error) {
      next(new Error('Invalid or expired token'))
    };
  });
  
  // ─── Connection Handler ───────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(`🔌 User connected: ${authSocket.userId} (socket: ${socket.id})`);

    // ── Join workspace room ──────────────────────────────
    // Client emits this after connecting to subscribe to a workspace
    socket.on('workspace:join', async (workspaceId: string) => {
      try {
        // Verify user is actually a member before letting them join the room
        const membership = await db.query.workspaceMembers.findFirst({
          where: and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, authSocket.userId)
          ),
        });
        if(!membership) {
          socket.emit('error', { message: 'Not a member of this workspace' });
          return;
        }

        // Join the room — room name is just the workspaceId
        socket.join(`workspace:${workspaceId}`);
        console.log(`👥 User ${authSocket.userId} joined workspace:${workspaceId}`);

        // Tell the client they successfully joined
        socket.emit('workspace:joined', { workspaceId });

        // ── Presence: announce this user is online ─────
        socket.to(`workspace:${workspaceId}`).emit('presence:user_online', {
          userId: authSocket.userId,
          email: authSocket.email,
          timeStamp: new Date().toISOString(),
        });

        // Store which workspaces this socket is in (for disconnect cleanup)
        if(!socket.data.workspaces) socket.data.workspaces = [];
        socket.data.workspaces.push(workspaceId);

      } catch (err) {
        console.error('workspace:join error', err);
        socket.emit('error', { message: 'Failed to join workspace' });
      };
    });

    // ── Leave workspace room ─────────────────────────────
    socket.on('workspace:leave', (workspaceId: string) => {
      socket.leave(`workspace:${workspaceId}`);

      socket.to(`workspace:${workspaceId}`).emit('presence:user_offline', {
        userId: authSocket.userId,
        timestamp: new Date().toISOString(),
      });

      console.log(`👋 User ${authSocket.userId} left workspace:${workspaceId}`);
    });

    // ── Typing indicator for comments ────────────────────
    socket.on('comment:typing', ({ workspaceId, issueId }: { workspaceId: string; issueId: string }) => {
      socket.to(`workspace:${workspaceId}`).emit('comment:typing', {
        userId: authSocket.userId,
        issueId,
      });
    });

    // ── Disconnect ───────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${authSocket.userId}`);

      // Announce offline to all workspaces this user was in
      const workspaces = socket.data.workspaces || [];
      workspaces.forEach((workspaceId: string) => {
        socket.to(`workspace:${workspaceId}`).emit('presence:user_offline', {
          userId: authSocket.userId,
          timestamp: new Date().toISOString(),
        });
      });
    });
  });

  console.log('🔌 Socket.io server initialized');
  
  return io;

};

// ─── Emit helpers ─────────────────────────────────────────────
// These are called from service layer to push events to clients

export function emitToWorkspace(workspaceId: string, event: string, data: unknown) {
  if (!io) return;
  io.to(`workspace:${workspaceId}`).emit(event, data);
}

export function getIo(): SocketServer {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}