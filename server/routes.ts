import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { IStorage } from './storage';
import { BOARD_DATA } from '@shared/boardData';

interface ExtendedWebSocket extends WebSocket {
  roomId?: string;
  playerId?: string;
}

interface RoomAuctionState {
  propertyIndex: number;
  sellerId: string;
  highestBid: number;
  highestBidderId?: string;
  bids: Record<string, number>;
  timeout: NodeJS.Timeout;
}

export function setupRoutes(app: express.Application, storage: IStorage) {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Track connections
  const connections = new Map<string, ExtendedWebSocket>();
  const roomConnections = new Map<string, Set<string>>();
  const rollTimers = new Map<string, NodeJS.Timeout>();
  const actionTimers = new Map<string, NodeJS.Timeout>();
  const roomAuctions = new Map<string, RoomAuctionState>();
  const turnTimerState = new Map<string, { phase: "roll" | "action"; endsAt: number }>();
  const HOTEL_COST = 2000;
  const START_PASS_REWARD = 2000;
  const JAIL_FINE = 500;
  const FREE_PARKING_FEE = 300;
  const MORTGAGE_INTEREST_RATE = 0.1;

  type CardEffect =
    | { kind: 'money'; text: string; amount: number }
    | { kind: 'move'; text: string; moveTo: number }
    | { kind: 'jail'; text: string; moveTo: number }
    | { kind: 'relativeMove'; text: string; steps: number }
    | { kind: 'nearestRailroad'; text: string }
    | { kind: 'nearestUtility'; text: string }
    | { kind: 'repairs'; text: string; perHouse: number; perHotel: number };

  const CHANCE_CARDS: CardEffect[] = [
    { kind: 'move', text: 'Advance to START (Gateway of India)', moveTo: 0 },
    { kind: 'move', text: 'Advance to Connaught Place', moveTo: 11 },
    { kind: 'move', text: 'Advance to MG Road', moveTo: 23 },
    { kind: 'move', text: 'Advance to Marine Drive', moveTo: 18 },
    { kind: 'nearestRailroad', text: 'Advance to nearest Railway Station. If owned, pay double rent.' },
    { kind: 'nearestRailroad', text: 'Advance to nearest Railway Station. If owned, pay double rent.' },
    { kind: 'nearestUtility', text: 'Advance to nearest Utility. If owned, pay 10x dice.' },
    { kind: 'money', text: 'Festival bonus: collect ₹300', amount: 300 },
    { kind: 'money', text: 'Speeding fine: pay ₹150', amount: -150 },
    { kind: 'money', text: 'Traffic challan: pay ₹100', amount: -100 },
    { kind: 'money', text: 'Dividend from PSU stocks: collect ₹250', amount: 250 },
    { kind: 'money', text: 'Loan matures: collect ₹500', amount: 500 },
    { kind: 'relativeMove', text: 'Go back 3 spaces', steps: -3 },
    { kind: 'jail', text: 'Go directly to Jail', moveTo: 10 },
    { kind: 'move', text: 'Take a ride to Chhatrapati Shivaji Terminus', moveTo: 15 },
    { kind: 'repairs', text: 'Pay for street repairs: ₹200 per house, ₹800 per hotel', perHouse: 200, perHotel: 800 },
  ];

  const COMMUNITY_CARDS: CardEffect[] = [
    { kind: 'money', text: 'Income tax refund: collect ₹400', amount: 400 },
    { kind: 'money', text: "Doctor's fee: pay ₹200", amount: -200 },
    { kind: 'money', text: 'Birthday celebration: collect ₹100 from bank', amount: 100 },
    { kind: 'money', text: 'Scholarship grant: collect ₹300', amount: 300 },
    { kind: 'money', text: 'Hospital charges: pay ₹300', amount: -300 },
    { kind: 'money', text: 'School fees: pay ₹250', amount: -250 },
    { kind: 'money', text: 'Festival gift from family: collect ₹200', amount: 200 },
    { kind: 'money', text: 'Bank error in your favour: collect ₹500', amount: 500 },
    { kind: 'money', text: 'Insurance matures: collect ₹350', amount: 350 },
    { kind: 'money', text: 'Service tax due: pay ₹150', amount: -150 },
    { kind: 'move', text: 'Advance to START (Gateway of India)', moveTo: 0 },
    { kind: 'move', text: 'You are assessed for city repairs: move to Nariman Point', moveTo: 16 },
    { kind: 'jail', text: 'Go directly to Jail', moveTo: 10 },
    { kind: 'relativeMove', text: 'Move forward 2 spaces', steps: 2 },
    { kind: 'relativeMove', text: 'Move back 2 spaces', steps: -2 },
    { kind: 'repairs', text: 'Pay maintenance: ₹150 per house, ₹700 per hotel', perHouse: 150, perHotel: 700 },
  ];

  const removeConnection = (connectionId: string, roomId?: string) => {
    connections.delete(connectionId);
    if (!roomId) return;
    const roomClients = roomConnections.get(roomId);
    if (!roomClients) return;
    roomClients.delete(connectionId);
    if (roomClients.size === 0) {
      roomConnections.delete(roomId);
    }
  };

  const broadcastToRoom = (roomId: string, message: any, excludeConnectionId?: string) => {
    const roomClients = roomConnections.get(roomId);
    if (!roomClients) return;

    const messageStr = JSON.stringify(message);
    const staleConnections: string[] = [];
    roomClients.forEach(connectionId => {
      if (connectionId === excludeConnectionId) return;
      
      const ws = connections.get(connectionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      } else {
        staleConnections.push(connectionId);
      }
    });
    staleConnections.forEach(connectionId => removeConnection(connectionId, roomId));
  };



  const sendTurnTimerState = (roomId: string) => {
    const timer = turnTimerState.get(roomId);
    if (!timer) {
      broadcastToRoom(roomId, {
        type: 'turnTimerUpdated',
        active: false,
        serverNow: Date.now(),
      });
      return;
    }

    broadcastToRoom(roomId, {
      type: 'turnTimerUpdated',
      active: true,
      phase: timer.phase,
      endsAt: timer.endsAt,
      serverNow: Date.now(),
    });
  };

  const clearTurnTimerState = (roomId: string) => {
    if (turnTimerState.delete(roomId)) {
      sendTurnTimerState(roomId);
    }
  };

  const getActivePlayers = (room: any) => room.players.filter((p: any) => !p.isEliminated);

  const findNextActivePlayerIndex = (room: any, fromIndex: number) => {
    if (!room.players.length) return -1;
    for (let i = 1; i <= room.players.length; i++) {
      const idx = (fromIndex + i) % room.players.length;
      if (!room.players[idx].isEliminated) return idx;
    }
    return -1;
  };

  const eliminatePlayerIfNeeded = async (roomId: string, playerId: string) => {
    const room = await storage.getRoom(roomId);
    if (!room) return { room, eliminated: false };

    const player = room.players.find(p => p.id === playerId);
    if (!player || player.isEliminated) return { room, eliminated: false };

    if (player.money > 0 || player.properties.length > 0) {
      return { room, eliminated: false };
    }

    const eliminatedCount = room.players.filter(p => p.isEliminated).length;
    await storage.updatePlayer(roomId, player.id, {
      isEliminated: true,
      eliminatedAt: new Date(),
      eliminationOrder: eliminatedCount + 1,
      isReady: false,
      hasRolledThisTurn: false,
      color: ''
    });

    const updatedRoom = await storage.getRoom(roomId);
    if (!updatedRoom) return { room: updatedRoom, eliminated: true };

    broadcastToRoom(roomId, {
      type: 'playerEliminated',
      room: updatedRoom,
      playerId: player.id,
      eliminationOrder: eliminatedCount + 1
    });

    const activePlayers = updatedRoom.players.filter(p => !p.isEliminated);
    const activePositivePlayers = activePlayers.filter(p => p.money > 0);
    if (activePlayers.length === 1 || activePositivePlayers.length === 1) {
      const winner = activePositivePlayers[0] || activePlayers[0];
      const standings = [...updatedRoom.players]
        .sort((a, b) => {
          if (!a.isEliminated && b.isEliminated) return -1;
          if (a.isEliminated && !b.isEliminated) return 1;
          if (!a.isEliminated && !b.isEliminated) return b.money - a.money;
          return (a.eliminationOrder || 999) - (b.eliminationOrder || 999);
        })
        .map((p, index) => ({
          playerId: p.id,
          name: p.name,
          rank: index + 1,
          eliminatedOrder: p.eliminationOrder ?? null,
          money: p.money
        }));

      await storage.updateGameState(roomId, { gameState: 'finished' });
      const finishedRoom = await storage.getRoom(roomId);

      broadcastToRoom(roomId, {
        type: 'gameEnded',
        room: finishedRoom,
        winnerId: winner.id,
        standings
      });
      clearTimer(rollTimers, roomId);
      clearTimer(actionTimers, roomId);
    }

    return { room: updatedRoom, eliminated: true };
  };

  const clearTimer = (timers: Map<string, NodeJS.Timeout>, roomId: string) => {
    const timer = timers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      timers.delete(roomId);
      if (!rollTimers.has(roomId) && !actionTimers.has(roomId)) {
        clearTurnTimerState(roomId);
      }
    }
  };

  const scheduleRollTimer = (roomId: string) => {
    clearTimer(rollTimers, roomId);
    clearTimer(actionTimers, roomId);
    const endsAt = Date.now() + 60_000;
    const timer = setTimeout(() => {
      autoRollAndEndTurn(roomId).catch(console.error);
    }, 60_000);
    rollTimers.set(roomId, timer);
    turnTimerState.set(roomId, { phase: 'roll', endsAt });
    sendTurnTimerState(roomId);
  };

  const scheduleActionTimer = (roomId: string) => {
    clearTimer(actionTimers, roomId);
    const endsAt = Date.now() + 120_000;
    const timer = setTimeout(() => {
      autoEndTurn(roomId, "actionTimeout").catch(console.error);
    }, 120_000);
    actionTimers.set(roomId, timer);
    turnTimerState.set(roomId, { phase: 'action', endsAt });
    sendTurnTimerState(roomId);
  };

  const autoEndTurn = async (roomId: string, reason: "actionTimeout" | "autoRoll") => {
    const room = await storage.getRoom(roomId);
    if (!room || room.gameState !== "playing") return;

    const currentPlayer = room.players[room.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isEliminated) return;
    await storage.updatePlayer(roomId, currentPlayer.id, { hasRolledThisTurn: false, hasBoughtPropertyThisTurn: false, consecutiveDoubles: 0, pendingDoubleDecision: false });

    const nextPlayerIndex = findNextActivePlayerIndex(room, room.currentPlayerIndex);
    if (nextPlayerIndex === -1) return;
    const nextTurnNumber = nextPlayerIndex <= room.currentPlayerIndex ? room.turnNumber + 1 : room.turnNumber;

    await storage.updateGameState(roomId, {
      currentPlayerIndex: nextPlayerIndex,
      turnNumber: nextTurnNumber
    });

    const updatedRoom = await storage.getRoom(roomId);
    broadcastToRoom(roomId, {
      type: "turnEnded",
      room: updatedRoom,
      previousPlayerId: currentPlayer.id,
      nextPlayerId: updatedRoom!.players[nextPlayerIndex].id,
      autoEnded: true,
      reason
    });

    scheduleRollTimer(roomId);
  };

  const getMonopolyPositions = (colorGroup?: string) => {
    if (!colorGroup) return [];
    return BOARD_DATA.filter(square => square.colorGroup === colorGroup && square.type === "property")
      .map(square => square.position);
  };

  const findNearestPosition = (start: number, type: 'railroad' | 'utility') => {
    const sorted = BOARD_DATA.filter(s => s.type === type).map(s => s.position).sort((a,b)=>a-b);
    for (const pos of sorted) {
      if (pos > start) return pos;
    }
    return sorted[0];
  };

  const applyLandingRent = async (
    roomId: string,
    room: any,
    playerId: string,
    position: number,
    diceTotal: number,
    playerMoney: number,
    rentOverrideMultiplier = 1,
    utilityOverrideMultiplier?: number,
  ) => {
    let rentAmount = 0;
    let rentOwnerId: string | null = null;
    let updatedMoney = playerMoney;

    const landedSquare = BOARD_DATA[position];
    if (!landedSquare || !['property', 'railroad', 'utility'].includes(landedSquare.type)) {
      return { updatedMoney, rentAmount, rentOwnerId };
    }

    const owner = room.players.find((player: any) => player.properties.includes(position));
    if (!owner || owner.id === playerId) {
      return { updatedMoney, rentAmount, rentOwnerId };
    }

    if (owner.mortgagedProperties?.includes(position)) {
      return { updatedMoney, rentAmount, rentOwnerId };
    }

    if (landedSquare.type === 'property' && landedSquare.rent) {
      const monopolyPositions = getMonopolyPositions(landedSquare.colorGroup);
      const hasMonopoly = monopolyPositions.length > 0 && monopolyPositions.every(p => owner.properties.includes(p));
      const hasHotel = owner.hotelProperties?.includes(position);
      const houses = Number(owner.buildingLevels?.[String(position)] || 0);
      if (hasHotel) {
        rentAmount = landedSquare.rent[Math.min(5, landedSquare.rent.length - 1)];
      } else if (houses > 0) {
        rentAmount = landedSquare.rent[Math.min(houses, landedSquare.rent.length - 1)];
      } else {
        rentAmount = hasMonopoly ? landedSquare.rent[0] * 2 : landedSquare.rent[0];
      }
    } else if (landedSquare.type === 'railroad' && landedSquare.rent) {
      const ownedRailroads = owner.properties.filter((p: number) => BOARD_DATA[p]?.type === 'railroad').length;
      const rentIndex = Math.max(0, Math.min(ownedRailroads, landedSquare.rent.length) - 1);
      rentAmount = landedSquare.rent[rentIndex] * rentOverrideMultiplier;
    } else if (landedSquare.type === 'utility') {
      const ownedUtilities = owner.properties.filter((p: number) => BOARD_DATA[p]?.type === 'utility').length;
      const multiplier = utilityOverrideMultiplier ?? (ownedUtilities >= 2 ? 10 : 4);
      rentAmount = diceTotal * multiplier;
    }

    if (rentAmount > 0) {
      rentOwnerId = owner.id;
      updatedMoney -= rentAmount;
      await storage.updatePlayer(roomId, owner.id, {
        money: owner.money + rentAmount
      });
    }

    return { updatedMoney, rentAmount, rentOwnerId };
  };

  const resolveNonPropertyLanding = async (
    roomId: string,
    room: any,
    player: any,
    startPosition: number,
    position: number,
    diceTotal: number,
  ) => {
    const square = BOARD_DATA[position];
    let moneyDelta = 0;
    let finalPosition = position;
    let sentToJail = false;
    let cardText: string | null = null;
    let rentOverrideMultiplier = 1;
    let utilityOverrideMultiplier: number | undefined;

    if (!square) {
      return { moneyDelta, finalPosition, sentToJail, cardText, rentOverrideMultiplier, utilityOverrideMultiplier };
    }

    if (square.type === 'tax') {
      moneyDelta -= square.price || 0;
    }

    if (square.type === 'corner') {
      if (square.name === 'GO TO JAIL') {
        finalPosition = 10;
        sentToJail = true;
      } else if (square.name === 'FREE PARKING') {
        moneyDelta -= FREE_PARKING_FEE;
      }
    }

    if (square.type === 'chance' || square.type === 'community') {
      const deck = square.type === 'chance' ? CHANCE_CARDS : COMMUNITY_CARDS;
      const card = deck[Math.floor(Math.random() * deck.length)];
      cardText = card.text;
      if (card.kind === 'money') {
        moneyDelta += card.amount;
      } else if (card.kind === 'move') {
        if (card.moveTo === 0 && (startPosition > card.moveTo || finalPosition > card.moveTo)) {
          moneyDelta += START_PASS_REWARD;
        }
        finalPosition = card.moveTo;
      } else if (card.kind === 'jail') {
        finalPosition = 10;
        sentToJail = true;
      } else if (card.kind === 'relativeMove') {
        const nextPosition = (finalPosition + card.steps + 40) % 40;
        if (card.steps > 0 && finalPosition + card.steps >= 40) {
          moneyDelta += START_PASS_REWARD;
        }
        finalPosition = nextPosition;
      } else if (card.kind === 'nearestRailroad') {
        finalPosition = findNearestPosition(finalPosition, 'railroad');
        rentOverrideMultiplier = 2;
      } else if (card.kind === 'nearestUtility') {
        finalPosition = findNearestPosition(finalPosition, 'utility');
        utilityOverrideMultiplier = 10;
      } else if (card.kind === 'repairs') {
        const houses = Object.values(player.buildingLevels || {}).reduce((acc: number, c: any) => acc + Number(c || 0), 0);
        const hotels = (player.hotelProperties || []).length;
        moneyDelta -= houses * card.perHouse + hotels * card.perHotel;
      }
    }

    if (sentToJail) {
      await storage.updatePlayer(roomId, player.id, {
        position: 10,
        isInJail: true,
        jailTurns: 1,
      });
    }

    return { moneyDelta, finalPosition, sentToJail, cardText, rentOverrideMultiplier, utilityOverrideMultiplier };
  };

  const autoRollAndEndTurn = async (roomId: string) => {
    const room = await storage.getRoom(roomId);
    if (!room || room.gameState !== "playing") return;

    const currentPlayer = room.players[room.currentPlayerIndex];
    if (currentPlayer.hasRolledThisTurn) return;

    if (currentPlayer.isInJail && currentPlayer.jailTurns > 0) {
      await storage.updatePlayer(roomId, currentPlayer.id, {
        jailTurns: 0,
        hasRolledThisTurn: true,
      });
      broadcastToRoom(roomId, {
        type: 'turnSkippedJail',
        playerId: currentPlayer.id,
        room: await storage.getRoom(roomId),
      });
      clearTimer(rollTimers, roomId);
      clearTimer(actionTimers, roomId);
      await autoEndTurn(roomId, "autoRoll");
      return;
    }

    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;

    let newPosition = (currentPlayer.position + total) % 40;
    let passedStart = false;
    let newMoney = currentPlayer.money;
    if (currentPlayer.position + total >= 40) {
      passedStart = true;
      newMoney += START_PASS_REWARD;
    }

    const specialEffect = await resolveNonPropertyLanding(roomId, room, currentPlayer, currentPlayer.position, newPosition, total);
    newPosition = specialEffect.finalPosition;
    newMoney += specialEffect.moneyDelta;

    const refreshedRoomForRent = await storage.getRoom(roomId);
    const rentResult = await applyLandingRent(roomId, refreshedRoomForRent || room, currentPlayer.id, newPosition, total, newMoney, specialEffect.rentOverrideMultiplier, specialEffect.utilityOverrideMultiplier);

    await storage.updatePlayer(roomId, currentPlayer.id, {
      position: newPosition,
      money: rentResult.updatedMoney,
      hasRolledThisTurn: true,
      isInJail: specialEffect.sentToJail,
      jailTurns: specialEffect.sentToJail ? 1 : 0,
    });

    const updatedRoom = await storage.getRoom(roomId);
    broadcastToRoom(roomId, {
      type: "diceRolled",
      room: updatedRoom,
      playerId: currentPlayer.id,
      dice1,
      dice2,
      total,
      newPosition,
      passedStart,
      autoRolled: true,
      cardText: specialEffect.cardText,
      sentToJail: specialEffect.sentToJail
    });
    if (rentResult.rentAmount > 0 && rentResult.rentOwnerId) {
      broadcastToRoom(roomId, {
        type: 'rentPaid',
        room: updatedRoom,
        payerId: currentPlayer.id,
        ownerId: rentResult.rentOwnerId,
        amount: rentResult.rentAmount,
        propertyIndex: newPosition
      });
    }

    clearTimer(rollTimers, roomId);
    clearTimer(actionTimers, roomId);
    await autoEndTurn(roomId, "autoRoll");
  };


  const broadcastBankruptcyState = async (roomId: string) => {
    const room = await storage.getRoom(roomId);
    if (!room) return;

    room.players.forEach(player => {
      if (player.money <= 0) {
        broadcastToRoom(roomId, {
          type: 'bankruptcyState',
          playerId: player.id,
          money: player.money,
          properties: player.properties,
          room
        });
      }
    });
  };

  const finalizeAuction = async (roomId: string) => {
    const auction = roomAuctions.get(roomId);
    if (!auction) return;

    roomAuctions.delete(roomId);
    clearTimeout(auction.timeout);

    const room = await storage.getRoom(roomId);
    if (!room) return;

    const seller = room.players.find(p => p.id === auction.sellerId);
    if (!seller || !seller.properties.includes(auction.propertyIndex)) return;

    if (!auction.highestBidderId || auction.highestBid <= 0) {
      await storage.updatePlayer(roomId, seller.id, {
        properties: seller.properties.filter(p => p !== auction.propertyIndex)
      });

      const updatedRoom = await storage.getRoom(roomId);
      broadcastToRoom(roomId, {
        type: 'auctionEnded',
        room: updatedRoom,
        propertyIndex: auction.propertyIndex,
        winnerId: null,
        amount: 0
      });
      return;
    }

    const winner = room.players.find(p => p.id === auction.highestBidderId);
    if (!winner || winner.money < auction.highestBid) {
      await storage.updatePlayer(roomId, seller.id, {
        properties: seller.properties.filter(p => p !== auction.propertyIndex)
      });
      const updatedRoom = await storage.getRoom(roomId);
      broadcastToRoom(roomId, {
        type: 'auctionEnded',
        room: updatedRoom,
        propertyIndex: auction.propertyIndex,
        winnerId: null,
        amount: 0
      });
      return;
    }

    await storage.updatePlayer(roomId, seller.id, {
      money: seller.money + auction.highestBid,
      properties: seller.properties.filter(p => p !== auction.propertyIndex)
    });

    await storage.updatePlayer(roomId, winner.id, {
      money: winner.money - auction.highestBid,
      properties: [...winner.properties, auction.propertyIndex]
    });

    const updatedRoom = await storage.getRoom(roomId);
    broadcastToRoom(roomId, {
      type: 'auctionEnded',
      room: updatedRoom,
      propertyIndex: auction.propertyIndex,
      winnerId: winner.id,
      amount: auction.highestBid
    });
    await broadcastBankruptcyState(roomId);
    await eliminatePlayerIfNeeded(roomId, seller.id);
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
              const { hostName, maxPlayers, startMoney } = message;
              const room = await storage.createRoom({ 
                hostId: hostName, 
                maxPlayers: maxPlayers || 8,
                startMoney: Math.max(5000, Math.min(50000, Number(startMoney) || 15000)) 
              });
              
              // Add the host as the first player in the room
              const hostPlayer = await storage.addPlayerToRoom(room.id, {
                name: hostName,
                color: '',
                avatar: hostName.charAt(0).toUpperCase()
              });

              if (!hostPlayer) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Failed to add host to room'
                }));
                break;
              }
              
              // Update room to set the host ID to the actual player ID
              const updatedRoom = await storage.updateRoom(room.id, { hostId: hostPlayer.id });
              
              ws.roomId = room.id;
              ws.playerId = hostPlayer.id;

              if (!roomConnections.has(room.id)) {
                roomConnections.set(room.id, new Set());
              }
              roomConnections.get(room.id)!.add(connectionId);

              ws.send(JSON.stringify({
                type: 'roomCreated',
                room: updatedRoom || room,
                playerId: hostPlayer.id
              }));
            } catch (error) {
              console.error('Create room error:', error);
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

              const timer = turnTimerState.get(room.id);
              if (timer) {
                ws.send(JSON.stringify({
                  type: 'turnTimerUpdated',
                  active: true,
                  phase: timer.phase,
                  endsAt: timer.endsAt,
                  serverNow: Date.now(),
                }));
              }

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

              const timer = turnTimerState.get(room.id);
              if (timer) {
                ws.send(JSON.stringify({
                  type: 'turnTimerUpdated',
                  active: true,
                  phase: timer.phase,
                  endsAt: timer.endsAt,
                  serverNow: Date.now(),
                }));
              }

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

                kickedWs.close(1000, "kicked");
                removeConnection(kickedConnectionId, room.id);
              }
              
              await storage.removePlayerFromRoom(ws.roomId!, playerToKickId);
              
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
              scheduleRollTimer(ws.roomId);
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
              if (currentPlayer.isEliminated) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Current player is eliminated'
                }));
                break;
              }

              if (currentPlayer.id !== ws.playerId) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Not your turn'
                }));
                break;
              }

              if (currentPlayer.pendingDoubleDecision) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Choose whether to continue after the second double.'
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

              if (currentPlayer.isInJail && currentPlayer.jailTurns > 0) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: `You are in jail. Pay ₹${JAIL_FINE} to play this turn or skip the turn.`
                }));
                break;
              }

              const dice1 = Math.floor(Math.random() * 6) + 1;
              const dice2 = Math.floor(Math.random() * 6) + 1;
              const total = dice1 + dice2;
              const isDouble = dice1 === dice2;
              const nextDoubleCount = isDouble ? (currentPlayer.consecutiveDoubles || 0) + 1 : 0;

              let newPosition = (currentPlayer.position + total) % 40;
              let passedStart = false;
              let newMoney = currentPlayer.money;
              if (currentPlayer.position + total >= 40) {
                passedStart = true;
                newMoney += START_PASS_REWARD;
              }

              const specialEffect = await resolveNonPropertyLanding(ws.roomId, room, currentPlayer, currentPlayer.position, newPosition, total);
              newPosition = specialEffect.finalPosition;
              newMoney += specialEffect.moneyDelta;

              const refreshedRoomForRent = await storage.getRoom(ws.roomId);
              const rentResult = await applyLandingRent(ws.roomId, refreshedRoomForRent || room, ws.playerId, newPosition, total, newMoney, specialEffect.rentOverrideMultiplier, specialEffect.utilityOverrideMultiplier);

              const goJailByTripleDouble = isDouble && nextDoubleCount >= 3;
              await storage.updatePlayer(ws.roomId, ws.playerId, {
                position: goJailByTripleDouble ? 10 : newPosition,
                money: rentResult.updatedMoney,
                hasRolledThisTurn: true,
                isInJail: specialEffect.sentToJail || goJailByTripleDouble,
                jailTurns: specialEffect.sentToJail || goJailByTripleDouble ? 1 : 0,
                consecutiveDoubles: goJailByTripleDouble ? 0 : nextDoubleCount,
                pendingDoubleDecision: isDouble && nextDoubleCount === 2
              });

              const updatedRoom = await storage.getRoom(ws.roomId);
              broadcastToRoom(ws.roomId, {
                type: 'diceRolled',
                room: updatedRoom,
                playerId: ws.playerId,
                dice1,
                dice2,
                total,
                newPosition: goJailByTripleDouble ? 10 : newPosition,
                passedStart,
                cardText: specialEffect.cardText,
                sentToJail: specialEffect.sentToJail || goJailByTripleDouble,
                pendingDoubleDecision: isDouble && nextDoubleCount === 2,
                extraTurnGranted: isDouble && nextDoubleCount === 1
              });
              if (rentResult.rentAmount > 0 && rentResult.rentOwnerId) {
                broadcastToRoom(ws.roomId, {
                  type: 'rentPaid',
                  room: updatedRoom,
                  payerId: ws.playerId,
                  ownerId: rentResult.rentOwnerId,
                  amount: rentResult.rentAmount,
                  propertyIndex: newPosition
                });
              }
              await broadcastBankruptcyState(ws.roomId);
              await eliminatePlayerIfNeeded(ws.roomId, ws.playerId);
              clearTimer(rollTimers, ws.roomId);

              if (goJailByTripleDouble) {
                await autoEndTurn(ws.roomId, 'actionTimeout');
              } else if (isDouble && nextDoubleCount === 1) {
                await storage.updatePlayer(ws.roomId, ws.playerId, { hasRolledThisTurn: false, hasBoughtPropertyThisTurn: false });
                scheduleRollTimer(ws.roomId);
              } else {
                scheduleActionTimer(ws.roomId);
              }

            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to roll dice'
              }));
            }
            break;

          case 'chooseDoubleTurn':
            try {
              if (!ws.roomId || !ws.playerId) break;
              const { continueTurn } = message;
              const room = await storage.getRoom(ws.roomId);
              if (!room || room.gameState !== 'playing') break;

              const currentPlayer = room.players[room.currentPlayerIndex];
              if (!currentPlayer || currentPlayer.id !== ws.playerId) {
                ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }));
                break;
              }

              if (!currentPlayer.pendingDoubleDecision) {
                ws.send(JSON.stringify({ type: 'error', message: 'No pending double decision' }));
                break;
              }

              if (continueTurn) {
                await storage.updatePlayer(ws.roomId, ws.playerId, {
                  hasRolledThisTurn: false,
                  pendingDoubleDecision: false
                });
                const updatedRoom = await storage.getRoom(ws.roomId);
                broadcastToRoom(ws.roomId, { type: 'doubleDecisionTaken', room: updatedRoom, playerId: ws.playerId, continueTurn: true });
                scheduleRollTimer(ws.roomId);
              } else {
                await storage.updatePlayer(ws.roomId, ws.playerId, {
                  pendingDoubleDecision: false,
                  hasRolledThisTurn: true
                });
                const updatedRoom = await storage.getRoom(ws.roomId);
                broadcastToRoom(ws.roomId, { type: 'doubleDecisionTaken', room: updatedRoom, playerId: ws.playerId, continueTurn: false });
                await autoEndTurn(ws.roomId, 'actionTimeout');
              }
            } catch (error) {
              ws.send(JSON.stringify({ type: 'error', message: 'Failed to process double decision' }));
            }
            break;


          case 'endTurn':
            try {
              if (!ws.roomId || !ws.playerId) break;

              const room = await storage.getRoom(ws.roomId);
              if (!room || room.gameState !== 'playing') break;

              const currentPlayer = room.players[room.currentPlayerIndex];
              if (currentPlayer.isEliminated) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Current player is eliminated'
                }));
                break;
              }

              if (currentPlayer.id !== ws.playerId) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Not your turn'
                }));
                break;
              }

              if (!currentPlayer.hasRolledThisTurn) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'You must roll the dice before ending your turn'
                }));
                break;
              }

              clearTimer(actionTimers, ws.roomId);

              await storage.updatePlayer(ws.roomId, ws.playerId, {
                hasRolledThisTurn: false,
                hasBoughtPropertyThisTurn: false,
                consecutiveDoubles: 0,
                pendingDoubleDecision: false
              });

              const nextPlayerIndex = findNextActivePlayerIndex(room, room.currentPlayerIndex);
              if (nextPlayerIndex === -1) {
                break;
              }

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
              scheduleRollTimer(ws.roomId);

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

              const currentPlayer = room.players[room.currentPlayerIndex];
              if (currentPlayer.isEliminated) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Current player is eliminated'
                }));
                break;
              }

              if (currentPlayer.id !== ws.playerId) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Not your turn'
                }));
                break;
              }

              const activePlayer = room.players.find(p => p.id === ws.playerId);
              if (!activePlayer) {
                ws.send(JSON.stringify({ type: 'error', message: 'Player not found' }));
                break;
              }

              if (!activePlayer.hasRolledThisTurn) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Roll the dice first before buying a property'
                }));
                break;
              }

              if (activePlayer.hasBoughtPropertyThisTurn) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'You can buy only one property per turn'
                }));
                break;
              }

              if (activePlayer.position !== propertyIndex) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'You can only buy the property where your token landed'
                }));
                break;
              }

              const boardSquare = BOARD_DATA[propertyIndex];
              if (!boardSquare || (boardSquare.type !== 'property' && boardSquare.type !== 'railroad' && boardSquare.type !== 'utility')) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'This space cannot be purchased'
                }));
                break;
              }

              const expectedPrice = boardSquare.price ?? 0;
              if (!expectedPrice || Number(price) !== expectedPrice) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Invalid property price for this space'
                }));
                break;
              }

              if (activePlayer.money < expectedPrice) {
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
                money: activePlayer.money - expectedPrice,
                properties: [...activePlayer.properties, propertyIndex],
                hasBoughtPropertyThisTurn: true,
              });

              const updatedRoom = await storage.getRoom(ws.roomId);
              broadcastToRoom(ws.roomId, {
                type: 'propertyBought',
                room: updatedRoom,
                playerId: ws.playerId,
                propertyIndex,
                price: expectedPrice
              });

            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to buy property'
              }));
            }
            break;


          case 'sellPropertyToBank':
            try {
              if (!ws.roomId || !ws.playerId) break;

              const { propertyIndex } = message;
              const room = await storage.getRoom(ws.roomId);
              if (!room || room.gameState !== 'playing') break;

              const player = room.players.find(p => p.id === ws.playerId);
              if (!player || !player.properties.includes(propertyIndex)) {
                ws.send(JSON.stringify({ type: 'error', message: 'Property not owned by player' }));
                break;
              }

              if (player.money > 0) {
                ws.send(JSON.stringify({ type: 'error', message: 'Bankruptcy actions are only available at zero or negative balance' }));
                break;
              }

              const square = BOARD_DATA[propertyIndex];
              const bankValue = square?.mortgageValue ?? Math.floor((square?.price ?? 0) / 2);

              await storage.updatePlayer(ws.roomId, ws.playerId, {
                money: player.money + bankValue,
                properties: player.properties.filter(p => p !== propertyIndex)
              });

              const updatedRoom = await storage.getRoom(ws.roomId);
              broadcastToRoom(ws.roomId, {
                type: 'propertySoldToBank',
                room: updatedRoom,
                playerId: ws.playerId,
                propertyIndex,
                amount: bankValue
              });
              await broadcastBankruptcyState(ws.roomId);
              await eliminatePlayerIfNeeded(ws.roomId, ws.playerId);
            } catch (error) {
              ws.send(JSON.stringify({ type: 'error', message: 'Failed to sell property to bank' }));
            }
            break;

          case 'startPropertyAuction':
            try {
              if (!ws.roomId || !ws.playerId) break;
              const { propertyIndex, startingBid } = message;
              const room = await storage.getRoom(ws.roomId);
              if (!room || room.gameState !== 'playing') break;

              const seller = room.players.find(p => p.id === ws.playerId);
              if (!seller || !seller.properties.includes(propertyIndex)) {
                ws.send(JSON.stringify({ type: 'error', message: 'Property not owned by player' }));
                break;
              }

              if (seller.money > 0) {
                ws.send(JSON.stringify({ type: 'error', message: 'Bankruptcy actions are only available at zero or negative balance' }));
                break;
              }

              const existing = roomAuctions.get(ws.roomId);
              if (existing) {
                ws.send(JSON.stringify({ type: 'error', message: 'Auction already in progress' }));
                break;
              }

              const minBid = Math.max(100, Number(startingBid || 100));
              const timeout = setTimeout(() => {
                finalizeAuction(ws.roomId!).catch(console.error);
              }, 30_000);

              roomAuctions.set(ws.roomId, {
                propertyIndex,
                sellerId: ws.playerId,
                highestBid: minBid,
                bids: {},
                timeout,
              });

              broadcastToRoom(ws.roomId, {
                type: 'auctionStarted',
                propertyIndex,
                sellerId: ws.playerId,
                highestBid: minBid
              });
            } catch (error) {
              ws.send(JSON.stringify({ type: 'error', message: 'Failed to start auction' }));
            }
            break;

          case 'placeAuctionBid':
            try {
              if (!ws.roomId || !ws.playerId) break;
              const { bidAmount } = message;

              const auction = roomAuctions.get(ws.roomId);
              if (!auction) {
                ws.send(JSON.stringify({ type: 'error', message: 'No active auction' }));
                break;
              }

              if (auction.sellerId === ws.playerId) {
                ws.send(JSON.stringify({ type: 'error', message: 'Seller cannot bid in own auction' }));
                break;
              }

              const room = await storage.getRoom(ws.roomId);
              if (!room) break;
              const bidder = room.players.find(p => p.id === ws.playerId);
              if (!bidder) break;

              const amount = Number(bidAmount);
              if (!Number.isFinite(amount) || amount <= auction.highestBid) {
                ws.send(JSON.stringify({ type: 'error', message: 'Bid must be higher than current bid' }));
                break;
              }

              if (bidder.money < amount) {
                ws.send(JSON.stringify({ type: 'error', message: 'Insufficient funds for bid' }));
                break;
              }

              auction.highestBid = amount;
              auction.highestBidderId = bidder.id;
              auction.bids[bidder.id] = amount;

              broadcastToRoom(ws.roomId, {
                type: 'auctionBidPlaced',
                propertyIndex: auction.propertyIndex,
                bidderId: bidder.id,
                amount
              });
            } catch (error) {
              ws.send(JSON.stringify({ type: 'error', message: 'Failed to place bid' }));
            }
            break;


          case 'buyHouse':
            try {
              if (!ws.roomId || !ws.playerId) break;
              const { propertyIndex } = message;
              const room = await storage.getRoom(ws.roomId);
              if (!room || room.gameState !== 'playing') break;

              const currentPlayer = room.players[room.currentPlayerIndex];
              if (!currentPlayer || currentPlayer.id !== ws.playerId || currentPlayer.isEliminated) {
                ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }));
                break;
              }

              const player = room.players.find(p => p.id === ws.playerId);
              if (!player || !player.properties.includes(propertyIndex)) {
                ws.send(JSON.stringify({ type: 'error', message: 'You do not own this property' }));
                break;
              }

              if (player.mortgagedProperties?.includes(propertyIndex)) {
                ws.send(JSON.stringify({ type: 'error', message: 'Cannot build on mortgaged property' }));
                break;
              }

              const square = BOARD_DATA[propertyIndex];
              if (!square || square.type !== 'property' || !square.colorGroup || !square.houseCost) {
                ws.send(JSON.stringify({ type: 'error', message: 'Houses can only be built on standard properties' }));
                break;
              }

              if (player.hotelProperties?.includes(propertyIndex)) {
                ws.send(JSON.stringify({ type: 'error', message: 'Hotel already built. Cannot add house.' }));
                break;
              }

              const colorSet = BOARD_DATA.filter(space => space.type === 'property' && space.colorGroup === square.colorGroup).map(space => space.position);
              const ownsSet = colorSet.length > 0 && colorSet.every(position => player.properties.includes(position));
              if (!ownsSet) {
                ws.send(JSON.stringify({ type: 'error', message: 'Own full color set before building houses' }));
                break;
              }

              const levels = player.buildingLevels || {};
              const currentLevel = Number(levels[String(propertyIndex)] || 0);
              if (currentLevel >= 4) {
                ws.send(JSON.stringify({ type: 'error', message: 'Maximum 4 houses reached on this property' }));
                break;
              }

              const minInSet = Math.min(...colorSet.map((p) => Number(levels[String(p)] || 0)));
              if (currentLevel > minInSet) {
                ws.send(JSON.stringify({ type: 'error', message: 'Build houses evenly across the color set' }));
                break;
              }

              if (player.money < square.houseCost) {
                ws.send(JSON.stringify({ type: 'error', message: 'Insufficient funds to build house' }));
                break;
              }

              await storage.updatePlayer(ws.roomId, ws.playerId, {
                money: player.money - square.houseCost,
                buildingLevels: {
                  ...levels,
                  [String(propertyIndex)]: currentLevel + 1
                }
              });

              const updatedRoom = await storage.getRoom(ws.roomId);
              broadcastToRoom(ws.roomId, {
                type: 'houseBuilt',
                room: updatedRoom,
                playerId: ws.playerId,
                propertyIndex,
                level: currentLevel + 1,
                cost: square.houseCost
              });
            } catch (error) {
              ws.send(JSON.stringify({ type: 'error', message: 'Failed to build house' }));
            }
            break;


          case 'buildHotel':
            try {
              if (!ws.roomId || !ws.playerId) break;
              const { propertyIndex } = message;
              const room = await storage.getRoom(ws.roomId);
              if (!room || room.gameState !== 'playing') break;

              const currentPlayer = room.players[room.currentPlayerIndex];
              if (!currentPlayer || currentPlayer.id !== ws.playerId || currentPlayer.isEliminated) {
                ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }));
                break;
              }

              const player = room.players.find(p => p.id === ws.playerId);
              if (!player) break;

              if (!player.properties.includes(propertyIndex)) {
                ws.send(JSON.stringify({ type: 'error', message: 'You do not own this property' }));
                break;
              }

              const square = BOARD_DATA[propertyIndex];
              if (!square || square.type !== 'property' || !square.colorGroup) {
                ws.send(JSON.stringify({ type: 'error', message: 'Hotels can only be built on standard properties' }));
                break;
              }

              if (player.hotelProperties?.includes(propertyIndex)) {
                ws.send(JSON.stringify({ type: 'error', message: 'Hotel already exists on this property' }));
                break;
              }

              const colorSet = BOARD_DATA
                .filter(space => space.type === 'property' && space.colorGroup === square.colorGroup)
                .map(space => space.position);
              const ownsSet = colorSet.length > 0 && colorSet.every(position => player.properties.includes(position));
              if (!ownsSet) {
                ws.send(JSON.stringify({ type: 'error', message: 'Own the full color set before building hotels' }));
                break;
              }

              const levels = player.buildingLevels || {};
              const allHaveFourHouses = colorSet.every((position) => Number(levels[String(position)] || 0) >= 4 || player.hotelProperties?.includes(position));
              if (!allHaveFourHouses) {
                ws.send(JSON.stringify({ type: 'error', message: 'Build 4 houses on complete set before hotel' }));
                break;
              }
              const currentHouses = Number(levels[String(propertyIndex)] || 0);
              if (currentHouses < 4) {
                ws.send(JSON.stringify({ type: 'error', message: 'Build 4 houses before building a hotel' }));
                break;
              }

              const houseCost = square.houseCost || HOTEL_COST;
              if (player.money < houseCost) {
                ws.send(JSON.stringify({ type: 'error', message: 'Insufficient funds to build hotel' }));
                break;
              }

              await storage.updatePlayer(ws.roomId, ws.playerId, {
                money: player.money - houseCost,
                hotelProperties: [...(player.hotelProperties || []), propertyIndex],
                buildingLevels: { ...levels, [String(propertyIndex)]: 0 }
              });

              const updatedRoom = await storage.getRoom(ws.roomId);
              broadcastToRoom(ws.roomId, {
                type: 'hotelBuilt',
                room: updatedRoom,
                playerId: ws.playerId,
                propertyIndex,
                cost: square.houseCost || HOTEL_COST
              });
            } catch (error) {
              ws.send(JSON.stringify({ type: 'error', message: 'Failed to build hotel' }));
            }
            break;

          case 'payJailFine':
            try {
              if (!ws.roomId || !ws.playerId) break;
              const room = await storage.getRoom(ws.roomId);
              if (!room || room.gameState !== 'playing') break;

              const player = room.players.find(p => p.id === ws.playerId);
              if (!player || !player.isInJail || player.jailTurns <= 0) {
                ws.send(JSON.stringify({ type: 'error', message: 'You are not in jail' }));
                break;
              }

              if (player.money < JAIL_FINE) {
                ws.send(JSON.stringify({ type: 'error', message: 'Insufficient money to pay jail fine' }));
                break;
              }

              await storage.updatePlayer(ws.roomId, ws.playerId, {
                money: player.money - JAIL_FINE,
                isInJail: false,
                jailTurns: 0,
                consecutiveDoubles: 0,
                pendingDoubleDecision: false,
              });

              const updatedRoom = await storage.getRoom(ws.roomId);
              broadcastToRoom(ws.roomId, {
                type: 'jailFinePaid',
                room: updatedRoom,
                playerId: ws.playerId,
                amount: JAIL_FINE,
              });
            } catch (error) {
              ws.send(JSON.stringify({ type: 'error', message: 'Failed to pay jail fine' }));
            }
            break;

          case 'mortgageProperty':
            try {
              if (!ws.roomId || !ws.playerId) break;
              const { propertyIndex } = message;
              const room = await storage.getRoom(ws.roomId);
              if (!room) break;
              const player = room.players.find(p => p.id === ws.playerId);
              if (!player || !player.properties.includes(propertyIndex)) {
                ws.send(JSON.stringify({ type: 'error', message: 'Property not owned by player' }));
                break;
              }
              if (player.mortgagedProperties?.includes(propertyIndex)) {
                ws.send(JSON.stringify({ type: 'error', message: 'Property already mortgaged' }));
                break;
              }

              const square = BOARD_DATA[propertyIndex];
              const mortgageValue = square?.mortgageValue || Math.floor((square?.price || 0) / 2);

              await storage.updatePlayer(ws.roomId, ws.playerId, {
                money: player.money + mortgageValue,
                mortgagedProperties: [...(player.mortgagedProperties || []), propertyIndex],
                hotelProperties: (player.hotelProperties || []).filter((p) => p !== propertyIndex),
              });

              const updatedRoom = await storage.getRoom(ws.roomId);
              broadcastToRoom(ws.roomId, {
                type: 'propertyMortgaged',
                room: updatedRoom,
                playerId: ws.playerId,
                propertyIndex,
                amount: mortgageValue,
              });
            } catch (error) {
              ws.send(JSON.stringify({ type: 'error', message: 'Failed to mortgage property' }));
            }
            break;

          case 'unmortgageProperty':
            try {
              if (!ws.roomId || !ws.playerId) break;
              const { propertyIndex } = message;
              const room = await storage.getRoom(ws.roomId);
              if (!room) break;
              const player = room.players.find(p => p.id === ws.playerId);
              if (!player || !player.properties.includes(propertyIndex) || !player.mortgagedProperties?.includes(propertyIndex)) {
                ws.send(JSON.stringify({ type: 'error', message: 'Property is not mortgaged by player' }));
                break;
              }

              const square = BOARD_DATA[propertyIndex];
              const mortgageValue = square?.mortgageValue || Math.floor((square?.price || 0) / 2);
              const repayAmount = Math.ceil(mortgageValue * (1 + MORTGAGE_INTEREST_RATE));

              if (player.money < repayAmount) {
                ws.send(JSON.stringify({ type: 'error', message: 'Insufficient money to unmortgage property' }));
                break;
              }

              await storage.updatePlayer(ws.roomId, ws.playerId, {
                money: player.money - repayAmount,
                mortgagedProperties: (player.mortgagedProperties || []).filter((p) => p !== propertyIndex),
              });

              const updatedRoom = await storage.getRoom(ws.roomId);
              broadcastToRoom(ws.roomId, {
                type: 'propertyUnmortgaged',
                room: updatedRoom,
                playerId: ws.playerId,
                propertyIndex,
                amount: repayAmount,
              });
            } catch (error) {
              ws.send(JSON.stringify({ type: 'error', message: 'Failed to unmortgage property' }));
            }
            break;

          case 'tradeProperty':
            try {
              if (!ws.roomId || !ws.playerId) break;
              const { targetPlayerId, offeredPropertyIndex, requestedPropertyIndex, cashOffered = 0, cashRequested = 0 } = message;
              const room = await storage.getRoom(ws.roomId);
              if (!room || room.gameState !== 'playing') break;

              const fromPlayer = room.players.find((p) => p.id === ws.playerId);
              const toPlayer = room.players.find((p) => p.id === targetPlayerId);
              if (!fromPlayer || !toPlayer || fromPlayer.isEliminated || toPlayer.isEliminated) {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid trade players' }));
                break;
              }

              if (offeredPropertyIndex !== undefined && !fromPlayer.properties.includes(offeredPropertyIndex)) {
                ws.send(JSON.stringify({ type: 'error', message: 'You do not own offered property' }));
                break;
              }

              if (requestedPropertyIndex !== undefined && !toPlayer.properties.includes(requestedPropertyIndex)) {
                ws.send(JSON.stringify({ type: 'error', message: 'Target player does not own requested property' }));
                break;
              }

              const offerCash = Math.max(0, Number(cashOffered) || 0);
              const requestCash = Math.max(0, Number(cashRequested) || 0);

              if (fromPlayer.money < offerCash || toPlayer.money < requestCash) {
                ws.send(JSON.stringify({ type: 'error', message: 'One of the players has insufficient cash for trade' }));
                break;
              }

              // ACID-like in-memory transaction: validate everything first, then apply all updates together.
              let fromProperties = [...fromPlayer.properties];
              let toProperties = [...toPlayer.properties];
              let fromMortgaged = [...(fromPlayer.mortgagedProperties || [])];
              let toMortgaged = [...(toPlayer.mortgagedProperties || [])];
              let fromHotels = [...(fromPlayer.hotelProperties || [])];
              let toHotels = [...(toPlayer.hotelProperties || [])];

              if (offeredPropertyIndex !== undefined) {
                fromProperties = fromProperties.filter((p) => p !== offeredPropertyIndex);
                toProperties.push(offeredPropertyIndex);
                const wasMortgaged = fromMortgaged.includes(offeredPropertyIndex);
                fromMortgaged = fromMortgaged.filter((p) => p !== offeredPropertyIndex);
                if (wasMortgaged) toMortgaged.push(offeredPropertyIndex);
                fromHotels = fromHotels.filter((p) => p !== offeredPropertyIndex);
              }

              if (requestedPropertyIndex !== undefined) {
                toProperties = toProperties.filter((p) => p !== requestedPropertyIndex);
                fromProperties.push(requestedPropertyIndex);
                const wasMortgaged = toMortgaged.includes(requestedPropertyIndex);
                toMortgaged = toMortgaged.filter((p) => p !== requestedPropertyIndex);
                if (wasMortgaged) fromMortgaged.push(requestedPropertyIndex);
                toHotels = toHotels.filter((p) => p !== requestedPropertyIndex);
              }

              await storage.updatePlayer(ws.roomId, fromPlayer.id, {
                properties: fromProperties,
                mortgagedProperties: fromMortgaged,
                hotelProperties: fromHotels,
                money: fromPlayer.money - offerCash + requestCash,
              });

              await storage.updatePlayer(ws.roomId, toPlayer.id, {
                properties: toProperties,
                mortgagedProperties: toMortgaged,
                hotelProperties: toHotels,
                money: toPlayer.money - requestCash + offerCash,
              });

              const updatedRoom = await storage.getRoom(ws.roomId);
              broadcastToRoom(ws.roomId, {
                type: 'tradeCompleted',
                room: updatedRoom,
                fromPlayerId: fromPlayer.id,
                toPlayerId: toPlayer.id,
                offeredPropertyIndex,
                requestedPropertyIndex,
                cashOffered: offerCash,
                cashRequested: requestCash,
              });
            } catch (error) {
              ws.send(JSON.stringify({ type: 'error', message: 'Failed to complete trade' }));
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
      
      removeConnection(connectionId, ws.roomId);
      
      if (ws.roomId) {
        
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
      const { hostId, maxPlayers, startMoney } = req.body;
      const room = await storage.createRoom({ hostId, maxPlayers: maxPlayers || 8, startMoney: Math.max(5000, Math.min(50000, Number(startMoney) || 15000)) });
      
      // Add the host as the first player
      const hostPlayer = await storage.addPlayerToRoom(room.id, {
        name: hostId,
        color: '',
        avatar: hostId.charAt(0).toUpperCase()
      });

      if (hostPlayer) {
        await storage.updateRoom(room.id, { hostId: hostPlayer.id });
      }
      
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
