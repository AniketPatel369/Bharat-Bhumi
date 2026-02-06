import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSocket } from "@/hooks/useSocket";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const landingAssets = {
    banner: "/src/assets/landing/banner.png",
    board: "/src/assets/landing/board-right.png",
    flag: "/src/assets/landing/icon-flag.png",
    cities: "/src/assets/landing/icon-cities.png",
    multiplayer: "/src/assets/landing/icon-multiplayer.png",
    currency: "/src/assets/landing/icon-currency.png",
  };

  const [, setLocation] = useLocation();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [startMoney, setStartMoney] = useState(15000);
  const [activeMode, setActiveMode] = useState<"create" | "join">("create");
  const { toast } = useToast();
  const { socket, isConnected } = useSocket();
  const createListenerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const joinListenerRef = useRef<((event: MessageEvent) => void) | null>(null);

  useEffect(() => {
    return () => {
      if (socket && createListenerRef.current) {
        socket.removeEventListener("message", createListenerRef.current);
      }
      if (socket && joinListenerRef.current) {
        socket.removeEventListener("message", joinListenerRef.current);
      }
    };
  }, [socket]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      toast({ title: "Error", description: "Please enter your name", variant: "destructive" });
      return;
    }

    if (!isConnected || !socket) {
      toast({ title: "Connection Error", description: "Not connected to server", variant: "destructive" });
      return;
    }

    socket.send(JSON.stringify({
      type: "createRoom",
      hostName: playerName.trim(),
      maxPlayers,
      startMoney,
    }));

    if (createListenerRef.current) {
      socket.removeEventListener("message", createListenerRef.current);
      createListenerRef.current = null;
    }

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === "roomCreated") {
        localStorage.setItem("playerId", data.playerId);
        localStorage.setItem("playerName", playerName.trim());
        setLocation(`/lobby/${data.room.code}`);
        socket.removeEventListener("message", handleMessage);
        createListenerRef.current = null;
      } else if (data.type === "error") {
        toast({ title: "Error", description: data.message, variant: "destructive" });
        socket.removeEventListener("message", handleMessage);
        createListenerRef.current = null;
      }
    };

    createListenerRef.current = handleMessage;
    socket.addEventListener("message", handleMessage);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      toast({ title: "Error", description: "Please enter your name", variant: "destructive" });
      return;
    }

    if (!roomCode.trim()) {
      toast({ title: "Error", description: "Please enter room code", variant: "destructive" });
      return;
    }

    if (!isConnected || !socket) {
      toast({ title: "Connection Error", description: "Not connected to server", variant: "destructive" });
      return;
    }

    socket.send(JSON.stringify({
      type: "joinRoom",
      roomCode: roomCode.trim().toUpperCase(),
      playerName: playerName.trim(),
    }));

    if (joinListenerRef.current) {
      socket.removeEventListener("message", joinListenerRef.current);
      joinListenerRef.current = null;
    }

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === "roomJoined") {
        localStorage.setItem("playerId", data.playerId);
        localStorage.setItem("playerName", playerName.trim());
        setLocation(`/lobby/${roomCode.trim().toUpperCase()}`);
        socket.removeEventListener("message", handleMessage);
        joinListenerRef.current = null;
      } else if (data.type === "error") {
        toast({ title: "Error", description: data.message, variant: "destructive" });
        socket.removeEventListener("message", handleMessage);
        joinListenerRef.current = null;
      }
    };

    joinListenerRef.current = handleMessage;
    socket.addEventListener("message", handleMessage);
  };

  return (
    <div className="landing-page min-h-screen py-8 px-4">
      <div className="mx-auto w-full max-w-[1320px] space-y-6">
        <div className="landing-banner rounded-[26px] px-6 py-8 md:px-10 md:py-9">
          <div className="flex items-center justify-between gap-4">
            <img
              src={landingAssets.flag}
              alt="Indian flag icon"
              className="landing-banner-icon h-12 w-12 md:h-16 md:w-16"
            />
            <div className="text-center flex-1">
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-[#173d97]">VYAAPAAR</h1>
              <p className="mt-2 text-xl md:text-4xl text-[#1f3970] font-semibold">Play the Indian Business Game</p>
            </div>
            <img
              src={landingAssets.banner}
              alt="Vyaapaar banner icon"
              className="landing-banner-icon h-12 w-12 md:h-16 md:w-16"
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
          <div className="landing-panel rounded-[28px] p-6 md:p-8 shadow-xl">
            <div className="mb-4 flex items-center gap-2 rounded-full bg-[#f5f8ff] p-1">
              <button
                className={`landing-mode-btn ${activeMode === "create" ? "active" : ""}`}
                onClick={() => setActiveMode("create")}
                data-testid="button-create-room"
              >
                Create Room
              </button>
              <button
                className={`landing-mode-btn ${activeMode === "join" ? "active" : ""}`}
                onClick={() => setActiveMode("join")}
                data-testid="button-join-room"
              >
                Join Room
              </button>
            </div>

            {activeMode === "create" ? (
              <div className="space-y-4">
                <h2 className="text-4xl font-extrabold text-[#173d97]">Create New Room</h2>
                <div>
                  <Label htmlFor="create-name" data-testid="label-player-name" className="text-lg text-[#344d78]">Your Name</Label>
                  <Input id="create-name" data-testid="input-player-name" value={playerName} onChange={(e)=>setPlayerName(e.target.value)} placeholder="Host" maxLength={20} className="landing-input" />
                </div>
                <div>
                  <Label htmlFor="max-players" data-testid="label-max-players" className="text-lg text-[#344d78]">Maximum Players</Label>
                  <select id="max-players" data-testid="select-max-players" value={maxPlayers} onChange={(e)=>setMaxPlayers(parseInt(e.target.value))} className="landing-input">
                    {[2,3,4,5,6,7,8].map((n)=> <option key={n} value={n}>{n} Players</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="start-money" data-testid="label-start-money" className="text-lg text-[#344d78]">Starting Money (Host decides)</Label>
                  <Input id="start-money" type="number" min={5000} max={50000} step={500} data-testid="input-start-money" value={startMoney} onChange={(e)=>setStartMoney(Math.max(5000, Math.min(50000, Number(e.target.value)||15000)))} className="landing-input" />
                </div>
                <Button data-testid="button-create-confirm" onClick={handleCreateRoom} disabled={!isConnected} className="landing-primary-btn w-full">Create Room</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-4xl font-extrabold text-[#173d97]">Join Existing Room</h2>
                <div>
                  <Label htmlFor="join-name" data-testid="label-join-name" className="text-lg text-[#344d78]">Your Name</Label>
                  <Input id="join-name" data-testid="input-join-name" value={playerName} onChange={(e)=>setPlayerName(e.target.value)} placeholder="Enter your name" maxLength={20} className="landing-input" />
                </div>
                <div>
                  <Label htmlFor="room-code" data-testid="label-room-code" className="text-lg text-[#344d78]">Room Code</Label>
                  <Input id="room-code" data-testid="input-room-code" value={roomCode} onChange={(e)=>setRoomCode(e.target.value.toUpperCase())} placeholder="ABCD12" maxLength={6} className="landing-input uppercase tracking-widest" />
                </div>
                <Button data-testid="button-join-confirm" onClick={handleJoinRoom} disabled={!isConnected} className="landing-primary-btn w-full">Join Room</Button>
              </div>
            )}

            <div className="mt-5 text-right text-lg font-medium text-[#2a466f]">
              <span className={`inline-block h-3 w-3 rounded-full mr-2 ${isConnected ? "bg-emerald-400" : "bg-red-400"}`}></span>
              {isConnected ? "Connected" : "Disconnected"}
            </div>
          </div>

          <div className="landing-panel rounded-[28px] p-3 md:p-4 shadow-xl">
            <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#fff8ea] via-[#fdfefe] to-[#e6f8f0] p-4 md:p-8 min-h-[420px]">
              <img
                src={landingAssets.board}
                alt="Bharat Bhumi board preview"
                className="landing-board-preview"
              />
              <div className="relative z-10 grid h-full place-items-center text-center px-6">
                <div>
                  <h3 className="text-6xl font-black text-[#173d97]">VYAAPAAR</h3>
                  <p className="mt-2 text-2xl text-[#2a4466] font-semibold">Play the Indian Business Game</p>
                  <div className="mx-auto mt-8 max-w-sm rounded-2xl bg-white/90 p-5 shadow-2xl">
                    <p className="text-2xl font-bold text-[#173d97]">Host</p>
                    <p className="mt-1 text-4xl font-extrabold text-[#1f3d6f]">₹{startMoney.toLocaleString()}</p>
                    <p className="mt-1 text-[#4e617f] text-lg">Waiting for Players...</p>
                    <Button className="mt-4 w-full rounded-full bg-[#5ecb53] hover:bg-[#45b43d] text-white text-xl font-bold py-6">Start Game</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="landing-feature">
            <img src={landingAssets.cities} alt="Indian Cities icon" className="landing-feature-icon" />
            <div>
              <h4>Indian Cities</h4>
              <p>Buy and trade famous Indian landmarks and cities</p>
            </div>
          </div>
          <div className="landing-feature">
            <img src={landingAssets.multiplayer} alt="Multiplayer icon" className="landing-feature-icon" />
            <div>
              <h4>Multiplayer</h4>
              <p>Play with up to 8 friends in real-time</p>
            </div>
          </div>
          <div className="landing-feature">
            <img src={landingAssets.currency} alt="Indian Currency icon" className="landing-feature-icon" />
            <div>
              <h4>Indian Currency</h4>
              <p>All transactions in Indian Rupees (₹)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
