
require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RestaurantTable = require('../models/RestaurantTable');
const Category = require('../models/Category');
const Food = require('../models/Food');
const Stock = require('../models/Stock');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding');

    await User.deleteMany({});
    await RestaurantTable.deleteMany({});
    await Category.deleteMany({});
    await Food.deleteMany({});
    await Stock.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    const users = await User.insertMany([
      { name: 'Admin User', email: 'admin@rest.com', password: hashedPassword, role: 'admin' },
      { name: 'Kitchen 1', email: 'kitchen1@rest.com', password: hashedPassword, role: 'kitchen' },
      { name: 'Kitchen 2', email: 'kitchen2@rest.com', password: hashedPassword, role: 'kitchen' },
      { name: 'Waiter 1', email: 'waiter1@rest.com', password: hashedPassword, role: 'waiter' }
    ]);
    console.log('Users seeded');

    const tables = await RestaurantTable.insertMany([
      { tableNumber: 'T1', capacity: 2, location: 'Window', qrToken: 't1_qr_token' },
      { tableNumber: 'T2', capacity: 4, location: 'Center', qrToken: 't2_qr_token' },
      { tableNumber: 'T3', capacity: 6, location: 'Corner', qrToken: 't3_qr_token' },
      { tableNumber: 'T4', capacity: 2, location: 'Patio', qrToken: 't4_qr_token' },
      { tableNumber: 'T5', capacity: 4, location: 'Patio', qrToken: 't5_qr_token' },
    ]);
    console.log('Tables seeded');

    const categories = await Category.insertMany([
      { name: 'Starters', description: 'Appetizers to start your meal', sortOrder: 1 },
      { name: 'Main Course', description: 'Hearty main dishes', sortOrder: 2 },
      { name: 'Desserts', description: 'Sweet treats', sortOrder: 3 },
      { name: 'Beverages', description: 'Refreshing drinks', sortOrder: 4 },
    ]);
    console.log('Categories seeded');

    // Mongoose post-save hook might run if we used create, but insertMany bypasses it. 
    // Wait, the specification says "Auto-seed a stock record when a Food is created (post-save hook)."
    // My menuController creates stock explicitly. So if I use insertMany here, I should also create stock manually here.
    const foods = await Food.insertMany([
      { name: 'Spring Rolls', price: 5, category: categories[0]._id },
      { name: 'Bruschetta', price: 6, category: categories[0]._id },
      { name: 'Garlic Bread', price: 4, category: categories[0]._id },
      { name: 'Grilled Salmon', price: 18, category: categories[1]._id },
      { name: 'Steak Frites', price: 22, category: categories[1]._id },
      { name: 'Pasta Carbonara', price: 14, category: categories[1]._id },
      { name: 'Cheesecake', price: 7, category: categories[2]._id },
      { name: 'Chocolate Lava Cake', price: 8, category: categories[2]._id },
      { name: 'Tiramisu', price: 7, category: categories[2]._id },
      { name: 'Mojito', price: 5, category: categories[3]._id },
      { name: 'Iced Tea', price: 3, category: categories[3]._id },
      { name: 'Latte', price: 4, category: categories[3]._id },
    ]);

    const stockRecords = foods.map(f => ({
      food: f._id,
      quantity: 100,
      lowStockThreshold: 10
    }));

    await Stock.insertMany(stockRecords);
    console.log('Foods and Stock seeded');

    console.log('Seeding Completed Successfully');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
