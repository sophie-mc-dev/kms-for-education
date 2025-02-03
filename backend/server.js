const express = require('express');


// Next initialize the application
const app = express();

// routing path
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});