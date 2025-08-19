import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const PostList = ({ posts }) => {
  const navigate = useNavigate();

  const handleTagClick = useCallback(
    (tag) => {
      const params = new URLSearchParams();
      params.append("tags", tag);
      navigate(`/?${params.toString()}`);
    },
    [navigate]
  );

  if (!posts || posts.length === 0) {
    return <p className="text-gray-600">Nema članaka za prikaz.</p>;
  }

  const formatViews = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "m";
    if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + "k";
    return num;
  };

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
          
          <div className="flex flex-wrap items-center text-sm text-gray-500 mt-2">
            <Link to={`/profile/${post.author_username}`} className="flex items-center mr-3 hover:opacity-80 transition-opacity">
                <img 
                    src={post.author_profile_picture_url || '/logo.png'}
                    alt={post.author_username}
                    className="w-7 h-7 rounded-full mr-2 object-cover"
                />
                <span className="font-semibold text-gray-700">
                    {post.author_username}
                </span>
            </Link>
            
            <div className="flex items-center text-gray-400">
                <span className="mx-1">•</span>
                <span>
                    {new Date(post.created_at).toLocaleDateString()}
                </span>

                <span className="mx-1">•</span>
                <div
                    className="flex items-center gap-1"
                    title={`${post.view_count || 0} pregleda`}
                >
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                    </svg>
                    <span>{formatViews(post.view_count || 0)}</span>
                </div>
            </div>
          </div>

          {/* TAGOVI */}
          {post.tags && post.tags.trim() !== "" && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600">Tagovi:</span>
              Tagovi: 
              {post.tags.split(", ").map((tag, index) => (
                <button
                  key={index}
                  onClick={() => handleTagClick(tag)}
                  className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs hover:bg-primary hover:text-white transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PostList;
