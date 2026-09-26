const mongoose = require('mongoose');
const dns = require('dns');
const migrateSequentialNumbers = require('../scripts/migrateSequentialNumbers');

const connectDB = async () => {
  try {
    let conn;
    try {
      // Try connecting with standard configuration
      conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      });
    } catch (firstErr) {
      console.warn(`Standard MongoDB connection failed (${firstErr.message}). Retrying with custom DNS servers...`);
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (e) {}
      conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      });
    }

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-migrate sequential numbers for existing records
    try {
      await migrateSequentialNumbers();
    } catch (migErr) {
      console.warn(`Migration warning: ${migErr.message}`);
    }

    // Detect Replica Set support
    try {
      const admin = conn.connection.db.admin();
      const hello = await admin.command({ hello: 1 });
      conn.connection.isReplicaSet = !!hello.setName;
      console.log(`MongoDB Replica Set support: ${conn.connection.isReplicaSet}`);
    } catch (e) {
      conn.connection.isReplicaSet = false;
      console.log(`MongoDB Replica Set check failed, assuming standalone: ${e.message}`);
    }
  } catch (error) {
    console.error(`MongoDB Connection Failed: ${error.message}`);
  }
};

module.exports = connectDB;
