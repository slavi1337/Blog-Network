import { useState } from "react";

const CreateComment = ({ postId, userId, onCommentAdded }) => {


  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Komentar ne može biti prazan.");
      return;
    }

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, user_id: userId, content }),
    });

    if (res.ok) {
      const data = await res.json();
      setContent("");
      setError("");
      onCommentAdded(data.comment);
    } else {
      const errData = await res.json();
      setError(errData.error || "Došlo je do greške.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <textarea
        className="w-full border rounded p-2"
        rows="3"
        placeholder="Kreirajte vaš komentar za objavu..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {error && <p className="text-red-500">{error}</p>}
      <button
        type="submit"
        className="mt-2 px-4 py-2 bg-orange-600 text-white rounded"
      >
        Objavi komentar
      </button>
    </form>
  );
};

export default CreateComment;