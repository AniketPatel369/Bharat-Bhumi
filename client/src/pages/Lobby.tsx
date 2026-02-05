import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  const [selectedColor, setSelectedColor] = useState("");
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();

  const playerColors = [
    { name: "Red", value: "#EF4444", bg: "bg-red-500" },
    { name: "Blue", value: "#3B82F6", bg: "bg-blue-500" },
    { name: "Green", value: "#22C55E", bg: "bg-green-500" },
    { name: "Purple", value: "#A855F7", bg: "bg-purple-500" },
    { name: "Orange", value: "#F97316", bg: "bg-orange-500" },
    { name: "Pink", value: "#EC4899", bg: "bg-pink-500" },
    { name: "Cyan", value: "#06B6D4", bg: "bg-cyan-500" },
    { name: "Yellow", value: "#EAB308", bg: "bg-yellow-500" },
  ];

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'roomJoined':
        case 'playerJoined':
        case 'playerReadyChanged':
        case 'playerDisconnected':
        case 'playerColorChanged':
        case 'playerKicked':
          setRoom(data.room);
          // Update current player if this is our player data
          const playerId = localStorage.getItem('playerId');
          if (playerId && data.room) {
            const player = data.room.players.find((p: Player) => p.id === playerId);
            if (player) {
              setCurrentPlayer(player);
              if (player.color && !selectedColor) {
                setSelectedColor(player.color);
              }
            }
          }
          break;
          
        case 'gameStarted':
          setLocation(`/game/${roomCode}`);
          break;
          
        case 'kicked':
          toast({
            title: "Kicked from Room",
            description: "You have been removed from the room by the host",
            variant: "destructive",
          });
          localStorage.removeItem('playerId');
          localStorage.removeItem('playerName');
          setTimeout(() => setLocation('/'), 2000);
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

  // Helper functions for actions
  const handleColorChange = (color: string) => {
    if (!socket || !currentPlayer || selectedColor === color) return;
    
    socket.send(JSON.stringify({
      type: 'changeColor',
      playerId: currentPlayer.id,
      color: color
    }));
    setSelectedColor(color);
  };

  const handleKickPlayer = (playerToKickId: string) => {
    if (!socket || !currentPlayer) return;
    
    socket.send(JSON.stringify({
      type: 'kickPlayer',
      hostId: currentPlayer.id,
      playerToKickId: playerToKickId
    }));
  };

  // Get available colors (not already taken by other players)
  const getAvailableColors = () => {
    if (!room) return playerColors;
    
    const usedColors = room.players
      .filter(p => p.id !== currentPlayer?.id && p.color)
      .map(p => p.color);
    
    return playerColors.filter(color => !usedColors.includes(color.value));
  };

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
    if (!socket || !currentPlayer) return;

    socket.send(JSON.stringify({
      type: 'startGame',
      hostId: currentPlayer.id
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
                    {room.players.map((player, index) => (
                      <div key={player.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              !player.color ? 'bg-gray-400' : ''
                            }`}
                            style={{ backgroundColor: player.color || '#9CA3AF' }}
                            data-testid={`player-token-${player.name}`}
                          >
                            {player.avatar}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold" data-testid={`text-player-name-${player.name}`}>
                                {player.name}
                              </span>
                              {player.id === room.hostId && (
                                <Badge variant="secondary">Host</Badge>
                              )}
                              {player.id === currentPlayer?.id && (
                                <Badge variant="outline">You</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {!player.isConnected ? "Disconnected" : 
                               !player.color ? "Choose a color" :
                               player.isReady ? "Ready to play!" : "Not ready"
                              }
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {player.isConnected && player.color && (
                            <Badge
                              variant={player.isReady ? "default" : "outline"}
                              className={player.isReady ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                              data-testid={`status-ready-${player.name}`}
                            >
                              {player.isReady ? "Ready" : "Not Ready"}
                            </Badge>
                          )}
                          {player.id === currentPlayer?.id && player.color && (
                            <Button
                              onClick={handleToggleReady}
                              size="sm"
                              variant={currentPlayer.isReady ? "outline" : "default"}
                              className={currentPlayer.isReady ? "hover:bg-red-50" : "bg-green-600 hover:bg-green-700"}
                              data-testid="button-toggle-ready"
                            >
                              {currentPlayer.isReady ? "Not Ready" : "Ready Up"}
                            </Button>
                          )}
                          {isHost && player.id !== currentPlayer?.id && (
                            <Button
                              onClick={() => handleKickPlayer(player.id)}
                              size="sm"
                              variant="destructive"
                              data-testid={`button-kick-${index}`}
                            >
                              Kick
                            </Button>
                          )}
                        </div>
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
                
                {/* Color Selection & Game Controls */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-dark-slate">Your Settings</h3>
                  <div className="space-y-4">
                    {/* Color Selection for Current Player */}
                    {currentPlayer && !currentPlayer.color && (
                      <div className="bg-white p-5 rounded-xl border-2 border-saffron shadow-sm">
                        <Label className="text-sm font-semibold mb-4 block">Choose Your Color</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {getAvailableColors().map((color) => (
                            <button
                              key={color.value}
                              onClick={() => handleColorChange(color.value)}
                              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-3 py-4 transition-all ${
                                selectedColor === color.value
                                  ? "border-navy ring-2 ring-saffron/70 scale-105"
                                  : "border-gray-200 hover:border-gray-400"
                              }`}
                              title={color.name}
                              data-testid={`button-select-color-${color.name.toLowerCase()}`}
                            >
                              <span className={`w-10 h-10 rounded-full ${color.bg} shadow-inner border border-white`} />
                              <span className="text-xs font-semibold text-gray-700">{color.name}</span>
                            </button>
                          ))}
                        </div>
                        {getAvailableColors().length === 0 && (
                          <p className="text-sm text-gray-500 mt-2">No available colors. Please wait for other players to choose.</p>
                        )}
                      </div>
                    )}

                    {/* Game Settings Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Room Code</p>
                      <p className="font-mono text-xl font-bold text-navy" data-testid="text-room-code-detail">{room.code}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Starting Money</p>
                      <p className="font-semibold text-lg">₹{room.startMoney.toLocaleString()}</p>
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
              <div className="mt-8 text-center">
                <div className="flex justify-center gap-4">
                  {isHost ? (
                    <Button
                      onClick={handleStartGame}
                      disabled={!allReady || !minPlayers || !room.players.every(p => p.color)}
                      size="lg"
                      className="bg-saffron hover:bg-orange-600 text-white px-10 py-6 text-lg shadow-xl ring-2 ring-saffron/40"
                      data-testid="button-start-game"
                    >
                      <i className="fas fa-play mr-2"></i>
                      Start Game
                    </Button>
                  ) : (
                    currentPlayer && currentPlayer.color && (
                      <Button
                        onClick={handleToggleReady}
                        variant={currentPlayer.isReady ? "destructive" : "default"}
                        size="lg"
                        className={currentPlayer.isReady ? "" : "bg-green-600 hover:bg-green-700"}
                        data-testid="button-player-ready"
                      >
                        <i className={`fas ${currentPlayer.isReady ? 'fa-times' : 'fa-check'} mr-2`}></i>
                        {currentPlayer.isReady ? "Not Ready" : "Ready Up"}
                      </Button>
                    )
                  )}
                </div>
                
                {/* Status Messages */}
                <div className="mt-4 text-sm text-gray-600">
                  {isHost && !minPlayers && (
                    <p data-testid="message-min-players">Need at least 2 players to start</p>
                  )}
                  {isHost && minPlayers && !room.players.every(p => p.color) && (
                    <p data-testid="message-choose-colors">All players must choose colors first</p>
                  )}
                  {isHost && minPlayers && room.players.every(p => p.color) && !allReady && (
                    <p data-testid="message-waiting-players">Waiting for all players to be ready...</p>
                  )}
                  {!isHost && currentPlayer && !currentPlayer.color && (
                    <p data-testid="message-choose-color">Please choose your color first</p>
                  )}
                  {!isHost && currentPlayer && currentPlayer.color && (
                    <p data-testid="message-waiting-host">Waiting for host to start the game...</p>
                  )}
                </div>
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
                    <li>• Each player starts with host-defined money</li>
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
