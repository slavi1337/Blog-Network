import { useState } from "react";

const TranslatePost = ({ originalTitle, originalContent, onTranslate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const languages = [
    { code: "en", name: "English" },
    { code: "de", name: "Deutsch" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "it", name: "Italiano" },
  ];

  const fetchTranslation = async (text, targetLang) => {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Greška na serveru.");
    }
    return data.translatedText;
  };

  const handleTranslate = async (langCode) => {
    setIsLoading(true);
    setError("");
    setIsDropdownOpen(false);

    try {
      // naziv i sadrzaj poruke se prevodi
      const [translatedTitle, translatedContent] = await Promise.all([
        fetchTranslation(originalTitle, langCode),
        fetchTranslation(originalContent, langCode),
      ]);

      onTranslate(translatedTitle, translatedContent);
    } catch (err) {
      console.error("Greška pri prevođenju:", err);
      setError(err.message || "Prevođenje nije uspjelo. Pokušajte ponovo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 36 36"
          fill="currentColor"
        >
          <path d="M33.5,22.4a1.25,1.25,0,0,1-1.16-.78L26.61,7.72,20,21.68a1.25,1.25,0,1,1-2.26-1.07L25.56,4.09a1.25,1.25,0,0,1,2.28.06l6.82,16.52A1.26,1.26,0,0,1,34,22.3,1.18,1.18,0,0,1,33.5,22.4Z" />
          <path d="M30.19,16H22.57a1.25,1.25,0,0,1,0-2.5h7.62a1.25,1.25,0,0,1,0,2.5Z" />
          <path d="M3.39,31.62A1.22,1.22,0,0,1,2.34,31a1.25,1.25,0,0,1,.38-1.72c8.34-5.28,9.14-13,9.17-13.32a1.25,1.25,0,0,1,2.49.22c0,.38-.89,9.24-10.32,15.21A1.26,1.26,0,0,1,3.39,31.62Z" />
          <path d="M14.62,29.81a1,1,0,0,1-.3,0C8.19,28.25,3.39,21.23,3.19,20.93a1.25,1.25,0,1,1,2.07-1.4c0,.06,4.47,6.53,9.66,7.82a1.25,1.25,0,0,1-.3,2.46Z" />
          <path d="M16.69,16.27H1.5a1.25,1.25,0,0,1,0-2.5H16.69a1.25,1.25,0,0,1,0,2.5Z" />
          <path d="M8.68,16.27a1.24,1.24,0,0,1-1.21-1l-.84-3.46a1.25,1.25,0,1,1,2.43-.58l.84,3.46A1.26,1.26,0,0,1,9,16.24,1.43,1.43,0,0,1,8.68,16.27Z" />
        </svg>
        {isLoading ? "Prevođenje..." : "Prevedi"}
      </button>

      {isDropdownOpen && (
        <div className="absolute left-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleTranslate(lang.code)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default TranslatePost;
