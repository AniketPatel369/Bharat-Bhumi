import { z } from "zod";

// Player related schemas
export const insertPlayerSchema = z.object({
  name: z.string().min(1).max(20),
  color: z.string(),
  avatar: z.string(),
});

export const playerSchema = insertPlayerSchema.extend({
  id: z.string(),
  money: z.number().default(15000),
  position: z.number().default(0),
  isInJail: z.boolean().default(false),
  jailTurns: z.number().default(0),
  properties: z.array(z.number()).default([]),
  hotelProperties: z.array(z.number()).default([]),
  mortgagedProperties: z.array(z.number()).default([]),
  buildingLevels: z.record(z.string(), z.number()).default({}),
  consecutiveDoubles: z.number().default(0),
  pendingDoubleDecision: z.boolean().default(false),
  isReady: z.boolean().default(false),
  isConnected: z.boolean().default(true),
  hasRolledThisTurn: z.boolean().default(false),
  isEliminated: z.boolean().default(false),
  eliminatedAt: z.date().optional(),
  eliminationOrder: z.number().optional(),
});

// Room related schemas
export const insertRoomSchema = z.object({
  hostId: z.string(),
  maxPlayers: z.number().min(2).max(8).default(8),
  startMoney: z.number().min(5000).max(50000).default(15000),
});

export const roomSchema = insertRoomSchema.extend({
  id: z.string(),
  code: z.string(),
  players: z.array(playerSchema).default([]),
  gameState: z.enum(["waiting", "playing", "finished"]).default("waiting"),
  currentPlayerIndex: z.number().default(0),
  turnNumber: z.number().default(1),
  createdAt: z.date().default(() => new Date()),
  expiresAt: z.date().optional(),
  isExpired: z.boolean().default(false),
});

// Game action schemas
export const diceRollSchema = z.object({
  playerId: z.string(),
  dice1: z.number().min(1).max(6),
  dice2: z.number().min(1).max(6),
});

export const propertyPurchaseSchema = z.object({
  playerId: z.string(),
  propertyIndex: z.number(),
  price: z.number(),
});

export const rentPaymentSchema = z.object({
  payerId: z.string(),
  receiverId: z.string(),
  propertyIndex: z.number(),
  amount: z.number(),
});

export const chatMessageSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  message: z.string().min(1).max(500),
  timestamp: z.date().default(() => new Date()),
});

export const gamePropertySchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(["property", "utility", "railroad", "special"]),
  price: z.number().optional(),
  rent: z.array(z.number()).optional(),
  colorGroup: z.string().optional(),
  houseCost: z.number().optional(),
  owner: z.string().optional(),
  houses: z.number().default(0),
  mortgaged: z.boolean().default(false),
});

// Type exports
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = z.infer<typeof playerSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = z.infer<typeof roomSchema>;
export type DiceRoll = z.infer<typeof diceRollSchema>;
export type PropertyPurchase = z.infer<typeof propertyPurchaseSchema>;
export type RentPayment = z.infer<typeof rentPaymentSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type GameProperty = z.infer<typeof gamePropertySchema>;
