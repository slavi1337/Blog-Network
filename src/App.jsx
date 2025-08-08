import { Routes, Route, Link } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

import MainLayout from "./layouts/MainLayout";

import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";

import ProfilePage from "./pages/ProfilePage";

import ProfilePosts from "./components/ProfilePosts";
import SavedPosts from "./pages/SavedPostsPage";
import ReadingHistory from "./pages/ReadingHistoryPage";
import BlogCreationPage from "./pages/BlogCreationPage";

const HomePage = () => (
  <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-10">
    <div className="text-center md:text-right mb-8">
      <SignedIn>
        <Link to="/create-blog">
          <button className="py-3 px-6 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            Kreiraj Novi Blog
          </button>
        </Link>
      </SignedIn>

      <SignedOut>
        <Link to="/sign-up">
          <button className="py-3 px-6 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            Pridruži se i Kreiraj Svoj Blog!
          </button>
        </Link>
      </SignedOut>
    </div>

    <h1 className="text-3xl font-bold">Dobrodošli na Blog Network!</h1>
    <p className="mt-4">
      Ovo je početna stranica. Izaberite opciju iz navigacije ili započnite sa
      kreiranjem!
    </p>

    <div className="mt-10">
      <h2 className="text-2xl font-bold border-b-2 border-gray-300 pb-2 mb-4">
        Najnovije Objave
      </h2>
      <div className="text-gray-500">
        <p>Uskoro...</p>
      </div>
    </div>
  </div>
);

const EditProfilePage = () => (
  <div>
    <h2 className="text-2xl font-bold mb-6">Uređivanje Profila</h2>
    <p>Ova funkcionalnost će biti implementirana uskoro.</p>
  </div>
);

const App = () => {
  return (
    <Routes>
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />

      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />

        <Route path="create-blog" element={<BlogCreationPage />} />

        <Route path="profile/:username" element={<ProfilePage />}>
          <Route index element={<ProfilePosts />} />
          <Route path="saved" element={<SavedPosts />} />
          <Route path="history" element={<ReadingHistory />} />
          <Route path="edit" element={<EditProfilePage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
