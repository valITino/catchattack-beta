import { useQuery } from '@tanstack/react-query';
import { getEmulations } from '@/services/api';
import type { EmulationResult } from '@/types/backend';

export function useEmulations() {
  return useQuery<EmulationResult[]>({
    queryKey: ['emulationResults'],
    queryFn: getEmulations,
  });
}
