
const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    duration: {
      type: Number,
      required: true,
      min: 1
    },

    calories: {
      type: Number,
      required: true,
      min: 1
    },

    category: {
      type: String,
      enum: ["Cardio", "Strength", "Flexibility", "Sports", "Other"],
      default: "Other"
    },

    date: {
      type: String,
      match: /^\d{4}-\d{2}-\d{2}$/
    },

    // Connect this workout to its owner
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Workout", workoutSchema);
