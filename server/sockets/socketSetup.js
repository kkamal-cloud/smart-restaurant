const { Server } = require('socket.io');
const corsOptions = require('../config/corsOptions');
let io;

const setupSocket = (server) => {
  io = new Server(server, {
    cors: corsOptions
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    require('./socketEvents')(io, socket);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = {
  setupSocket,
  getIo
};
