import { useState, useEffect } from "react";

const PostListPage = () => {
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const fetchPosts = async (page = 1) => {
    try {
      const res = await fetch(`/api/public/posts?page=${page}`);
      const data = await res.json();
      setPosts(data.posts);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Greška pri dohvatu postova:", err);
    }
  };

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  return (
    <div className="p-4">
      <div className="mt-6 space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="p-4 border rounded shadow">
            <h2 className="text-xl font-bold">{post.title}</h2>
            <p className="text-gray-700">{post.content.slice(0, 150)}...</p>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-gray-500">Nema postova za prikaz.</p>
        )}
      </div>
    </div>
  );
};

export default PostListPage;