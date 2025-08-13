import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import PostList from "../components/PostList";

const BellOnIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-orange-500"
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
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />

    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.586 3.586A2 2 0 1115 5v4.586m-3.207 4.207a2 2 0 01-2.364.386l-1.42-1.42A2 2 0 016 13.172V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341"
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

  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      const fetchProfileData = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = isSignedIn ? await getToken() : null;
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

          const response = await fetch(`/api/profiles/${profileUsername}`, {
            headers,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || "Greška pri dohvatanju podataka."
            );
          }

          const data = await response.json();
          setProfileData(data);
          setIsFollowing(data.is_followed_by_viewer);
          setIsBlocked(data.is_blocked_by_viewer);
          setNotificationsEnabled(data.notifications_enabled_for_viewer);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchProfileData();
    }
  }, [profileUsername, isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (isLoaded) {
      setIsOwnProfile(loggedInUser?.username === profileUsername);
    }
  }, [isLoaded, loggedInUser, profileUsername]);

  const handleFollowToggle = async () => {
    if (!isSignedIn || !profileData) return;
    const newFollowState = !isFollowing;

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
      }
    } catch (err) {
      setIsFollowing(!newFollowState);
      setProfileData((prev) => ({
        ...prev,
        followers_count:
          Number(prev.followers_count) + (!newFollowState ? 1 : -1),
      }));
    }
  };

  const handleBlockToggle = async () => {
    if (!isSignedIn || !profileData) return;
    const newBlockState = !isBlocked;

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
    setIsBlocked(newBlockState);

    try {
      const token = await getToken();
      const response = await fetch(`/api/users/${profileData.id}/block`, {
        method: newBlockState ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setIsBlocked(!newBlockState);
      }
    } catch (err) {
      setIsBlocked(!newBlockState);
    }
  };

  const getFinalLinkClass = (pathSuffix) => {
    const currentPath = location.pathname;
    const basePath = `/profile/${profileUsername}`;
    const activeClass =
      "block w-full text-left py-2 px-4 rounded-lg bg-orange-500 text-white font-semibold shadow-md";
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

  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-10">
      <header className="flex flex-col md:flex-row items-center gap-8 p-6 bg-white rounded-lg shadow-md mb-10">
        <img
          src={profileData.profile_picture_url}
          alt="Profilna slika"
          className="w-32 h-32 rounded-full border-4 border-orange-500 object-cover"
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
              {!isBlocked && (
                <button
                  onClick={handleFollowToggle}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isFollowing
                      ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  }`}
                >
                  {isFollowing ? "Otprati" : "Zaprati"}
                </button>
              )}
              {isFollowing && !isBlocked && (
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
              <button
                onClick={handleBlockToggle}
                className="px-4 py-2 rounded-lg font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                {isBlocked ? "Odblokiraj" : "Blokiraj"}
              </button>
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
              </>
            )}
          </nav>
        </aside>

        <main className="w-full md:w-3/4">
          {isBlocked ? (
            <div className="p-6 bg-gray-100 rounded-lg text-center text-gray-600">
              Blokirali ste ovog korisnika. Ne možete videti njegove objave.
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
