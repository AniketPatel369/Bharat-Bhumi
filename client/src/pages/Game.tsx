import { useEffect, useState } from "react";
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
  
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'gameStarted':
        case 'diceRolled':
        case 'turnEnded':
        case 'propertyBought':
        case 'playerDisconnected':
          setRoom(data.room);
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
          }
          break;
          
        case 'newMessage':
          setChatMessages(prev => [...prev, data.message]);
          break;
          
        case 'error':
          setIsRolling(false);
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
          break;
      }
    };

    socket.addEventListener('message', handleMessage);

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

  const handleRollDice = () => {
    if (!socket || !currentPlayer || isRolling) return;

    setIsRolling(true);
    setDiceResult(null);

    socket.send(JSON.stringify({
      type: 'rollDice'
    }));
  };

  const handleEndTurn = () => {
    if (!socket) return;

    socket.send(JSON.stringify({
      type: 'endTurn'
    }));
  };

  const handleBuyProperty = (propertyIndex: number, price: number) => {
    if (!socket) return;

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
  const isMyTurn = currentPlayer?.id === currentTurnPlayer?.id;

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
              />
            </div>
          </div>

          {/* Right Sidebar (Desktop) */}
          <div className="lg:col-span-1 hidden lg:block">
            <PlayerInfo
              room={room}
              currentPlayer={currentPlayer}
              isMyTurn={isMyTurn}
              onRollDice={handleRollDice}
              onEndTurn={handleEndTurn}
              isRolling={isRolling}
            />
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
        <div className="bg-white rounded-full px-6 py-3 shadow-lg border-2 border-saffron">
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
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PropertyModal
        show={showPropertyModal}
        propertyIndex={selectedProperty}
        room={room}
        currentPlayer={currentPlayer}
        onBuy={handleBuyProperty}
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
