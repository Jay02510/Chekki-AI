import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

let audioContext: AudioContext | null = null;

const initAudio = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
};

/**
 * Synthesizes a pleasant "ding" success sound using the Web Audio API.
 */
export const playSuccessSound = () => {
  try {
    initAudio();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';

    // Play a high C (C6) note for a bright "ding"
    oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime);

    // Quick fade out for a bell-like sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
};

/**
 * Triggers a light haptic impact (e.g. for button taps).
 */
export const hapticLight = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Ignore if not supported
    }
  }
};

/**
 * Triggers a success haptic notification (e.g. for correct answers).
 */
export const hapticSuccess = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      // Ignore if not supported
    }
  }
};

/**
 * Triggers an error haptic notification (e.g. for wrong answers).
 */
export const hapticError = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (e) {
      // Ignore if not supported
    }
  }
};
