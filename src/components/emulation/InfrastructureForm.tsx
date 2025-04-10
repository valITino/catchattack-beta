
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { Scanner, Server, Database, Laptop, Shield, Globe, Network } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Define the form schema using Zod
const infrastructureFormSchema = z.object({
  organizationName: z.string().min(2, { message: "Organization name is required" }),
  environmentType: z.enum(["corporate", "cloud", "hybrid"]),
  endpoints: z.object({
    windows: z.boolean().default(false),
    linux: z.boolean().default(false),
    macos: z.boolean().default(false),
    mobileDevices: z.boolean().default(false),
  }),
  servers: z.object({
    windowsServer: z.boolean().default(false),
    linuxServer: z.boolean().default(false),
    containerized: z.boolean().default(false),
  }),
  cloudServices: z.object({
    aws: z.boolean().default(false),
    azure: z.boolean().default(false),
    gcp: z.boolean().default(false),
    other: z.boolean().default(false),
  }),
  networkDevices: z.object({
    firewalls: z.boolean().default(false),
    routers: z.boolean().default(false),
    switches: z.boolean().default(false),
    iot: z.boolean().default(false),
  }),
  securitySolutions: z.object({
    edr: z.boolean().default(false),
    siem: z.boolean().default(false),
    dlp: z.boolean().default(false),
    iam: z.boolean().default(false),
    threatIntel: z.boolean().default(false),
  }),
  dataSourcesAvailable: z.object({
    networkLogs: z.boolean().default(false),
    endpointLogs: z.boolean().default(false),
    applicationLogs: z.boolean().default(false),
    cloudLogs: z.boolean().default(false),
    authenticationLogs: z.boolean().default(false),
  }),
  additionalNotes: z.string().optional(),
});

type InfrastructureFormValues = z.infer<typeof infrastructureFormSchema>;

interface InfrastructureFormProps {
  onSubmit: (values: InfrastructureFormValues) => void;
}

const InfrastructureForm = ({ onSubmit }: InfrastructureFormProps) => {
  const form = useForm<InfrastructureFormValues>({
    resolver: zodResolver(infrastructureFormSchema),
    defaultValues: {
      organizationName: "",
      environmentType: "corporate",
      endpoints: {
        windows: false,
        linux: false,
        macos: false,
        mobileDevices: false,
      },
      servers: {
        windowsServer: false,
        linuxServer: false,
        containerized: false,
      },
      cloudServices: {
        aws: false,
        azure: false,
        gcp: false,
        other: false,
      },
      networkDevices: {
        firewalls: false,
        routers: false,
        switches: false,
        iot: false,
      },
      securitySolutions: {
        edr: false,
        siem: false,
        dlp: false,
        iam: false,
        threatIntel: false,
      },
      dataSourcesAvailable: {
        networkLogs: false,
        endpointLogs: false,
        applicationLogs: false,
        cloudLogs: false,
        authenticationLogs: false,
      },
      additionalNotes: "",
    },
  });

  const handleSubmit = (values: InfrastructureFormValues) => {
    onSubmit(values);
  };

  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scanner className="h-5 w-5 text-cyber-primary" />
          Infrastructure Assessment
        </CardTitle>
        <CardDescription>
          Provide details about your environment for customized emulation scenarios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter organization name" className="bg-cyber-darker border-cyber-primary/20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="environmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Environment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-cyber-darker border-cyber-primary/20">
                        <SelectValue placeholder="Select environment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="corporate">Corporate (On-premise)</SelectItem>
                      <SelectItem value="cloud">Cloud-based</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Laptop className="h-4 w-4 text-cyber-primary" /> Endpoints
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="endpoints.windows"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Windows</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endpoints.linux"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Linux</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endpoints.macos"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">macOS</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endpoints.mobileDevices"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Mobile Devices</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Server className="h-4 w-4 text-cyber-primary" /> Servers
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="servers.windowsServer"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Windows Server</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="servers.linuxServer"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Linux Server</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="servers.containerized"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Containerized</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Cloud className="h-4 w-4 text-cyber-primary" /> Cloud Services
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cloudServices.aws"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">AWS</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cloudServices.azure"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Azure</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cloudServices.gcp"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">GCP</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cloudServices.other"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Other Cloud</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Network className="h-4 w-4 text-cyber-primary" /> Network Devices
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="networkDevices.firewalls"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Firewalls</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="networkDevices.routers"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Routers</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="networkDevices.switches"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Switches</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="networkDevices.iot"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">IoT Devices</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-cyber-primary" /> Security Solutions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="securitySolutions.edr"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">EDR/XDR</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="securitySolutions.siem"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">SIEM</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="securitySolutions.dlp"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">DLP</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="securitySolutions.iam"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">IAM</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="securitySolutions.threatIntel"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Threat Intel</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-cyber-primary" /> Data Sources
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataSourcesAvailable.networkLogs"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Network Logs</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataSourcesAvailable.endpointLogs"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Endpoint Logs</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataSourcesAvailable.applicationLogs"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Application Logs</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataSourcesAvailable.cloudLogs"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Cloud Logs</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataSourcesAvailable.authenticationLogs"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Authentication Logs</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional information about your infrastructure..." 
                      className="min-h-[100px] bg-cyber-darker border-cyber-primary/20"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Include details about custom applications, security policies, or specific concerns
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-cyber-primary hover:bg-cyber-primary/90">
              Generate Virtual Environment
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default InfrastructureForm;
