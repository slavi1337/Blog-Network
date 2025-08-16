import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const DraftsPage = () => {
  const { getToken } = useAuth();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/profile/drafts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDrafts(data);
    } catch (error) {
      console.error("Greška pri dohvatanju draftova:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [getToken]);

  const handleDeleteDraft = async (postId) => {
    if (!window.confirm("Da li ste sigurni da želite da obrišete ovaj unos?"))
      return;

    setDrafts((prev) => prev.filter((p) => p.id !== postId));

    try {
      const token = await getToken();
      const response = await fetch(`/api/posts/${postId}/draft`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        alert("Greška pri brisanju. Osvežite stranicu.");
        fetchDrafts();
      }
    } catch (error) {
      console.error("Greška pri brisanju:", error);
      alert("Greška pri brisanju. Osvežite stranicu.");
      fetchDrafts();
    }
  };

  const getStatusLabel = (post) => {
    if (post.status === "scheduled") {
      return `Zakazano za: ${new Date(post.publish_at).toLocaleString()}`;
    }
    return "Radna verzija (Draft)";
  };

  if (loading) return <p>Učitavanje...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Moji Draftovi i Zakazane Objave
      </h1>
      <div className="space-y-4">
        {drafts.length > 0 ? (
          drafts.map((post) => (
            <div
              key={post.id}
              className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center"
            >
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {getStatusLabel(post)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  to={`/edit-post/${post.slug}`}
                  className="px-4 py-2 text-sm font-semibold bg-orange-100 text-primary-accent rounded-full hover:bg-orange-200"
                >
                  Uredi
                </Link>
                <button
                  onClick={() => handleDeleteDraft(post.id)}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                  title="Obriši"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600">
            Nemate sačuvanih draftova ili zakazanih objava.
          </p>
        )}
      </div>
    </div>
  );
};

export default DraftsPage;
