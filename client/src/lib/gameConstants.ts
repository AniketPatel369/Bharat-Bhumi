import { GameProperty } from "@shared/schema";
import { BOARD_DATA, BoardSquare } from "@shared/boardData";

// Convert BoardSquare to GameProperty for backward compatibility
function convertToGameProperty(square: BoardSquare): GameProperty {
  return {
    id: square.position,
    name: square.name,
    type: square.type === 'corner' || square.type === 'chance' || square.type === 'community' || square.type === 'tax'
      ? 'special'
      : square.type,
    price: square.price,
    rent: square.rent,
    colorGroup: square.colorGroup || 'special',
    houseCost: square.houseCost,
    houses: 0,
    mortgaged: false
  };
}

export const GAME_PROPERTIES: GameProperty[] = BOARD_DATA.map(convertToGameProperty);

// Legacy array kept for reference (now generated from BOARD_DATA)
/*
export const GAME_PROPERTIES_OLD: GameProperty[] = [
  // Bottom row (0-10) - START to JAIL
  {
    id: 0,
    name: "START",
    type: "special",
    colorGroup: "special",
    houses: 0,
    mortgaged: false
  },
  {
    id: 1,
    name: "Old Delhi",
    type: "property",
    price: 600,
    rent: [20, 100, 300, 900, 1600, 2500],
    colorGroup: "brown",
    houseCost: 500,
    houses: 0,
    mortgaged: false
  },
  {
    id: 2,
    name: "Community Chest",
    type: "special",
    colorGroup: "special",
    houses: 0,
    mortgaged: false
  },
  {
    id: 3,
    name: "Chandni Chowk",
    type: "property",
    price: 600,
    rent: [40, 200, 600, 1800, 3200, 4500],
    colorGroup: "brown",
    houseCost: 500,
    houses: 0,
    mortgaged: false
  },
  {
    id: 4,
    name: "Income Tax",
    type: "special",
    price: 2000,
    colorGroup: "special",
    houses: 0,
    mortgaged: false
  },
  {
    id: 5,
    name: "New Delhi Railway Station",
    type: "railroad",
    price: 2000,
    rent: [250, 500, 1000, 2000],
    colorGroup: "railroad",
    houses: 0,
    mortgaged: false
  },
  {
    id: 6,
    name: "Lodhi Road",
    type: "property",
    price: 1000,
    rent: [60, 300, 900, 2700, 4000, 5500],
    colorGroup: "lightblue",
    houseCost: 500,
    houses: 0,
    mortgaged: false
  },
  {
    id: 7,
    name: "Chance",
    type: "special",
    colorGroup: "special",
    houses: 0,
    mortgaged: false
  },
  {
    id: 8,
    name: "Khan Market",
    type: "property",
    price: 1000,
    rent: [60, 300, 900, 2700, 4000, 5500],
    colorGroup: "lightblue",
    houseCost: 500,
    houses: 0,
    mortgaged: false
  },
  {
    id: 9,
    name: "India Gate",
    type: "property",
    price: 1200,
    rent: [80, 400, 1000, 3000, 4500, 6000],
    colorGroup: "lightblue",
    houseCost: 500,
    houses: 0,
    mortgaged: false
  },
  {
    id: 10,
    name: "JAIL",
    type: "special",
    colorGroup: "special",
    houses: 0,
    mortgaged: false
  },

  // Left side (11-20) - JAIL to FREE PARKING
  {
    id: 11,
    name: "Connaught Place",
    type: "property",
    price: 1400,
    rent: [100, 500, 1500, 4500, 6250, 7500],
    colorGroup: "pink",
    houseCost: 1000,
    houses: 0,
    mortgaged: false
  },
  {
    id: 12,
    name: "Electric Company",
    type: "utility",
    price: 1500,
    rent: [40, 100],
    colorGroup: "utility",
    houses: 0,
    mortgaged: false
  },
  {
    id: 13,
    name: "Rajpath",
    type: "property",
    price: 1400,
    rent: [100, 500, 1500, 4500, 6250, 7500],
    colorGroup: "pink",
    houseCost: 1000,
    houses: 0,
    mortgaged: false
  },
  {
    id: 14,
    name: "Lutyen's Delhi",
    type: "property",
    price: 1600,
    rent: [120, 600, 1800, 5000, 7000, 9000],
    colorGroup: "pink",
    houseCost: 1000,
    houses: 0,
    mortgaged: false
  },
  {
    id: 15,
    name: "Chhatrapati Shivaji Terminus",
    type: "railroad",
    price: 2000,
    rent: [250, 500, 1000, 2000],
    colorGroup: "railroad",
    houses: 0,
    mortgaged: false
  },
  {
    id: 16,
    name: "Nariman Point",
    type: "property",
    price: 1800,
    rent: [140, 700, 2000, 5500, 7500, 9500],
    colorGroup: "orange",
    houseCost: 1000,
    houses: 0,
    mortgaged: false
  },
  {
    id: 17,
    name: "Community Chest",
    type: "special",
    colorGroup: "special",
    houses: 0,
    mortgaged: false
  },
  {
    id: 18,
    name: "Marine Drive",
    type: "property",
    price: 1800,
    rent: [140, 700, 2000, 5500, 7500, 9500],
    colorGroup: "orange",
    houseCost: 1000,
    houses: 0,
    mortgaged: false
  },
  {
    id: 19,
    name: "Bandra-Kurla Complex",
    type: "property",
    price: 2000,
    rent: [160, 800, 2200, 6000, 8000, 10000],
    colorGroup: "orange",
    houseCost: 1000,
    houses: 0,
    mortgaged: false
  },
  {
    id: 20,
    name: "FREE PARKING",
    type: "special",
    colorGroup: "special",
    houses: 0,
    mortgaged: false
  },

  // Top side (21-30) - FREE PARKING to GO TO JAIL
  {
    id: 21,
    name: "Brigade Road",
    type: "property",
    price: 2200,
    rent: [180, 900, 2500, 7000, 8750, 10500],
    colorGroup: "red",
    houseCost: 1500,
    houses: 0,
    mortgaged: false
  },
  {
    id: 22,
    name: "Chance",
    type: "special",
    colorGroup: "special",
    houses: 0,
    mortgaged: false
  },
  {
    id: 23,
    name: "MG Road",
    type: "property",
    price: 2200,
    rent: [180, 900, 2500, 7000, 8750, 10500],
    colorGroup: "red",
    houseCost: 1500,
    houses: 0,
    mortgaged: false
  },
  {
    id: 24,
    name: "Commercial Street",
    type: "property",
    price: 2400,
    rent: [200, 1000, 3000, 7500, 9250, 11000],
    colorGroup: "red",
    houseCost: 1500,
    houses: 0,
    mortgaged: false
  },
  {
    id: 25,
    name: "Bangalore City Railway Station",
    type: "railroad",
    price: 2000,
    rent: [250, 500, 1000, 2000],
    colorGroup: "railroad",
    houses: 0,
    mortgaged: false
  },
  {
    id: 26,
    name: "Electronic City",
    type: "property",
    price: 2600,
    rent: [220, 1100, 3300, 8000, 9750, 11500],
    colorGroup: "yellow",
    houseCost: 1500,
    houses: 0,
    mortgaged: false
  },
  {
    id: 27,
    name: "Whitefield",
    type: "property",
    price: 2600,
    rent: [220, 1100, 3300, 8000, 9750, 11500],
    colorGroup: "yellow",
    houseCost: 1500,
    houses: 0,
    mortgaged: false
  },
  {
    id: 28,
    name: "Water Works",
    type: "utility",
    price: 1500,
    rent: [40, 100],
    colorGroup: "utility",
    houses: 0,
    mortgaged: false
  },
  {
    id: 29,
    name: "Koramangala",
    type: "property",
    price: 2800,
    rent: [240, 1200, 3600, 8500, 10250, 12000],
    colorGroup: "yellow",
    houseCost: 1500,
    houses: 0,
    mortgaged: false
  },
  {
    id: 30,
    name: "GO TO JAIL",
    type: "special",
    colorGroup: "special",
    houses: 0,
    mortgaged: false
  },

  // Right side (31-39) - GO TO JAIL to START
  {
    id: 31,
    name: "Park Street",
    type: "property",
    price: 3000,
    rent: [260, 1300, 3900, 9000, 11000, 12750],
    colorGroup: "green",
    houseCost: 2000,
    houses: 0,
    mortgaged: false
  },
  {
    id: 32,
    name: "Salt Lake City",
    type: "property",
    price: 3000,
    rent: [260, 1300, 3900, 9000, 11000, 12750],
    colorGroup: "green",
    houseCost: 2000,
    houses: 0,
    mortgaged: false
  },
  {
    id: 33,
    name: "Community Chest",
    type: "special",
    colorGroup: "special",
    houses: 0,
    mortgaged: false
  },
  {
    id: 34,
    name: "New Town",
    type: "property",
    price: 3200,
    rent: [280, 1500, 4500, 10000, 12000, 14000],
    colorGroup: "green",
    houseCost: 2000,
    houses: 0,
    mortgaged: false
  },
  {
    id: 35,
    name: "Howrah Railway Station",
    type: "railroad",
    price: 2000,
    rent: [250, 500, 1000, 2000],
    colorGroup: "railroad",
    houses: 0,
    mortgaged: false
  },
  {
    id: 36,
    name: "Chance",
    type: "special",
    colorGroup: "special",
    houses: 0,
    mortgaged: false
  },
  {
    id: 37,
    name: "Bandra West",
    type: "property",
    price: 3500,
    rent: [350, 1750, 5000, 11000, 13000, 15000],
    colorGroup: "darkblue",
    houseCost: 2000,
    houses: 0,
    mortgaged: false
  },
  {
    id: 38,
    name: "Super Tax",
    type: "special",
    price: 1000,
    colorGroup: "special",
    houses: 0,
    mortgaged: false
  },
  {
    id: 39,
    name: "Juhu Beach",
    type: "property",
    price: 4000,
    rent: [500, 2000, 6000, 14000, 17000, 20000],
    colorGroup: "darkblue",
    houseCost: 2000,
    houses: 0,
    mortgaged: false
  }
];
*/

export const CHANCE_CARDS = [
  "Advance to GO (Collect Rs. 2000)",
  "Advance to India Gate",
  "Advance to Connaught Place",
  "Bank pays you dividend of Rs. 500",
  "Get out of Jail Free",
  "Go back 3 spaces",
  "Go to Jail",
  "Make general repairs on all your property",
  "Pay poor tax of Rs. 150",
  "Take a trip to New Delhi Railway Station",
  "You have been elected Chairman of the Board",
  "Your building loan matures"
];

export const COMMUNITY_CHEST_CARDS = [
  "Advance to GO (Collect Rs. 2000)",
  "Bank error in your favor. Collect Rs. 2000",
  "Doctor's fee. Pay Rs. 500",
  "From sale of stock you get Rs. 500",
  "Get out of Jail Free",
  "Go to Jail",
  "Holiday fund matures. Receive Rs. 1000",
  "Income tax refund. Collect Rs. 200",
  "Life insurance matures. Collect Rs. 1000",
  "Pay hospital fees of Rs. 1000",
  "Pay school fees of Rs. 500",
  "Receive Rs. 250 consultancy fee",
  "You are assessed for street repairs",
  "You have won second prize in a beauty contest",
  "You inherit Rs. 1000"
];

export const COLOR_GROUPS = {
  brown: ["Old Delhi", "Chandni Chowk"],
  lightblue: ["Lodhi Road", "Khan Market", "India Gate"],
  pink: ["Connaught Place", "Rajpath", "Lutyen's Delhi"],
  orange: ["Nariman Point", "Marine Drive", "Bandra-Kurla Complex"],
  red: ["Brigade Road", "MG Road", "Commercial Street"],
  yellow: ["Electronic City", "Whitefield", "Koramangala"],
  green: ["Park Street", "Salt Lake City", "New Town"],
  darkblue: ["Bandra West", "Juhu Beach"],
  railroad: ["New Delhi Railway Station", "Chhatrapati Shivaji Terminus", "Bangalore City Railway Station", "Howrah Railway Station"],
  utility: ["Electric Company", "Water Works"]
};

export const INITIAL_MONEY = 15000;
export const GO_MONEY = 2000;
export const JAIL_FINE = 500;
export const MAX_PLAYERS = 8;
export const DICE_COUNT = 2;