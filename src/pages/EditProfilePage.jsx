import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import ManageModerators from "../components/ManageModerators";

const TagPill = ({ tag, isSelected, onToggle }) => (
  <button
    onClick={() => onToggle(tag.id)}
    className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all duration-200 ${
      isSelected
        ? "bg-primary border-primary text-white"
        : "bg-white border-gray-300 text-gray-700 hover:border-orange-400"
    }`}
  >
    {tag.name}
  </button>
);

const EditProfilePage = () => {
  const { getToken } = useAuth();

  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();

        const [tagsResponse, interestsResponse] = await Promise.all([
          fetch("/api/tags"),
          fetch("/api/profile/interests", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!tagsResponse.ok || !interestsResponse.ok) {
          throw new Error("Greška pri učitavanju podataka.");
        }

        const tagsData = await tagsResponse.json();
        const interestsData = await interestsResponse.json();

        setAllTags(tagsData);
        setSelectedTags(new Set(interestsData));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken]);

  const handleToggleTag = (tagId) => {
    setSelectedTags((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(tagId)) {
        newSelected.delete(tagId);
      } else {
        newSelected.add(tagId);
      }
      return newSelected;
    });
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage("");
    try {
      const token = await getToken();
      const response = await fetch("/api/profile/interests", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tagIds: Array.from(selectedTags) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Greška pri čuvanju izmena.");
      }

      setSuccessMessage("Vaša interesovanja su uspješno sačuvana!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAndSortedTags = useMemo(() => {
    const filtered = searchTerm
      ? allTags.filter((tag) =>
          tag.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : allTags;

    // prvo selektovani pa onda po abecedi
    return filtered.sort((a, b) => {
      const aIsSelected = selectedTags.has(a.id);
      const bIsSelected = selectedTags.has(b.id);
      if (aIsSelected && !bIsSelected) return -1;
      if (!aIsSelected && bIsSelected) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [allTags, selectedTags, searchTerm]);

  if (loading) return <p>Učitavanje...</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-1">Uredi Profil</h2>
      <p className="text-gray-600 mb-6">
        Izaberite teme koje vas interesuju i upravljajte dozvolama.
      </p>

      {error && (
        <div className="text-red-600 bg-red-100 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="border-t border-b py-6 my-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg mb-4">Vaša Interesovanja</h3>
          <div className="w-full max-w-xs">
            <input
              type="text"
              placeholder="Pretraži tagove..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setVisibleCount(20); // Resetuj paginaciju pri novoj pretrazi
              }}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {filteredAndSortedTags.length > 0 ? (
            filteredAndSortedTags
              .slice(0, visibleCount)
              .map((tag) => (
                <TagPill
                  key={tag.id}
                  tag={tag}
                  isSelected={selectedTags.has(tag.id)}
                  onToggle={handleToggleTag}
                />
              ))
          ) : (
            <p className="text-gray-500 w-full text-center">
              Nema tagova koji odgovaraju pretrazi.
            </p>
          )}
        </div>

        {filteredAndSortedTags.length > visibleCount && (
          <div className="text-center mt-6">
            <button
              onClick={() => setVisibleCount((prev) => prev + 20)}
              className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
            >
              Učitaj još
            </button>
          </div>
        )}
      </div>
      <div className="h-12 flex items-center justify-center">
        {successMessage && (
          <div className="text-green-700 bg-green-100 p-3 rounded-md text-center">
            {successMessage}
          </div>
        )}
      </div>

      <div className="text-right mb-6">
        <button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="py-2 px-6 rounded-lg bg-primary text-white font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-primary-accent"
        >
          {isSaving ? "Čuvanje..." : "Sačuvaj Interesovanja"}
        </button>
      </div>

      <ManageModerators />
    </div>
  );
};

export default EditProfilePage;
