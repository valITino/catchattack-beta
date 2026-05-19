
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * VM Generator edge function
 * Generates virtual machine configurations based on agent data
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, tenantId } = await req.json();
    
    if (!agentId || !tenantId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Generating VM configuration for tenant ${tenantId}, agent: ${agentId}`);
    
    // Get CALDERA credentials to fetch agent details
    const calderaApiKey = Deno.env.get("CALDERA_API_KEY") || "ADMIN123";
    const calderaUrl = Deno.env.get("CALDERA_URL") || "http://localhost:8888";
    
    // Fetch agent details from CALDERA
    const apiUrl = `${calderaUrl}/api/v2/agents/${agentId}`;
    
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${calderaApiKey}`
    };
    
    let agentData;
    try {
      const response = await fetch(apiUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch agent data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      agentData = data;
    } catch (agentError) {
      console.error("Error fetching agent data:", agentError);
      
      // Fallback to mock data if CALDERA is not available
      agentData = generateMockAgentData(agentId);
    }
    
    // Process agent data to generate VM configuration
    const vmConfig = generateVMFromAgentData(agentData);
    
    return new Response(
      JSON.stringify(vmConfig),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in VM generator:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Generate mock agent data for testing when CALDERA is not available
 */
function generateMockAgentData(agentId: string) {
  // Simulate realistic agent data structure
  return {
    paw: agentId,
    display_name: `Agent-${agentId.substring(0, 8)}`,
    host: `host-${agentId.substring(0, 6)}`,
    platform: ['windows', 'linux', 'darwin'][Math.floor(Math.random() * 3)],
    architecture: 'x64',
    username: 'user',
    privilege: Math.random() > 0.5 ? 'admin' : 'user',
    pid: Math.floor(Math.random() * 10000),
    exe_name: 'agent.exe',
    location: 'C:\\Program Files\\Agent',
    last_seen: new Date().toISOString(),
    created: new Date().toISOString(),
    executors: ['cmd', 'powershell', 'bash'],
    links: [],
    facts: [
      { trait: 'os.version', value: '10.0.19042' },
      { trait: 'host.fqdn', value: `${agentId}.domain.local` },
      { trait: 'host.installed_software', value: 'Microsoft Office,Chrome,Firefox,Adobe Reader' },
      { trait: 'host.processes', value: 'explorer.exe,svchost.exe,chrome.exe' }
    ]
  };
}

/**
 * Generate VM configuration from agent data
 */
function generateVMFromAgentData(agentData: any) {
  // Extract relevant information from agent data
  const osInfo = determineOperatingSystem(agentData);
  const installedSoftware = extractInstalledSoftware(agentData);
  const services = extractServices(agentData);
  const vulnerabilities = identifyPotentialVulnerabilities(agentData);
  
  // Build the VM configuration
  const vmConfig = {
    id: `vm-${new Date().getTime()}`,
    name: `VM-${agentData.paw?.substring(0, 8) || 'unknown'}`,
    description: `Virtual machine based on agent ${agentData.display_name || agentData.paw}`,
    created: new Date().toISOString(),
    status: "creating",
    vmProperties: {
      os: osInfo.name,
      osVersion: osInfo.version,
      cpuCores: 2,
      ramGB: 4,
      diskGB: 50
    },
    services: services,
    software: installedSoftware,
    vulnerabilities: vulnerabilities,
    networkConfig: {
      interfaces: [
        {
          id: "nic-1",
          name: "Primary Network",
          ipAddress: "192.168.1.100",
          subnet: "192.168.1.0/24",
          gateway: "192.168.1.1"
        }
      ],
      firewallRules: [
        {
          id: "fw-1",
          name: "Allow HTTP/HTTPS",
          protocol: "TCP",
          ports: [80, 443],
          direction: "inbound"
        },
        {
          id: "fw-2",
          name: "Allow SSH",
          protocol: "TCP",
          ports: [22],
          direction: "inbound"
        }
      ]
    },
    dataCollection: {
      enabled: true,
      logSources: [
        {
          id: "logs-1",
          name: "System Logs",
          path: osInfo.name.toLowerCase().includes("windows") ? "C:\\Windows\\System32\\winevt\\Logs" : "/var/log",
          format: osInfo.name.toLowerCase().includes("windows") ? "EVTX" : "syslog"
        },
        {
          id: "logs-2",
          name: "Application Logs",
          path: osInfo.name.toLowerCase().includes("windows") ? "C:\\Program Files\\AppLogs" : "/var/log/app",
          format: "Custom"
        }
      ]
    }
  };
  
  return vmConfig;
}

/**
 * Determine the operating system from agent data
 */
function determineOperatingSystem(agentData: any) {
  let name = "Unknown OS";
  let version = "Unknown";
  
  // Extract from platform
  if (agentData.platform) {
    if (agentData.platform === "windows") {
      name = "Windows";
    } else if (agentData.platform === "linux") {
      name = "Linux";
    } else if (agentData.platform === "darwin") {
      name = "macOS";
    }
  }
  
  // Extract version from facts
  if (agentData.facts && Array.isArray(agentData.facts)) {
    const osVersionFact = agentData.facts.find((fact: any) => 
      fact.trait === 'os.version' || fact.trait === 'host.os.version'
    );
    
    if (osVersionFact && osVersionFact.value) {
      version = osVersionFact.value;
    }
  }
  
  // Add more specific OS name if available
  if (name === "Windows" && version.startsWith("10")) {
    name = "Windows 10";
  } else if (name === "Windows" && version.startsWith("6.1")) {
    name = "Windows 7";
  } else if (name === "Linux") {
    // Try to determine Linux distribution
    const linuxDistroFact = agentData.facts?.find((fact: any) => 
      fact.trait === 'host.distribution.name' || fact.trait === 'linux.distro'
    );
    
    if (linuxDistroFact && linuxDistroFact.value) {
      name = linuxDistroFact.value;
    }
  }
  
  return { name, version };
}

/**
 * Extract installed software from agent data
 */
function extractInstalledSoftware(agentData: any) {
  const software = [];
  
  // Extract from facts
  if (agentData.facts && Array.isArray(agentData.facts)) {
    const softwareFact = agentData.facts.find((fact: any) => 
      fact.trait === 'host.installed_software' || 
      fact.trait === 'software.installed'
    );
    
    if (softwareFact && softwareFact.value) {
      const softwareList = typeof softwareFact.value === 'string' 
        ? softwareFact.value.split(',') 
        : Array.isArray(softwareFact.value) 
          ? softwareFact.value 
          : [];
          
      softwareList.forEach((sw: string) => {
        software.push({
          name: sw.trim(),
          version: "Unknown", // In a real implementation, you would parse version info
          installDate: new Date().toISOString().split('T')[0]
        });
      });
    }
  }
  
  // If no software found, add some defaults based on OS
  if (software.length === 0) {
    const platform = agentData.platform || 'unknown';
    
    if (platform === 'windows') {
      software.push(
        { name: "Microsoft Office", version: "2019", installDate: "2023-01-15" },
        { name: "Google Chrome", version: "98.0.4758.102", installDate: "2023-03-01" },
        { name: "Adobe Reader", version: "DC 2021.007.20099", installDate: "2023-02-10" }
      );
    } else if (platform === 'linux') {
      software.push(
        { name: "OpenSSH", version: "8.2p1", installDate: "2022-12-05" },
        { name: "Python", version: "3.9.7", installDate: "2023-01-20" },
        { name: "Docker", version: "20.10.12", installDate: "2023-02-15" }
      );
    } else if (platform === 'darwin') {
      software.push(
        { name: "Xcode", version: "13.2", installDate: "2023-01-10" },
        { name: "Homebrew", version: "3.3.9", installDate: "2022-11-20" },
        { name: "Safari", version: "15.3", installDate: "2023-02-01" }
      );
    }
  }
  
  return software;
}

/**
 * Extract running services from agent data
 */
function extractServices(agentData: any) {
  const services = [];
  
  // Extract from facts or process list
  if (agentData.facts && Array.isArray(agentData.facts)) {
    const processesFact = agentData.facts.find((fact: any) => 
      fact.trait === 'host.processes' || fact.trait === 'running.processes'
    );
    
    if (processesFact && processesFact.value) {
      const processList = typeof processesFact.value === 'string' 
        ? processesFact.value.split(',') 
        : Array.isArray(processesFact.value) 
          ? processesFact.value 
          : [];
          
      // Map common process names to services
      const processServiceMap: Record<string, string> = {
        'httpd': 'Apache HTTP Server',
        'apache2': 'Apache HTTP Server',
        'nginx': 'Nginx Web Server',
        'mysqld': 'MySQL Database',
        'sqlservr': 'Microsoft SQL Server',
        'postgres': 'PostgreSQL',
        'mongod': 'MongoDB',
        'redis-server': 'Redis',
        'sshd': 'SSH Server',
        'smbd': 'Samba File Sharing',
        'vsftpd': 'FTP Server',
        'named': 'DNS Server',
        'dhcpd': 'DHCP Server',
        'snmpd': 'SNMP Service'
      };
      
      processList.forEach((proc: string) => {
        const procName = proc.trim().toLowerCase();
        
        // Check if this is a known service
        for (const [processName, serviceName] of Object.entries(processServiceMap)) {
          if (procName.includes(processName)) {
            services.push({
              name: serviceName,
              status: "running",
              startType: "automatic"
            });
            break;
          }
        }
      });
    }
  }
  
  // If no services found, add some defaults based on OS
  if (services.length === 0) {
    const platform = agentData.platform || 'unknown';
    
    if (platform === 'windows') {
      services.push(
        { name: "Windows Defender", status: "running", startType: "automatic" },
        { name: "Remote Desktop Services", status: "running", startType: "automatic" },
        { name: "IIS Web Server", status: "running", startType: "automatic" }
      );
    } else if (platform === 'linux') {
      services.push(
        { name: "SSH Server", status: "running", startType: "automatic" },
        { name: "Apache Web Server", status: "running", startType: "automatic" },
        { name: "SQL Database", status: "running", startType: "automatic" }
      );
    } else if (platform === 'darwin') {
      services.push(
        { name: "Spotlight", status: "running", startType: "automatic" },
        { name: "Time Machine", status: "running", startType: "automatic" },
        { name: "AirDrop", status: "running", startType: "automatic" }
      );
    }
  }
  
  return services;
}

/**
 * Identify potential vulnerabilities based on agent data
 */
function identifyPotentialVulnerabilities(agentData: any) {
  const vulnerabilities = [];
  
  // In a real implementation, this would analyze software versions, configurations, etc.
  // For this mock implementation, we'll generate some simulated vulnerabilities
  
  // Generate 1-5 vulnerabilities
  const vulnCount = Math.floor(Math.random() * 5) + 1;
  
  for (let i = 0; i < vulnCount; i++) {
    // Generate random CVE ID (format: CVE-YYYY-NNNNN)
    const year = 2020 + Math.floor(Math.random() * 4); // 2020-2023
    const cveNumber = Math.floor(Math.random() * 90000) + 10000;
    const cveId = `CVE-${year}-${cveNumber}`;
    
    // Select severity
    const severities = ['Low', 'Medium', 'High', 'Critical'];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    
    // Generate mock vulnerable component
    const components = [
      'OpenSSL', 'Apache HTTP Server', 'Log4j', 'Windows SMB', 'Java Runtime',
      'PHP', 'WordPress', 'MySQL', 'Microsoft Exchange', 'Adobe Reader',
      'Chrome Browser', 'Firefox Browser', 'VMware vSphere', 'Jenkins', 'Docker'
    ];
    const component = components[Math.floor(Math.random() * components.length)];
    
    vulnerabilities.push({
      id: `vuln-${i+1}`,
      cveId: cveId,
      name: `${component} Vulnerability`,
      description: `A vulnerability in ${component} could allow an attacker to ${
        Math.random() > 0.5 ? 'execute arbitrary code' : 'gain elevated privileges'
      }.`,
      severity: severity,
      affectedComponent: component,
      remediation: `Update ${component} to the latest version.`
    });
  }
  
  return vulnerabilities;
}
