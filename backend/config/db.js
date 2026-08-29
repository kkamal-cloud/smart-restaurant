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

    // Auto-seed if database tables/collections are empty
    try {
      const User = require('../models/User');
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('Database is empty. Auto-seeding initial data...');
        const seedDB = require('../scripts/seed');
        await seedDB(false);
      }
    } catch (seedErr) {
      console.error('Auto-seed check failed:', seedErr.message);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

