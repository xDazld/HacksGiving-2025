import { csvParse } from 'd3-dsv';

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

export async function fetchPlantsCsvText(): Promise<string> {
  // Prefer fetching from project root when running on web
  try {
    const res = await fetch('/Plants_Formatted.csv', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    // Fallback: try relative path when served under a subpath
    try {
      const res = await fetch('../Plants_Formatted.csv', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch {
      return '';
    }
  }
}

export function parsePlantsCsv(csvText: string): PlantRecord[] {
  if (!csvText.trim()) return [];
  // d3-dsv handles quotes, commas, newlines robustly
  const rows = csvParse(csvText) as unknown as PlantRecord[];
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
