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

const SinglePostPage = () => {
  const { slug } = useParams();
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [voteScore, setVoteScore] = useState(0);
  const [userVote, setUserVote] = useState(null); // 1, -1, ili null

  const [comments, setComments] = useState([]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/posts/${slug}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Greška prilikom dohvatanja posta.");

        const data = await res.json();
        setPost(data);
        setVoteScore(parseInt(data.vote_score, 10));
        setUserVote(data.user_vote ? parseInt(data.user_vote, 10) : null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug, getToken]);

  useEffect(() => {
    if (post) {
      const fetchComments = async () => {
        try {
          const res = await fetch(`/api/posts/${post.id}/comments`);
          const data = await res.json();
          setComments(data);
        } catch (err) {
          console.error("Greška pri dohvatanju komentara:", err);
        }
      };
      fetchComments();
    }
  }, [post]);

  const handleCommentAdded = (newComment) => {
    setComments((prevComments) => [...prevComments, newComment]);
  };

  const handleVote = async (newVoteType) => {
    if (!isSignedIn || !post) return;

    try {
      const token = await getToken();
      let response;
      let finalVoteType = newVoteType;

      // Ako korisnik klikne na isti glas ponovo, poništavamo ga
      if (newVoteType === userVote) {
        response = await fetch(`/api/posts/${post.id}/vote`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        finalVoteType = null; // Glas je uklonjen
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
      setVoteScore(data.newScore); // Ažuriramo ukupan skor
      setUserVote(finalVoteType); // Ažuriramo glas korisnika
    } catch (err) {
      console.error(err.message);
    }
  };

  if (loading)
    return <div className="text-center p-10 font-bold">Učitavanje...</div>;
  if (error)
    return (
      <div className="text-center p-10 bg-red-100 text-red-700">
        Greška: {error}
      </div>
    );
  if (!post)
    return <div className="text-center p-10">Objava nije pronađena.</div>;

  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-10 bg-white shadow-lg rounded-lg m-4 md:m-8">
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
        {isSignedIn ? (
          <>
            <h3 className="text-xl font-bold mb-2">Ostavite komentar</h3>
            <CreateComment
              postId={post.id}
              onCommentAdded={handleCommentAdded}
            />
          </>
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

        <CommentSection
          postId={post.id}
          comments={comments}
          onCommentAdded={handleCommentAdded}
        />
      </div>
    </div>
  );
};

export default SinglePostPage;
