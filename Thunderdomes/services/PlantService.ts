import { databases, appwriteConfig } from './appwriteClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlantRecord as CsvPlantRecord } from '@/utils/plantData';

export type PlantDoc = {
  $id: string;
  common_name: string;
  scientific_name: string;
  quantity?: number;
  buy_new_wont_survive?: boolean;
  buy_new_readily_available?: boolean;
  move_by_staff?: boolean;
  move_requires_consult?: boolean;
  notes?: string;
  dome_location?: string;
  image_url?: string;
  $createdAt?: string;
  $updatedAt?: string;
  [key: string]: any;
};

export type PlantRecord = CsvPlantRecord & { _id?: string };

const STORAGE_KEY = 'plants-cache-v1';

function docToRecord(doc: PlantDoc): PlantRecord {
  return {
    'Common Name': doc.common_name,
    'Scientific Name': doc.scientific_name,
    Qty: doc.quantity?.toString() ?? undefined,
    Notes: doc.notes,
    _id: doc.$id,
    "Buy New & Won't Survive/Not Worth Moving": doc.buy_new_wont_survive ? 'x' : undefined,
    'Buy New & Readily Available': doc.buy_new_readily_available ? 'x' : undefined,
    'Move It & Can be done by Domes staff': doc.move_by_staff ? 'x' : undefined,
    'Move It & Requires consult - might not survive move': doc.move_requires_consult ? 'x' : undefined,
  };
}

export class PlantService {
  async list(forceNetwork = false): Promise<PlantRecord[]> {
    if (!forceNetwork) {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached) as PlantRecord[];
        } catch {
          // ignore parse errors
        }
      }
    }

    const { databaseId, collections } = appwriteConfig;
    const result = await databases.listDocuments(databaseId, collections.plants, []);
    const records = result.documents.map(docToRecord);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return records;
  }

  async get(id: string): Promise<PlantRecord | null> {
    const { databaseId, collections } = appwriteConfig;
    try {
      const doc = await databases.getDocument(databaseId, collections.plants, id);
      return docToRecord(doc as PlantDoc);
    } catch (e) {
      return null;
    }
  }
}

export const plantService = new PlantService();
