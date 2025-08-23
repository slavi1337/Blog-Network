import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

const AdminIssueDetailsPage = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!issueId) {
      setLoading(false);
      return;
    }
    const fetchIssueDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/issues/${issueId}`);
        if (response.status === 401) return navigate("/admin/login");
        if (!response.ok) throw new Error("Problem nije pronađen.");
        const data = await response.json();
        setIssue(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIssueDetails();
  }, [issueId, navigate]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      const response = await fetch(`/api/admin/issues/${issueId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus }),
      });
      if (!response.ok) throw new Error("Greška pri ažuriranju.");

      toast.success(`Status problema je ažuriran na "${newStatus}".`);
      setIssue((prev) => ({
        ...prev,
        status: newStatus,
        resolved_at: new Date(),
      }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="p-8">Učitavanje...</div>;
  if (!issue) return <div className="p-8">Problem nije pronađen.</div>;

  return (
    <div className="p-8 bg-background min-h-screen text-textcolor">
      <Link
        to="/admin/dashboard"
        className="text-primary-accent hover:underline mb-6 block"
      >
        ← Nazad na Dashboard
      </Link>
      <div className="bg-primary p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">
          Detalji Problema #{issue.id}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Tip:</strong>{" "}
            <span className="capitalize">
              {issue.issue_type.replace("_", " ")}
            </span>
          </div>
          <div>
            <strong>Status:</strong>{" "}
            <span className="capitalize font-semibold">{issue.status}</span>
          </div>
          <div>
            <strong>Prijavljeno:</strong>{" "}
            {new Date(issue.created_at).toLocaleString()}
          </div>
          <div>
            <strong>Prijavio:</strong>{" "}
            {issue.reporter_username || "Neprijavljen korisnik"}
          </div>
          <div>
            <strong>Riješio:</strong>{" "}
            {issue.resolved_by_admin_username || "N/A"}
          </div>
          <div>
            <strong>Rešeno:</strong>{" "}
            {issue.resolved_at
              ? new Date(issue.resolved_at).toLocaleString()
              : "N/A"}
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <h2 className="font-semibold mb-2">Opis problema:</h2>
          <p className="whitespace-pre-wrap bg-background p-4 rounded">
            {issue.description}
          </p>
        </div>

        {issue.screenshot_url && (
          <div className="mt-6 border-t pt-4">
            <h2 className="font-semibold mb-2">Priloženi Screenshot:</h2>
            <a
              href={issue.screenshot_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={issue.screenshot_url}
                alt="Screenshot problema"
                className="max-w-full h-auto border rounded-md"
              />
            </a>
          </div>
        )}

        {issue.status !== "resolved" && issue.status !== "rejected" && (
          <div className="mt-6 border-t pt-4 flex gap-4">
            <h2 className="font-semibold">Akcije:</h2>
            <button
              onClick={() => handleUpdateStatus("resolved")}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Označi kao Riješeno
            </button>
            <button
              onClick={() => handleUpdateStatus("rejected")}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Odbij
            </button>
            <button
              onClick={() => handleUpdateStatus("in_progress")}
              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Označi kao "U toku"
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminIssueDetailsPage;
