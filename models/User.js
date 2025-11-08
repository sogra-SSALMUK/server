const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  user_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  nationality: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female'],
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 1,
    max: 150
  },
  contact_method: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// 비밀번호 저장 전 해싱
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(15);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

