import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Serve static files from public directory
app.use(express.static('public'));

// Serve the test HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-floating-widget-final.html'));
});

// API endpoint for widget data
app.get('/api/floating-widget-data', (req, res) => {
  const shop = req.query.shop;
  
  console.log('API: Received request for shop:', shop);
  
  // Return mock data for testing
  const widgetData = {
    title: "Support Chat",
    color: "#e63946",
    greeting: "👋 Welcome! How can we help you?",
    position: "right",
    isActive: true,
    shop: shop,
    messages: [
      {
        from: "bot",
        text: "👋 Welcome! How can we help you?",
        timestamp: new Date().toISOString()
      }
    ]
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  res.json(widgetData);
});

app.listen(port, () => {
  console.log(`🚀 Test server running at http://localhost:${port}`);
  console.log(`📱 Test the widget at http://localhost:${port}`);
  console.log(`🔧 API endpoint: http://localhost:${port}/api/floating-widget-data`);
});
