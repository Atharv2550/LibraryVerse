const http = require('http');
require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const { ensureInitialAdmin } = require('./utils/seedAdmin');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start server after attempting DB connection
connectDB().then(async () => {
  await ensureInitialAdmin();
  server.listen(PORT, () => {
    console.log(`🚀 BookVerse Backend Server running on port http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});
