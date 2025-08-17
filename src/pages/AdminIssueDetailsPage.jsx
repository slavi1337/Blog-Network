import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

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
      setIssue((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8">Učitavanje...</div>;
  if (!issue) return <div className="p-8">Problem nije pronađen.</div>;

  
};

export default AdminIssueDetailsPage;
