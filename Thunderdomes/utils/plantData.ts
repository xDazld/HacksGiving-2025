import { csvParse } from 'd3-dsv';

export type PlantRecord = {
  'Common Name'?: string;
  'Scientific Name'?: string;
  'Qty'?: string;
  "Buy New & Won't Survive/Not Worth Moving"?: string;
  'Buy New & Readily Available'?: string;
  'Move It & Can be done by Domes staff'?: string;
  'Move It & Requires consult - might not survive move'?: string;
  'Notes'?: string;
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
  opts: { commonName?: string; scientificName?: string }
): PlantRecord | undefined {
  const byCommon = normalize(opts.commonName);
  const bySci = normalize(opts.scientificName);
  if (!byCommon && !bySci) return undefined;

  return records.find((r) => {
    const common = normalize(r['Common Name']);
    const sci = normalize(r['Scientific Name']);
    return (byCommon && common.includes(byCommon)) || (bySci && sci.includes(bySci));
  });
}

export function pickRandomPlant(records: PlantRecord[]): PlantRecord | undefined {
  const candidates = records.filter((r) => (r['Common Name'] || r['Scientific Name']));
  if (!candidates.length) return undefined;
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}

export function getSamplePlant(): PlantRecord {
  return {
    'Common Name': 'Silver Vase Plant',
    'Scientific Name': 'Aechmea fasciata',
    'Qty': '3',
    'Buy New & Readily Available': 'x',
    'Move It & Can be done by Domes staff': 'x',
    'Notes': 'easily transplanted',
  };
}

export function generatePlantStory(plant: PlantRecord): string {
  const common = plant['Common Name'] || 'Unknown Plant';
  const scientific = plant['Scientific Name'] || 'Unknown scientific name';
  const qty = plant['Qty'] ? Number(plant['Qty']) : undefined;

  const flags: string[] = [];
  if (plant["Buy New & Won't Survive/Not Worth Moving"]?.toLowerCase() === 'x') {
    flags.push(
      'it may be better to replace this specimen rather than risk relocating it'
    );
  }
  if (plant['Buy New & Readily Available']?.toLowerCase() === 'x') {
    flags.push('this species is readily available to purchase if needed');
  }
  if (plant['Move It & Can be done by Domes staff']?.toLowerCase() === 'x') {
    flags.push('moving can be handled by Domes staff');
  }
  if (
    plant['Move It & Requires consult - might not survive move']?.toLowerCase() === 'x'
  ) {
    flags.push('moving requires expert consultation and carries survival risk');
  }

  const notes = (plant['Notes'] || '').trim();

  const opening = `Welcome to your tour stop: the ${common}${scientific ? ` (${scientific})` : ''}.`;
  const mood = `Take a moment to notice its character — ${common.toLowerCase().includes('fern') ? 'delicate fronds unfurl like scrolls' : 'forms and textures shaped by its native habitat'}.`;
  const countLine =
    typeof qty === 'number' && !Number.isNaN(qty)
      ? qty === 1
        ? 'Here at the Domes, a single specimen stands as an ambassador for its species.'
        : `Here at the Domes, ${qty} specimens help showcase the diversity within this species.`
      : '';

  const care =
    flags.length
      ? `Behind the scenes, our horticulture team notes: ${flags.join('; ')}.`
      : '';

  const noteLine = notes ? `Curator note: ${notes}.` : '';

  const habitatHint = scientific.toLowerCase().includes('aechmea') || common.toLowerCase().includes('bromeliad')
    ? 'As a bromeliad relative, it often gathers water at its center — a tiny reservoir that can host insects and even small ecosystems.'
    : scientific.toLowerCase().includes('anthurium')
      ? 'Heart-shaped leaves and dramatic spadices make many Anthurium species favorites for both collectors and pollinators.'
      : '';

  const closing = 'As you continue your journey, consider how plants like this connect ecosystems across continents — and how their care here helps preserve living stories from around the world.';

  const parts = [opening, mood, countLine, habitatHint, care, noteLine, closing].filter(Boolean);
  return parts.join(' ');
}


