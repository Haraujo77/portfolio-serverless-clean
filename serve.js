const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the current directory
app.use(express.static(path.join(__dirname, '/')));

// Main route - serve the index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to view your portfolio`);
});