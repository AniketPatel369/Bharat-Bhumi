import { Room, Player } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GAME_PROPERTIES } from "@/lib/gameConstants";

interface PropertyModalProps {
  show: boolean;
  propertyIndex: number | null;
  room: Room | null;
  currentPlayer: Player | null;
  onBuy: (propertyIndex: number, price: number) => void;
  onClose: () => void;
}

export default function PropertyModal({
  show,
  propertyIndex,
  room,
  currentPlayer,
  onBuy,
  onClose
}: PropertyModalProps) {
  if (!show || propertyIndex === null || !room || !currentPlayer) {
    return null;
  }

  const property = GAME_PROPERTIES[propertyIndex];
  if (!property) {
    return null;
  }

  const owner = room.players.find(player => player.properties.includes(propertyIndex));
  const canBuy = !owner && 
                 property.type !== 'special' && 
                 property.price && 
                 currentPlayer.money >= property.price;

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

  const handleBuy = () => {
    if (property.price) {
      onBuy(propertyIndex, property.price);
    }
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="property-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            {property.colorGroup && property.colorGroup !== 'special' && (
              <div className={`w-6 h-6 rounded ${getColorGroupClass(property.colorGroup)}`} />
            )}
            <div>
              <h3 className="text-xl font-bold text-navy" data-testid="property-name">
                {property.name}
              </h3>
              {property.colorGroup && property.colorGroup !== 'special' && (
                <p className="text-sm text-gray-600 capitalize">
                  {property.colorGroup} Property Group
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Property Status */}
          <div className="text-center">
            {owner ? (
              <div>
                <Badge variant="outline" className="mb-2">Owned</Badge>
                <p className="text-sm text-gray-600">
                  Owned by <span className="font-semibold">{owner.name}</span>
                </p>
              </div>
            ) : property.type === 'special' ? (
              <Badge variant="outline">Special Space</Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800">Available for Purchase</Badge>
            )}
          </div>

          {/* Property Details */}
          {property.type !== 'special' && property.price && (
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-navy mb-2" data-testid="property-price">
                  ₹{property.price.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">Purchase Price</p>
              </div>

              {property.rent && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-navy">Rent Information</h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Base Rent:</span>
                      <span className="font-semibold" data-testid="property-rent-base">
                        ₹{property.rent[0]?.toLocaleString() || 0}
                      </span>
                    </div>
                    {property.type === 'property' && (
                      <>
                        <div className="flex justify-between">
                          <span>With Color Group:</span>
                          <span className="font-semibold">
                            ₹{(property.rent[0] * 2)?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>With 1 House:</span>
                          <span className="font-semibold">
                            ₹{property.rent[1]?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>With 2 Houses:</span>
                          <span className="font-semibold">
                            ₹{property.rent[2]?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>With 3 Houses:</span>
                          <span className="font-semibold">
                            ₹{property.rent[3]?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>With 4 Houses:</span>
                          <span className="font-semibold">
                            ₹{property.rent[4]?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>With Hotel:</span>
                          <span className="font-semibold">
                            ₹{property.rent[5]?.toLocaleString() || 0}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {property.type === 'property' && property.houseCost && (
                    <div className="bg-blue-50 rounded-lg p-3 text-sm">
                      <div className="flex justify-between">
                        <span>House Cost:</span>
                        <span className="font-semibold">
                          ₹{property.houseCost.toLocaleString()} each
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hotel Cost:</span>
                        <span className="font-semibold">
                          ₹{property.houseCost.toLocaleString()} + 4 houses
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Special Space Information */}
          {property.type === 'special' && (
            <div className="text-center text-gray-600">
              <p>This is a special space on the board.</p>
              {property.name === 'START' && <p>Collect ₹2,000 when passing!</p>}
              {property.name === 'JAIL' && <p>Just visiting or serving time.</p>}
              {property.name === 'FREE PARKING' && <p>Take a break here!</p>}
              {property.name === 'GO TO JAIL' && <p>Go directly to jail!</p>}
              {property.name.includes('Tax') && property.price && (
                <p>Pay ₹{property.price.toLocaleString()} to the bank.</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {canBuy ? (
              <>
                <Button
                  data-testid="button-buy-property"
                  onClick={handleBuy}
                  className="flex-1 bg-indian-green hover:bg-green-700 text-white"
                >
                  <i className="fas fa-shopping-cart mr-2"></i>
                  Buy Property
                </Button>
                <Button
                  data-testid="button-pass-property"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Pass
                </Button>
              </>
            ) : (
              <Button
                data-testid="button-close-property"
                onClick={onClose}
                className="flex-1"
                variant="outline"
              >
                Close
              </Button>
            )}
          </div>

          {/* Purchase Warning */}
          {canBuy && property.price && (
            <div className="text-center text-sm text-gray-600">
              <p>
                After purchase, you'll have{' '}
                <span className="font-semibold">
                  ₹{(currentPlayer.money - property.price).toLocaleString()}
                </span>{' '}
                remaining.
              </p>
            </div>
          )}

          {/* Insufficient Funds Warning */}
          {!owner && property.type !== 'special' && property.price && currentPlayer.money < property.price && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <p className="text-sm text-red-600">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Insufficient funds to purchase this property.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
