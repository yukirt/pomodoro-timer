import { SoundType, SoundOptions } from './types';

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<SoundType, AudioBuffer> = new Map();
  private volume: number = 0.7;
  private enabled: boolean = true;

  constructor() {
    this.initializeAudioContext();
    this.loadDefaultSounds();
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private async loadDefaultSounds(): Promise<void> {
    // Define default sound data (simple beep tones)
    const soundDefinitions: Record<SoundType, { frequency: number; duration: number }> = {
      'work-complete': { frequency: 800, duration: 0.5 },
      'break-complete': { frequency: 600, duration: 0.3 },
      'tick': { frequency: 1000, duration: 0.1 },
      'alert': { frequency: 900, duration: 0.8 }
    };

    for (const [soundType, config] of Object.entries(soundDefinitions)) {
      try {
        const buffer = await this.generateTone(config.frequency, config.duration);
        this.sounds.set(soundType as SoundType, buffer);
      } catch (error) {
        console.warn(`Failed to generate sound for ${soundType}:`, error);
      }
    }
  }

  private async generateTone(frequency: number, duration: number): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    const sampleRate = this.audioContext.sampleRate;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Generate a simple sine wave with fade in/out
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let amplitude = Math.sin(2 * Math.PI * frequency * t);
      
      // Apply fade in/out to avoid clicks
      const fadeTime = 0.05; // 50ms fade
      if (t < fadeTime) {
        amplitude *= t / fadeTime;
      } else if (t > duration - fadeTime) {
        amplitude *= (duration - t) / fadeTime;
      }
      
      channelData[i] = amplitude * 0.3; // Reduce volume to avoid harsh sounds
    }

    return buffer;
  }

  async playSound(soundType: SoundType, options?: SoundOptions): Promise<void> {
    if (!this.enabled || !this.audioContext || !this.sounds.has(soundType)) {
      return;
    }

    try {
      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const buffer = this.sounds.get(soundType)!;
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Set volume
      const volume = options?.volume ?? this.volume;
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

      // Set loop if specified
      if (options?.loop) {
        source.loop = true;
      }

      source.start();

      // If not looping, clean up after the sound finishes
      if (!options?.loop) {
        source.stop(this.audioContext.currentTime + buffer.duration);
      }

      return new Promise((resolve) => {
        source.onended = () => resolve();
      });
    } catch (error) {
      console.warn(`Failed to play sound ${soundType}:`, error);
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.volume;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getAvailableSounds(): SoundType[] {
    return Array.from(this.sounds.keys());
  }

  async loadCustomSound(soundType: SoundType, audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    try {
      const buffer = await this.audioContext.decodeAudioData(audioData);
      this.sounds.set(soundType, buffer);
    } catch (error) {
      throw new Error(`Failed to load custom sound: ${error}`);
    }
  }

  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.sounds.clear();
  }
}