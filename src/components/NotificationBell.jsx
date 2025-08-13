import { useState, useEffect, useCallback } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";

const BellIcon = ({ hasUnread }) => (
  <div className="relative">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
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
    {hasUnread && (
      <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
    )}
  </div>
);

const NotificationBell = () => {
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleOpen = () => setIsOpen((prev) => !prev);

  const renderNotificationText = (notif) => {
    const actor = (
      <span className="font-bold">{notif.actor_username || "Neko"}</span>
    );
    const postTitle = (
      <span className="font-semibold italic">"{notif.post_title}"</span>
    );
    if (notif.type === "new_post_from_followed")
      return (
        <>
          {actor} je objavio/la novi post: {postTitle}
        </>
      );
    if (notif.type === "reply_to_comment")
      return (
        <>
          {actor} je odgovorio/la na vaš komentar na postu {postTitle}
        </>
      );
    return "Nova notifikacija.";
  };

  return (
    <div className="relative">
      <button onClick={handleOpen}>
        <BellIcon hasUnread={unreadCount > 0} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl z-20 border">
          <div className="flex justify-between items-center p-4 border-b">
            <span className="font-bold">Notifikacije</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 text-sm border-b ${
                    !notif.is_read ? "bg-orange-50" : "hover:bg-gray-100"
                  }`}
                >
                  <p>{renderNotificationText(notif)}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="p-4 text-sm text-gray-500 text-center">
                Nemate nijednu notifikaciju.
              </p>
            )}
          </div>
          <div className="p-2 text-center border-t"></div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
