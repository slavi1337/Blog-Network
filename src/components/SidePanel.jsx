import { Link } from "react-router-dom";
import { useSidePanel } from "../context/SidePanelContext";

const SidePanel = () => {
  const { isPanelOpen, closePanel } = useSidePanel();

  const panelLinks = [
    { to: "/about", text: "O Nama" },
    { to: "/contact", text: "Kontakt" },
    { to: "/report-issue", text: "Prijavi Problem" },
  ];

  return (
    <>
      <div
        onClick={closePanel}
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isPanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-primary shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6">
          <button
            onClick={closePanel}
            className="text-textcolor text-2xl font-bold mb-8"
          >
            ×
          </button>
          <nav className="flex flex-col space-y-4">
            {panelLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closePanel}
                className="text-textcolor text-lg font-semibold py-2 px-3 rounded-md hover:bg-orange-500 hover:text-white transition-colors"
              >
                {link.text}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default SidePanel;
