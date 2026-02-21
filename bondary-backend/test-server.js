const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Test the organizations endpoint
app.get('/api/v1/identity/organizations', (req, res) => {
  console.log('Organizations endpoint called');
  res.json({ 
    organizations: [],
    total: 0
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Organizations endpoint available at: http://localhost:${PORT}/api/v1/identity/organizations`);
});
