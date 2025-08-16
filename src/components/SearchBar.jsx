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
  });

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query, filters);
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

  return (
    <div className="relative">
      {showFilters && (
        <div className="absolute top-16 left-0 w-128 h-auto bg-white border border-gray-300 shadow-lg z-50 p-4">
          <div className="flex flex-col gap-4 text-gray-700">
            <div className="flex flex-row gap-8">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="korisnici"
                  name="korisnici"
                  checked={filters.korisnici}
                  onChange={handleFilterChange}
                />
                <label htmlFor="korisnici">Korisnici</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="objave"
                  name="objave"
                  checked={filters.objave}
                  onChange={handleFilterChange}
                />
                <label htmlFor="objave">Objave</label>
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
