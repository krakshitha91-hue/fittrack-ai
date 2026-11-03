
import { useState } from "react";
import api from "../api";
import { getRecordDate } from "../dateUtils";

function WorkoutTracker({
  workouts,
  setWorkouts,
  selectedDate,
  setSelectedDate,
  onUnauthorized,
}) {
  const [workoutName, setWorkoutName] = useState("");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [category, setCategory] = useState("Other");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const dailyWorkouts = workouts.filter(
    (workout) => getRecordDate(workout) === selectedDate
  );
  const totalBurned = dailyWorkouts.reduce(
    (total, workout) => total + Number(workout.calories || 0),
    0
  );
  const totalDuration = dailyWorkouts.reduce(
    (total, workout) => total + Number(workout.duration || 0),
    0
  );

  // Add workout to MongoDB
  async function handleAddWorkout(event) {
    event.preventDefault();

    const name = workoutName.trim();
    const durationValue = Number(duration);
    const calorieValue = Number(calories);

    if (
      !name ||
      duration === "" ||
      calories === "" ||
      !Number.isFinite(durationValue) ||
      !Number.isFinite(calorieValue) ||
      durationValue <= 0 ||
      calorieValue < 1
    ) {
      setError("Enter valid workout details.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const response = await api.post("/workouts", {
        name,
        duration: durationValue,
        calories: calorieValue,
        category,
        date: selectedDate,
      });

      // Backend returns the saved document inside response.data.workout
      const savedWorkout = response.data.workout;

      setWorkouts((previous) => [
        ...previous,
        savedWorkout,
      ]);

      setWorkoutName("");
      setDuration("");
      setCalories("");
      setCategory("Other");
    } catch (error) {
      console.error("Failed to save workout:", error);
      if (error.response?.status === 401) {
        onUnauthorized();
        return;
      }
      setError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Could not save workout. Try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Delete workout from MongoDB
  async function handleDeleteWorkout(id) {
    try {
      setError("");

      await api.delete(`/workouts/${id}`);

      setWorkouts((previous) =>
        previous.filter((workout) => workout._id !== id)
      );
    } catch (error) {
      console.error("Failed to delete workout:", error);
      if (error.response?.status === 401) {
        onUnauthorized();
        return;
      }
      setError(
        error.response?.data?.message ||
        error.message ||
        "Could not delete workout."
      );
    }
  }

  return (
    <section id="workout-history" className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Workout Tracker</h2>

      <p className="mt-2 text-slate-500">
        {dailyWorkouts.length} workouts · {totalDuration} minutes ·{" "}
        {totalBurned} kcal burned on {selectedDate}
      </p>

      <label className="mt-4 block text-sm font-medium text-slate-600">
        Workout history date
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="mt-1 block w-full rounded-lg border p-3 sm:w-auto"
        />
      </label>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      <form
        onSubmit={handleAddWorkout}
        className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input
          type="text"
          placeholder="Workout name"
          value={workoutName}
          onChange={(event) => setWorkoutName(event.target.value)}
          className="rounded-lg border p-3"
          required
        />

        <input
          type="number"
          placeholder="Duration (minutes)"
          min="1"
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          className="rounded-lg border p-3"
          required
        />

        <input
          type="number"
          placeholder="Calories burned"
          step="any"
          min="1"
          value={calories}
          onChange={(event) => setCalories(event.target.value)}
          className="rounded-lg border p-3"
          required
        />

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-lg border bg-white p-3"
          aria-label="Workout category"
        >
          <option>Cardio</option>
          <option>Strength</option>
          <option>Flexibility</option>
          <option>Sports</option>
          <option>Other</option>
        </select>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-emerald-600 p-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Add Workout"}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {dailyWorkouts.length === 0 ? (
          <p className="text-sm text-slate-500">
            No workouts recorded on this date.
          </p>
        ) : (
          dailyWorkouts.map((workout) => (
            <div
              key={workout._id}
              className="flex items-center justify-between gap-4 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{workout.name}</p>
                <p className="text-sm text-slate-500">
                  {workout.category || "Other"} · {workout.duration} minutes ·{" "}
                  {workout.calories} kcal burned
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteWorkout(workout._id)}
                className="text-sm font-medium text-red-600"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default WorkoutTracker;
