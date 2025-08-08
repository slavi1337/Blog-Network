import { Link } from "react-router-dom";

const PostList = ({ posts }) => {
  if (!posts || posts.length === 0) {
    return <p className="text-gray-600">Nema članaka za prikaz.</p>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
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
  );
};

export default PostList;
