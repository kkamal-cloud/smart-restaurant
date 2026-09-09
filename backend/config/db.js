const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

const connectDB = async () => {
  let uri = process.env.MONGO_URI;
  let usingMemoryDb = false;

  try {
    const conn = await mongoose.connect(uri);
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
    if (!uri || /^mongodb:\/\/(127\.0\.0\.1|localhost)/i.test(uri)) {
      try {
        memoryServer = await MongoMemoryServer.create();
        uri = memoryServer.getUri();
        usingMemoryDb = true;
        const conn = await mongoose.connect(uri);
        console.log(`Local MongoDB unavailable; using in-memory MongoDB instead.`);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        try {
          const admin = conn.connection.db.admin();
          const hello = await admin.command({ hello: 1 });
          conn.connection.isReplicaSet = !!hello.setName;
          console.log(`MongoDB Replica Set support: ${conn.connection.isReplicaSet}`);
        } catch (e) {
          conn.connection.isReplicaSet = false;
          console.log(`MongoDB Replica Set check failed, assuming standalone: ${e.message}`);
        }

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
      } catch (memoryError) {
        console.error(`Error: ${error.message}`);
        console.error(`Fallback memory DB failed: ${memoryError.message}`);
        process.exit(1);
      }
    } else {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }

  process.on('SIGINT', async () => {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    process.exit(0);
  });
};

module.exports = connectDB;
