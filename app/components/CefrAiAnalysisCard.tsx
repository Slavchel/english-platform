import type { CefrTestAnalysis } from "@/lib/cefr/test-analysis";
import MistakeCard, {
  type MistakeCardData,
} from "@/app/components/MistakeCard";

export default function CefrAiAnalysisCard({
  analysis,
  mistakes = [],
}: {
  analysis: CefrTestAnalysis;
  mistakes?: readonly MistakeCardData[];
}) {
  return (
    <section className="cefr-ai-panel">
      <div className="cefr-ai-panel__head">
        <div>
          <p className="cefr-ai-kicker">AI-анализ</p>
          <h2>Разбор ответов</h2>
        </div>
        <div className="cefr-ai-level">
          <span>AI-уровень</span>
          <strong>{analysis.level}</strong>
          <small>{analysis.answered} ответов</small>
        </div>
      </div>

      <div className="cefr-ai-columns">
        <section>
          <h3>Что получилось</h3>
          <p className="cefr-ai-text">{analysis.whatWorks}</p>
        </section>
        <section>
          <h3>Что улучшить</h3>
          <p className="cefr-ai-text">{analysis.whatToImprove}</p>
        </section>
      </div>

      {analysis.recommendedTopics.length > 0 ? (
        <section className="cefr-ai-mistakes">
          <h3>Рекомендованные темы</h3>
          <div className="cefr-ai-topics">
            {analysis.recommendedTopics.map((topic) => (
              <span key={topic}>{topic}</span>
            ))}
          </div>
        </section>
      ) : null}

      {mistakes.length > 0 ? (
        <section className="cefr-ai-mistakes">
          <h3>Ошибки Grammar / Vocabulary</h3>
          <div className="cefr-ai-mistakes__list">
            {mistakes.map((mistake, index) => (
              <MistakeCard
                key={`${mistake.topic}-${mistake.question}-${index}`}
                mistake={mistake}
              />
            ))}
          </div>
        </section>
      ) : null}

      <p className="cefr-ai-note">
        Предварительный разбор по ответам. Он не заменяет официальный экзамен.
      </p>
    </section>
  );
}
