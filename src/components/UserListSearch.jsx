import { Link } from "react-router-dom";

const UserListSearch = ({ users }) => {
  if (!users || users.length === 0) {
    return (
      <p className="text-gray-600 text-center py-4">
        Nema korisnika za prikaz.
      </p>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      {users.map((user) => (
        <div
          key={user.id}
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow flex items-center gap-4"
        >
          {/* Profilna slika */}
          <Link to={`/profile/${user.username}`}>
            <img
              src={user.profile_picture_url || "/default-avatar.png"}
              alt={user.username}
              className="w-16 h-16 rounded-full object-cover border"
            />
          </Link>

          {/* Info o korisniku */}
          <div>
            <Link
              to={`/profile/${user.username}`}
              className="text-xl font-bold text-gray-800 hover:text-primary-accent"
            >
              {user.username}
            </Link>
            <div className="text-sm text-gray-500 mt-1">
              {user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : "Bez imena"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserListSearch;