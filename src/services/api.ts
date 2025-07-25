import apiClient from './apiClient';

export const getTechniques = () => apiClient.get('/techniques');
export const getTechnique = (id: string) => apiClient.get(`/techniques/${id}/full`);
export const getEmulations = () => apiClient.get('/emulations');
