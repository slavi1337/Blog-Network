import { useState, useEffect } from "react";

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const initialFiltersState = {
    korisnici: false,
    objave: true,
    category: "",
    minLikes: "",
    maxLikes: "",
    minDateActive: false,
    maxDateActive: false,
    minDate: "",
    maxDate: "",
    tags: "",
    sortBy: "createdAt",
    sortOrder: "desc"
  };
  const [filters, setFilters] = useState(initialFiltersState);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          console.error("Neuspješno dohvatanje kategorija");
        }
      } catch (error) {
        console.error("Greška pri dohvatanju kategorija:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
    const updatedFilters = {
      ...filters,
      ...prev,
      korisnici: mode === "korisnici",
      objave: mode === "objave"
    };
    
    setFilters(updatedFilters);

    const processedFilters = {
      ...updatedFilters,
      tags: updatedFilters.tags.split(' ').map(tag => tag.trim()).filter(Boolean)
    };
    onSearch(query, processedFilters);
  };

  const handleSortChange = (newSortBy) => {
    let newSortOrder = 'desc';

    if (filters.sortBy === newSortBy) {
      newSortOrder = filters.sortOrder === 'desc' ? 'asc' : 'desc';
    }

    const updatedFilters = {
      ...filters,
      sortBy: newSortBy,
      sortOrder: newSortOrder
    };

    setFilters(updatedFilters);

    const processedFilters = {
      ...updatedFilters,
      tags: updatedFilters.tags.split(' ').map(tag => tag.trim()).filter(Boolean)
    };
    onSearch(query, processedFilters);
  };

  const sortPositions = {
    createdAt: "translate-x-0",
    voteScore: "translate-x-full",
    viewCount: "translate-x-[200%]"
  };

const handleCategoryChange = (e) => {
    const { value } = e.target;

    const updatedFilters = {
      ...filters,
      category: value
    };

    setFilters(updatedFilters);
    
    const processedFilters = {
        ...updatedFilters,
        tags: updatedFilters.tags
            .split(' ')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
    };
    onSearch(query, processedFilters);
  };

  const handleResetFilters = () => {
    setFilters(initialFiltersState);
    const processedFilters = {
      ...initialFiltersState,
      tags: []
    };
    onSearch(query, processedFilters);
  };

  const handleRefreshSearch = () => {
    const processedFilters = {
      ...filters,
      tags: filters.tags
        .split(' ')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
    };
    onSearch(query, processedFilters);
  };

  return (
    <div className="relative">
      {showFilters && (
        <div className="absolute top-16 left-0 w-128 h-auto bg-white border border-gray-300 shadow-lg z-50 p-4">
          <div className="flex flex-col gap-4 text-gray-700">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Prikaži:</span>
              <div className="relative inline-flex items-center w-44 h-10 rounded-full p-1 bg-gray-200">
                <div
                  className={`absolute top-1 left-1 w-1/2 h-8 bg-primary rounded-full shadow transition-transform duration-200 ${
                    filters.objave ? "translate-x-full" : "translate-x-0"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleToggle("korisnici")}
                  className={`relative z-10 flex-1 h-8 flex items-center justify-center text-sm font-medium transition-colors ${
                    filters.korisnici ? "text-white" : "text-gray-600"
                  }`}
                >
                  Korisnici
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle("objave")}
                  className={`relative z-10 flex-1 h-8 flex items-center justify-center text-sm font-medium transition-colors ${
                    filters.objave ? "text-white" : "text-gray-600"
                  }`}
                >
                  Objave
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-200 pt-4">
              <label htmlFor="category" className="text-sm font-medium">Kategorija:</label>
              <select
                name="category"
                id="category"
                value={filters.category}
                onChange={handleCategoryChange} 
                className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700"
              >
                <option value="">Sve kategorije</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-200 pt-4">
              <span className="text-sm font-medium">Sortiraj po:</span>
              <div className="relative grid grid-cols-3 w-full h-10 rounded-full p-1 bg-gray-200">
                <div
                  className={`absolute top-1 left-1 w-1/3 h-8 bg-primary rounded-full shadow transition-transform duration-300 ease-in-out ${
                    sortPositions[filters.sortBy]
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleSortChange("createdAt")}
                  className="relative z-10 flex items-center justify-center text-sm font-medium transition-colors"
                >
                  <span className={filters.sortBy === 'createdAt' ? 'text-white' : 'text-gray-600'}>
                    {filters.sortBy === 'createdAt' && filters.sortOrder === 'desc' ? 'Najnovije' : 'Najstarije'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSortChange("voteScore")}
                  className="relative z-10 flex items-center justify-center text-sm font-medium transition-colors"
                >
                  <span className={filters.sortBy === 'voteScore' ? 'text-white' : 'text-gray-600'}>
                    {filters.sortBy === 'voteScore' && filters.sortOrder === 'desc' ? 'Najviše glasova' : 'Najmanje glasova'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSortChange("viewCount")}
                  className="relative z-10 flex items-center justify-center text-sm font-medium transition-colors"
                >
                  <span className={filters.sortBy === 'viewCount' ? 'text-white' : 'text-gray-600'}>
                    {filters.sortBy === 'viewCount' && filters.sortOrder === 'desc' ? 'Najviše pregleda' : 'Najmanje pregleda'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-200 pt-4">
              <div className="flex flex-col">
                <label htmlFor="minLikes" className="text-sm">Minimalan broj lajkova</label>
                <input
                  type="number"
                  name="minLikes"
                  id="minLikes"
                  min={0}
                  value={filters.minLikes}
                  onChange={handleFilterChange}
                  className="px-2 py-1 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="maxLikes" className="text-sm">Maksimalan broj lajkova</label>
                <input
                  type="number"
                  name="maxLikes"
                  id="maxLikes"
                  min={0}
                  value={filters.maxLikes}
                  onChange={handleFilterChange}
                  className="px-2 py-1 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm">
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
                <label className="flex items-center gap-2 text-sm">
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
              <label htmlFor="tags" className="text-sm">Tagovi (razdvojeni razmakom)</label>
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

            <div className="flex justify-between border-t border-gray-200 pt-4">
                <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:primary_accent"
                >
                    Poništi filtere
                </button>
                <button
                    type="button"
                    onClick={handleRefreshSearch}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:primary_accent"
                >
                    Osvježi pretragu
                </button>
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
