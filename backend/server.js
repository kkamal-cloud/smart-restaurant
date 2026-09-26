require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { setupSocket } = require('./sockets/socketSetup');

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);
  setupSocket(server);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
