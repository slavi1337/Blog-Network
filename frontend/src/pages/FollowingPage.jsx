import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import UserList from "../components/UserList";

const FollowingPage = () => {
  const { getToken } = useAuth();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowing = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const response = await fetch("/api/profile/following", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setFollowing(data);
      } catch (error) {
        console.error("Greška:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFollowing();
  }, [getToken]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Korisnici koje pratim</h1>
      {loading ? (
        <p>Učitavanje...</p>
      ) : (
        <UserList
          users={following}
          emptyMessage="Ne pratite nijednog korisnika."
        />
      )}
    </div>
  );
};

export default FollowingPage;