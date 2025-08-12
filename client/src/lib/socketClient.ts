// Simple WebSocket client utility for the Vyapaar game
// This provides a lightweight wrapper around the native WebSocket API

export interface SocketMessage {
  type: string;
  [key: string]: any;
}

export interface SocketClientOptions {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: SocketMessage) => void;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export class SocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private options: SocketClientOptions;
  private reconnectCount = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManualClose = false;

  constructor(url?: string, options: SocketClientOptions = {}) {
    // Auto-detect WebSocket URL if not provided
    if (!url) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.url = `${protocol}//${window.location.host}/ws`;
    } else {
      this.url = url;
    }

    this.options = {
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      ...options,
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url);
        
        this.socket.addEventListener('open', () => {
          console.log('WebSocket connected to:', this.url);
          this.reconnectCount = 0;
          this.isManualClose = false;
          this.options.onOpen?.();
          resolve();
        });

        this.socket.addEventListener('close', (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.socket = null;
          this.options.onClose?.(event);

          // Auto-reconnect if not manual close and within retry limits
          if (!this.isManualClose && 
              this.reconnectCount < (this.options.reconnectAttempts || 5)) {
            this.scheduleReconnect();
          }
        });

        this.socket.addEventListener('error', (error) => {
          console.error('WebSocket error:', error);
          this.options.onError?.(error);
          reject(error);
        });

        this.socket.addEventListener('message', (event) => {
          try {
            const message: SocketMessage = JSON.parse(event.data);
            this.options.onMessage?.(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        });

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = (this.options.reconnectDelay || 1000) * Math.pow(2, this.reconnectCount);
    this.reconnectCount++;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectCount}/${this.options.reconnectAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // Reconnection failed, will try again if within limits
      });
    }, delay);
  }

  send(message: SocketMessage): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  close(): void {
    this.isManualClose = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
    }
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  get readyState(): number | undefined {
    return this.socket?.readyState;
  }
}

// Utility functions for common game messages
export const createRoomMessage = (hostName: string, hostColor: string, hostAvatar: string): SocketMessage => ({
  type: 'createRoom',
  hostName,
  hostColor,
  hostAvatar,
});

export const joinRoomMessage = (roomCode: string, playerName: string, playerColor: string, playerAvatar: string): SocketMessage => ({
  type: 'joinRoom',
  roomCode,
  playerName,
  playerColor,
  playerAvatar,
});

export const playerReadyMessage = (playerId: string, isReady: boolean): SocketMessage => ({
  type: 'playerReady',
  playerId,
  isReady,
});

export const startGameMessage = (): SocketMessage => ({
  type: 'startGame',
});

export const rollDiceMessage = (): SocketMessage => ({
  type: 'rollDice',
});

export const endTurnMessage = (): SocketMessage => ({
  type: 'endTurn',
});

export const buyPropertyMessage = (propertyIndex: number, price: number): SocketMessage => ({
  type: 'buyProperty',
  propertyIndex,
  price,
});

export const sendChatMessage = (message: string): SocketMessage => ({
  type: 'sendMessage',
  message,
});

// Export a default instance for convenience
export const defaultSocketClient = new SocketClient();
