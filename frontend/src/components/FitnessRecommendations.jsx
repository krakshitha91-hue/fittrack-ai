import { useState } from "react";
import api from "../api";

function FitnessRecommendations({ selectedDate }) {
  const [recommendations, setRecommendations] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function getRecommendations() {
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/ai/recommendations", {
        date: selectedDate,
      });
      setRecommendations(response.data.recommendations);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not generate recommendations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">AI Fitness Recommendations</h2>
          <p className="mt-1 text-sm text-slate-500">
            General suggestions based on your profile and entries for {selectedDate}.
          </p>
        </div>
        <button
          type="button"
          onClick={getRecommendations}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Generating..." : "Get recommendations"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
      {recommendations && (
        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">
          {recommendations}
        </p>
      )}
      <p className="mt-4 text-xs text-slate-500">
        AI suggestions are general wellness information, not medical advice.
      </p>
    </section>
  );
}

export default FitnessRecommendations;
