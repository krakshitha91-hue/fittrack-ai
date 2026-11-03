
const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    calories: {
      type: Number,
      required: true,
      min: 0
    },

    protein: {
      type: Number,
      default: 0,
      min: 0
    },

    carbs: {
      type: Number,
      default: 0,
      min: 0
    },

    fat: {
      type: Number,
      default: 0,
      min: 0
    },
    
date: {
  type: String,
  match: /^\d{4}-\d{2}-\d{2}$/,
  default: () => new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date()),
},
category: {
  type: String,
  default: "Other",
},
    

    // Connect this meal to its owner
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

module.exports = mongoose.model("Meal", mealSchema);
