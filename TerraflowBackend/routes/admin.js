const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getAllUsers,
  getDashboardStats,
  updateUserStatus,
  deleteUser,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getAllSuppliers,
  getAllMaterialRequests,
  createMaterialRequest,
  getReportsData
} = require('../controllers/adminController');

const { authenticateToken, adminOnly } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(authenticateToken, adminOnly);

// User management routes
router.get('/users', getAllUsers);
router.put('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUser);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);

// Product management routes
router.get('/products', getAllProducts);
router.post('/products', [
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Product name must be 2-255 characters'),
  body('category').isIn(['raw_materials', 'finished_products', 'tools', 'packaging', 'chemicals']).withMessage('Invalid category'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock quantity must be a positive integer'),
  body('minimum_stock').isInt({ min: 0 }).withMessage('Minimum stock must be a positive integer'),
  body('unit').optional().trim().isLength({ max: 50 }).withMessage('Unit must not exceed 50 characters'),
  body('sku').optional().trim().isLength({ max: 100 }).withMessage('SKU must not exceed 100 characters')
], createProduct);
router.put('/products/:productId', updateProduct);
router.delete('/products/:productId', deleteProduct);

// Order management routes
router.get('/orders', getAllOrders);
router.put('/orders/:orderId/status', [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
], updateOrderStatus);

// Supplier management routes
router.get('/suppliers', getAllSuppliers);
router.get('/material-requests', getAllMaterialRequests);
router.post('/material-requests', [
  body('supplier_id').isInt().withMessage('Supplier ID must be an integer'),
  body('material_type').trim().isLength({ min: 2, max: 255 }).withMessage('Material type must be 2-255 characters'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('unit').trim().isLength({ min: 1, max: 50 }).withMessage('Unit must be 1-50 characters'),
  body('required_date').isISO8601().withMessage('Required date must be a valid date'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters')
], createMaterialRequest);

// Reports routes
router.get('/reports/sales', (req, res, next) => {
  req.query.type = 'sales';
  next();
}, getReportsData);
router.get('/reports/inventory', (req, res, next) => {
  req.query.type = 'inventory';
  next();
}, getReportsData);
router.get('/reports/suppliers', (req, res, next) => {
  req.query.type = 'suppliers';
  next();
}, getReportsData);

module.exports = router;
