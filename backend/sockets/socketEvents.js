module.exports = (io, socket) => {
  // Join kitchen room
  socket.on('joinKitchen', () => {
    socket.join('kitchen');
    console.log(`Socket ${socket.id} joined kitchen room`);
  });

  // Join admin room
  socket.on('joinAdmin', () => {
    socket.join('admin');
    console.log(`Socket ${socket.id} joined admin room`);
  });

  // Join session room
  socket.on('joinSession', (sessionId) => {
    if (sessionId) {
      socket.join(`session:${sessionId}`);
      console.log(`Socket ${socket.id} joined session room: ${sessionId}`);
    }
  });

  socket.on('leaveSession', (sessionId) => {
    if (sessionId) {
      socket.leave(`session:${sessionId}`);
    }
  });
};
