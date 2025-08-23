import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";

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
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const notificationRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!isSignedIn || !isLoaded) return;

    let token;
    try {
      token = await getToken();
      console.log("Clerk Token being sent:", token);
      if (!token) {
        console.log(
          "Token još uvijek nije dostupan, preskačem dohvatanje notifikacija."
        );
        return;
      }
    } catch (error) {
      console.error("Greška pri dobijanju tokena:", error);
      return;
    }

    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return;
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [isSignedIn, isLoaded]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isLoaded, isSignedIn, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleOpen = () => setIsOpen((prev) => !prev);

  const handleMarkAllAsRead = async () => {
    setIsMarking(true);
    try {
      const token = await getToken();
      const response = await fetch("/api/notifications/mark-as-read", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchNotifications();
      } else {
        console.error("Server error on mark all as read");
      }
    } catch (err) {
      console.error("Failed to mark all as read", err);
    } finally {
      setIsMarking(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    setIsOpen(false);

    if (notification.type === "issue_status_change") {
      navigate(`/admin/issues/${notification.related_entity_id}`);
    } else if (notification.post_slug) {
      navigate(`/posts/${notification.post_slug}`);
    }

    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      try {
        const token = await getToken();
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }
  };

  const renderNotificationText = (notif) => {
    const actor = (
      <span className="font-bold">{notif.actor_username || "Neko"}</span>
    );

    if (notif.post_slug) {
      const postTitle = (
        <span className="font-semibold italic">"{notif.post_title}"</span>
      );
      if (notif.type === "new_post_from_followed") {
        return (
          <>
            {actor} je objavio/la novi post: {postTitle}
          </>
        );
      }
      if (notif.type === "reply_to_comment") {
        return (
          <>
            {actor} je odgovorio/la na vaš komentar na postu {postTitle}
          </>
        );
      }
    }

    if (notif.type === "issue_status_change") {
      const shortDesc = notif.issue_description
        ? `"${notif.issue_description.substring(0, 30)}..."`
        : "koji ste prijavili";
      const issueText = (
        <span className="font-semibold">problem {shortDesc}</span>
      );
      return (
        <>
          {actor} je ažurirao status za {issueText}
        </>
      );
    }

    return "Nova notifikacija.";
  };

  const displayedNotifications = showAll
    ? notifications
    : notifications.filter((n) => !n.is_read);

  return (
    <div className="relative" ref={notificationRef}>
      <button onClick={handleOpen}>
        <BellIcon hasUnread={unreadCount > 0} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl z-20 border">
          <div className="flex justify-between items-center p-4 border-b">
            <span className="font-bold">Notifikacije</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarking}
                className="text-xs text-primary-accent hover:underline font-semibold disabled:text-gray-400"
              >
                {isMarking ? "Označavanje..." : "Označi sve kao pročitano"}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {displayedNotifications.length > 0 ? (
              displayedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 text-sm border-b cursor-pointer ${
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
                {showAll
                  ? "Nemate nijednu notifikaciju."
                  : "Nemate nepročitanih notifikacija."}
              </p>
            )}
          </div>
          <div className="p-2 text-center border-t">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="text-xs text-gray-600 hover:underline font-semibold"
            >
              {showAll ? "Prikaži samo nepročitane" : "Prikaži sve"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
