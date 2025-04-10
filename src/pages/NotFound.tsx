
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldX, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-darker">
      <div className="text-center p-8 border border-cyber-primary/20 rounded-md bg-background/80 backdrop-blur-sm max-w-md">
        <ShieldX className="h-16 w-16 mx-auto mb-4 text-cyber-danger" />
        <h1 className="text-4xl font-bold mb-2 text-cyber-primary">404</h1>
        <p className="text-xl text-gray-300 mb-4">Access Denied: Path Not Found</p>
        <p className="text-gray-400 mb-6">The requested resource at <span className="text-cyber-warning">{location.pathname}</span> could not be located on this server.</p>
        
        <div className="flex justify-center space-x-4">
          <Button
            onClick={() => navigate("/")}
            className="bg-cyber-primary hover:bg-cyber-primary/90"
          >
            <Home className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="border-cyber-primary/50 text-cyber-primary hover:bg-cyber-primary/10"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
