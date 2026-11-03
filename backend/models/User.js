const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    age: {
      type: Number,
      min: 13,
      max: 120,
    },

    heightCm: {
      type: Number,
      min: 50,
      max: 250,
    },

    weightKg: {
      type: Number,
      min: 20,
      max: 400,
    },

    fitnessGoal: {
      type: String,
      enum: ["General fitness", "Weight loss", "Muscle gain", "Maintenance"],
      default: "General fitness",
    },

    goals: {
      calories: { type: Number, default: 2200, min: 1 },
      protein: { type: Number, default: 100, min: 0 },
      carbs: { type: Number, default: 250, min: 0 },
      fat: { type: Number, default: 70, min: 0 },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);