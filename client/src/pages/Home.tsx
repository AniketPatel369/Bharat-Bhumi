import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSocket } from "@/hooks/useSocket";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const { toast } = useToast();
  const { socket, isConnected } = useSocket();

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

  const [selectedColor, setSelectedColor] = useState(playerColors[0]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected || !socket) {
      toast({
        title: "Connection Error",
        description: "Not connected to server",
        variant: "destructive",
      });
      return;
    }

    socket.send(JSON.stringify({
      type: 'createRoom',
      hostName: playerName.trim(),
      hostColor: selectedColor.value,
      hostAvatar: selectedColor.name.charAt(0),
      maxPlayers: maxPlayers
    }));

    // Listen for room creation response
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'roomCreated') {
        localStorage.setItem('playerId', data.playerId);
        localStorage.setItem('playerName', playerName.trim());
        setLocation(`/lobby/${data.room.code}`);
        socket.removeEventListener('message', handleMessage);
      } else if (data.type === 'error') {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
        socket.removeEventListener('message', handleMessage);
      }
    };

    socket.addEventListener('message', handleMessage);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    if (!roomCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter room code",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected || !socket) {
      toast({
        title: "Connection Error",
        description: "Not connected to server",
        variant: "destructive",
      });
      return;
    }

    socket.send(JSON.stringify({
      type: 'joinRoom',
      roomCode: roomCode.trim().toUpperCase(),
      playerName: playerName.trim(),
      playerColor: selectedColor.value,
      playerAvatar: selectedColor.name.charAt(0)
    }));

    // Listen for room join response
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'roomJoined') {
        localStorage.setItem('playerId', data.playerId);
        localStorage.setItem('playerName', playerName.trim());
        setLocation(`/lobby/${roomCode.trim().toUpperCase()}`);
        socket.removeEventListener('message', handleMessage);
      } else if (data.type === 'error') {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
        socket.removeEventListener('message', handleMessage);
      }
    };

    socket.addEventListener('message', handleMessage);
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-saffron via-white to-indian-green p-8 rounded-xl shadow-2xl mb-8">
            <h1 className="text-5xl md:text-6xl font-bold navy mb-4">VYAPAAR</h1>
            <p className="text-xl dark-slate mb-8">Experience the Classic Indian Monopoly Game</p>
            
            {!showCreateForm && !showJoinForm && (
              <div className="grid md:grid-cols-2 gap-6">
                <Button
                  data-testid="button-create-room"
                  onClick={() => setShowCreateForm(true)}
                  className="bg-saffron hover:bg-orange-600 text-white font-semibold py-6 px-8 rounded-xl text-lg shadow-lg transition-all transform hover:scale-105"
                >
                  <i className="fas fa-plus-circle mb-2 text-2xl block"></i>
                  Create New Room
                </Button>
                <Button
                  data-testid="button-join-room"
                  onClick={() => setShowJoinForm(true)}
                  className="bg-indian-green hover:bg-green-700 text-white font-semibold py-6 px-8 rounded-xl text-lg shadow-lg transition-all transform hover:scale-105"
                >
                  <i className="fas fa-sign-in-alt mb-2 text-2xl block"></i>
                  Join Existing Room
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Create Room Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl text-navy flex items-center">
                <i className="fas fa-plus-circle mr-2"></i>
                Create New Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="create-name" data-testid="label-player-name">Your Name</Label>
                <Input
                  id="create-name"
                  data-testid="input-player-name"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                />
              </div>
              
              <div>
                <Label htmlFor="max-players" data-testid="label-max-players">Maximum Players</Label>
                <select
                  id="max-players"
                  data-testid="select-max-players"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value={2}>2 Players</option>
                  <option value={3}>3 Players</option>
                  <option value={4}>4 Players</option>
                  <option value={5}>5 Players</option>
                  <option value={6}>6 Players</option>
                  <option value={7}>7 Players</option>
                  <option value={8}>8 Players</option>
                </select>
              </div>

              <div>
                <Label data-testid="label-player-color">Choose Your Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {playerColors.map((color) => (
                    <button
                      key={color.value}
                      data-testid={`button-color-${color.name.toLowerCase()}`}
                      onClick={() => setSelectedColor(color)}
                      className={`w-12 h-12 rounded-full border-4 ${color.bg} transition-all ${
                        selectedColor.value === color.value
                          ? "border-navy scale-110"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  data-testid="button-create-confirm"
                  onClick={handleCreateRoom}
                  disabled={!isConnected}
                  className="bg-saffron hover:bg-orange-600 text-white flex-1"
                >
                  Create Room
                </Button>
                <Button
                  data-testid="button-create-cancel"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Join Room Form */}
        {showJoinForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl text-navy flex items-center">
                <i className="fas fa-sign-in-alt mr-2"></i>
                Join Existing Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="join-name" data-testid="label-join-name">Your Name</Label>
                <Input
                  id="join-name"
                  data-testid="input-join-name"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                />
              </div>
              
              <div>
                <Label htmlFor="room-code" data-testid="label-room-code">Room Code</Label>
                <Input
                  id="room-code"
                  data-testid="input-room-code"
                  placeholder="Enter 6-digit room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>
              
              <div>
                <Label data-testid="label-join-color">Choose Your Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {playerColors.map((color) => (
                    <button
                      key={color.value}
                      data-testid={`button-join-color-${color.name.toLowerCase()}`}
                      onClick={() => setSelectedColor(color)}
                      className={`w-12 h-12 rounded-full border-4 ${color.bg} transition-all ${
                        selectedColor.value === color.value
                          ? "border-navy scale-110"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  data-testid="button-join-confirm"
                  onClick={handleJoinRoom}
                  disabled={!isConnected}
                  className="bg-indian-green hover:bg-green-700 text-white flex-1"
                >
                  Join Room
                </Button>
                <Button
                  data-testid="button-join-cancel"
                  variant="outline"
                  onClick={() => setShowJoinForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connection Status */}
        <div className="text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            isConnected 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`} />
            {isConnected ? "Connected" : "Connecting..."}
          </div>
        </div>

        {/* Features showcase */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <i className="fas fa-map-marked-alt text-saffron text-3xl mb-4"></i>
            <h3 className="font-semibold text-lg mb-2">Indian Cities</h3>
            <p className="text-gray-600">Buy and trade famous Indian landmarks and cities</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <i className="fas fa-users text-indian-green text-3xl mb-4"></i>
            <h3 className="font-semibold text-lg mb-2">Multiplayer</h3>
            <p className="text-gray-600">Play with up to 8 friends in real-time</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <i className="fas fa-rupee-sign navy text-3xl mb-4"></i>
            <h3 className="font-semibold text-lg mb-2">Indian Currency</h3>
            <p className="text-gray-600">All transactions in Indian Rupees (₹)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
