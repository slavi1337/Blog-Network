import { createContext, useState, useContext } from "react";

const SidePanelContext = createContext();

export const useSidePanel = () => useContext(SidePanelContext);

export const SidePanelProvider = ({ children }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const togglePanel = () => setIsPanelOpen((prev) => !prev);
  const closePanel = () => setIsPanelOpen(false);

  return (
    <SidePanelContext.Provider value={{ isPanelOpen, togglePanel, closePanel }}>
      {children}
    </SidePanelContext.Provider>
  );
};
