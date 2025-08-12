import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface UseWebSocketOptions {
  namespace: 'seating' | 'day-of-dashboard';
  roomId: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  autoReconnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  reconnectCount: number;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    namespace,
    roomId,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 5000
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    reconnectCount: 0
  });

  // Initialize WebSocket connection
  const connect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, connecting: true, error: null }));

      // Get WebSocket authentication token
      const response = await fetch('/api/ws/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namespace, roomId })
      });

      if (!response.ok) {
        throw new Error('Failed to initialize WebSocket connection');
      }

      const { token, url } = await response.json();

      // Create socket connection
      const socket = io(`${url}/${namespace}`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: autoReconnect,
        reconnectionAttempts: reconnectAttempts,
        reconnectionDelay: reconnectDelay
      });

      // Set up event listeners
      socket.on('connect', () => {
        console.log(`Connected to ${namespace} WebSocket`);
        setState(prev => ({ 
          ...prev, 
          connected: true, 
          connecting: false,
          reconnectCount: 0 
        }));
        onConnect?.();
      });

      socket.on('disconnect', (reason) => {
        console.log(`Disconnected from ${namespace} WebSocket:`, reason);
        setState(prev => ({ ...prev, connected: false }));
        onDisconnect?.();

        // Handle manual reconnection if needed
        if (reason === 'io server disconnect' && autoReconnect) {
          attemptReconnect();
        }
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setState(prev => ({ 
          ...prev, 
          connecting: false, 
          error: new Error(error.message) 
        }));
        onError?.(error);
      });

      socket.on('error', (data) => {
        console.error('WebSocket error:', data);
        toast.error(data.message || 'WebSocket error occurred');
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setState(prev => ({ 
        ...prev, 
        connecting: false, 
        error: error as Error 
      }));
      onError?.(error as Error);

      if (autoReconnect && state.reconnectCount < reconnectAttempts) {
        attemptReconnect();
      }
    }
  }, [namespace, roomId, onConnect, onDisconnect, onError, autoReconnect, reconnectAttempts, reconnectDelay, state.reconnectCount]);

  // Attempt to reconnect
  const attemptReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setState(prev => ({ ...prev, reconnectCount: prev.reconnectCount + 1 }));

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect (${state.reconnectCount + 1}/${reconnectAttempts})`);
      connect();
    }, reconnectDelay);
  }, [connect, reconnectDelay, reconnectAttempts, state.reconnectCount]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setState({
      connected: false,
      connecting: false,
      error: null,
      reconnectCount: 0
    });
  }, []);

  // Emit event
  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current?.connected) {
      console.warn('Cannot emit event: WebSocket not connected');
      return;
    }

    socketRef.current.emit(event, data);
  }, []);

  // Subscribe to event
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (!socketRef.current) {
      console.warn('Cannot subscribe to event: WebSocket not initialized');
      return () => {};
    }

    socketRef.current.on(event, handler);

    // Return unsubscribe function
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  // Subscribe to event (once)
  const once = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (!socketRef.current) {
      console.warn('Cannot subscribe to event: WebSocket not initialized');
      return () => {};
    }

    socketRef.current.once(event, handler);

    // Return unsubscribe function
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
    reconnectCount: state.reconnectCount,
    
    // Methods
    connect,
    disconnect,
    emit,
    on,
    once,
    
    // Socket instance (for advanced usage)
    socket: socketRef.current
  };
}