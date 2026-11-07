import { isCefrLevel, type CefrLevel, type Skill } from "./levels";

export type CefrTestAnalysisSkill = Skill;

export interface CefrTestAnalysisMistake {
  questionId: string;
  question: string;
  selected: string;
  correction: string;
  explanation: string;
}

export interface CefrTestAnalysis {
  level: CefrLevel;
  summary: string;
  scores: Record<CefrTestAnalysisSkill, number>;
  strengths: readonly string[];
  mistakes: readonly CefrTestAnalysisMistake[];
  recommendations: readonly string[];
  answered: number;
}

const ANALYSIS_SKILLS: readonly CefrTestAnalysisSkill[] = [
  "grammar",
  "vocabulary",
  "reading",
];

export function isCefrTestAnalysis(
  value: unknown,
): value is CefrTestAnalysis {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Record<string, unknown>;
  if (
    !isCefrLevel(analysis.level) ||
    typeof analysis.summary !== "string" ||
    !analysis.summary.trim() ||
    typeof analysis.answered !== "number" ||
    !analysis.scores ||
    typeof analysis.scores !== "object"
  ) {
    return false;
  }

  const scores = analysis.scores as Record<string, unknown>;
  if (
    !ANALYSIS_SKILLS.every(
      (skill) =>
        typeof scores[skill] === "number" &&
        Number.isFinite(scores[skill]),
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(analysis.strengths) ||
    !Array.isArray(analysis.mistakes) ||
    !Array.isArray(analysis.recommendations)
  ) {
    return false;
  }

  return analysis.mistakes.every(
    (mistake) =>
      mistake &&
      typeof mistake === "object" &&
      typeof (mistake as Record<string, unknown>).questionId === "string" &&
      typeof (mistake as Record<string, unknown>).question === "string" &&
      typeof (mistake as Record<string, unknown>).selected === "string" &&
      typeof (mistake as Record<string, unknown>).correction === "string" &&
      typeof (mistake as Record<string, unknown>).explanation === "string",
  );
}
