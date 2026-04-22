export type MessageType =
  | 'taskCreated'
  | 'taskCompleted'
  | 'taskDeleted'
  | 'streakReset'
  | 'taskExpired'
  | 'completionConfirm'
  | 'taskReopened'
  | 'sarcasticGreeting'
  | 'dailySummary';

export interface MessageContext {
  taskName?: string;
  userName?: string;
  todayCompletedCount?: number;
  streak?: number;
}

// Internal history tracker to prevent repetition
// Key: "personality_messageType", Value: Last used index
const messageHistory: Record<string, number> = {};

/**
 * Helper to pick a random variant that isn't the same as the last one.
 */
const pickVariant = (variants: ((ctx: MessageContext) => string)[], key: string) => {
  if (!variants || variants.length === 0) return () => "Task updated.";

  // If only 1 variant, return it
  if (variants.length === 1) return variants[0];

  let index = Math.floor(Math.random() * variants.length);
  const lastIndex = messageHistory[key];

  // If we hit the same index as last time, move to the next one (wrapping around)
  // This is a simple, deterministic way to ensure different result from random collision
  if (index === lastIndex) {
    index = (index + 1) % variants.length;
  }

  messageHistory[key] = index;
  return variants[index];
};

// --- SHARED POOLS (Completed, Deleted, Reopened, Greeting, Daily Summary) ---
// Used across all personalities unless specific overrides are needed later.
// "Uses the full pools you already approved for ALL personalities" -> reusing previous aggressive pool for these.

const SHARED_COMPLETED_POOL = [
  (c: MessageContext) => `"${c.taskName}" is done. Don't get comfortable.`,
  (c: MessageContext) => `You finished "${c.taskName}". That delay was unnecessary.`,
  (c: MessageContext) => `"${c.taskName}" completed. That's the minimum. Keep moving.`,
  (c: MessageContext) => `Finally finished "${c.taskName}". Took you long enough.`,
  (c: MessageContext) => `"${c.taskName}" checked off. Do the next one.`,
  (c: MessageContext) => `You did "${c.taskName}". Barely acceptable pace.`,
  (c: MessageContext) => `"${c.taskName}" is gone. Why are you pausing?`,
  (c: MessageContext) => `Completed "${c.taskName}". Stop celebrating, start working.`,
  (c: MessageContext) => `"${c.taskName}" finished. You're still behind potential.`,
  (c: MessageContext) => `Done with "${c.taskName}". Consistency is what I want.`,
  (c: MessageContext) => `"${c.taskName}" closed. Don't let the momentum die.`,
  (c: MessageContext) => `You marked "${c.taskName}" done. I expected it sooner.`,
  // Context-aware variants
  (c: MessageContext) => c.todayCompletedCount && c.todayCompletedCount > 0
    ? `That's ${c.todayCompletedCount} today. Don't stop now.`
    : `"${c.taskName}" done. About time.`,
  (c: MessageContext) => c.todayCompletedCount && c.todayCompletedCount > 2
    ? `You're on a roll with ${c.todayCompletedCount} tasks. Don't ruin it.`
    : `"${c.taskName}" finished. Keep up.`,
];

const SHARED_DELETED_POOL = [
  (c: MessageContext) => `Deleted "${c.taskName}". Quitting is a habit.`,
  (c: MessageContext) => `"${c.taskName}" removed. Easier than doing it, right?`,
  (c: MessageContext) => `You deleted "${c.taskName}". Avoidance noted.`,
  (c: MessageContext) => `"${c.taskName}" trashed. Just like your goals.`,
  (c: MessageContext) => `Removed "${c.taskName}". Cowardice detected.`,
  (c: MessageContext) => `Deleting "${c.taskName}" doesn't solve the problem.`,
  (c: MessageContext) => `"${c.taskName}" is gone. Weakness remains.`,
  (c: MessageContext) => `You chose to delete "${c.taskName}" instead of doing it.`,
];

const SHARED_REOPENED_POOL = [
  (c: MessageContext) => `Reopened "${c.taskName}". Indecisive much?`,
  (c: MessageContext) => `"${c.taskName}" is back. Get it right this time.`,
  (c: MessageContext) => `Undoing completion of "${c.taskName}". Failure to commit?`,
  (c: MessageContext) => `"${c.taskName}" reopened. Inconsistency is a flaw.`,
  (c: MessageContext) => `You brought "${c.taskName}" back. Finish it properly.`,
  (c: MessageContext) => `Reversing status of "${c.taskName}". Make up your mind.`,
  (c: MessageContext) => `"${c.taskName}" is pending again. Don't stall.`,
  (c: MessageContext) => `Back to work on "${c.taskName}". Stop wavering.`,
];

const SHARED_GREETING_POOL = [
  (c: MessageContext) => `Productivity level: Unknown. Try harder.`,
  (c: MessageContext) => `Hello ${c.userName || ''}. Are we working or pretending?`,
  (c: MessageContext) => `Your task list is judging you.`,
  (c: MessageContext) => `Welcome back ${c.userName || ''}. Don't disappoint me.`,
  (c: MessageContext) => `Oh, you're actually here. Fascinating.`,
  (c: MessageContext) => `Ready to procrastinate? I know I am.`,
  (c: MessageContext) => `I'd ask how you are, but I don't care. Work.`,
  (c: MessageContext) => `Another day, another chance to be mediocre.`,
  (c: MessageContext) => `Login detected. Effort... pending.`,
  (c: MessageContext) => `You're late. Or early. Just be productive.`,
];

const SHARED_SUMMARY_POOL = [
  (c: MessageContext) => `You've done ${c.todayCompletedCount || 0} tasks today. Is that your best?`,
  (c: MessageContext) => `Summary: ${c.todayCompletedCount || 0} completed. Mediocrity or progress? You decide.`,
  (c: MessageContext) => `${c.todayCompletedCount || 0} tasks finished. Don't ask for a pat on the back.`,
  (c: MessageContext) => `Daily report: ${c.todayCompletedCount || 0} done. Keep pushing.`,
];

const SHARED_CONFIRM_POOL = [
  (c: MessageContext) => `Are you actually done with "${c.taskName}"?`,
  (c: MessageContext) => `Verify: did you really finish "${c.taskName}"?`,
  (c: MessageContext) => `Confirming completion of "${c.taskName}". Don't lie.`,
  (c: MessageContext) => `Is "${c.taskName}" truly complete? verify.`,
  (c: MessageContext) => `Marking "${c.taskName}" done. Are you sure?`,
  (c: MessageContext) => `Completion check for "${c.taskName}". Honest?`,
  (c: MessageContext) => `Closing "${c.taskName}". Did you actually do the work?`,
  (c: MessageContext) => `Status update: "${c.taskName}" complete. Confirm.`,
];


// --- DISTINCT PERSONALITY POOLS ---

// 1. RUTHLESS COACH
const RUTHLESS_COACH_POOL = {
  taskCreated: [
    (c: MessageContext) => `"${c.taskName}" added. Execution is now expected.`,
    (c: MessageContext) => `You committed to "${c.taskName}". Deliver.`,
    (c: MessageContext) => `"${c.taskName}" logged. Results decide everything.`,
    (c: MessageContext) => `Task "${c.taskName}" added. Standards apply.`,
    (c: MessageContext) => `"${c.taskName}" added. Follow through.`,
    (c: MessageContext) => `"${c.taskName}" confirmed. Deadline stands.`,
    (c: MessageContext) => `Task "${c.taskName}" saved. Expectation set.`,
    (c: MessageContext) => `"${c.taskName}" locked. Execute.`,
    (c: MessageContext) => `Saved "${c.taskName}". No revisions to discipline.`,
    (c: MessageContext) => `"${c.taskName}" confirmed. Pressure remains.`,
    (c: MessageContext) => `"${c.taskName}" is on the board. No excuses now.`,
    (c: MessageContext) => `You committed to "${c.taskName}". Backing out isn’t an option.`,
    (c: MessageContext) => `"${c.taskName}" added. Discipline starts here.`,
    (c: MessageContext) => `You chose "${c.taskName}". Own it.`,
    (c: MessageContext) => `"${c.taskName}" exists now. So does responsibility.`,
    (c: MessageContext) => `Another promise: "${c.taskName}". Keep it.`,
    (c: MessageContext) => `"${c.taskName}" is logged. Execution is next.`,
    (c: MessageContext) => `You signed up for "${c.taskName}". Prove it wasn’t a lie.`,
    (c: MessageContext) => `"${c.taskName}" added. Action beats intention.`,
    (c: MessageContext) => `You want results? Finish "${c.taskName}".`,
  ],
  taskExpired: [
    (c: MessageContext) => `You missed "${c.taskName}". Unacceptable.`,
    (c: MessageContext) => `"${c.taskName}" failed. Own it.`,
    (c: MessageContext) => `Deadline broken for "${c.taskName}".`,
    (c: MessageContext) => `You didn’t deliver "${c.taskName}".`,
    (c: MessageContext) => `"${c.taskName}" missed. Fix it.`,
  ],
  streakReset: [
    () => "Streak reset. Standards were violated.",
    () => "Consistency failed. Reset confirmed.",
    () => "Your streak broke. Discipline dropped.",
    () => "Streak lost. Rebuild immediately.",
    () => "Reset. No sympathy.",
  ],
  taskCompleted: [
    (c: MessageContext) => `"${c.taskName}" done. That’s how momentum works.`,
    (c: MessageContext) => `You finished "${c.taskName}". Don’t slow down now.`,
    (c: MessageContext) => `"${c.taskName}" is complete. Stay sharp.`,
    (c: MessageContext) => `You delivered "${c.taskName}". Good. What’s next?`,
    (c: MessageContext) => `"${c.taskName}" finished. Consistency matters.`,
    (c: MessageContext) => `You showed up for "${c.taskName}". Do it again.`,
    (c: MessageContext) => `"${c.taskName}" handled. No celebration.`,
    (c: MessageContext) => `Completed "${c.taskName}". Keep the standard.`,
    (c: MessageContext) => `"${c.taskName}" is done. Discipline held.`,
    (c: MessageContext) => `You executed "${c.taskName}". Maintain it.`,
  ],
  taskDeleted: SHARED_DELETED_POOL,
  taskReopened: SHARED_REOPENED_POOL,
  sarcasticGreeting: SHARED_GREETING_POOL,
  dailySummary: SHARED_SUMMARY_POOL,
  completionConfirm: SHARED_CONFIRM_POOL,
};

// 2. SARCASTIC FRIEND
const SARCASTIC_FRIEND_POOL = {
  taskCreated: [
    (c: MessageContext) => `"${c.taskName}" added. Let’s see if it survives your motivation.`,
    (c: MessageContext) => `You logged "${c.taskName}". The real work starts after this screen.`,
    (c: MessageContext) => `"${c.taskName}" is on the list. Don’t ghost it.`,
    (c: MessageContext) => `Added "${c.taskName}". Writing it down doesn’t finish it.`,
    (c: MessageContext) => `"${c.taskName}" added. Deadlines aren’t impressed.`,
    (c: MessageContext) => `"${c.taskName}" saved. Now don’t pretend you forgot.`,
    (c: MessageContext) => `"${c.taskName}" locked in. No loopholes.`,
    (c: MessageContext) => `Saved "${c.taskName}". Screenshots won’t help now.`,
    (c: MessageContext) => `"${c.taskName}" confirmed. Future you is watching.`,
    (c: MessageContext) => `You saved "${c.taskName}". Accountability activated.`,
    (c: MessageContext) => `"${c.taskName}"? Bold choice. Let’s see if you actually do it.`,
    (c: MessageContext) => `You added "${c.taskName}". Screenshot this moment.`,
    (c: MessageContext) => `"${c.taskName}" is in. Try not to ghost it.`,
    (c: MessageContext) => `Ah yes, "${c.taskName}". Another promise to yourself.`,
    (c: MessageContext) => `"${c.taskName}" added. Don’t pretend it’s already done.`,
    (c: MessageContext) => `Look at you, adding "${c.taskName}". Proud. Suspicious.`,
    (c: MessageContext) => `"${c.taskName}" exists now. Scrolling won’t finish it.`,
    (c: MessageContext) => `You added "${c.taskName}". I’ll believe it when it’s done.`,
    (c: MessageContext) => `"${c.taskName}"? Interesting. Let’s see effort.`,
    (c: MessageContext) => `Another task, "${c.taskName}". Shocking.`,
  ],
  taskExpired: [
    (c: MessageContext) => `You missed "${c.taskName}". Classic.`,
    (c: MessageContext) => `"${c.taskName}" didn’t happen. Surprised? No.`,
    (c: MessageContext) => `Missed "${c.taskName}". Deadlines noticed.`,
    (c: MessageContext) => `"${c.taskName}" slipped. That was a choice.`,
    (c: MessageContext) => `You ignored "${c.taskName}". Let’s not lie about it.`,
  ],
  streakReset: [
    () => "Streak reset. Consistency blinked.",
    () => "Your streak broke. One excuse was enough.",
    () => "Streak gone. Predictable pattern.",
    () => "You dropped the streak. Let’s call it what it is.",
    () => "Streak reset. Momentum left the room.",
  ],
  taskCompleted: [
    (c: MessageContext) => `You finished "${c.taskName}". Look at you, functioning.`,
    (c: MessageContext) => `"${c.taskName}" done. See? You didn’t collapse.`,
    (c: MessageContext) => `Wow. "${c.taskName}" completed. Character development.`,
    (c: MessageContext) => `You finished "${c.taskName}". Guess scrolling can wait.`,
    (c: MessageContext) => `"${c.taskName}" is done. Don’t let it get to your head.`,
    (c: MessageContext) => `You completed "${c.taskName}". The bar is raised.`,
    (c: MessageContext) => `"${c.taskName}" finished. Miracles, but make it productivity.`,
    (c: MessageContext) => `You actually did "${c.taskName}". Shocking.`,
    (c: MessageContext) => `"${c.taskName}" done. Proof you’re not allergic to effort.`,
    (c: MessageContext) => `Completed "${c.taskName}". Screenshot this for motivation.`,
    (c: MessageContext) => `"${c.taskName}" done. Wow. You can focus.`,
    (c: MessageContext) => `You finished "${c.taskName}". Miracles happen.`,
    (c: MessageContext) => `"${c.taskName}" is done. Took you long enough.`,
    (c: MessageContext) => `"${c.taskName}" completed. That wasn’t so hard.`,
    (c: MessageContext) => `Well well, "${c.taskName}" is finished.`,
  ],
  taskDeleted: SHARED_DELETED_POOL,
  taskReopened: SHARED_REOPENED_POOL,
  sarcasticGreeting: SHARED_GREETING_POOL,
  dailySummary: SHARED_SUMMARY_POOL,
  completionConfirm: SHARED_CONFIRM_POOL,
};

// 3. DRILL SERGEANT
const DRILL_SERGEANT_POOL = {
  taskCreated: [
    (c: MessageContext) => `"${c.taskName}" logged. Prepare.`,
    (c: MessageContext) => `"${c.taskName}" added. Stay alert.`,
    (c: MessageContext) => `Task "${c.taskName}" registered.`,
    (c: MessageContext) => `"${c.taskName}" on record. Move.`,
    (c: MessageContext) => `Added "${c.taskName}". No delay.`,
    (c: MessageContext) => `"${c.taskName}" secured.`,
    (c: MessageContext) => `"${c.taskName}" locked. Stand by.`,
    (c: MessageContext) => `Task "${c.taskName}" confirmed.`,
    (c: MessageContext) => `"${c.taskName}" saved. Await execution.`,
    (c: MessageContext) => `Confirmed "${c.taskName}".`,
    (c: MessageContext) => `"${c.taskName}" registered. Clock is ticking.`,
    (c: MessageContext) => `You’re assigned "${c.taskName}". Move.`,
    (c: MessageContext) => `"${c.taskName}" logged. No delays.`,
    (c: MessageContext) => `New objective: "${c.taskName}".`,
    (c: MessageContext) => `"${c.taskName}" acknowledged. Execute.`,
    (c: MessageContext) => `Mission added: "${c.taskName}".`,
    (c: MessageContext) => `"${c.taskName}" on record. No retreat.`,
    (c: MessageContext) => `You accepted "${c.taskName}". Follow through.`,
    (c: MessageContext) => `"${c.taskName}" issued. Don’t stall.`,
    (c: MessageContext) => `Target locked: "${c.taskName}".`,
  ],
  taskExpired: [
    (c: MessageContext) => `"${c.taskName}" missed. Correction required.`,
    (c: MessageContext) => `Failure on "${c.taskName}".`,
    (c: MessageContext) => `"${c.taskName}" not completed. Respond.`,
    (c: MessageContext) => `Deadline breached: "${c.taskName}".`,
    (c: MessageContext) => `Missed "${c.taskName}". Regroup.`,
  ],
  streakReset: [
    () => "Streak broken. Regroup.",
    () => "Reset confirmed. Resume discipline.",
    () => "Consistency failed. Restart.",
    () => "Streak lost. Recover.",
    () => "Reset. Stay sharp.",
  ],
  taskCompleted: [
    (c: MessageContext) => `"${c.taskName}" completed. Stay in motion.`,
    (c: MessageContext) => `Objective "${c.taskName}" cleared.`,
    (c: MessageContext) => `"${c.taskName}" done. Maintain pace.`,
    (c: MessageContext) => `You completed "${c.taskName}". Next.`,
    (c: MessageContext) => `"${c.taskName}" finished. No downtime.`,
    (c: MessageContext) => `Mission "${c.taskName}" successful.`,
    (c: MessageContext) => `"${c.taskName}" executed. Keep moving.`,
    (c: MessageContext) => `Completed "${c.taskName}". Discipline holds.`,
    (c: MessageContext) => `"${c.taskName}" cleared. Eyes forward.`,
    (c: MessageContext) => `Task "${c.taskName}" complete.`,
  ],
  taskDeleted: SHARED_DELETED_POOL,
  taskReopened: SHARED_REOPENED_POOL,
  sarcasticGreeting: SHARED_GREETING_POOL,
  dailySummary: SHARED_SUMMARY_POOL,
  completionConfirm: SHARED_CONFIRM_POOL,
};

// 4. CALM THERAPIST (Note: Still aggressive/confrontational, just different phrasing)
const CALM_THERAPIST_POOL = {
  taskCreated: [
    (c: MessageContext) => `"${c.taskName}" added. Notice the intention behind it.`,
    (c: MessageContext) => `You added "${c.taskName}". Awareness comes before action.`,
    (c: MessageContext) => `"${c.taskName}" is noted. Let’s see how you approach it.`,
    (c: MessageContext) => `Task "${c.taskName}" added. One step at a time.`,
    (c: MessageContext) => `"${c.taskName}" logged. Stay present with it.`,
    (c: MessageContext) => `"${c.taskName}" saved. Structure supports follow-through.`,
    (c: MessageContext) => `You confirmed "${c.taskName}". Clarity helps action.`,
    (c: MessageContext) => `"${c.taskName}" is set. Stay grounded.`,
    (c: MessageContext) => `Task "${c.taskName}" saved. Keep awareness.`,
    (c: MessageContext) => `"${c.taskName}" confirmed. Let it guide your focus.`,
    (c: MessageContext) => `You added "${c.taskName}". That’s a choice.`,
    (c: MessageContext) => `"${c.taskName}" is written down now. Awareness matters.`,
    (c: MessageContext) => `You committed to "${c.taskName}". Notice how that feels.`,
    (c: MessageContext) => `"${c.taskName}" exists. Avoidance won’t erase it.`,
    (c: MessageContext) => `Adding "${c.taskName}" means you care. Act on it.`,
    (c: MessageContext) => `"${c.taskName}" is here. So is responsibility.`,
    (c: MessageContext) => `You named "${c.taskName}". Follow through.`,
    (c: MessageContext) => `"${c.taskName}" added. Intention is fragile.`,
    (c: MessageContext) => `You chose "${c.taskName}". Stay present.`,
    (c: MessageContext) => `"${c.taskName}" is logged. What you do next matters.`,
  ],
  taskExpired: [
    (c: MessageContext) => `"${c.taskName}" wasn’t completed. Avoidance showed up.`,
    (c: MessageContext) => `You missed "${c.taskName}". Let’s notice what blocked you.`,
    (c: MessageContext) => `"${c.taskName}" slipped. Awareness matters now.`,
    (c: MessageContext) => `Missed "${c.taskName}". Pause and reflect.`,
    (c: MessageContext) => `"${c.taskName}" didn’t happen. Learn from this.`,
  ],
  streakReset: [
    () => "Your streak reset. Patterns matter more than guilt.",
    () => "Streak broke. Awareness is the next step.",
    () => "Reset happened. Observe what changed.",
    () => "Consistency slipped. Let’s rebuild gently.",
    () => "Streak reset. Begin again with intention.",
  ],
  taskCompleted: [
    (c: MessageContext) => `You completed "${c.taskName}". That matters.`,
    (c: MessageContext) => `"${c.taskName}" is done. Notice the relief.`,
    (c: MessageContext) => `You followed through on "${c.taskName}".`,
    (c: MessageContext) => `"${c.taskName}" completed. That’s alignment.`,
    (c: MessageContext) => `You finished "${c.taskName}". Remember this feeling.`,
    (c: MessageContext) => `"${c.taskName}" is complete. Progress happened.`,
    (c: MessageContext) => `You didn’t avoid "${c.taskName}". Good.`,
    (c: MessageContext) => `"${c.taskName}" done. Consistency builds trust.`,
    (c: MessageContext) => `You showed up for "${c.taskName}".`,
    (c: MessageContext) => `"${c.taskName}" is finished. Stay grounded.`,
  ],
  taskDeleted: SHARED_DELETED_POOL,
  taskReopened: SHARED_REOPENED_POOL,
  sarcasticGreeting: SHARED_GREETING_POOL,
  dailySummary: SHARED_SUMMARY_POOL,
  completionConfirm: SHARED_CONFIRM_POOL,
};


const messageVariants: Record<string, Record<MessageType, ((ctx: MessageContext) => string)[]>> = {
  'ruthless_coach': RUTHLESS_COACH_POOL,
  'sarcastic_friend': SARCASTIC_FRIEND_POOL,
  'drill_sergeant': DRILL_SERGEANT_POOL,
  'calm_therapist': CALM_THERAPIST_POOL,
};


export const getPersonalityMessage = (
  personality: string | null | undefined,
  messageType: MessageType,
  context: MessageContext | string
): string => {
  // Normalize context
  const ctx: MessageContext = typeof context === 'string' ? { taskName: context } : context;

  // Normalize personality key (handle database variations if any)
  // Default to ruthless_coach if unknown or missing
  let personalityKey = (personality || 'ruthless_coach').toLowerCase().replace(' ', '_');

  // Handle mapped logic if needed (e.g. if DB stores "Ruthless Coach" -> "ruthless_coach")
  if (!messageVariants[personalityKey]) {
    personalityKey = 'ruthless_coach';
  }

  // Get the pool for the personality
  const personalityPool = messageVariants[personalityKey];
  const variants = personalityPool[messageType] || personalityPool['taskCreated'];

  // Use a unique key for history tracking
  // We use personalityKey + messageType to track history separately for each personality
  const trackingKey = `${personalityKey}_${messageType}`;

  const messageFn = pickVariant(variants, trackingKey);
  return messageFn(ctx);
};

export const getAnalyticsResponse = (
  personality: string | null | undefined,
  baseText: string
): string => {
  // Deprecated, forwarding to getPersonalityMessage for consistency if used
  return getPersonalityMessage(personality, 'dailySummary', { todayCompletedCount: 0 });
};
