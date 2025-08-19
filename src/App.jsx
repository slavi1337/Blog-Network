import { Routes, Route, Link, useSearchParams } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useEffect, useState, useCallback } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import PostList from "./components/PostList.jsx";
import UserListSearch from "./components/UserListSearch.jsx";

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
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const searchType = searchParams.get("type") || "posts";
  const minLikes = searchParams.get("minLikes") || "";
  const maxLikes = searchParams.get("maxLikes") || "";
  const minDate = searchParams.get("minDate") || "";
  const maxDate = searchParams.get("maxDate") || "";
  const tags = searchParams.getAll("tags");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  
  const stringifiedTags = JSON.stringify(tags);

  useEffect(() => {
    const performSearch = async () => {
      const params = new URLSearchParams();

      if (searchQuery) params.append("search", searchQuery);
      if (minLikes) params.append("minLikes", minLikes);
      if (maxLikes) params.append("maxLikes", maxLikes);
      if (minDate) params.append("minDate", minDate);
      if (maxDate) params.append("maxDate", maxDate);
      tags.forEach(tag => params.append("tags", tag));

      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      params.append("page", "1");

      try {
        const res = await fetch(`/api/public/search?${params.toString()}`);
        const data = await res.json();
        
        setPosts(data.posts || []);
        setHasMore(data.hasMore);
        setPage(2);
      } catch (error) {
        console.error("Greška prilikom dohvatanja postova:", error);
      }
    };
    
    if (searchType === 'users') {
      setPosts([]);
      setHasMore(false);
    } else {
      performSearch();
    }
  }, [searchQuery, searchType, minLikes, maxLikes, minDate, maxDate, stringifiedTags, sortBy, sortOrder]);

const fetchMorePosts = async () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (minLikes) params.append("minLikes", minLikes);
    if (maxLikes) params.append("maxLikes", maxLikes);
    if (minDate) params.append("minDate", minDate);
    if (maxDate) params.append("maxDate", maxDate);
    tags.forEach(tag => params.append("tags", tag));
    params.append("sortBy", sortBy);
    params.append("sortOrder", sortOrder);
    params.append("page", page);

    try {

      const res = await fetch(`/api/public/search?${params.toString()}`);
      const data = await res.json();

      setPosts(prev => [...prev, ...(data.posts || [])]);
      setHasMore(data.hasMore);
      setPage(prevPage => prevPage + 1);
    } catch (error) {
      console.error("Greška prilikom dohvatanja dodatnih postova:", error);
    }
  };

  const fetchUsers = useCallback(async () => {
    if (!searchQuery) {
      setUsers([]);
      return;
    }
    try {
      const params = new URLSearchParams({ search: searchQuery });
      const res = await fetch(`/api/public/search/users?${params.toString()}`);
      const data = await res.json();
      setUsers(data || []);
    } catch (error) {
      console.error("Greška prilikom dohvatanja korisnika:", error);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery && searchType === 'users') {
      fetchUsers();
    } else if (!searchQuery) {
      setUsers([]);
    }
  }, [searchQuery, searchType, fetchUsers]);

  const renderContent = () => {
    if (searchQuery) {
      if (searchType === 'users') {
        return <UserListSearch users={users} />;
      }
      return (
        <InfiniteScroll
          dataLength={posts.length}
          next={fetchMorePosts}
          hasMore={hasMore}
          loader={<h4 className="text-center text-gray-500">Učitavanje...</h4>}
          endMessage={
            <p className="text-center text-gray-400 mt-4">
              <b>Učitali ste sve rezultate.</b>
            </p>
          }
        >
          <PostList posts={posts} />
        </InfiniteScroll>
      );
    }

    return (
      <>
        <PostOfTheWeek />
        <InfiniteScroll
          className="border-t-2 border-gray-400"
          dataLength={posts.length}
          next={fetchMorePosts} 
          hasMore={hasMore}
          loader={<h4 className="text-center text-gray-500">Učitavanje...</h4>}
          endMessage={
            <p className="text-center text-gray-400 mt-4">
              <b>Učitali ste sve objave.</b>
            </p>
          }
        >
          <PostList posts={posts} />
        </InfiniteScroll>
      </>
    );
  };

  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-gray-400 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-bold">Dobrodošli na Blog Network!</h1>
          <p className="mt-4">
            Ovo je početna stranica. Izaberite opciju iz navigacije ili započnite sa kreiranjem!
          </p>
        </div>

        <div className="text-center md:text-right mt-6 md:mt-0">
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
      {searchQuery && (
        <h2 className="text-xl font-bold mb-6">
          Rezultati pretrage za: "{searchQuery}"
        </h2>
      )}

      {renderContent()}
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
