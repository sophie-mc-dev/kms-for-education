const express = require('express');
const { testConnection } = require('./db');


const app = express();
const port = 8080;

app.get('/', (req, res) => {
  res.send('Welcome to the KMS Backend!');
});

app.listen(port, async () => {
  console.log(`Server is listening on port ${port}`);
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error("Database connection failed. Exiting...");
    process.exit(1); 
  }
});
