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

  const fetchPosts = async (pageToFetch) => {
    try {
      const params = new URLSearchParams();

      if (searchQuery) params.append("search", searchQuery);
      if (minLikes) params.append("minLikes", minLikes);
      if (maxLikes) params.append("maxLikes", maxLikes);
      if (minDate) params.append("minDate", minDate);
      if (maxDate) params.append("maxDate", maxDate);

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
  }, [searchQuery, minLikes, maxLikes, minDate, maxDate]);

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

      <div className="mt-8 text-center">
        <h1 className="text-3xl font-bold text-primary mb-6">
          Objava sedmice!
        </h1>
        <div className="flex flex-row border-4 border-primary p-4 mt-4">
          <img src="/vite.svg" alt="Image" className="w-1/4 mr-8" />
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
              Lorem ipsum dolor sit, amet consectetur adipisicing elit.
              Accusamus quasi vitae tempore velit provident. Nemo eligendi
              deserunt eaque vero, cupiditate similique, a ea repudiandae neque
              amet nisi eius consectetur doloribus!
            </p>
          </div>
        </div>

        <InfiniteScroll
          dataLength={posts.length}
          next={() => fetchPosts(page)}
          hasMore={hasMore}
          loader={<h4 className="text-center text-gray-500">Učitavanje...</h4>}
          endMessage={
            <p className="text-center text-gray-400 mt-4">
              <b>Učitali ste sve objave za date parametre.</b>
            </p>
          }
        >
          <PostList posts={posts} />
        </InfiniteScroll>
      </div>
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
