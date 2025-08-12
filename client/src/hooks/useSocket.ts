import { useEffect, useState, useRef } from 'react';

interface SocketState {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export const useSocket = () => {
  const [socketState, setSocketState] = useState<SocketState>({
    socket: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000;

  const connect = () => {
    if (socketState.isConnecting || socketState.isConnected) return;

    setSocketState(prev => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);

      ws.addEventListener('open', () => {
        console.log('WebSocket connected');
        reconnectAttempts.current = 0;
        setSocketState({
          socket: ws,
          isConnected: true,
          isConnecting: false,
          error: null,
        });
      });

      ws.addEventListener('close', (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setSocketState(prev => ({
          ...prev,
          socket: null,
          isConnected: false,
          isConnecting: false,
        }));

        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * Math.pow(2, reconnectAttempts.current - 1)); // Exponential backoff
        }
      });

      ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        setSocketState(prev => ({
          ...prev,
          error: 'Connection failed',
          isConnecting: false,
        }));
      });

      // Store the websocket reference for cleanup
      setSocketState(prev => ({
        ...prev,
        socket: ws,
      }));

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setSocketState(prev => ({
        ...prev,
        error: 'Failed to create connection',
        isConnecting: false,
      }));
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketState.socket) {
      socketState.socket.close(1000, 'Manual disconnect');
    }

    setSocketState({
      socket: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  };

  const sendMessage = (message: any) => {
    if (socketState.socket && socketState.isConnected) {
      socketState.socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    socket: socketState.socket,
    isConnected: socketState.isConnected,
    isConnecting: socketState.isConnecting,
    error: socketState.error,
    connect,
    disconnect,
    sendMessage,
  };
};
