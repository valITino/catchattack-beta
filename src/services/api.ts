import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000' });

export const getTechniques = () => API.get('/techniques');
export const getFullTechnique = (id: string) => API.get(`/techniques/${id}/full`);
export const startEmulation = (id: string) => API.post('/emulate', { technique_id: id });
export const generateYaml    = (id: string, payload: any) => API.post(`/yaml/${id}`, payload);
export const startVm         = (payload: any) => API.post('/vm/start', payload);

export default {
  getTechniques,
  getFullTechnique,
  startEmulation,
  generateYaml,
  startVm
};
