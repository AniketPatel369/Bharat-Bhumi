import { Room, Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { GAME_PROPERTIES } from "@/lib/gameConstants";

interface GameBoardProps {
  room: Room;
  currentPlayer: Player | null;
  diceResult: { dice1: number, dice2: number } | null;
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


  // Helper functions to determine classes based on position
  const getSideClasses = (index: number): string => {
    if (index >= 1 && index <= 9) return 'horizontal bottom';
    if (index >= 11 && index <= 19) return 'vertical left';
    if (index >= 21 && index <= 29) return 'horizontal top';
    if (index >= 31 && index <= 39) return 'vertical right';
    return '';
  };

  const getRotationClass = (index: number): string => {
    if (index >= 1 && index <= 9) return ''; // Bottom - no rotation
    if (index >= 11 && index <= 19) return 'rotate90'; // Left
    if (index >= 21 && index <= 29) return 'rotate180'; // Top
    if (index >= 31 && index <= 39) return 'rotate270'; // Right
    return '';
  };

  const getCostPositionStyle = (index: number) => {
    if (index >= 1 && index <= 9) return { marginTop: '145%' };
    if (index >= 21 && index <= 29) return { marginBottom: '140%' };
    if (index >= 11 && index <= 19) return { left: '5px' };
    if (index >= 31 && index <= 39) return { right: '5px' };
    return {};
  };

  const getNamePositionStyle = (index: number) => {
    if (index >= 1 && index <= 9) return { marginTop: '-50%' };
    if (index >= 21 && index <= 29) return { marginBottom: '-50%' };
    if (index >= 11 && index <= 19) return { right: '30px' };
    if (index >= 31 && index <= 39) return { left: '30px' };
    return {};
  };

  const renderPropertySpace = (property: typeof GAME_PROPERTIES[0], index: number, className: string = "") => {
    const owner = getPropertyOwner(index);
    const hasPlayers = room.players.some(player => player.position === index);
    const playersHere = room.players.filter(player => player.position === index);

    // Determine if this is a corner square
    const isCorner = property.type === 'special' &&
      (property.name === 'START' || property.name === 'JAIL' ||
        property.name === 'FREE PARKING' || property.name === 'GO TO JAIL');

    const sideClasses = !isCorner ? getSideClasses(index) : '';
    const rotationClass = !isCorner ? getRotationClass(index) : '';

    return (
      <div
        key={index}
        className={`board-space ${isCorner ? 'board-corner' : sideClasses} ${className} cursor-pointer hover:bg-gray-50 transition-colors`}
        onClick={() => onPropertyClick(index)}
        data-testid={`property-${index}`}
      >
        {/* Color Bar - using reference structure */}
        {property.colorGroup && property.colorGroup !== 'special' && property.type !== 'special' && (
          <div className={`color-bar ${getColorGroupClass(property.colorGroup)}`} />
        )}

        {/* Property Cost - with rotation class */}
        {property.price && !isCorner && (
          <div
            className={`property-cost ${rotationClass}`}
            style={getCostPositionStyle(index)}
          >
            {property.price}
          </div>
        )}

        {/* Property Name - with rotation class */}
        <div
          className={`property-name ${rotationClass}`}
          style={getNamePositionStyle(index)}
        >
          {property.name}
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
      arranged[10 - i][10] = GAME_PROPERTIES[10 + i];
    }

    // Top row (FREE PARKING to GO TO JAIL)
    for (let i = 1; i <= 9; i++) {
      arranged[0][10 - i] = GAME_PROPERTIES[20 + i];
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
                // Center area - only render the center div once at position (2,2)
                if (rowIndex === 2 && colIndex === 2) {
                  // Center board area spanning 7x7 grid cells
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
                // Skip all other center cells - they're covered by the col-span-7 row-span-7
                if (rowIndex >= 2 && rowIndex <= 8 && colIndex >= 2 && colIndex <= 8) {
                  return null;
                }
                // Empty corner cells
                return <div key={`empty-${rowIndex}-${colIndex}`} />;
              }

              // Calculate property index
              const propertyIndex = GAME_PROPERTIES.findIndex(p => p.id === property.id);

              return (
                <div key={`${rowIndex}-${colIndex}`}>
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
