import { csvParse } from 'd3-dsv';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export type PlantRecord = {
  'Common Name'?: string;
  'Scientific Name'?: string;
  Qty?: string;
  "Buy New & Won't Survive/Not Worth Moving"?: string;
  'Buy New & Readily Available'?: string;
  'Move It & Can be done by Domes staff'?: string;
  'Move It & Requires consult - might not survive move'?: string;
  Notes?: string;
  // Allow additional unknown columns without failing typings
  [key: string]: string | undefined;
};

// Import the CSV as an asset module
const CSV_MODULE = require('../public/Plants_Formatted.csv');

export async function fetchPlantsCsvText(): Promise<string> {
  console.log('🌱 fetchPlantsCsvText called');
  
  // On native, CSV_MODULE is a number (asset ID), so we need to use expo-asset to load it
  if (Platform.OS !== 'web' && typeof CSV_MODULE === 'number') {
    try {
      console.log('📱 Native platform detected, loading asset:', CSV_MODULE);
      const asset = Asset.fromModule(CSV_MODULE);
      await asset.downloadAsync();
      
      const uri = asset.localUri || asset.uri;
      console.log('Asset URI:', uri);
      
      if (!uri) {
        throw new Error('Asset URI is null or undefined');
      }
      
      // Use the new FileSystem API with File class and specify UTF-8 encoding
      const file = new FileSystem.File(uri);
      const arrayBuffer = await file.arrayBuffer();
      const text = new TextDecoder('utf-8').decode(arrayBuffer);
      console.log('✅ Loaded CSV from asset using new FileSystem API, length:', text.length);
      
      if (!text || text.length === 0) {
        throw new Error('Fetched text is empty');
      }
      
      return text;
    } catch (error) {
      console.error('❌ Failed to load bundled CSV asset:', error);
    }
  }
  
  // For web or fallback, try fetching from public directory
  console.log('🌐 Attempting web fetch');
  try {
    const res = await fetch('/Plants_Formatted.csv', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    console.log('✅ Loaded from /Plants_Formatted.csv, length:', text.length);
    return text;
  } catch (err) {
    console.log('⚠️ Failed /Plants_Formatted.csv:', err);
    try {
      const res = await fetch('../Plants_Formatted.csv', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      console.log('✅ Loaded from ../Plants_Formatted.csv, length:', text.length);
      return text;
    } catch (err2) {
      console.error('❌ All methods failed to load CSV');
      return '';
    }
  }
}

export function parsePlantsCsv(csvText: string | null | undefined): PlantRecord[] {
  console.log('parsePlantsCsv called, input length:', csvText?.length || 0);
  if (!csvText || !csvText.trim()) {
    console.log('❌ CSV text is empty or null');
    return [];
  }
  // d3-dsv handles quotes, commas, newlines robustly
  const rows = csvParse(csvText) as unknown as PlantRecord[];
  console.log('✅ Parsed', rows.length, 'plant records');
  return rows;
}

function normalize(s: string | undefined): string {
  return (s || '').trim().toLowerCase();
}

export function findPlant(
  records: PlantRecord[],
  opts: { commonName?: string; scientificName?: string },
): PlantRecord | undefined {
  const byCommon = normalize(opts.commonName);
  const bySci = normalize(opts.scientificName);
  if (!byCommon && !bySci) return undefined;

  return records.find(r => {
    const common = normalize(r['Common Name']);
    const sci = normalize(r['Scientific Name']);
    return (
      (byCommon && common.includes(byCommon)) || (bySci && sci.includes(bySci))
    );
  });
}

export function pickRandomPlant(
  records: PlantRecord[],
): PlantRecord | undefined {
  const candidates = records.filter(
    r => r['Common Name'] || r['Scientific Name'],
  );
  if (!candidates.length) return undefined;
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}

export function getSamplePlant(): PlantRecord {
  return {
    'Common Name': 'Silver Vase Plant',
    'Scientific Name': 'Aechmea fasciata',
    Qty: '3',
    'Buy New & Readily Available': 'x',
    'Move It & Can be done by Domes staff': 'x',
    Notes: 'easily transplanted',
  };
}

export function filterPlants(records: PlantRecord[]): PlantRecord[] {
  return records
    .map(record => ({
      'Common Name': record['Common Name'],
      'Scientific Name': record['Scientific Name'],
      Qty: record['Qty'],
      Notes: record['Notes'],
      // Keep internal ID if we generate one, or rely on index/names
    }))
    .filter(r => r['Common Name'] && r['Scientific Name']);
}
