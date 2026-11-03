
const mongoose = require("mongoose");

// Connect to MongoDB Atlas
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);

    // Stop the backend if database connection fails
    process.exit(1);
  }
};

module.exports = connectDB;
