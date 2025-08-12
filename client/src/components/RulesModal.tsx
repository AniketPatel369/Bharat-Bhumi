import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RulesModalProps {
  show: boolean;
  onClose: () => void;
}

export default function RulesModal({ show, onClose }: RulesModalProps) {
  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]" data-testid="rules-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <i className="fas fa-book text-saffron text-xl"></i>
            <span className="text-2xl font-bold text-navy">Vyapaar Game Rules</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" data-testid="tab-basic-rules">Basic Rules</TabsTrigger>
            <TabsTrigger value="properties" data-testid="tab-property-rules">Properties</TabsTrigger>
            <TabsTrigger value="special" data-testid="tab-special-spaces">Special Spaces</TabsTrigger>
            <TabsTrigger value="winning" data-testid="tab-winning-strategy">Strategy</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-96 mt-4">
            <TabsContent value="basic" className="space-y-4">
              <div>
                <h3 className="font-bold text-lg text-navy mb-3">Getting Started</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-check-circle text-indian-green mt-1"></i>
                    <span>Each player starts with <strong>₹15,000</strong> in cash</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-check-circle text-indian-green mt-1"></i>
                    <span>All players begin at the <strong>START</strong> position</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-check-circle text-indian-green mt-1"></i>
                    <span>Collect <strong>₹2,000</strong> each time you pass or land on START</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-check-circle text-indian-green mt-1"></i>
                    <span>Players take turns in clockwise order around the board</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg text-navy mb-3">Turn Sequence</h3>
                <ol className="space-y-2 text-gray-700 list-decimal list-inside">
                  <li><strong>Roll Dice:</strong> Click the "Roll Dice" button to move</li>
                  <li><strong>Move Token:</strong> Your token moves automatically</li>
                  <li><strong>Land on Space:</strong> Follow the space's instructions</li>
                  <li><strong>Make Decisions:</strong> Buy properties, pay rent, draw cards</li>
                  <li><strong>End Turn:</strong> Click "End Turn" to pass control</li>
                </ol>
              </div>

              <div>
                <h3 className="font-bold text-lg text-navy mb-3">Winning the Game</h3>
                <p className="text-gray-700">
                  The last player remaining with money wins! Force your opponents into bankruptcy 
                  by owning valuable properties and charging high rent.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="properties" className="space-y-4">
              <div>
                <h3 className="font-bold text-lg text-navy mb-3">Buying Properties</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-home text-saffron mt-1"></i>
                    <span>When you land on an unowned property, you may buy it for the listed price</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-money-bill-wave text-indian-green mt-1"></i>
                    <span>If you choose not to buy, the property remains available</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-certificate text-navy mt-1"></i>
                    <span>You receive the property deed and collect rent from other players</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg text-navy mb-3">Color Groups</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-amber-700 rounded"></div>
                      <span className="text-sm font-semibold">Brown Group</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-sky-300 rounded"></div>
                      <span className="text-sm font-semibold">Light Blue Group</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-pink-400 rounded"></div>
                      <span className="text-sm font-semibold">Pink Group</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <span className="text-sm font-semibold">Orange Group</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-sm font-semibold">Red Group</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                      <span className="text-sm font-semibold">Yellow Group</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm font-semibold">Green Group</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-700 rounded"></div>
                      <span className="text-sm font-semibold">Dark Blue Group</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  <strong>Monopoly Bonus:</strong> Own all properties in a color group to charge double rent!
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg text-navy mb-3">Rent Collection</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-coins text-yellow-500 mt-1"></i>
                    <span>When another player lands on your property, they must pay rent</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-chart-line text-indian-green mt-1"></i>
                    <span>Rent increases with houses and hotels built on the property</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-ban text-red-500 mt-1"></i>
                    <span>Mortgaged properties do not collect rent</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg text-navy mb-3">Building Development</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-hammer text-saffron mt-1"></i>
                    <span>Build houses and hotels to increase rent dramatically</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-balance-scale text-navy mt-1"></i>
                    <span>Must build evenly across all properties in a color group</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-building text-indian-green mt-1"></i>
                    <span>Maximum 4 houses per property, then upgrade to hotel</span>
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="special" className="space-y-4">
              <div>
                <h3 className="font-bold text-lg text-navy mb-3">Corner Spaces</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fas fa-flag-checkered text-saffron"></i>
                      <span className="font-semibold">START</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Collect ₹2,000 when you pass or land here
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fas fa-lock text-gray-600"></i>
                      <span className="font-semibold">JAIL</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Just visiting - no penalty for landing here
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fas fa-car text-blue-600"></i>
                      <span className="font-semibold">FREE PARKING</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Safe space - nothing happens here
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fas fa-hand-point-right text-red-600"></i>
                      <span className="font-semibold">GO TO JAIL</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Go directly to jail, do not pass START
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg text-navy mb-3">Chance & Community Chest</h3>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <i className="fas fa-dice text-saffron"></i>
                    <span className="font-semibold">Chance Cards</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Draw a card and follow its instructions. Effects include:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Move to specific spaces on the board</li>
                    <li>• Collect or pay money to the bank</li>
                    <li>• Get out of jail free cards</li>
                    <li>• Advance to nearest utility or railroad</li>
                  </ul>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg mt-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <i className="fas fa-question-circle text-orange-600"></i>
                    <span className="font-semibold">Community Chest Cards</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Community events that affect your finances:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Bank errors in your favor</li>
                    <li>• Pay for property repairs</li>
                    <li>• Collect money from other players</li>
                    <li>• Get out of jail free cards</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg text-navy mb-3">Tax Spaces</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fas fa-coins text-yellow-500"></i>
                      <span className="font-semibold">Income Tax</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Pay ₹2,000 to the bank when you land here
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fas fa-coins text-yellow-600"></i>
                      <span className="font-semibold">Super Tax</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Pay ₹1,000 to the bank when you land here
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg text-navy mb-3">Utilities & Railroads</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fas fa-lightbulb text-yellow-500"></i>
                      <span className="font-semibold">Utilities</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Electric Company & Water Works - rent based on dice roll
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fas fa-train text-gray-600"></i>
                      <span className="font-semibold">Railroads</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Rent increases based on number of railroads owned
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="winning" className="space-y-4">
              <div>
                <h3 className="font-bold text-lg text-navy mb-3">Early Game Strategy</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-shopping-cart text-saffron mt-1"></i>
                    <span><strong>Buy aggressively:</strong> Purchase most properties you land on early</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-chart-line text-indian-green mt-1"></i>
                    <span><strong>Focus on orange/red:</strong> These are landed on most frequently</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-train text-navy mt-1"></i>
                    <span><strong>Railroad strategy:</strong> Owning multiple railroads provides steady income</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg text-navy mb-3">Mid Game Strategy</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-handshake text-saffron mt-1"></i>
                    <span><strong>Strategic trading:</strong> Complete color groups to build monopolies</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-hammer text-indian-green mt-1"></i>
                    <span><strong>Build development:</strong> Houses increase rent exponentially</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <i className="fas fa-piggy-bank text-navy mt-1"></i>
                    <span><strong>Cash management:</strong> Keep enough money for rent payments</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg text-navy mb-3">Advanced Tips</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <i className="fas fa-lightbulb text-blue-600"></i>
                      <span className="font-semibold text-blue-800">Housing Shortage</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Keep 4 houses on properties instead of upgrading to hotels to limit opponents' building options
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <i className="fas fa-exchange-alt text-green-600"></i>
                      <span className="font-semibold text-green-800">Smart Trading</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Sometimes give opponents a monopoly if it helps you complete a more valuable one
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <i className="fas fa-shield-alt text-red-600"></i>
                      <span className="font-semibold text-red-800">Jail Strategy</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      In late game, staying in jail can be advantageous to avoid expensive rent
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg text-navy mb-3">Property Value Rankings</h3>
                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Most Valuable Color Groups:</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li><strong>Orange Properties</strong> - High traffic from jail</li>
                    <li><strong>Red Properties</strong> - Frequently landed on</li>
                    <li><strong>Yellow Properties</strong> - Good return on investment</li>
                    <li><strong>Green/Dark Blue</strong> - High rent but expensive to develop</li>
                  </ol>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} data-testid="button-close-rules">
            <i className="fas fa-times mr-2"></i>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
