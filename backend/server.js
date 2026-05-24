const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const { ChatMistralAI } = require('@langchain/mistralai');
const { PromptTemplate } = require('@langchain/core/prompts');
require('dotenv').config();

const Food = require('./models/Food');
const Organization = require('./models/Organization');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quantum_knapsack')
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

// --- MISTRAL AI INFERENCE ROUTE ---
app.post('/api/analyze-food', async (req, res) => {
  const { foodName, createdAt } = req.body;
  
  console.log(`\n=========================================`);
  console.log(`[AI Debug] 1. Analyzing: "${foodName}" | Created: ${createdAt}`);

  try {
    if (!process.env.MISTRAL_API_KEY) {
      throw new Error("MISTRAL_API_KEY is missing from .env");
    }

    const llm = new ChatMistralAI({
      model: "mistral-small-latest",
      temperature: 0.1, 
      apiKey: process.env.MISTRAL_API_KEY
    });

    const template = `
    You are a professional food science AI.
    Determine the average nutrition score (1-100) and the TOTAL shelf life in hours for the following food item at room temperature.
    Respond ONLY with a valid JSON object in this exact format. DO NOT use markdown blocks, backticks, or formatting.

    {{
      "nutritionScore": 88,
      "totalShelfLifeHours": 72
    }}
    
    Food Item: {food}
    `;

    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(llm);
    
    console.log(`[AI Debug] 2. Calling Mistral API...`);
    const response = await chain.invoke({ food: foodName });
    console.log(`[AI Debug] 3. Mistral Raw Response Object:`, JSON.stringify(response, null, 2));

    let text = "";
    if (response && response.content) {
      text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    } else if (response && typeof response === 'string') {
      text = response;
    } else {
      throw new Error("Mistral response content is undefined or empty. Check API response structure.");
    }
    
    console.log(`\n[AI Debug] 4. Extracted AI Text:\n${text}\n`);

    let cleanedText = text;
    if (cleanedText) {
      cleanedText = cleanedText.replace(/```json/gi, '').replace(/```/g, '').trim();
    }
    
    console.log(`[AI Debug] 5. Cleaned Text:\n${cleanedText}\n`);

    const match = cleanedText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Could not locate valid JSON brackets {} in the cleaned Mistral response.");
    }
    
    const parsedData = JSON.parse(match[0]);
    console.log(`[AI Debug] 6. Parsed JSON:`, parsedData);

    const nutritionScore = parseInt(parsedData.nutritionScore);
    const totalShelfLifeHours = parseInt(parsedData.totalShelfLifeHours);

    if (isNaN(nutritionScore) || isNaN(totalShelfLifeHours)) {
      throw new Error("Mistral returned invalid or missing numbers for nutrition or shelf life.");
    }

    const createdDate = new Date(createdAt);
    const currentDate = new Date();
    
    const diffInMs = currentDate.getTime() - createdDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    let remainingHours = Math.round(totalShelfLifeHours - diffInHours);
    if (remainingHours < 0) remainingHours = 0;

    console.log(`[AI Debug] 7. Time Math: Total Life (${totalShelfLifeHours}h) - Elapsed (${diffInHours.toFixed(1)}h) = Remaining (${remainingHours}h)`);
    console.log(`=========================================\n`);

    res.json({
      nutritionScore,
      expectedExpiryHours: remainingHours
    });

  } catch (error) {
    console.error(`\n[FATAL ERROR] Mistral Error:`, error.message);
    if (error.response && error.response.data) {
       console.error(`[Mistral API Data]:`, error.response.data);
    }
    console.log(`[AI Debug] Fallback Reason: API genuinely failed, threw invalid JSON, or timed out.`);
    console.log(`=========================================\n`);
    res.json({ nutritionScore: 50, expectedExpiryHours: 48 });
  }
});

// --- FOOD INVENTORY ROUTES ---
app.get('/api/food', async (req, res) => {
  try {
    const foods = await Food.find().sort({ createdAt: -1 });
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.get('/api/food/provider/:providerId', async (req, res) => {
  try {
    const foods = await Food.find({ providerId: req.params.providerId }).sort({ createdAt: -1 });
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch provider data" });
  }
});

app.post('/api/food', async (req, res) => {
  try {
    const newFood = new Food(req.body);
    await newFood.save();
    res.status(201).json(newFood);
  } catch (err) {
    res.status(400).json({ error: "Failed to add food item" });
  }
});

app.delete('/api/food/:id', async (req, res) => {
  try {
    await Food.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete item" });
  }
});

// --- QUANTUM OPTIMIZATION ROUTE (Distance-Aware) ---
app.post('/api/optimize', async (req, res) => {
  const { capacity, items } = req.body;
  try {
    // We now rely on the pre-filtered items array sent by the NGO Dashboard 
    // to preserve radius filtering and distance calculations.
    const payload = {
      capacity: capacity,
      items: items.map(item => ({
        id: item._id.toString(),
        name: item.foodName,
        weight: item.weight,
        nutrition: item.nutritionScore,
        expiry_hours: item.expectedExpiryHours,
        distance: item.distance || 1
      }))
    };

    const quantumRes = await axios.post('http://127.0.0.1:8000/optimize', payload);
    
    if (quantumRes.data.error) {
      return res.status(400).json({ error: quantumRes.data.error });
    }

    const selectedIds = quantumRes.data.selected_ids;
    const selectedFoods = items.filter(item => selectedIds.includes(item._id.toString()));
    
    res.json(selectedFoods);
  } catch (error) {
    console.error('Optimization error:', error.message);
    res.status(500).json({ error: "Quantum Optimization failed. Ensure Python server is running." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Node Backend running on port ${PORT}`));