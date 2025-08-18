import { Link } from "react-router-dom";

const UserListSearch = ({ users }) => {
  if (!users || users.length === 0) {
    return <p className="text-center text-gray-500 mt-8">Nema pronađenih korisnika za dati upit.</p>;
  }

  return (
    <div className="space-y-4 mt-6">
      {users.map((user) => (
        <div key={user.id} className="flex items-center p-4 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-200">
          <img 
            src={user.profile_picture_url || '/logo.png'} // Koristimo logo kao fallback
            alt={user.username} 
            className="w-14 h-14 rounded-full mr-5 object-cover border-2 border-primary" 
          />
          <div className="flex-grow">
            <Link to={`/profile/${user.username}`} className="font-bold text-lg text-primary hover:underline">
              {user.username}
            </Link>
            {(user.first_name || user.last_name) && (
              <p className="text-sm text-gray-600">{[user.first_name, user.last_name].join(' ').trim()}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserListSearch;