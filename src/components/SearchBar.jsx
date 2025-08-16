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

  return (
    <div className="relative">
      <form
        onSubmit={handleSubmit}
        className="flex items-center w-0.6 max-w-md mx-auto"
      >
        {/* dugme za filtere */}
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
