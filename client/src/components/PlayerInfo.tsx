import { Room, Player } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GAME_PROPERTIES } from "@/lib/gameConstants";

interface PlayerInfoProps {
  room: Room;
  currentPlayer: Player | null;
  isMyTurn: boolean;
  onRollDice: () => void;
  onEndTurn: () => void;
  isRolling: boolean;
  testIdPrefix?: string;
}

export default function PlayerInfo({
  room,
  currentPlayer,
  isMyTurn,
  onRollDice,
  onEndTurn,
  isRolling,
  testIdPrefix = "sidebar"
}: PlayerInfoProps) {
  if (!currentPlayer) return null;

  const getPropertyName = (propertyIndex: number) => {
    return GAME_PROPERTIES[propertyIndex]?.name || `Property ${propertyIndex}`;
  };

  const getPropertyValue = (propertyIndex: number) => {
    return GAME_PROPERTIES[propertyIndex]?.price || 0;
  };

  const totalPropertyValue = currentPlayer.properties.reduce((total, propIndex) => {
    return total + getPropertyValue(propIndex);
  }, 0);

  const gameStats = {
    turnNumber: room.turnNumber,
    gameTime: Math.floor((Date.now() - new Date(room.createdAt).getTime()) / 1000 / 60), // minutes
  };

  return (
    <div className="space-y-4">
      {/* Current Player Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-navy flex items-center">
            <i className="fas fa-user mr-2"></i>
            Your Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
              style={{ backgroundColor: currentPlayer.color }}
              data-testid="player-avatar"
            >
              {currentPlayer.avatar}
            </div>
            <div>
              <p className="font-semibold" data-testid="text-player-name">{currentPlayer.name}</p>
              <p className="text-sm text-gray-500">
                {isMyTurn ? "Your Turn" : "Waiting"}
              </p>
            </div>
          </div>
          
          <div className="bg-indian-green text-white p-3 rounded-lg text-center">
            <p className="text-sm opacity-90">Cash Balance</p>
            <p className="text-2xl font-bold" data-testid="text-player-balance">
              ₹{currentPlayer.money.toLocaleString()}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button
              data-testid={`button-roll-dice-${testIdPrefix}`}
              onClick={onRollDice}
              disabled={!isMyTurn || isRolling || currentPlayer.hasRolledThisTurn || currentPlayer.pendingDoubleDecision || (currentPlayer.isInJail && currentPlayer.jailTurns > 0)}
              className="w-full bg-saffron hover:bg-orange-600 text-white"
            >
              <i className={`fas ${isRolling ? 'fa-spinner animate-spin' : 'fa-dice'} mr-2`}></i>
              {isRolling ? 'Rolling...' : 'Roll Dice'}
            </Button>
            
            <Button
              data-testid={`button-end-turn-${testIdPrefix}`}
              onClick={onEndTurn}
              disabled={!isMyTurn || !currentPlayer.hasRolledThisTurn || currentPlayer.pendingDoubleDecision}
              variant="outline"
              className="w-full"
            >
              <i className="fas fa-forward mr-2"></i>
              End Turn
            </Button>
          </div>
          {isMyTurn && currentPlayer.hasRolledThisTurn && !currentPlayer.pendingDoubleDecision && (
            <p className="text-xs text-gray-500 text-center">
              You have 2 minutes after rolling to make actions, then your turn auto-ends.
            </p>
          )}

          {/* Properties Owned */}
          {currentPlayer.properties.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-dark-slate mb-3 flex items-center">
                <i className="fas fa-building mr-2"></i>
                Properties Owned ({currentPlayer.properties.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {currentPlayer.properties.map((propIndex) => (
                  <div key={propIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium" data-testid={`property-owned-${propIndex}`}>
                      {getPropertyName(propIndex)}
                    </span>
                    <span className="text-green-600 font-semibold">
                      ₹{getPropertyValue(propIndex).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-navy flex items-center">
            <i className="fas fa-chart-bar mr-2"></i>
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Properties Owned</span>
            <span className="font-semibold" data-testid="text-properties-count">
              {currentPlayer.properties.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Property Value</span>
            <span className="font-semibold" data-testid="text-total-property-value">
              ₹{totalPropertyValue.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Net Worth</span>
            <span className="font-semibold text-green-600" data-testid="text-net-worth">
              ₹{(currentPlayer.money + totalPropertyValue).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Position</span>
            <span className="font-semibold" data-testid="text-player-position">
              {getPropertyName(currentPlayer.position)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* All Players */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-navy flex items-center">
            <i className="fas fa-users mr-2"></i>
            All Players
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {room.players.map((player) => {
              const isCurrentTurn = room.players[room.currentPlayerIndex].id === player.id;
              const playerPropertyValue = player.properties.reduce((total, propIndex) => {
                return total + getPropertyValue(propIndex);
              }, 0);
              
              return (
                <div 
                  key={player.id}
                  className={`flex items-center justify-between p-2 rounded-lg border ${
                    isCurrentTurn ? 'border-saffron bg-orange-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.avatar}
                    </div>
                    <div>
                      <span className="font-semibold text-sm" data-testid={`text-player-list-name-${player.name}`}>
                        {player.name}
                        {player.id === currentPlayer.id && " (You)"}
                      </span>
                      {isCurrentTurn && (
                        <Badge variant="outline" className="ml-2 text-xs bg-saffron text-white">
                          Turn
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm" data-testid={`text-player-money-${player.name}`}>
                      ₹{player.money.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Net: ₹{(player.money + playerPropertyValue).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Game Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-navy flex items-center">
            <i className="fas fa-clock mr-2"></i>
            Game Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xl font-bold text-saffron" data-testid="text-turn-number">
                {gameStats.turnNumber}
              </div>
              <div className="text-xs text-gray-600">Turn Number</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xl font-bold text-indian-green" data-testid="text-game-time">
                {gameStats.gameTime}m
              </div>
              <div className="text-xs text-gray-600">Game Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-navy flex items-center">
            <i className="fas fa-university mr-2"></i>
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full text-sm"
            disabled
            data-testid="button-mortgage-property"
          >
            <i className="fas fa-home mr-2"></i>
            Mortgage Property
          </Button>
          <Button 
            variant="outline" 
            className="w-full text-sm"
            disabled
            data-testid="button-trade-player"
          >
            <i className="fas fa-exchange-alt mr-2"></i>
            Trade with Player
          </Button>
          <Button 
            variant="outline" 
            className="w-full text-sm"
            disabled
            data-testid="button-build-houses"
          >
            <i className="fas fa-hammer mr-2"></i>
            Build Houses
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
