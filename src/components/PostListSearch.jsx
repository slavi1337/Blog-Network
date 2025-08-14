import { useState, useEffect } from "react";
import SearchBar from "./SearchBar";

const PostListPage = () => {
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1); // za paging

  const fetchPosts = async (searchTerm = "", page = 1) => {
    try {
      const res = await fetch(`/api/public/posts?search=${encodeURIComponent(searchTerm)}&page=${page}`);
      const data = await res.json();
      setPosts(data.posts);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Greška pri dohvatu postova:", err);
    }
  };

  const handleSearch = (searchTerm) => {
    setQuery(searchTerm);
    setPage(1); // reset na prvu stranu kad se trazi ispocetka
    fetchPosts(searchTerm, 1);
  };

  useEffect(() => {
    fetchPosts(query, page);
  }, []);

  return (
    <div className="p-4">
      <SearchBar onSearch={handleSearch} />

      <div className="mt-6 space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="p-4 border rounded shadow">
            <h2 className="text-xl font-bold">{post.title}</h2>
            <p className="text-gray-700">{post.content.slice(0, 150)}...</p>
            <p className="text-sm text-gray-500">Autor: {post.author_username}</p>
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