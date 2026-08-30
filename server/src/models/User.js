// server/src/models/User.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    // select: false prevents password from being included in query results by default
    password: { type: String, required: [true, 'Password is required'], select: false },
    role: {
      type: String,
      enum: ['admin', 'sre_operator', 'developer'],
      default: 'sre_operator',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
