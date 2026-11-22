import { isCefrLevel, type CefrLevel } from "./levels";

export interface CefrTestAnalysis {
  level: CefrLevel;
  whatWorks: string;
  whatToImprove: string;
  recommendedTopics: readonly string[];
  answered: number;
}

export function isCefrTestAnalysis(
  value: unknown,
): value is CefrTestAnalysis {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Record<string, unknown>;

  return (
    isCefrLevel(analysis.level) &&
    typeof analysis.whatWorks === "string" &&
    Boolean(analysis.whatWorks.trim()) &&
    typeof analysis.whatToImprove === "string" &&
    Boolean(analysis.whatToImprove.trim()) &&
    Array.isArray(analysis.recommendedTopics) &&
    analysis.recommendedTopics.every(
      (topic) => typeof topic === "string",
    ) &&
    typeof analysis.answered === "number"
  );
}
