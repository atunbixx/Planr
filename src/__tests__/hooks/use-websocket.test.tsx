import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from '@/hooks/use-websocket';
import io from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

// Mock fetch
global.fetch = jest.fn();

describe('useWebSocket', () => {
  let mockSocket: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock socket instance
    mockSocket = {
      connected: false,
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      once: jest.fn(),
      disconnect: jest.fn()
    };

    (io as jest.MockedFunction<typeof io>).mockReturnValue(mockSocket);

    // Mock fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'test-token',
        url: 'ws://localhost:3001'
      })
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize connection on mount', async () => {
    const { result } = renderHook(() => 
      useWebSocket({
        namespace: 'seating',
        roomId: 'room-123'
      })
    );

    expect(result.current.connecting).toBe(true);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/ws/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namespace: 'seating', roomId: 'room-123' })
      });
    });

    expect(io).toHaveBeenCalledWith('ws://localhost:3001/seating', {
      auth: { token: 'test-token' },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 5000
    });
  });

  it('should handle successful connection', async () => {
    const onConnect = jest.fn();
    const { result } = renderHook(() => 
      useWebSocket({
        namespace: 'seating',
        roomId: 'room-123',
        onConnect
      })
    );

    // Simulate connection event
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
    
    act(() => {
      mockSocket.connected = true;
      connectHandler?.();
    });

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
      expect(result.current.connecting).toBe(false);
      expect(onConnect).toHaveBeenCalled();
    });
  });

  it('should handle disconnection', async () => {
    const onDisconnect = jest.fn();
    const { result } = renderHook(() => 
      useWebSocket({
        namespace: 'seating',
        roomId: 'room-123',
        onDisconnect
      })
    );

    // First connect
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
    act(() => {
      mockSocket.connected = true;
      connectHandler?.();
    });

    // Then disconnect
    const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')?.[1];
    act(() => {
      mockSocket.connected = false;
      disconnectHandler?.('io server disconnect');
    });

    await waitFor(() => {
      expect(result.current.connected).toBe(false);
      expect(onDisconnect).toHaveBeenCalled();
    });
  });

  it('should handle connection errors', async () => {
    const onError = jest.fn();
    const { result } = renderHook(() => 
      useWebSocket({
        namespace: 'seating',
        roomId: 'room-123',
        onError
      })
    );

    const error = new Error('Connection failed');
    const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')?.[1];
    
    act(() => {
      errorHandler?.(error);
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(error);
      expect(result.current.connecting).toBe(false);
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it('should emit events when connected', () => {
    const { result } = renderHook(() => 
      useWebSocket({
        namespace: 'seating',
        roomId: 'room-123'
      })
    );

    // Connect first
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
    act(() => {
      mockSocket.connected = true;
      connectHandler?.();
    });

    // Emit event
    act(() => {
      result.current.emit('table:update', { tableId: 'table-1', x: 100, y: 200 });
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('table:update', {
      tableId: 'table-1',
      x: 100,
      y: 200
    });
  });

  it('should not emit events when disconnected', () => {
    const { result } = renderHook(() => 
      useWebSocket({
        namespace: 'seating',
        roomId: 'room-123'
      })
    );

    // Try to emit without connection
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    act(() => {
      result.current.emit('table:update', { tableId: 'table-1' });
    });

    expect(mockSocket.emit).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot emit event: WebSocket not connected');
    
    consoleWarnSpy.mockRestore();
  });

  it('should subscribe to events', () => {
    const { result } = renderHook(() => 
      useWebSocket({
        namespace: 'seating',
        roomId: 'room-123'
      })
    );

    const handler = jest.fn();
    
    act(() => {
      result.current.on('table:updated', handler);
    });

    expect(mockSocket.on).toHaveBeenCalledWith('table:updated', handler);
  });

  it('should unsubscribe from events', () => {
    const { result } = renderHook(() => 
      useWebSocket({
        namespace: 'seating',
        roomId: 'room-123'
      })
    );

    const handler = jest.fn();
    
    let unsubscribe: () => void;
    act(() => {
      unsubscribe = result.current.on('table:updated', handler);
    });

    act(() => {
      unsubscribe();
    });

    expect(mockSocket.off).toHaveBeenCalledWith('table:updated', handler);
  });

  it('should disconnect on unmount', () => {
    const { unmount } = renderHook(() => 
      useWebSocket({
        namespace: 'seating',
        roomId: 'room-123'
      })
    );

    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should handle reconnection attempts', async () => {
    const { result } = renderHook(() => 
      useWebSocket({
        namespace: 'seating',
        roomId: 'room-123',
        autoReconnect: true,
        reconnectAttempts: 3,
        reconnectDelay: 100
      })
    );

    // Simulate connection error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.reconnectCount).toBe(1);
    });
  });
});