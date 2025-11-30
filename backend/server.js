const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./db');
const { verifyToken, requireRole } = require('./middleware/auth');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
  res.send('LED Screen Seller & Renter API is running');
});

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const quoteRoutes = require('./routes/quotes');
const rentalRoutes = require('./routes/rentals');
const salesOrderRoutes = require('./routes/sales_orders');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/sales_orders', salesOrderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
