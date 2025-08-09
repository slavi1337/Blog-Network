import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

import "react-quill-new/dist/quill.snow.css";
import ReactQuill from "react-quill-new";

const BlogCreationPage = () => {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) throw new Error("Greška pri učitavanju kategorija.");

        const data = await response.json();
        setCategories(data);

        if (data.length > 0) {
          setCategoryId(data[0].id);
        }
      } catch (err) {
        console.error("Nije moguće učitati kategorije", err);
        setError("Nije moguće učitati kategorije. Molimo osvežite stranicu.");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);
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

    try {
      const token = await getToken();
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          categoryId: Number(categoryId),
          content,
          tags,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Došlo je do nepoznate greške.");
      }

      alert("Blog je uspešno objavljen!");
      navigate(`/posts/${responseData.post.slug}`);
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
          Kreirajte Novi Blog
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
                <option>Učitavanje kategorija...</option>
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
              Tagovi
            </label>
            <input
              type="text"
              id="tags"
              placeholder="info coffee brewing"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sadržaj
            </label>
            <div className="bg-white border border-gray-300 rounded-md">
              <ReactQuill
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
              disabled={isSubmitting}
              className="py-2 px-8 rounded-lg bg-orange-500 text-white font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-orange-600"
            >
              {isSubmitting ? "Objavljivanje..." : "Objavi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogCreationPage;
