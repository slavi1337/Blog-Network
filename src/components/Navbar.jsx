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

  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSearch = (query, filters = {}) => {
    const params = new URLSearchParams();

    if (query) params.set("search", query);

    if (filters.minLikes !== "") params.set("minLikes", filters.minLikes);
    if (filters.maxLikes !== "") params.set("maxLikes", filters.maxLikes);
    if (filters.minDateActive && filters.minDate)
      params.set("minDate", filters.minDate);
    if (filters.maxDateActive && filters.maxDate)
      params.set("maxDate", filters.maxDate);

    navigate(`/?${params.toString()}`);
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

  const NavLinks = () => (
    <>
      <Link to="/" className="hover:text-primary transition-colors">
        Home
      </Link>
    </>
  );

  const UserActions = () => {
    if (!user) return null;

    return (
      <>
        <Link
          to={`/profile/${user.username}`}
          className="hover:text-primary transition-colors font-bold"
          onClick={() => setOpen(false)} // Zatvori mobilni meni na klik
        >
          Moj Profil
        </Link>
        <div onClick={() => setOpen(false)}>
          {" "}
          <UserButton afterSignOutUrl="/" />
        </div>
      </>
    );
  };

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
            className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-primary text-sm font-bold text-textcolor hover:bg-primary_accent"
          >
            Teme
          </button>
          {themeMenuOpen && (
            <div className="absolute top-12 z-10 mt-2 w-40 rounded-md shadow-lg bg-primary ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                <a
                  onClick={() => setTheme("theme-blog-network")}
                  className="block px-4 py-2 text-sm text-textcolor hover:bg-background select-none cursor-pointer"
                >
                  Blog Network
                </a>
                <a
                  onClick={() => setTheme("theme-etfbl")}
                  className="block px-4 py-2 text-sm text-textcolor hover:bg-background select-none cursor-pointer"
                >
                  ETF-BL
                </a>
                <a
                  onClick={() => setTheme("theme-dark")}
                  className="block px-4 py-2 text-sm text-textcolor hover:bg-background select-none cursor-pointer"
                >
                  Dark
                </a>
              </div>
            </div>
          )}
        </div>
        <NavLinks />
        <SignedIn>
          <div className="flex items-center gap-8">
            <NotificationBell />
            <UserActions />
          </div>
        </SignedIn>
        <SignedOut>
          <Link to="/sign-in">
            <button className="py-2 px-4 rounded-3xl bg-primary hover:bg-primary-accent text-white transition-all duration-300">
              Login
            </button>
          </Link>
        </SignedOut>

        {/* Dugme za otvaranje side panela */}
        <button
          onClick={togglePanel}
          className="p-2 rounded-full hover:bg-gray-200"
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

      <div className="md:hidden flex items-center">
        <button
          onClick={togglePanel}
          className="p-2 rounded-full hover:bg-gray-200 mr-2"
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
        <UserButton afterSignOutUrl="/" />
      </div>

      {/* Mobilni Meni */}
      <div className="md:hidden">
        <button
          className="cursor-pointer text-3xl select-none font-bold px-4 z-20"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "🗙" : "☰"}
        </button>

        <div
          className={`absolute top-0 left-0 w-full h-screen bg-[#e6e6e6] flex flex-col items-center justify-center gap-8 font-bold text-2xl z-10 transition-transform duration-300 ease-in-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <NavLinks />
          <SignedIn>
            <div className="flex items-center gap-8">
              <NotificationBell />

              <UserActions />
            </div>
          </SignedIn>
          <SignedOut>
            <Link to="/sign-in" onClick={() => setOpen(false)}>
              <button className="py-2 px-4 rounded-3xl bg-primary hover:bg-primary-dark text-white transition-all duration-300">
                Login
              </button>
            </Link>
          </SignedOut>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
