const { GoogleGenAI } = require("@google/genai");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const jwt = require("jsonwebtoken");

const Meal = require("./models/Meal");
const Workout = require("./models/Workout");
require("dotenv").config();

const protect = require("./middleware/authMiddleware");
const connectDB = require("./config/db");

const express = require("express");
const cors = require("cors");

const app = express();
function getIndiaDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(date));

  const values = {};
  parts.forEach((part) => {
    values[part.type] = part.value;
  });

  return `${values.year}-${values.month}-${values.day}`;
}

function isValidDateString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value;
}

function getIndiaDayRange(dateString = getIndiaDateString()) {
  const [year, month, day] = dateString.split("-").map(Number);
  const indiaMidnightUTC =
    Date.UTC(year, month - 1, day) - 330 * 60 * 1000;

  return {
    start: new Date(indiaMidnightUTC),
    end: new Date(indiaMidnightUTC + 24 * 60 * 60 * 1000),
  };
}

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const GEMINI_MODEL = "gemini-3.5-flash";
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and WEBP images are allowed."));
    }
  },
});

const uploadFoodImage = (req, res, next) => {
  upload.single("foodImage")(req, res, (error) => {
    if (error) {
      console.error("Food image upload error:", error.message);
      return res.status(error instanceof multer.MulterError ? 400 : 415).json({
        message: error.message,
      });
    }

    return next();
  });
};

app.post(
  "/api/ai/analyze-food",
  protect,
  uploadFoodImage,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Please upload a food image." });
      }

      const prompt = `Estimate nutrition for the visible food serving. Return only valid JSON with this shape:
{"foodName":"string","servingSize":"string","calories":0,"protein":0,"carbs":0,"fat":0}
Use non-negative numbers. If the image does not show identifiable food, return {"foodName":"Unidentified food","servingSize":"Unknown","calories":0,"protein":0,"carbs":0,"fat":0}. These are estimates, not medical advice.`;
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            inlineData: {
              mimeType: req.file.mimetype,
              data: req.file.buffer.toString("base64"),
            },
          },
          prompt,
        ],
        config: { responseMimeType: "application/json" },
      });

      if (typeof response.text !== "string" || !response.text.trim()) {
        throw new Error("Gemini returned an empty food analysis.");
      }

      const nutrition = JSON.parse(response.text);
      const numericFields = ["calories", "protein", "carbs", "fat"];
      if (
        typeof nutrition.foodName !== "string" ||
        typeof nutrition.servingSize !== "string" ||
        numericFields.some(
          (field) =>
            !Number.isFinite(nutrition[field]) || nutrition[field] < 0
        )
      ) {
        throw new Error("Invalid nutrition response from AI.");
      }

      return res.status(200).json({ nutrition });
    } catch (error) {
      console.error("Food analysis error:", {
        status: error.status,
        message: error.message,
      });
      return res.status(500).json({
        message: "Food image analysis failed. Please try again.",
      });
    }
  }
);

app.post("/api/ai/recommendations", protect, async (req, res) => {
  try {
    if (req.body.date !== undefined && !isValidDateString(req.body.date)) {
      return res.status(400).json({ message: "Invalid date. Use YYYY-MM-DD." });
    }

    const user = await User.findById(req.userId).select(
      "age heightCm weightKg fitnessGoal goals"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const date = isValidDateString(req.body.date)
      ? req.body.date
      : getIndiaDateString();
    const { start, end } = getIndiaDayRange(date);
    const legacyDateFilter = {
      date: { $exists: false },
      createdAt: { $gte: start, $lt: end },
    };
    const [meals, workouts] = await Promise.all([
      Meal.find({
        user: req.userId,
        $or: [{ date }, legacyDateFilter],
      }).select("name calories protein carbs fat"),
      Workout.find({
        user: req.userId,
        $or: [{ date }, legacyDateFilter],
      }).select("name category duration calories"),
    ]);

    const nutrition = meals.reduce(
      (totals, meal) => ({
        calories: totals.calories + meal.calories,
        protein: totals.protein + meal.protein,
        carbs: totals.carbs + meal.carbs,
        fat: totals.fat + meal.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const prompt = `Give 3 concise, practical fitness recommendations for this day. Use general wellness advice only, avoid diagnosis, extreme dieting, or guaranteed outcomes. Mention uncertainty if profile data is incomplete.
Profile: age ${user.age ?? "not provided"}, height ${user.heightCm ?? "not provided"} cm, weight ${user.weightKg ?? "not provided"} kg, goal ${user.fitnessGoal}.
Daily goals: ${JSON.stringify(user.goals)}.
Nutrition so far: ${JSON.stringify(nutrition)}.
Workouts: ${JSON.stringify(workouts)}.
Return plain text with exactly 3 numbered recommendations.`;
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    if (typeof response.text !== "string" || !response.text.trim()) {
      throw new Error("AI returned empty recommendations.");
    }

    return res.status(200).json({ recommendations: response.text.trim() });
  } catch (error) {
    console.error("Fitness recommendation error:", error);
    return res.status(500).json({
      message: "Could not generate fitness recommendations.",
    });
  }
});


// Get meal history belonging to the logged-in user, optionally for one day.
app.get("/api/meals", protect, async (req, res) => {
  try {
    const filter = { user: req.userId };
    if (req.query.date !== undefined) {
      if (!isValidDateString(req.query.date)) {
        return res.status(400).json({ message: "Invalid date. Use YYYY-MM-DD." });
      }

      const { start, end } = getIndiaDayRange(req.query.date);
      filter.$or = [
        { date: req.query.date },
        { date: { $exists: false }, createdAt: { $gte: start, $lt: end } },
      ];
    }

    const meals = await Meal.find(filter).sort({ createdAt: -1 });

    return res.status(200).json(meals);
  } catch (error) {
    console.error("Fetch meals error:", error);
    return res.status(500).json({
      message: "Failed to fetch meals",
    });
  }
});
app.get("/api/meals/weekly", protect, async (req, res) => {
  try {
    const today = getIndiaDateString();
    const [year, month, day] = today.split("-").map(Number);

    const todayStart = getIndiaDayRange(today).start;
    const weekStart = new Date(todayStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);

    const weeklyMeals = await Meal.aggregate([
      {
        $match: {
          user: new Meal.db.base.Types.ObjectId(req.userId),
          $or: [
            {
              date: {
                $gte: (() => {
                  const d = new Date(weekStart);
                  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
                })(),
                $lte: today,
              },
            },
            {
              date: { $exists: false },
              createdAt: { $gte: weekStart, $lt: getIndiaDayRange(today).end },
            },
          ],
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $ifNull: [
                  {
                    $dateFromString: {
                      dateString: "$date",
                      format: "%Y-%m-%d",
                      timezone: "Asia/Kolkata",
                    },
                  },
                  "$createdAt",
                ],
              },
              timezone: "Asia/Kolkata",
            },
          },
          calories: { $sum: "$calories" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json(weeklyMeals);
  } catch (error) {
    console.error("Weekly meals error:", error);
    return res.status(500).json({ message: "Failed to fetch weekly meals." });
  }
});

// Change password for the logged-in user
app.put("/api/auth/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Enter your current and new passwords."
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters."
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    // Verify the current password
    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect."
      });
    }

    // Hash and save the new password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully."
    });
  } catch (error) {
    console.error("Change password error:", error.message);

    return res.status(500).json({
      message: "Failed to change password."
    });
  }
});

// Add a meal for the logged-in user.
app.post("/api/meals", protect, async (req, res) => {
  try {
    const { name, calories, protein, carbs, fat, category, date } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      calories === "" ||
      !Number.isFinite(Number(calories)) ||
      Number(calories) < 0 ||
      (date !== undefined && !isValidDateString(date))
    ) {
      return res.status(400).json({
        message: "Valid food name, calories, and date are required.",
      });
    }

    const nutrients = { protein, carbs, fat };
    for (const [field, value] of Object.entries(nutrients)) {
      if (
        value !== undefined &&
        (value === "" || !Number.isFinite(Number(value)) || Number(value) < 0)
      ) {
        return res.status(400).json({ message: `Invalid ${field} value.` });
      }
    }

    const meal = await Meal.create({
      name: name.trim(),
      calories: Number(calories),
      protein: Number(protein ?? 0),
      carbs: Number(carbs ?? 0),
      fat: Number(fat ?? 0),
      category,
      date: date || getIndiaDateString(),
      user: req.userId,
    });

    return res.status(201).json({ meal });
  } catch (error) {
    console.error("Add meal error:", error);
    return res.status(400).json({
      message: "Failed to add meal.",
      error: error.message,
    });
  }
});

// Get the logged-in user's profile.
app.get("/api/auth/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch profile"
    });
  }
});

// Update the logged-in user's profile.
app.put("/api/auth/profile", protect, async (req, res) => {
  try {
    const { name, age, heightCm, weightKg, fitnessGoal } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }

    const updates = { name: name.trim() };
    const unset = {};
    const numericFields = {
      age: [13, 120],
      heightCm: [50, 250],
      weightKg: [20, 400],
    };
    for (const [field, [minimum, maximum]] of Object.entries(numericFields)) {
      if (req.body[field] !== undefined && req.body[field] !== "") {
        const value = Number(req.body[field]);
        if (!Number.isFinite(value) || value < minimum || value > maximum) {
          return res.status(400).json({ message: `Invalid ${field}.` });
        }
        updates[field] = value;
      } else if (req.body[field] === "") {
        unset[field] = 1;
      }
    }

    const validFitnessGoals = [
      "General fitness",
      "Weight loss",
      "Muscle gain",
      "Maintenance",
    ];
    if (
      fitnessGoal !== undefined &&
      !validFitnessGoals.includes(fitnessGoal)
    ) {
      return res.status(400).json({ message: "Invalid fitness goal." });
    }
    if (fitnessGoal !== undefined) updates.fitnessGoal = fitnessGoal;

    const updateOperation = { $set: updates };
    if (Object.keys(unset).length > 0) updateOperation.$unset = unset;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updateOperation,
      { returnDocument: "after", runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ message: "Profile updated.", user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(400).json({ message: "Failed to update profile." });
  }
});

// Update fitness goals
app.put("/api/auth/goals", protect, async (req, res) => {
  try {
    const { calories, protein, carbs, fat } = req.body;

    const goals = { calories, protein, carbs, fat };

    for (const [key, value] of Object.entries(goals)) {
      if (
        value === undefined ||
        !Number.isFinite(Number(value)) ||
        Number(value) < (key === "calories" ? 1 : 0)
      ) {
        return res.status(400).json({
          message: `Invalid ${key} goal`,
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      {
        goals: {
          calories: Number(calories),
          protein: Number(protein),
          carbs: Number(carbs),
          fat: Number(fat),
        },
      },
      { returnDocument: "after", runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Fitness goals updated!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update goals error:", error);
    return res.status(500).json({
      message: "Failed to update fitness goals",
    });
  }
});

// Update a meal owned by the logged-in user.
app.put("/api/meals/:id", protect, async (req, res) => {
  try {
    const { name, calories, protein, carbs, fat, category, date } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      calories === "" ||
      !Number.isFinite(Number(calories)) ||
      Number(calories) < 0 ||
      (date !== undefined && !isValidDateString(date))
    ) {
      return res.status(400).json({
        message: "Valid food name, calories, and date are required.",
      });
    }

    const update = {
      name: name.trim(),
      calories: Number(calories),
      protein: Number(protein ?? 0),
      carbs: Number(carbs ?? 0),
      fat: Number(fat ?? 0),
    };
    for (const field of ["protein", "carbs", "fat"]) {
      if (!Number.isFinite(update[field]) || update[field] < 0) {
        return res.status(400).json({ message: `Invalid ${field} value.` });
      }
    }
    if (category !== undefined) update.category = category;
    if (date !== undefined) update.date = date;

    const meal = await Meal.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: update },
      { returnDocument: "after", runValidators: true }
    );

    if (!meal) {
      return res.status(404).json({
        message: "Meal not found"
      });
    }

    return res.status(200).json({
      message: "Meal updated successfully!",
      meal
    });
  } catch (error) {
    console.error("Update meal error:", error);
    return res.status(400).json({
      message: "Failed to update meal",
      error: error.message
    });
  }
});

// DELETE a meal owned by the logged-in user
app.delete("/api/meals/:id", protect, async (req, res) => {
  try {
    const meal = await Meal.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!meal) {
      return res.status(404).json({
        message: "Meal not found"
      });
    }

    res.status(200).json({
      message: "Meal deleted successfully!"
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to delete meal"
    });
  }
});

app.get("/api/test", (req, res) => {
  res.json({ message: "FitTrack backend is working!" });
});

// Get workout history belonging to the logged-in user, optionally for one day.
app.get("/api/workouts", protect, async (req, res) => {
  try {
    const today = getIndiaDateString();
const { start, end } = getIndiaDayRange(today);

const filter = {
  user: req.userId,
  $or: [
    { date: today },
    {
      date: { $exists: false },
      createdAt: { $gte: start, $lt: end },
    },
  ],
};
    if (req.query.date !== undefined) {
      if (!isValidDateString(req.query.date)) {
        return res.status(400).json({ message: "Invalid date. Use YYYY-MM-DD." });
      }

      const { start, end } = getIndiaDayRange(req.query.date);
      filter.$or = [
        { date: req.query.date },
        { date: { $exists: false }, createdAt: { $gte: start, $lt: end } },
      ];
    }

    const workouts = await Workout.find(filter).sort({ createdAt: -1 });

    res.status(200).json(workouts);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch workouts"
    });
  }
});

// Add a workout for the logged-in user.
app.post("/api/workouts", protect, async (req, res) => {
  try {
    const { name, duration, calories, category, date } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      duration === "" ||
      calories === "" ||
      !Number.isFinite(Number(duration)) ||
      Number(duration) <= 0 ||
      !Number.isFinite(Number(calories)) ||
      Number(calories) < 1 ||
      (date !== undefined && !isValidDateString(date))
    ) {
      return res.status(400).json({ message: "Enter valid workout details." });
    }

    const workout = await Workout.create({
      name: name.trim(),
      duration: Number(duration),
      calories: Number(calories),
      category,
      date: date || getIndiaDateString(),
      user: req.userId
    });

    res.status(201).json({
      message: "Workout added successfully!",
      workout
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to add workout",
      error: error.message
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message
    });
  }
});

// DELETE a workout owned by the logged-in user
app.delete("/api/workouts/:id", protect, async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!workout) {
      return res.status(404).json({
        message: "Workout not found"
      });
    }

    res.status(200).json({
      message: "Workout deleted successfully!"
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to delete workout"
    });
  }
});



// Register a new user
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    // Require a minimum password length
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long.",
      });
    }

    // Normalize the email address
    const normalizedEmail = email.trim().toLowerCase();

    // Check whether the email is already registered
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "This email is already registered.",
      });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the new user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    // Never return the password or password hash
    return res.status(201).json({
      message: "Registration successful!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    // Handle duplicate-email race conditions
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This email is already registered.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Registration failed. Please try again.",
    });
  }
});










// Connect to MongoDB before starting the server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
