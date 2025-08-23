import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import UserList from "../components/UserList";

const FollowersPage = () => {
  const { getToken } = useAuth();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const response = await fetch("/api/profile/followers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setFollowers(data);
      } catch (error) {
        console.error("Greška:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFollowers();
  }, [getToken]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Moji pratioci</h1>
      {loading ? (
        <p>Učitavanje...</p>
      ) : (
        <UserList
          users={followers}
          emptyMessage="Niko vas još uvek ne prati."
        />
      )}
    </div>
  );
};

export default FollowersPage;