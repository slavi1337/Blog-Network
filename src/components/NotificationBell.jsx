import { useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen((prev) => !prev);

  const hasUnread = false;

  return (
    <div className="relative">
      <button onClick={handleOpen}>
        <BellIcon hasUnread={hasUnread} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl z-20 border">
          <div className="flex justify-between items-center p-4 border-b">
            <span className="font-bold">Notifikacije</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <p className="p-4 text-sm text-gray-500 text-center">
              Nema notifikacija.
            </p>
          </div>
          <div className="p-2 text-center border-t"></div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
