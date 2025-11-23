import { OpenAIClient } from './OpenAIClient';

export interface Beverage {
  id: string;
  nameKey: string;
  image: any;
  descKey: string;
  name?: string; // Optional resolved name for prompt
}

export class DrinkStoryService {
  private client: OpenAIClient;

  constructor(client: OpenAIClient) {
    this.client = client;
  }

  /**
   * Generates an engaging story about the drink and its botanical origins.
   * @param drink The drink to generate a story for.
   * @param userAge Optional age of the user to tailor the content.
   * @param language Optional language code (e.g., 'en', 'es') to generate the story in that language.
   * @returns A promise that resolves to the generated story.
   */
  async generateStory(
    drink: Beverage,
    userAge?: number,
    language: string = 'en',
  ): Promise<string> {
    // We might need to pass the actual name if nameKey is just a key
    const drinkName = drink.name || 'Unknown Drink';

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

    let languageInstruction = '';
    switch (language) {
      case 'es':
        languageInstruction =
          '\n\nIMPORTANT: Write the entire story in Spanish (Español). Use natural, fluent Spanish appropriate for the target audience.';
        break;
      case 'zh':
        languageInstruction =
          '\n\nIMPORTANT: Write the entire story in Chinese (中文). Use natural, fluent Simplified Chinese appropriate for the target audience.';
        break;
      case 'hi':
        languageInstruction =
          '\n\nIMPORTANT: Write the entire story in Hindi (हिन्दी). Use natural, fluent Hindi appropriate for the target audience.';
        break;
      case 'ar':
        languageInstruction =
          '\n\nIMPORTANT: Write the entire story in Arabic (العربية). Use natural, fluent Arabic appropriate for the target audience.';
        break;
      case 'fr':
        languageInstruction =
          '\n\nIMPORTANT: Write the entire story in French (Français). Use natural, fluent French appropriate for the target audience.';
        break;
      case 'de':
        languageInstruction =
          '\n\nIMPORTANT: Write the entire story in German (Deutsch). Use natural, fluent German appropriate for the target audience.';
        break;
      case 'ja':
        languageInstruction =
          '\n\nIMPORTANT: Write the entire story in Japanese (日本語). Use natural, fluent Japanese appropriate for the target audience.';
        break;
      case 'pt':
        languageInstruction =
          '\n\nIMPORTANT: Write the entire story in Portuguese (Português). Use natural, fluent Portuguese appropriate for the target audience.';
        break;
      case 'ru':
        languageInstruction =
          '\n\nIMPORTANT: Write the entire story in Russian (Русский). Use natural, fluent Russian appropriate for the target audience.';
        break;
      case 'en':
      default:
        // English is default, no additional instruction needed
        languageInstruction = '';
        break;
    }

    const prompt = `You are a knowledgeable botanist and mixologist.
    Write an engaging story about the drink "${drinkName}" and its relationship to botany.
    
    Target Audience: Write for ${audienceContext}.

    The story should:
    1. Focus on the plants used to create this drink (e.g., agave for tequila/margarita, grapes for wine, barley/hops for beer, fruits/herbs for cocktails).
    2. Explain the botanical origins of the key ingredients.
    3. Connect the drink to the history of how humans have used these plants.
    4. Be educational but captivating.
    
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
