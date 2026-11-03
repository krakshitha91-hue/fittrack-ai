import Profile from "./components/Profile";
import Login from "./components/Login";
import Register from "./components/Register";

import { useState, useEffect, useCallback } from "react";
import api from "./api";
import WorkoutTracker from "./components/WorkoutTracker";
import MealTracker from "./components/MealTracker";
import FoodScanner from "./components/FoodScanner";
import {
  Activity,
  Apple,
  Flame,
  Target,
  Dumbbell,
  Home,
  User,
  Settings,
  Plus,
  Droplets,
} from "lucide-react";
import { getRecordDate, getTodayDate } from "./dateUtils";
import FitnessRecommendations from "./components/FitnessRecommendations";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function StatCard({ title, value, unit, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>

        <div className={`rounded-xl p-2 ${color}`}>
          <Icon size={20} />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <h2 className="text-3xl font-bold text-slate-800">
          {value}
        </h2>

        <span className="text-sm text-slate-500">
          {unit}
        </span>
      </div>
    </div>
  );
}

function App() {
 const [user, setUser] = useState(() => {
  const savedUser = localStorage.getItem("user");
  return savedUser ? JSON.parse(savedUser) : null;
});

const [token, setToken] = useState(() =>
  localStorage.getItem("token")
);

const [meals, setMeals] = useState([]);
const [workouts, setWorkouts] = useState([]);
const [mealError, setMealError] = useState("");
const [workoutError, setWorkoutError] = useState("");
const [showRegister, setShowRegister] = useState(false);
const [selectedDate, setSelectedDate] = useState(getTodayDate);

const handleLogout = useCallback(() => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  setToken(null);
  setUser(null);
  setMeals([]);
  setWorkouts([]);
  setMealError("");
  setWorkoutError("");
}, []);

  function handleAuthenticated(authToken, authenticatedUser) {
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(authenticatedUser));
    setToken(authToken);
    setUser(authenticatedUser);
  }

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let isActive = true;

    async function fetchFitnessData() {
      try {
        const [mealResponse, workoutResponse] = await Promise.all([
          api.get("/meals"),
          api.get("/workouts"),
        ]);

        if (isActive) {
          setMeals(mealResponse.data);
          setWorkouts(workoutResponse.data);
          setMealError("");
          setWorkoutError("");
        }
      } catch (error) {
        console.error("Failed to load fitness data:", error);

        if (!isActive) {
          return;
        }

        if (error.response?.status === 401) {
          handleLogout();
          return;
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          "Could not load fitness data.";
        setMealError(message);
        setWorkoutError(message);
      }
    }

    fetchFitnessData();

    return () => {
      isActive = false;
    };
  }, [token, handleLogout]);



const dailyGoals = user?.goals || {
  calories: 2200,
  protein: 100,
  carbs: 250,
  fat: 70,
};

const calorieGoal = dailyGoals.calories;
const proteinGoal = dailyGoals.protein;
const carbsGoal = dailyGoals.carbs;
const fatGoal = dailyGoals.fat;

const dailyMeals = meals.filter((meal) => getRecordDate(meal) === selectedDate);
const dailyWorkouts = workouts.filter(
  (workout) => getRecordDate(workout) === selectedDate
);

const caloriesConsumed = dailyMeals.reduce(
  (total, meal) => total + Number(meal.calories || 0),
  0
);

const proteinConsumed = dailyMeals.reduce(
  (total, meal) => total + Number(meal.protein || 0),
  0
);

const carbsConsumed = dailyMeals.reduce(
  (total, meal) => total + Number(meal.carbs || 0),
  0
);

const fatConsumed = dailyMeals.reduce(
  (total, meal) => total + Number(meal.fat || 0),
  0
);

const caloriesBurned = dailyWorkouts.reduce(
  (total, workout) => total + Number(workout.calories || 0),
  0
);

const caloriesRemaining = calorieGoal - caloriesConsumed;

const weeklyData = Array.from({ length: 7 }, (_, index) => {
  const date = new Date(`${selectedDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - (6 - index));
  const dateKey = date.toISOString().slice(0, 10);
  return {
    day: new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
    }).format(date),
    calories: meals
      .filter((meal) => getRecordDate(meal) === dateKey)
      .reduce((total, meal) => total + Number(meal.calories || 0), 0),
  };
});


  if (!user) {
  return showRegister ? (
    <Register
      onSwitch={() => setShowRegister(false)}
    />
  ) : (
    <Login
      onAuthenticated={handleAuthenticated}
      onSwitch={() => setShowRegister(true)}
    />
  );
}

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      

      {/* Sidebar */}
      <aside className="fixed hidden h-screen w-64 border-r border-slate-200 bg-white p-6 md:block">

        <h1 className="text-2xl font-bold text-emerald-600">
          FitTrack AI
        </h1>

        <p className="mt-1 text-xs text-slate-400">
          Your personal fitness companion
        </p>

        <nav className="mt-10 space-y-2">

          <a
            href="#dashboard"
            className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3 font-medium text-emerald-700"
          >
            <Home size={20} />
            Dashboard
          </a>
    

          <a
            href="#meals"
            className="flex items-center gap-3 rounded-xl p-3 text-slate-600 hover:bg-slate-100"
          >
            <Apple size={20} />
            Food Tracking
          </a>

          <a
            href="#workouts"
            className="flex items-center gap-3 rounded-xl p-3 text-slate-600 hover:bg-slate-100"
          >
            <Dumbbell size={20} />
            Workouts
          </a>

          <a
            href="#goals"
            className="flex items-center gap-3 rounded-xl p-3 text-slate-600 hover:bg-slate-100"
          >
            <Target size={20} />
            My Goals
          </a>

          <a
            href="#profile"
            className="flex items-center gap-3 rounded-xl p-3 text-slate-600 hover:bg-slate-100"
          >
            <User size={20} />
            Profile
          </a>

          <a
            href="#settings"
            className="flex items-center gap-3 rounded-xl p-3 text-slate-600 hover:bg-slate-100"
          >
            <Settings size={20} />
            Settings
          </a>

        </nav>

        <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-emerald-50 p-4">
          <Droplets className="text-emerald-600" />

          <p className="mt-2 font-semibold">
            Stay hydrated!
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Remember to drink water throughout the day.
          </p>
        </div>

      </aside>

      {/* Main Content */}
      <main className="p-5 md:ml-64 md:p-8">

        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">

          <div>
            <p className="text-sm text-slate-500">
              Your fitness overview
            </p>

            <h2 className="mt-1 text-2xl font-bold md:text-3xl">
              Welcome, {user.name}!
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex flex-col text-xs text-slate-500">
              Summary date
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </label>
            <button
              type="button"
              onClick={() =>
                document.getElementById("meals")?.scrollIntoView({ behavior: "smooth" })
              }
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700"
            >
              <Plus size={18} />
              Log Activity
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-600 hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>

        </header>

        <nav className="mb-6 flex gap-2 overflow-x-auto pb-2 md:hidden">
          {[
            ["#dashboard", "Dashboard"],
            ["#meals", "Meals"],
            ["#workouts", "Workouts"],
            ["#goals", "Goals"],
            ["#profile", "Profile"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="shrink-0 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Statistics */}
        <section
          id="dashboard"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >

          <StatCard
            title="Calories Consumed"
            value={caloriesConsumed.toLocaleString()}
            unit="kcal"
            icon={Apple}
            color="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Calories Burned"
            value={caloriesBurned.toLocaleString()}
            unit="kcal"
            icon={Flame}
            color="bg-orange-50 text-orange-600"
          />

          <StatCard
            title="Calories Remaining"
            value={caloriesRemaining.toLocaleString()}
            unit="kcal"
            icon={Target}
            color="bg-blue-50 text-blue-600"
          />

         <StatCard
  title="Protein Consumed"
  value={proteinConsumed.toFixed(1)}
  unit="grams"
  icon={Activity}
  color="bg-purple-50 text-purple-600"
/>

<StatCard
  title="Carbs Consumed"
  value={carbsConsumed.toFixed(1)}
  unit="grams"
  icon={Apple}
  color="bg-blue-50 text-blue-600"
/>

<StatCard
  title="Fat Consumed"
  value={fatConsumed.toFixed(1)}
  unit="grams"
  icon={Flame}
  color="bg-orange-50 text-orange-600"
/>

        </section>
      {/* Daily Nutrition Progress */}
<section
  id="goals"
  className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
>
  <h3 className="text-lg font-bold">Daily Nutrition Progress</h3>

  <p className="mt-1 text-sm text-slate-500">
    Progress for {selectedDate} toward your personal daily goals.
  </p>

  {[
    {
      name: "Calories",
      consumed: caloriesConsumed,
      goal: calorieGoal,
      unit: "kcal",
    },
    {
      name: "Protein",
      consumed: proteinConsumed,
      goal: proteinGoal,
      unit: "g",
    },
    {
      name: "Carbs",
      consumed: carbsConsumed,
      goal: carbsGoal,
      unit: "g",
    },
    {
      name: "Fat",
      consumed: fatConsumed,
      goal: fatGoal,
      unit: "g",
    },
  ].map((item) => {
    const percentage =
      item.goal > 0
        ? Math.min(100, (item.consumed / item.goal) * 100)
        : 0;

    return (
      <div key={item.name} className="mt-5">
        <div className="mb-2 flex justify-between gap-3 text-sm">
          <span className="font-medium">{item.name}</span>

          <span className="text-slate-500">
            {item.consumed.toFixed(1)} / {item.goal} {item.unit}
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="mt-1 text-right text-xs text-slate-500">
          {Math.round(percentage)}% completed
        </p>
      </div>
    );
  })}
</section>

        {/* Weekly Chart */}
        <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

          <h3 className="text-lg font-bold">
            Weekly Calorie Intake
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Recorded calorie intake for the seven days through {selectedDate}.
          </p>

          <div className="mt-6 h-72 w-full">

            <ResponsiveContainer width="100%" height="100%">

              <BarChart data={weeklyData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis dataKey="day" />

                <Tooltip />

                <Bar
                  dataKey="calories"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </section>

        {/* Meals and Workouts */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

          <section
            id="meals"
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
          >

            <div className="flex items-center justify-between">

              <h3 className="text-lg font-bold">
                Recent Meals
              </h3>

              <a
                href="#meal-history"
                className="text-sm font-medium text-emerald-600"
              >
                View all
              </a>

            </div>

            {mealError && (
              <p role="alert" className="text-sm text-red-600">
                {mealError}
              </p>
            )}

            <div className="mt-5 space-y-4">

              {dailyMeals.slice(0, 5).map((meal) => (

                <div
                  key={meal._id}
                  className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                >

                  <div className="flex items-center gap-3">

                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                      <Apple size={20} />
                    </div>

                    <div>
                      <p className="font-medium">
                        {meal.name}
                      </p>

                      <p className="text-sm text-slate-500">
                        {meal.category || "Meal"}
                      </p>
                    </div>

                  </div>

                  <p className="whitespace-nowrap font-semibold">
                    {meal.calories} kcal
                  </p>

                </div>

              ))}
              {dailyMeals.length === 0 && (
                <p className="text-sm text-slate-500">No meals recorded on this date.</p>
              )}

            </div>

          </section>

          <section
            id="workouts"
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
          >

            <div className="flex items-center justify-between">

              <h3 className="text-lg font-bold">
                Recent Workouts
              </h3>

              <a
                href="#workout-history"
                className="text-sm font-medium text-emerald-600"
              >
                View all
              </a>

            </div>

            <div className="mt-5 space-y-4">

              {dailyWorkouts.slice(0, 5).map((workout) => (

                <div
                  key={workout._id}
                  className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                >

                  <div className="flex items-center gap-3">

                    <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                      <Dumbbell size={20} />
                    </div>

                    <div>
                      <p className="font-medium">
                        {workout.name}
                      </p>

                      <p className="text-sm text-slate-500">
                        {workout.category || "Workout"} · {workout.duration} minutes
                      </p>
                    </div>

                  </div>

                  <p className="whitespace-nowrap font-semibold">
                    {workout.calories} kcal
                  </p>

                </div>

              ))}
              {dailyWorkouts.length === 0 && (
                <p className="text-sm text-slate-500">No workouts recorded on this date.</p>
              )}

            </div>

          </section>

        </div>

        <footer className="py-8 text-center text-sm text-slate-400">
          FitTrack AI · Your fitness journey starts here.
        </footer>
        {workoutError && (
          <p role="alert" className="text-sm text-red-600">
            {workoutError}
          </p>
        )}

        <MealTracker
          meals={meals}
          setMeals={setMeals}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onUnauthorized={handleLogout}
        />
        <FoodScanner
          setMeals={setMeals}
          selectedDate={selectedDate}
        />

        <WorkoutTracker
          workouts={workouts}
          setWorkouts={setWorkouts}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onUnauthorized={handleLogout}
        />

        <FitnessRecommendations selectedDate={selectedDate} />

        {/* Profile Section */}
<Profile user={user} setUser={setUser} />

      </main>

    </div>
  );
}

export default App;
