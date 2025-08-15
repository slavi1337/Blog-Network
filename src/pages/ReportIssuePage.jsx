import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";

const ReportIssuePage = () => {
  const [issueType, setIssueType] = useState("bug_report");
  const [description, setDescription] = useState("");

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

        <form className="space-y-6">
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

          <div className="text-right">
            <button
              type="submit"
              className="py-2 px-6 rounded-lg bg-orange-500 text-white font-semibold transition-colors hover:bg-orange-600"
            >
              Pošalji Prijavu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssuePage;