import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import CreateComment from "../components/CreateComment";
import CommentSection from "../components/CommentSection";
import TranslatePost from "../components/TranslatePost";

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

const DeleteIcon = () => (
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
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const SinglePostPage = () => {
  const { slug } = useParams();
  const { isSignedIn, isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voteScore, setVoteScore] = useState(0);
  const [userVote, setUserVote] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState([]);

  const [canManageContent, setCanManageContent] = useState(false);
  const [canDeletePost, setCanDeletePost] = useState(false);

  const [translatedTitle, setTranslatedTitle] = useState(null);
  const [translatedContent, setTranslatedContent] = useState(null);

  const [isPinned, setIsPinned] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");

  useEffect(() => {
    const fetchPublicPostData = async () => {
      setLoading(true);
      setError(null);
      setTranslatedTitle(null);
      setTranslatedContent(null);
      try {
        const res = await fetch(`/api/public/posts/${slug}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Greška: ${res.status}`);
        }
        const data = await res.json();
        setPost(data);
        setVoteScore(parseInt(data.vote_score, 10) || 0);
        setIsPinned(data.is_pinned);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicPostData();
  }, [slug]);

  // Oznacava post kao procitan
  useEffect(() => {
    // Samo ako je korisnik prijavljen
    if (isSignedIn && post?.id) {
      const recordReadingHistory = async () => {
        try {
          const token = await getToken();
          fetch(`/api/posts/${post.id}/history`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          console.error("Neuspjesno upisivanje u istoriji:", err);
        }
      };
      recordReadingHistory();
    }
  }, [isSignedIn, post, getToken]);

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
          const isAuthor = user?.username === post.author_username;
          const isGlobalMod = statusData.viewer_role === "moderator";
          const isPersonalMod = statusData.viewer_is_personal_moderator;
          setCanManageContent(isAuthor);
          setCanDeletePost(isAuthor || isGlobalMod);
        } catch (err) {
          console.error("Nije moguće dohvatiti status korisnika:", err);
        }
      };
      fetchUserStatus();
    } else if (isLoaded && !isSignedIn) {
      setUserVote(null);
      setIsSaved(false);
      setCanManageContent(false);
      setCanDeletePost(false);
    }
  }, [post, isSignedIn, isLoaded, getToken, user?.username]);

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

  const handleDeletePost = async () => {
    if (
      !window.confirm("Da li ste sigurni da želite trajno obrisati ovu objavu?")
    )
      return;

    try {
      const token = await getToken();

      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",

        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json();

        throw new Error(errData.error || "Greška pri brisanju objave.");
      }

      alert("Objava uspješno obrisana.");

      navigate("/");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Da li ste sigurni da želite obrisati ovaj komentar?"))
      return;

    try {
      const token = await getToken();

      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",

        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json();

        throw new Error(errData.error || "Greška pri brisanju komentara.");
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePinToggle = async () => {
    if (!user || user.username !== post.author_username) return;

    const newPinnedState = !isPinned;
    setIsPinned(newPinnedState);

    try {
      const token = await getToken();
      const url = `/api/posts/${post.id}/${newPinnedState ? "pin" : "unpin"}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setIsPinned(!newPinnedState);
        const errorData = await response.json();
        alert(errorData.error || "Greška pri akciji.");
      } else {
        alert(
          `Objava je uspješno ${newPinnedState ? "pinovana" : "odpinovana"}.`
        );
      }
    } catch (err) {
      setIsPinned(!newPinnedState);
      alert("Došlo je do greške.");
    }
  };

  const handleTranslationComplete = (title, content) => {
    setTranslatedTitle(title);
    setTranslatedContent(content);
  };

  const handleShowOriginal = () => {
    setTranslatedTitle(null);
    setTranslatedContent(null);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => {
        setCopySuccess("Link kopiran u clipboard!");
        setTimeout(() => setCopySuccess(""), 2000);
      },
      (err) => {
        console.error("Failed to copy: ", err);
        setCopySuccess("Kopiranje nije uspelo.");
        setTimeout(() => setCopySuccess(""), 2000);
      }
    );
  };

  const formatViews = (num) => {
    if (typeof num !== "number" || isNaN(num)) {
      return "0";
    }
    return new Intl.NumberFormat("sr-RS").format(num);
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
            {translatedTitle || post.title}
          </h1>
          <div className="text-gray-500 text-sm mb-6 flex items-center flex-wrap gap-x-4">
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

            <div
              className="flex items-center gap-1.5"
              title={`${post.view_count} pregleda`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
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
              <span>{formatViews(post.view_count)}</span>
            </div>

          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition-colors"
            title="Podjeli objavu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
              />
            </svg>
          </button>
          {copySuccess && (
            <div className="absolute top-20 mt-2 center bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-md">
              {copySuccess}
            </div>
          )}
          {!translatedTitle ? (
            <TranslatePost
              originalTitle={post.title}
              originalContent={post.content}
              onTranslate={handleTranslationComplete}
            />
          ) : (
            <button
              onClick={handleShowOriginal}
              className="px-3 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-100"
            >
              Prikaži Original
            </button>
          )}
          {isSignedIn && (
            <button
              onClick={handleSaveToggle}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-200 hover:text-primary-accent transition-colors"
              title={isSaved ? "Ukloni iz sačuvanih" : "Sačuvaj za kasnije"}
            >
              <BookmarkIcon saved={isSaved} />
            </button>
          )}

          {isSignedIn && user?.username === post?.author_username && (
            <Link
              to={`/edit-post/${post.slug}`}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-200 hover:text-primary-accent transition-colors"
              title="Uredi objavu"
            >
              <EditIcon />
            </Link>
          )}
          {isSignedIn && canDeletePost && (
            <button
              onClick={handleDeletePost}
              className="p-2 rounded-full text-red-600 hover:bg-red-100"
              title="Obriši objavu"
            >
              <DeleteIcon />
            </button>
          )}
          {isSignedIn && user?.username === post?.author_username && (
            <button
              onClick={handlePinToggle}
              className={`p-2 rounded-full hover:bg-gray-200 transition-colors ${
                isPinned ? "text-primary" : "text-gray-600"
              }`}
              title={isPinned ? "Odpinuj objavu" : "Pinuj na vrh profila"}
            >
              {isPinned ? (
                // Ikonica za UNPIN
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.493,1.52a1,1,0,0,0-1.012,0L5.34,3.759a1,1,0,0,0-.54.89v5.09a1,1,0,0,0,1,1H8v5a1,1,0,0,0,2,0V10.74h2.2a1,1,0,0,0,1-1V4.649a1,1,0,0,0-.54-.89Z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                // Ikona za PIN (obična)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.493,1.52a1,1,0,0,0-1.012,0L5.34,3.759a1,1,0,0,0-.54.89v5.09a1,1,0,0,0,1,1H8v5a1,1,0,0,0,2,0V10.74h2.2a1,1,0,0,0,1-1V4.649a1,1,0,0,0-.54-.89Z"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      <div
        className="prose lg:prose-xl max-w-none mb-8"
        dangerouslySetInnerHTML={{ __html: translatedContent || post.content }}
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
          canManage={canManageContent}
          onDeleteComment={handleDeleteComment}
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
                className="text-primary-accent font-bold hover:underline"
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
