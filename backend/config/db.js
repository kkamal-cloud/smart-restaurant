const mongoose = require('mongoose');
const dns = require('dns');
const migrateSequentialNumbers = require('../scripts/migrateSequentialNumbers');

// Set public DNS servers to resolve MongoDB Atlas SRV records if local ISP DNS fails
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-migrate sequential numbers for existing records
    await migrateSequentialNumbers();

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
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};


module.exports = connectDB;
