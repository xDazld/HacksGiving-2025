export interface Plant {
  id: string;
  commonName: string;
  scientificName: string;
  location?: string;
  description?: string; // Pre-computed or basic description
}

// Sample data based on typical conservatory plants and snippets seen
export const PLANTS: Plant[] = [
  {
    id: '1',
    commonName: 'Dollar Fern',
    scientificName: 'Adiantum peruvianum',
    location: 'Fern Room',
  },
  {
    id: '2',
    commonName: 'Crown of Thorns',
    scientificName: 'Euphorbia milii',
    location: 'Desert Dome',
  },
  {
    id: '3',
    commonName: 'Cabbage Head Agave',
    scientificName: 'Agave parryi',
    location: 'Desert Dome',
  },
  {
    id: '4',
    commonName: 'Corpse Flower',
    scientificName: 'Amorphophallus titanum',
    location: 'Tropical Dome',
  },
  {
    id: '5',
    commonName: 'Jade Plant',
    scientificName: 'Crassula ovata',
    location: 'Desert Dome',
  },
];
