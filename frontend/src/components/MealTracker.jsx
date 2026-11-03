import api from "../api";
import { useState } from "react";
import { getRecordDate } from "../dateUtils";

function MealTracker({
  meals,
  setMeals,
  selectedDate,
  setSelectedDate,
  onUnauthorized,
}) {
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [category, setCategory] = useState("Breakfast");
  const [editingMealId, setEditingMealId] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const visibleMeals = meals.filter(
    (meal) => getRecordDate(meal) === selectedDate
  );
  const totalCalories = visibleMeals.reduce(
    (total, meal) => total + Number(meal.calories || 0),
    0
  );

  function resetForm() {
    setFoodName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setCategory("Breakfast");
    setEditingMealId("");
  }

  function startEditing(meal) {
    setEditingMealId(meal._id);
    setFoodName(meal.name);
    setCalories(String(meal.calories));
    setProtein(String(meal.protein ?? 0));
    setCarbs(String(meal.carbs ?? 0));
    setFat(String(meal.fat ?? 0));
    setCategory(meal.category || "Breakfast");
    setError("");
  }

  async function handleAddMeal(event) {
    event.preventDefault();

    const name = foodName.trim();
    const calorieValue = Number(calories);
    const nutrition = {
      protein: protein === "" ? 0 : Number(protein),
      carbs: carbs === "" ? 0 : Number(carbs),
      fat: fat === "" ? 0 : Number(fat),
    };

    if (
      !name ||
      calories === "" ||
      !Number.isFinite(calorieValue) ||
      calorieValue < 0 ||
      Object.values(nutrition).some(
        (value) => !Number.isFinite(value) || value < 0
      )
    ) {
      setError("Enter a food name and non-negative nutrition values.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      const payload = {
        name,
        calories: calorieValue,
        ...nutrition,
        category,
        date: selectedDate,
      };
      const response = editingMealId
        ? await api.put(`/meals/${editingMealId}`, payload)
        : await api.post("/meals", payload);
      const savedMeal = response.data.meal || response.data;

      setMeals((previousMeals) =>
        editingMealId
          ? previousMeals.map((meal) =>
              meal._id === editingMealId ? savedMeal : meal
            )
          : [...previousMeals, savedMeal]
      );
      resetForm();
    } catch (error) {
      console.error("Failed to save meal:", error);

      if (error.response?.status === 401) {
        onUnauthorized();
        return;
      }

      setError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Could not save meal. Try again."
      );

    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteMeal(id) {
    try {
      setError("");

      await api.delete(`/meals/${id}`);

      setMeals((previousMeals) =>
        previousMeals.filter((meal) => meal._id !== id)
      );
      if (editingMealId === id) resetForm();
    } catch (error) {
      console.error("Failed to delete meal:", error);

      if (error.response?.status === 401) {
        onUnauthorized();
        return;
      }

      setError(
        error.response?.data?.message ||
        error.message ||
        "Could not delete meal."
      );
    }
  }

  return (
    <section id="meal-history" className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

      <h2 className="text-xl font-bold">
        Food Tracker
      </h2>

      <p className="mt-2 text-slate-500">
        Total calories: {totalCalories} kcal
      </p>

      <label className="mt-4 block text-sm font-medium text-slate-600">
        Meal history date
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="mt-1 block w-full rounded-lg border p-3 sm:w-auto"
        />
      </label>

      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Meal input form */}
      <form
        onSubmit={handleAddMeal}
        className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >

        <input
          type="text"
          placeholder={editingMealId ? "Edit food name" : "Food name"}
          value={foodName}
          onChange={(event) =>
            setFoodName(event.target.value)
          }
          className="rounded-lg border p-3"
          required
        />

        <input
          type="number"
          placeholder="Calories"
          min="0"
          step="any"
          value={calories}
          onChange={(event) =>
            setCalories(event.target.value)
          }
          className="rounded-lg border p-3"
          required
        />

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-lg border bg-white p-3"
          aria-label="Meal category"
        >
          <option>Breakfast</option>
          <option>Lunch</option>
          <option>Dinner</option>
        </select>

        <input
          type="number"
          placeholder="Protein (g)"
          min="0"
          step="any"
          value={protein}
          onChange={(event) => setProtein(event.target.value)}
          className="rounded-lg border p-3"
        />
        <input
          type="number"
          placeholder="Carbs (g)"
          min="0"
          step="any"
          value={carbs}
          onChange={(event) => setCarbs(event.target.value)}
          className="rounded-lg border p-3"
        />
        <input
          type="number"
          placeholder="Fat (g)"
          min="0"
          step="any"
          value={fat}
          onChange={(event) => setFat(event.target.value)}
          className="rounded-lg border p-3"
        />

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-emerald-600 p-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 sm:col-span-2 lg:col-span-1"
        >
          {isSaving
            ? "Saving..."
            : editingMealId
              ? "Save Changes"
              : "Add Meal"}
        </button>
        {editingMealId && (
          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border p-3 font-medium text-slate-600"
          >
            Cancel edit
          </button>
        )}

      </form>

      {/* Display meals */}
      <div className="mt-5 space-y-3">
        {visibleMeals.length === 0 ? (
          <p className="text-slate-500">No meals recorded on this date.</p>
        ) : (
          visibleMeals.map((meal) => (
            <div
              key={meal._id}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-800">{meal.name}</h3>
                  <p className="text-sm text-slate-500">
                    {meal.category || "Breakfast"}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => startEditing(meal)}
                    className="text-sm font-medium text-emerald-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMeal(meal._id)}
                    className="text-sm font-medium text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="mt-2 text-lg font-bold text-emerald-600">
                {meal.calories} kcal
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="text-xs text-slate-500">Protein</p>
                  <p className="font-semibold">{meal.protein ?? 0} g</p>
                </div>

                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="text-xs text-slate-500">Carbs</p>
                  <p className="font-semibold">{meal.carbs ?? 0} g</p>
                </div>

                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="text-xs text-slate-500">Fat</p>
                  <p className="font-semibold">{meal.fat ?? 0} g</p>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </section>
  );
}

export default MealTracker;
