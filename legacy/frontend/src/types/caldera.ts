
export interface CalderaAgent {
  id: string;
  name: string;
  paw: string;
  host: string;
  platform: string;
  status: "active" | "stale" | "dormant";
  lastSeen: string;
  group: string;
  executorName: string;
}

export interface CalderaAbility {
  id: string;
  name: string;
  description: string;
  techniqueId: string;
  tacticId: string;
  executors: {
    platform: string;
    command: string;
    cleanup?: string;
  }[];
  parsers?: any[];
  requirements?: any[];
}

export interface CalderaAdversary {
  id: string;
  name: string;
  description: string;
  objective: string;
  tags: string[];
  abilities: string[];
}

export interface CalderaOperation {
  id: string;
  name: string;
  adversaryId: string;
  agentGroups: string[];
  startTime?: string;
  endTime?: string;
  status: "scheduled" | "running" | "finished" | "failed";
  autonomous: boolean;
  visibility: "red" | "blue" | "hidden";
  state: "paused" | "running" | "cleanup" | "complete";
  facts: any[];
}

export interface CalderaResult {
  id: string;
  agentId: string;
  ability: string;
  command: string;
  output: string;
  status: number;
  timestamp: string;
}
