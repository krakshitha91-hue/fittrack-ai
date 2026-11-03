import { useState } from "react";
import api from "../api";

function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await api.post("/auth/register", { name, email, password });
        setMode("login");
        setPassword("");
        setMessage("Account created. Sign in with your new account.");
        return;
      }

      const response = await api.post("/auth/login", { email, password });
      onAuthenticated(response.data.token);
    } catch (requestError) {
      console.error("Authentication failed:", requestError);
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Authentication failed. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-emerald-600">FitTrack AI</h1>
        <h2 className="mt-6 text-xl font-bold text-slate-800">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {mode === "login"
            ? "Sign in to track your meals and workouts."
            : "Register to start tracking your fitness."}
        </p>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mt-4 text-sm text-emerald-700">
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          {mode === "register" && (
            <input
              type="text"
              placeholder="Name"
              aria-label="Name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border p-3"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            aria-label="Email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border p-3"
            required
          />
          <input
            type="password"
            placeholder="Password"
            aria-label="Password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={mode === "register" ? 6 : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border p-3"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-600 p-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSubmitting
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          {mode === "login" ? "Need an account?" : "Already registered?"}{" "}
          <button
            type="button"
            onClick={() => changeMode(mode === "login" ? "register" : "login")}
            className="font-medium text-emerald-700 hover:underline"
          >
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </section>
    </main>
  );
}

export default AuthForm;
