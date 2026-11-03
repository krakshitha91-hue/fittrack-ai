
import { useState } from "react";
import API from "../api";

function Register({ onSwitch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await API.post("/auth/register", {
        name,
        email,
        password
      });

      setMessage(response.data.message);
      setTimeout(onSwitch, 1000);
    } catch (error) {
      setError(
        error.response?.data?.message || "Registration failed."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
      >
        <h1 className="text-3xl font-bold mb-2">Create Account</h1>
        <p className="text-slate-500 mb-6">Join FitTrack AI</p>

        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4"
          required
        />

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
          placeholder="Password (minimum 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4"
          minLength={6}
          required
        />

        {message && (
          <p className="text-green-600 mb-4">{message}</p>
        )}

        {error && (
          <p className="text-red-500 mb-4">{error}</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
        >
          Register
        </button>

        <p className="text-center mt-5">
          Already registered?{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="text-blue-600 font-semibold"
          >
            Login
          </button>
        </p>
      </form>
    </div>
  );
}

export default Register;
