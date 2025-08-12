# Vyapaar - Web-based Monopoly Game

## Overview

Vyapaar is a web-based multiplayer Monopoly-style board game built with modern full-stack technologies. The application supports up to 8 players per room with real-time gameplay using WebSocket connections. Players can create or join game rooms, interact through a live chat system, and play through turn-based Monopoly mechanics including property buying, rent collection, and special game events. The game features a responsive design that works on both desktop and mobile devices.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with a custom design system using shadcn/ui components for consistent UI elements
- **Routing**: Wouter for lightweight client-side routing with three main routes: Home, Lobby, and Game
- **State Management**: React Query (TanStack Query) for server state management and local React state for UI interactions
- **Real-time Communication**: Native WebSocket API with custom hooks for connection management and automatic reconnection

### Backend Architecture
- **Runtime**: Node.js with Express.js framework serving both API endpoints and static files
- **Real-time Engine**: WebSocket Server (ws package) for real-time game state synchronization and chat functionality
- **Data Storage**: In-memory storage system with planned PostgreSQL integration using Drizzle ORM
- **Game Logic**: Server-authoritative game state management to prevent client-side cheating
- **Session Management**: Room-based system with unique codes for joining games

### Component Design Patterns
- **Shared Schema**: Zod validation schemas shared between client and server for type safety
- **Custom Hooks**: Reusable hooks for WebSocket connections, mobile detection, and toast notifications
- **Modular Components**: Separated game components (GameBoard, PlayerInfo, Chat, PropertyModal) for maintainability
- **Responsive Design**: Mobile-first approach with conditional rendering for different screen sizes

### Game State Architecture
- **Turn-based System**: Server manages turn order and validates player actions
- **Property Management**: 40 properties with different types (regular, railroad, utility, special spaces)
- **Player Actions**: Dice rolling, property purchasing, rent payment, and chat messaging
- **Game Events**: Real-time broadcasting of all game actions to synchronized clients

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Query for state management
- **Build Tools**: Vite for development server and bundling, TypeScript for type safety
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer for responsive design
- **UI Components**: Radix UI primitives with shadcn/ui component library

### Server Dependencies
- **Backend Framework**: Express.js for HTTP server, WebSocket (ws) for real-time communication
- **Database**: Drizzle ORM for PostgreSQL integration, @neondatabase/serverless for cloud database
- **Validation**: Zod for runtime type checking and schema validation
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Routing**: Wouter for lightweight client-side routing
- **Date Handling**: date-fns for date manipulation and formatting
- **Utilities**: clsx and class-variance-authority for conditional CSS classes
- **Development**: Replit-specific plugins for cloud development environment

### Game-Specific Libraries
- **Form Handling**: React Hook Form with Hookform resolvers for form validation
- **Toast Notifications**: Custom toast system using Radix UI primitives
- **Mobile Detection**: Custom hook for responsive behavior based on screen size
- **Font Integration**: Google Fonts (Poppins, Architects Daughter, etc.) for typography