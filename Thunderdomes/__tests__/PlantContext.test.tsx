import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { databases } from '../services/appwriteClient';
import { PlantProvider, usePlants } from '../contexts/PlantContext';
import { PlantRecord } from '../services/PlantService';

// Mock dependencies
jest.mock('../services/appwriteClient', () => ({
  databases: {
    listDocuments: jest.fn(),
  },
  appwriteConfig: {
    databaseId: 'test-db',
    collections: {
      plants: 'plants',
    },
  },
}));
jest.mock('../utils/plantData', () => ({
  fetchPlantsCsvText: jest.fn(),
  parsePlantsCsv: jest.fn(),
  filterPlants: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockDatabases = databases as jest.Mocked<typeof databases>;
const mockFetchCsv = require('../utils/plantData').fetchPlantsCsvText as jest.Mock;
const mockParseCsv = require('../utils/plantData').parsePlantsCsv as jest.Mock;
const mockFilterPlants = require('../utils/plantData').filterPlants as jest.Mock;

const TestComponent: React.FC<{ onPlants: (plants: PlantRecord[]) => void }> = ({ onPlants }) => {
  const { plants, loading, error } = usePlants();
  React.useEffect(() => {
    if (!loading) {
      onPlants(plants);
    }
  }, [plants, loading, onPlants]);
  return null;
};

describe('PlantContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides plants from network', async () => {
    const docs = [
      {
        $id: '1',
        common_name: 'Network Plant',
        scientific_name: 'Netus plantus',
      },
    ];
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockDatabases.listDocuments.mockResolvedValue({ documents: docs as any, total: docs.length });

    const onPlants = jest.fn();
    render(
      <PlantProvider>
        <TestComponent onPlants={onPlants} />
      </PlantProvider>
    );

    await waitFor(() => {
      expect(onPlants).toHaveBeenCalledWith([
        {
          'Common Name': 'Network Plant',
          'Scientific Name': 'Netus plantus',
          _id: '1',
        },
      ]);
    });
  });

  it('falls back to CSV on network error', async () => {
    const csvPlants: PlantRecord[] = [
      { 'Common Name': 'CSV Plant', 'Scientific Name': 'Csvus plantus' },
    ];
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockDatabases.listDocuments.mockRejectedValue(new Error('Network error'));
    mockFetchCsv.mockResolvedValue('csv text');
    mockParseCsv.mockReturnValue(csvPlants);
    mockFilterPlants.mockReturnValue(csvPlants);

    const onPlants = jest.fn();
    render(
      <PlantProvider>
        <TestComponent onPlants={onPlants} />
      </PlantProvider>
    );

    await waitFor(() => {
      expect(onPlants).toHaveBeenCalledWith(csvPlants);
    });
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent onPlants={jest.fn()} />)).toThrow(
      'usePlants must be used within PlantProvider'
    );
    consoleSpy.mockRestore();
  });

  it('findByScientificName works', async () => {
    const docs = [
      {
        $id: '1',
        common_name: 'Find Plant',
        scientific_name: 'Findus plantus',
      },
    ];
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockDatabases.listDocuments.mockResolvedValue({ documents: docs as any, total: docs.length });

    let contextValue: any;
    const TestFind: React.FC = () => {
      contextValue = usePlants();
      return null;
    };

    render(
      <PlantProvider>
        <TestFind />
      </PlantProvider>
    );

    await waitFor(() => {
      expect(contextValue.findByScientificName('Findus plantus')).toEqual({
        'Common Name': 'Find Plant',
        'Scientific Name': 'Findus plantus',
        _id: '1',
      });
    });
  });
});
