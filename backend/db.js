const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "kms-user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "kms-db",
  password: process.env.DB_PASSWORD || "kms-user123",
  port: process.env.DB_PORT || 5432,
});

// Function to test the database connection
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

module.exports = { testConnection };