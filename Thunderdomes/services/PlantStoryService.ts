import { OpenAIClient } from './OpenAIClient';
import { PlantRecord } from '../utils/plantData';

export class PlantStoryService {
  private client: OpenAIClient;

  constructor(client: OpenAIClient) {
    this.client = client;
  }

  /**
   * Generates an engaging story about the plant, tailored to the user's age.
   * @param plant The plant to generate a story for.
   * @param userAge Optional age of the user to tailor the content.
   * @param language Optional language code (e.g., 'en', 'es') to generate the story in that language.
   * @returns A promise that resolves to the generated story.
   */
  async generateStory(plant: PlantRecord, userAge?: number, language: string = 'en'): Promise<string> {
    const commonName = plant['Common Name'] || 'Unknown Plant';
    const scientificName =
      plant['Scientific Name'] || 'Unknown Scientific Name';
    const notes = plant['Notes'] || '';

    let audienceContext = 'a general audience';
    if (userAge) {
      if (userAge < 10) {
        audienceContext = `a ${userAge}-year-old child. Keep it simple, fun, and magical.`;
      } else if (userAge < 18) {
        audienceContext = `a teenager. Make it interesting, relatable, and not too childish.`;
      } else {
        audienceContext = `an adult. Make it informative, engaging, and sophisticated.`;
      }
    }

    const languageInstruction = language === 'es' 
      ? '\n\nIMPORTANT: Write the entire story in Spanish (Español). Use natural, fluent Spanish appropriate for the target audience.'
      : '';

    const prompt = `You are a storyteller at a botanical garden.
    Write an engaging story related to the plant "${commonName}" (${scientificName}).
    
    Context from curator: "${notes}"

    Target Audience: Write for ${audienceContext}.

    The story should:
    1. Be educational but captivating.
    2. Highlight unique features or history of the plant.
    3. Connect the plant to the wider ecosystem or human culture.
    4. Cover the place of origin, how it was used, and how it is used today.
    
    Do not start with "Once upon a time".${languageInstruction}`;

    const messages = [
      {
        role: 'system' as const,
        content: 'You are a creative and knowledgeable botanical storyteller.',
      },
      { role: 'user' as const, content: prompt },
    ];

    return this.client.chatCompletion(messages);
  }
}
