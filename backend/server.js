const express = require('express');

const app = express();

// routing path
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server
app.listen(8080, () => {
  console.log('Server started on http://localhost:8080');
});