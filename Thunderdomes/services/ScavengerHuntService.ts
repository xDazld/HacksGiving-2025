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
   * Verifies if the user's photo matches the target plant using JSON mode for reliable parsing.
   * @param imageBase64 Base64 encoded image string
   * @param plant The target plant
   * @returns Object with isMatch boolean and feedback string
   */
  async verifyFind(imageBase64: string, plant: Plant): Promise<{ isMatch: boolean; feedback: string }> {
    const prompt = `You are a plant identification expert. Analyze this image and determine if it shows a "${plant.commonName}" (${plant.scientificName}).

IMPORTANT: You must respond with a valid JSON object in this exact format:
{
  "isMatch": true or false,
  "confidence": "high" | "medium" | "low",
  "feedback": "Brief explanation of why this is or isn't the correct plant"
}

Be specific in your feedback. If it's not the correct plant, explain what plant features you see and why they don't match.`;

    let response: string;
    
    try {
      response = await this.client.visionRequest(imageBase64, prompt);
      console.log('Raw vision API response:', response);
    } catch (networkError) {
      // Network error - couldn't reach the API
      console.error('Network error reaching vision API:', networkError);
      throw new Error(`Vision API unavailable: ${networkError}`);
    }

    // Try to parse the JSON response
    try {
      // Clean up markdown code blocks if present
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      // Validate the schema
      if (typeof parsed.isMatch !== 'boolean') {
        console.warn('Response missing valid isMatch field, attempting to infer from text');
        // Try to infer from the response text
        const inferredMatch = response.toLowerCase().includes('true') || 
                             response.toLowerCase().includes('"ismatch": true');
        return {
          isMatch: inferredMatch,
          feedback: parsed.feedback || response
        };
      }
      
      return {
        isMatch: parsed.isMatch,
        feedback: parsed.feedback || response
      };
    } catch (parseError) {
      // JSON parsing failed - model didn't return valid JSON
      console.warn('Failed to parse JSON from vision response:', parseError);
      console.warn('Response was:', response);
      
      // Attempt to extract boolean from text response
      const lowerResponse = response.toLowerCase();
      let isMatch = false;
      
      if (lowerResponse.includes('"ismatch": true') || lowerResponse.includes('"ismatch":true')) {
        isMatch = true;
      } else if (lowerResponse.includes('yes') || lowerResponse.includes('correct') || lowerResponse.includes('matches')) {
        isMatch = true;
      }
      
      return {
        isMatch,
        feedback: `Model returned non-JSON response: ${response.substring(0, 200)}...`
      };
    }
  }
}
