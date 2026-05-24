import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface UserPresence {
  socketId: string;
  userId: string;
  name: string;
  email: string;
  color: string;
  cursor?: { x: number; y: number; selection?: any };
}

const activeRooms: Record<string, UserPresence[]> = {};

export const initSocketIO = (httpServer: HTTPServer, clientUrl: string) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join document room
    socket.on('join-room', ({ docId, userId, name, email, color }) => {
      socket.join(docId);
      
      const user: UserPresence = {
        socketId: socket.id,
        userId,
        name,
        email,
        color,
      };

      if (!activeRooms[docId]) {
        activeRooms[docId] = [];
      }

      // Avoid duplicates for the same socket connection
      activeRooms[docId] = activeRooms[docId].filter(u => u.socketId !== socket.id);
      activeRooms[docId].push(user);

      console.log(`[Socket.io] User ${name} (${email}) joined room: ${docId}`);

      // Notify others in room
      socket.to(docId).emit('user-joined', user);

      // Send the current list of online users in this document to the newly joined user
      io.to(docId).emit('room-users', activeRooms[docId]);
    });

    // Cursor position updates
    socket.on('cursor-move', ({ docId, cursor }) => {
      const users = activeRooms[docId] || [];
      const user = users.find((u) => u.socketId === socket.id);
      if (user) {
        user.cursor = cursor;
        // Broadcast the cursor move to all other clients in the room
        socket.to(docId).emit('cursor-update', {
          socketId: socket.id,
          userId: user.userId,
          name: user.name,
          color: user.color,
          cursor,
        });
      }
    });

    // Title update notifications
    socket.on('title-update', ({ docId, title }) => {
      // Broadcast title update to other users in the room so their inline titles update in real-time
      socket.to(docId).emit('title-updated', { title });
    });

    // Explicit room leave
    socket.on('leave-room', ({ docId }) => {
      socket.leave(docId);
      if (activeRooms[docId]) {
        const leftUser = activeRooms[docId].find(u => u.socketId === socket.id);
        activeRooms[docId] = activeRooms[docId].filter((u) => u.socketId !== socket.id);
        
        if (leftUser) {
          socket.to(docId).emit('user-left', { socketId: socket.id, name: leftUser.name });
        }
        io.to(docId).emit('room-users', activeRooms[docId]);
      }
      console.log(`[Socket.io] Client ${socket.id} explicitly left room: ${docId}`);
    });

    // Disconnection
    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      
      // Remove from any active rooms
      for (const docId in activeRooms) {
        const room = activeRooms[docId];
        const index = room.findIndex((u) => u.socketId === socket.id);
        if (index !== -1) {
          const leftUser = room[index];
          room.splice(index, 1);
          
          socket.to(docId).emit('user-left', { socketId: socket.id, name: leftUser.name });
          io.to(docId).emit('room-users', room);

          if (room.length === 0) {
            delete activeRooms[docId];
          }
          break;
        }
      }
    });
  });

  return io;
};
export default initSocketIO;
