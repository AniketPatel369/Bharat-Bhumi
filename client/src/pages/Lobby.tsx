import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/hooks/useSocket";
import { useToast } from "@/hooks/use-toast";
import { Room, Player } from "@shared/schema";

interface LobbyProps {
  roomCode: string;
}

export default function Lobby({ roomCode }: LobbyProps) {
  const [, setLocation] = useLocation();
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'roomJoined':
        case 'playerJoined':
        case 'playerReadyChanged':
        case 'playerDisconnected':
          setRoom(data.room);
          break;
          
        case 'gameStarted':
          setLocation(`/game/${roomCode}`);
          break;
          
        case 'error':
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
          // If room not found or can't join, redirect to home
          if (data.message === 'Room not found' || data.message === 'Failed to join room') {
            setTimeout(() => setLocation('/'), 2000);
          }
          break;
      }
    };

    socket.addEventListener('message', handleMessage);

    // Auto-join room if we have player data
    const playerId = localStorage.getItem('playerId');
    const playerName = localStorage.getItem('playerName');
    
    if (!playerId || !playerName) {
      // If no player data, redirect to home to create/join
      toast({
        title: "No Player Data",
        description: "Please create or join a room first",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }

    // Try to rejoin the room
    socket.send(JSON.stringify({
      type: 'rejoinRoom',
      roomCode: roomCode,
      playerId: playerId
    }));

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, isConnected, roomCode, setLocation, toast]);

  useEffect(() => {
    const playerId = localStorage.getItem('playerId');
    if (room && playerId) {
      const player = room.players.find(p => p.id === playerId);
      setCurrentPlayer(player || null);
    }
  }, [room]);

  const handleToggleReady = () => {
    if (!socket || !currentPlayer) return;

    socket.send(JSON.stringify({
      type: 'playerReady',
      playerId: currentPlayer.id,
      isReady: !currentPlayer.isReady
    }));
  };

  const handleStartGame = () => {
    if (!socket) return;

    socket.send(JSON.stringify({
      type: 'startGame'
    }));
  };

  const isHost = currentPlayer && room && currentPlayer.id === room.hostId;
  const allReady = room?.players.every(p => p.isReady) ?? false;
  const minPlayers = (room?.players.length ?? 0) >= 2;

  if (!room) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-saffron mb-4 mx-auto"></div>
          <p className="text-dark-slate">Loading lobby...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation Header */}
      <nav className="bg-navy text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <i className="fas fa-building text-saffron text-2xl"></i>
            <h1 className="text-2xl font-bold text-saffron">VYAPAAR</h1>
            <span className="text-sm opacity-75">Lobby</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              Room: <span className="font-mono bg-saffron text-navy px-2 py-1 rounded" data-testid="text-room-code">{room.code}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const roomUrl = `${window.location.origin}/lobby/${room.code}`;
                navigator.clipboard.writeText(roomUrl);
                toast({
                  title: "Room Link Copied!",
                  description: "Share this link with other players",
                });
              }}
              data-testid="button-share-room"
              className="text-white border-white hover:bg-white hover:text-navy mr-2"
            >
              <i className="fas fa-share mr-1"></i>
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/")}
              data-testid="button-leave-room"
              className="text-white border-white hover:bg-white hover:text-navy"
            >
              Leave Room
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl text-navy">Game Lobby</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Players List */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-dark-slate" data-testid="text-players-count">
                    Players ({room.players.length}/{room.maxPlayers})
                  </h3>
                  <div className="space-y-3">
                    {room.players.map((player) => (
                      <div key={player.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: player.color }}
                            data-testid={`player-token-${player.name}`}
                          >
                            {player.avatar}
                          </div>
                          <div>
                            <p className="font-semibold" data-testid={`text-player-name-${player.name}`}>
                              {player.name}
                              {player.id === room.hostId && (
                                <Badge variant="secondary" className="ml-2">Host</Badge>
                              )}
                              {player.id === currentPlayer?.id && (
                                <Badge variant="outline" className="ml-2">You</Badge>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              {player.isConnected ? "Online" : "Disconnected"}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={player.isReady ? "default" : "outline"}
                          className={player.isReady ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                          data-testid={`status-ready-${player.name}`}
                        >
                          {player.isReady ? "Ready" : "Not Ready"}
                        </Badge>
                      </div>
                    ))}
                    
                    {/* Empty slots */}
                    {Array.from({ length: room.maxPlayers - room.players.length }).map((_, index) => (
                      <div key={`empty-${index}`} className="flex items-center bg-gray-100 p-3 rounded-lg opacity-50">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <i className="fas fa-user-plus text-gray-500"></i>
                        </div>
                        <p className="ml-3 text-gray-500">Waiting for player...</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Game Settings */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-dark-slate">Game Settings</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Room Code</p>
                      <p className="font-mono text-xl font-bold text-navy" data-testid="text-room-code-detail">{room.code}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Starting Money</p>
                      <p className="font-semibold text-lg">₹15,000</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Max Players</p>
                      <p className="font-semibold text-lg">{room.maxPlayers} Players</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Game Status</p>
                      <Badge 
                        variant="outline" 
                        className="bg-yellow-100 text-yellow-800"
                        data-testid="status-game"
                      >
                        Waiting to Start
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 flex justify-center gap-4">
                {currentPlayer && !isHost && (
                  <Button
                    data-testid="button-toggle-ready"
                    onClick={handleToggleReady}
                    className={currentPlayer.isReady 
                      ? "bg-yellow-500 hover:bg-yellow-600 text-white" 
                      : "bg-indian-green hover:bg-green-700 text-white"
                    }
                  >
                    <i className={`fas ${currentPlayer.isReady ? "fa-pause" : "fa-check-circle"} mr-2`}></i>
                    {currentPlayer.isReady ? "Not Ready" : "Ready to Play"}
                  </Button>
                )}
                
                {isHost && (
                  <>
                    <Button
                      data-testid="button-start-game"
                      onClick={handleStartGame}
                      disabled={!allReady || !minPlayers}
                      className="bg-saffron hover:bg-orange-600 text-white px-8 py-3"
                    >
                      <i className="fas fa-play mr-2"></i>
                      Start Game
                    </Button>
                    {(!allReady || !minPlayers) && (
                      <p className="text-sm text-gray-500 self-center" data-testid="text-start-requirements">
                        {!minPlayers 
                          ? "Need at least 2 players to start" 
                          : "All players must be ready to start"
                        }
                      </p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-navy">How to Play</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Getting Started</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Each player starts with ₹15,000</li>
                    <li>• All players begin at the START position</li>
                    <li>• Collect ₹2,000 when passing START</li>
                    <li>• Take turns rolling dice and moving</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Winning Strategy</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Buy properties when you land on them</li>
                    <li>• Collect rent from other players</li>
                    <li>• Build houses and hotels for more rent</li>
                    <li>• Bankrupt your opponents to win!</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
