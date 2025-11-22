import { OpenAIClient } from './OpenAIClient';
import { Plant, PLANTS } from '../data/plants';

export class ScavengerHuntService {
  private client: OpenAIClient;
  private plants: Plant[];

  constructor(client: OpenAIClient, plants: Plant[] = PLANTS) {
    this.client = client;
    this.plants = plants;
  }

  /**
   * Starts a new round by selecting a plant that hasn't been found yet.
   * @param foundPlantIds List of IDs of plants already found by the user
   * @returns The selected Plant object or null if all plants found
   */
  startGame(foundPlantIds: string[]): Plant | null {
    const availablePlants = this.plants.filter(p => !foundPlantIds.includes(p.id));
    if (availablePlants.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * availablePlants.length);
    return availablePlants[randomIndex];
  }

  /**
   * Generates a creative description for the plant using AI.
   * @param plant The target plant
   * @returns A string description
   */
  async getPlantDescription(plant: Plant): Promise<string> {
    const prompt = `You are a scavenger hunt guide in a botanical garden. 
    Describe the plant "${plant.commonName}" (${plant.scientificName}) to a player so they can find it. 
    Include details like its appearance, color, shape, and origin if known. 
    Do NOT explicitly state the name of the plant in the description, make it a bit of a riddle but solvable.
    Keep it under 50 words.`;

    const messages = [
      { role: 'system', content: 'You are a helpful and creative botanical guide.' },
      { role: 'user', content: prompt }
    ];

    return this.client.chatCompletion(messages);
  }

  /**
   * Generates a hint for the plant.
   * @param plant The target plant
   * @returns A string hint
   */
  async getHint(plant: Plant): Promise<string> {
    const prompt = `Give a helpful hint for finding the plant "${plant.commonName}" (${plant.scientificName}). 
    Maybe mention its typical location in a dome (Desert, Tropical, etc.) or a distinctive feature. 
    Keep it short and fun.`;

    const messages = [
      { role: 'system', content: 'You are a helpful botanical guide.' },
      { role: 'user', content: prompt }
    ];

    return this.client.chatCompletion(messages);
  }

  /**
   * Verifies if the user's photo matches the target plant.
   * @param imageBase64 Base64 encoded image string
   * @param plant The target plant
   * @returns True if it's a match, False otherwise
   */
  async verifyFind(imageBase64: string, plant: Plant): Promise<{ isMatch: boolean; feedback: string }> {
    const prompt = `Does this image show a "${plant.commonName}" (${plant.scientificName})? 
    Answer with YES or NO first, then give a brief explanation. 
    If it's not the right plant, explain why (e.g., "This looks like a cactus, but we are looking for a fern").`;

    const response = await this.client.visionRequest(imageBase64, prompt);
    
    const isMatch = response.trim().toUpperCase().startsWith('YES');
    
    return {
      isMatch,
      feedback: response
    };
  }
}
