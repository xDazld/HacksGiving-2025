import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePlantsCsv, findPlant, generatePlantStory } from '../utils/plantData';

type Args = {
  name?: string;
  common?: string;
  scientific?: string;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const v = argv[i + 1];
    if (a === '--name' && v) out.name = v;
    if (a === '--common' && v) out.common = v;
    if (a === '--scientific' && v) out.scientific = v;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const query = args.name || args.common || args.scientific;
  const csvPath = resolve(process.cwd(), '..', 'Plants_Formatted.csv');
  const csvText = readFileSync(csvPath, 'utf-8');
  const rows = parsePlantsCsv(csvText);

  const target =
    (query &&
      findPlant(rows, {
        commonName: args.common || args.name,
        scientificName: args.scientific || args.name,
      })) ||
    null;

  const toTest = target
    ? [target]
    : rows.filter((r) => {
        const cn = (r['Common Name'] || '').toLowerCase();
        return (
          cn.includes('silver vase') ||
          cn.includes('titan arum') ||
          cn.includes('queen') ||
          cn.includes('anthurium')
        );
      }).slice(0, 3);

  if (!toTest.length) {
    console.error('No matching plants found. Try passing --name "Aechmea fasciata"');
    process.exit(1);
  }

  for (const plant of toTest) {
    const story = generatePlantStory(plant);
    const header = `${plant['Common Name'] || 'Unknown'} (${plant['Scientific Name'] || 'N/A'})`;
    console.log('='.repeat(80));
    console.log(header);
    console.log('-'.repeat(80));
    console.log(story);
    console.log();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


