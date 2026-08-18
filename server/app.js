const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const corsOptions = require('./config/corsOptions');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const tableRoutes = require('./routes/tableRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const kitchenRoutes = require('./routes/kitchenRoutes');
const billRoutes = require('./routes/billRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const stockRoutes = require('./routes/stockRoutes');
const reportRoutes = require('./routes/reportRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api', tableRoutes); // tables and qr
app.use('/api/sessions', sessionRoutes);
app.use('/api', menuRoutes); // categories and foods
app.use('/api/orders', orderRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/feedback', feedbackRoutes);

app.use(errorHandler);

module.exports = app;
