const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'cineverse_db',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  dateStrings: true
};

const pool = mysql.createPool(dbConfig);

// Test database connection helper
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Successfully connected to MySQL database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[Database Connection Error]', error.message);
    console.warn('\n--- DATABASE SETUP HINT ---');
    console.warn('1. Make sure your MySQL Server is running (e.g. via MySQL Workbench, XAMPP, or Windows Services).');
    console.warn('2. Ensure credentials in .env match your MySQL settings (host, user, password, port).');
    console.warn('3. Run "npm run init-db" to create and seed the "cineverse_db" database.\n');
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  query: (sql, params) => pool.query(sql, params)
};
