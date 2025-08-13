import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import "react-quill-new/dist/quill.snow.css";
import ReactQuill from "react-quill-new";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

const MicrophoneIcon = ({ isListening }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-5 w-5 ${isListening ? "text-red-500 animate-pulse" : ""}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7v1h6v-1h-2v-2.07z"
      clipRule="evenodd"
    />
  </svg>
);

const BlogCreationPage = () => {
  const { slug } = useParams();
  const isEditMode = !!slug;

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [postId, setPostId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { getToken } = useAuth();

  const quillRef = useRef(null);
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    error: speechError,
    hasRecognitionSupport,
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript && quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection();
      const position = range ? range.index : editor.getLength();
      const textToInsert = (position > 0 ? " " : "") + transcript;
      editor.insertText(position, textToInsert, "user");
      editor.setSelection(position + textToInsert.length);
    }
  }, [transcript]);

  useEffect(() => {
    if (isEditMode) {
      const fetchPostForEdit = async () => {
        try {
          const response = await fetch(`/api/public/posts/${slug}`);
          if (!response.ok)
            throw new Error("Nije moguće učitati podatke za izmjenu.");
          const data = await response.json();

          setTitle(data.title);
          setContent(data.content);
          setCategoryId(data.category_id);
          setTags(data.tags || "");
          setPostId(data.id);
        } catch (err) {
          setError(err.message);
        }
      };
      fetchPostForEdit();
    }
  }, [isEditMode, slug]);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) throw new Error("Greška pri učitavanju kategorija.");
        const data = await response.json();
        setCategories(data);
        if (data.length > 0 && !isEditMode) {
          setCategoryId(data[0].id);
        }
      } catch (err) {
        setError("Nije moguće učitati kategorije. Molimo osvežite stranicu.");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [isEditMode]);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image", "video"],
      [{ color: [] }, { background: [] }],
      ["clean"],
    ],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) {
      setError("Naslov, sadržaj i kategorija su obavezni.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const postData = {
      title,
      categoryId: Number(categoryId),
      content,
      tags,
    };

    try {
      const token = await getToken();
      let response;

      if (isEditMode) {
        response = await fetch(`/api/posts/${postId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(postData),
        });
      } else {
        response = await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(postData),
        });
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Došlo je do nepoznate greške.");
      }

      if (isEditMode) {
        alert("Objava je uspješno ažurirana!");
        navigate(`/posts/${slug}`);
      } else {
        alert("Blog je uspešno objavljen!");
        navigate(`/posts/${responseData.post.slug}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-10">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 border-b pb-4">
          {isEditMode ? "Uredi Objavu" : "Kreirajte Novi Blog"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Naslov
            </label>
            <input
              type="text"
              id="title"
              placeholder="Kako napraviti savršenu kafu..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="kategorija"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Kategorija
            </label>
            <select
              name="kategorija"
              id="kategorija"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              disabled={loadingCategories}
              required
            >
              {loadingCategories ? (
                <option>Učitavanje...</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tagovi (razdvojeni razmakom)
            </label>
            <input
              type="text"
              id="tags"
              placeholder="info kafa priprema"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Sadržaj
              </label>
              {hasRecognitionSupport && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className="flex items-center gap-2 px-3 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  disabled={!hasRecognitionSupport}
                >
                  <MicrophoneIcon isListening={isListening} />
                  {isListening ? "Slušam..." : "Diktiraj"}
                </button>
              )}
            </div>

            {speechError && (
              <p className="text-xs text-red-500 mb-1">
                Greška pri diktiranju: {speechError}
              </p>
            )}
            {!hasRecognitionSupport && (
              <p className="text-xs text-yellow-600 mb-1">
                Diktiranje nije podržano u vašem pretraživaču.
              </p>
            )}

            <div className="bg-white border border-gray-300 rounded-md">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                className="h-72"
              />
            </div>
          </div>

          <div className="text-right pt-8">
            <button
              type="submit"
              disabled={isSubmitting || (isEditMode && !postId)}
              className="py-2 px-8 rounded-lg bg-orange-500 text-white font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-orange-600"
            >
              {isSubmitting
                ? isEditMode
                  ? "Ažuriranje..."
                  : "Objavljivanje..."
                : isEditMode
                ? "Ažuriraj"
                : "Objavi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogCreationPage;
