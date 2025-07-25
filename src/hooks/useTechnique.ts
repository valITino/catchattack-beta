import { useQuery } from '@tanstack/react-query';
import { getFullTechnique } from '@/services/api';

export const useTechnique = (id: string) =>
  useQuery(['technique', id], () => getFullTechnique(id).then(r => r.data));
