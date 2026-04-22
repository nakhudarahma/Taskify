/**
 * Task Validation Utility
 * Validates whether user input represents a valid, actionable task
 */

// Action verbs that indicate a task
const ACTION_VERBS = [
  // Common task actions
  'submit', 'complete', 'finish', 'do', 'make', 'create', 'build', 'write',
  'send', 'call', 'email', 'message', 'text', 'contact', 'reach',
  'buy', 'get', 'pick', 'grab', 'order', 'purchase', 'shop',
  'prepare', 'plan', 'schedule', 'organize', 'arrange', 'set', 'book',
  'study', 'read', 'review', 'learn', 'practice', 'research', 'analyze',
  'attend', 'go', 'visit', 'meet', 'join', 'participate',
  'clean', 'wash', 'fix', 'repair', 'update', 'upgrade', 'install',
  'pay', 'transfer', 'deposit', 'withdraw', 'renew', 'cancel',
  'start', 'begin', 'continue', 'resume', 'stop', 'end',
  'check', 'verify', 'confirm', 'test', 'inspect', 'audit',
  'remind', 'remember', 'follow', 'track', 'monitor',
  'cook', 'bake', 'eat', 'drink', 'exercise', 'workout', 'run', 'walk',
  'take', 'bring', 'deliver', 'ship', 'return', 'exchange',
  'apply', 'register', 'sign', 'enroll', 'subscribe',
  'draft', 'edit', 'proofread', 'publish', 'post', 'share', 'upload',
  'design', 'develop', 'code', 'implement', 'deploy', 'launch',
  'discuss', 'talk', 'present', 'pitch', 'negotiate', 'interview',
  'file', 'sort', 'archive', 'backup', 'delete', 'remove',
  'watch', 'listen', 'record', 'capture',
];

// Task-related nouns that indicate a task context
const TASK_NOUNS = [
  'assignment', 'project', 'report', 'presentation', 'meeting', 'appointment',
  'deadline', 'task', 'todo', 'homework', 'work', 'job', 'errand',
  'email', 'message', 'call', 'document', 'file', 'form', 'application',
  'payment', 'bill', 'invoice', 'receipt', 'order', 'delivery',
  'class', 'course', 'lesson', 'exam', 'test', 'quiz', 'interview',
  'gym', 'doctor', 'dentist', 'appointment', 'reservation', 'booking',
  'groceries', 'shopping', 'laundry', 'cleaning', 'cooking', 'meal',
];

// Common greetings and non-task phrases to reject
const GREETINGS_AND_NOISE = [
  'hello', 'hi', 'hey', 'yo', 'sup', 'howdy', 'hola',
  'good morning', 'good afternoon', 'good evening', 'good night',
  'how are you', 'what\'s up', 'how\'s it going', 'how do you do',
  'nice to meet you', 'pleased to meet you',
  'thank you', 'thanks', 'thank', 'thx',
  'bye', 'goodbye', 'see you', 'later', 'ciao',
  'yes', 'no', 'maybe', 'ok', 'okay', 'sure', 'fine', 'alright',
  'hmm', 'umm', 'uh', 'ah', 'oh', 'wow', 'oops',
  'test', 'testing', 'one two three', 'check check',
  'nevermind', 'forget it', 'nothing', 'nope',
];

interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validates whether the input text represents a valid, actionable task
 */
export function validateTaskInput(input: string): ValidationResult {
  // Normalize input
  const text = input.trim().toLowerCase();

  // Check for empty input
  if (!text || text.length === 0) {
    return { isValid: false, reason: 'empty' };
  }

  // Check minimum length (at least 2 characters for a meaningful task)
  if (text.length < 2) {
    return { isValid: false, reason: 'too_short' };
  }

  // Check if it's a greeting or noise phrase
  for (const phrase of GREETINGS_AND_NOISE) {
    if (text === phrase || text.startsWith(phrase + ' ') || text.endsWith(' ' + phrase)) {
      return { isValid: false, reason: 'greeting_or_noise' };
    }
  }

  // Check if entire input is just a greeting
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length <= 2) {
    // For very short inputs, be stricter
    const isOnlyGreeting = words.every(word =>
      GREETINGS_AND_NOISE.some(g => g === word || g.includes(word))
    );
    if (isOnlyGreeting) {
      return { isValid: false, reason: 'greeting_or_noise' };
    }
  }

  // Relaxed validation: Allow almost any input that isn't just noise
  // We want to trust the user's intent more than our dictionary

  // If we have at least 2 words, it's probably a task
  if (words.length >= 2) {
    return { isValid: true };
  }

  // If it's a single word but long enough (e.g. "Groceries"), allow it
  if (text.length >= 4) {
    return { isValid: true };
  }

  // Default: reject only very short, single-word inputs that aren't on our allowlist
  return { isValid: false, reason: 'too_short' };
}

/**
 * Returns a user-friendly error message for invalid task input
 */
export function getInvalidTaskMessage(reason?: string): string {
  switch (reason) {
    case 'empty':
      return 'Please enter a task.';
    case 'too_short':
      return 'Task description is too short.';
    case 'greeting_or_noise':
      return 'That doesn\'t seem like a task. Please describe what you need to do.';
    case 'no_task_intent':
      return 'Invalid task. Please say a valid task like "Submit report tomorrow at 5pm".';
    default:
      return 'Invalid task. Please try again with a clear task description.';
  }
}

/**
 * Voice-friendly message for invalid task
 */
export function getInvalidTaskVoiceMessage(reason?: string): string {
  switch (reason) {
    case 'empty':
      return 'I didn\'t catch that. Please tell me what task you\'d like to add.';
    case 'too_short':
      return 'Could you give me a bit more detail about the task?';
    case 'greeting_or_noise':
      return 'That doesn\'t seem like a task. Please try again with something like, submit report tomorrow.';
    case 'no_task_intent':
      return 'I\'m not sure what task you meant. Try saying something like, call mom at 3pm.';
    default:
      return 'That doesn\'t look like a task. Please try again.';
  }
}
