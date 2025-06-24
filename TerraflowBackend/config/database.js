const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'terraflow_scm',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Initialize database and create tables
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
      // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await connection.query(`USE ${process.env.DB_NAME}`);
    
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role ENUM('admin', 'customer', 'supplier') NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        mobile VARCHAR(20),
        address TEXT,
        business_name VARCHAR(255),
        business_address TEXT,
        business_document VARCHAR(255),
        contact_no VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        login_attempts INT DEFAULT 0,
        locked_until TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_active (is_active)
      )
    `);

    // Create products table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category ENUM('raw_materials', 'finished_products', 'tools', 'packaging', 'chemicals') NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        stock_quantity INT NOT NULL DEFAULT 0,
        minimum_stock INT NOT NULL DEFAULT 10,
        unit VARCHAR(50) DEFAULT 'pieces',
        sku VARCHAR(100) UNIQUE,
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_active (is_active),
        INDEX idx_stock (stock_quantity)
      )
    `);

    // Create orders table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        customer_id INT NOT NULL,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        total_amount DECIMAL(10,2) NOT NULL,
        shipping_address TEXT NOT NULL,
        payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_customer (customer_id),
        INDEX idx_status (status),
        INDEX idx_created (created_at)
      )
    `);

    // Create order_items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_order (order_id),
        INDEX idx_product (product_id)
      )
    `);

    // Create material_requests table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS material_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        supplier_id INT NOT NULL,
        material_type VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        unit VARCHAR(50) NOT NULL,
        required_date DATE NOT NULL,
        description TEXT,
        status ENUM('pending', 'approved', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        admin_notes TEXT,
        supplier_response TEXT,
        requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_supplier (supplier_id),
        INDEX idx_status (status),
        INDEX idx_required_date (required_date)
      )
    `);

    // Create inventory_movements table for tracking stock changes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_id INT NOT NULL,
        movement_type ENUM('in', 'out', 'adjustment') NOT NULL,
        quantity INT NOT NULL,
        reference_type ENUM('order', 'purchase', 'adjustment', 'return') NOT NULL,
        reference_id INT,
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_product (product_id),
        INDEX idx_type (movement_type),
        INDEX idx_created (created_at)
      )
    `);

    // Create suppliers_performance table for tracking supplier metrics
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS supplier_performance (
        id INT PRIMARY KEY AUTO_INCREMENT,
        supplier_id INT NOT NULL,
        total_requests INT DEFAULT 0,
        completed_requests INT DEFAULT 0,
        cancelled_requests INT DEFAULT 0,
        avg_delivery_days DECIMAL(5,2),
        rating DECIMAL(3,2),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_supplier (supplier_id)
      )
    `);

    // Insert default admin user
    const [adminExists] = await connection.execute(
      'SELECT id FROM users WHERE email = ? AND role = ?',
      ['admin@terraflow.com', 'admin']
    );

    if (adminExists.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await connection.execute(`
        INSERT INTO users (role, full_name, email, password, is_active, is_verified)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['admin', 'System Administrator', 'admin@terraflow.com', hashedPassword, true, true]);
      
      console.log('✅ Default admin user created');
      console.log('   Email: admin@terraflow.com');
      console.log('   Password: admin123');
    }

    // Insert sample products
    const [productsExist] = await connection.execute('SELECT COUNT(*) as count FROM products');
    if (productsExist[0].count === 0) {
      const sampleProducts = [
        ['Red Clay', 'High-quality red clay for ceramic production', 'raw_materials', 15.99, 500, 50, 'kg', 'RC001'],
        ['White Clay', 'Premium white clay for fine ceramics', 'raw_materials', 22.50, 300, 30, 'kg', 'WC001'],
        ['Glazing Materials', 'Complete glazing solution set', 'raw_materials', 45.00, 100, 10, 'set', 'GM001'],
        ['Ceramic Bowls', 'Handcrafted ceramic bowls', 'finished_products', 12.99, 150, 20, 'pieces', 'CB001'],
        ['Pottery Tools Set', 'Professional pottery tools', 'tools', 89.99, 75, 5, 'set', 'PT001'],
        ['Kiln Fire Bricks', 'Heat resistant fire bricks', 'raw_materials', 3.50, 1000, 100, 'pieces', 'FB001']
      ];

      for (const product of sampleProducts) {
        await connection.execute(`
          INSERT INTO products (name, description, category, price, stock_quantity, minimum_stock, unit, sku)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, product);
      }
      console.log('✅ Sample products inserted');
    }

    connection.release();
    console.log('✅ Database initialization completed');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};
