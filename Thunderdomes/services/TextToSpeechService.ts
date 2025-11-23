import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export class TextToSpeechService {
  private sound: Audio.Sound | null = null;
  private currentPosition: number = 0;
  private duration: number = 0;
  private isCurrentlyPlaying: boolean = false;
  private currentAudioUri: string | null = null;
  private isPreloading: boolean = false;
  private preloadAbortController: AbortController | null = null;

  /**
   * Preload audio for the given text without playing it
   * This generates the audio file in the background
   */
  async preloadAudio(text: string): Promise<void> {
    try {
      if (this.isPreloading || this.sound) {
        console.log('⚠️ Audio already preloading or loaded');
        return;
      }

      console.log('🔄 Preloading audio...');
      this.isPreloading = true;
      this.preloadAbortController = new AbortController();

      // Configure audio mode for playback via speakers
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Generate audio from OpenAI TTS
      const audioUri = await this.generateSpeech(text, this.preloadAbortController.signal);
      
      if (!audioUri) {
        // Aborted
        this.isPreloading = false;
        return;
      }

      this.currentAudioUri = audioUri;

      // Load the audio but don't play it yet
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false, progressUpdateIntervalMillis: 100 },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      if ('durationMillis' in status && status.durationMillis) {
        this.duration = status.durationMillis;
      }

      console.log('✅ Audio preloaded and ready');
      this.isPreloading = false;
    } catch (error) {
      console.error('❌ Preload Error:', error);
      this.isPreloading = false;
      throw error;
    }
  }

  /**
   * Speak the given text using OpenAI TTS
   * If already preloaded, just starts playing
   */
  async speak(text: string): Promise<void> {
    try {
      // If we have a sound loaded, just play/resume it
      if (this.sound && !this.isCurrentlyPlaying) {
        await this.sound.playAsync();
        this.isCurrentlyPlaying = true;
        return;
      }

      // If already playing, do nothing
      if (this.isCurrentlyPlaying) {
        return;
      }

      // If not preloaded, generate and play immediately
      await this.preloadAudio(text);
      if (this.sound) {
        await this.sound.playAsync();
        this.isCurrentlyPlaying = true;
      }
    } catch (error) {
      console.error('❌ TTS Error:', error);
      throw error;
    }
  }

  /**
   * Pause the current playback
   */
  async pause(): Promise<void> {
    if (!this.sound || !this.isCurrentlyPlaying) {
      return;
    }

    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && 'positionMillis' in status) {
        this.currentPosition = status.positionMillis;
      }

      await this.sound.pauseAsync();
      this.isCurrentlyPlaying = false;
    } catch (error) {
      console.error('❌ Pause Error:', error);
      throw error;
    }
  }

  /**
   * Resume playback from where it was paused
   */
  async resume(): Promise<void> {
    if (!this.sound || this.isCurrentlyPlaying) {
      return;
    }

    try {
      await this.sound.playAsync();
      this.isCurrentlyPlaying = true;
    } catch (error) {
      console.error('❌ Resume Error:', error);
      throw error;
    }
  }

  /**
   * Stop and unload the current audio
   */
  async stop(): Promise<void> {
    // Cancel any ongoing preload
    if (this.preloadAbortController) {
      this.preloadAbortController.abort();
      this.preloadAbortController = null;
    }

    if (!this.sound) {
      // Still clean up audio file if it exists
      await this.deleteAudioFile();
      return;
    }

    try {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
      this.isCurrentlyPlaying = false;
      this.isPreloading = false;
      this.currentPosition = 0;
      this.duration = 0;

      // Delete the audio file to free up storage
      await this.deleteAudioFile();
    } catch (error) {
      console.error('❌ Stop Error:', error);
    }
  }

  /**
   * Cancel ongoing preload operation
   */
  cancelPreload(): void {
    if (this.preloadAbortController) {
      console.log('🚫 Cancelling audio preload');
      this.preloadAbortController.abort();
      this.preloadAbortController = null;
      this.isPreloading = false;
    }
  }

  /**
   * Check if currently playing
   */
  isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }

  /**
   * Get current playback position and duration
   */
  getProgress(): { position: number; duration: number } {
    return {
      position: this.currentPosition,
      duration: this.duration,
    };
  }

  /**
   * Generate speech audio from text using OpenAI TTS
   */
  private async generateSpeech(text: string, signal?: AbortSignal): Promise<string | null> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API Key is missing');
    }

    try {
      console.log('🎤 Generating speech with OpenAI TTS...');

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: 'alloy',
          input: text,
        }),
        signal,
      });

      // Check if aborted
      if (signal?.aborted) {
        console.log('🚫 TTS generation aborted');
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI TTS failed: ${response.status} - ${errorText}`);
      }

      // Get the audio data as base64
      const audioBlob = await response.blob();
      const reader = new FileReader();

      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          // Extract base64 data from data URL
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Check if aborted before writing file
      if (signal?.aborted) {
        console.log('🚫 TTS generation aborted before file write');
        return null;
      }

      // Save to temporary file
      const filename = `${FileSystem.documentDirectory}tts_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(filename, base64Audio, {
        encoding: 'base64',
      });

      this.currentAudioUri = filename;
      console.log('✅ Speech generated:', filename);
      return filename;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🚫 TTS generation aborted');
        return null;
      }
      console.error('❌ TTS Generation Error:', error);
      throw error;
    }
  }

  /**
   * Delete the current audio file if it exists
   */
  private async deleteAudioFile(): Promise<void> {
    if (!this.currentAudioUri) {
      return;
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(this.currentAudioUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(this.currentAudioUri);
        console.log('🗑️ Deleted audio file:', this.currentAudioUri);
      }
      this.currentAudioUri = null;
    } catch (error) {
      console.error('❌ Error deleting audio file:', error);
    }
  }

  /**
   * Callback for playback status updates
   */
  private onPlaybackStatusUpdate(status: any): void {
    if (status.isLoaded) {
      if ('positionMillis' in status) {
        this.currentPosition = status.positionMillis;
      }
      if ('durationMillis' in status && status.durationMillis) {
        this.duration = status.durationMillis;
      }
      if (status.didJustFinish) {
        this.isCurrentlyPlaying = false;
        this.currentPosition = 0;
      }
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.stop();
  }
}

