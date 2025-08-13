import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import CreateComment from "../components/CreateComment";
import CommentSection from "../components/CommentSection";

const ThumbsUpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.97l-1.9 3.8z"
    />
  </svg>
);
const ThumbsDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.738 3h4.017c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.085a2 2 0 001.736-.97l1.9-3.8z"
    />
  </svg>
);
const BookmarkIcon = ({ saved }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill={saved ? "currentColor" : "none"}
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
    />
  </svg>
);

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"
    />
  </svg>
);

const SinglePostPage = () => {
  const { slug } = useParams();
  const { isSignedIn, isLoaded, user } = useUser();
  const { getToken } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voteScore, setVoteScore] = useState(0);
  const [userVote, setUserVote] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const fetchPublicPostData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/public/posts/${slug}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Greška: ${res.status}`);
        }
        const data = await res.json();
        setPost(data);
        setVoteScore(parseInt(data.vote_score, 10) || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicPostData();
  }, [slug]);

  useEffect(() => {
    if (post && isLoaded && isSignedIn) {
      const fetchUserStatus = async () => {
        try {
          const token = await getToken();
          const res = await fetch(`/api/posts/${post.id}/status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return;
          const statusData = await res.json();
          setUserVote(
            statusData.user_vote ? parseInt(statusData.user_vote, 10) : null
          );
          setIsSaved(statusData.is_saved || false);
        } catch (err) {
          console.error("Nije moguće dohvatiti status korisnika:", err);
        }
      };
      fetchUserStatus();
    } else if (isLoaded && !isSignedIn) {
      setUserVote(null);
      setIsSaved(false);
    }
  }, [post, isSignedIn, isLoaded, getToken]);

  useEffect(() => {
    if (post?.id) {
      const fetchComments = async () => {
        try {
          const res = await fetch(`/api/posts/${post.id}/comments`);
          if (!res.ok) return;
          const data = await res.json();
          setComments(data);
        } catch (err) {
          console.error("Greška pri dohvatanju komentara:", err);
        }
      };
      fetchComments();
    }
  }, [post?.id]);

  const handleCommentAdded = (newComment) => {
    setComments((prevComments) => [...prevComments, newComment]);
  };

  const handleVote = async (newVoteType) => {
    if (!isSignedIn || !post) return;
    try {
      const token = await getToken();
      let response;
      let finalVoteType = newVoteType;

      if (newVoteType === userVote) {
        response = await fetch(`/api/posts/${post.id}/vote`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        finalVoteType = null;
      } else {
        response = await fetch(`/api/posts/${post.id}/vote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ voteType: newVoteType }),
        });
      }

      if (!response.ok) throw new Error("Greška pri glasanju.");
      const data = await response.json();
      setVoteScore(data.newScore);
      setUserVote(finalVoteType);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleSaveToggle = async () => {
    if (!isSignedIn || !post) return;
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    try {
      const token = await getToken();
      const response = await fetch(`/api/posts/${post.id}/save`, {
        method: newSavedState ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setIsSaved(!newSavedState);
        console.error("Greška pri promjeni statusa čuvanja.");
      }
    } catch (err) {
      setIsSaved(!newSavedState);
      console.error(err);
    }
  };

  if (loading)
    return <div className="text-center p-10 font-bold">Učitavanje...</div>;
  if (error)
    return (
      <div className="text-center p-10 bg-red-100 text-red-700">{error}</div>
    );
  if (!post) return null;

  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-10 bg-white shadow-lg rounded-lg m-4 md:m-8">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-4xl font-extrabold mb-2 text-gray-900">
            {post.title}
          </h1>
          <div className="text-gray-500 text-sm mb-6 flex items-center space-x-4">
            <span>
              Autor:{" "}
              <Link
                to={`/profile/${post.author_username}`}
                className="font-semibold hover:text-orange-600"
              >
                {post.author_username}
              </Link>
            </span>
            <span>•</span>
            <span>
              Kategorija:{" "}
              <span className="font-semibold">{post.category_name}</span>
            </span>
            <span>•</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isSignedIn && (
            <button
              onClick={handleSaveToggle}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-200 hover:text-orange-600 transition-colors"
              title={isSaved ? "Ukloni iz sačuvanih" : "Sačuvaj za kasnije"}
            >
              <BookmarkIcon saved={isSaved} />
            </button>
          )}

          {isSignedIn && user?.username === post?.author_username && (
            <Link
              to={`/edit-post/${post.slug}`}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-200 hover:text-orange-600 transition-colors"
              title="Uredi objavu"
            >
              <EditIcon />
            </Link>
          )}
        </div>
      </div>

      <div
        className="prose lg:prose-xl max-w-none mb-8"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <div className="flex items-center space-x-4 border-t border-b py-4 my-6">
        <p className="font-semibold">Kako vam se dopada objava?</p>
        <button
          onClick={() => handleVote(1)}
          disabled={!isSignedIn}
          className={`p-2 rounded-full transition-colors ${
            userVote === 1
              ? "bg-green-500 text-white"
              : "bg-gray-200 hover:bg-green-200"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Sviđa mi se"
        >
          <ThumbsUpIcon />
        </button>
        <span className="text-xl font-bold w-8 text-center">{voteScore}</span>
        <button
          onClick={() => handleVote(-1)}
          disabled={!isSignedIn}
          className={`p-2 rounded-full transition-colors ${
            userVote === -1
              ? "bg-red-500 text-white"
              : "bg-gray-200 hover:bg-red-200"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Ne sviđa mi se"
        >
          <ThumbsDownIcon />
        </button>
        {!isSignedIn && (
          <p className="text-xs text-gray-500">
            Prijavite se da biste glasali.
          </p>
        )}
      </div>

      <div>
        <CommentSection
          postId={post.id}
          comments={comments}
          onCommentAdded={handleCommentAdded}
        />

        {isSignedIn ? (
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-2">Ostavite komentar</h3>
            <CreateComment
              postId={post.id}
              onCommentAdded={handleCommentAdded}
            />
          </div>
        ) : (
          <div className="text-center mt-6 p-4 bg-gray-100 rounded-lg">
            <p className="text-gray-700">
              <Link
                to="/sign-in"
                className="text-orange-600 font-bold hover:underline"
              >
                Prijavite se
              </Link>{" "}
              da biste ostavili komentar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SinglePostPage;
