import { Link } from "react-router-dom";

const PostList = ({ posts }) => {
  if (!posts || posts.length === 0) {
    return <p className="text-gray-600">Nema članaka za prikaz.</p>;
  }

  return (
    <div className="space-y-4 mt-6">
      {posts.map((post) => (
        <div
          key={post.id}
          className={`bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow relative ${
            post.is_pinned ? "border-2 border-primary" : ""
          }`}
        >
          {post.is_pinned && (
            <div className="absolute top-0 right-4 flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-1 rounded-b-lg">
              {/* stavljen random svg umjesto emojia */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.493,1.52a1,1,0,0,0-1.012,0L5.34,3.759a1,1,0,0,0-.54.89v5.09a1,1,0,0,0,1,1H8v5a1,1,0,0,0,2,0V10.74h2.2a1,1,0,0,0,1-1V4.649a1,1,0,0,0-.54-.89Z"
                  clipRule="evenodd"
                />
              </svg>
              PINNED
            </div>
          )}

          <Link
            to={`/posts/${post.slug}`}
            className="text-xl font-bold text-gray-800 hover:text-primary-accent"
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
