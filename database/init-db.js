const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const dbName = process.env.DB_NAME || 'cineverse_db';

  console.log(`[Init DB] Connecting to MySQL server at ${host}:${port} as ${user}...`);

  let connection;
  try {
    // Connect without selecting database first
    connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      multipleStatements: true
    });

    console.log('[Init DB] Connection established. Creating database if not exists...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${dbName}\`;`);
    console.log(`[Init DB] Using database \`${dbName}\`.`);

    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'cineverse_db.sql');
    if (fs.existsSync(sqlFilePath)) {
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      console.log('[Init DB] Executing cineverse_db.sql statements...');
      await connection.query(sqlContent);
      console.log('[Init DB] Database schema and sample data successfully initialized!');
    } else {
      console.error('[Init DB] SQL file not found at:', sqlFilePath);
    }
  } catch (error) {
    console.error('[Init DB Error]', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Check if MySQL server is started.');
    console.error('2. Verify your DB_PASSWORD in .env matches your MySQL root password.');
    console.error('3. If you use a non-default port, update DB_PORT in .env.');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  initDatabase().then(() => {
    console.log('[Init DB] Initialization complete.');
    process.exit(0);
  });
}

module.exports = initDatabase;
