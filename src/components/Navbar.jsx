import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Image } from "@imagekit/react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { isSignedIn, user } = useUser();

  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const setTheme = (theme) => {
    const html = document.documentElement;
    html.classList.remove("theme-blog-network", "theme-etfbl", "theme-dark");
    html.classList.add(theme);
    localStorage.setItem("theme", theme);
  };

  const NavLinks = () => (
    <>
      <Link to="/" className="hover:text-primary transition-colors">
        Home
      </Link>
      <Link to="/about" className="hover:text-primary transition-colors">
        About
      </Link>
      <Link to="/contact" className="hover:text-primary transition-colors">
        Contact
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
        className="flex items-center gap-4 text-2xl font-bold select-none"
      >
        <Image
          urlEndpoint={
            import.meta.env.VITE_IK_URL_ENDPOINT ||
            "https://ik.imagekit.io/your_default_endpoint"
          }
          src="/vite.svg"
          className="w-8 h-8"
        />
        <span className="text-textcolor">Blog network</span>
      </Link>

      {/* Desktop Meni */}
      <div className="hidden md:flex items-center gap-8 xl:gap-12 font-bold">
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
                  className="block px-4 py-2 text-sm text-textcolor hover:bg-gray-100 select-none"
                >
                  Blog Network
                </a>
                <a
                  onClick={() => setTheme("theme-etfbl")}
                  className="block px-4 py-2 text-sm text-textcolor hover:bg-gray-100 select-none"
                >
                  ETF-BL
                </a>
                <a
                  onClick={() => setTheme("theme-dark")}
                  className="block px-4 py-2 text-sm text-textcolor hover:bg-gray-100 select-none"
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
            <button className="py-2 px-4 rounded-3xl bg-orange-500 hover:bg-orange-700 text-white transition-all duration-300">
              Login
            </button>
          </Link>
        </SignedOut>
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
