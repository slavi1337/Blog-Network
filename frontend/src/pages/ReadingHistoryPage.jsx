import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const ReadingHistoryPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();
  const POST_API = import.meta.env.VITE_POST_API;

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const response = await fetch(`${POST_API}/api/posts/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error("Greška pri dohvatanju istorije:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [getToken]);

  const handleRemoveFromHistory = async (postIdToRemove) => {
    setPosts((currentPosts) =>
      currentPosts.filter((post) => post.id !== postIdToRemove)
    );

    try {
      const token = await getToken();
      const response = await fetch(`${POST_API}/api/posts/${postIdToRemove}/history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error("Greška pri brisanju, osviježite stranicu.");
      }
    } catch (error) {
      console.error("Greška:", error);
    }
  };

  if (loading) return <p>Učitavanje...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Istorija Čitanja</h1>
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-grow">
                <Link
                  to={`/posts/${post.slug}`}
                  className="text-xl font-bold text-gray-800 hover:text-orange-600"
                >
                  {post.title}
                </Link>
                <div className="text-sm text-gray-500 mt-1">
                  <span>
                    Autor:{" "}
                    <Link
                      to={`/profile/${post.author_username}`}
                      className="font-semibold"
                    >
                      {post.author_username}
                    </Link>
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    Objavljeno: {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* NOVO DUGME za brisanje */}
              <button
                onClick={() => handleRemoveFromHistory(post.id)}
                className="p-2 ml-4 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                title="Ukloni iz istorije"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">Vaša istorija čitanja je prazna.</p>
      )}
    </div>
  );
};

export default ReadingHistoryPage;
