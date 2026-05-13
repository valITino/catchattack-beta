
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitFork } from "lucide-react";

const CommunityTabContent = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Rules</CardTitle>
        <CardDescription>Discover and import rules created by the community</CardDescription>
      </CardHeader>
      <CardContent className="h-96 flex items-center justify-center">
        <div className="text-center">
          <GitFork className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Community Marketplace</h3>
          <p className="text-gray-400 mb-4">
            Discover and share detection rules with the CatchAttack community
          </p>
          <Button>Explore Community Rules</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityTabContent;
