/**
 * Speech Service for Voice Chat
 * Handles STT (Speech to Text) and TTS (Text to Speech)
 */

export class SpeechService {
  private recognition: any;
  private synthesis: SpeechSynthesis;
  private isSpeaking: boolean = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
    
    // Initialize Web Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
    }
  }

  public speak(text: string, lang: string = 'ar-SA', onEnd?: () => void) {
    // Cancel previous speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.1; // Slightly higher pitch for robot feel

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.synthesis.speak(utterance);
  }

  public stopSpeaking() {
    this.synthesis.cancel();
    this.isSpeaking = false;
  }

  public listen(lang: string = 'ar-SA'): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject('Speech Recognition not supported');
        return;
      }

      this.recognition.lang = lang;
      this.recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        resolve(text);
      };

      this.recognition.onerror = (event: any) => {
        reject(event.error);
      };

      this.recognition.start();
    });
  }

  public stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

export const speechService = new SpeechService();
