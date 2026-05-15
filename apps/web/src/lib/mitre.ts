/**
 * MITRE ATT&CK matrix data for the /coverage page.
 *
 * Phase 5 ships a static seed (14 enterprise tactics, ~120 representative
 * techniques) so the matrix renders even without the `mitre` MCP. When the
 * `mitre` upstream is wired in Phase 7+, `loadTactics()` will switch to
 * calling `mitre.get_enterprise_layer` via the proxy.
 */

export type Technique = {
  id: string;
  name: string;
  sub?: boolean;
};

export type Tactic = {
  id: string;
  name: string;
  techniques: Technique[];
};

const T = (id: string, name: string, sub = false): Technique => ({
  id,
  name,
  sub,
});

export const TACTICS: Tactic[] = [
  {
    id: "TA0043",
    name: "Reconnaissance",
    techniques: [
      T("T1595", "Active Scanning"),
      T("T1592", "Gather Victim Host Info"),
      T("T1589", "Gather Victim Identity Info"),
      T("T1590", "Gather Victim Network Info"),
      T("T1591", "Gather Victim Org Info"),
      T("T1598", "Phishing for Information"),
      T("T1597", "Search Closed Sources"),
      T("T1596", "Search Open Tech Databases"),
    ],
  },
  {
    id: "TA0042",
    name: "Resource Development",
    techniques: [
      T("T1583", "Acquire Infrastructure"),
      T("T1586", "Compromise Accounts"),
      T("T1584", "Compromise Infrastructure"),
      T("T1587", "Develop Capabilities"),
      T("T1585", "Establish Accounts"),
      T("T1588", "Obtain Capabilities"),
      T("T1608", "Stage Capabilities"),
    ],
  },
  {
    id: "TA0001",
    name: "Initial Access",
    techniques: [
      T("T1189", "Drive-by Compromise"),
      T("T1190", "Exploit Public-Facing App"),
      T("T1133", "External Remote Services"),
      T("T1200", "Hardware Additions"),
      T("T1566", "Phishing"),
      T("T1091", "Replication Through Removable Media"),
      T("T1195", "Supply Chain Compromise"),
      T("T1199", "Trusted Relationship"),
      T("T1078", "Valid Accounts"),
    ],
  },
  {
    id: "TA0002",
    name: "Execution",
    techniques: [
      T("T1059", "Command & Scripting Interpreter"),
      T("T1059.001", "PowerShell", true),
      T("T1059.003", "Windows Command Shell", true),
      T("T1059.004", "Unix Shell", true),
      T("T1106", "Native API"),
      T("T1053", "Scheduled Task/Job"),
      T("T1129", "Shared Modules"),
      T("T1072", "Software Deployment Tools"),
      T("T1569", "System Services"),
      T("T1204", "User Execution"),
      T("T1047", "Windows Management Instrumentation"),
    ],
  },
  {
    id: "TA0003",
    name: "Persistence",
    techniques: [
      T("T1098", "Account Manipulation"),
      T("T1547", "Boot or Logon Autostart"),
      T("T1037", "Boot or Logon Initialization Scripts"),
      T("T1543", "Create or Modify System Process"),
      T("T1546", "Event Triggered Execution"),
      T("T1133", "External Remote Services"),
      T("T1574", "Hijack Execution Flow"),
      T("T1525", "Implant Container Image"),
      T("T1556", "Modify Authentication Process"),
      T("T1137", "Office Application Startup"),
      T("T1053", "Scheduled Task/Job"),
      T("T1505", "Server Software Component"),
    ],
  },
  {
    id: "TA0004",
    name: "Privilege Escalation",
    techniques: [
      T("T1548", "Abuse Elevation Control Mechanism"),
      T("T1134", "Access Token Manipulation"),
      T("T1547", "Boot or Logon Autostart"),
      T("T1037", "Boot or Logon Initialization Scripts"),
      T("T1543", "Create or Modify System Process"),
      T("T1484", "Domain Policy Modification"),
      T("T1611", "Escape to Host"),
      T("T1068", "Exploitation for Privilege Escalation"),
      T("T1055", "Process Injection"),
    ],
  },
  {
    id: "TA0005",
    name: "Defense Evasion",
    techniques: [
      T("T1548", "Abuse Elevation Control Mechanism"),
      T("T1134", "Access Token Manipulation"),
      T("T1140", "Deobfuscate/Decode Files"),
      T("T1006", "Direct Volume Access"),
      T("T1484", "Domain Policy Modification"),
      T("T1027", "Obfuscated Files or Information"),
      T("T1027.005", "Indicator Removal from Tools", true),
      T("T1055", "Process Injection"),
      T("T1218", "System Binary Proxy Execution"),
    ],
  },
  {
    id: "TA0006",
    name: "Credential Access",
    techniques: [
      T("T1110", "Brute Force"),
      T("T1555", "Credentials from Password Stores"),
      T("T1212", "Exploitation for Credential Access"),
      T("T1187", "Forced Authentication"),
      T("T1556", "Modify Authentication Process"),
      T("T1003", "OS Credential Dumping"),
      T("T1003.001", "LSASS Memory", true),
      T("T1003.003", "NTDS", true),
      T("T1552", "Unsecured Credentials"),
    ],
  },
  {
    id: "TA0007",
    name: "Discovery",
    techniques: [
      T("T1087", "Account Discovery"),
      T("T1010", "Application Window Discovery"),
      T("T1217", "Browser Bookmark Discovery"),
      T("T1083", "File and Directory Discovery"),
      T("T1135", "Network Share Discovery"),
      T("T1040", "Network Sniffing"),
      T("T1201", "Password Policy Discovery"),
      T("T1057", "Process Discovery"),
      T("T1018", "Remote System Discovery"),
      T("T1518", "Software Discovery"),
      T("T1082", "System Information Discovery"),
      T("T1016", "System Network Configuration Discovery"),
      T("T1049", "System Network Connections Discovery"),
      T("T1033", "System Owner/User Discovery"),
    ],
  },
  {
    id: "TA0008",
    name: "Lateral Movement",
    techniques: [
      T("T1210", "Exploitation of Remote Services"),
      T("T1534", "Internal Spearphishing"),
      T("T1570", "Lateral Tool Transfer"),
      T("T1563", "Remote Service Session Hijacking"),
      T("T1021", "Remote Services"),
      T("T1021.001", "RDP", true),
      T("T1021.002", "SMB/Windows Admin Shares", true),
      T("T1021.004", "SSH", true),
      T("T1080", "Taint Shared Content"),
    ],
  },
  {
    id: "TA0009",
    name: "Collection",
    techniques: [
      T("T1560", "Archive Collected Data"),
      T("T1119", "Automated Collection"),
      T("T1115", "Clipboard Data"),
      T("T1530", "Data from Cloud Storage"),
      T("T1213", "Data from Information Repositories"),
      T("T1005", "Data from Local System"),
      T("T1056", "Input Capture"),
      T("T1185", "Browser Session Hijacking"),
      T("T1113", "Screen Capture"),
      T("T1125", "Video Capture"),
    ],
  },
  {
    id: "TA0011",
    name: "Command and Control",
    techniques: [
      T("T1071", "Application Layer Protocol"),
      T("T1092", "Communication Through Removable Media"),
      T("T1132", "Data Encoding"),
      T("T1001", "Data Obfuscation"),
      T("T1568", "Dynamic Resolution"),
      T("T1573", "Encrypted Channel"),
      T("T1008", "Fallback Channels"),
      T("T1105", "Ingress Tool Transfer"),
      T("T1104", "Multi-Stage Channels"),
      T("T1095", "Non-Application Layer Protocol"),
      T("T1571", "Non-Standard Port"),
      T("T1572", "Protocol Tunneling"),
      T("T1090", "Proxy"),
    ],
  },
  {
    id: "TA0010",
    name: "Exfiltration",
    techniques: [
      T("T1020", "Automated Exfiltration"),
      T("T1030", "Data Transfer Size Limits"),
      T("T1048", "Exfiltration Over Alternative Protocol"),
      T("T1041", "Exfiltration Over C2 Channel"),
      T("T1011", "Exfiltration Over Other Network Medium"),
      T("T1052", "Exfiltration Over Physical Medium"),
      T("T1567", "Exfiltration Over Web Service"),
      T("T1029", "Scheduled Transfer"),
    ],
  },
  {
    id: "TA0040",
    name: "Impact",
    techniques: [
      T("T1531", "Account Access Removal"),
      T("T1485", "Data Destruction"),
      T("T1486", "Data Encrypted for Impact"),
      T("T1565", "Data Manipulation"),
      T("T1491", "Defacement"),
      T("T1561", "Disk Wipe"),
      T("T1499", "Endpoint Denial of Service"),
      T("T1495", "Firmware Corruption"),
      T("T1490", "Inhibit System Recovery"),
      T("T1498", "Network Denial of Service"),
      T("T1496", "Resource Hijacking"),
      T("T1489", "Service Stop"),
      T("T1529", "System Shutdown/Reboot"),
    ],
  },
];

export type Coverage = {
  technique_id: string;
  rules: number;
  validated: number;
  env_confidence: number; // 0..1
};

/**
 * Server-side coverage lookup. Phase 5: derives from the local
 * detections/ filesystem (rule counts per ATT&CK tag). Phase 7+ swaps to
 * `mitre.get_coverage_layer` via the proxy.
 */
export async function loadCoverage(): Promise<Map<string, Coverage>> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const out = new Map<string, Coverage>();
  const root = path.resolve(process.cwd(), "..", "..", "detections");
  let entries: string[] = [];
  try {
    entries = await walk(fs, root);
  } catch {
    return out;
  }
  for (const file of entries) {
    if (!/\.ya?ml$/i.test(file)) continue;
    try {
      const text = await fs.readFile(file, "utf-8");
      const tagMatches = text.matchAll(/attack\.(t\d{4}(?:\.\d{3})?)/gi);
      for (const m of tagMatches) {
        const id = m[1]?.toUpperCase();
        if (!id) continue;
        const prev = out.get(id) ?? {
          technique_id: id,
          rules: 0,
          validated: 0,
          env_confidence: 0.8,
        };
        prev.rules += 1;
        prev.validated += /status:\s*stable/i.test(text) ? 1 : 0;
        out.set(id, prev);
      }
    } catch {
      // skip unreadable
    }
  }
  return out;
}

async function walk(fs: typeof import("node:fs/promises"), dir: string): Promise<string[]> {
  const out: string[] = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const full = `${dir}/${item.name}`;
    if (item.isDirectory()) {
      out.push(...(await walk(fs, full)));
    } else if (item.isFile()) {
      out.push(full);
    }
  }
  return out;
}
