import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Image } from "@imagekit/react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";

import NotificationBell from "./NotificationBell";
import SearchBar from "./SearchBar";
import { useSidePanel } from "../context/SidePanelContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { togglePanel } = useSidePanel();
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSearch = (query, filters = {}) => {
    const params = new URLSearchParams();

    if (query) {
      params.set("search", query);
    }

    if (filters.korisnici) {
      params.set("type", "users");
      navigate(`/?${params.toString()}`);
    } else {
      params.set("type", "posts");

      if (filters.category) {
        params.set("category", filters.category);
      }

      if (filters.minLikes !== "") params.set("minLikes", filters.minLikes);
      if (filters.maxLikes !== "") params.set("maxLikes", filters.maxLikes);
      if (filters.minDateActive && filters.minDate)
        params.set("minDate", filters.minDate);
      if (filters.maxDateActive && filters.maxDate)
        params.set("maxDate", filters.maxDate);

      if (filters.tags && Array.isArray(filters.tags)) {
        filters.tags.forEach(
          (tag) => tag.trim() && params.append("tags", tag.trim())
        );
      }

      if (filters.sortBy) {
        params.set("sortBy", filters.sortBy);
      }

      if (filters.sortOrder) {
        params.set("sortOrder", filters.sortOrder);
      }

      navigate(`/?${params.toString()}`);
    }
  };

  const setTheme = (theme) => {
    document.documentElement.classList.remove(
      "theme-blog-network",
      "theme-etfbl",
      "theme-dark"
    );
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  };

  const UserActions = ({ onLinkClick }) => {
    if (!user) return null;

    return (
      <>
        <Link
          to={`/profile/${user.username}`}
          className="hover:text-primary-accent transition-colors font-bold"
          onClick={onLinkClick} // Zatvori mobilni meni na klik
        >
          Moj Profil
        </Link>
        <div onClick={onLinkClick}>
          {" "}
          <UserButton afterSignOutUrl="/" />
        </div>
      </>
    );
  };

  const ThemeSelector = () => (
    <div className="py-1">
      <a
        onClick={() => setTheme("theme-blog-network")}
        className="block px-4 py-2 text-sm text-textcolor hover:bg-background cursor-pointer select-none"
      >
        Blog Network
      </a>
      <a
        onClick={() => setTheme("theme-etfbl")}
        className="block px-4 py-2 text-sm text-textcolor hover:bg-background cursor-pointer select-none"
      >
        ETF-BL
      </a>
      <a
        onClick={() => setTheme("theme-dark")}
        className="block px-4 py-2 text-sm text-textcolor hover:bg-background cursor-pointer select-none"
      >
        Dark
      </a>
    </div>
  );

  return (
    <div className="w-full h-16 md:h-20 flex items-center justify-between relative">
      <Link
        to="/"
        className="flex items-center gap-4 text-2xl font-bold select-none mr-4"
      >
        <img src="/logo.png" alt="Blog Network Logo" className="w-20" />

        <span className="text-textcolor">Blog network</span>
      </Link>

      {/* Desktop Meni */}
      <div className="hidden md:flex items-center gap-8 xl:gap-12 font-bold">
        <SearchBar onSearch={handleSearch} />
        <div
          ref={dropdownRef}
          onMouseLeave={() => setThemeMenuOpen(false)}
          onMouseEnter={() => setThemeMenuOpen(true)}
        >
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-primary text-sm font-bold text-textcolor hover:bg-background"
          >
            Teme
          </button>
          {themeMenuOpen && (
            <div className="absolute top-12 z-10 mt-2 w-40 rounded-md shadow-lg bg-primary ring-1 ring-black ring-opacity-5">
              <ThemeSelector />
            </div>
          )}
        </div>
        <SignedIn>
          <div className="flex items-center gap-8">
            <NotificationBell />
            <UserActions onLinkClick={() => {}} />
          </div>
        </SignedIn>
        <SignedOut>
          <Link to="/sign-in">
            <button className="py-2 px-4 rounded-3xl bg-primary hover:bg-primary-accent text-textcolor transition-all duration-300">
              Login
            </button>
          </Link>
        </SignedOut>

        {/* Dugme za otvaranje side panela */}
        <button
          onClick={togglePanel}
          className="p-2 rounded-full hover:bg-background"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-textcolor"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      <div className="md:hidden flex items-center gap-2">
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="p-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-textcolor"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>

        <SignedIn>
          <NotificationBell />
        </SignedIn>

        {/* Dugme za Side Panel (tri linije) */}
        <button onClick={togglePanel} className="p-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-textcolor"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Dropdown za mobilni meni */}
      {mobileMenuOpen && (
        <div className="absolute top-16 right-0 w-full bg-background p-4 shadow-lg md:hidden z-30 border-t border-border-main">
          <SearchBar onSearch={handleSearch} />
          <div className="mt-4 border-t border-border-main pt-4 space-y-4">
            <div className="text-textcolor">
              <p className="font-bold mb-2">Izaberi Temu</p>
              <div className="bg-primary rounded-md shadow-inner">
                <ThemeSelector />
              </div>
            </div>

            <SignedIn>
              <div className="flex flex-col items-center gap-4 border-t border-border-main pt-4">
                <UserActions onLinkClick={() => setMobileMenuOpen(false)} />
              </div>
            </SignedIn>
            <SignedOut>
              <Link to="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full py-2 px-3 text-lg rounded-lg bg-primary hover:bg-primary-accent text-textcolor">
                  Login
                </button>
              </Link>
            </SignedOut>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
