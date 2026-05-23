const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  foodName: { type: String, required: true },
  weight: { type: Number, required: true },
  nutritionScore: { type: Number, required: true },
  expectedExpiryHours: { type: Number, required: true }, // REMAINING safe hours
  createdAt: { type: Date, required: true }, // Explicitly set by the provider
  
  // Provider Metadata for NGOs
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  providerName: String,
  addressLine: String,
  city: String,
  state: String,
  pincode: String
});

module.exports = mongoose.model('Food', foodSchema);