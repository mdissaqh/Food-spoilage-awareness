const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  foodName: String,
  foodCategory: String,
  weight: Number,
  nutritionScore: Number,
  expectedExpiryHours: Number,
  quantity: Number,
  // Provider Metadata for NGOs to know pickup locations
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  providerName: String,
  addressLine: String,
  city: String,
  state: String,
  pincode: String
});

module.exports = mongoose.model('Food', foodSchema);