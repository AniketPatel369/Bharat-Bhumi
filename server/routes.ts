import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { IStorage } from './storage';

interface ExtendedWebSocket extends WebSocket {
  roomId?: string;
  playerId?: string;
}

export function setupRoutes(app: express.Application, storage: IStorage) {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Track connections
  const connections = new Map<string, ExtendedWebSocket>();
  const roomConnections = new Map<string, Set<string>>();

  const broadcastToRoom = (roomId: string, message: any, excludeConnectionId?: string) => {
    const roomClients = roomConnections.get(roomId);
    if (!roomClients) return;

    const messageStr = JSON.stringify(message);
    roomClients.forEach(connectionId => {
      if (connectionId === excludeConnectionId) return;
      
      const ws = connections.get(connectionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  };

  wss.on('connection', (ws: ExtendedWebSocket) => {
    const connectionId = Math.random().toString(36).substring(7);
    connections.set(connectionId, ws);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'createRoom':
            try {
              const { hostName, maxPlayers } = message;
              const room = await storage.createRoom(hostName);
              
              ws.roomId = room.id;
              ws.playerId = room.hostId;

              if (!roomConnections.has(room.id)) {
                roomConnections.set(room.id, new Set());
              }
              roomConnections.get(room.id)!.add(connectionId);

              ws.send(JSON.stringify({
                type: 'roomCreated',
                room,
                playerId: room.hostId
              }));
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

              const player = await storage.addPlayerToRoom(room.id, {
                name: playerName,
                color: '',
                avatar: playerName.charAt(0).toUpperCase()
              });
              
              if (!player) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Failed to join room'
                }));
                break;
              }

              ws.roomId = room.id;
              ws.playerId = player.id;

              if (!roomConnections.has(room.id)) {
                roomConnections.set(room.id, new Set());
              }
              roomConnections.get(room.id)!.add(connectionId);

              const updatedRoom = await storage.getRoom(room.id);
              
              ws.send(JSON.stringify({
                type: 'roomJoined',
                room: updatedRoom,
                playerId: player.id
              }));

              broadcastToRoom(room.id, {
                type: 'playerJoined',
                room: updatedRoom,
                player
              }, connectionId);

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

              const existingPlayer = room.players.find(p => p.id === playerId);
              if (!existingPlayer) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Player not found in room'
                }));
                break;
              }

              await storage.updatePlayer(room.id, playerId, { isConnected: true });
              
              ws.roomId = room.id;
              ws.playerId = playerId;

              if (!roomConnections.has(room.id)) {
                roomConnections.set(room.id, new Set());
              }
              roomConnections.get(room.id)!.add(connectionId);

              const updatedRoom = await storage.getRoom(room.id);
              
              ws.send(JSON.stringify({
                type: 'roomJoined',
                room: updatedRoom,
                playerId: playerId
              }));

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
              
              const kickedPlayerConnection = Array.from(connections.entries()).find(
                ([_, ws]) => ws.playerId === playerToKickId && ws.roomId === room.id
              );
              
              if (kickedPlayerConnection) {
                const [kickedConnectionId, kickedWs] = kickedPlayerConnection;
                
                kickedWs.send(JSON.stringify({
                  type: 'kicked',
                  message: 'You have been kicked from the room'
                }));
                
                connections.delete(kickedConnectionId);
                const roomClients = roomConnections.get(room.id);
                if (roomClients) {
                  roomClients.delete(kickedConnectionId);
                }
              }
              
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

              const allReady = room.players.every(p => p.isReady);
              const allHaveColors = room.players.every(p => p.color);
              if (!allReady || !allHaveColors || room.players.length < 2) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'All players must be ready with colors selected and minimum 2 players required'
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

              if (currentPlayer.hasRolledThisTurn) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'You have already rolled this turn. End your turn to continue.'
                }));
                break;
              }

              const dice1 = Math.floor(Math.random() * 6) + 1;
              const dice2 = Math.floor(Math.random() * 6) + 1;
              const total = dice1 + dice2;

              let newPosition = (currentPlayer.position + total) % 40;
              
              let passedStart = false;
              let newMoney = currentPlayer.money;
              if (currentPlayer.position + total >= 40) {
                passedStart = true;
                newMoney += 2000;
              }

              await storage.updatePlayer(ws.roomId, ws.playerId, {
                position: newPosition,
                money: newMoney,
                hasRolledThisTurn: true
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
              if (currentPlayer.id !== ws.playerId) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Not your turn'
                }));
                break;
              }

              await storage.updatePlayer(ws.roomId, ws.playerId, {
                hasRolledThisTurn: false
              });

              const nextPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
              const nextTurnNumber = nextPlayerIndex === 0 ? room.turnNumber + 1 : room.turnNumber;
              
              await storage.updateGameState(ws.roomId, {
                currentPlayerIndex: nextPlayerIndex,
                turnNumber: nextTurnNumber
              });

              const updatedRoom = await storage.getRoom(ws.roomId);
              broadcastToRoom(ws.roomId, {
                type: 'turnEnded',
                room: updatedRoom,
                previousPlayerId: ws.playerId,
                nextPlayerId: updatedRoom!.players[nextPlayerIndex].id
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
              if (!ws.roomId || !ws.playerId) break;

              const { propertyIndex, price } = message;
              const room = await storage.getRoom(ws.roomId);
              if (!room || room.gameState !== 'playing') break;

              const currentPlayer = room.players.find(p => p.id === ws.playerId);
              if (!currentPlayer || currentPlayer.money < price) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Insufficient funds'
                }));
                break;
              }

              const isOwned = room.players.some(p => p.properties.includes(propertyIndex));
              if (isOwned) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Property already owned'
                }));
                break;
              }

              await storage.updatePlayer(ws.roomId, ws.playerId, {
                money: currentPlayer.money - price,
                properties: [...currentPlayer.properties, propertyIndex]
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
              if (!ws.roomId || !ws.playerId) break;

              const { message: messageText } = message;
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

          default:
            console.log('Unknown message type:', message.type);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message'
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket disconnected');
      
      connections.delete(connectionId);
      
      if (ws.roomId) {
        const roomClients = roomConnections.get(ws.roomId);
        if (roomClients) {
          roomClients.delete(connectionId);
        }
        
        if (ws.playerId) {
          storage.updatePlayer(ws.roomId, ws.playerId, { isConnected: false }).catch(console.error);
          
          storage.getRoom(ws.roomId).then(room => {
            if (room && room.hostId === ws.playerId) {
              console.log(`Host disconnected from room ${room.code}, room will expire in 2 hours`);
              storage.setRoomExpiration(room.id, 2).catch(console.error);
              
              broadcastToRoom(ws.roomId!, {
                type: 'hostDisconnected',
                message: 'Host has disconnected. Room will expire in 2 hours.'
              }, connectionId);
            }
          }).catch(console.error);
        }
      }
    });
  });

  // HTTP Routes
  app.post('/api/rooms', async (req, res) => {
    try {
      const { hostId, maxPlayers } = req.body;
      const room = await storage.createRoom(hostId);
      res.json({ success: true, room });
    } catch (error) {
      console.error('Create room error:', error);
      res.status(500).json({ success: false, error: 'Failed to create room' });
    }
  });

  app.get('/api/rooms/:code', async (req, res) => {
    try {
      const room = await storage.getRoomByCode(req.params.code);
      if (!room) {
        return res.status(404).json({ success: false, error: 'Room not found' });
      }
      res.json({ success: true, room });
    } catch (error) {
      console.error('Get room error:', error);
      res.status(500).json({ success: false, error: 'Failed to get room' });
    }
  });

  return httpServer;
}