// import { Platform } from 'react-native'; // Removed for Node.js compatibility

// Default configuration based on user provided info and SSH tunnel
const DEFAULT_BASE_URL = 'http://127.0.0.1:8033/v1';
const DEFAULT_VISION_URL = 'http://127.0.0.1:8034/v1'; // Port 8034 for Vision API

export interface OpenAIConfig {
  baseUrl: string;
  visionUrl?: string;
  apiKey?: string;
  model: string;
  visionModel: string;
}

export const DEFAULT_CONFIG: OpenAIConfig = {
  baseUrl: DEFAULT_BASE_URL,
  visionUrl: DEFAULT_VISION_URL,
  apiKey: 'not_used',
  model: 'meta/llama-3.3-70b-instruct',
  visionModel: 'meta/llama-3.2-90b-vision-instruct',
};

export class OpenAIClient {
  private config: OpenAIConfig;

  constructor(config: Partial<OpenAIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async chatCompletion(messages: any[], maxTokens: number = 256): Promise<string> {
    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages,
          max_tokens: maxTokens,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Chat Completion Error:', error);
      throw error;
    }
  }

  async visionRequest(imageBase64: string, prompt: string): Promise<string> {
    try {
      const url = this.config.visionUrl || this.config.baseUrl;
      // Ensure we hit the chat/completions endpoint
      const endpoint = url.endsWith('/chat/completions') ? url : `${url}/chat/completions`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.visionModel,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 512,
          temperature: 1.0,
          top_p: 1.0,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vision API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Vision Request Error:', error);
      throw error;
    }
  }
}
