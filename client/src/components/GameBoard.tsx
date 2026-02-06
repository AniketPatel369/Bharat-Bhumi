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

  const canRollDice = !!(
    currentPlayer &&
    isMyTurn &&
    !isRolling &&
    !currentPlayer.hasRolledThisTurn &&
    !currentPlayer.pendingDoubleDecision &&
    !(currentPlayer.isInJail && currentPlayer.jailTurns > 0)
  );

  const canEndTurn = !!(
    currentPlayer &&
    isMyTurn &&
    currentPlayer.hasRolledThisTurn &&
    !currentPlayer.pendingDoubleDecision
  );

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
        className={`board-space ${isCorner ? 'board-corner' : sideClasses} ${className} cursor-pointer transition-colors`}
        style={owner ? { backgroundColor: `${owner.color}22`, borderColor: owner.color } : undefined}
        onClick={() => onPropertyClick(index)}
        data-testid={`property-${index}`}
      >
        {/* Color Bar - using reference structure */}
        {property.colorGroup && property.colorGroup !== 'special' && property.type !== 'special' && (
          <div className={`color-bar ${getColorGroupClass(property.colorGroup)}`} />
        )}

        <div className={`property-body ${rotationClass} ${property.type === 'special' ? 'property-body-special' : ''}`}>
          {property.type === 'special' && (
            <i className={`fas ${getSpecialIcon(property.name)} property-icon`} aria-hidden="true"></i>
          )}
          <div className="property-name">
            {property.name}
          </div>
          {property.price && !isCorner && (
            <div className="property-cost">
              ₹{property.price}
            </div>
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

        {owner?.hotelProperties?.includes(index) && (
          <div className="absolute top-1 left-1 text-xs" title="Hotel">
            <i className="fas fa-hotel text-indigo-700"></i>
          </div>
        )}

        {owner && Number(owner.buildingLevels?.[String(index)] || 0) > 0 && !owner.hotelProperties?.includes(index) && (
          <div className="absolute top-1 left-1 text-[10px] font-bold text-green-700" title="Houses">
            H{Number(owner.buildingLevels?.[String(index)] || 0)}
          </div>
        )}

        {owner?.mortgagedProperties?.includes(index) && (
          <div className="absolute bottom-1 right-1 text-[10px] font-bold text-red-700" title="Mortgaged">
            M
          </div>
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

  const bottomIndices = Array.from({ length: 9 }, (_, i) => i + 1);
  const leftIndices = Array.from({ length: 9 }, (_, i) => i + 11);
  const topIndices = Array.from({ length: 9 }, (_, i) => i + 21);
  const rightIndices = Array.from({ length: 9 }, (_, i) => i + 31);

  return (
    <div className="board-frame shadow-2xl">
      <div className="board-surface board-layout relative max-w-4xl mx-auto">
        <div className="board-corner-space corner-top-left">
          {renderPropertySpace(GAME_PROPERTIES[30], 30, "corner-space")}
        </div>
        <div className="board-corner-space corner-top-right">
          {renderPropertySpace(GAME_PROPERTIES[20], 20, "corner-space")}
        </div>
        <div className="board-corner-space corner-bottom-right">
          {renderPropertySpace(GAME_PROPERTIES[10], 10, "corner-space")}
        </div>
        <div className="board-corner-space corner-bottom-left">
          {renderPropertySpace(GAME_PROPERTIES[0], 0, "corner-space")}
        </div>

        <div className="board-side side-top">
          {topIndices.map((index) => renderPropertySpace(GAME_PROPERTIES[index], index))}
        </div>
        <div className="board-side side-right">
          {rightIndices.map((index) => renderPropertySpace(GAME_PROPERTIES[index], index))}
        </div>
        <div className="board-side side-bottom">
          {bottomIndices.map((index) => renderPropertySpace(GAME_PROPERTIES[index], index))}
        </div>
        <div className="board-side side-left">
          {leftIndices.map((index) => renderPropertySpace(GAME_PROPERTIES[index], index))}
        </div>

        <div className="board-center absolute inset-[var(--corner-size)] flex flex-col items-center justify-center text-white p-4">

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/90 text-navy rounded-lg px-3 py-2 text-xs font-semibold shadow" data-testid="center-chance-card">
              ❓ Chance Deck
            </div>
            <div className="bg-white/90 text-navy rounded-lg px-3 py-2 text-xs font-semibold shadow" data-testid="center-community-card">
              📦 Community Deck
            </div>
          </div>
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

          {isMyTurn && (
            <div className="space-y-2">
              <Button
                data-testid="button-roll-dice"
                onClick={onRollDice}
                disabled={!canRollDice}
                className={`bg-saffron hover:bg-orange-600 px-6 py-2 rounded-lg font-semibold transition-colors ${canRollDice ? "animate-jiggle" : ""}`}
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

              {canEndTurn && (
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
              {currentPlayer?.hasRolledThisTurn && !currentPlayer.pendingDoubleDecision && (
                <p className="text-[11px] opacity-80 max-w-[220px] text-center">
                  2-minute action window is active. Turn will auto-end if no actions are taken.
                </p>
              )}
            </div>
          )}

          {diceResult && (
            <div className="mt-4 text-center">
              <p className="text-sm opacity-75">Last Roll</p>
              <p className="text-lg font-bold" data-testid="text-dice-total">
                {diceResult.dice1 + diceResult.dice2}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
