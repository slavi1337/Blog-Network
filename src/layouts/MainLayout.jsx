import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const MainLayout = () => {
  return (
    <div className="bg-[#e6e6e6] min-h-screen">
      <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
        <Navbar />
      </div>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
