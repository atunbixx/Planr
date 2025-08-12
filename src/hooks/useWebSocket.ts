import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { useSupabaseAuth } from '@/lib/auth/client';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface WebSocketOptions {
  namespace: string;
  query?: Record<string, string>;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

interface WebSocketHook {
  socket: Socket | null;
  connected: boolean;
  emit: (event: string, data: any) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
}

export function useWebSocket(options: WebSocketOptions): WebSocketHook {
  const { user, isSignedIn } = useSupabaseAuth();
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Map<string, Set<(...args: any[]) => void>>>(new Map());

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);

    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (handler) {
      handlersRef.current.get(event)?.delete(handler);
      socketRef.current?.off(event, handler);
    } else {
      handlersRef.current.delete(event);
      socketRef.current?.off(event);
    }
  }, []);

  useEffect(() => {
    let socket: Socket | null = null;

    const initSocket = async () => {
      try {
        if (!isSignedIn || !user) {
          console.error('User not authenticated');
          router.push('/sign-in');
          return;
        }

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          console.error('No auth token available');
          router.push('/sign-in');
          return;
        }

        const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3000';
        
        socket = io(`${socketUrl}${options.namespace}`, {
          auth: { token },
          query: options.query,
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
          console.log(`Connected to ${options.namespace} namespace`);
          setConnected(true);
          options.onConnect?.();

          // Re-attach all handlers
          handlersRef.current.forEach((handlers, event) => {
            handlers.forEach(handler => {
              socket!.on(event, handler);
            });
          });
        });

        socket.on('disconnect', (reason) => {
          console.log(`Disconnected from ${options.namespace}:`, reason);
          setConnected(false);
          options.onDisconnect?.();
        });

        socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          options.onError?.(error);
        });

        socket.on('error', (error) => {
          console.error('Socket error:', error);
          options.onError?.(new Error(error));
        });

        socketRef.current = socket;
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        options.onError?.(error as Error);
      }
    };

    initSocket();

    return () => {
      if (socket) {
        console.log(`Disconnecting from ${options.namespace}`);
        socket.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
    };
  }, [options.namespace, options.query?.coupleId, options.query?.layoutId]);

  return {
    socket: socketRef.current,
    connected,
    emit,
    on,
    off,
  };
}

// Specialized hook for Day-of Dashboard
export function useDayOfWebSocket(coupleId: string) {
  const socket = useWebSocket({
    namespace: '/day-of',
    query: { coupleId },
  });

  const updateTimeline = useCallback((eventId: string, status: string, updates?: any) => {
    socket.emit('timeline:update', { eventId, status, updates });
  }, [socket.emit]);

  const checkInVendor = useCallback((vendorId: string, status: string, details?: any) => {
    socket.emit('vendor:checkin', { vendorId, status, details });
  }, [socket.emit]);

  const createIssue = useCallback((issue: any) => {
    socket.emit('issue:create', { issue });
  }, [socket.emit]);

  const updateIssue = useCallback((issueId: string, updates: any) => {
    socket.emit('issue:update', { issueId, updates });
  }, [socket.emit]);

  const checkInGuest = useCallback((guestId: string, tableConfirmed?: boolean, mealServed?: boolean) => {
    socket.emit('guest:checkin', { guestId, tableConfirmed, mealServed });
  }, [socket.emit]);

  const updateWeather = useCallback((weatherData: any) => {
    socket.emit('weather:update', weatherData);
  }, [socket.emit]);

  const updatePresence = useCallback((location: string, activity: string) => {
    socket.emit('presence:update', { location, activity });
  }, [socket.emit]);

  return {
    ...socket,
    updateTimeline,
    checkInVendor,
    createIssue,
    updateIssue,
    checkInGuest,
    updateWeather,
    updatePresence,
  };
}

// Specialized hook for Seating Planner
export function useSeatingWebSocket(layoutId: string) {
  const socket = useWebSocket({
    namespace: '/seating',
    query: { layoutId },
  });

  const createTable = useCallback((tableData: any) => {
    socket.emit('table:create', tableData);
  }, [socket.emit]);

  const moveTable = useCallback((tableId: string, x: number, y: number) => {
    socket.emit('table:move', { tableId, x, y });
  }, [socket.emit]);

  const updateTable = useCallback((tableId: string, updates: any) => {
    socket.emit('table:update', { tableId, ...updates });
  }, [socket.emit]);

  const deleteTable = useCallback((tableId: string) => {
    socket.emit('table:delete', { tableId });
  }, [socket.emit]);

  const assignGuest = useCallback((guestId: string, tableId: string, seatNumber?: number) => {
    socket.emit('guest:assign', { guestId, tableId, seatNumber });
  }, [socket.emit]);

  const unassignGuest = useCallback((guestId: string) => {
    socket.emit('guest:unassign', { guestId });
  }, [socket.emit]);

  const swapGuests = useCallback((guestId1: string, guestId2: string) => {
    socket.emit('guests:swap', { guestId1, guestId2 });
  }, [socket.emit]);

  const moveCursor = useCallback((x: number, y: number) => {
    socket.emit('cursor:move', { x, y });
  }, [socket.emit]);

  return {
    ...socket,
    createTable,
    moveTable,
    updateTable,
    deleteTable,
    assignGuest,
    unassignGuest,
    swapGuests,
    moveCursor,
  };
}