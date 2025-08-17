import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";

const CreateAdminForm = ({onAdminCreated}) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage("");
        setError("");
        try {
        const response = await fetch("/api/admin/admins", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setMessage(data.message);
        setUsername("");
        setPassword("");
        if (onAdminCreated) {
            onAdminCreated();
        }
        } catch (err) {
        setError(err.message);
        } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-semibold mb-4 text-textcolor">
        Kreiraj Novog Administratora
      </h3>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col md:flex-row gap-4 items-end"
      >
        <div className="flex-grow w-full md:w-auto">
          <label className="block text-sm font-medium text-textcolor">
            Korisničko ime
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mt-1 p-2 border rounded bg-background text-textcolor"
            required
          />
        </div>
        <div className="flex-grow w-full md:w-auto">
          <label className="block text-sm font-medium text-textcolor">
            Lozinka
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 p-2 border rounded bg-background text-textcolor"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto px-4 py-2 bg-primary-accent text-white rounded hover:opacity-90 disabled:bg-gray-400"
        >
          {isSubmitting ? "Kreiranje..." : "Kreiraj"}
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {message && <p className="text-green-500 mt-2">{message}</p>}
    </div>
  );
};

const AdminDashboardPage = () => {
    async (tab) => {
      setLoading(true);
      setData([]);
      try {
        const response = await fetch(`/api/admin/${tab}`);
        if (response.status === 401) return navigate("/admin/login");
        if (!response.ok)
          throw new Error(`Greška pri dohvatanju podataka za ${tab}`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    navigate("/admin/login");
  };
}