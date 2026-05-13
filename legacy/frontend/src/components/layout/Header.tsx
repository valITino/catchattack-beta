
import { useState } from "react";
import { 
  Bell, 
  Search, 
  User,
  ChevronDown
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="h-16 border-b border-cyber-primary/20 bg-cyber-dark flex items-center justify-between px-4">
      <div className="relative rounded-md w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="bg-cyber-darker border border-cyber-primary/20 text-sm rounded-md pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-cyber-primary"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-md hover:bg-cyber-darker relative">
          <Bell className="h-5 w-5 text-gray-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-cyber-primary rounded-full"></span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-full bg-cyber-primary/20 flex items-center justify-center">
                <User className="h-4 w-4 text-cyber-primary" />
              </div>
              <span>Security Analyst</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>API Keys</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
