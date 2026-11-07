import questionsData from "../../data/speaking/speaking-questions.json";
import openingsData from "../../data/speaking/speaking-openings.json";
import greetingsData from "../../data/speaking/speaking-greetings.json";

export interface SpeakingQuestion {
  id: string;
  text: string;
  transitionId: string;
}

export interface SpeakingSession {
  id: string;
  topic: string;
  questions: SpeakingQuestion[];
}

export const SPEAKING_SESSIONS =
  questionsData.sessions as SpeakingSession[];

export const SPEAKING_INTROS = greetingsData.sessionIntros;

export const SPEAKING_TRANSITIONS: Record<string, string[]> =
  openingsData.transitions;

export const SPEAKING_FALLBACK = openingsData.fallback;

/**
 * Compatibility list for the server route's legacy chat branch.
 * The UI uses a randomly selected session and never generates questions.
 */
export const SPEAKING_QUESTIONS = SPEAKING_SESSIONS[0].questions.map(
  (question) => ({
    id: question.id,
    prompt: question.text,
    transitionId: question.transitionId,
  }),
);

export function pickSession(excludeId?: string): SpeakingSession {
  const candidates = SPEAKING_SESSIONS.filter(
    (session) => session.id !== excludeId,
  );
  const pool = candidates.length > 0 ? candidates : SPEAKING_SESSIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickIntro(exclude?: string): string {
  const candidates = SPEAKING_INTROS.filter(
    (intro) => intro !== exclude,
  );
  const pool = candidates.length > 0 ? candidates : SPEAKING_INTROS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickTransition(
  transitionId: string,
  used: Set<string>,
): string {
  const options = SPEAKING_TRANSITIONS[transitionId] ?? [];
  const available = options.filter((option) => !used.has(option));
  const pool = available.length > 0 ? available : options;
  if (pool.length === 0) return SPEAKING_FALLBACK;
  return pool[Math.floor(Math.random() * pool.length)];
}
