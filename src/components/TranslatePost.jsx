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
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.165 2.476.87.87 0 00-.224.39.87.87 0 00.224.39c.29.29.694.435 1.166.393a18.87 18.87 0 012.476-1.165H15a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1H9.422a18.87 18.87 0 01-2.476 1.165.87.87 0 00-.393 1.166.87.87 0 00.39.224c.433.22.9.33 1.393.33.696 0 1.383-.16 2.003-.477a1 1 0 11.894 1.79c-1.024.512-2.16.77-3.397.77-1.38 0-2.68-.358-3.818-1.025A1 1 0 013 13.172V12H2a1 1 0 110-2h1V9a1 1 0 112 0v1h1.578A18.87 18.87 0 015.422 7.524a.87.87 0 00-1.166-.393.87.87 0 00-.39.224c-.22.433-.33.9-.33 1.393a1 1 0 11-2 0c0-.696.16-1.383.477-2.003A1 1 0 013 5.003V4h1a1 1 0 112 0v1h2.524A18.87 18.87 0 017.422 3.422a.87.87 0 00-.393-1.166.87.87 0 00-1.166.393A18.87 18.87 0 013.422 4.22H3a1 1 0 110-2h3V2a1 1 0 011-1z"
            clipRule="evenodd"
          />
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
