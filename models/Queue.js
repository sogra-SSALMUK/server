const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  place: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'matched', 'removed'],
    default: 'active'
  }
}, {
  timestamps: true
});

// 같은 user와 place의 중복 방지
queueSchema.index({ user: 1, place: 1 }, { unique: true });

module.exports = mongoose.model('Queue', queueSchema);

