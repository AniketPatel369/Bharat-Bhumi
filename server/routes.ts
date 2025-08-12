import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertRoomSchema, insertPlayerSchema, chatMessageSchema, playerSchema, roomSchema } from "@shared/schema";
import { z } from "zod";

interface ExtendedWebSocket extends WebSocket {
  playerId?: string;
  roomId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store WebSocket connections
  const connections = new Map<string, ExtendedWebSocket>();
  const roomConnections = new Map<string, Set<string>>();

  // Setup automatic room cleanup every 10 minutes
  setInterval(async () => {
    const cleanedCount = await storage.cleanupExpiredRooms();
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired rooms`);
    }
  }, 10 * 60 * 1000); // 10 minutes

  // Broadcast to all clients in a room
  function broadcastToRoom(roomId: string, message: any, excludeId?: string) {
    const roomClients = roomConnections.get(roomId);
    if (!roomClients) return;

    roomClients.forEach(clientId => {
      if (excludeId && clientId === excludeId) return;
      const ws = connections.get(clientId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  // WebSocket connection handling
  wss.on('connection', (ws: ExtendedWebSocket) => {
    const connectionId = Math.random().toString(36).substring(7);
    connections.set(connectionId, ws);

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'createRoom':
            try {
              const { hostName, maxPlayers = 8 } = message;
              const room = await storage.createRoom({ hostId: '', maxPlayers: maxPlayers });
              
              // Add host as first player (without color initially)
              const host = await storage.addPlayerToRoom(room.id, {
                name: hostName,
                color: '', // Will be set later in lobby
                avatar: hostName.charAt(0).toUpperCase()
              });

              if (host) {
                // Update room with correct host ID
                await storage.updateRoom(room.id, { hostId: host.id });
                
                // Set WebSocket properties
                ws.roomId = room.id;
                ws.playerId = host.id;

                // Add to room connections
                if (!roomConnections.has(room.id)) {
                  roomConnections.set(room.id, new Set());
                }
                roomConnections.get(room.id)!.add(connectionId);

                const updatedRoom = await storage.getRoom(room.id);
                ws.send(JSON.stringify({
                  type: 'roomCreated',
                  room: updatedRoom,
                  playerId: host.id
                }));
              }
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to create room'
              }));
            }
            break;

          case 'joinRoom':
            try {
              const { roomCode, playerName } = message;
              const room = await storage.getRoomByCode(roomCode);
              
              if (!room) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Room not found'
                }));
                break;
              }

              if (room.players.length >= room.maxPlayers) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Room is full'
                }));
                break;
              }

              if (room.gameState !== 'waiting') {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Game already in progress'
                }));
                break;
              }

              const player = await storage.addPlayerToRoom(room.id, {
                name: playerName,
                color: '', // Will be set later in lobby
                avatar: playerName.charAt(0).toUpperCase()
              });

              if (player) {
                ws.roomId = room.id;
                ws.playerId = player.id;

                // Add to room connections
                if (!roomConnections.has(room.id)) {
                  roomConnections.set(room.id, new Set());
                }
                roomConnections.get(room.id)!.add(connectionId);

                const updatedRoom = await storage.getRoom(room.id);
                
                // Send success to joining player
                ws.send(JSON.stringify({
                  type: 'roomJoined',
                  room: updatedRoom,
                  playerId: player.id
                }));

                // Broadcast player joined to room
                broadcastToRoom(room.id, {
                  type: 'playerJoined',
                  room: updatedRoom,
                  player
                }, connectionId);
              }
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to join room'
              }));
            }
            break;

          case 'rejoinRoom':
            try {
              const { roomCode, playerId } = message;
              const room = await storage.getRoomByCode(roomCode);
              
              if (!room) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Room not found'
                }));
                break;
              }

              // Check if player exists in room
              const existingPlayer = room.players.find(p => p.id === playerId);
              if (!existingPlayer) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Player not found in room'
                }));
                break;
              }

              // Update player connection status
              await storage.updatePlayer(room.id, playerId, { isConnected: true });
              
              // Set WebSocket properties
              ws.roomId = room.id;
              ws.playerId = playerId;

              // Add to room connections
              if (!roomConnections.has(room.id)) {
                roomConnections.set(room.id, new Set());
              }
              roomConnections.get(room.id)!.add(connectionId);

              const updatedRoom = await storage.getRoom(room.id);
              
              // Send room data to rejoining player
              ws.send(JSON.stringify({
                type: 'roomJoined',
                room: updatedRoom,
                playerId: playerId
              }));

              // Broadcast player reconnected to room
              broadcastToRoom(room.id, {
                type: 'playerJoined',
                room: updatedRoom,
                player: existingPlayer
              }, connectionId);

            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to rejoin room'
              }));
            }
            break;

          case 'changeColor':
            try {
              const { playerId, color } = message;
              if (!ws.roomId || !ws.playerId) break;
              
              // Check if color is already taken
              const room = await storage.getRoom(ws.roomId);
              if (room) {
                const colorTaken = room.players.some(p => p.id !== playerId && p.color === color);
                if (colorTaken) {
                  ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Color already taken by another player'
                  }));
                  break;
                }
                
                // Update player color
                await storage.updatePlayer(ws.roomId, playerId, { color });
                
                const updatedRoom = await storage.getRoom(ws.roomId);
                broadcastToRoom(ws.roomId, {
                  type: 'playerColorChanged',
                  room: updatedRoom,
                  playerId
                });
              }
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to change color'
              }));
            }
            break;

          case 'kickPlayer':
            try {
              const { hostId, playerToKickId } = message;
              const room = await storage.getRoom(ws.roomId!);
              
              if (!room || room.hostId !== hostId) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Only host can kick players'
                }));
                break;
              }
              
              // Find the kicked player's connection
              const kickedPlayerConnection = Array.from(connections.entries()).find(
                ([_, ws]) => ws.playerId === playerToKickId && ws.roomId === room.id
              );
              
              if (kickedPlayerConnection) {
                const [kickedConnectionId, kickedWs] = kickedPlayerConnection;
                
                // Send kick message to kicked player
                kickedWs.send(JSON.stringify({
                  type: 'kicked',
                  message: 'You have been kicked from the room'
                }));
                
                // Remove from connections
                connections.delete(kickedConnectionId);
                const roomClients = roomConnections.get(room.id);
                if (roomClients) {
                  roomClients.delete(kickedConnectionId);
                }
              }
              
              // Remove player from room
              await storage.removePlayer(ws.roomId!, playerToKickId);
              
              const updatedRoom = await storage.getRoom(ws.roomId!);
              broadcastToRoom(ws.roomId!, {
                type: 'playerKicked',
                room: updatedRoom,
                kickedPlayerId: playerToKickId
              });
              
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to kick player'
              }));
            }
            break;

          case 'playerReady':
            try {
              const { playerId, isReady } = message;
              if (!ws.roomId || !ws.playerId) break;

              await storage.updatePlayer(ws.roomId, ws.playerId, { isReady });
              const room = await storage.getRoom(ws.roomId);

              broadcastToRoom(ws.roomId, {
                type: 'playerReadyChanged',
                room,
                playerId: ws.playerId,
                isReady
              });
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to update ready status'
              }));
            }
            break;

          case 'startGame':
            try {
              if (!ws.roomId) break;

              const room = await storage.getRoom(ws.roomId);
              if (!room || room.hostId !== ws.playerId) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Only host can start the game'
                }));
                break;
              }

              // Check if all players are ready
              const allReady = room.players.every(p => p.isReady);
              if (!allReady || room.players.length < 2) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'All players must be ready and minimum 2 players required'
                }));
                break;
              }

              await storage.startGame(ws.roomId);
              const updatedRoom = await storage.getRoom(ws.roomId);

              broadcastToRoom(ws.roomId, {
                type: 'gameStarted',
                room: updatedRoom
              });
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to start game'
              }));
            }
            break;

          case 'rollDice':
            try {
              if (!ws.roomId || !ws.playerId) break;

              const room = await storage.getRoom(ws.roomId);
              if (!room || room.gameState !== 'playing') break;

              const currentPlayer = room.players[room.currentPlayerIndex];
              if (currentPlayer.id !== ws.playerId) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Not your turn'
                }));
                break;
              }

              // Generate dice roll
              const dice1 = Math.floor(Math.random() * 6) + 1;
              const dice2 = Math.floor(Math.random() * 6) + 1;
              const total = dice1 + dice2;

              // Calculate new position
              let newPosition = (currentPlayer.position + total) % 40;
              
              // Check if passed START (collect ₹2000)
              let passedStart = false;
              if (currentPlayer.position + total >= 40) {
                passedStart = true;
                await storage.updatePlayer(ws.roomId, ws.playerId, { 
                  money: currentPlayer.money + 2000 
                });
              }

              // Update player position
              await storage.updatePlayer(ws.roomId, ws.playerId, { 
                position: newPosition 
              });

              const updatedRoom = await storage.getRoom(ws.roomId);

              broadcastToRoom(ws.roomId, {
                type: 'diceRolled',
                room: updatedRoom,
                playerId: ws.playerId,
                dice1,
                dice2,
                total,
                newPosition,
                passedStart
              });

            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to roll dice'
              }));
            }
            break;

          case 'endTurn':
            try {
              if (!ws.roomId || !ws.playerId) break;

              const room = await storage.getRoom(ws.roomId);
              if (!room || room.gameState !== 'playing') break;

              const currentPlayer = room.players[room.currentPlayerIndex];
              if (currentPlayer.id !== ws.playerId) break;

              // Move to next player
              const nextPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
              await storage.updateRoom(ws.roomId, { 
                currentPlayerIndex: nextPlayerIndex,
                turnNumber: room.turnNumber + 1
              });

              const updatedRoom = await storage.getRoom(ws.roomId);

              broadcastToRoom(ws.roomId, {
                type: 'turnEnded',
                room: updatedRoom,
                nextPlayerId: room.players[nextPlayerIndex].id
              });

            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to end turn'
              }));
            }
            break;

          case 'buyProperty':
            try {
              const { propertyIndex, price } = message;
              if (!ws.roomId || !ws.playerId) break;

              const room = await storage.getRoom(ws.roomId);
              if (!room) break;

              const player = room.players.find(p => p.id === ws.playerId);
              if (!player || player.money < price) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Insufficient funds'
                }));
                break;
              }

              // Update player money and properties
              await storage.updatePlayer(ws.roomId, ws.playerId, {
                money: player.money - price,
                properties: [...player.properties, propertyIndex]
              });

              const updatedRoom = await storage.getRoom(ws.roomId);

              broadcastToRoom(ws.roomId, {
                type: 'propertyBought',
                room: updatedRoom,
                playerId: ws.playerId,
                propertyIndex,
                price
              });

            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to buy property'
              }));
            }
            break;

          case 'sendMessage':
            try {
              const { message: messageText } = message;
              if (!ws.roomId || !ws.playerId) break;

              const room = await storage.getRoom(ws.roomId);
              if (!room) break;

              const player = room.players.find(p => p.id === ws.playerId);
              if (!player) break;

              const chatMessage = {
                playerId: ws.playerId,
                playerName: player.name,
                message: messageText,
                timestamp: new Date()
              };

              await storage.addChatMessage(ws.roomId, chatMessage);

              broadcastToRoom(ws.roomId, {
                type: 'newMessage',
                message: chatMessage
              });

            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to send message'
              }));
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', async () => {
      connections.delete(connectionId);
      
      if (ws.roomId) {
        const roomClients = roomConnections.get(ws.roomId);
        if (roomClients) {
          roomClients.delete(connectionId);
          
          if (ws.playerId) {
            // Mark player as disconnected
            await storage.updatePlayer(ws.roomId, ws.playerId, { isConnected: false });
            
            const room = await storage.getRoom(ws.roomId);
            if (room) {
              // If host disconnected, set room to expire in 2 hours
              if (room.hostId === ws.playerId) {
                await storage.setRoomExpiration(ws.roomId, 2);
                console.log(`Host disconnected from room ${room.code}, room will expire in 2 hours`);
              }
              
              broadcastToRoom(ws.roomId, {
                type: 'playerDisconnected',
                room,
                playerId: ws.playerId
              });
            }
          }
        }
      }
    });
  });

  // REST API routes for room management
  app.post('/api/rooms', async (req, res) => {
    try {
      const { hostName } = req.body;
      const room = await storage.createRoom({ hostId: hostName, maxPlayers: 8 });
      res.json(room);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create room' });
    }
  });

  app.get('/api/rooms/:code', async (req, res) => {
    try {
      const room = await storage.getRoomByCode(req.params.code);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  return httpServer;
}
