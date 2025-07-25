import { useQuery } from '@tanstack/react-query';
import { getTechnique } from '@/services/api';

export function useTechnique(id?: string) {
  return useQuery({
    queryKey: ['technique', id],
    queryFn: () => getTechnique(id as string),
    enabled: !!id,
  });
}
