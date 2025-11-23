import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { plantService, PlantRecord } from '@/services/PlantService';
import { fetchPlantsCsvText, parsePlantsCsv, filterPlants } from '@/utils/plantData';
import { Alert } from 'react-native';

type PlantContextValue = {
  plants: PlantRecord[];
  loading: boolean;
  error: string | null;
  refresh: (opts?: { force?: boolean }) => Promise<void>;
  findByScientificName: (name: string) => PlantRecord | undefined;
};

const PlantContext = createContext<PlantContextValue | undefined>(undefined);

export const PlantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plants, setPlants] = useState<PlantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const remote = await plantService.list(force);
      if (remote.length) {
        setPlants(remote);
      } else {
        // Fallback to CSV
        const csv = await fetchPlantsCsvText();
        const parsed = parsePlantsCsv(csv);
        setPlants(filterPlants(parsed));
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load plants');
      // Fallback to CSV
      try {
        const csv = await fetchPlantsCsvText();
        const parsed = parsePlantsCsv(csv);
        setPlants(filterPlants(parsed));
      } catch (csvErr) {
        // final failure
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const refresh = useCallback(async (opts?: { force?: boolean }) => {
    await load(!!opts?.force);
    if (opts?.force) {
      Alert.alert('Plants Refreshed', 'Fetched latest plant data.');
    }
  }, [load]);

  const findByScientificName = useCallback(
    (name: string) => plants.find(p => (p['Scientific Name'] || '').toLowerCase() === name.toLowerCase()),
    [plants],
  );

  return (
    <PlantContext.Provider value={{ plants, loading, error, refresh, findByScientificName }}>
      {children}
    </PlantContext.Provider>
  );
};

export function usePlants() {
  const ctx = useContext(PlantContext);
  if (!ctx) throw new Error('usePlants must be used within PlantProvider');
  return ctx;
}
