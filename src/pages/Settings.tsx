
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Shield, UserCircle, Cog, Bell, Database, Globe, Lock } from "lucide-react";

const Settings = () => {
  const [activeTab, setActiveTab] = useState<string>("general");
  
  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button 
          onClick={handleSave} 
          className="bg-cyber-primary hover:bg-cyber-primary/90"
        >
          Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-4xl grid-cols-6">
          <TabsTrigger value="general">
            <Cog className="mr-2 h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="account">
            <UserCircle className="mr-2 h-4 w-4" /> Account
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Database className="mr-2 h-4 w-4" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="api">
            <Globe className="mr-2 h-4 w-4" /> API
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure the general settings for your CyberShield instance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instance-name">Instance Name</Label>
                <Input 
                  id="instance-name" 
                  placeholder="CyberShield Enterprise" 
                  defaultValue="CyberShield Enterprise"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                    <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                    <SelectItem value="cst">CST (Central Standard Time)</SelectItem>
                    <SelectItem value="mst">MST (Mountain Standard Time)</SelectItem>
                    <SelectItem value="pst">PST (Pacific Standard Time)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="telemetry">Share Anonymous Telemetry</Label>
                  <p className="text-sm text-muted-foreground">
                    Help improve CyberShield by sharing anonymous usage data
                  </p>
                </div>
                <Switch id="telemetry" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable dark mode for the application
                  </p>
                </div>
                <Switch id="dark-mode" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input 
                  id="display-name" 
                  placeholder="John Doe" 
                  defaultValue="Alex Chen"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  defaultValue="alex.chen@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input 
                  id="role" 
                  placeholder="Security Analyst" 
                  defaultValue="Security Engineer"
                  readOnly
                  className="bg-background/50"
                />
                <p className="text-xs text-muted-foreground">Contact your administrator to change roles</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-cyber-danger">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible account actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive"
                onClick={() => {
                  toast({
                    title: "Action Required",
                    description: "Please contact your administrator to delete your account.",
                    variant: "destructive",
                  });
                }}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="mr-2 h-5 w-5 text-cyber-primary" /> Security Settings
              </CardTitle>
              <CardDescription>
                Configure security settings and authentication methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Change Password</Label>
                <div className="space-y-2">
                  <Input 
                    id="current-password" 
                    type="password" 
                    placeholder="Current password"
                  />
                  <Input 
                    id="new-password" 
                    type="password" 
                    placeholder="New password"
                  />
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    placeholder="Confirm new password"
                  />
                  <Button 
                    className="mt-2"
                    onClick={() => {
                      toast({
                        title: "Password Updated",
                        description: "Your password has been changed successfully",
                      });
                    }}
                  >
                    Update Password
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="mfa">Two-Factor Authentication (2FA)</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "MFA Setup",
                      description: "Two-factor authentication setup initiated",
                    });
                  }}
                >
                  Configure
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="session">Active Sessions</Label>
                  <p className="text-sm text-muted-foreground">
                    Manage your active login sessions
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Sessions Managed",
                      description: "All other sessions have been terminated",
                    });
                  }}
                >
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Critical security notifications about your account
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Detection Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications when new threats are detected
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Pipeline Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Updates about CI/CD pipeline status
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>System Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      System maintenance and update notifications
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marketing Communications</Label>
                    <p className="text-sm text-muted-foreground">
                      Product updates, news and announcements
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>SIEM & Integration Settings</CardTitle>
              <CardDescription>
                Manage your SIEM and other security tool integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Elastic Security</h3>
                    <p className="text-sm text-muted-foreground">Connected</p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Splunk</h3>
                    <p className="text-sm text-muted-foreground">Connected</p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Microsoft Sentinel</h3>
                    <p className="text-sm text-cyber-danger">Not connected</p>
                  </div>
                  <Button>Connect</Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">IBM QRadar</h3>
                    <p className="text-sm text-cyber-danger">Not connected</p>
                  </div>
                  <Button>Connect</Button>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => {
                  toast({
                    title: "Add Integration",
                    description: "Integration wizard has been launched",
                  });
                }}
              >
                Add New Integration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>
                Manage your API keys and access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="api-key" 
                    value="••••••••••••••••••••••••••••••"
                    readOnly
                    className="font-mono bg-background/50"
                  />
                  <Button 
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "API Key Copied",
                        description: "API key has been copied to clipboard",
                      });
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This key provides full access to the API
                </p>
              </div>
              
              <div className="pt-4 space-y-2">
                <Button 
                  onClick={() => {
                    toast({
                      title: "API Key Regenerated",
                      description: "A new API key has been generated",
                    });
                  }}
                  variant="outline"
                >
                  Regenerate API Key
                </Button>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <h3 className="text-lg font-medium mb-2">API Rate Limits</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Requests per minute</Label>
                    <span className="font-mono">300</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Requests per hour</Label>
                    <span className="font-mono">15,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Requests per day</Label>
                    <span className="font-mono">300,000</span>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <h3 className="text-lg font-medium mb-2">API Documentation</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Access comprehensive documentation for the CyberShield API
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Documentation",
                      description: "API documentation would open in a new tab",
                    });
                  }}
                >
                  View Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
