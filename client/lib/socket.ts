import { io, Socket } from 'socket.io-client';

const WS_URL = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000').replace(/^ws/, 'http');

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(WS_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('[Socket.io] Connected to backend websocket.');
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io] Disconnected from backend websocket.');
    });
  }
  return socket;
};

export default getSocket;
