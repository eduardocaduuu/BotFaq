const express = require('express');

function startHealthServer(port) {
  const app = express();

  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`Health check server running on port ${port}`);
  });
}

module.exports = { startHealthServer };