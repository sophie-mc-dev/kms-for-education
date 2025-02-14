require('dotenv').config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST, 
  database: process.env.DB_NAME, 
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432, 
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("Successfully connected to PostgreSQL database!");
    client.release();
    return true;
  } catch (error) {
    console.error("Error connecting to PostgreSQL database:", error);
    return false;
  }
};

module.exports = { pool, testConnection };