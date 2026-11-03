import { useEffect, useState } from "react";
import API from "../api";

function Profile({ user, setUser }) {
  const [name, setName] = useState(user?.name || "");
  const [age, setAge] = useState(user?.age ?? "");
  const [heightCm, setHeightCm] = useState(user?.heightCm ?? "");
  const [weightKg, setWeightKg] = useState(user?.weightKg ?? "");
  const [fitnessGoal, setFitnessGoal] = useState(
    user?.fitnessGoal || "General fitness"
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [goals, setGoals] = useState({
    calories: user?.goals?.calories ?? 2200,
    protein: user?.goals?.protein ?? 100,
    carbs: user?.goals?.carbs ?? 250,
    fat: user?.goals?.fat ?? 70,
  });
  const [goalMessage, setGoalMessage] = useState("");
  const [goalError, setGoalError] = useState("");
  const [savingGoals, setSavingGoals] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get("/auth/profile");
        const profile = response.data;

        setName(profile.name);
        setAge(profile.age ?? "");
        setHeightCm(profile.heightCm ?? "");
        setWeightKg(profile.weightKg ?? "");
        setFitnessGoal(profile.fitnessGoal || "General fitness");
        setUser(profile);

        setGoals({
          calories: profile.goals?.calories ?? 2200,
          protein: profile.goals?.protein ?? 100,
          carbs: profile.goals?.carbs ?? 250,
          fat: profile.goals?.fat ?? 70,
        });

        localStorage.setItem("user", JSON.stringify(profile));
      } catch (requestError) {
        console.error("Failed to load profile:", requestError);
        setError(
          requestError.response?.data?.message || "Failed to load profile."
        );
      }
    };

    fetchProfile();
  }, [setUser]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.put("/auth/profile", {
        name: name.trim(),
        age: age === "" ? "" : Number(age),
        heightCm: heightCm === "" ? "" : Number(heightCm),
        weightKg: weightKg === "" ? "" : Number(weightKg),
        fitnessGoal,
      });

      const updatedUser = {
        ...user,
        ...response.data.user,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Profile update failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoals = async (e) => {
    e.preventDefault();
    setGoalMessage("");
    setGoalError("");

    try {
      setSavingGoals(true);

      const response = await API.put("/auth/goals", {
        calories: Number(goals.calories),
        protein: Number(goals.protein),
        carbs: Number(goals.carbs),
        fat: Number(goals.fat),
      });

      const updatedUser = {
        ...user,
        ...response.data.user,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setGoals(updatedUser.goals);
      setGoalMessage("Fitness goals saved successfully!");
    } catch (err) {
      setGoalError(
        err.response?.data?.message || "Failed to save fitness goals."
      );
    } finally {
      setSavingGoals(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    try {
      setChangingPassword(true);

      const response = await API.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setPasswordMessage(response.data.message);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Failed to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const goalFields = [
    { key: "calories", label: "Daily Calories", unit: "kcal" },
    { key: "protein", label: "Daily Protein", unit: "grams" },
    { key: "carbs", label: "Daily Carbs", unit: "grams" },
    { key: "fat", label: "Daily Fat", unit: "grams" },
  ];
  const heightInMeters = Number(heightCm) / 100;
  const bmi =
    Number(weightKg) > 0 && heightInMeters > 0
      ? Number(weightKg) / (heightInMeters * heightInMeters)
      : null;

  return (
    <div id="profile" className="mt-6 rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold">My Profile</h2>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="mb-1 block font-medium">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border p-3"
            required
          />
        </div>

        <div>
          <label className="mb-1 block font-medium">Email</label>
          <input
            type="email"
            value={user?.email || ""}
            readOnly
            className="w-full rounded-lg border bg-gray-100 p-3"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-medium">Age</label>
            <input
              type="number"
              min="13"
              max="120"
              value={age}
              onChange={(event) => setAge(event.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label className="mb-1 block font-medium">Height (cm)</label>
            <input
              type="number"
              min="50"
              max="250"
              step="any"
              value={heightCm}
              onChange={(event) => setHeightCm(event.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label className="mb-1 block font-medium">Weight (kg)</label>
            <input
              type="number"
              min="20"
              max="400"
              step="any"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label className="mb-1 block font-medium">Fitness goal</label>
            <select
              value={fitnessGoal}
              onChange={(event) => setFitnessGoal(event.target.value)}
              className="w-full rounded-lg border bg-white p-3"
            >
              <option>General fitness</option>
              <option>Weight loss</option>
              <option>Muscle gain</option>
              <option>Maintenance</option>
            </select>
          </div>
        </div>

        <p className="text-sm text-slate-600">
          BMI: {bmi ? `${bmi.toFixed(1)} (informational estimate)` : "Add height and weight to calculate"}
        </p>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Profile"}
        </button>

        {message && <p className="text-green-600">{message}</p>}
        {error && <p className="text-red-600">{error}</p>}
      </form>

      <div className="mt-8 border-t pt-6">
        <h3 className="mb-2 text-lg font-bold">My Daily Fitness Goals</h3>
        <p className="mb-4 text-sm text-slate-500">
          Set your personal daily nutrition targets.
        </p>

        <form onSubmit={handleSaveGoals} className="space-y-4">
          {goalFields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block font-medium">
                {field.label} ({field.unit})
              </label>
              <input
                type="number"
                min={field.key === "calories" ? "1" : "0"}
                step="any"
                value={goals[field.key]}
                onChange={(e) =>
                  setGoals((previous) => ({
                    ...previous,
                    [field.key]: e.target.value,
                  }))
                }
                className="w-full rounded-lg border p-3"
                required
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={savingGoals}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-white disabled:opacity-50"
          >
            {savingGoals ? "Saving..." : "Save Fitness Goals"}
          </button>

          {goalMessage && <p className="text-green-600">{goalMessage}</p>}
          {goalError && <p className="text-red-600">{goalError}</p>}
        </form>
      </div>

      <div className="mt-8 border-t pt-6">
        <h3 className="mb-4 text-lg font-bold">Change Password</h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="mb-1 block font-medium">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              required
              className="w-full rounded-lg border p-3"
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-white disabled:opacity-50"
          >
            {changingPassword ? "Changing..." : "Change Password"}
          </button>

          {passwordMessage && (
            <p className="text-green-600">{passwordMessage}</p>
          )}
          {passwordError && <p className="text-red-600">{passwordError}</p>}
        </form>
      </div>
    </div>
  );
}

export default Profile;