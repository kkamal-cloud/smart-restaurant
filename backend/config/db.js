const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
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
