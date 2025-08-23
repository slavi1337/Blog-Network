import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const AdminLoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Greška pri prijavi.");

      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md relative">
        {/* Back link to home page */}
        <Link
          to="/"
          className="absolute top-4 left-4 text-textcolor hover:text-primary transition-colors"
          title="Nazad na početnu"
        >
          <svg
            xmlns="http://www.w.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </Link>

        <h1 className="text-2xl font-bold text-center text-textcolor pt-6">
          Admin Prijava
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="text-sm font-bold text-textcolor block"
            >
              Korisničko ime
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded mt-1 bg-gray-200 text-black"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-bold text-textcolor block"
            >
              Lozinka
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded mt-1 bg-gray-200 text-black"
              required
            />
          </div>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-primary hover:bg-gray-700 text-white rounded-md font-semibold transition-colors disabled:bg-gray-400"
            >
              {isLoading ? "Prijavljivanje..." : "Prijavi se"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
