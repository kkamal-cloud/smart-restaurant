require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { setupSocket } = require('./sockets/socketSetup');

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);
setupSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
