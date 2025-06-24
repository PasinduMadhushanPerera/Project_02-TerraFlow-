const { pool } = require('../config/database');
const { validationResult } = require('express-validator');

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT 
        id, role, full_name, email, mobile, address, 
        business_name, is_active, created_at
      FROM users 
      WHERE role != 'admin'
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get user counts
    const [userStats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as totalCustomers,
        SUM(CASE WHEN role = 'supplier' THEN 1 ELSE 0 END) as totalSuppliers
      FROM users WHERE role != 'admin'
    `);

    // Get product count
    const [productStats] = await pool.execute(`
      SELECT COUNT(*) as totalProducts FROM products WHERE is_active = true
    `);

    // Get order stats
    const [orderStats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalOrders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
        COALESCE(SUM(total_amount), 0) as totalRevenue
      FROM orders
    `);

    res.json({
      success: true,
      data: {
        ...userStats[0],
        ...productStats[0],
        ...orderStats[0]
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

// Update user status (activate/deactivate)
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;

    // Prevent deactivating admin users
    const [user] = await pool.execute(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user[0].role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify admin user status'
      });
    }

    await pool.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active, userId]
    );

    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is admin
    const [user] = await pool.execute(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user[0].role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin user'
      });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const [products] = await pool.execute(`
      SELECT * FROM products ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};

// Create product
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      category,
      price,
      stock_quantity,
      minimum_stock,
      unit,
      sku
    } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO products (
        name, description, category, price, stock_quantity, 
        minimum_stock, unit, sku, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, description, category, price, stock_quantity, minimum_stock, unit, sku, true]);

    // Log inventory movement
    await pool.execute(`
      INSERT INTO inventory_movements (
        product_id, movement_type, quantity, reference_type, 
        notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [result.insertId, 'in', stock_quantity, 'adjustment', 'Initial stock', req.user.id]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      description,
      category,
      price,
      stock_quantity,
      minimum_stock,
      unit,
      sku
    } = req.body;

    // Get current stock for movement tracking
    const [currentProduct] = await pool.execute(
      'SELECT stock_quantity FROM products WHERE id = ?',
      [productId]
    );

    if (currentProduct.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await pool.execute(`
      UPDATE products SET 
        name = ?, description = ?, category = ?, price = ?, 
        stock_quantity = ?, minimum_stock = ?, unit = ?, sku = ?
      WHERE id = ?
    `, [name, description, category, price, stock_quantity, minimum_stock, unit, sku, productId]);

    // Log inventory movement if stock changed
    const stockDifference = stock_quantity - currentProduct[0].stock_quantity;
    if (stockDifference !== 0) {
      await pool.execute(`
        INSERT INTO inventory_movements (
          product_id, movement_type, quantity, reference_type, 
          notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        productId,
        stockDifference > 0 ? 'in' : 'out',
        Math.abs(stockDifference),
        'adjustment',
        'Stock adjustment via product update',
        req.user.id
      ]);
    }

    res.json({
      success: true,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const [product] = await pool.execute(
      'SELECT id FROM products WHERE id = ?',
      [productId]
    );

    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await pool.execute('DELETE FROM products WHERE id = ?', [productId]);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
};

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const [orders] = await pool.execute(`
      SELECT 
        o.*, 
        u.full_name as customer_name, 
        u.email as customer_email
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      ORDER BY o.created_at DESC
    `);

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    await pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
};

// Get all suppliers
const getAllSuppliers = async (req, res) => {
  try {
    const [suppliers] = await pool.execute(`
      SELECT 
        u.*,
        sp.total_requests as material_requests,
        sp.completed_requests,
        sp.avg_delivery_days,
        COALESCE(sp.total_requests - sp.completed_requests, 0) as deliveries
      FROM users u
      LEFT JOIN supplier_performance sp ON u.id = sp.supplier_id
      WHERE u.role = 'supplier'
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      data: suppliers
    });

  } catch (error) {
    console.error('Get all suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers'
    });
  }
};

// Get all material requests
const getAllMaterialRequests = async (req, res) => {
  try {
    const [requests] = await pool.execute(`
      SELECT 
        mr.*,
        u.full_name as supplier_name,
        u.business_name
      FROM material_requests mr
      JOIN users u ON mr.supplier_id = u.id
      ORDER BY mr.created_at DESC
    `);

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('Get material requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch material requests'
    });
  }
};

// Create material request
const createMaterialRequest = async (req, res) => {
  try {
    const {
      supplier_id,
      material_type,
      quantity,
      unit,
      required_date,
      description
    } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO material_requests (
        supplier_id, material_type, quantity, unit, 
        required_date, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [supplier_id, material_type, quantity, unit, required_date, description, 'pending']);

    // Update supplier performance
    await pool.execute(`
      INSERT INTO supplier_performance (supplier_id, total_requests) 
      VALUES (?, 1)
      ON DUPLICATE KEY UPDATE total_requests = total_requests + 1
    `, [supplier_id]);

    res.status(201).json({
      success: true,
      message: 'Material request created successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Create material request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create material request'
    });
  }
};

// Get reports data
const getReportsData = async (req, res) => {
  try {
    const { type } = req.query;

    let data = {};

    if (type === 'sales' || !type) {
      // Sales report
      const [salesData] = await pool.execute(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_orders,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as avg_order_value
        FROM orders 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);
      data.sales = salesData;
    }

    if (type === 'inventory' || !type) {
      // Inventory report
      const [inventoryData] = await pool.execute(`
        SELECT 
          name,
          category,
          stock_quantity,
          minimum_stock,
          CASE 
            WHEN stock_quantity <= minimum_stock THEN 'Critical'
            WHEN stock_quantity <= minimum_stock * 2 THEN 'Low'
            ELSE 'Good'
          END as stock_status,
          (stock_quantity * price) as inventory_value
        FROM products
        WHERE is_active = true
        ORDER BY stock_quantity ASC
      `);
      data.inventory = inventoryData;
    }

    if (type === 'suppliers' || !type) {
      // Supplier report
      const [supplierData] = await pool.execute(`
        SELECT 
          u.full_name as supplier_name,
          u.business_name,
          u.email,
          sp.total_requests,
          sp.completed_requests,
          sp.avg_delivery_days,
          COALESCE(sp.total_requests - sp.completed_requests, 0) as total_deliveries
        FROM users u
        LEFT JOIN supplier_performance sp ON u.id = sp.supplier_id
        WHERE u.role = 'supplier' AND u.is_active = true
        ORDER BY sp.total_requests DESC
      `);
      data.suppliers = supplierData;
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Get reports data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports data'
    });
  }
};

module.exports = {
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
};
