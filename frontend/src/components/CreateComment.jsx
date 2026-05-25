import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";

const CreateComment = ({
  postId,
  onCommentAdded,
  parentCommentId = null,
  isReply = false,
}) => {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const { getToken } = useAuth();
  const COMMENT_API = import.meta.env.VITE_COMMENT_API;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Komentar ne može biti prazan.");
      return;
    }

    try {
      const token = await getToken();
      const res = await fetch(`${COMMENT_API}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          postId: postId,
          content: content,
          parentCommentId: parentCommentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Došlo je do greške.");
      }

      setContent("");
      setError("");
      onCommentAdded(data.comment);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        className={`w-full border rounded p-2 ${
          isReply ? "text-sm h-20" : "h-24"
        }`}
        rows="3"
        placeholder={
          isReply
            ? "Napišite odgovor..."
            : "Kreirajte Vaš komentar za objavu..."
        }
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {error && (
        <p className="text-red-700 bg-red-200 pt-1 pb-1 text-center text-sm">
          {error}
        </p>
      )}
      <button
        type="submit"
        className={`mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary-accent transition-colors ${
          isReply ? "text-sm py-1" : ""
        }`}
      >
        {isReply ? "Odgovori" : "Objavi komentar"}
      </button>
    </form>
  );
};

export default CreateComment;
