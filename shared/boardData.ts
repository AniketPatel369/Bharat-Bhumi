/**
 * Comprehensive Board Data for Indian Monopoly Game
 * 
 * This file contains all 40 board squares with complete details including:
 * - Position index (0-39)
 * - Card name
 * - Card type (property, railroad, utility, corner, chance, community, tax)
 * - Price and rent information
 * - Color group
 * - Special rules
 */

export interface BoardSquare {
    position: number;
    name: string;
    type: 'property' | 'railroad' | 'utility' | 'corner' | 'chance' | 'community' | 'tax';
    colorGroup?: string;
    price?: number;
    rent?: number[];  // [base, 1 house, 2 houses, 3 houses, 4 houses, hotel]
    houseCost?: number;
    mortgageValue?: number;
    description?: string;
    icon?: string;
}

export const BOARD_DATA: BoardSquare[] = [
    // BOTTOM ROW (0-10) - Right to Left in reference image
    {
        position: 0,
        name: "START",
        type: "corner",
        description: "Collect ₹2000 when you pass or land on START",
        icon: "🏁"
    },
    {
        position: 1,
        name: "Old Delhi",
        type: "property",
        colorGroup: "brown",
        price: 600,
        rent: [20, 100, 300, 900, 1600, 2500],
        houseCost: 500,
        mortgageValue: 300
    },
    {
        position: 2,
        name: "Community Chest",
        type: "community",
        description: "Draw a Community Chest card",
        icon: "📦"
    },
    {
        position: 3,
        name: "Chandni Chowk",
        type: "property",
        colorGroup: "brown",
        price: 600,
        rent: [40, 200, 600, 1800, 3200, 4500],
        houseCost: 500,
        mortgageValue: 300
    },
    {
        position: 4,
        name: "Income Tax",
        type: "tax",
        price: 2000,
        description: "Pay ₹2000 Income Tax",
        icon: "💰"
    },
    {
        position: 5,
        name: "New Delhi Railway Station",
        type: "railroad",
        colorGroup: "railroad",
        price: 2000,
        rent: [250, 500, 1000, 2000],  // 1, 2, 3, 4 railroads owned
        mortgageValue: 1000,
        icon: "🚂"
    },
    {
        position: 6,
        name: "Lodhi Road",
        type: "property",
        colorGroup: "lightblue",
        price: 1000,
        rent: [60, 300, 900, 2700, 4000, 5500],
        houseCost: 500,
        mortgageValue: 500
    },
    {
        position: 7,
        name: "Chance",
        type: "chance",
        description: "Draw a Chance card",
        icon: "❓"
    },
    {
        position: 8,
        name: "Khan Market",
        type: "property",
        colorGroup: "lightblue",
        price: 1000,
        rent: [60, 300, 900, 2700, 4000, 5500],
        houseCost: 500,
        mortgageValue: 500
    },
    {
        position: 9,
        name: "India Gate",
        type: "property",
        colorGroup: "lightblue",
        price: 1200,
        rent: [80, 400, 1000, 3000, 4500, 6000],
        houseCost: 500,
        mortgageValue: 600
    },
    {
        position: 10,
        name: "JAIL",
        type: "corner",
        description: "Just Visiting or In Jail",
        icon: "🔒"
    },

    // RIGHT COLUMN (11-19) - Bottom to Top
    {
        position: 11,
        name: "Connaught Place",
        type: "property",
        colorGroup: "pink",
        price: 1400,
        rent: [100, 500, 1500, 4500, 6250, 7500],
        houseCost: 1000,
        mortgageValue: 700
    },
    {
        position: 12,
        name: "Electric Company",
        type: "utility",
        colorGroup: "utility",
        price: 1500,
        rent: [40, 100],  // 4x dice roll for 1 utility, 10x for 2 utilities
        mortgageValue: 750,
        icon: "💡"
    },
    {
        position: 13,
        name: "Rajpath",
        type: "property",
        colorGroup: "pink",
        price: 1400,
        rent: [100, 500, 1500, 4500, 6250, 7500],
        houseCost: 1000,
        mortgageValue: 700
    },
    {
        position: 14,
        name: "Lutyen's Delhi",
        type: "property",
        colorGroup: "pink",
        price: 1600,
        rent: [120, 600, 1800, 5000, 7000, 9000],
        houseCost: 1000,
        mortgageValue: 800
    },
    {
        position: 15,
        name: "Chhatrapati Shivaji Terminus",
        type: "railroad",
        colorGroup: "railroad",
        price: 2000,
        rent: [250, 500, 1000, 2000],
        mortgageValue: 1000,
        icon: "🚂"
    },
    {
        position: 16,
        name: "Nariman Point",
        type: "property",
        colorGroup: "orange",
        price: 1800,
        rent: [140, 700, 2000, 5500, 7500, 9500],
        houseCost: 1000,
        mortgageValue: 900
    },
    {
        position: 17,
        name: "Community Chest",
        type: "community",
        description: "Draw a Community Chest card",
        icon: "📦"
    },
    {
        position: 18,
        name: "Marine Drive",
        type: "property",
        colorGroup: "orange",
        price: 1800,
        rent: [140, 700, 2000, 5500, 7500, 9500],
        houseCost: 1000,
        mortgageValue: 900
    },
    {
        position: 19,
        name: "Bandra-Kurla Complex",
        type: "property",
        colorGroup: "orange",
        price: 2000,
        rent: [160, 800, 2200, 6000, 8000, 10000],
        houseCost: 1000,
        mortgageValue: 1000
    },

    // TOP ROW (20-30) - Left to Right
    {
        position: 20,
        name: "FREE PARKING",
        type: "corner",
        description: "Free resting place",
        icon: "🅿️"
    },
    {
        position: 21,
        name: "Brigade Road",
        type: "property",
        colorGroup: "red",
        price: 2200,
        rent: [180, 900, 2500, 7000, 8750, 10500],
        houseCost: 1500,
        mortgageValue: 1100
    },
    {
        position: 22,
        name: "Chance",
        type: "chance",
        description: "Draw a Chance card",
        icon: "❓"
    },
    {
        position: 23,
        name: "MG Road",
        type: "property",
        colorGroup: "red",
        price: 2200,
        rent: [180, 900, 2500, 7000, 8750, 10500],
        houseCost: 1500,
        mortgageValue: 1100
    },
    {
        position: 24,
        name: "Commercial Street",
        type: "property",
        colorGroup: "red",
        price: 2400,
        rent: [200, 1000, 3000, 7500, 9250, 11000],
        houseCost: 1500,
        mortgageValue: 1200
    },
    {
        position: 25,
        name: "Bangalore City Railway Station",
        type: "railroad",
        colorGroup: "railroad",
        price: 2000,
        rent: [250, 500, 1000, 2000],
        mortgageValue: 1000,
        icon: "🚂"
    },
    {
        position: 26,
        name: "Electronic City",
        type: "property",
        colorGroup: "yellow",
        price: 2600,
        rent: [220, 1100, 3300, 8000, 9750, 11500],
        houseCost: 1500,
        mortgageValue: 1300
    },
    {
        position: 27,
        name: "Whitefield",
        type: "property",
        colorGroup: "yellow",
        price: 2600,
        rent: [220, 1100, 3300, 8000, 9750, 11500],
        houseCost: 1500,
        mortgageValue: 1300
    },
    {
        position: 28,
        name: "Water Works",
        type: "utility",
        colorGroup: "utility",
        price: 1500,
        rent: [40, 100],  // 4x dice roll for 1 utility, 10x for 2 utilities
        mortgageValue: 750,
        icon: "💧"
    },
    {
        position: 29,
        name: "Koramangala",
        type: "property",
        colorGroup: "yellow",
        price: 2800,
        rent: [240, 1200, 3600, 8500, 10250, 12000],
        houseCost: 1500,
        mortgageValue: 1400
    },
    {
        position: 30,
        name: "GO TO JAIL",
        type: "corner",
        description: "Go directly to Jail. Do not pass GO, do not collect ₹2000",
        icon: "👮"
    },

    // LEFT COLUMN (31-39) - Top to Bottom
    {
        position: 31,
        name: "Park Street",
        type: "property",
        colorGroup: "green",
        price: 3000,
        rent: [260, 1300, 3900, 9000, 11000, 12750],
        houseCost: 2000,
        mortgageValue: 1500
    },
    {
        position: 32,
        name: "Salt Lake City",
        type: "property",
        colorGroup: "green",
        price: 3000,
        rent: [260, 1300, 3900, 9000, 11000, 12750],
        houseCost: 2000,
        mortgageValue: 1500
    },
    {
        position: 33,
        name: "Community Chest",
        type: "community",
        description: "Draw a Community Chest card",
        icon: "📦"
    },
    {
        position: 34,
        name: "New Town",
        type: "property",
        colorGroup: "green",
        price: 3200,
        rent: [280, 1500, 4500, 10000, 12000, 14000],
        houseCost: 2000,
        mortgageValue: 1600
    },
    {
        position: 35,
        name: "Howrah Railway Station",
        type: "railroad",
        colorGroup: "railroad",
        price: 2000,
        rent: [250, 500, 1000, 2000],
        mortgageValue: 1000,
        icon: "🚂"
    },
    {
        position: 36,
        name: "Chance",
        type: "chance",
        description: "Draw a Chance card",
        icon: "❓"
    },
    {
        position: 37,
        name: "Bandra West",
        type: "property",
        colorGroup: "darkblue",
        price: 3500,
        rent: [350, 1750, 5000, 11000, 13000, 15000],
        houseCost: 2000,
        mortgageValue: 1750
    },
    {
        position: 38,
        name: "Super Tax",
        type: "tax",
        price: 1000,
        description: "Pay ₹1000 Super Tax",
        icon: "💰"
    },
    {
        position: 39,
        name: "Juhu Beach",
        type: "property",
        colorGroup: "darkblue",
        price: 4000,
        rent: [500, 2000, 6000, 14000, 17000, 20000],
        houseCost: 2000,
        mortgageValue: 2000
    }
];

// Color group definitions with CSS classes
export const COLOR_GROUPS = {
    brown: {
        name: "Brown",
        color: "#8B4513",
        bgClass: "bg-amber-700",
        properties: [1, 3]
    },
    lightblue: {
        name: "Light Blue",
        color: "#87CEEB",
        bgClass: "bg-sky-300",
        properties: [6, 8, 9]
    },
    pink: {
        name: "Pink",
        color: "#FF69B4",
        bgClass: "bg-pink-400",
        properties: [11, 13, 14]
    },
    orange: {
        name: "Orange",
        color: "#FFA500",
        bgClass: "bg-orange-500",
        properties: [16, 18, 19]
    },
    red: {
        name: "Red",
        color: "#DC143C",
        bgClass: "bg-red-500",
        properties: [21, 23, 24]
    },
    yellow: {
        name: "Yellow",
        color: "#FFD700",
        bgClass: "bg-yellow-400",
        properties: [26, 27, 29]
    },
    green: {
        name: "Green",
        color: "#228B22",
        bgClass: "bg-green-500",
        properties: [31, 32, 34]
    },
    darkblue: {
        name: "Dark Blue",
        color: "#00008B",
        bgClass: "bg-blue-700",
        properties: [37, 39]
    },
    railroad: {
        name: "Railroad",
        color: "#000000",
        bgClass: "bg-gray-700",
        properties: [5, 15, 25, 35]
    },
    utility: {
        name: "Utility",
        color: "#FFEB3B",
        bgClass: "bg-yellow-300",
        properties: [12, 28]
    }
};

// Helper function to get square by position
export function getSquareByPosition(position: number): BoardSquare | undefined {
    return BOARD_DATA.find(square => square.position === position);
}

// Helper function to get all squares of a color group
export function getSquaresByColorGroup(colorGroup: string): BoardSquare[] {
    return BOARD_DATA.filter(square => square.colorGroup === colorGroup);
}

// Helper function to check if a player owns all properties in a color group
export function ownsColorGroup(playerProperties: number[], colorGroup: string): boolean {
    const groupProperties = COLOR_GROUPS[colorGroup as keyof typeof COLOR_GROUPS]?.properties || [];
    return groupProperties.every(prop => playerProperties.includes(prop));
}
