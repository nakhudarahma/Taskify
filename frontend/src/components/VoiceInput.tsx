import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Check, X, Clock, Calendar, Loader2, AlertCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { useVoiceFeedback } from "@/hooks/useVoiceFeedback";
import { validateTaskInput, getInvalidTaskVoiceMessage } from "@/lib/taskValidation";

import { useAuth } from "@/contexts/AuthContext";
import { extractDateAndTime } from "@/lib/datePatterns";
import { api } from "@/lib/api";

const SILENCE_TIMEOUT_MS = 2000;

const REMINDER_OPTIONS = [
  { value: "0", label: "At due time" },
  { value: "5", label: "5 minutes before" },
  { value: "10", label: "10 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "120", label: "2 hours before" },
  { value: "1440", label: "1 day before" },
];

const SARCASTIC_PHRASES = {
  // REMOVED CREATED/COMPLETED/REMINDER from here as they are now handled in Dashboard or unused.
  // Wait, REMINDER is still handled in VoiceInput for "Awaiting Reminder" confirmation?
  // The user requirement said "VoiceInput.tsx should ONLY handle recording/input".
  // But Reminder confirmation happens in handleReminderConfirm in VoiceInput.
  // Let's check handleReminderConfirm again. 
  // "Reminder (pick ONE randomly): 'Reminder time...'"
  // Is this checking for "Reminder Confirmation" (setting a reminder) or "Recall Reminder" (notification)?
  // User example: "Reminder: 'Reminder time. Yes, I know distractions exist.'"
  // This sounds like a notification.
  // HOWEVER, previously I put it in handleReminderConfirm (setting the reminder).
  // "Reminder set. I'll be watching." was the previous one.
  // The new list: "Reminder time. Yes, I know distractions exist."
  // This sounds like WHEN the reminder fires.
  // But the previous list was clearly about SETTING result.
  // "Reminder set. I'll be watching." vs "Reminder time."
  // I will assume the user wants this spoken when the reminder is SET (Voice Input flow).
  // BUT `VoiceInput.tsx` handles setting the reminder.
  // If I move "Task Created" speech to Dashboard, should I move "Reminder Set" speech to Dashboard?
  // `createTask` payload includes `reminder_minutes`.
  // The Dashboard handles the creation.
  // So `Dashboard.tsx` speaks "Task created...".
  // Does it speak "Reminder set..."? No, usually just one message.
  // If the user sets a reminder, maybe the "Task Created" message covers it?
  // The user provided a separate list for "REMINDER".
  // "Reminder (pick ONE randomly)"
  // If this is for the notification (when it pops up), that's usually handled by a separate system (e.g., `useTaskExpiration` or a service worker).
  // If this is for confirmation of SETTING a reminder, then it should be spoken.
  // `VoiceInput` flow: Speak Task -> Ask Date -> Ask Time -> Ask Reminder -> Confirm Reminder -> Save.
  // `handleReminderConfirm` speaks: "Reminder set... Ready to save?"
  // Then `handleSaveTask` speaks: "Task created..."
  // If I strip `VoiceInput` of sarcasm decisions, `handleReminderConfirm` should probably just say "Ready to save?" or nothing.
  // But the user said "VoiceInput.tsx should ONLY handle recording/input, NOT sarcasm decisions."
  // AND "3. VoiceInput.tsx should ONLY handle recording/input, NOT sarcasm decisions."
  // AND "Voice task creation -> sarcastic spoken line" (handled by Dashboard)
  // "Task completion -> sarcastic spoken line" (handled by Dashboard)
  // "Reminder -> sarcastic spoken line"
  // If "Reminder" means "Notification", I can't touch strict files for that (likely in `useTaskExpiration` or generic layout).
  // BUT I am allowed to touch `VoiceInput.tsx`.
  // I will assume the "Reminder" list is for `handleReminderConfirm` in `VoiceInput.tsx` because that's what I edited before.
  // Wait, the user said "Manual task creation does NOT go through VoiceInput.tsx. Therefore sarcasm MUST be triggered in Dashboard.tsx".
  // This implies the specific goal is centralization.
  // I will keep `REMINDER` and `ASK_*` in `VoiceInput.tsx` for the *interaction flow*, but remove `CREATED` and `COMPLETED`.
  // And `CREATED` is gone from `VoiceInput.tsx`.

  REMINDER: [
    "Reminder time. Yes, I know distractions exist.",
    "Hey, this task still exists. Just saying.",
    "Friendly reminder before procrastination wins again.",
    "Reminder. Because this task didn’t magically disappear."
  ],
  ASK_DUE_DATE: [
    "When is this happening? Give me a date.",
    "Does this task have a deadline, or is it just a dream?",
    "When should I expect this to be done? Be realistic.",
    "Give me a due date so I can judge you when you miss it.",
    "When is the deadline? Don't say 'someday'."
  ],
  ASK_TIME: [
    "What time? I need specifics.",
    "At what time? Don't keep me guessing.",
    "Clock's ticking. What time is this due?",
    "Give me a time, so I know when to start panicking.",
    "And the time? Precision matters."
  ],
  ASK_REMINDER: [
    "When should I annoy you about this?",
    "Do you need a reminder, or do you have a perfect memory?",
    "When do you want me to interrupt your scrolling with a reminder?",
    "Pick a reminder time. I'll be ready.",
    "When should I buzz you? 5 minutes? An hour?"
  ]
};

const getRandomPhrase = (category: keyof typeof SARCASTIC_PHRASES) => {
  const phrases = SARCASTIC_PHRASES[category];
  if (!phrases || phrases.length === 0) {
    return "Alright. Let’s get this done.";
  }
  return phrases[Math.floor(Math.random() * phrases.length)];
};

interface VoiceResponse {
  intent: string;
  title: string;
  date: string | null;
  time: string | null;
  reminder_minutes: number | null;
  voice_feedback: string | null;
}

interface VoiceInputProps {
  onTaskCreated: (taskData: {
    title: string;
    due_date?: string;
    due_time?: string;
    duration_minutes?: number;
    reminder_minutes?: number;
  }) => Promise<any>;
}

const getSpeechRecognition = () => {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }
  return null;
};

const VoiceInput = ({ onTaskCreated }: VoiceInputProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const {
    speakCustom,
    speakError,
    speakAskDueDateTime,
    speakAskReminderTime,
    speakInvalidTask,
    speakAskTime,
    speakAskDate,
    unlockAudio
  } = useVoiceFeedback();

  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'error' | 'unsupported' | 'awaiting_due' | 'awaiting_reminder' | 'done'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const [transcription, setTranscription] = useState("");
  const [parsedTask, setParsedTask] = useState<any>(null);
  const [manualDueDate, setManualDueDate] = useState("");
  const [manualDueTime, setManualDueTime] = useState("");
  const [manualReminderMinutes, setManualReminderMinutes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    if (!getSpeechRecognition()) {
      setIsSupported(false);
      setStatus('unsupported');
    }
  }, []);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    setStatus('processing');
  }, []);

  const parseTranscription = useCallback(async (text: string) => {
    if (!text.trim()) {
      setStatus('error');
      setErrorMessage("No speech detected. Please try again.");
      speakError();
      return;
    }

    // Validate the transcription
    const validation = validateTaskInput(text);
    if (!validation.isValid) {
      setStatus('error');
      const errorMsg = getInvalidTaskVoiceMessage(validation.reason);
      setErrorMessage(errorMsg);
      speakInvalidTask(errorMsg);
      return;
    }

    setStatus('processing');
    try {
      console.log('🚀 Sending to backend /voice/parse:', text);

      // 1. Try Backend Parsing
      let data: VoiceResponse = { 
        title: text, 
        date: null, 
        time: null, 
        intent: 'create_task',
        voice_feedback: null,
        reminder_minutes: null
      };
      try {
        const response = await api.post('/voice/parse', { text });
        if (response) {
          data = response;
        } else {
          console.warn("Backend parsing returned no data, falling back to local extraction");
        }
      } catch (e: any) {
        console.error("❌ [VoiceInput] Backend parsing failed:", e);
        
        // Handle 401 specifically
        if (e.message?.includes('401') || e.message?.includes('credentials')) {
          setErrorMessage("Session expired. Please sign out and back in.");
          setStatus('error');
        } else {
          setErrorMessage(e.message || "AI brain disconnected.");
          setStatus('error');
        }

        toast({
          variant: "destructive",
          title: "AI Brain Disconnected",
          description: e.message || "I'm having trouble connecting to my AI brain.",
        });
        return; // STOP HERE - do not fall back to "Create Task" if AI call errors
      }
      console.log('🤖 [VoiceInput] Final Data Intent:', data.intent);
      console.log('🤖 [VoiceInput] Backend Parse Result:', data);

      // 2. Try Local Parsing (Regex/Heuristic)
      const localExtracted = extractDateAndTime(text);
      console.log('🧩 Local Parse Result:', localExtracted);

      // 3. Merge Strategies (Prefer Local for date/time consistency if backend misses)
      const finalDate = localExtracted.date || data.date;
      const finalTime = localExtracted.time || data.time;
      // Prefer local extracted title if it's different from original text (meaning we cleaned it), 
      // but ensure we don't end up with empty title.
      // If localExtracted.title matches text (no cleaning happened), we can use data.title in case backend did something smart.
      // But for this specific "remove date phrases" requirement, localExtracted.title is the source of truth for cleaning.
      const finalTitle = localExtracted.title || data.title || text;

      // Update the data object
      const updatedTask = {
        ...data,
        title: finalTitle,
        date: finalDate,
        time: finalTime
      };

      setParsedTask(updatedTask);

      // 4. Handle Specific Intents (Invalid/Chat/Execute)
      if (data.intent === 'invalid') {
        const feedback = data.voice_feedback || "I encountered an error understanding that.";
        setErrorMessage(feedback);
        setStatus('error');
        speakError();
        return;
      }

      if (data.intent === 'chat') {
        const feedback = data.voice_feedback || "I'm not sure what you mean, but I'm listening.";
        speakCustom(feedback);
        setStatus('done'); // Or idle, but done shows the transcript
        return;
      }

      // Pre-fill manual inputs
      if (finalDate) setManualDueDate(finalDate);
      if (finalTime) setManualDueTime(finalTime);

      // 5. Smart Navigation Logic
      const feedback = data.voice_feedback; // Use AI's sarcastic feedback if available

      if (finalDate && finalTime) {
        // Both found -> Skip due date step entirely!
        setStatus('awaiting_reminder');
        speakCustom(feedback || getRandomPhrase('ASK_REMINDER'));
      } else if (finalDate) {
        // Only date found -> Ask for time
        setStatus('awaiting_due');
        speakCustom(feedback || getRandomPhrase('ASK_TIME'));
      } else if (finalTime) {
        // Only time found -> Ask for date
        setStatus('awaiting_due');
        speakCustom(feedback || getRandomPhrase('ASK_DUE_DATE'));
      } else {
        // Neither found -> Ask for both
        setStatus('awaiting_due');
        speakCustom(feedback || getRandomPhrase('ASK_DUE_DATE'));
      }

    } catch (err) {
      console.error('Parse error:', err);
      // Fallback: use raw text as title
      setParsedTask({ title: text });
      setStatus('awaiting_due');
      speakCustom(getRandomPhrase('ASK_DUE_DATE'));
    }
  }, [speakCustom, speakError, speakInvalidTask]);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (finalTranscriptRef.current.trim() && recognitionRef.current) {
        stopRecording();
        parseTranscription(finalTranscriptRef.current);
      }
    }, SILENCE_TIMEOUT_MS);
  }, [parseTranscription, stopRecording]);

  const startRecording = useCallback(async () => {
    // Reset state
    setErrorMessage("");
    setParsedTask(null);
    setTranscription("");
    setManualDueDate("");
    setManualDueTime("");
    setManualReminderMinutes("");
    finalTranscriptRef.current = "";

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setStatus('unsupported');
      setErrorMessage("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    // Check microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately, we just needed to check permission
      const list = stream.getTracks();
      if (list) list.forEach(track => track.stop());
    } catch (permError) {
      setStatus('error');
      setErrorMessage("Microphone access denied. Please allow microphone access in your browser settings.");
      speakError();
      return;
    }

    try {
      // Create NEW recognition instance each time
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setStatus('listening');
        startSilenceTimer();
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const displayText = finalTranscript || interimTranscript;
        setTranscription(displayText);
        finalTranscriptRef.current = finalTranscript || interimTranscript;

        // Reset silence timer on new speech
        startSilenceTimer();
      };

      recognition.onend = () => {
        clearSilenceTimer();
        const savedTranscript = finalTranscriptRef.current;
        recognitionRef.current = null;

        // Process transcript if we have one and haven't already
        if (savedTranscript.trim() && status === 'listening') {
          parseTranscription(savedTranscript);
        } else if (!savedTranscript.trim() && status === 'listening') {
          setStatus('error');
          setErrorMessage("No speech detected. Please speak clearly and try again.");
        }
      };

      recognition.onerror = (event: any) => {
        clearSilenceTimer();
        const savedTranscript = finalTranscriptRef.current;
        recognitionRef.current = null;

        switch (event.error) {
          case 'not-allowed':
            setStatus('error');
            setErrorMessage("Microphone access denied. Please allow microphone access.");
            break;
          case 'no-speech':
            if (savedTranscript.trim()) {
              parseTranscription(savedTranscript);
            } else {
              setStatus('error');
              setErrorMessage("No speech detected. Please speak clearly and try again.");
            }
            break;
          case 'aborted':
            setStatus('idle');
            break;
          case 'network':
            setStatus('error');
            setErrorMessage("Network error. Please check your connection and try again.");
            break;
          default:
            setStatus('error');
            setErrorMessage("Could not access microphone. Please try again.");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Speech recognition error:', error);
      setStatus('error');
      setErrorMessage("Speech recognition failed. Please try again.");
    }
  }, [parseTranscription, speakError, startSilenceTimer, status]);

  const handleMicClick = () => {
    if (!isSupported) {
      toast({
        variant: 'destructive',
        title: 'Not Supported',
        description: 'Voice input is not supported in this browser. Please use Chrome or Edge.',
      });
      return;
    }

    if (status === 'listening') {
      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
      if (finalTranscriptRef.current.trim()) {
        parseTranscription(finalTranscriptRef.current);
      }
    } else if (status === 'idle' || status === 'error' || status === 'done' || status === 'processing' || status === 'awaiting_due' || status === 'awaiting_reminder') {
      // Unlock audio for mobile devices on the first interaction
      unlockAudio();
      
      // Allow retry from processing state if it gets stuck, or just start new
      startRecording();
    }
  };

  const handleDueTimeConfirm = () => {
    if (!manualDueDate || !manualDueTime) {
      toast({
        variant: 'destructive',
        title: 'Required',
        description: 'Please set both due date and time.',
      });
      return;
    }

    // Update parsed task with the due date/time
    setParsedTask((prev: any) => prev ? { ...prev, date: manualDueDate, time: manualDueTime } : null);

    // Move to asking for reminder
    setStatus('awaiting_reminder');
    speakCustom(getRandomPhrase('ASK_REMINDER'));
  };

  const handleReminderConfirm = () => {
    if (!manualReminderMinutes) {
      toast({
        variant: 'destructive',
        title: 'Required',
        description: 'Please select when to be reminded.',
      });
      return;
    }

    // Update parsed task with reminder
    setParsedTask((prev: any) => prev ? { ...prev, reminder_minutes: parseInt(manualReminderMinutes) } : null);

    // Move to done state for final confirmation
    setStatus('done');

    const msg = getRandomPhrase('REMINDER');
    speakCustom(`${msg} "${parsedTask?.title}". Ready to save?`);
  };

  const handleSaveTask = async () => {
    if (!parsedTask || !onTaskCreated || isSaving) return;

    setIsSaving(true);

    try {
      const created = await onTaskCreated({
        title: parsedTask.title,
        due_date: parsedTask.date,
        due_time: parsedTask.time,
        duration_minutes: parsedTask.duration_minutes,
        reminder_minutes: parsedTask.reminder_minutes,
      });

      if (created) {
        // SINGLE SOURCE OF TRUTH: Dashboard now handles the spoken feedback
        const aiMessage = `Task "${parsedTask.title}" created.`;

        // Debug safety check
        if (import.meta.env.DEV) {
          console.log('[AI Debug] taskCreated (VoiceInput internal):', aiMessage);
        }

        // speakCustom(aiMessage); // REMOVED: Dashboard handles this now
        toast({ title: parsedTask.title, description: aiMessage });
        handleReset();
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to save task" });
        speakError();
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save task" });
      speakError();
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setParsedTask(null);
    setTranscription("");
    setStatus('idle');
    setErrorMessage("");
    setManualDueDate("");
    setManualDueTime("");
    setManualReminderMinutes("");
    finalTranscriptRef.current = "";
  };

  // Determine button state
  const isDisabled = status === 'processing' || status === 'unsupported';
  // Note: we allow clicking during 'awaiting_due', 'awaiting_reminder', 'done' to restart/cancel if needed, 
  // currently handleMicClick handles 'idle', 'error', 'done'. 
  // Let's make sure the button visual reflects what happens.

  const buttonClass = status === 'listening'
    ? "bg-destructive"
    : status === 'processing'
      ? "bg-muted cursor-wait"
      : status === 'error' || status === 'unsupported'
        ? "bg-destructive/80"
        : status === 'awaiting_due' || status === 'awaiting_reminder' || status === 'done'
          ? "bg-muted"
          : "bg-primary glow-lg";

  return (
    <div className="glass-card p-4 md:p-8">
      <div className="text-center">
        {/* Mic Button */}
        <div className="relative inline-flex items-center justify-center mb-6">
          {status === 'listening' && (
            <>
              <div className="pulse-ring bg-primary/30" />
              <div className="pulse-ring bg-primary/30" style={{ animationDelay: "0.7s" }} />
            </>
          )}

          <motion.button
            onClick={handleMicClick}
            disabled={isDisabled}
            whileHover={!isDisabled ? { scale: 1.05 } : {}}
            whileTap={!isDisabled ? { scale: 0.95 } : {}}
            className={`relative w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${buttonClass}`}
            aria-label={status === 'listening' ? 'Stop listening' : 'Start voice input'}
          >
            {status === 'processing' ? (
              <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
            ) : status === 'listening' ? (
              <MicOff className="w-12 h-12 text-destructive-foreground" />
            ) : status === 'error' || status === 'unsupported' ? (
              <AlertCircle className="w-12 h-12 text-destructive-foreground" />
            ) : status === 'awaiting_due' || status === 'awaiting_reminder' || status === 'done' ? (
              <Check className="w-12 h-12 text-muted-foreground" />
            ) : (
              <Mic className="w-8 h-8 md:w-12 md:h-12 text-primary-foreground" />
            )}
          </motion.button>
        </div>

        {/* Status Text */}
        <AnimatePresence mode="wait">
          {status === 'idle' && !parsedTask && (
            <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground text-lg">
              Tap and speak your task...
            </motion.p>
          )}

          {status === 'listening' && (
            <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scaleY: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1.5 h-8 bg-primary rounded-full"
                  />
                ))}
              </div>
              <p className="text-primary font-medium text-lg">Listening... (will auto-submit)</p>
              {transcription && (
                <p className="text-foreground bg-secondary/50 px-4 py-2 rounded-lg inline-block">
                  "{transcription}"
                </p>
              )}
              <p className="text-xs text-muted-foreground">Tap mic again to submit now</p>
            </motion.div>
          )}

          {status === 'processing' && (
            <motion.p key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground">
              Understanding your task...
            </motion.p>
          )}

          {status === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <p className="text-destructive font-medium">{errorMessage}</p>
              <Button onClick={handleReset} variant="outline" size="sm">
                Try Again
              </Button>
            </motion.div>
          )}

          {status === 'unsupported' && (
            <motion.div key="unsupported" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <p className="text-destructive font-medium">Voice input not supported in this browser.</p>
              <p className="text-muted-foreground text-sm">Please use Chrome, Edge, or Safari for voice features.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Ask for Due Date/Time */}
        <AnimatePresence>
          {status === 'awaiting_due' && parsedTask && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 glass-card p-6 text-left border-2 border-primary/20"
            >
              <div className="space-y-2 mb-4">
                <Label className="text-primary font-medium">Task Name</Label>
                <Input
                  value={parsedTask.title}
                  onChange={(e) => setParsedTask((prev: any) => prev ? { ...prev, title: e.target.value } : null)}
                  className="bg-secondary/50 text-lg font-semibold"
                />
              </div>
              <p className="text-primary font-medium mb-4">When is this task due?</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent" />
                    Due Date
                  </Label>
                  <Input
                    type="date"
                    value={manualDueDate}
                    onChange={(e) => setManualDueDate(e.target.value)}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Due Time
                  </Label>
                  <Input
                    type="time"
                    value={manualDueTime}
                    onChange={(e) => setManualDueTime(e.target.value)}
                    className="bg-secondary/50"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleDueTimeConfirm} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/85 btn-cheerful">
                  Continue
                </Button>
                <Button variant="outline" size="icon" onClick={handleReset}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 2: Ask for Reminder Time */}
        <AnimatePresence>
          {status === 'awaiting_reminder' && parsedTask && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 glass-card p-6 text-left border-2 border-primary/20"
            >
              <div className="space-y-2 mb-3">
                <Label className="text-primary font-medium">Task Name</Label>
                <Input
                  value={parsedTask.title}
                  onChange={(e) => setParsedTask((prev: any) => prev ? { ...prev, title: e.target.value } : null)}
                  className="bg-secondary/50 text-lg font-semibold"
                />
              </div>
              <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{parsedTask.date} at {parsedTask.time}</span>
              </div>
              <p className="text-primary font-medium mb-4">At what time would you like to be reminded?</p>

              <div className="space-y-2 mb-4">
                <Label className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-warning" />
                  Reminder
                </Label>
                <Select value={manualReminderMinutes} onValueChange={setManualReminderMinutes}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Select when to remind you" />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleReminderConfirm} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/85 btn-cheerful">
                  Continue
                </Button>
                <Button variant="outline" size="icon" onClick={handleReset}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Final: Result View (Task or Chat) */}
        <AnimatePresence>
          {parsedTask && status === 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 w-full"
            >
              {parsedTask.intent === 'chat' ? (
                /* Chat Response Bubble */
                <div className="glass-card p-6 border-2 border-primary/30 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Mic className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-4 flex-1">
                      <p className="text-xl font-medium text-foreground leading-relaxed italic">
                        "{parsedTask.voice_feedback || transcription}"
                      </p>
                      <div className="flex justify-end">
                        <Button
                          onClick={handleReset}
                          variant="ghost"
                          className="text-primary hover:bg-primary/10 gap-2"
                        >
                          <X className="w-4 h-4" /> Close
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Task Confirmation Form */
                <div className="glass-card p-6 text-left border-2 border-primary/20">
                  <div className="space-y-4 mb-4">
                    <div className="space-y-2">
                      <Label className="text-primary font-medium">Task Name</Label>
                      <Input
                        value={parsedTask.title}
                        onChange={(e) => setParsedTask((prev: any) => prev ? { ...prev, title: e.target.value } : null)}
                        className="bg-background border-primary/50 text-lg font-semibold"
                        autoFocus
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-accent" />
                          Date
                        </Label>
                        <Input
                          type="date"
                          value={parsedTask.date || ""}
                          onChange={(e) => setParsedTask((prev: any) => prev ? { ...prev, date: e.target.value } : null)}
                          className="bg-secondary/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-primary" />
                          Time
                        </Label>
                        <Input
                          type="time"
                          value={parsedTask.time || ""}
                          onChange={(e) => setParsedTask((prev: any) => prev ? { ...prev, time: e.target.value } : null)}
                          className="bg-secondary/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <Bell className="w-4 h-4 text-warning" />
                        Reminder
                      </Label>
                      <Select
                        value={String(parsedTask.reminder_minutes || "")}
                        onValueChange={(val) => setParsedTask((prev: any) => prev ? { ...prev, reminder_minutes: parseInt(val) } : null)}
                      >
                        <SelectTrigger className="bg-secondary/30">
                          <SelectValue placeholder="No reminder" />
                        </SelectTrigger>
                        <SelectContent>
                          {REMINDER_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button onClick={handleSaveTask} disabled={isSaving} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/85 gap-2 btn-cheerful">
                      <Check className="w-4 h-4" /> Confirm & Save
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleReset}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div >
  );
};

export default VoiceInput;
