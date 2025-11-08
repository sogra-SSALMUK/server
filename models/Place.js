const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  addr: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  lat: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  lng: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Place', placeSchema);

