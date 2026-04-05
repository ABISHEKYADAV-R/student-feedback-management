const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({path: path.join(__dirname, '..', '.env')});

async function reset() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    });
    
    console.log('Dropping and recreating database...');
    await connection.query(`DROP DATABASE IF EXISTS \`${process.env.DB_NAME}\``);
    await connection.query(`CREATE DATABASE \`${process.env.DB_NAME}\``);
    await connection.query(`USE \`${process.env.DB_NAME}\``);
    
    console.log('Running schema.sql...');
    const authPath = path.join(__dirname, '../../database/schema.sql');
    const sqlContent = await fs.readFile(authPath, 'utf-8');
    await connection.query(sqlContent);
    
    console.log('Database reset and schema applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

reset();
