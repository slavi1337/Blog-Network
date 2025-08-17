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
        fetchData(activeTab);
    }, [activeTab, fetchData]);

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        navigate("/admin/login");
    };

    const handleDeleteUser = async (userId) => {
    if (
      !window.confirm(
        `Da li ste APSOLUTNO sigurni da želite da obrišete ovog korisnika i SVE njegove objave, komentare i interakcije? Ova akcija je nepovratna.`
      )
    )
      return;
    setData((currentData) => currentData.filter((item) => item.id !== userId));
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        alert("Greška pri brisanju korisnika.");
        fetchData("users");
      }
    } catch (error) {
      alert("Greška pri brisanju korisnika.");
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
        alert("Greška pri promjeni uloge.");
        setData(originalData);
      }
    } catch (err) {
      alert("Greška pri promjeni uloge.");
      setData(originalData);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (
      !window.confirm(
        "Da li ste sigurni da želite da obrišete ovog administratora?"
      )
    )
      return;
    try {
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: "DELETE",
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error);
      alert(responseData.message);
      fetchData("admins");
    } catch (err) {
      alert(err.message);
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
          className="px-4 py-2 bg-primary hover:bg-primary-accent text-white rounded-md font-semibold"
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
        </nav>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md text-black">
        {loading ? (
          <p>Učitavanje...</p>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === "issues" && renderIssuesTable()}
            {activeTab === "users" && renderUsersTable()}
            {activeTab === "admins" && renderAdminsTable()}
          </div>
        )}
      </div>
    </div>
  );
}