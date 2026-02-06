import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Room, Player, ChatMessage } from "@shared/schema";
import { useSocket } from "@/hooks/useSocket";
import { useToast } from "@/hooks/use-toast";
import GameBoard from "@/components/GameBoard";
import PlayerInfo from "@/components/PlayerInfo";
import Chat from "@/components/Chat";
import PropertyModal from "@/components/PropertyModal";
import RulesModal from "@/components/RulesModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GAME_PROPERTIES } from "@/lib/gameConstants";

interface GameProps {
  roomCode: string;
}

export default function Game({ roomCode }: GameProps) {
  const [, setLocation] = useLocation();
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [diceResult, setDiceResult] = useState<{dice1: number, dice2: number} | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [bankruptcyState, setBankruptcyState] = useState<{ playerId: string; money: number; properties: number[] } | null>(null);
  const [auctionState, setAuctionState] = useState<{ propertyIndex: number; sellerId: string; highestBid: number } | null>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [standings, setStandings] = useState<Array<{ playerId: string; name: string; rank: number; money: number }>>([]);
  const [pendingDoubleDecision, setPendingDoubleDecision] = useState(false);
  const [turnTimer, setTurnTimer] = useState<{ phase: "roll" | "action"; endsAt: number } | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [timerNow, setTimerNow] = useState(Date.now());
  
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'roomJoined':
        case 'gameStarted':
        case 'diceRolled':
        case 'turnEnded':
        case 'propertyBought':
        case 'playerDisconnected':
          setRoom(data.room);
          if (data.type === 'turnEnded') {
            const playerId = localStorage.getItem('playerId');
            if (data.autoEnded && data.previousPlayerId === playerId && data.reason === 'actionTimeout') {
              toast({
                title: 'Turn auto-ended',
                description: 'No action was taken for 2 minutes, so your turn ended automatically.',
                variant: 'default',
              });
            }
          }
          if (data.type === 'diceRolled' && data.playerId === currentPlayer?.id) {
            setDiceResult({ dice1: data.dice1, dice2: data.dice2 });
            setIsRolling(false);
            if (data.passedStart) {
              toast({
                title: "Passed START!",
                description: "You collected ₹2,000",
                variant: "default",
              });
            }
            if (data.cardText) {
              toast({
                title: "Card Drawn",
                description: data.cardText,
                variant: "default",
              });
            }
            setPendingDoubleDecision(!!data.pendingDoubleDecision);
            if (data.extraTurnGranted) {
              toast({ title: 'Double!', description: 'You rolled double 6-like pair and get another turn.', variant: 'default' });
            }
            if (data.sentToJail) {
              toast({
                title: "Go To Jail",
                description: "You must skip your next turn or pay bail.",
                variant: "destructive",
              });
            }
          }
          break;
          
        case 'newMessage':
          setChatMessages(prev => [...prev, data.message]);
          break;

        case 'rentPaid': {
          const playerId = localStorage.getItem('playerId');
          const propertyName = data.propertyIndex !== undefined
            ? GAME_PROPERTIES[data.propertyIndex]?.name
            : "Property";
          if (playerId === data.payerId) {
            toast({
              title: "Rent Paid",
              description: `₹${data.amount} paid for ${propertyName}`,
              variant: "destructive",
            });
          } else if (playerId === data.ownerId) {
            toast({
              title: "Rent Received",
              description: `₹${data.amount} received for ${propertyName}`,
              variant: "default",
            });
          }
          break;
        }
          

        case 'bankruptcyState': {
          const playerId = localStorage.getItem('playerId');
          if (playerId === data.playerId) {
            setBankruptcyState({
              playerId: data.playerId,
              money: data.money,
              properties: data.properties || []
            });
            toast({
              title: "Low Balance",
              description: "Sell or auction properties to recover funds.",
              variant: "destructive"
            });
          }
          break;
        }

        case 'propertySoldToBank': {
          setRoom(data.room);
          const playerId = localStorage.getItem('playerId');
          if (playerId === data.playerId) {
            toast({
              title: "Property sold to bank",
              description: `You received ₹${data.amount}`,
              variant: "default"
            });
          }
          break;
        }

        case 'auctionStarted':
          setAuctionState({
            propertyIndex: data.propertyIndex,
            sellerId: data.sellerId,
            highestBid: data.highestBid
          });
          setBidAmount(data.highestBid + 100);
          break;

        case 'auctionBidPlaced':
          setAuctionState((prev) => prev ? { ...prev, highestBid: data.amount } : prev);
          break;

        case 'auctionEnded':
          setAuctionState(null);
          setRoom(data.room);
          if (data.winnerId) {
            toast({
              title: "Auction complete",
              description: `Property sold for ₹${data.amount}`,
              variant: "default"
            });
          } else {
            toast({
              title: "Auction complete",
              description: "No valid bids. Property returned to bank.",
              variant: "default"
            });
          }
          break;

        case 'houseBuilt': {
          setRoom(data.room);
          const playerId = localStorage.getItem('playerId');
          if (playerId === data.playerId) {
            toast({ title: 'House Built', description: `You built house level ${data.level} for ₹${data.cost}`, variant: 'default' });
          }
          break;
        }

        case 'hotelBuilt': {
          setRoom(data.room);
          const playerId = localStorage.getItem('playerId');
          if (playerId === data.playerId) {
            toast({
              title: 'Hotel Built',
              description: `You built a hotel for ₹${data.cost}`,
              variant: 'default'
            });
          }
          break;
        }


        case 'playerEliminated': {
          setRoom(data.room);
          const playerId = localStorage.getItem('playerId');
          if (playerId === data.playerId) {
            toast({
              title: "You are eliminated",
              description: "You can now watch as a spectator.",
              variant: "destructive"
            });
          }
          break;
        }

        case 'gameEnded':
          setRoom(data.room);
          setStandings(data.standings || []);
          toast({
            title: "Game Over",
            description: "Final leaderboard is ready.",
            variant: "default"
          });
          break;

        case 'turnSkippedJail': {
          setRoom(data.room);
          const playerId = localStorage.getItem('playerId');
          if (playerId === data.playerId) {
            toast({
              title: 'Turn skipped (Jail)',
              description: 'You lost this turn because you were in jail.',
              variant: 'destructive'
            });
          }
          break;
        }

        case 'jailFinePaid': {
          setRoom(data.room);
          const playerId = localStorage.getItem('playerId');
          if (playerId === data.playerId) {
            toast({
              title: 'Bail Paid',
              description: `You paid ₹${data.amount} and can play this turn.`,
              variant: 'default'
            });
          }
          break;
        }

        case 'propertyMortgaged':
        case 'propertyUnmortgaged':
        case 'tradeCompleted':
          setRoom(data.room);
          break;


        case 'turnTimerUpdated':
          if (typeof data.serverNow === 'number') {
            setServerOffsetMs(data.serverNow - Date.now());
          }
          if (data.active && (data.phase === 'roll' || data.phase === 'action') && typeof data.endsAt === 'number') {
            setTurnTimer({ phase: data.phase, endsAt: data.endsAt });
          } else {
            setTurnTimer(null);
          }
          break;

        case 'error':
          setIsRolling(false);
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
          // If room not found, redirect to home
          if (data.message === 'Room not found' || data.message === 'Player not found in room') {
            setTimeout(() => setLocation('/'), 2000);
          }
          break;
      }
    };

    socket.addEventListener('message', handleMessage);
    
    // Auto-rejoin the game room
    const playerId = localStorage.getItem('playerId');
    const playerName = localStorage.getItem('playerName');
    
    if (!playerId || !playerName) {
      toast({
        title: "No Player Data",
        description: "Please create or join a room first",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }

    // Join the game room
    socket.send(JSON.stringify({
      type: 'rejoinRoom',
      roomCode: roomCode,
      playerId: playerId
    }));

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, isConnected, currentPlayer, toast]);

  useEffect(() => {
    const playerId = localStorage.getItem('playerId');
    if (room && playerId) {
      const player = room.players.find(p => p.id === playerId);
      setCurrentPlayer(player || null);
    }
  }, [room]);

  useEffect(() => {
    if (!turnTimer) return;

    const interval = setInterval(() => {
      setTimerNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [turnTimer]);

  const remainingTurnSeconds = useMemo(() => {
    if (!turnTimer) return null;
    const adjustedNow = timerNow + serverOffsetMs;
    return Math.max(0, Math.ceil((turnTimer.endsAt - adjustedNow) / 1000));
  }, [turnTimer, timerNow, serverOffsetMs]);

  const handleRollDice = () => {
    if (!socket || !currentPlayer || isRolling || currentPlayer.isEliminated) return;

    setIsRolling(true);
    setDiceResult(null);

    socket.send(JSON.stringify({
      type: 'rollDice'
    }));
  };

  const handleEndTurn = () => {
    if (!socket || currentPlayer?.isEliminated) return;

    socket.send(JSON.stringify({
      type: 'endTurn'
    }));
  };

  const handleBuyProperty = (propertyIndex: number, price: number) => {
    if (!socket || currentPlayer?.isEliminated) return;

    socket.send(JSON.stringify({
      type: 'buyProperty',
      propertyIndex,
      price
    }));

    setShowPropertyModal(false);
    setSelectedProperty(null);
  };

  const handleSendMessage = (message: string) => {
    if (!socket) return;

    socket.send(JSON.stringify({
      type: 'sendMessage',
      message
    }));
  };

  const handlePropertyClick = (propertyIndex: number) => {
    setSelectedProperty(propertyIndex);
    setShowPropertyModal(true);
  };


  const handleSellPropertyToBank = (propertyIndex: number) => {
    if (!socket) return;
    socket.send(JSON.stringify({
      type: 'sellPropertyToBank',
      propertyIndex
    }));
  };

  const handleStartAuction = (propertyIndex: number) => {
    if (!socket) return;
    socket.send(JSON.stringify({
      type: 'startPropertyAuction',
      propertyIndex,
      startingBid: 100
    }));
  };

  const handlePlaceAuctionBid = () => {
    if (!socket || !auctionState) return;
    socket.send(JSON.stringify({
      type: 'placeAuctionBid',
      bidAmount
    }));
  };


  const handlePayJailFine = () => {
    if (!socket || currentPlayer?.isEliminated) return;
    socket.send(JSON.stringify({
      type: 'payJailFine'
    }));
  };


  const handleBuyHouse = (propertyIndex: number) => {
    if (!socket || currentPlayer?.isEliminated) return;
    socket.send(JSON.stringify({ type: 'buyHouse', propertyIndex }));
  };

  const handleMortgage = (propertyIndex: number) => {
    if (!socket || currentPlayer?.isEliminated) return;
    socket.send(JSON.stringify({ type: 'mortgageProperty', propertyIndex }));
  };

  const handleUnmortgage = (propertyIndex: number) => {
    if (!socket || currentPlayer?.isEliminated) return;
    socket.send(JSON.stringify({ type: 'unmortgageProperty', propertyIndex }));
  };

  const handleDoubleDecision = (continueTurn: boolean) => {
    if (!socket || currentPlayer?.isEliminated) return;
    socket.send(JSON.stringify({ type: 'chooseDoubleTurn', continueTurn }));
  };

  const handleBuildHotel = (propertyIndex: number) => {
    if (!socket || currentPlayer?.isEliminated) return;
    socket.send(JSON.stringify({
      type: 'buildHotel',
      propertyIndex
    }));
    setShowPropertyModal(false);
    setSelectedProperty(null);
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-saffron mb-4 mx-auto"></div>
          <p className="text-dark-slate">Loading game...</p>
        </div>
      </div>
    );
  }

  const currentTurnPlayer = room.players[room.currentPlayerIndex];
  const isSpectator = !!currentPlayer?.isEliminated;
  const isMyTurn = currentPlayer?.id === currentTurnPlayer?.id && !isSpectator;

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation Header */}
      <nav className="bg-navy text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <i className="fas fa-building text-saffron text-2xl"></i>
            <h1 className="text-2xl font-bold text-saffron">VYAPAAR</h1>
            <span className="text-sm opacity-75">Game</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRulesModal(true)}
              data-testid="button-rules"
              className="text-white border-white hover:bg-white hover:text-navy"
            >
              <i className="fas fa-book mr-2"></i>
              Rules
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileChat(true)}
              data-testid="button-mobile-chat"
              className="text-white border-white hover:bg-white hover:text-navy lg:hidden"
            >
              <i className="fas fa-comments mr-2"></i>
              Chat
            </Button>
            <span className="text-sm">
              Room: <span className="font-mono bg-saffron text-navy px-2 py-1 rounded" data-testid="text-game-room-code">{room.code}</span>
            </span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6 relative">
          {/* Game Board Section */}
          <div className="lg:col-span-3">
            <GameBoard
              room={room}
              currentPlayer={currentPlayer}
              diceResult={diceResult}
              isRolling={isRolling}
              isMyTurn={isMyTurn}
              onRollDice={handleRollDice}
              onEndTurn={handleEndTurn}
              onPropertyClick={handlePropertyClick}
            />

            {/* Mobile Player Info */}
            <div className="mt-6 lg:hidden">
              <PlayerInfo
                room={room}
                currentPlayer={currentPlayer}
                isMyTurn={isMyTurn}
                onRollDice={handleRollDice}
                onEndTurn={handleEndTurn}
                isRolling={isRolling}
                testIdPrefix="mobile"
              />
            </div>
          </div>

          {/* Right Sidebar (Desktop) */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24">
              <PlayerInfo
                room={room}
                currentPlayer={currentPlayer}
                isMyTurn={isMyTurn}
                onRollDice={handleRollDice}
                onEndTurn={handleEndTurn}
                isRolling={isRolling}
                testIdPrefix="sidebar"
              />
            </div>
          </div>

          {/* Desktop Chat Sidebar */}
          <div className="hidden lg:block fixed right-4 top-20 bottom-4 w-80 z-40">
            <Chat
              messages={chatMessages}
              currentPlayer={currentPlayer}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>

      {/* Mobile Chat Overlay */}
      {showMobileChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-4 h-96 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Game Chat</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileChat(false)}
                data-testid="button-close-mobile-chat"
              >
                <i className="fas fa-times text-xl"></i>
              </Button>
            </div>
            <div className="h-full">
              <Chat
                messages={chatMessages}
                currentPlayer={currentPlayer}
                onSendMessage={handleSendMessage}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Current Turn Indicator */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-30">
        <div className={`bg-white rounded-full px-6 py-3 shadow-lg border-2 border-saffron ${isMyTurn ? "turn-indicator" : ""}`}>
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: currentTurnPlayer.color }}
            >
              {currentTurnPlayer.avatar}
            </div>
            <div>
              <p className="font-semibold text-sm" data-testid="text-current-turn">
                {isMyTurn ? "Your Turn" : `${currentTurnPlayer.name}'s Turn`}
              </p>
              <p className="text-xs text-gray-500">Turn #{room.turnNumber}</p>
              {remainingTurnSeconds !== null && (
                <p className="text-xs font-semibold text-saffron">
                  {turnTimer?.phase === "roll" ? "Roll timer" : "Action timer"}: {remainingTurnSeconds}s
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isSpectator && (
        <div className="fixed top-36 left-1/2 -translate-x-1/2 z-30 bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
          Spectator Mode: You are eliminated
        </div>
      )}


      {currentPlayer?.isInJail && isMyTurn && (
        <div className="fixed top-48 left-1/2 -translate-x-1/2 z-30">
          <Button onClick={handlePayJailFine} className="bg-red-600 hover:bg-red-700 text-white">
            Pay Jail Fine (₹500)
          </Button>
        </div>
      )}


      {pendingDoubleDecision && isMyTurn && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-2">Second Double Rolled</h3>
            <p className="text-sm text-gray-600 mb-4">You rolled doubles twice. Continue turn or end your turn now?</p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => handleDoubleDecision(true)}>Continue Turn</Button>
              <Button className="flex-1" variant="outline" onClick={() => handleDoubleDecision(false)}>End Turn</Button>
            </div>
          </div>
        </div>
      )}

      {standings.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-2xl font-bold mb-4 text-navy">Final Leaderboard</h3>
            <div className="space-y-2">
              {standings.map((entry) => (
                <div key={entry.playerId} className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <span className="font-semibold">#{entry.rank} {entry.name}</span>
                  <span className="text-gray-600">₹{entry.money.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {bankruptcyState && currentPlayer && bankruptcyState.playerId === currentPlayer.id && bankruptcyState.properties.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6">
            <h3 className="text-xl font-bold mb-2 text-red-600">Balance Recovery Required</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your balance is ₹{currentPlayer.money.toLocaleString()}. Sell to bank or start an auction.
            </p>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {bankruptcyState.properties.map((propertyIndex) => (
                <div key={propertyIndex} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{GAME_PROPERTIES[propertyIndex]?.name}</p>
                    <p className="text-xs text-gray-500">Price ₹{GAME_PROPERTIES[propertyIndex]?.price || 0}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleStartAuction(propertyIndex)}>
                      Auction
                    </Button>
                    <Button size="sm" onClick={() => handleSellPropertyToBank(propertyIndex)}>
                      Sell to Bank
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={() => setBankruptcyState(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {auctionState && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white border shadow-xl rounded-xl p-4 w-[min(92vw,520px)]">
          <p className="font-semibold mb-2">
            Auction: {GAME_PROPERTIES[auctionState.propertyIndex]?.name} (Current ₹{auctionState.highestBid})
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              className="border rounded px-3 py-2 flex-1"
              value={bidAmount}
              min={auctionState.highestBid + 1}
              onChange={(e) => setBidAmount(Number(e.target.value))}
            />
            <Button onClick={handlePlaceAuctionBid}>Place Bid</Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <PropertyModal
        show={showPropertyModal}
        propertyIndex={selectedProperty}
        room={room}
        currentPlayer={currentPlayer}
        onBuy={handleBuyProperty}
        onBuildHotel={handleBuildHotel}
        onBuyHouse={handleBuyHouse}
        onMortgage={handleMortgage}
        onUnmortgage={handleUnmortgage}
        isMyTurn={isMyTurn}
        onClose={() => {
          setShowPropertyModal(false);
          setSelectedProperty(null);
        }}
      />

      <RulesModal
        show={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />
    </div>
  );
}
