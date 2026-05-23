const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: String,
  category: String,
  weight: Number,
  nutrition: Number,
  expiry_days: Number,
  quantity: Number
});

module.exports = mongoose.model('Food', foodSchema);