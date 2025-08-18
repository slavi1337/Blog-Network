import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const PostOfTheWeek = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedPost = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/public/posts/featured");
        if (response.ok) {
          const data = await response.json();
          setPost(data);
        }
      } catch (error) {
        console.error("Nije moguće učitati objavu sedmice.", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedPost();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-8">
        <p>Učitavanje objave sedmice...</p>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  const snippet =
    post.content.replace(/<[^>]+>/g, "").substring(0, 250) + "...";

  return (
    <div className="mt-8 text-center">
      <h1 className="text-3xl font-bold text-primary mb-6">Objava sedmice!</h1>
      <div className="flex flex-col md:flex-row border-4 border-primary p-4 mt-4 bg-gray-100">
        <div className="text-center md:text-left w-full md:w-3/4">
          <div className="mb-4">
            <Link
              to={`/posts/${post.slug}`}
              className="font-bold text-xl hover:underline text-textcolor"
            >
              {post.title}
            </Link>
            <div className="text-sm text-gray-500 mt-1">
              <span>{post.author_username}</span>
              <span className="mx-2">-</span>
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
              <span className="mx-2">-</span>
              <span>{post.category_name}</span>
            </div>
          </div>
          <p className="text-gray-700">{snippet}</p>
        </div>
      </div>
    </div>
  );
};

export default PostOfTheWeek;
