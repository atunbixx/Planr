import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { parse } from 'cookie';
import { createClient } from '@/lib/supabase/server';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  coupleId?: string;
}

export class WebSocketServer {
  private io: SocketIOServer;
  private activeSessions: Map<string, Set<string>> = new Map(); // coupleId -> Set of socketIds

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupAuthentication();
    this.setupNamespaces();
  }

  private setupAuthentication() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        // Extract auth token from cookie or query
        const cookies = socket.handshake.headers.cookie;
        let token: string | undefined;

        if (cookies) {
          const parsedCookies = parse(cookies);
          token = parsedCookies.__session;
        }

        if (!token) {
          token = socket.handshake.auth.token || socket.handshake.query.token as string;
        }

        if (!token) {
          return next(new Error('Authentication required'));
        }

        // Verify Supabase token
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
          return next(new Error('Invalid token'));
        }

        // Attach user info to socket
        socket.userId = user.id;
        socket.coupleId = socket.handshake.query.coupleId as string;

        if (!socket.coupleId) {
          return next(new Error('Couple ID required'));
        }

        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupNamespaces() {
    // Day-of Dashboard namespace
    const dayOfNamespace = this.io.of('/day-of');
    
    dayOfNamespace.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected to day-of dashboard`);
      
      // Join couple-specific room
      if (socket.coupleId) {
        socket.join(`couple:${socket.coupleId}`);
        this.addToActiveSession(socket.coupleId, socket.id);
      }

      // Timeline events
      socket.on('timeline:update', async (data) => {
        const { eventId, status, updates } = data;
        
        // Broadcast to all users in the couple's room
        dayOfNamespace.to(`couple:${socket.coupleId}`).emit('timeline:updated', {
          eventId,
          status,
          updates,
          updatedBy: socket.userId,
          timestamp: new Date(),
        });
      });

      // Vendor check-ins
      socket.on('vendor:checkin', async (data) => {
        const { vendorId, status, details } = data;
        
        dayOfNamespace.to(`couple:${socket.coupleId}`).emit('vendor:checked-in', {
          vendorId,
          status,
          details,
          checkedInBy: socket.userId,
          timestamp: new Date(),
        });
      });

      // Issue reporting
      socket.on('issue:create', async (data) => {
        const { issue } = data;
        
        dayOfNamespace.to(`couple:${socket.coupleId}`).emit('issue:created', {
          issue,
          reportedBy: socket.userId,
          timestamp: new Date(),
        });
      });

      socket.on('issue:update', async (data) => {
        const { issueId, updates } = data;
        
        dayOfNamespace.to(`couple:${socket.coupleId}`).emit('issue:updated', {
          issueId,
          updates,
          updatedBy: socket.userId,
          timestamp: new Date(),
        });
      });

      // Guest check-ins
      socket.on('guest:checkin', async (data) => {
        const { guestId, tableConfirmed, mealServed } = data;
        
        dayOfNamespace.to(`couple:${socket.coupleId}`).emit('guest:checked-in', {
          guestId,
          tableConfirmed,
          mealServed,
          checkedInBy: socket.userId,
          timestamp: new Date(),
        });
      });

      // Weather updates
      socket.on('weather:update', async (data) => {
        dayOfNamespace.to(`couple:${socket.coupleId}`).emit('weather:updated', {
          ...data,
          timestamp: new Date(),
        });
      });

      // User presence
      socket.on('presence:update', (data) => {
        const { location, activity } = data;
        
        dayOfNamespace.to(`couple:${socket.coupleId}`).emit('presence:updated', {
          userId: socket.userId,
          location,
          activity,
          timestamp: new Date(),
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected from day-of dashboard`);
        
        if (socket.coupleId) {
          this.removeFromActiveSession(socket.coupleId, socket.id);
          
          // Notify others about user leaving
          dayOfNamespace.to(`couple:${socket.coupleId}`).emit('presence:left', {
            userId: socket.userId,
            timestamp: new Date(),
          });
        }
      });
    });

    // Seating Planner namespace
    const seatingNamespace = this.io.of('/seating');
    
    seatingNamespace.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected to seating planner`);
      
      const layoutId = socket.handshake.query.layoutId as string;
      if (layoutId) {
        socket.join(`layout:${layoutId}`);
      }

      // Table operations
      socket.on('table:create', (data) => {
        seatingNamespace.to(`layout:${layoutId}`).emit('table:created', {
          ...data,
          createdBy: socket.userId,
        });
      });

      socket.on('table:move', (data) => {
        const { tableId, x, y } = data;
        
        // Broadcast to others (not sender)
        socket.to(`layout:${layoutId}`).emit('table:moved', {
          tableId,
          x,
          y,
          movedBy: socket.userId,
        });
      });

      socket.on('table:update', (data) => {
        seatingNamespace.to(`layout:${layoutId}`).emit('table:updated', {
          ...data,
          updatedBy: socket.userId,
        });
      });

      socket.on('table:delete', (data) => {
        seatingNamespace.to(`layout:${layoutId}`).emit('table:deleted', {
          ...data,
          deletedBy: socket.userId,
        });
      });

      // Guest assignments
      socket.on('guest:assign', (data) => {
        const { guestId, tableId, seatNumber } = data;
        
        seatingNamespace.to(`layout:${layoutId}`).emit('guest:assigned', {
          guestId,
          tableId,
          seatNumber,
          assignedBy: socket.userId,
        });
      });

      socket.on('guest:unassign', (data) => {
        seatingNamespace.to(`layout:${layoutId}`).emit('guest:unassigned', {
          ...data,
          unassignedBy: socket.userId,
        });
      });

      socket.on('guests:swap', (data) => {
        seatingNamespace.to(`layout:${layoutId}`).emit('guests:swapped', {
          ...data,
          swappedBy: socket.userId,
        });
      });

      // Cursor tracking for collaboration
      socket.on('cursor:move', (data) => {
        socket.to(`layout:${layoutId}`).emit('cursor:moved', {
          userId: socket.userId,
          ...data,
        });
      });

      // User joined
      seatingNamespace.to(`layout:${layoutId}`).emit('user:joined', {
        userId: socket.userId,
        timestamp: new Date(),
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected from seating planner`);
        
        seatingNamespace.to(`layout:${layoutId}`).emit('user:left', {
          userId: socket.userId,
          timestamp: new Date(),
        });
      });
    });
  }

  private addToActiveSession(coupleId: string, socketId: string) {
    if (!this.activeSessions.has(coupleId)) {
      this.activeSessions.set(coupleId, new Set());
    }
    this.activeSessions.get(coupleId)!.add(socketId);
  }

  private removeFromActiveSession(coupleId: string, socketId: string) {
    const sessions = this.activeSessions.get(coupleId);
    if (sessions) {
      sessions.delete(socketId);
      if (sessions.size === 0) {
        this.activeSessions.delete(coupleId);
      }
    }
  }

  public getActiveSessions(coupleId: string): number {
    return this.activeSessions.get(coupleId)?.size || 0;
  }

  public broadcastToCouple(coupleId: string, event: string, data: any) {
    this.io.of('/day-of').to(`couple:${coupleId}`).emit(event, data);
  }

  public broadcastToLayout(layoutId: string, event: string, data: any) {
    this.io.of('/seating').to(`layout:${layoutId}`).emit(event, data);
  }
}

// Singleton instance
let wsServer: WebSocketServer | null = null;

export function initializeWebSocketServer(httpServer: HTTPServer): WebSocketServer {
  if (!wsServer) {
    wsServer = new WebSocketServer(httpServer);
  }
  return wsServer;
}

export function getWebSocketServer(): WebSocketServer | null {
  return wsServer;
}