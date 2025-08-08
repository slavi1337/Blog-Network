import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import PostList from "../components/PostList";

const ReadingHistory = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      const token = await getToken();
      const response = await fetch("/api/posts/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPosts(data);
      setLoading(false);
    };
    fetchHistory();
  }, [getToken]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Istorija Čitanja</h1>
      {loading ? <p>Učitavanje...</p> : <PostList posts={posts} />}
    </div>
  );
};

export default ReadingHistory;
