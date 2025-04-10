
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import Header from "./Header";

const AppLayout = () => {
  return (
    <div className="flex h-screen bg-cyber-darker text-foreground">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
