import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyWebSocketToken, extractTokenFromHandshake } from './auth';
import { prisma } from '@/lib/prisma';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  namespace?: string;
  roomId?: string;
  metadata?: Record<string, any>;
}

export class WebSocketServer {
  private io: SocketIOServer;
  private namespaces: Map<string, any> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupNamespaces();
    this.setupMiddleware();
  }

  private setupMiddleware() {
    // Global middleware for authentication
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = extractTokenFromHandshake(socket.handshake.auth);
        
        if (!token) {
          return next(new Error('No authentication token provided'));
        }

        const payload = await verifyWebSocketToken(token);
        
        if (!payload) {
          return next(new Error('Invalid or expired token'));
        }

        // Attach user info to socket
        socket.userId = payload.userId;
        socket.namespace = payload.namespace;
        socket.roomId = payload.roomId;
        socket.metadata = payload.metadata;

        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupNamespaces() {
    // Seating planner namespace
    const seatingNamespace = this.io.of('/seating');
    this.setupSeatingHandlers(seatingNamespace);
    this.namespaces.set('seating', seatingNamespace);

    // Day-of dashboard namespace
    const dayOfNamespace = this.io.of('/day-of-dashboard');
    this.setupDayOfHandlers(dayOfNamespace);
    this.namespaces.set('day-of-dashboard', dayOfNamespace);
  }

  private setupSeatingHandlers(namespace: any) {
    namespace.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected to seating namespace`);

      // Join room based on layout ID
      if (socket.roomId) {
        socket.join(socket.roomId);
        console.log(`User ${socket.userId} joined seating room ${socket.roomId}`);
      }

      // Handle table updates
      socket.on('table:update', async (data) => {
        try {
          const { tableId, updates } = data;
          
          // Validate user has permission
          const hasPermission = await this.validateSeatingPermission(socket.userId!, socket.roomId!);
          if (!hasPermission) {
            socket.emit('error', { message: 'Unauthorized' });
            return;
          }

          // Broadcast to all clients in the room except sender
          socket.to(socket.roomId!).emit('table:updated', {
            tableId,
            updates,
            updatedBy: socket.userId,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to update table' });
        }
      });

      // Handle guest assignment
      socket.on('guest:assign', async (data) => {
        try {
          const { guestId, tableId, seatNumber } = data;
          
          // Validate permission
          const hasPermission = await this.validateSeatingPermission(socket.userId!, socket.roomId!);
          if (!hasPermission) {
            socket.emit('error', { message: 'Unauthorized' });
            return;
          }

          // Broadcast assignment
          socket.to(socket.roomId!).emit('guest:assigned', {
            guestId,
            tableId,
            seatNumber,
            assignedBy: socket.userId,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to assign guest' });
        }
      });

      // Handle collaboration cursor
      socket.on('cursor:move', (data) => {
        socket.to(socket.roomId!).emit('cursor:moved', {
          userId: socket.userId,
          ...data
        });
      });

      // Handle user presence
      socket.on('presence:update', (data) => {
        socket.to(socket.roomId!).emit('presence:updated', {
          userId: socket.userId,
          ...data
        });
      });

      // Handle optimization progress
      socket.on('optimization:progress', (data) => {
        socket.to(socket.roomId!).emit('optimization:progress', data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected from seating namespace`);
        socket.to(socket.roomId!).emit('user:left', {
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  private setupDayOfHandlers(namespace: any) {
    namespace.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected to day-of dashboard`);

      // Join room based on event ID
      if (socket.roomId) {
        socket.join(socket.roomId);
        console.log(`User ${socket.userId} joined day-of room ${socket.roomId}`);
      }

      // Handle timeline updates
      socket.on('timeline:update', async (data) => {
        try {
          const { eventId, status, actualTime } = data;
          
          // Validate permission
          const hasPermission = await this.validateDayOfPermission(socket.userId!, socket.roomId!);
          if (!hasPermission) {
            socket.emit('error', { message: 'Unauthorized' });
            return;
          }

          // Broadcast update
          socket.to(socket.roomId!).emit('timeline:updated', {
            eventId,
            status,
            actualTime,
            updatedBy: socket.userId,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to update timeline' });
        }
      });

      // Handle vendor check-in
      socket.on('vendor:checkin', async (data) => {
        try {
          const { vendorId, status, notes } = data;
          
          // Validate permission
          const hasPermission = await this.validateDayOfPermission(socket.userId!, socket.roomId!);
          if (!hasPermission) {
            socket.emit('error', { message: 'Unauthorized' });
            return;
          }

          // Broadcast check-in
          socket.to(socket.roomId!).emit('vendor:checkedin', {
            vendorId,
            status,
            notes,
            checkedInBy: socket.userId,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to check in vendor' });
        }
      });

      // Handle guest check-in
      socket.on('guest:checkin', async (data) => {
        try {
          const { guestId, tableNumber } = data;
          
          // Broadcast check-in
          namespace.to(socket.roomId!).emit('guest:checkedin', {
            guestId,
            tableNumber,
            checkedInBy: socket.userId,
            timestamp: new Date().toISOString()
          });

          // Also emit stats update
          const stats = await this.getCheckInStats(socket.roomId!);
          namespace.to(socket.roomId!).emit('checkin:stats', stats);
        } catch (error) {
          socket.emit('error', { message: 'Failed to check in guest' });
        }
      });

      // Handle issue reporting
      socket.on('issue:report', async (data) => {
        try {
          const { title, description, priority, category } = data;
          
          // Broadcast new issue
          namespace.to(socket.roomId!).emit('issue:reported', {
            title,
            description,
            priority,
            category,
            reportedBy: socket.userId,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to report issue' });
        }
      });

      // Handle weather updates
      socket.on('weather:update', (data) => {
        namespace.to(socket.roomId!).emit('weather:updated', data);
      });

      // Handle emergency broadcast
      socket.on('emergency:broadcast', async (data) => {
        try {
          const hasPermission = await this.validateDayOfPermission(socket.userId!, socket.roomId!);
          if (!hasPermission) {
            socket.emit('error', { message: 'Unauthorized' });
            return;
          }

          // Broadcast emergency to all clients
          namespace.to(socket.roomId!).emit('emergency:alert', {
            ...data,
            broadcastBy: socket.userId,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to broadcast emergency' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected from day-of dashboard`);
        socket.to(socket.roomId!).emit('user:left', {
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  // Permission validation helpers
  private async validateSeatingPermission(userId: string, layoutId: string): Promise<boolean> {
    try {
      // Check if user has access to this seating layout
      const layout = await prisma.seatingLayout.findFirst({
        where: {
          id: layoutId,
          event: {
            couple: {
              OR: [
                { partner1Id: userId },
                { partner2Id: userId }
              ]
            }
          }
        }
      });

      return !!layout;
    } catch (error) {
      console.error('Error validating seating permission:', error);
      return false;
    }
  }

  private async validateDayOfPermission(userId: string, eventId: string): Promise<boolean> {
    try {
      // Check if user has access to this event
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          couple: {
            OR: [
              { partner1Id: userId },
              { partner2Id: userId }
            ]
          }
        }
      });

      return !!event;
    } catch (error) {
      console.error('Error validating day-of permission:', error);
      return false;
    }
  }

  private async getCheckInStats(eventId: string) {
    try {
      const totalGuests = await prisma.guest.count({
        where: { eventId }
      });

      const checkedInGuests = await prisma.guestCheckIn.count({
        where: { 
          eventId,
          checkedIn: true
        }
      });

      return {
        total: totalGuests,
        checkedIn: checkedInGuests,
        remaining: totalGuests - checkedInGuests,
        percentage: totalGuests > 0 ? (checkedInGuests / totalGuests) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting check-in stats:', error);
      return {
        total: 0,
        checkedIn: 0,
        remaining: 0,
        percentage: 0
      };
    }
  }

  // Public methods for server-initiated broadcasts
  public broadcastToRoom(namespace: string, room: string, event: string, data: any) {
    const ns = this.namespaces.get(namespace);
    if (ns) {
      ns.to(room).emit(event, data);
    }
  }

  public getConnectedClients(namespace: string, room: string): number {
    const ns = this.namespaces.get(namespace);
    if (ns) {
      const roomClients = ns.adapter.rooms.get(room);
      return roomClients ? roomClients.size : 0;
    }
    return 0;
  }
}