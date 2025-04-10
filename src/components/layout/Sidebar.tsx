
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FlaskConical, 
  FileCode2, 
  Database, 
  Shield, 
  Settings 
} from "lucide-react";

const Sidebar = () => {
  const navItems = [
    { 
      name: "Dashboard", 
      path: "/dashboard", 
      icon: <LayoutDashboard className="h-5 w-5" /> 
    },
    { 
      name: "Emulation", 
      path: "/emulation", 
      icon: <FlaskConical className="h-5 w-5" /> 
    },
    { 
      name: "Sigma Rules", 
      path: "/sigma", 
      icon: <FileCode2 className="h-5 w-5" /> 
    },
    { 
      name: "SIEM", 
      path: "/siem", 
      icon: <Database className="h-5 w-5" /> 
    },
  ];

  return (
    <aside className="w-64 h-full bg-cyber-dark border-r border-cyber-primary/20 flex flex-col">
      <div className="p-4 border-b border-cyber-primary/20 flex items-center gap-2">
        <Shield className="h-6 w-6 text-cyber-primary" />
        <span className="font-semibold text-lg">Detection-as-Code</span>
      </div>
      
      <nav className="flex flex-col p-4 gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
              isActive 
                ? "bg-cyber-primary text-white" 
                : "text-gray-400 hover:bg-cyber-dark/50 hover:text-white"
            )}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-cyber-primary/20">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white rounded-md">
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
