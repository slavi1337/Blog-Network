import { Link } from "react-router-dom";

const UserList = ({ users, emptyMessage = "Nema korisnika za prikaz." }) => {
  if (!users || users.length === 0) {
    return <p className="text-gray-600 text-center p-4">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <img
            src={user.profile_picture_url || "/vite.svg"}
            alt={user.username}
            className="w-12 h-12 rounded-full object-cover mr-4"
          />
          <div className="flex-grow">
            <Link
              to={`/profile/${user.username}`}
              className="text-lg font-bold text-gray-800 hover:text-orange-600"
            >
              {user.first_name} {user.last_name}
            </Link>
            <p className="text-sm text-gray-500">@{user.username}</p>
          </div>
          <Link
            to={`/profile/${user.username}`}
            className="px-3 py-1 text-sm rounded-full bg-orange-100 text-orange-700 font-semibold hover:bg-orange-200"
          >
            Pogledaj profil
          </Link>
        </div>
      ))}
    </div>
  );
};

export default UserList;