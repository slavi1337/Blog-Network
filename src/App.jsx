import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";

import ProfilePage from "./pages/ProfilePage";

import ProfilePosts from "./components/ProfilePosts";
import SavedPosts from "./pages/SavedPostsPage";
import ReadingHistory from "./pages/ReadingHistoryPage";

const HomePage = () => (
  <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-10">
    <h1 className="text-3xl font-bold">Dobrodošli na Blog Network!</h1>
    <p className="mt-4">
      Ovo je početna stranica. Izaberite opciju iz navigacije.
    </p>
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
