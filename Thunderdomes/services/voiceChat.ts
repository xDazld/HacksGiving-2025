import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

// Use API key from environment variables
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

interface ChatResponse {
  audioData: string; // Base64 audio
  text: string;
}

export class VoiceChatService {
  
  /**
   * Complete voice chat pipeline using ONLY OpenAI:
   * 1. Transcribe audio with Whisper
   * 2. Get response from GPT-4o-mini (fast and smart)
   * 3. Generate speech with OpenAI TTS
   */
  static async chatWithAudio(audioUri: string): Promise<ChatResponse> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API Key is missing. Please check your .env file.');
    }

    try {
      // Step 1: Transcribe audio with OpenAI Whisper
      console.log('🎤 Transcribing with Whisper...');
      const transcription = await this.transcribeAudio(audioUri);
      console.log('📝 You said:', transcription);

      // Step 2: Get response from GPT
      console.log('🤖 Getting response from GPT...');
      const responseText = await this.getChatResponse(transcription);
      console.log('💬 Response:', responseText.substring(0, 100) + '...');

      // Step 3: Generate speech with OpenAI TTS
      console.log('🔊 Generating speech...');
      const audioData = await this.textToSpeech(responseText);
      console.log('✅ Ready to play!');

      return { text: responseText, audioData };

    } catch (error) {
      console.error('❌ Chat Error:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   */
  private static async transcribeAudio(audioUri: string): Promise<string> {
    try {
      const formData = new FormData();
      
      const audioInfo = await FileSystem.getInfoAsync(audioUri);
      if (!audioInfo.exists) {
        throw new Error('Audio file does not exist');
      }

      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any);
      formData.append('model', 'whisper-1');
      // Don't specify language - let Whisper auto-detect for multilingual support

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Whisper API Error:', errorText);
        throw new Error(`Whisper API Error: ${response.status}`);
      }

      const result = await response.json();
      return result.text || "I didn't catch that. Could you try again?";

    } catch (error) {
      console.error('Transcription Error:', error);
      throw error;
    }
  }

  /**
   * Get conversational response from OpenAI GPT-4o-mini
   */
  private static async getChatResponse(userMessage: string): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a friendly, knowledgeable botanical guide at the Milwaukee Domes. 
You're having a conversation with a visitor. Keep responses concise (2-3 sentences max), 
helpful, and engaging. If asked about plants, share interesting facts. Be warm and conversational.
Focus on making the visitor feel welcome and excited about plants and nature.

IMPORTANT: Always respond in the SAME LANGUAGE the visitor uses. If they speak Spanish, respond in Spanish. 
If they speak English, respond in English. Match their language naturally and fluently.`
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GPT API Error:', errorText);
        throw new Error(`GPT API Error: ${response.status}`);
      }

      const result = await response.json();
      const message = result.choices?.[0]?.message?.content;
      
      if (!message) {
        return "I'm having trouble responding right now. Could you ask that again?";
      }

      return message.trim();

    } catch (error) {
      console.error('GPT Error:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech using OpenAI TTS API
   */
  private static async textToSpeech(text: string): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: 'nova',
          input: text,
          speed: 1.0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TTS API Error:', errorText);
        throw new Error(`TTS API Error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Audio = base64.split(',')[1] || base64;
          resolve(base64Audio);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

    } catch (error) {
      console.error('TTS Error:', error);
      throw error;
    }
  }
}
