export interface MistakeCardData {
  topic: string;
  skill: string;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  explanation: string | null;
  passageTitle?: string;
  passageText?: string;
}

const skillLabels: Record<string, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  reading: "Reading",
};

export default function MistakeCard({
  mistake,
}: {
  mistake: MistakeCardData;
}) {
  return (
    <article className="account-mistake-card">
      <div className="account-mistake-card__tags">
        <span>{skillLabels[mistake.skill] ?? mistake.skill}</span>
        <span>{mistake.topic}</span>
      </div>
      {mistake.passageText ? (
        <div className="reading-passage">
          {mistake.passageTitle ? <p>{mistake.passageTitle}</p> : null}
          {mistake.passageText}
        </div>
      ) : null}
      <h3>{mistake.question}</h3>
      <div className="account-mistake-card__answers">
        <p>
          <span>Ваш ответ</span>
          <del>{mistake.selectedAnswer}</del>
        </p>
        <p>
          <span>Правильно</span>
          <ins>{mistake.correctAnswer}</ins>
        </p>
      </div>
      {mistake.explanation ? (
        <p className="account-mistake-card__explanation">
          {mistake.explanation}
        </p>
      ) : null}
    </article>
  );
}
