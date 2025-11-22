import OpenAI from 'openai';

// Default configuration for GitHub Models
const DEFAULT_BASE_URL = "https://models.github.ai/inference";
const DEFAULT_MODEL = "gpt-4o-mini"; 

export interface OpenAIConfig {
  baseUrl: string;
  apiKey?: string;
  model: string;
}

export const DEFAULT_CONFIG: OpenAIConfig = {
  baseUrl: DEFAULT_BASE_URL,
  apiKey: process.env.GITHUB_TOKEN, // Will be loaded from .env in Node context
  model: DEFAULT_MODEL,
};

export class OpenAIClient {
  private client: OpenAI;
  private config: OpenAIConfig;

  constructor(config: Partial<OpenAIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (!this.config.apiKey) {
      console.warn("No API key provided for OpenAIClient. Ensure GITHUB_TOKEN is set.");
    }

    this.client = new OpenAI({
      baseURL: this.config.baseUrl,
      apiKey: this.config.apiKey || "dummy-key", // SDK requires a key, even if invalid
      dangerouslyAllowBrowser: true // Required for React Native if not using a proxy
    });
  }

  async chatCompletion(
    messages: any[], 
    maxTokens: number = 256,
    responseFormat?: { type: 'json_object' | 'text' }
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages,
        max_tokens: maxTokens,
        response_format: responseFormat,
        temperature: 1.0,
      });

      return response.choices[0].message.content || "";
    } catch (error) {
      console.error('Chat Completion Error:', error);
      throw error;
    }
  }

  async visionRequest(imageBase64: string, prompt: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model, // GPT-4o supports vision
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 512,
        temperature: 1.0,
      });

      return response.choices[0].message.content || "";
    } catch (error) {
      console.error('Vision Request Error:', error);
      throw error;
    }
  }
}
