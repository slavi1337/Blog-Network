import { Routes, Route, Link } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import MainLayout from "./layouts/MainLayout";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import AboutPage from "./pages/AboutPage";

const HomePage = () => (
  <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-10">
    <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-gray-300 pb-8">
      <div>
        <h1 className="text-4xl font-bold">Dobrodosli na Blog Network!</h1>
        <p className="mt-4 text-gray-600">/////////</p>
      </div>

      <div className="text-center md:text-right mt-8 md:mt-0">
        <SignedIn>
          <p className="text-lg font-semibold">test</p>
        </SignedIn>
        <SignedOut>
          <Link to="/sign-up">
            <button className="py-3 px-6 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              registruj se
            </button>
          </Link>
        </SignedOut>
      </div>
    </div>
    <div className="mt-10 text-center text-gray-500">
      <p>Soon</p>
    </div>
  </div>
);

const App = () => {
  return (
    <Routes>
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
};

export default App;
