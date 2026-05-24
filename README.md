# DocMate

Real-time Collaborative Document Editor


## System Architecture

- **Frontend**: Next.js 14 (App Router, TypeScript) styled with Tailwind CSS, running the Tiptap rich text editor coupled with Yjs CRDTs and `y-websocket` synchronization. Zustand manages global states.
- **Backend**: Express + Node.js (TypeScript) exposing REST APIs for document operations, MongoDB (Mongoose) for document storage, and Socket.io alongside native WebSockets on a single port for live synchronization, cursor tracking, and presence indicators.

---

## Tech Stack

### Client (/client)
- **Next.js 14** (App Router, TS)
- **Tailwind CSS** (Styling)
- **Tiptap Editor** (Rich Text Editor framework)
- **Yjs** & **y-websocket** (CRDT collaboration engines)
- **Socket.io Client** (Presence tracking & events)
- **Axios** (API requests with automatic token refresh queue)
- **Zustand** (Store state management)
- **Lucide React** (Icons)

### Server (/server)
- **Node.js** & **Express** (TypeScript)
- **Socket.io** (Room networking & events)
- **MongoDB** & **Mongoose** (Database persistent models)
- **JSON Web Tokens (JWT)** & **Bcryptjs** (Secure Authentication)
- **ws** (Native WebSocket server upgrade for Yjs)
- **ioredis** (Redis client for scaling room synchronization)

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm
- MongoDB local instance running at `mongodb://localhost:27017`
- *Optional*: Redis server running locally at `redis://localhost:6379` (Server degrades gracefully if Redis is unavailable)

### Configuration (.env setup)

#### 1. Server Configuration
Create a `/server/.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/collab-editor
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:3000
```

#### 2. Client Configuration
Create a `/client/.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

---

## Run Development Servers

From the root directory, run the following commands to install packages and start the project:

### 1. Install Workspace Dependencies
```bash
# Installs root, client, and server dependencies
npm install
npm install --prefix client
npm install --prefix server
```

### 2. Start Both Client and Server Concurrently
```bash
# Runs Next.js at localhost:3000 and Node.js at localhost:5000
npm run dev
```

---

## Key Features Implemented

1. **Authentication (JWT & Refresh)**
   - Registration, Login, and Automatic Token Refresh endpoints.
   - Global Axios request interceptors that silently renew tokens.
2. **Document Management**
   - Create, list, rename, delete, and open documents.
   - Dynamic permission control: `owner` (can edit/delete/share), `editor` (can edit/share), and `viewer` (read-only view).
3. **Real-time Collaboration**
   - Coexisting Socket.io and native WebSocket server on port 5000.
   - Yjs CRDT synchronization for conflict-free edits.
   - Active cursors showing other users' selection ranges and custom colors.
   - Active presence avatars in the editor header.
4. **Auto-save & Version History**
   - Background interval loop that takes a document snapshot every 60 seconds.
   - History panel displaying version snapshots (saved date, author).
   - "Preview Version" content drawer and "Restore Version" functionality.
