# 🇮🇳 Bharat Bhumi

**An immersive Indian-themed Monopoly board game built with modern web technologies.**

Experience the classic Monopoly gameplay with authentic Indian cities, landmarks, and cultural elements. Travel from Old Delhi to Juhu Beach, from Chandni Chowk to Electronic City, and build your property empire across India!

![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18.3-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933)

---

## ✨ Features

### 🎮 Core Gameplay
- **40 Board Spaces** featuring iconic Indian locations across Delhi, Mumbai, Bangalore, and Kolkata
- **Property Trading** - Buy, sell, and mortgage properties
- **Building System** - Construct houses and hotels on your properties
- **Dice Rolling** with animated dice mechanics
- **Turn-based Multiplayer** with real-time synchronization

### 🏛️ Indian Themed Properties
| Color Group | Locations |
|-------------|-----------|
| 🟫 Brown | Old Delhi, Chandni Chowk |
| 🔵 Light Blue | Lodhi Road, Khan Market, India Gate |
| 🩷 Pink | Connaught Place, Rajpath, Lutyen's Delhi |
| 🟠 Orange | Nariman Point, Marine Drive, Bandra-Kurla Complex |
| 🔴 Red | Brigade Road, MG Road, Commercial Street |
| 🟡 Yellow | Electronic City, Whitefield, Koramangala |
| 🟢 Green | Park Street, Salt Lake City, New Town |
| 🔷 Dark Blue | Bandra West, Juhu Beach |

### 🚂 Special Spaces
- **4 Railway Stations**: New Delhi, Chhatrapati Shivaji Terminus, Bangalore City, Howrah
- **2 Utilities**: Electric Company & Water Works
- **Chance & Community Chest** cards with Indian context
- **Income Tax & Super Tax** spaces

### 💬 Real-time Features
- **Live Chat System** - Communicate with other players during the game
- **WebSocket Integration** - Instant updates across all connected players
- **Game State Synchronization** - Everyone sees the same board state

### 📱 User Experience
- **Responsive Design** - Play on desktop or mobile devices
- **Minimizable Chat** - Keep the board visible with collapsible chat
- **Intuitive UI** - Clean, modern interface with Indian design elements

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **Backend** | Node.js, Express, WebSocket (ws) |
| **UI Components** | Radix UI, Lucide Icons, Framer Motion |
| **Database** | Drizzle ORM with PostgreSQL support |
| **Form Handling** | React Hook Form, Zod validation |
| **Routing** | Wouter |
| **State Management** | TanStack Query |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AniketPatel369/Bharat-Bhumi.git
   cd Bharat-Bhumi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables (if using database)**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5000`

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production server |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push database schema changes |

---

## 🎯 Game Rules

1. **Objective**: Be the wealthiest player by buying, renting, and trading properties
2. **Starting Money**: Each player receives ₹15,000 to start
3. **Passing START**: Collect ₹2,000 each time you pass or land on START
4. **Buying Properties**: Land on an unowned property? Buy it or let it go to auction
5. **Rent**: Landing on owned properties requires paying rent to the owner
6. **Color Groups**: Own all properties in a color group to build houses and hotels
7. **Jail**: Three ways out - pay ₹500, use a Get Out of Jail card, or roll doubles

---

## 🏗️ Project Structure

```
BharatBhumi/
├── client/               # React frontend
│   └── src/
│       ├── components/   # UI components
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Utilities & constants
│       └── pages/        # Page components
├── server/               # Express backend
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Data persistence
│   └── index.ts          # Server entry point
├── shared/               # Shared types & data
│   ├── schema.ts         # TypeScript interfaces
│   └── boardData.ts      # Board configuration
└── package.json
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by the classic Monopoly board game
- Board design featuring iconic Indian landmarks and cities
- Built with ❤️ for Indian gaming enthusiasts

---

<div align="center">
  <strong>🏠 Build Your Empire Across Bharat! 🇮🇳</strong>
</div>
