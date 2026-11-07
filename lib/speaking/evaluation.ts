import type { CefrLevel } from "../cefr/levels";

export type SpeakingSkill =
  | "grammar"
  | "vocabulary"
  | "fluency"
  | "coherence";

export const SPEAKING_SKILLS: readonly SpeakingSkill[] = [
  "grammar",
  "vocabulary",
  "fluency",
  "coherence",
];

export const SPEAKING_SKILL_LABELS: Record<SpeakingSkill, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  fluency: "Fluency",
  coherence: "Coherence",
};

export interface SpeakingMistake {
  original: string;
  correction: string;
  explanation: string;
}

export interface SpeakingEvaluation {
  level: CefrLevel;
  summary: string;
  scores: Record<SpeakingSkill, number>;
  strengths: readonly string[];
  mistakes: readonly SpeakingMistake[];
  recommendations: readonly string[];
  answered: number;
  levelFromTest: CefrLevel | null;
}

export function isSpeakingEvaluation(
  value: unknown,
): value is SpeakingEvaluation {
  if (!value || typeof value !== "object") return false;
  const evaluation = value as Record<string, unknown>;
  if (
    typeof evaluation.level !== "string" ||
    typeof evaluation.summary !== "string" ||
    typeof evaluation.answered !== "number"
  ) {
    return false;
  }

  const scores = evaluation.scores;
  if (!scores || typeof scores !== "object") return false;
  const scoreRecord = scores as Record<string, unknown>;
  if (
    !SPEAKING_SKILLS.every(
      (skill) =>
        typeof scoreRecord[skill] === "number" &&
        Number.isFinite(scoreRecord[skill]),
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(evaluation.strengths) ||
    !Array.isArray(evaluation.mistakes) ||
    !Array.isArray(evaluation.recommendations)
  ) {
    return false;
  }

  return evaluation.mistakes.every(
    (mistake) =>
      mistake &&
      typeof mistake === "object" &&
      typeof (mistake as Record<string, unknown>).original === "string" &&
      typeof (mistake as Record<string, unknown>).correction === "string" &&
      typeof (mistake as Record<string, unknown>).explanation === "string",
  );
}
