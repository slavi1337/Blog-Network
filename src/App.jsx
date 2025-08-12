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
import PostOfTheWeek from "./components/PostOfTheWeek";
import SinglePostPage from "./pages/SinglePostPage";
import AboutPage from "./pages/AboutPage";

const HomePage = () => (
  <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-10">
    <div className="flex flex-row justify-between border-b-2 border-gray-300">
      <div className="">
        <h1 className="text-4xl font-bold">Dobrodošli na Blog Network!</h1>
        <p className="mt-4">
          Ovo je početna stranica. Izaberite opciju iz navigacije ili započnite
          sa kreiranjem!
        </p>
      </div>

      <div className="text-center md:text-right mb-12">
        <SignedIn>
          <Link to="/create-blog">
            <button className="py-3 px-6 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              Kreiraj Novu Objavu
            </button>
          </Link>
        </SignedIn>

        <SignedOut>
          <Link to="/sign-up">
            <button className="py-3 px-6 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              Pridruži se i Kreiraj Svoj Blog!
            </button>
          </Link>
        </SignedOut>
      </div>
    </div>

    <div className="mt-8 text-center">
      <h1 className="text-3xl font-bold text-orange-600 mb-6">
        Objava sedmice!
      </h1>
      <div className="flex flex-row border-4 border-orange-500 p-4 mt-4">
        <img src="public/vite.svg" alt="Image" className="w-1/4 mr-8" />
        <div className="text-center w-3/4">
          <div className="mb-4">
            <h1 className="font-bold text-xl">Naslov bloga</h1>
            <span className="text-gray-500 mr-4">ime korisnika</span>
            <span className="text-gray-500 mr-4">-</span>
            <span className="text-gray-500 mr-4">vrijeme objave</span>
            <span className="text-gray-500 mr-4">-</span>
            <span className="text-gray-500 mr-4">kategorija</span>
          </div>
          <p className="">
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Accusamus
            quasi vitae tempore velit provident. Nemo eligendi deserunt eaque
            vero, cupiditate similique, a ea repudiandae neque amet nisi eius
            consectetur doloribus!
          </p>
        </div>
      </div>
    </div>

    <div className="mt-10">
      <h2 className="text-2xl font-bold border-t-2 border-b-2 border-gray-300 pb-2 pt-2">
        Najnovije objave
      </h2>
      <div className="flex flex-row border-b-2 border-gray-300 pb-4 mt-4">
        <img src="public/vite.svg" alt="Image" className="w-1/4 mr-8" />
        <div className="text-center w-3/4">
          <div className="mb-4">
            <h1 className="font-bold text-xl">Naslov bloga</h1>
            <span className="text-gray-500 mr-4">ime korisnika</span>
            <span className="text-gray-500 mr-4">-</span>
            <span className="text-gray-500 mr-4">vrijeme objave</span>
            <span className="text-gray-500 mr-4">-</span>
            <span className="text-gray-500 mr-4">kategorija</span>
          </div>
          <p className="">
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Accusamus
            quasi vitae tempore velit provident. Nemo eligendi deserunt eaque
            vero, cupiditate similique, a ea repudiandae neque amet nisi eius
            consectetur doloribus!
          </p>
        </div>
      </div>
      <div className="flex flex-row border-b-2 border-gray-300 pb-4 mt-4">
        <img src="public/vite.svg" alt="Image" className="w-1/4 mr-8" />
        <div className="text-center w-3/4">
          <div className="mb-4">
            <h1 className="font-bold text-xl">Naslov bloga</h1>
            <span className="text-gray-500 mr-4">ime korisnika</span>
            <span className="text-gray-500 mr-4">-</span>
            <span className="text-gray-500 mr-4">vrijeme objave</span>
            <span className="text-gray-500 mr-4">-</span>
            <span className="text-gray-500 mr-4">kategorija</span>
          </div>
          <p className="">
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Accusamus
            quasi vitae tempore velit provident. Nemo eligendi deserunt eaque
            vero, cupiditate similique, a ea repudiandae neque amet nisi eius
            consectetur doloribus!
          </p>
        </div>
      </div>
      <div className="flex flex-row border-b-2 border-gray-300 pb-4 mt-4">
        <img src="public/vite.svg" alt="Image" className="w-1/4 mr-8" />
        <div className="text-center w-3/4">
          <div className="mb-4">
            <h1 className="font-bold text-xl">Naslov bloga</h1>
            <span className="text-gray-500 mr-4">ime korisnika</span>
            <span className="text-gray-500 mr-4">-</span>
            <span className="text-gray-500 mr-4">vrijeme objave</span>
            <span className="text-gray-500 mr-4">-</span>
            <span className="text-gray-500 mr-4">kategorija</span>
          </div>
          <p className="">
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Accusamus
            quasi vitae tempore velit provident. Nemo eligendi deserunt eaque
            vero, cupiditate similique, a ea repudiandae neque amet nisi eius
            consectetur doloribus!
          </p>
        </div>
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

        <Route path="edit-post/:slug" element={<BlogCreationPage />} />

        <Route path="create-blog" element={<BlogCreationPage />} />

        <Route path="about" element={<AboutPage />} />

        <Route path="profile/:username" element={<ProfilePage />}>
          <Route index element={<ProfilePosts />} />
          <Route path="saved" element={<SavedPosts />} />
          <Route path="history" element={<ReadingHistory />} />
          <Route path="edit" element={<EditProfilePage />} />
        </Route>

        <Route path="/posts/:slug" element={<SinglePostPage />} />
      </Route>
    </Routes>
  );
};

export default App;
