import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

const Navbar = () => {
  return (
    <div className="w-full h-16 md:h-20 flex items-center justify-between relative">
      <Link
        to="/"
        className="flex items-center gap-4 text-2xl font-bold select-none"
      >
        <img src="/logo.png" alt="Blog Network Logo" className="w-20" />
        <span className="text-gray-800">Blog network</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 font-bold">
        <Link to="/" className="hover:text-orange-500 transition-colors">
          Home
        </Link>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          <Link to="/sign-in">
            <button className="py-2 px-4 rounded-3xl bg-orange-500 hover:bg-orange-700 text-white transition-all duration-300">
              Login
            </button>
          </Link>
        </SignedOut>
      </div>

      <div className="md:hidden">
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          <Link to="/sign-in">
            <button className="py-2 px-3 text-sm rounded-lg bg-orange-500 hover:bg-orange-700 text-white transition-all duration-300">
              Login
            </button>
          </Link>
        </SignedOut>
      </div>
    </div>
  );
};

export default Navbar;
