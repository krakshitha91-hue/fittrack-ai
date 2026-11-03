
import { useEffect, useState } from "react";
import API from "../api";

function FoodScanner({ setMeals, selectedDate }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [category, setCategory] = useState("Breakfast");

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    setError("");
    setNutrition(null);
    setSaveMessage("");

    if (!file) {
      setImage(null);
      setPreview("");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setImage(null);
      setPreview("");
      setError("Choose a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImage(null);
      setPreview("");
      setError("Image must be smaller than 5 MB.");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const saveToMealTracker = async () => {
    if (!foodName.trim()) {
      setError("Enter the food name.");
      return;
    }

    const calorieValue = Number(calories);

    if (!Number.isFinite(calorieValue) || calorieValue < 0) {
      setError("Enter a valid calorie value.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSaveMessage("");

      const response = await API.post("/meals", {
        name: foodName.trim(),
        calories: calorieValue,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        category,
        date: selectedDate,
      });

      const savedMeal = response.data.meal || response.data;

      setMeals((previousMeals) => [...previousMeals, savedMeal]);
      setSaveMessage("Food saved to your Meal Tracker!");
      setCategory("Breakfast");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save food. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const analyzeFood = async (e) => {
    e.preventDefault();

    if (!image) {
      setError("Please select a food image first.");
      return;
    }

    setLoading(true);
    setError("");
    setNutrition(null);
    setSaveMessage("");

    try {
      const formData = new FormData();
      formData.append("foodImage", image);

      const response = await API.post("/ai/analyze-food", formData);
      const result = response.data.nutrition;

      if (!result || typeof result.foodName !== "string") {
        throw new Error("The food analysis returned an invalid result.");
      }

      setNutrition(result);
      setFoodName(result.foodName);
      setCalories(String(result.calories));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not analyze the image. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="food-scanner"
      className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-bold">AI Food Scanner</h2>

      <p className="mt-2 text-sm text-slate-500">
        Upload a food photo to estimate its nutritional values.
      </p>

      <form onSubmit={analyzeFood} className="mt-5 space-y-4">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          className="block w-full rounded-lg border p-3"
        />

        {preview && (
          <img
            src={preview}
            alt="Selected food"
            className="max-h-64 rounded-xl object-contain"
          />
        )}

        <button
          type="submit"
          disabled={!image || loading}
          className="rounded-lg bg-emerald-600 px-5 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Analyzing food..." : "Analyze Food"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {nutrition && (
        <div className="mt-6 rounded-xl bg-emerald-50 p-5">
          <p className="font-semibold text-slate-800">
            Estimated serving: {nutrition.servingSize || "Not specified"}
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Food Name
              </label>
              <input
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className="w-full rounded-lg border p-3"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Meal category
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-lg border bg-white p-3"
              >
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Dinner</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Calories (kcal)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full rounded-lg border p-3"
                required
              />
            </div>

            <button
              type="button"
              onClick={saveToMealTracker}
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-5 py-3 font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add to Meal Tracker"}
            </button>

            {saveMessage && (
              <p className="text-sm text-emerald-700" role="status">
                {saveMessage}
              </p>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-white p-3">
              <p className="text-sm text-slate-500">Protein</p>
              <p className="font-bold">{nutrition.protein} g</p>
            </div>

            <div className="rounded-lg bg-white p-3">
              <p className="text-sm text-slate-500">Carbs</p>
              <p className="font-bold">{nutrition.carbs} g</p>
            </div>

            <div className="rounded-lg bg-white p-3">
              <p className="text-sm text-slate-500">Fat</p>
              <p className="font-bold">{nutrition.fat} g</p>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Nutrition values are AI estimates and may not reflect the
            actual portion size or ingredients.
          </p>
        </div>
      )}
    </section>
  );
}

export default FoodScanner;
