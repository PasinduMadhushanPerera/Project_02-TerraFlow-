const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { testConnection, initializeDatabase } = require('./config/database');
const { errorHandler, notFound, requestLogger } = require('./middleware/error');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const customerRoutes = require('./routes/customer');
const supplierRoutes = require('./routes/supplier');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(requestLogger);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'TerraFlow Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/supplier', supplierRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'TerraFlow SCM API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/register': 'User registration',
        'POST /api/login': 'User login',
        'GET /api/profile': 'Get user profile (Protected)',
        'PUT /api/profile': 'Update user profile (Protected)',
        'PUT /api/change-password': 'Change password (Protected)'
      },
      admin: {
        'GET /api/admin/dashboard/stats': 'Dashboard statistics',
        'GET /api/admin/users': 'Get all users',
        'PUT /api/admin/users/:id/status': 'Update user status',
        'DELETE /api/admin/users/:id': 'Delete user',
        'GET /api/admin/products': 'Get all products',
        'POST /api/admin/products': 'Create product',
        'PUT /api/admin/products/:id': 'Update product',
        'DELETE /api/admin/products/:id': 'Delete product',
        'GET /api/admin/orders': 'Get all orders',
        'PUT /api/admin/orders/:id/status': 'Update order status',
        'GET /api/admin/suppliers': 'Get all suppliers',
        'GET /api/admin/material-requests': 'Get material requests',
        'POST /api/admin/material-requests': 'Create material request',
        'GET /api/admin/reports/:type': 'Get reports (sales, inventory, suppliers)'
      },
      customer: {
        'GET /api/customer/dashboard': 'Customer dashboard',
        'GET /api/customer/products': 'Get products',
        'GET /api/customer/orders': 'Get customer orders',
        'POST /api/customer/orders': 'Create order',
        'PUT /api/customer/orders/:id/cancel': 'Cancel order'
      },
      supplier: {
        'GET /api/supplier/dashboard': 'Supplier dashboard',
        'GET /api/supplier/requests': 'Get material requests',
        'PUT /api/supplier/requests/:id/status': 'Update request status',
        'PUT /api/supplier/requests/:id/confirm-delivery': 'Confirm delivery',
        'GET /api/supplier/history': 'Delivery history',
        'GET /api/supplier/forecast': 'Forecast data'
      }
    }
  });
});

// Handle 404 errors
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🚀 Starting TerraFlow Backend Server...');
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Please check your database configuration.');
      process.exit(1);
    }

    // Initialize database tables
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API Documentation: http://localhost:${PORT}/api`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('🔧 Database Configuration:');
      console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
      console.log(`   Database: ${process.env.DB_NAME || 'terraflow_scm'}`);
      console.log(`   Port: ${process.env.DB_PORT || 3306}`);
      console.log('');
      console.log('👤 Default Admin Account:');
      console.log('   Email: admin@terraflow.com');
      console.log('   Password: admin123');
      console.log('');
      console.log('🎯 Ready to accept connections!');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
