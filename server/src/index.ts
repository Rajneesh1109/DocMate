import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { connectDB } from './config/db';
import authRouter from './routes/auth';
import documentsRouter from './routes/documents';
import { initSocketIO } from './socket/index';
import { initYjsWebSocket } from './socket/yjsHandler';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Middlewares
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// REST Routes
app.use('/api/auth', authRouter);
app.use('/api/docs', documentsRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Real-time Collaborative Editor Server is running.' });
});

// Setup Socket.io
initSocketIO(server, CLIENT_URL);

// Setup Yjs WebSockets Coexisting on the same HTTP server
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const urlObj = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  // Let Socket.io handle its own upgrade requests (which start with /socket.io)
  if (!pathname.startsWith('/socket.io')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

// Initialize Yjs handlers
initYjsWebSocket(wss);

// Connect to DB and Start HTTP/WS server
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`[Server] Express + WebSockets listening on port ${PORT}`);
  });
};

startServer();
