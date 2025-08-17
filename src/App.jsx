import { Routes, Route, Link, useSearchParams } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import PostList from "./components/PostList.jsx";

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
import EditProfilePage from "./pages/EditProfilePage.jsx";
import FollowingPage from "./pages/FollowingPage";
import FollowersPage from "./pages/FollowersPage";
import ReportIssuePage from "./pages/ReportIssuePage";
import DraftsPage from "./pages/DraftsPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminIssueDetailsPage from "./pages/AdminIssueDetailsPage";

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const minLikes = searchParams.get("minLikes") || "";
  const maxLikes = searchParams.get("maxLikes") || "";
  const minDate = searchParams.get("minDate") || "";
  const maxDate = searchParams.get("maxDate") || "";
  const tags = searchParams.getAll("tags");

  const fetchPosts = async (pageToFetch) => {
    try {
      const params = new URLSearchParams();

      if (searchQuery) params.append("search", searchQuery);
      if (minLikes) params.append("minLikes", minLikes);
      if (maxLikes) params.append("maxLikes", maxLikes);
      if (minDate) params.append("minDate", minDate);
      if (maxDate) params.append("maxDate", maxDate);
      if (tags.length > 0) {
        tags.forEach((tag) => params.append("tags", tag));
      }

      params.append("page", pageToFetch);

      const res = await fetch(`/api/public/search?${params.toString()}`);
      const data = await res.json();

      if (pageToFetch === 1) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }

      setHasMore(data.hasMore);
      setPage(pageToFetch + 1); //sl br stranice za sl put
    } catch (error) {
      console.error("Greška prilikom dohvatanja postova:", error);
    }
  };

  useEffect(() => {
    setPage(1);
    setPosts([]);
    fetchPosts(1);
  }, [searchQuery, minLikes, maxLikes, minDate, maxDate, JSON.stringify(tags)]);

  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-10">
      <div className="flex flex-row justify-between border-b-2 border-gray-300">
        <div className="">
          <h1 className="text-4xl font-bold">Dobrodošli na Blog Network!</h1>
          <p className="mt-4">
            Ovo je početna stranica. Izaberite opciju iz navigacije ili
            započnite sa kreiranjem!
          </p>
        </div>

        <div className="text-center md:text-right mb-12">
          <SignedIn>
            <Link to="/create-blog">
              <button className="py-3 px-6 rounded-lg bg-primary hover:bg-primary-accent text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                Kreiraj Novu Objavu
              </button>
            </Link>
          </SignedIn>

          <SignedOut>
            <Link to="/sign-up">
              <button className="py-3 px-6 rounded-lg bg-primary hover:bg-primary-accent text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                Pridruži se i Kreiraj Svoj Blog!
              </button>
            </Link>
          </SignedOut>
        </div>
      </div>

      <PostOfTheWeek />
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route
        path="/admin/issues/:issueId"
        element={<AdminIssueDetailsPage />}
      />

      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />

        <Route path="edit-post/:slug" element={<BlogCreationPage />} />

        <Route path="create-blog" element={<BlogCreationPage />} />

        <Route path="about" element={<AboutPage />} />
        <Route path="report-issue" element={<ReportIssuePage />} />

        <Route path="profile/:username" element={<ProfilePage />}>
          <Route index element={<ProfilePosts />} />
          <Route path="saved" element={<SavedPosts />} />
          <Route path="history" element={<ReadingHistory />} />
          <Route path="edit" element={<EditProfilePage />} />
          <Route path="following" element={<FollowingPage />} />
          <Route path="followers" element={<FollowersPage />} />
          <Route path="drafts" element={<DraftsPage />} />
        </Route>

        <Route path="/posts/:slug" element={<SinglePostPage />} />
      </Route>
    </Routes>
  );
};

export default App;
