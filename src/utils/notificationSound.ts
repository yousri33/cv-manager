// Notification sound utility
export class NotificationSound {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Initialize audio context on user interaction
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context not supported:', error);
      }
    }
  }

  // Enable/disable notifications
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  getEnabled(): boolean {
    return this.isEnabled;
  }

  // Play success notification sound
  async playSuccess() {
    if (!this.isEnabled || !this.audioContext) return;
    
    try {
      await this.resumeAudioContext();
      this.createTone(800, 0.1, 'sine'); // High pitch success tone
      setTimeout(() => this.createTone(1000, 0.1, 'sine'), 100);
    } catch (error) {
      console.warn('Could not play success sound:', error);
    }
  }

  // Play error notification sound
  async playError() {
    if (!this.isEnabled || !this.audioContext) return;
    
    try {
      await this.resumeAudioContext();
      this.createTone(300, 0.2, 'sawtooth'); // Low pitch error tone
    } catch (error) {
      console.warn('Could not play error sound:', error);
    }
  }

  // Play upload complete notification
  async playUploadComplete() {
    if (!this.isEnabled || !this.audioContext) return;
    
    try {
      await this.resumeAudioContext();
      // Pleasant ascending melody
      this.createTone(523, 0.15, 'sine'); // C5
      setTimeout(() => this.createTone(659, 0.15, 'sine'), 150); // E5
      setTimeout(() => this.createTone(784, 0.2, 'sine'), 300); // G5
    } catch (error) {
      console.warn('Could not play upload complete sound:', error);
    }
  }

  // Play new notification sound
  async playNewNotification() {
    if (!this.isEnabled || !this.audioContext) return;
    
    try {
      await this.resumeAudioContext();
      this.createTone(880, 0.1, 'sine'); // A5 - gentle notification
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  // Play click sound
  async playClick() {
    if (!this.isEnabled || !this.audioContext) return;
    
    try {
      await this.resumeAudioContext();
      this.createTone(600, 0.05, 'sine'); // Subtle click sound
    } catch (error) {
      console.warn('Could not play click sound:', error);
    }
  }

  // Play hover sound
  async playHover() {
    if (!this.isEnabled || !this.audioContext) return;
    
    try {
      await this.resumeAudioContext();
      this.createTone(800, 0.03, 'sine'); // Very subtle hover sound
    } catch (error) {
      console.warn('Could not play hover sound:', error);
    }
  }

  // Play modal open sound
  async playModalOpen() {
    if (!this.isEnabled || !this.audioContext) return;
    
    try {
      await this.resumeAudioContext();
      this.createTone(400, 0.08, 'sine');
      setTimeout(() => this.createTone(600, 0.08, 'sine'), 40);
    } catch (error) {
      console.warn('Could not play modal open sound:', error);
    }
  }

  // Play modal close sound
  async playModalClose() {
    if (!this.isEnabled || !this.audioContext) return;
    
    try {
      await this.resumeAudioContext();
      this.createTone(600, 0.08, 'sine');
      setTimeout(() => this.createTone(400, 0.08, 'sine'), 40);
    } catch (error) {
      console.warn('Could not play modal close sound:', error);
    }
  }

  // Play search sound
  async playSearch() {
    if (!this.isEnabled || !this.audioContext) return;
    
    try {
      await this.resumeAudioContext();
      this.createTone(700, 0.04, 'sine'); // Search/typing sound
    } catch (error) {
      console.warn('Could not play search sound:', error);
    }
  }

  // Play toggle sound
  async playToggle() {
    if (!this.isEnabled || !this.audioContext) return;
    
    try {
      await this.resumeAudioContext();
      this.createTone(500, 0.06, 'sine');
      setTimeout(() => this.createTone(750, 0.06, 'sine'), 30);
    } catch (error) {
      console.warn('Could not play toggle sound:', error);
    }
  }

  // Play warning sound
  async playWarning() {
    if (!this.isEnabled || !this.audioContext) return;
    
    try {
      await this.resumeAudioContext();
      this.createTone(600, 0.1, 'sine');
      setTimeout(() => this.createTone(600, 0.1, 'sine'), 150);
      setTimeout(() => this.createTone(600, 0.1, 'sine'), 300);
    } catch (error) {
      console.warn('Could not play warning sound:', error);
    }
  }

  // Play loading sound
  async playLoading() {
    if (!this.isEnabled || !this.audioContext) return;
    
    try {
      await this.resumeAudioContext();
      this.createTone(450, 0.1, 'sine');
      setTimeout(() => this.createTone(550, 0.1, 'sine'), 100);
      setTimeout(() => this.createTone(650, 0.1, 'sine'), 200);
    } catch (error) {
      console.warn('Could not play loading sound:', error);
    }
  }

  // Resume audio context (required for user interaction)
  private async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Create a tone with specified frequency, duration, and wave type
  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Initialize audio context on first user interaction
  async initializeOnUserInteraction() {
    if (!this.audioContext) {
      this.initializeAudioContext();
    }
    await this.resumeAudioContext();
  }
}

// Global notification sound instance
export const notificationSound = new NotificationSound();

// Utility functions for easy access
export const playSuccessSound = () => notificationSound.playSuccess();
export const playErrorSound = () => notificationSound.playError();
export const playUploadCompleteSound = () => notificationSound.playUploadComplete();
export const playNewNotificationSound = () => notificationSound.playNewNotification();
export const playClickSound = () => notificationSound.playClick();
export const playHoverSound = () => notificationSound.playHover();
export const playModalOpenSound = () => notificationSound.playModalOpen();
export const playModalCloseSound = () => notificationSound.playModalClose();
export const playSearchSound = () => notificationSound.playSearch();
export const playToggleSound = () => notificationSound.playToggle();
export const playWarningSound = () => notificationSound.playWarning();
export const playLoadingSound = () => notificationSound.playLoading();
export const enableNotificationSounds = (enabled: boolean) => notificationSound.setEnabled(enabled);
export const isNotificationSoundEnabled = (): boolean => notificationSound.getEnabled();
export const initializeNotificationSounds = () => notificationSound.initializeOnUserInteraction();