import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const ReadingHistoryPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const response = await fetch("/api/posts/history", {
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

  if (loading) return <p>Učitavanje...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Istorija Čitanja</h1>
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
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
          ))}
        </div>
      ) : (
        <p className="text-gray-600">Vaša istorija čitanja je prazna.</p>
      )}
    </div>
  );
};

export default ReadingHistoryPage;