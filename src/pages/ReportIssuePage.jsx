import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";

const ReportIssuePage = () => {
  const { getToken } = useAuth();
  const [issueType, setIssueType] = useState("bug_report");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Opis problema ne može biti prazan.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const token = await getToken();
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ issueType, description }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Došlo je do greške.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b border-gray-300 pb-4">
          Prijavi Problem
        </h1>
        <p className="text-gray-600 mb-6">
          Naišli ste na grešku, neprikladan sadržaj ili nešto treće? Obavestite
          nas kako bismo mogli da reagujemo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="issueType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Vrsta Problema
            </label>
            <select
              id="issueType"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="bug_report">Greška na sajtu (Bug)</option>
              <option value="inappropriate_content">Neprikladan Sadržaj</option>
              <option value="spam">Spam</option>
              <option value="other">Ostalo</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Detaljan Opis
            </label>
            <textarea
              id="description"
              rows="6"
              placeholder="Molimo vas da detaljno opišete problem..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="text-right">
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-6 rounded-lg bg-orange-500 text-white font-semibold transition-colors disabled:bg-gray-400 hover:bg-orange-600"
            >
              {isSubmitting ? "Slanje..." : "Pošalji Prijavu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssuePage;