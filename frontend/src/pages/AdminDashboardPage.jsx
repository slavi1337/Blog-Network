import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { confirmAction } from "../utils/confirm";

// Alati za crtanje grafikona i prikaz analitike u AdminDashBoard-u ..
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const CategoriesManager = () => {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setError("");
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Došlo je do greške.");
      }

      setNewName("");
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    const confirmed = await confirmAction(
      'Da li ste sigurni? Blogovi u ovoj kategoriji neće biti obrisani, ali će se prebaciti u kategoriju "Ostalo"'
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Kategorija uspješno obrisana.");
        fetchCategories();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Brisanje nije uspjelo.");
      }
    } catch (err) {
      toast.error(err.message);
      console.error("Greška pri brisanju kategorije:", err);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-textcolor">
        Upravljanje Kategorijama
      </h2>
      <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ime nove kategorije..."
          className="flex-grow p-2 border border-border-main rounded bg-background text-textcolor"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          {isSubmitting ? "Dodavanje..." : "Dodaj"}
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex justify-between items-center bg-background p-2 rounded"
          >
            <span className="text-textcolor">{cat.name}</span>
            <button
              onClick={() => handleDeleteCategory(cat.id)}
              className="text-red-500 hover:text-red-700"
            >
              Obriši
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const CreateAdminForm = ({ onAdminCreated }) => {
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
    <div className="mt-8 border-t border-border-main pt-6">
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
            className="w-full mt-1 p-2 border border-border-main rounded bg-background text-textcolor"
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
            className="w-full mt-1 p-2 border border-border-main rounded bg-background text-textcolor"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
        >
          {isSubmitting ? "Kreiranje..." : "Kreiraj"}
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {message && <p className="text-green-500 mt-2">{message}</p>}
    </div>
  );
};

const CensoredWordsManager = () => {
  const [words, setWords] = useState([]);
  const [newWord, setNewWord] = useState("");
  const [error, setError] = useState("");

  const fetchWords = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/censored-words");
      if (res.ok) {
        const data = await res.json();
        setWords(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const handleAddWord = async (e) => {
    e.preventDefault();
    setError("");
    if (!newWord.trim()) return;

    try {
      const res = await fetch("/api/admin/censored-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: newWord }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewWord("");
        fetchWords();
      } else {
        setError(data.error || "Greška pri dodavanju.");
      }
    } catch (err) {
      setError("Došlo je do greške na serveru.");
    }
  };

  const handleDeleteWord = async (wordId) => {
    const confirmed = await confirmAction("Da li ste sigurni?");
    if (!confirmed) return;
    try {
      await fetch(`/api/admin/censored-words/${wordId}`, { method: "DELETE" });
      fetchWords();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-textcolor">
        Upravljanje Cenzurisanim riječima
      </h2>
      <form onSubmit={handleAddWord} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          placeholder="Dodaj novu riječ..."
          className="flex-grow p-2 border border-border-main rounded bg-background text-textcolor"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Dodaj
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="space-y-2">
        {words.map((w) => (
          <div
            key={w.id}
            className="flex justify-between items-center bg-background p-2 rounded"
          >
            <span className="text-textcolor">{w.word}</span>
            <button
              onClick={() => handleDeleteWord(w.id)}
              className="text-red-500 hover:text-red-700"
            >
              Obriši
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("issues");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = useCallback(
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
    if (
      activeTab === "issues" ||
      activeTab === "users" ||
      activeTab === "admins" ||
      activeTab === "categories"
    ) {
      fetchData(activeTab);
    } else {
      setLoading(false);
    }
  }, [activeTab, fetchData]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    navigate("/admin/login");
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = await confirmAction(
      `Da li ste APSOLUTNO sigurni da želite da obrišete ovog korisnika i SVE njegove objave, komentare i interakcije? Ova akcija je nepovratna.`
    );

    if (!confirmed) return;
    setData((currentData) => currentData.filter((item) => item.id !== userId));
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error("Greška pri brisanju korisnika.");
        fetchData("users");
      }
    } catch (error) {
      toast.error("Greška pri brisanju korisnika.");
      fetchData("users");
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    const originalData = JSON.parse(JSON.stringify(data));
    setData((currentData) =>
      currentData.map((item) =>
        item.id === userId ? { ...item, role: newRole } : item
      )
    );
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRole }),
      });
      if (!response.ok) {
        toast.error("Greška pri promjeni uloge.");
        setData(originalData);
      }
    } catch (err) {
      toast.error("Greška pri promjeni uloge.");
      setData(originalData);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    const confirmed = await confirmAction(
      "Da li ste sigurni da želite da obrišete ovog administratora?"
    );
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: "DELETE",
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error);
      toast.success(responseData.message);
      fetchData("admins");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const renderIssuesTable = () => (
    <table className="min-w-full text-left text-textcolor">
      <thead className="border-b border-border-main">
        <tr>
          <th className="px-4 py-2">ID</th>
          <th className="px-4 py-2">Tip</th>
          <th className="px-4 py-2">Opis</th>
          <th className="px-4 py-2">Status</th>
          <th className="px-4 py-2">Akcije</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((issue) => (
            <tr
              key={issue.id}
              className="border-b border-border-main hover:bg-background"
            >
              <td className="px-4 py-2">{issue.id}</td>
              <td className="px-4 py-2 capitalize">
                {issue.issue_type?.replace("_", " ") || "N/A"}
              </td>
              <td
                className="px-4 py-2 max-w-sm truncate"
                title={issue.description}
              >
                {issue.description}
              </td>
              <td className="px-4 py-2 capitalize">{issue.status}</td>
              <td className="px-4 py-2">
                {issue.id && (
                  <Link
                    to={`/admin/issues/${issue.id}`}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Detalji
                  </Link>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="5" className="text-center py-4">
              Nema prijavljenih problema.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderUsersTable = () => (
    <table className="min-w-full text-left text-textcolor">
      <thead className="border-b border-border-main">
        <tr>
          <th className="px-4 py-2">ID</th>
          <th className="px-4 py-2">Korisničko Ime</th>
          <th className="px-4 py-2">Email</th>
          <th className="px-4 py-2">Uloga</th>
          <th className="px-4 py-2">Akcije</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((user) => (
            <tr
              key={user.id}
              className="border-b border-border-main hover:bg-background"
            >
              <td className="px-4 py-2">{user.id}</td>
              <td className="px-4 py-2">{user.username}</td>
              <td className="px-4 py-2">{user.email}</td>
              <td className="px-4 py-2">
                <select
                  value={user.role}
                  onChange={(e) =>
                    handleUpdateUserRole(user.id, e.target.value)
                  }
                  className="p-1 border rounded bg-background text-textcolor"
                >
                  <option value="standard">Standard</option>
                  <option value="moderator">Moderator</option>
                </select>
              </td>
              <td className="px-4 py-2">
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                >
                  Obriši Korisnika
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="5" className="text-center py-4">
              Nema korisnika za prikaz.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderAdminsTable = () => (
    <div>
      <table className="min-w-full text-left text-textcolor">
        <thead className="border-b border-border-main">
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Korisničko Ime</th>
            <th className="px-4 py-2">Kreiran</th>
            <th className="px-4 py-2">Akcije</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((admin) => (
              <tr
                key={admin.id}
                className="border-b border-border-main hover:bg-background"
              >
                <td className="px-4 py-2">{admin.id}</td>
                <td className="px-4 py-2">{admin.username}</td>
                <td className="px-4 py-2">
                  {new Date(admin.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleDeleteAdmin(admin.id)}
                    className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                  >
                    Obriši
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center py-4">
                Nema administratora za prikaz.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <CreateAdminForm onAdminCreated={() => fetchData("admins")} />
    </div>
  );

  return (
    <div className="p-8 bg-background min-h-screen text-textcolor">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-primary hover:bg-gray-700 text-white rounded-md font-semibold"
        >
          Odjavi se
        </button>
      </div>

      <div className="mb-4">
        <nav className="flex space-x-2 p-1 bg-gray-200 rounded-lg">
          <button
            onClick={() => setActiveTab("issues")}
            className={`w-full py-2 px-4 font-semibold rounded-md transition-colors ${
              activeTab === "issues"
                ? "bg-primary text-white shadow"
                : "text-gray-600 hover:bg-gray-300"
            }`}
          >
            Problemi
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full py-2 px-4 font-semibold rounded-md transition-colors ${
              activeTab === "users"
                ? "bg-primary text-white shadow"
                : "text-gray-600 hover:bg-gray-300"
            }`}
          >
            Korisnici
          </button>
          <button
            onClick={() => setActiveTab("admins")}
            className={`w-full py-2 px-4 font-semibold rounded-md transition-colors ${
              activeTab === "admins"
                ? "bg-primary text-white shadow"
                : "text-gray-600 hover:bg-gray-300"
            }`}
          >
            Administratori
          </button>
          <button
            onClick={() => setActiveTab("censored")}
            className={`w-full py-2 px-4 font-semibold rounded-md transition-colors ${
              activeTab === "censored"
                ? "bg-primary text-white shadow"
                : "text-gray-600 hover:bg-gray-300"
            }`}
          >
            Cenzura
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`w-full py-2 px-4 font-semibold rounded-md transition-colors ${
              activeTab === "categories"
                ? "bg-primary text-white shadow"
                : "text-gray-600 hover:bg-gray-300"
            }`}
          >
            Kategorije
          </button>
        </nav>
      </div>

      <div className="bg-primary p-6 rounded-lg shadow-md">
        {loading ? (
          <p className="text-textcolor">Učitavanje...</p>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === "issues" && renderIssuesTable()}
            {activeTab === "users" && renderUsersTable()}
            {activeTab === "admins" && renderAdminsTable()}
            {activeTab === "censored" && <CensoredWordsManager />}
            {activeTab === "categories" && <CategoriesManager />}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
