import { OpenAIClient } from './OpenAIClient';
import { PlantRecord } from '../utils/plantData';

export class ScavengerHuntService {
  private client: OpenAIClient;
  private plants: PlantRecord[];

  constructor(client: OpenAIClient, plants: PlantRecord[]) {
    this.client = client;
    this.plants = plants;
  }

  /**
   * Starts a new round by selecting a plant that hasn't been found yet.
   * @param foundPlantIds List of IDs (Scientific Names) of plants already found by the user
   * @returns The selected Plant object or null if all plants found
   */
  startGame(foundPlantIds: string[]): PlantRecord | null {
    const foundSet = new Set(foundPlantIds);
    // Use Scientific Name as ID
    const availablePlants = this.plants.filter(
      p => !foundSet.has(p['Scientific Name'] || ''),
    );
    if (availablePlants.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * availablePlants.length);
    return availablePlants[randomIndex];
  }

  /**
   * Generates a creative description for the plant using AI.
   * @param plant The target plant
   * @param userAge Optional age of the user
   * @returns A string description
   */
  async getPlantDescription(
    plant: PlantRecord,
    userAge?: number,
  ): Promise<string> {
    const commonName = plant['Common Name'];
    const scientificName = plant['Scientific Name'];

    let audienceContext = 'a general audience';
    if (userAge) {
      if (userAge < 10) {
        audienceContext = `a ${userAge}-year-old child. Keep it simple and fun.`;
      } else if (userAge < 18) {
        audienceContext = `a teenager. Make it interesting and not too childish.`;
      } else {
        audienceContext = `an adult.`;
      }
    }

    const prompt = `You are a scavenger hunt guide in a botanical garden. 
    Describe the plant "${commonName}" (${scientificName}) to a player so they can find it. 
    Include details like its appearance, color, shape, and origin if known. 
    Do NOT explicitly state the name of the plant in the description, make it a bit of a riddle but solvable.
    Target Audience: ${audienceContext}
    Keep it under 50 words.`;

    const messages = [
      {
        role: 'system' as const,
        content: 'You are a helpful and creative botanical guide.',
      },
      { role: 'user' as const, content: prompt },
    ];

    return this.client.chatCompletion(messages);
  }

  /**
   * Generates a hint for the plant.
   * @param plant The target plant
   * @param userAge Optional age of the user
   * @returns A string hint
   */
  async getHint(
    plant: PlantRecord,
    userAge?: number,
    previousContent: string[] = [],
  ): Promise<string> {
    const commonName = plant['Common Name'];
    const scientificName = plant['Scientific Name'];

    let audienceContext = 'a general audience';
    if (userAge) {
      if (userAge < 10) {
        audienceContext = `a ${userAge}-year-old child.`;
      } else if (userAge < 18) {
        audienceContext = `a teenager.`;
      } else {
        audienceContext = `an adult.`;
      }
    }

    const historyContext =
      previousContent.length > 0
        ? `The user has already been told the following information, DO NOT REPEAT IT: "${previousContent.join(' ')}".`
        : '';

    const prompt = `Give a helpful hint for finding the plant "${commonName}" (${scientificName}). 
    Maybe mention its typical location in a dome or a distinctive feature. 
    Target Audience: ${audienceContext}
    ${historyContext}
    Keep it short and fun.`;

    const messages = [
      {
        role: 'system' as const,
        content: 'You are a helpful botanical guide.',
      },
      { role: 'user' as const, content: prompt },
    ];

    return this.client.chatCompletion(messages);
  }

  /**
   * Verifies if the user's photo matches the target plant using JSON mode for reliable parsing.
   * @param imageBase64 Base64 encoded image string
   * @param plant The target plant
   * @returns Object with isMatch boolean and feedback string
   */
  async verifyFind(
    imageBase64: string,
    plant: PlantRecord,
  ): Promise<{ isMatch: boolean; feedback: string }> {
    const commonName = plant['Common Name'];
    const scientificName = plant['Scientific Name'];

    const prompt = `You are a plant identification expert. Analyze this image and determine if it shows a "${commonName}" (${scientificName}).

IMPORTANT: You must respond with a valid JSON object in this exact format:
{
  "isMatch": true or false,
  "confidence": "high" | "medium" | "low",
  "feedback": "Brief explanation of why this is or isn't the correct plant"
}

Be specific in your feedback. If it's not the correct plant, explain what plant features you see and why they don't match.`;

    let response: string;

    try {
      response = await this.client.visionRequest(imageBase64, prompt, {
        type: 'json_object',
      });
      console.log('Raw vision API response:', response);
    } catch (networkError) {
      // Network error - couldn't reach the API
      console.error('Network error reaching vision API:', networkError);
      throw new Error(`Vision API unavailable: ${networkError}`);
    }

    // Parse the JSON response
    try {
      const parsed = JSON.parse(response);

      return {
        isMatch: parsed.isMatch,
        feedback: parsed.feedback || 'No feedback provided',
      };
    } catch (parseError) {
      // JSON parsing failed - should be rare with JSON mode
      console.warn('Failed to parse JSON from vision response:', parseError);
      console.warn('Response was:', response);

      return {
        isMatch: false,
        feedback: 'Error processing image verification result.',
      };
    }
  }
}
