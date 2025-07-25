import apiClient from './apiClient';

export interface VMConfig {
  image: string;
  version: string;
  cpu: number;
  ram: number;
  network?: Record<string, any>;
}

export const backendService = {
  async startVM(config: VMConfig): Promise<{ id: string; status: string; console_cmd?: string; provider: string; error?: string; }> {
    return apiClient.post('/vm/start', config);
  },

  async generateYaml(techId: string, config: VMConfig): Promise<{ path: string; yaml: string }> {
    return apiClient.post(`/yaml/${techId}`, config);
  }
};
