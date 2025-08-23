import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";

const ReportIssuePage = () => {
  const { getToken } = useAuth();
  const [issueType, setIssueType] = useState("bug_report");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [screenshotFile, setScreenshotFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 4 * 1024 * 1024) {
      toast.error("Fajl je prevelik. Maksimalna veličina je 4MB.");
      e.target.value = null;
      return;
    }
    setScreenshotFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Opis problema ne može biti prazan.");
      return;
    }

    setIsSubmitting(true);
    let screenshotUrl = null;

    try {
      if (screenshotFile) {
        setIsUploading(true);

        const authResponse = await fetch("/api/upload-auth");
        if (!authResponse.ok)
          throw new Error("Autentifikacija za upload nije uspjela.");
        const authParams = await authResponse.json();

        const formData = new FormData();
        formData.append("file", screenshotFile);
        formData.append("fileName", screenshotFile.name);
        formData.append("publicKey", import.meta.env.VITE_IK_PUBLIC_KEY);
        formData.append("signature", authParams.signature);
        formData.append("expire", authParams.expire);
        formData.append("token", authParams.token);

        const uploadResponse = await fetch(
          "https://upload.imagekit.io/api/v1/files/upload",
          {
            method: "POST",
            body: formData,
          }
        );
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok)
          throw new Error(uploadResult.message || "Upload slike nije uspeo.");

        screenshotUrl = uploadResult.url;
        setIsUploading(false);
      }

      const token = await getToken();
      const issueData = {
        issueType,
        description,
        screenshotUrl,
      };

      const response = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(issueData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Došlo je do greške.");

      toast.success(data.message);
      setDescription("");
      setScreenshotFile(null);
      document.getElementById("screenshot").value = null;
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div>
            <label
              htmlFor="screenshot"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Snimak ekrana (Screenshot) - Opciono
            </label>
            <input
              type="file"
              id="screenshot"
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/gif"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
            {screenshotFile && (
              <p className="text-xs text-gray-500 mt-1">
                Izabran fajl: {screenshotFile.name}
              </p>
            )}
          </div>

          <div className="text-right">
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-6 rounded-lg bg-primary text-white font-semibold transition-colors disabled:bg-gray-400 hover:bg-primary-accent"
            >
              {isUploading
                ? "Upload slike..."
                : isSubmitting
                ? "Slanje..."
                : "Pošalji Prijavu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssuePage;
