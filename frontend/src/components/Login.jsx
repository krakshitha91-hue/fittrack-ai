
import { useState } from "react";
import API from "../api";

function Login({ onAuthenticated, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await API.post("/auth/login", {
        email,
        password
      });

      const { token, user } = response.data;

      onAuthenticated(token, user);
    } catch (error) {
      setError(
        error.response?.data?.message || "Login failed. Try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
      >
        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
        <p className="text-slate-500 mb-6">Login to FitTrack AI</p>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4"
          required
        />

        {error && (
          <p className="text-red-500 mb-4">{error}</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
        >
          Login
        </button>

        <p className="text-center mt-5">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="text-blue-600 font-semibold"
          >
            Register
          </button>
        </p>
      </form>
    </div>
  );
}

export default Login;
