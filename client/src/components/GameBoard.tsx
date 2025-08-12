import { Room, Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { GAME_PROPERTIES } from "@/lib/gameConstants";

interface GameBoardProps {
  room: Room;
  currentPlayer: Player | null;
  diceResult: {dice1: number, dice2: number} | null;
  isRolling: boolean;
  isMyTurn: boolean;
  onRollDice: () => void;
  onEndTurn: () => void;
  onPropertyClick: (propertyIndex: number) => void;
}

export default function GameBoard({
  room,
  currentPlayer,
  diceResult,
  isRolling,
  isMyTurn,
  onRollDice,
  onEndTurn,
  onPropertyClick
}: GameBoardProps) {
  const getDiceIcon = (value: number) => {
    const icons = ['', 'fa-dice-one', 'fa-dice-two', 'fa-dice-three', 'fa-dice-four', 'fa-dice-five', 'fa-dice-six'];
    return icons[value] || 'fa-dice';
  };

  const getPropertyOwner = (propertyIndex: number) => {
    return room.players.find(player => player.properties.includes(propertyIndex));
  };

  const renderPropertySpace = (property: typeof GAME_PROPERTIES[0], index: number, className: string = "") => {
    const owner = getPropertyOwner(index);
    const hasPlayers = room.players.some(player => player.position === index);
    const playersHere = room.players.filter(player => player.position === index);
    
    return (
      <div
        key={index}
        className={`board-space ${className} cursor-pointer hover:bg-gray-50 transition-colors relative`}
        onClick={() => onPropertyClick(index)}
        data-testid={`property-${index}`}
      >
        {/* Property Color Bar */}
        {property.colorGroup && property.colorGroup !== 'special' && (
          <div className={`property-color-bar ${getColorGroupClass(property.colorGroup)}`} />
        )}
        
        {/* Property Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center p-1">
          {property.type === 'special' ? (
            <>
              <i className={`fas ${getSpecialIcon(property.name)} text-lg mb-1`} />
              <span className="font-semibold text-xs">{property.name}</span>
              {property.name === 'START' && <span className="text-xs">₹2000</span>}
              {(property.name === 'Income Tax' || property.name === 'Super Tax') && (
                <span className="text-xs">₹{property.price || 0}</span>
              )}
            </>
          ) : (
            <>
              <span className="font-semibold text-xs">{property.name}</span>
              <span className="text-xs">₹{property.price?.toLocaleString()}</span>
            </>
          )}
        </div>

        {/* Owner Indicator */}
        {owner && (
          <div 
            className="absolute top-1 right-1 w-3 h-3 rounded-full border border-white"
            style={{ backgroundColor: owner.color }}
            title={`Owned by ${owner.name}`}
          />
        )}

        {/* Players on this space */}
        {hasPlayers && (
          <div className="absolute bottom-1 left-1 flex flex-wrap gap-0.5">
            {playersHere.map((player, playerIndex) => (
              <div
                key={player.id}
                className="player-token"
                style={{ 
                  backgroundColor: player.color,
                  zIndex: 10 + playerIndex
                }}
                title={player.name}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const getColorGroupClass = (colorGroup: string) => {
    const colorMap: Record<string, string> = {
      'brown': 'bg-amber-700',
      'lightblue': 'bg-sky-300',
      'pink': 'bg-pink-400',
      'orange': 'bg-orange-500',
      'red': 'bg-red-500',
      'yellow': 'bg-yellow-400',
      'green': 'bg-green-500',
      'darkblue': 'bg-blue-700',
      'railroad': 'bg-gray-700',
      'utility': 'bg-yellow-300',
    };
    return colorMap[colorGroup] || 'bg-gray-400';
  };

  const getSpecialIcon = (name: string) => {
    const iconMap: Record<string, string> = {
      'START': 'fa-flag-checkered',
      'JAIL': 'fa-lock',
      'FREE PARKING': 'fa-car',
      'GO TO JAIL': 'fa-hand-point-right',
      'Chance': 'fa-dice',
      'Community Chest': 'fa-question-circle',
      'Income Tax': 'fa-coins',
      'Super Tax': 'fa-coins',
      'Electric Company': 'fa-lightbulb',
      'Water Works': 'fa-tint'
    };
    return iconMap[name] || 'fa-building';
  };

  // Arrange properties in board layout (11x11 grid)
  const arrangeProperties = () => {
    const arranged: (typeof GAME_PROPERTIES[0] | null)[][] = Array(11).fill(null).map(() => Array(11).fill(null));
    
    // Bottom row (START to JAIL)
    for (let i = 0; i <= 10; i++) {
      arranged[10][i] = GAME_PROPERTIES[i];
    }
    
    // Right column (excluding corners)
    for (let i = 1; i <= 9; i++) {
      arranged[10-i][10] = GAME_PROPERTIES[10 + i];
    }
    
    // Top row (FREE PARKING to GO TO JAIL)
    for (let i = 1; i <= 9; i++) {
      arranged[0][10-i] = GAME_PROPERTIES[20 + i];
    }
    
    // Left column (excluding corners)
    for (let i = 1; i <= 9; i++) {
      arranged[i][0] = GAME_PROPERTIES[30 + i];
    }
    
    return arranged;
  };

  const boardLayout = arrangeProperties();

  return (
    <div className="bg-forest-green p-4 rounded-xl shadow-2xl">
      <div className="aspect-square bg-cream rounded-lg p-2 relative max-w-4xl mx-auto">
        {/* Board Grid */}
        <div className="grid grid-cols-11 grid-rows-11 h-full gap-0.5">
          {boardLayout.map((row, rowIndex) =>
            row.map((property, colIndex) => {
              if (!property) {
                // Center area
                if (rowIndex >= 2 && rowIndex <= 8 && colIndex >= 2 && colIndex <= 8) {
                  if (rowIndex === 5 && colIndex === 5) {
                    // Center board area - only render once
                    return (
                      <div
                        key={`center-${rowIndex}-${colIndex}`}
                        className="col-span-7 row-span-7 bg-navy rounded-lg flex flex-col items-center justify-center text-white p-4 relative"
                      >
                        {/* Game Logo */}
                        <div className="text-center mb-6">
                          <h1 className="text-2xl md:text-4xl font-bold text-saffron mb-2">VYAPAAR</h1>
                          <p className="text-sm md:text-lg opacity-90">Indian Monopoly Game</p>
                        </div>
                        
                        {/* Dice Section */}
                        <div className="flex items-center space-x-4 mb-6">
                          <div 
                            className={`w-12 h-12 bg-white rounded-lg flex items-center justify-center text-navy text-xl font-bold shadow-lg ${isRolling ? 'animate-dice-roll' : ''}`}
                            data-testid="dice-1"
                          >
                            <i className={`fas ${diceResult ? getDiceIcon(diceResult.dice1) : 'fa-dice'}`}></i>
                          </div>
                          <div 
                            className={`w-12 h-12 bg-white rounded-lg flex items-center justify-center text-navy text-xl font-bold shadow-lg ${isRolling ? 'animate-dice-roll' : ''}`}
                            data-testid="dice-2"
                          >
                            <i className={`fas ${diceResult ? getDiceIcon(diceResult.dice2) : 'fa-dice'}`}></i>
                          </div>
                        </div>
                        
                        {/* Current Player Turn */}
                        {currentPlayer && (
                          <div className="text-center mb-4">
                            <p className="text-sm opacity-75 mb-2">
                              {isMyTurn ? "Your Turn" : "Current Turn"}
                            </p>
                            <div className="flex items-center justify-center space-x-2">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                style={{ backgroundColor: room.players[room.currentPlayerIndex].color }}
                              >
                                {room.players[room.currentPlayerIndex].avatar}
                              </div>
                              <span className="font-semibold">
                                {isMyTurn ? "You" : room.players[room.currentPlayerIndex].name}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        {isMyTurn && (
                          <div className="space-y-2">
                            <Button
                              data-testid="button-roll-dice"
                              onClick={onRollDice}
                              disabled={isRolling}
                              className="bg-saffron hover:bg-orange-600 px-6 py-2 rounded-lg font-semibold transition-colors"
                            >
                              {isRolling ? (
                                <>
                                  <i className="fas fa-spinner animate-spin mr-2"></i>
                                  Rolling...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-dice mr-2"></i>
                                  Roll Dice
                                </>
                              )}
                            </Button>
                            
                            {diceResult && (
                              <Button
                                data-testid="button-end-turn"
                                onClick={onEndTurn}
                                variant="outline"
                                className="w-full"
                              >
                                <i className="fas fa-forward mr-2"></i>
                                End Turn
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {/* Dice Result Display */}
                        {diceResult && (
                          <div className="mt-4 text-center">
                            <p className="text-sm opacity-75">Last Roll</p>
                            <p className="text-lg font-bold" data-testid="text-dice-total">
                              {diceResult.dice1 + diceResult.dice2}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null; // Other center grid cells are covered by the span
                }
                return <div key={`empty-${rowIndex}-${colIndex}`} />;
              }

              // Calculate property index
              const propertyIndex = GAME_PROPERTIES.findIndex(p => p.id === property.id);
              
              // Determine if it's a corner
              const isCorner = (rowIndex === 0 || rowIndex === 10) && (colIndex === 0 || colIndex === 10);
              const cornerClass = isCorner ? 'board-corner' : '';
              
              // Add rotation for side properties
              let rotationClass = '';
              if (rowIndex === 0 && colIndex !== 0 && colIndex !== 10) {
                // Top row - no rotation needed
              } else if (rowIndex === 10 && colIndex !== 0 && colIndex !== 10) {
                // Bottom row - no rotation needed
              } else if (colIndex === 0 && rowIndex !== 0 && rowIndex !== 10) {
                // Left side - rotate 90 degrees
                rotationClass = 'transform rotate-90';
              } else if (colIndex === 10 && rowIndex !== 0 && rowIndex !== 10) {
                // Right side - rotate -90 degrees
                rotationClass = 'transform -rotate-90';
              }

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`${cornerClass} ${rotationClass}`}
                >
                  {renderPropertySpace(property, propertyIndex)}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
