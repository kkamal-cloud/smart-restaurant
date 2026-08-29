module.exports = (io, socket) => {
  // Join kitchen room
  socket.on('joinKitchen', () => {
    socket.join('kitchen');
    console.log(`Socket ${socket.id} joined kitchen room`);
  });

  // Join session room
  socket.on('joinSession', (sessionId) => {
    socket.join(`session:${sessionId}`);
    console.log(`Socket ${socket.id} joined session room: ${sessionId}`);
  });

  socket.on('leaveSession', (sessionId) => {
    socket.leave(`session:${sessionId}`);
  });
};
