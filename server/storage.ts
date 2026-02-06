import { type Room, type Player, type InsertRoom, type InsertPlayer, type ChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Room management
  createRoom(room: InsertRoom): Promise<Room>;
  getRoom(roomId: string): Promise<Room | undefined>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  updateRoom(roomId: string, updates: Partial<Room>): Promise<Room | undefined>;
  deleteRoom(roomId: string): Promise<boolean>;

  // Player management
  addPlayerToRoom(roomId: string, player: InsertPlayer): Promise<Player | undefined>;
  updatePlayer(roomId: string, playerId: string, updates: Partial<Player>): Promise<Player | undefined>;
  removePlayerFromRoom(roomId: string, playerId: string): Promise<boolean>;

  // Chat management
  addChatMessage(roomId: string, message: ChatMessage): Promise<ChatMessage>;
  getChatMessages(roomId: string): Promise<ChatMessage[]>;

  // Game state management
  startGame(roomId: string): Promise<boolean>;
  updateGameState(roomId: string, gameState: any): Promise<boolean>;

  // Room persistence management
  setRoomExpiration(roomId: string, hoursFromNow: number): Promise<boolean>;
  cleanupExpiredRooms(): Promise<number>;
  isRoomExpired(roomId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room>;
  private roomCodes: Map<string, string>; // code -> roomId mapping
  private chatMessages: Map<string, ChatMessage[]>;

  constructor() {
    this.rooms = new Map();
    this.roomCodes = new Map();
    this.chatMessages = new Map();
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const roomId = randomUUID();
    const code = this.generateRoomCode();
    
    const room: Room = {
      ...insertRoom,
      id: roomId,
      code,
      players: [],
      gameState: "waiting",
      currentPlayerIndex: 0,
      turnNumber: 1,
      startMoney: insertRoom.startMoney ?? 15000,
      createdAt: new Date(),
      isExpired: false,
    };

    this.rooms.set(roomId, room);
    this.roomCodes.set(code, roomId);
    this.chatMessages.set(roomId, []);
    return room;
  }

  async getRoom(roomId: string): Promise<Room | undefined> {
    return this.rooms.get(roomId);
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    const roomId = this.roomCodes.get(code.toUpperCase());
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<Room | undefined> {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const updatedRoom = { ...room, ...updates };
    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(roomId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    this.rooms.delete(roomId);
    this.roomCodes.delete(room.code);
    this.chatMessages.delete(roomId);
    return true;
  }

  async addPlayerToRoom(roomId: string, insertPlayer: InsertPlayer): Promise<Player | undefined> {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length >= room.maxPlayers) return undefined;

    const playerId = `${insertPlayer.name}-${Date.now()}`;
    const player: Player = {
      ...insertPlayer,
      id: playerId,
      money: room.startMoney,
      position: 0,
      isInJail: false,
      jailTurns: 0,
      properties: [],
      hotelProperties: [],
      mortgagedProperties: [],
      buildingLevels: {},
      consecutiveDoubles: 0,
      pendingDoubleDecision: false,
      isReady: false,
      isConnected: true,
      hasRolledThisTurn: false,
      isEliminated: false,
    };

    room.players.push(player);
    this.rooms.set(roomId, room);
    return player;
  }

  async updatePlayer(roomId: string, playerId: string, updates: Partial<Player>): Promise<Player | undefined> {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return undefined;

    room.players[playerIndex] = { ...room.players[playerIndex], ...updates };
    this.rooms.set(roomId, room);
    return room.players[playerIndex];
  }

  async removePlayer(roomId: string, playerId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return false;

    // Remove the player
    room.players.splice(playerIndex, 1);
    
    this.rooms.set(roomId, room);
    return true;
  }

  async removePlayerFromRoom(roomId: string, playerId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return false;

    room.players.splice(playerIndex, 1);
    
    // If host left and there are other players, make the first player the new host
    if (room.hostId === playerId && room.players.length > 0) {
      room.hostId = room.players[0].id;
    }

    this.rooms.set(roomId, room);
    return true;
  }

  async addChatMessage(roomId: string, message: ChatMessage): Promise<ChatMessage> {
    const messages = this.chatMessages.get(roomId) || [];
    messages.push(message);
    this.chatMessages.set(roomId, messages);
    return message;
  }

  async getChatMessages(roomId: string): Promise<ChatMessage[]> {
    return this.chatMessages.get(roomId) || [];
  }

  async startGame(roomId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room || room.gameState !== "waiting") return false;

    room.gameState = "playing";
    room.currentPlayerIndex = Math.floor(Math.random() * room.players.length);
    room.turnNumber = 1;

    // Reset all players to start position
    room.players.forEach(player => {
      player.position = 0;
      player.money = room.startMoney;
      player.properties = [];
      player.hotelProperties = [];
      player.mortgagedProperties = [];
      player.isInJail = false;
      player.jailTurns = 0;
      player.buildingLevels = {};
      player.consecutiveDoubles = 0;
      player.pendingDoubleDecision = false;
      player.hasRolledThisTurn = false;
      player.isEliminated = false;
      delete player.eliminatedAt;
      delete player.eliminationOrder;
    });

    this.rooms.set(roomId, room);
    return true;
  }

  async updateGameState(roomId: string, gameState: any): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    Object.assign(room, gameState);
    this.rooms.set(roomId, room);
    return true;
  }

  async setRoomExpiration(roomId: string, hoursFromNow: number): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hoursFromNow);
    
    room.expiresAt = expiresAt;
    this.rooms.set(roomId, room);
    return true;
  }

  async cleanupExpiredRooms(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;
    const roomsToDelete: string[] = [];

    this.rooms.forEach((room, roomId) => {
      if (room.expiresAt && now > room.expiresAt) {
        roomsToDelete.push(roomId);
      }
    });

    roomsToDelete.forEach(roomId => {
      const room = this.rooms.get(roomId);
      if (room) {
        this.rooms.delete(roomId);
        this.roomCodes.delete(room.code);
        this.chatMessages.delete(roomId);
        cleanedCount++;
      }
    });

    return cleanedCount;
  }

  async isRoomExpired(roomId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return true;

    if (room.expiresAt && new Date() > room.expiresAt) {
      room.isExpired = true;
      this.rooms.set(roomId, room);
      return true;
    }

    return false;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure uniqueness
    if (this.roomCodes.has(result)) {
      return this.generateRoomCode();
    }
    return result;
  }
}

export const storage = new MemStorage();
