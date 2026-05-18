import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import "react-quill-new/dist/quill.snow.css";
import ReactQuill from "react-quill-new";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { IKContext, IKUpload } from "imagekitio-react";
import "react-quill-new/dist/quill.snow.css";
import toast from "react-hot-toast";

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
  const [publishAt, setPublishAt] = useState("");
  const [currentStatus, setCurrentStatus] = useState("draft");

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const quillRef = useRef(null);
  const MAX_UPLOAD_SIZE_MB = 6;
  const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

  const [uploadedFiles, setUploadedFiles] = useState(new Map());

  const uploadedFilesRef = useRef(uploadedFiles);
  const POST_API = import.meta.env.VITE_POST_API;

  useEffect(() => {
    uploadedFilesRef.current = uploadedFiles;
  }, [uploadedFiles]);

  const uploadHandler = (mediaType) => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", `${mediaType}/*`);
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file || !quillRef.current) return;

      const currentTotalSize = Array.from(
        uploadedFilesRef.current.values()
      ).reduce((sum, size) => sum + size, 0);
      if (currentTotalSize + file.size > MAX_UPLOAD_SIZE_BYTES) {
        setError(
          `Upload nije uspio. Ukupna veličina svih fajlova u postu ne smije preći ${MAX_UPLOAD_SIZE_MB} MB.`
        );
        return;
      }

      setIsUploading(true);
      setError(null);

      const quill = quillRef.current.getEditor();
      const range = quill.getSelection(true);

      try {
        const authResponse = await fetch("/api/upload-auth");
        if (!authResponse.ok) throw new Error("Autentifikacija nije uspjela.");
        const authParams = await authResponse.json();

        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", file.name);
        formData.append("publicKey", import.meta.env.VITE_IK_PUBLIC_KEY);
        formData.append("signature", authParams.signature);
        formData.append("expire", authParams.expire);
        formData.append("token", authParams.token);

        const uploadResponse = await fetch(
          "https://upload.imagekit.io/api/v1/files/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok)
          throw new Error(
            uploadResult.message || `Upload ${mediaType} nije uspio.`
          );

        const cleanUrl = uploadResult.url.split("?")[0];
        setUploadedFiles((prev) =>
          new Map(prev).set(cleanUrl, uploadResult.size)
        );
        quill.insertEmbed(range.index, mediaType, uploadResult.url);
      } catch (uploadError) {
        setError(`Greška pri uploadu: ${uploadError.message}`);
      } finally {
        setIsUploading(false);
      }
    };
  };

  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file || !quillRef.current) return;

      setIsUploading(true);
      setError(null);

      try {
        const authResponse = await fetch("/api/upload-auth");
        if (!authResponse.ok) throw new Error("Autentifikacija nije uspjela.");
        const authParams = await authResponse.json();

        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", file.name);
        formData.append("publicKey", import.meta.env.VITE_IK_PUBLIC_KEY);
        formData.append("signature", authParams.signature);
        formData.append("expire", authParams.expire);
        formData.append("token", authParams.token);

        const uploadResponse = await fetch(
          "https://upload.imagekit.io/api/v1/files/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok)
          throw new Error(uploadResult.message || "Upload slike nije uspio.");

        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, "image", uploadResult.url);
      } catch (uploadError) {
        console.error("Upload error:", uploadError);
        setError(`Greška pri uploadu: ${uploadError.message}`);
      } finally {
        setIsUploading(false);
      }
    };
  };

  const videoHandler = () => {
    if (!quillRef.current) return;
    const quill = quillRef.current.getEditor();
    const range = quill.getSelection(true);

    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "video/*");
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      setIsUploading(true);
      setError(null);

      try {
        const authResponse = await fetch("/api/upload-auth");
        const authParams = await authResponse.json();

        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", file.name);
        formData.append("publicKey", import.meta.env.VITE_IK_PUBLIC_KEY);
        formData.append("signature", authParams.signature);
        formData.append("expire", authParams.expire);
        formData.append("token", authParams.token);

        const uploadResponse = await fetch(
          "https://upload.imagekit.io/api/v1/files/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok)
          throw new Error(uploadResult.message || "Upload videa nije uspio.");

        quill.insertEmbed(range.index, "video", uploadResult.url);
      } catch (uploadError) {
        setError(`Greška pri uploadu videa: ${uploadError.message}`);
      } finally {
        setIsUploading(false);
      }
    };
  };

  const handleContentChange = (newContent, delta, source) => {
    setContent(newContent);

    if (source === "user") {
      const regex = /src="(https?:\/\/ik\.imagekit\.io\/[^"]+)"/g;
      const matches = [...newContent.matchAll(regex)];
      const currentUrlsInEditor = new Set(
        matches.map((match) => match[1].split("?")[0])
      );

      setUploadedFiles((prevMap) => {
        if (prevMap.size === 0) {
          return prevMap;
        }

        const newMap = new Map();

        for (const [url, size] of prevMap.entries()) {
          const cleanUrl = url.split("?")[0];
          if (currentUrlsInEditor.has(cleanUrl)) {
            newMap.set(url, size);
          }
        }

        return newMap.size !== prevMap.size ? newMap : prevMap;
      });
    }
  };

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
          const token = await getToken();

          const response = await fetch(`${POST_API}/api/posts/${slug}/edit`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(
              errData.error || "Nije moguće učitati podatke za izmjenu."
            );
          }

          const data = await response.json();

          setTitle(data.title);
          setCategoryId(data.category_id);
          setTags(data.tags || "");
          setPostId(data.id);
          setCurrentStatus(data.status);

          if (data.content) {
            const existingUrls = Array.from(
              data.content.matchAll(/src="https?:\/\/ik\.imagekit\.io\/[^"]+"/g)
            ).map((match) => match[0].slice(5, -1));

            if (existingUrls.length > 0) {
              const detailsResponse = await fetch("/api/media/details", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ urls: existingUrls }),
              });

              if (detailsResponse.ok) {
                const filesData = await detailsResponse.json();
                const initialFilesMap = new Map();
                filesData.forEach((file) =>
                  initialFilesMap.set(file.url, file.size)
                );

                setUploadedFiles((prevMap) => {
                  const finalMap = new Map([...prevMap, ...initialFilesMap]);
                  return finalMap;
                });
              }
            }
          }

          if (data.status === "scheduled" && data.publish_at) {
            const utcDate = new Date(data.publish_at);
            const year = utcDate.getFullYear();
            const month = (utcDate.getMonth() + 1).toString().padStart(2, "0");
            const day = utcDate.getDate().toString().padStart(2, "0");
            const hours = utcDate.getHours().toString().padStart(2, "0");
            const minutes = utcDate.getMinutes().toString().padStart(2, "0");
            setPublishAt(`${year}-${month}-${day}T${hours}:${minutes}`);
          }
          setContent(data.content || "");
        } catch (err) {
          setError(err.message);
        }
      };
      fetchPostForEdit();
    }
  }, [isEditMode, slug, getToken]);

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

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image", "video"],
          [{ color: [] }, { background: [] }],
          ["clean"],
        ],
        handlers: {
          image: () => uploadHandler("image"),
          video: () => uploadHandler("video"),
        },
      },
    }),
    []
  );

  const currentUploadSize = Array.from(uploadedFiles.values()).reduce(
    (sum, size) => sum + size,
    0
  );
  const currentUploadSizeMB = (currentUploadSize / 1024 / 1024).toFixed(2);

  const handleSubmit = async (e, forcedStatus) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    let finalStatus = forcedStatus;
    if (!finalStatus) {
      finalStatus = publishAt ? "scheduled" : "published";
    }

    if (!title.trim() || !content.trim() || !categoryId) {
      setError("Naslov, sadržaj i kategorija su obavezni.");
      setIsSubmitting(false);
      return;
    }
    if (finalStatus === "scheduled" && !publishAt) {
      setError("Morate izabrati vrijeme za zakazanu objavu.");
      setIsSubmitting(false);
      return;
    }

    const utcPublishAt =
      finalStatus === "scheduled" ? new Date(publishAt).toISOString() : null;

    const postData = {
      title,
      categoryId: Number(categoryId),
      content,
      tags,
      status: finalStatus,
      publishAt: utcPublishAt,
    };

    try {
      const token = await getToken();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = isEditMode
        ? await fetch(`${POST_API}/api/posts/${postId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(postData),
          })
        : await fetch(`${POST_API}/api/posts`, {
            method: "POST",
            headers,
            body: JSON.stringify(postData),
          });

      const responseData = await response.json();
      if (!response.ok)
        throw new Error(responseData.error || "Došlo je do nepoznate greške.");

      toast.success(responseData.message || "Akcija uspješno izvršena!");

      if (finalStatus === "draft" || finalStatus === "scheduled") {
        if (user?.username) {
          navigate(`/profile/${user.username}/drafts`);
        } else {
          navigate("/");
        }
      } else {
        navigate(`/posts/${isEditMode ? slug : responseData.post.slug}`);
      }
    } catch (err) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-10">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 border-b pb-4 capitalize">
          {isEditMode ? `Uređivanje: ${currentStatus}` : "Kreirajte Novi Blog"}
        </h1>
        <form onSubmit={(e) => handleSubmit(e, null)} className="space-y-6">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
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
              Tagovi
            </label>
            <input
              type="text"
              id="tags"
              placeholder="info kafa priprema"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Sadržaj
              </label>
              <div className="text-sm text-gray-500">
                Iskorišteno: <strong>{currentUploadSizeMB} MB</strong> /{" "}
                {MAX_UPLOAD_SIZE_MB} MB
              </div>
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

            {isUploading && (
              <div className="bg-yellow-100 text-yellow-800 p-2 rounded-md text-sm mb-2 text-center">
                Upload slike u toku...
              </div>
            )}

            <div className="bg-white border-none rounded-md pb-16 md:pb-8">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={handleContentChange}
                modules={modules}
                className="h-72"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="publish_at"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Zakaži objavu (opciono)
            </label>
            <input
              id="publish_at"
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex justify-end items-center gap-4 pt-8">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "draft")}
              disabled={isSubmitting}
              className="py-2 px-6 rounded-lg bg-gray-500 text-white font-semibold transition-colors disabled:bg-gray-400 hover:bg-gray-600"
            >
              {isSubmitting ? "Čuvanje..." : "Sačuvaj kao Draft"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-8 rounded-lg bg-primary text-white font-semibold transition-colors disabled:bg-gray-400 hover:bg-primary-accent"
            >
              {isSubmitting
                ? "Slanje..."
                : publishAt
                ? "Zakaži"
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
