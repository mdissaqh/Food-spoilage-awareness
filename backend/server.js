const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const Food = require('./models/Food');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Route 1: Get all inventory
app.get('/api/food', async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Route 2: Seed the database with mock data for the Hackathon Demo
app.post('/api/seed', async (req, res) => {
  try {
    await Food.deleteMany({});
    const mockData = [
      { name: "Fresh Apples", category: "Fruit", weight: 50, nutrition: 85, expiry_days: 5, quantity: 100 },
      { name: "Canned Beans", category: "Pantry", weight: 200, nutrition: 70, expiry_days: 365, quantity: 500 },
      { name: "Whole Wheat Bread", category: "Bakery", weight: 30, nutrition: 60, expiry_days: 3, quantity: 60 },
      { name: "Leafy Greens", category: "Vegetable", weight: 20, nutrition: 95, expiry_days: 2, quantity: 40 },
      { name: "Rice Bags", category: "Pantry", weight: 400, nutrition: 50, expiry_days: 180, quantity: 50 },
      { name: "Milk Cartons", category: "Dairy", weight: 80, nutrition: 80, expiry_days: 4, quantity: 80 },
      { name: "Potatoes", category: "Vegetable", weight: 150, nutrition: 65, expiry_days: 14, quantity: 150 }
    ];
    await Food.insertMany(mockData);
    res.json({ message: "Mock data seeded successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to seed data" });
  }
});

// Route 3: Call Python Quantum Engine
app.post('/api/optimize', async (req, res) => {
  const { capacity } = req.body;
  try {
    const inventory = await Food.find();
    
    // Structure data exactly as Python expects
    const payload = {
      capacity: capacity,
      items: inventory.map(item => ({
        id: item._id.toString(),
        name: item.name,
        weight: item.weight,
        nutrition: item.nutrition,
        expiry_days: item.expiry_days
      }))
    };

    // Send to Python FastAPI server
    const quantumRes = await axios.post('http://127.0.0.1:8000/optimize', payload);
    
    if (quantumRes.data.error) {
      return res.status(400).json({ error: quantumRes.data.error });
    }

    const selectedIds = quantumRes.data.selected_ids;

    // Filter out the selected items from our DB to send to frontend
    const selectedFoods = inventory.filter(item => selectedIds.includes(item._id.toString()));
    
    res.json(selectedFoods);
  } catch (error) {
    console.error('Optimization error:', error.message);
    res.status(500).json({ error: "Quantum Optimization failed. Is Python running?" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Node Backend running on port ${PORT}`));