import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPersonalityMessage } from '@/lib/personalityMessages';
import { AIPersonality } from '@/components/PersonalitySelection';

export const useVoiceFeedback = () => {
  const { profile } = useAuth();
  const voicesLoaded = useRef(false);
  const preferredVoice = useRef<SpeechSynthesisVoice | null>(null);

  const personality = profile?.ai_personality as AIPersonality | null;

  // Pre-load voices and find the best male voice
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();

        const preferredVoiceNames = [
          'Daniel', 'Alex', 'Tom', 'Oliver',
          'Microsoft Guy Online', 'Microsoft David Desktop', 'Microsoft David Online', 'Microsoft Mark Online',
          'Google UK English Male', 'Google US English Male',
          'Male', 'en-GB', 'en-US',
        ];

        for (const voiceName of preferredVoiceNames) {
          const voice = voices.find(v =>
            v.name.includes(voiceName) && v.lang.startsWith('en')
          );
          if (voice) {
            preferredVoice.current = voice;
            break;
          }
        }

        if (!preferredVoice.current) {
          preferredVoice.current = voices.find(v =>
            v.lang.startsWith('en') &&
            !v.name.toLowerCase().includes('female') &&
            !v.name.toLowerCase().includes('samantha') &&
            !v.name.toLowerCase().includes('victoria') &&
            !v.name.toLowerCase().includes('karen')
          ) || voices.find(v => v.lang.startsWith('en')) || null;
        }

        voicesLoaded.current = true;
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        loadVoices();
      }

      window.speechSynthesis.onvoiceschanged = loadVoices;
      setTimeout(loadVoices, 100);
    }
  }, []);

  const speak = useCallback((text: string) => {
    const voiceEnabled = profile?.voice_feedback_enabled ?? true;
    if (!voiceEnabled) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 0.95;
      utterance.volume = 1;

      if (preferredVoice.current) {
        utterance.voice = preferredVoice.current;
      }

      const processedText = text
        .replace(/\./g, '... ')
        .replace(/!/g, '! ')
        .replace(/,/g, ', ');

      utterance.text = processedText;

      window.speechSynthesis.speak(utterance);
    }
  }, [profile?.voice_feedback_enabled]);

  // Personality-aware feedback
  const speakTaskCreated = useCallback((taskName: string) => {
    speak(`Task "${taskName}" created.`);
  }, [speak]);

  const speakTaskCompleted = useCallback((taskName: string) => {
    speak(`Task "${taskName}" completed.`);
  }, [speak]);

  const speakTaskUpdated = useCallback((taskName: string) => {
    const variants = [
      `${taskName} updated. Don't change it again. Just do it.`,
      `${taskName} modified. Stop tweaking and start doing.`,
      `${taskName} changed. Now commit to it.`,
    ];
    speak(variants[Math.floor(Math.random() * variants.length)]);
  }, [speak]);

  const speakTaskDeleted = useCallback((taskName: string) => {
    speak(`Task "${taskName}" deleted.`);
  }, [speak]);

  const speakReminder = useCallback((taskName: string, dueTime?: string) => {
    speak(`Reminder: "${taskName}" is due.`);
  }, [speak]);

  const speakTaskError = useCallback((taskName: string, action: string) => {
    const variants = [
      `Failed to ${action} ${taskName}. Try again.`,
      `Couldn't ${action} ${taskName}. Do it again.`,
      `${action} failed for ${taskName}. One more time.`,
    ];
    speak(variants[Math.floor(Math.random() * variants.length)]);
  }, [speak]);

  const speakListening = useCallback(() => {
    const variants = [
      "Speak. I'm judging.",
      "Go ahead. I'm listening.",
      "Talk. Make it count.",
    ];
    speak(variants[Math.floor(Math.random() * variants.length)]);
  }, [speak]);

  const speakProcessing = useCallback(() => {
    speak("Processing...");
  }, [speak]);

  const speakError = useCallback(() => {
    const variants = [
      "Couldn't hear that. Speak clearly.",
      "That was inaudible. Try again.",
      "Nothing came through. Speak up.",
    ];
    speak(variants[Math.floor(Math.random() * variants.length)]);
  }, [speak]);

  const speakWelcome = useCallback(() => {
    speak("Welcome back.");
  }, [speak]);

  const speakMissingInfo = useCallback(() => {
    const variants = [
      "Missing details. When is this due? Be specific.",
      "Incomplete. I need a deadline. When?",
      "Not enough info. Give me a date and time.",
    ];
    speak(variants[Math.floor(Math.random() * variants.length)]);
  }, [speak]);

  const speakAskTime = useCallback(() => {
    const variants = [
      "What time? Don't make me ask twice.",
      "Time. Now.",
      "I need a time. Be specific.",
    ];
    speak(variants[Math.floor(Math.random() * variants.length)]);
  }, [speak]);

  const speakAskDate = useCallback(() => {
    const variants = [
      "When? Give me a date.",
      "Date. I need one. Now.",
      "What day? Don't keep me waiting.",
    ];
    speak(variants[Math.floor(Math.random() * variants.length)]);
  }, [speak]);

  const speakAskDueDateTime = useCallback(() => {
    const variants = [
      "When is this due? Date and time.",
      "Deadline. Date and time. Go.",
      "I need a date and time. Don't overthink it.",
    ];
    speak(variants[Math.floor(Math.random() * variants.length)]);
  }, [speak]);

  const speakAskReminderTime = useCallback(() => {
    const variants = [
      "When do you want to be reminded? Choose wisely.",
      "Reminder time. Pick one and commit.",
      "When should I remind you? Don't say never.",
    ];
    speak(variants[Math.floor(Math.random() * variants.length)]);
  }, [speak]);

  const speakInvalidTask = useCallback((customMessage?: string) => {
    speak(customMessage || "That doesn't look like a valid task.");
  }, [speak]);

  const speakCustom = useCallback((message: string) => {
    speak(message);
  }, [speak]);

  const unlockAudio = useCallback(() => {
    if ('speechSynthesis' in window) {
      // Speak a tiny silent utterance to unlock audio context on mobile
      const utterance = new SpeechSynthesisUtterance("");
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
      console.log("🔊 Audio unlocked");
    }
  }, []);

  return {
    speak,
    speakTaskCreated,
    speakTaskCompleted,
    speakTaskUpdated,
    speakTaskDeleted,
    speakReminder,
    speakTaskError,
    speakListening,
    speakProcessing,
    speakError,
    speakWelcome,
    speakCustom,
    speakMissingInfo,
    speakAskTime,
    speakAskDate,
    speakAskDueDateTime,
    speakAskReminderTime,
    speakInvalidTask,
    unlockAudio,
    isEnabled: profile?.voice_feedback_enabled ?? true,
  };
};
