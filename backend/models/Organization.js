const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  organizationName: { type: String, required: true },
  organizationType: { type: String, required: true }, // Hostel, Canteen, PG, NGO
  uniqueID: { type: String, required: true, unique: true },
  mobileNumber: { type: String, required: true },
  addressLine: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true }
});

module.exports = mongoose.model('Organization', organizationSchema);