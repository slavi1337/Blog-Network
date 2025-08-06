import { useState } from "react";
import { Image } from "@imagekit/react";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const menuItems = (
    <>
      <Link to="/" className="hover:text-orange-500 transition-colors">
        Home
      </Link>
      <Link to="/about" className="hover:text-orange-500 transition-colors">
        About
      </Link>
      <Link to="/contact" className="hover:text-orange-500 transition-colors">
        Contact
      </Link>
      <Link to="/posts" className="hover:text-orange-500 transition-colors">
        Posts
      </Link>
    </>
  );

  return (
    <div className="w-full h-16 md:h-20 flex items-center justify-between">
      {/* LOGO */}
      <Link
        to="/"
        className="flex items-center gap-4 text-2xl font-bold select-none"
      >
        <Image
          urlEndpoint={import.meta.env.VITE_IK_URL_ENDPOINT}
          src="/vite.svg"
          className="w-8 h-8"
        />
        <span>Blog network</span>
      </Link>

      {/* MENI DESKTOP */}
      <div className="hidden md:flex items-center gap-8 xl:gap-12 font-bold">
        {menuItems}
        <SignedOut>
          <Link to="/sign-in">
            <button className="py-2 px-4 rounded-3xl bg-orange-500 hover:bg-orange-700 text-white transition-colors">
              Login
            </button>
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>

      {/* MENI TELEFON */}
      <div className="md:hidden">
        <div
          className="cursor-pointer text-3xl select-none font-bold px-4"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "🗙" : "☰"}
        </div>
        {open && (
          <div
            className={`w-full h-screen flex flex-col items-center justify-center gap-8 font-bold text-lg absolute top-16 left-0 bg-[#e6e6e6] z-10 transition-all ease-in-out`}
          >
            {menuItems}
            <SignedOut>
              <Link to="/sign-in">
                <button className="py-2 px-4 rounded-3xl bg-orange-500 hover:bg-orange-700 text-white transition-colors">
                  Login
                </button>
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
