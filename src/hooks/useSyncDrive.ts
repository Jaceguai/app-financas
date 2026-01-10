import { useQuery } from '@tanstack/react-query';
import { fetchDriveData } from '../services/api';
import { useFinanceStore } from '../store/useFinanceStore';
import { useEffect } from 'react';

export const useSyncDrive = () => {
  const syncFromDrive = useFinanceStore((state) => state.syncFromDrive);

  const query = useQuery({
    queryKey: ['driveData'],
    queryFn: fetchDriveData,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  useEffect(() => {
    if (query.data) {
      const hasData = 
        (query.data.transacoes?.length > 0) ||
        (query.data.fixos?.length > 0) ||
        (query.data.metas?.length > 0);
      
      if (hasData) {
        syncFromDrive(query.data);
      }
    }
  }, [query.data, syncFromDrive]);
  console.log('Sync from drive completed', query.data?.fixos);

  return query;

};