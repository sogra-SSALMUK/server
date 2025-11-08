const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2: {
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
    enum: ['pending', 'both_agreed', 'rejected'],
    default: 'pending'
  },
  user1_agreed: {
    type: Boolean,
    default: false
  },
  user2_agreed: {
    type: Boolean,
    default: false
  },
  matchedAt: {
    type: Date,
    default: Date.now
  },
  contactSharedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// user1 < user2로 정렬하여 중복 방지
matchSchema.pre('save', async function(next) {
  if (this.user1.toString() > this.user2.toString()) {
    [this.user1, this.user2] = [this.user2, this.user1];
    [this.user1_agreed, this.user2_agreed] = [this.user2_agreed, this.user1_agreed];
  }
  next();
});

// 같은 user1, user2, place의 중복 방지
matchSchema.index({ user1: 1, user2: 1, place: 1 }, { unique: true });

module.exports = mongoose.model('Match', matchSchema);

