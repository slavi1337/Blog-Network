import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import PostList from "../components/PostList";

const SavedPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();
  const POST_API = import.meta.env.VITE_POST_API;

  useEffect(() => {
    const fetchSavedPosts = async () => {
      const token = await getToken();
      const response = await fetch(`${POST_API}/api/posts/saved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPosts(data);
      setLoading(false);
    };
    fetchSavedPosts();
  }, [getToken]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Moji Sačuvani Članci</h1>
      {loading ? <p>Učitavanje...</p> : <PostList posts={posts} />}
    </div>
  );
};

export default SavedPosts;
