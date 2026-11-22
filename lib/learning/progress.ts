export const PROGRESS_EVENT = "english-platform:progress";

export async function getCompletedLessonTopics(): Promise<Set<string>> {
  try {
    const response = await fetch("/api/learning/progress", {
      cache: "no-store",
    });
    if (!response.ok) return new Set();
    const data = (await response.json()) as { topics?: unknown };
    if (!Array.isArray(data.topics)) return new Set();
    return new Set(
      data.topics.filter((topic): topic is string => typeof topic === "string"),
    );
  } catch {
    return new Set();
  }
}

export async function markLessonCompleted(
  topic: string,
  source: "program" | "library" = "program",
): Promise<void> {
  if (!topic) return;

  try {
    const response = await fetch("/api/learning/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, source }),
    });
    if (!response.ok) return;
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    // Progress will be retried on the next completed lesson.
  }
}

export function subscribeToProgress(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener(PROGRESS_EVENT, callback);
  window.addEventListener("focus", callback);

  return () => {
    window.removeEventListener(PROGRESS_EVENT, callback);
    window.removeEventListener("focus", callback);
  };
}
