
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Home, Play, FileCode2, Share2, Cog, Server, RefreshCw,
  AlertOctagon, ArrowRight, PanelRight, ChevronRight, ShoppingBasket
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({
  className,
  collapsed,
  setCollapsed,
}: SidebarProps) {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();

  return (
    <>
      <div
        className={cn(
          "flex flex-col h-screen bg-background overflow-hidden border-r border-border transition-width duration-200",
          collapsed ? "w-16" : "w-64",
          className
        )}
      >
        {/* Logo */}
        <div className={`p-4 flex items-center justify-between ${collapsed ? "justify-center" : ""}`}>
          {!collapsed && (
            <Link to="/" className="flex items-center">
              <div className="text-xl font-bold text-cyber-primary">
                CyberShield
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={`${collapsed ? "" : "ml-auto"}`}
          >
            {collapsed ? <PanelRight size={18} /> : <ChevronRight size={18} />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="grid gap-1 p-2">
            <Link to="/">
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "default"}
                className={cn(
                  "justify-start w-full",
                  pathname === "/" && "bg-accent"
                )}
              >
                <Home className={cn("h-5 w-5", !collapsed && "mr-2")} />
                {!collapsed && <span>Dashboard</span>}
              </Button>
            </Link>

            <Separator className="my-2" />
            
            {!collapsed && (
              <div className="text-xs text-muted-foreground px-2 py-1">
                Adversary Emulation
              </div>
            )}
            
            <Link to="/emulation">
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "default"}
                className={cn(
                  "justify-start w-full",
                  pathname.includes("/emulation") && "bg-accent"
                )}
              >
                <Play className={cn("h-5 w-5", !collapsed && "mr-2")} />
                {!collapsed && <span>Emulation Settings</span>}
              </Button>
            </Link>
            
            <Link to="/automation">
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "default"}
                className={cn(
                  "justify-start w-full",
                  pathname.includes("/automation") && "bg-accent"
                )}
              >
                <RefreshCw className={cn("h-5 w-5", !collapsed && "mr-2")} />
                {!collapsed && <span>CI/CD Pipeline</span>}
              </Button>
            </Link>
            
            <Link to="/infrastructure">
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "default"}
                className={cn(
                  "justify-start w-full",
                  pathname.includes("/infrastructure") && "bg-accent"
                )}
              >
                <Server className={cn("h-5 w-5", !collapsed && "mr-2")} />
                {!collapsed && <span>Infrastructure</span>}
              </Button>
            </Link>

            {!collapsed && (
              <div className="text-xs text-muted-foreground px-2 py-1 mt-2">
                Detection Engineering
              </div>
            )}
            <Separator className={cn(collapsed && "my-2")} />
            
            <Link to="/sigma">
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "default"}
                className={cn(
                  "justify-start w-full",
                  pathname.includes("/sigma") && "bg-accent"
                )}
              >
                <FileCode2 className={cn("h-5 w-5", !collapsed && "mr-2")} />
                {!collapsed && <span>Sigma Rules</span>}
              </Button>
            </Link>
            
            <Link to="/siem">
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "default"}
                className={cn(
                  "justify-start w-full",
                  pathname.includes("/siem") && "bg-accent"
                )}
              >
                <Share2 className={cn("h-5 w-5", !collapsed && "mr-2")} />
                {!collapsed && <span>SIEM Integration</span>}
              </Button>
            </Link>
            
            <Link to="/community">
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "default"}
                className={cn(
                  "justify-start w-full",
                  pathname.includes("/community") && "bg-accent"
                )}
              >
                <ShoppingBasket className={cn("h-5 w-5", !collapsed && "mr-2")} />
                {!collapsed && <span>Community</span>}
              </Button>
            </Link>

            <Separator className="my-2" />

            <Link to="/settings">
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "default"}
                className={cn(
                  "justify-start w-full",
                  pathname.includes("/settings") && "bg-accent"
                )}
              >
                <Cog className={cn("h-5 w-5", !collapsed && "mr-2")} />
                {!collapsed && <span>Settings</span>}
              </Button>
            </Link>
          </nav>
        </ScrollArea>

        {!collapsed && (
          <div className="p-4">
            <div className="bg-cyber-primary/10 border border-cyber-primary/20 rounded-md p-2">
              <div className="flex items-center mb-2">
                <AlertOctagon className="text-cyber-primary h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Active Alerts</span>
              </div>
              <div className="text-xs text-muted-foreground">
                3 new threats detected in the last 24 hours
              </div>
              <div className="mt-2">
                <Button variant="link" className="h-auto p-0 text-xs">
                  View Alerts <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
}
