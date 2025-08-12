import { GameProperty } from "@shared/schema";

export const GAME_PROPERTIES: GameProperty[] = [
  // Bottom row (0-10) - START to JAIL
  {
    id: 0,
    name: "START",
    type: "special",
    colorGroup: "special"
  },
  {
    id: 1,
    name: "Old Delhi",
    type: "property",
    price: 600,
    rent: [20, 100, 300, 900, 1600, 2500],
    colorGroup: "brown",
    houseCost: 500
  },
  {
    id: 2,
    name: "Community Chest",
    type: "special",
    colorGroup: "special"
  },
  {
    id: 3,
    name: "Chandni Chowk",
    type: "property",
    price: 600,
    rent: [40, 200, 600, 1800, 3200, 4500],
    colorGroup: "brown",
    houseCost: 500
  },
  {
    id: 4,
    name: "Income Tax",
    type: "special",
    price: 2000,
    colorGroup: "special"
  },
  {
    id: 5,
    name: "New Delhi Railway Station",
    type: "railroad",
    price: 2000,
    rent: [250, 500, 1000, 2000],
    colorGroup: "railroad"
  },
  {
    id: 6,
    name: "Lodhi Road",
    type: "property",
    price: 1000,
    rent: [60, 300, 900, 2700, 4000, 5500],
    colorGroup: "lightblue",
    houseCost: 500
  },
  {
    id: 7,
    name: "Chance",
    type: "special",
    colorGroup: "special"
  },
  {
    id: 8,
    name: "Khan Market",
    type: "property",
    price: 1000,
    rent: [60, 300, 900, 2700, 4000, 5500],
    colorGroup: "lightblue",
    houseCost: 500
  },
  {
    id: 9,
    name: "Connaught Place",
    type: "property",
    price: 1200,
    rent: [80, 400, 1000, 3000, 4500, 6000],
    colorGroup: "lightblue",
    houseCost: 500
  },
  {
    id: 10,
    name: "JAIL",
    type: "special",
    colorGroup: "special"
  },

  // Right side (11-19)
  {
    id: 11,
    name: "Bandra",
    type: "property",
    price: 1400,
    rent: [100, 500, 1500, 4500, 6250, 7500],
    colorGroup: "pink",
    houseCost: 1000
  },
  {
    id: 12,
    name: "Electric Company",
    type: "utility",
    price: 1500,
    rent: [40, 100],
    colorGroup: "utility"
  },
  {
    id: 13,
    name: "Juhu Beach",
    type: "property",
    price: 1400,
    rent: [100, 500, 1500, 4500, 6250, 7500],
    colorGroup: "pink",
    houseCost: 1000
  },
  {
    id: 14,
    name: "Marine Drive",
    type: "property",
    price: 1600,
    rent: [120, 600, 1800, 5000, 7000, 9000],
    colorGroup: "pink",
    houseCost: 1000
  },
  {
    id: 15,
    name: "Mumbai Central Station",
    type: "railroad",
    price: 2000,
    rent: [250, 500, 1000, 2000],
    colorGroup: "railroad"
  },
  {
    id: 16,
    name: "Cyber City",
    type: "property",
    price: 1800,
    rent: [140, 700, 2000, 5500, 7500, 9500],
    colorGroup: "orange",
    houseCost: 1000
  },
  {
    id: 17,
    name: "Community Chest",
    type: "special",
    colorGroup: "special"
  },
  {
    id: 18,
    name: "DLF Phase I",
    type: "property",
    price: 1800,
    rent: [140, 700, 2000, 5500, 7500, 9500],
    colorGroup: "orange",
    houseCost: 1000
  },
  {
    id: 19,
    name: "Sector 17",
    type: "property",
    price: 2000,
    rent: [160, 800, 2200, 6000, 8000, 10000],
    colorGroup: "orange",
    houseCost: 1000
  },

  // Top row (20-29) - FREE PARKING to GO TO JAIL
  {
    id: 20,
    name: "FREE PARKING",
    type: "special",
    colorGroup: "special"
  },
  {
    id: 21,
    name: "Park Street",
    type: "property",
    price: 2200,
    rent: [180, 900, 2500, 7000, 8750, 10500],
    colorGroup: "red",
    houseCost: 1500
  },
  {
    id: 22,
    name: "Chance",
    type: "special",
    colorGroup: "special"
  },
  {
    id: 23,
    name: "Camac Street",
    type: "property",
    price: 2200,
    rent: [180, 900, 2500, 7000, 8750, 10500],
    colorGroup: "red",
    houseCost: 1500
  },
  {
    id: 24,
    name: "Salt Lake",
    type: "property",
    price: 2400,
    rent: [200, 1000, 3000, 7500, 9250, 11000],
    colorGroup: "red",
    houseCost: 1500
  },
  {
    id: 25,
    name: "Howrah Station",
    type: "railroad",
    price: 2000,
    rent: [250, 500, 1000, 2000],
    colorGroup: "railroad"
  },
  {
    id: 26,
    name: "Anna Salai",
    type: "property",
    price: 2600,
    rent: [220, 1100, 3300, 8000, 9750, 11500],
    colorGroup: "yellow",
    houseCost: 1500
  },
  {
    id: 27,
    name: "T. Nagar",
    type: "property",
    price: 2600,
    rent: [220, 1100, 3300, 8000, 9750, 11500],
    colorGroup: "yellow",
    houseCost: 1500
  },
  {
    id: 28,
    name: "Water Works",
    type: "utility",
    price: 1500,
    rent: [40, 100],
    colorGroup: "utility"
  },
  {
    id: 29,
    name: "Adyar",
    type: "property",
    price: 2800,
    rent: [240, 1200, 3600, 8500, 10250, 12000],
    colorGroup: "yellow",
    houseCost: 1500
  },

  // Left top corner
  {
    id: 30,
    name: "GO TO JAIL",
    type: "special",
    colorGroup: "special"
  },

  // Left side (31-39)
  {
    id: 31,
    name: "Commercial Street",
    type: "property",
    price: 3000,
    rent: [260, 1300, 3900, 9000, 11000, 12750],
    colorGroup: "green",
    houseCost: 2000
  },
  {
    id: 32,
    name: "Brigade Road",
    type: "property",
    price: 3000,
    rent: [260, 1300, 3900, 9000, 11000, 12750],
    colorGroup: "green",
    houseCost: 2000
  },
  {
    id: 33,
    name: "Community Chest",
    type: "special",
    colorGroup: "special"
  },
  {
    id: 34,
    name: "MG Road",
    type: "property",
    price: 3200,
    rent: [280, 1500, 4500, 10000, 12000, 14000],
    colorGroup: "green",
    houseCost: 2000
  },
  {
    id: 35,
    name: "Bangalore City Station",
    type: "railroad",
    price: 2000,
    rent: [250, 500, 1000, 2000],
    colorGroup: "railroad"
  },
  {
    id: 36,
    name: "Chance",
    type: "special",
    colorGroup: "special"
  },
  {
    id: 37,
    name: "Nariman Point",
    type: "property",
    price: 3500,
    rent: [350, 1750, 5000, 11000, 13000, 15000],
    colorGroup: "darkblue",
    houseCost: 2000
  },
  {
    id: 38,
    name: "Super Tax",
    type: "special",
    price: 1000,
    colorGroup: "special"
  },
  {
    id: 39,
    name: "Malabar Hill",
    type: "property",
    price: 4000,
    rent: [500, 2000, 6000, 14000, 17000, 20000],
    colorGroup: "darkblue",
    houseCost: 2000
  }
];

// Game rules and constants
export const GAME_RULES = {
  STARTING_MONEY: 15000,
  START_BONUS: 2000,
  MAX_PLAYERS: 8,
  MIN_PLAYERS: 2,
  JAIL_FINE: 500,
  MAX_JAIL_TURNS: 3,
  HOUSE_LIMIT: 32,
  HOTEL_LIMIT: 12,
};

// Chance and Community Chest cards
export const CHANCE_CARDS = [
  "Advance to START - Collect ₹2000",
  "Advance to Mayfair",
  "Go to Jail - Do not pass START",
  "Pay poor tax of ₹150",
  "Your building loan matures - Collect ₹1500",
  "You have won a crossword competition - Collect ₹1000",
  "Bank pays you dividend of ₹500",
  "Get out of Jail free",
  "Go back 3 spaces",
  "Pay school fees of ₹1500",
  "Advance to nearest Railway Station",
  "Advance to nearest Utility",
  "Make general repairs - Pay ₹250 per house and ₹1000 per hotel",
  "You have been elected Chairman - Pay each player ₹500",
  "Advance to Pall Mall",
  "Drunk in charge fine ₹200"
];

export const COMMUNITY_CHEST_CARDS = [
  "Advance to START - Collect ₹2000",
  "Bank error in your favor - Collect ₹2000",
  "Doctor's fee - Pay ₹500",
  "From sale of stock you get ₹500",
  "Get out of Jail free",
  "Go to Jail - Do not pass START",
  "Holiday fund matures - Receive ₹1000",
  "Income tax refund - Collect ₹200",
  "It is your birthday - Collect ₹100 from every player",
  "Life insurance matures - Collect ₹1000",
  "Hospital fees - Pay ₹1000",
  "School fees - Pay ₹500",
  "Receive ₹250 consultancy fee",
  "You are assessed for street repairs - Pay ₹400 per house and ₹1150 per hotel",
  "You have won second prize in a beauty contest - Collect ₹100",
  "You inherit ₹1000"
];

// Color group definitions for easy reference
export const COLOR_GROUPS = {
  brown: [1, 3],
  lightblue: [6, 8, 9],
  pink: [11, 13, 14],
  orange: [16, 18, 19],
  red: [21, 23, 24],
  yellow: [26, 27, 29],
  green: [31, 32, 34],
  darkblue: [37, 39],
  railroad: [5, 15, 25, 35],
  utility: [12, 28]
};

// Helper functions for game logic
export const getColorGroup = (propertyId: number): string | null => {
  for (const [color, properties] of Object.entries(COLOR_GROUPS)) {
    if (properties.includes(propertyId)) {
      return color;
    }
  }
  return null;
};

export const getPropertiesInColorGroup = (colorGroup: string): number[] => {
  return COLOR_GROUPS[colorGroup as keyof typeof COLOR_GROUPS] || [];
};

export const isMonopoly = (propertyIds: number[], colorGroup: string): boolean => {
  const groupProperties = getPropertiesInColorGroup(colorGroup);
  return groupProperties.every(id => propertyIds.includes(id));
};
