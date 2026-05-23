const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const Food = require('./models/Food');
const Organization = require('./models/Organization');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- AUTHENTICATION ROUTES ---

app.post('/api/register', async (req, res) => {
  try {
    const existing = await Organization.findOne({ uniqueID: req.body.uniqueID });
    if (existing) return res.status(400).json({ error: "UniqueID already exists" });

    const org = new Organization(req.body);
    await org.save();
    res.status(201).json(org);
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const org = await Organization.findOne({ uniqueID: req.body.uniqueID });
    if (!org) return res.status(404).json({ error: "Organization not found" });
    res.json(org);
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// --- FOOD INVENTORY ROUTES ---

// Get all food (For NGOs)
app.get('/api/food', async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Get food by specific provider (For Provider Dashboard)
app.get('/api/food/provider/:providerId', async (req, res) => {
  try {
    const foods = await Food.find({ providerId: req.params.providerId });
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch provider data" });
  }
});

// Add food (By Provider)
app.post('/api/food', async (req, res) => {
  try {
    const newFood = new Food(req.body);
    await newFood.save();
    res.status(201).json(newFood);
  } catch (err) {
    res.status(400).json({ error: "Failed to add food item" });
  }
});

// Delete food
app.delete('/api/food/:id', async (req, res) => {
  try {
    await Food.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete item" });
  }
});

// --- QUANTUM OPTIMIZATION ROUTE ---

app.post('/api/optimize', async (req, res) => {
  const { capacity } = req.body;
  try {
    const inventory = await Food.find();
    
    // Map data for Python, now using expectedExpiryHours
    const payload = {
      capacity: capacity,
      items: inventory.map(item => ({
        id: item._id.toString(),
        name: item.foodName,
        weight: item.weight,
        nutrition: item.nutritionScore,
        expiry_hours: item.expectedExpiryHours
      }))
    };

    const quantumRes = await axios.post('http://127.0.0.1:8000/optimize', payload);
    
    if (quantumRes.data.error) {
      return res.status(400).json({ error: quantumRes.data.error });
    }

    const selectedIds = quantumRes.data.selected_ids;
    // Returns full objects WITH provider metadata to the NGO
    const selectedFoods = inventory.filter(item => selectedIds.includes(item._id.toString()));
    
    res.json(selectedFoods);
  } catch (error) {
    console.error('Optimization error:', error.message);
    res.status(500).json({ error: "Quantum Optimization failed. Is Python running?" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Node Backend running on port ${PORT}`));