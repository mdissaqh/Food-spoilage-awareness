const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  foodName: { type: String, required: true },
  weight: { type: Number, required: true },
  nutritionScore: { type: Number, required: true },
  expectedExpiryHours: { type: Number, required: true }, 
  createdAt: { type: Date, required: true }, 
  
  // NEW: Geolocation tracking
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  providerName: String,
  addressLine: String,
  city: String,
  state: String,
  pincode: String
});

module.exports = mongoose.model('Food', foodSchema);