import { useState } from "react";

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    korisnici: true,
    objave: true,
    minLikes: "",
    maxLikes: "",
    minDateActive: false,
    maxDateActive: false,
    minDate: "",
    maxDate: "",
    tags: "",
  });

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query, filters);
    const processedFilters = {
      ...filters,
      tags: filters.tags
        .split(" ")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    };
    onSearch(query, processedFilters);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleToggle = (mode) => {
    setFilters((prev) => ({
      ...prev,
      korisnici: mode === "korisnici",
      objave: mode === "objave"
    }));
  };

  return (
    <div className="relative">
      {showFilters && (
        <div className="absolute top-16 left-0 w-128 h-auto bg-white border border-gray-300 shadow-lg z-50 p-4">
          <div className="flex flex-col gap-4 text-gray-700">
<div className="flex items-center gap-4">
              <span className="text-sm font-medium">Prikaži:</span>
              <div className="relative inline-flex items-center w-44 h-10 rounded-full p-1">
                <div
                  className={`absolute top-1 left-1 w-1/2 h-8 bg-primary rounded-full shadow transition-transform duration-200 ${
                    filters.objave ? "translate-x-full" : "translate-x-0"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleToggle("korisnici")}
                  className={`relative z-10 flex-1 h-8 flex items-center justify-center text-sm font-medium ${
                    filters.korisnici ? "text-white" : "text-gray-600"
                  }`}
                >
                  Korisnici
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle("objave")}
                  className={`relative z-10 flex-1 h-8 flex items-center justify-center text-sm font-medium ${
                    filters.objave ? "text-white" : "text-gray-600"
                  }`}
                >
                  Objave
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col">
                <label htmlFor="minLikes">Minimalan broj lajkova</label>
                <input
                  type="number"
                  name="minLikes"
                  id="minLikes"
                  value={filters.minLikes}
                  onChange={handleFilterChange}
                  className="px-2 py-1 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="maxLikes">Maksimalan broj lajkova</label>
                <input
                  type="number"
                  name="maxLikes"
                  id="maxLikes"
                  value={filters.maxLikes}
                  onChange={handleFilterChange}
                  className="px-2 py-1 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="minDateActive"
                    checked={filters.minDateActive}
                    onChange={handleFilterChange}
                  />
                  Najraniji datum objave
                </label>
                <input
                  type="date"
                  name="minDate"
                  id="minDate"
                  value={filters.minDate}
                  onChange={handleFilterChange}
                  disabled={!filters.minDateActive}
                  className="px-2 py-1 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex flex-col">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="maxDateActive"
                    checked={filters.maxDateActive}
                    onChange={handleFilterChange}
                  />
                  Najkasniji datum objave
                </label>
                <input
                  type="date"
                  name="maxDate"
                  id="maxDate"
                  value={filters.maxDate}
                  onChange={handleFilterChange}
                  disabled={!filters.maxDateActive}
                  className="px-2 py-1 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label htmlFor="tags">Tagovi (razdvojeni razmakom)</label>
              <input
                type="text"
                name="tags"
                id="tags"
                value={filters.tags}
                onChange={handleFilterChange}
                placeholder="npr. zabava, kuhinja, politika..."
                className="px-2 py-1 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center w-0.6 max-w-md mx-auto"
      >
        <button
          type="button"
          onClick={toggleFilters}
          className="px-4 py-2 text-textcolor bg-primary rounded-l-md hover:bg-primary_accent border border-primary"
        >
          Filteri
        </button>

        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={handleInputChange}
          className="w-full px-4 py-2 text-gray-700 bg-white border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          type="submit"
          className="px-4 py-2 text-textcolor bg-primary rounded-r-md hover:bg-primary_accent border border-gray-300"
        >
          Search
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
