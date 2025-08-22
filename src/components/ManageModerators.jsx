import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { confirmAction } from "../utils/confirm";

const ManageModerators = () => {
  const { getToken } = useAuth();

  const [moderators, setModerators] = useState([]);
  const [newModUsername, setNewModUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchModerators = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const response = await fetch("/api/profile/moderators", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Greška pri dohvatanju moderatora.");
        const data = await response.json();
        setModerators(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchModerators();
  }, [getToken]);

  const handleAddModerator = async (e) => {
    e.preventDefault();
    if (!newModUsername.trim()) return;

    setIsAdding(true);
    setError("");
    try {
      const token = await getToken();
      const response = await fetch("/api/profile/moderators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: newModUsername }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Nepoznata greška.");

      if (!moderators.some((mod) => mod.id === data.id)) {
        setModerators((prev) => [...prev, data]);
      }
      setNewModUsername("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveModerator = async (moderatorId) => {
    const confirmed = await confirmAction(
      "Da li ste sigurni da želite da uklonite ovog moderatora?"
    );

    if (!confirmed) return;

    try {
      const token = await getToken();
      const response = await fetch(`/api/profile/moderators/${moderatorId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Greška pri uklanjanju.");

      setModerators((prev) => prev.filter((mod) => mod.id !== moderatorId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Učitavanje moderatora...</p>;

  return (
    <div className="border-t pt-6 mt-6">
      <h3 className="font-semibold text-lg mb-4">
        Upravljanje personalnim moderatorima
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Dodajte korisnike koji će biti Vaši personalni moderatori. Oni Vam
        pomažu u upravljanju objavama i komentarima.
      </p>

      <div className="space-y-3 mb-6">
        {moderators.length > 0 ? (
          moderators.map((mod) => (
            <div
              key={mod.id}
              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <img
                  src={mod.profile_picture_url || "/vite.svg"}
                  alt={mod.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="font-semibold">{mod.username}</span>
              </div>
              <button
                onClick={() => handleRemoveModerator(mod.id)}
                className="text-sm text-red-600 hover:text-red-800 font-semibold"
              >
                Ukloni
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">
            Trenutno nemate dodeljenih moderatora.
          </p>
        )}
      </div>

      <form onSubmit={handleAddModerator} className="flex items-center gap-3">
        <input
          type="text"
          value={newModUsername}
          onChange={(e) => setNewModUsername(e.target.value)}
          placeholder="Unesite korisničko ime moderatora"
          className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        />
        <button
          type="submit"
          disabled={isAdding}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white font-semibold transition-colors disabled:bg-gray-400 hover:bg-black"
        >
          {isAdding ? "Dodavanje..." : "Dodaj"}
        </button>
      </form>
      {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
    </div>
  );
};

export default ManageModerators;
