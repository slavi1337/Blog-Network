import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";

const BellOnIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-primary"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const BellOffIcon = () => (
  //<?xml version="1.0" encoding="utf-8"?>
  //<!-- License: MLP. Made by Yandex: https://github.com/bem/yandex-ui-icons -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-primary"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      d="m17.972 12.751-.42-3.782a5.586 5.586 0 0 0-3.24-4.469l-.3-.164a1.5 1.5 0 0 1-.75-1.021l-.142-.712A.75.75 0 0 0 12.385 2h-.77a.75.75 0 0 0-.736.603l-.142.712a1.5 1.5 0 0 1-.75 1.02l-.3.165a5.582 5.582 0 0 0-.616.329l1.478 1.477a3.586 3.586 0 0 1 5.015 2.884l.266 2.398 1.912 1.912a.241.241 0 0 0 .241.06.08.08 0 0 0 .056-.085l-.067-.724z"
      fill="currentColor"
    />
    <path
      d="M3.293 4.707 6.63 8.044a5.61 5.61 0 0 0-.182.925l-.54 4.865a3.375 3.375 0 0 1-1.283 2.291l-.354.275a1.5 1.5 0 0 0-.534 1.548L3.75 18c.147.588.675 1 1.28 1H9a3 3 0 1 0 6 0h2.586l1.707 1.707a1 1 0 0 0 1.414-1.414l-16-16a1 1 0 0 0-1.414 1.414zM6.1 17h9.486L8.369 9.784l-.474 4.27C7.773 15.154 7.499 16.15 6.1 17z"
      fill="currentColor"
    />
  </svg>
);

const ProfilePage = () => {
  const { username: profileUsername } = useParams();
  const { user: loggedInUser, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  const [viewerHasBlocked, setViewerHasBlocked] = useState(false);
  const [profileOwnerHasBlocked, setProfileOwnerHasBlocked] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const fetchAllProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        const publicResponse = await fetch(
          `/api/public/profiles/${profileUsername}`
        );
        if (!publicResponse.ok) {
          const errorData = await publicResponse.json();
          throw new Error(errorData.error || "Greška pri dohvatanju profila.");
        }
        const publicData = await publicResponse.json();
        setProfileData(publicData);

        if (isSignedIn) {
          let token;
          try {
            token = await getToken();
          } catch (e) {}

          if (token) {
            const statusResponse = await fetch(
              `/api/profiles/${profileUsername}/status`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              setIsFollowing(statusData.is_followed_by_viewer);
              setNotificationsEnabled(
                statusData.notifications_enabled_for_viewer
              );
              setViewerHasBlocked(statusData.viewer_has_blocked);
              setProfileOwnerHasBlocked(
                statusData.has_been_blocked_by_profile_owner
              );
            }
          }
        } else {
          setIsFollowing(false);
          setNotificationsEnabled(false);
          setViewerHasBlocked(false);
          setProfileOwnerHasBlocked(false);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllProfileData();
  }, [profileUsername, isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (isLoaded) {
      setIsOwnProfile(loggedInUser?.username === profileUsername);
    }
  }, [isLoaded, loggedInUser, profileUsername]);

  const handleFollowToggle = async () => {
    if (!isSignedIn || !profileData) return;
    const newFollowState = !isFollowing;

    if (newFollowState === true) {
      setNotificationsEnabled(true);
    }

    setProfileData((prev) => ({
      ...prev,
      followers_count: Number(prev.followers_count) + (newFollowState ? 1 : -1),
    }));
    setIsFollowing(newFollowState);

    try {
      const token = await getToken();
      const response = await fetch(`/api/users/${profileData.id}/follow`, {
        method: newFollowState ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setIsFollowing(!newFollowState);
        setProfileData((prev) => ({
          ...prev,
          followers_count:
            Number(prev.followers_count) + (!newFollowState ? 1 : -1),
        }));
        if (newFollowState === true) {
          setNotificationsEnabled(false);
        }
      }
    } catch (err) {
      setIsFollowing(!newFollowState);
      setProfileData((prev) => ({
        ...prev,
        followers_count:
          Number(prev.followers_count) + (!newFollowState ? 1 : -1),
      }));
      if (newFollowState === true) {
        setNotificationsEnabled(false);
      }
    }
  };

  const handleBlockToggle = async () => {
    if (!isSignedIn || !profileData) return;
    const newBlockState = !viewerHasBlocked;

    if (
      newBlockState &&
      !window.confirm(
        `Da li ste sigurni da želite da blokirate korisnika @${profileData.username}? Nećete moći da vidite njegove objave i komentare, i biće automatski otpraćen.`
      )
    )
      return;

    if (newBlockState && isFollowing) {
      setProfileData((prev) => ({
        ...prev,
        followers_count: Number(prev.followers_count) - 1,
      }));
      setIsFollowing(false);
    }
    setViewerHasBlocked(newBlockState);

    try {
      const token = await getToken();
      const response = await fetch(`/api/users/${profileData.id}/block`, {
        method: newBlockState ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setViewerHasBlocked(!newBlockState);
      }
    } catch (err) {
      setViewerHasBlocked(!newBlockState);
    }
  };

  const getFinalLinkClass = (pathSuffix) => {
    const currentPath = location.pathname;
    const basePath = `/profile/${profileUsername}`;
    const activeClass =
      "block w-full text-left py-2 px-4 rounded-lg bg-primary text-white font-semibold shadow-md";
    const inactiveClass =
      "block w-full text-left py-2 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold transition-colors";

    if (pathSuffix === "" && currentPath === basePath) {
      return activeClass;
    }
    if (pathSuffix !== "" && currentPath.endsWith(pathSuffix)) {
      return activeClass;
    }
    return inactiveClass;
  };

  const handleNotificationToggle = async () => {
    if (!isSignedIn || !profileData) return;

    const newState = !notificationsEnabled;

    setNotificationsEnabled(newState);

    try {
      const token = await getToken();

      await fetch(`/api/users/${profileData.id}/follow/notifications`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({ enabled: newState }),
      });
    } catch (err) {
      setNotificationsEnabled(!newState);
    }
  };

  if (loading || !isLoaded)
    return (
      <div className="text-center p-10 font-semibold">
        Učitavanje profila...
      </div>
    );
  if (error)
    return (
      <div className="text-center p-10 text-red-600 bg-red-100 rounded-lg">
        Greška: {error}
      </div>
    );
  if (!profileData)
    return <div className="text-center p-10">Nema podataka o profilu.</div>;

  const isBlockedRelation = viewerHasBlocked || profileOwnerHasBlocked;

  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-10">
      <header className="flex flex-col md:flex-row items-center gap-8 p-6 bg-white rounded-lg shadow-md mb-10">
        <img
          src={profileData.profile_picture_url}
          alt="Profilna slika"
          className="w-32 h-32 rounded-full border-4 border-primary object-cover"
        />
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold">
            {profileData.first_name} {profileData.last_name}
          </h1>
          <p className="text-lg text-gray-600">@{profileData.username}</p>
          <div className="flex justify-center md:justify-start gap-6 mt-4 text-gray-700">
            <div>
              <span className="font-bold">{profileData.post_count}</span> Objava
            </div>
            <div>
              <span className="font-bold">{profileData.followers_count}</span>{" "}
              Pratilaca
            </div>
            <div>
              <span className="font-bold">{profileData.following_count}</span>{" "}
              Prati
            </div>
          </div>

          {isSignedIn && !isOwnProfile && (
            <div className="mt-4 flex justify-center md:justify-start items-center gap-3">
              {!isBlockedRelation && (
                <button
                  onClick={handleFollowToggle}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isFollowing
                      ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      : "bg-primary text-white hover:bg-primary-accent"
                  }`}
                >
                  {isFollowing ? "Otprati" : "Zaprati"}
                </button>
              )}
              {isFollowing && !isBlockedRelation && (
                <button
                  onClick={handleNotificationToggle}
                  title={
                    notificationsEnabled
                      ? "Isključi notifikacije"
                      : "Uključi notifikacije"
                  }
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {notificationsEnabled ? <BellOnIcon /> : <BellOffIcon />}
                </button>
              )}
              {!profileOwnerHasBlocked && (
                <button
                  onClick={handleBlockToggle}
                  className="px-4 py-2 rounded-lg font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  {viewerHasBlocked ? "Odblokiraj" : "Blokiraj"}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-10">
        <aside className="w-full md:w-1/4 flex-shrink-0">
          <nav className="flex flex-col gap-3 p-4 bg-white rounded-lg shadow-md">
            <Link
              to={`/profile/${profileUsername}`}
              className={getFinalLinkClass("")}
            >
              {isOwnProfile ? "Moje Objave" : "Objave"}
            </Link>

            {isOwnProfile && (
              <>
                <Link to="followers" className={getFinalLinkClass("followers")}>
                  Pratioci
                </Link>

                <Link to="following" className={getFinalLinkClass("following")}>
                  Pratim
                </Link>
                <Link to="saved" className={getFinalLinkClass("saved")}>
                  Sačuvani članci
                </Link>
                <Link to="history" className={getFinalLinkClass("history")}>
                  Istorija čitanja
                </Link>
                <hr className="my-2 border-gray-200" />
                <Link to="edit" className={getFinalLinkClass("edit")}>
                  Uredi Profil
                </Link>
                <Link to="drafts" className={getFinalLinkClass("drafts")}>
                  Draftovi
                </Link>
              </>
            )}
          </nav>
        </aside>

        <main className="w-full md:w-3/4">
          {isBlockedRelation ? (
            <div className="p-6 bg-gray-100 rounded-lg text-center text-gray-600">
              {viewerHasBlocked
                ? "Blokirali ste ovog korisnika. Ne možete vidjeti njegov sadržaj."
                : "Ovaj korisnik vas je blokirao. Ne možete vidjeti njegov sadržaj."}
            </div>
          ) : (
            <Outlet
              context={{ posts: profileData.posts, isOwnProfile: isOwnProfile }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
