import AsyncStorage from '@react-native-async-storage/async-storage';
import { databases } from '../services/appwriteClient';
import { PlantService, PlantRecord } from '../services/PlantService';

// Mock dependencies
jest.mock('../services/appwriteClient', () => ({
  databases: {
    listDocuments: jest.fn(),
    getDocument: jest.fn(),
  },
  appwriteConfig: {
    databaseId: 'test-db',
    collections: {
      plants: 'plants',
    },
  },
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockDatabases = databases as jest.Mocked<typeof databases>;

describe('PlantService', () => {
  let service: PlantService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlantService();
  });

  describe('list', () => {
    it('returns cached data if available and not forced', async () => {
      const cachedPlants: PlantRecord[] = [
        { 'Common Name': 'Test Plant', 'Scientific Name': 'Testus plantus' },
      ];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cachedPlants));

      const result = await service.list();

      expect(result).toEqual(cachedPlants);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('plants-cache-v1');
      expect(mockDatabases.listDocuments).not.toHaveBeenCalled();
    });

    it('fetches from network if no cache and returns data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      const docs = [
        {
          $id: '1',
          common_name: 'Network Plant',
          scientific_name: 'Netus plantus',
          quantity: 5,
          notes: 'From network',
        },
      ];
      mockDatabases.listDocuments.mockResolvedValue({ documents: docs as any, total: docs.length });

      const result = await service.list();

      expect(result).toEqual([
        {
          'Common Name': 'Network Plant',
          'Scientific Name': 'Netus plantus',
          Qty: '5',
          Notes: 'From network',
          _id: '1',
        },
      ]);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'plants-cache-v1',
        JSON.stringify(result)
      );
    });

    it('forces network fetch when force=true', async () => {
      const cachedPlants: PlantRecord[] = [
        { 'Common Name': 'Cached Plant', 'Scientific Name': 'Cacheus plantus' },
      ];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cachedPlants));
      const docs = [
        {
          $id: '2',
          common_name: 'Forced Plant',
          scientific_name: 'Forceus plantus',
        },
      ];
      mockDatabases.listDocuments.mockResolvedValue({ documents: docs as any, total: docs.length });

      const result = await service.list(true);

      expect(result).toEqual([
        {
          'Common Name': 'Forced Plant',
          'Scientific Name': 'Forceus plantus',
          _id: '2',
        },
      ]);
      expect(mockDatabases.listDocuments).toHaveBeenCalled();
    });

    it('throws on network error', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockDatabases.listDocuments.mockRejectedValue(new Error('Network error'));

      await expect(service.list()).rejects.toThrow('Network error');
    });
  });

  describe('get', () => {
    it('returns plant record for valid id', async () => {
      const doc = {
        $id: '1',
        common_name: 'Get Plant',
        scientific_name: 'Getus plantus',
      };
      mockDatabases.getDocument.mockResolvedValue(doc as any);

      const result = await service.get('1');

      expect(result).toEqual({
        'Common Name': 'Get Plant',
        'Scientific Name': 'Getus plantus',
        _id: '1',
      });
    });

    it('returns null for invalid id', async () => {
      mockDatabases.getDocument.mockRejectedValue(new Error('Not found'));

      const result = await service.get('invalid');

      expect(result).toBeNull();
    });
  });
});