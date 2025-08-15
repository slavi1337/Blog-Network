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
                  className="px-4 py-2 text-sm font-semibold bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200"
                >
                  Uredi
                </Link>
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