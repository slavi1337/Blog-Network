import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken } = useAuth();
  const location = useLocation();
  const { username } = useParams();

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const response = await fetch("/api/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Greška pri dohvatanju podataka.");
        }

        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [getToken]);

  const getLinkClass = (pathSuffix) => {
    const currentPath = location.pathname;
    const basePath = `/profile/${username}`;

    if (pathSuffix === "") {
      return currentPath === basePath ? "active-link" : "inactive-link";
    }

    return currentPath.endsWith(pathSuffix) ? "active-link" : "inactive-link";
  };

  const activeLinkClass =
    "block w-full text-left py-2 px-4 rounded-lg bg-orange-500 text-white font-semibold shadow-md";
  const inactiveLinkClass =
    "block w-full text-left py-2 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold transition-colors";

  const getFinalLinkClass = (pathSuffix) => {
    if (pathSuffix === "" && location.pathname === `/profile/${username}`) {
      return activeLinkClass;
    }
    if (pathSuffix !== "" && location.pathname.endsWith(pathSuffix)) {
      return activeLinkClass;
    }
    return inactiveLinkClass;
  };

  if (loading)
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
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-10">
        <aside className="w-full md:w-1/4 flex-shrink-0">
          <nav className="flex flex-col gap-3 p-4 bg-white rounded-lg shadow-md">
            <Link to={`/profile/${username}`} className={getFinalLinkClass("")}>
              Moje Objave
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
          </nav>
        </aside>

        <main className="w-full md:w-3/4">
          <Outlet context={{ posts: profileData.posts }} />
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
