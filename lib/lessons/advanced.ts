import newTestQuestionData from "../../content/new_test_questions.json";

import type { CourseStep, CourseTestQuestion } from "./course";

type IntroStep = Extract<CourseStep, { kind: "intro" }>;
type FormulaStep = Extract<CourseStep, { kind: "formula" }>;
type TheoryStep = Extract<CourseStep, { kind: "theory" }>;
type MatchingStep = Extract<CourseStep, { kind: "matching" }>;
type SortingStep = Extract<CourseStep, { kind: "sorting" }>;
type DialogueStep = Extract<CourseStep, { kind: "dialogue" }>;
type WordOrderStep = Extract<CourseStep, { kind: "word-order" }>;
type ResultStep = Extract<CourseStep, { kind: "result" }>;

interface NewTestQuestion {
  topic: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const NEW_TEST_QUESTIONS = new Map<string, CourseTestQuestion[]>();

for (const item of newTestQuestionData as NewTestQuestion[]) {
  const list = NEW_TEST_QUESTIONS.get(item.topic) ?? [];
  list.push({
    id: `new-test-${item.topic}-${list.length + 1}`,
    prompt: item.question,
    options: item.options,
    correctAnswer: item.correctAnswer,
    explanation: item.explanation,
  });
  NEW_TEST_QUESTIONS.set(item.topic, list);
}

interface AdvancedCourseConfig {
  topic: string;
  intro: IntroStep;
  theory: readonly TheoryStep[];
  finalTheory?: readonly TheoryStep[];
  formula: FormulaStep;
  matching: MatchingStep;
  sorting: SortingStep;
  dialogue: DialogueStep;
  wordOrder: WordOrderStep;
  testIndices?: readonly number[];
  extraPractice?: readonly CourseTestQuestion[];
  additionalPractice?: readonly CourseStep[];
  result: ResultStep;
}

function theory(
  eyebrow: string,
  title: string,
  paragraphs: readonly string[],
  examples?: readonly { en: string; ru: string }[],
  note?: string,
): TheoryStep {
  return {
    kind: "theory",
    eyebrow,
    title,
    paragraphs,
    examples,
    note,
  };
}

function practice(index: number): CourseStep {
  return {
    kind: "practice",
    eyebrow: `Практика · ${index + 1}`,
    questionIndex: index,
  };
}

function buildCourse(config: AdvancedCourseConfig): CourseStep[] {
  const [foundations, forms, details] = config.theory;
  const steps: CourseStep[] = [
    config.intro,
    ...(foundations ? [foundations] : []),
    config.formula,
    config.matching,
    ...(forms ? [forms] : []),
    practice(0),
    practice(1),
    ...(details ? [details] : []),
    config.sorting,
    practice(2),
    practice(3),
    config.dialogue,
    ...(config.finalTheory ?? []),
    practice(4),
    ...(config.additionalPractice ?? []),
    config.wordOrder,
    practice(5),
    {
      kind: "pre-test",
      eyebrow: "Шаг 13 · Перед финальным тестом",
      title: "Урок почти пройден",
      lead: "Остался финальный тест для закрепления. Сначала коротко повтори главное — затем проверь себя на восьми вопросах.",
      summary: config.formula.lines.map((line) => ({
        label: line.label,
        text: `${line.formula}. ${line.example}`,
      })),
    },
    {
      kind: "test",
      eyebrow: "Шаг 13 · Финальный тест",
      title: "Финальный тест",
      questionIndices: config.testIndices ?? [6, 7],
      extraQuestions: [
        ...(NEW_TEST_QUESTIONS.get(config.topic) ?? []),
        ...(config.extraPractice ?? []),
      ],
    },
    config.result,
  ];

  return steps.map((step, index) => ({
    ...step,
    eyebrow: step.eyebrow.replace(/^Шаг \d+/, `Шаг ${index + 1}`),
  }));
}

const conditionalsIntro: IntroStep = {
  kind: "intro",
  introType: "scenario",
  eyebrow: "Шаг 1 · Ситуация",
  title: "Если бы...",
  lead: "Ты планируешь выходные и представляешь разные варианты. Какая фраза звучит естественно?",
  example: "If it rains tomorrow, we will stay at home.",
  options: [
    "If it rains tomorrow, we will stay at home.",
    "If it will rain tomorrow, we stay at home.",
    "If it rained tomorrow, we will stay at home.",
  ],
  correctOption: "If it rains tomorrow, we will stay at home.",
  explanation:
    "В First Conditional после if используем Present Simple, а в главной части — will + глагол.",
  scenario: "Планы на выходные зависят от погоды.",
};

const conditionalsThreeIntro: IntroStep = {
  kind: "intro",
  introType: "scenario",
  eyebrow: "Шаг 1 · Ситуация",
  title: "Сожаление о прошлом",
  lead: "Ты вспоминаешь, как мог бы всё изменить. Выбери фразу о нереальном прошлом.",
  example: "If I had known, I would have called you.",
  options: [
    "If I had known, I would have called you.",
    "If I knew, I would have called you.",
    "If I had known, I would call you.",
  ],
  correctOption: "If I had known, I would have called you.",
  explanation:
    "Third Conditional: if + Past Perfect, would have + V3. Речь идёт о нереальной ситуации в прошлом.",
  scenario: "Ты не знал о встрече и не позвонил.",
};

const gerundsIntro: IntroStep = {
  kind: "intro",
  introType: "mistake",
  eyebrow: "Шаг 1 · Ловушка",
  title: "Найди ошибку в предложении",
  lead: "Выбери слово, из-за которого предложение становится неверным.",
  example: "I enjoy reading before bed.",
  options: [
    "I enjoy reading before bed.",
    "I enjoy to read before bed.",
    "I enjoy read before bed.",
  ],
  correctOption: "I enjoy reading before bed.",
  explanation: "После enjoy используется герундий: enjoy + V-ing.",
  mistakeSentence: "I enjoy to read before bed.",
  mistakeWords: ["enjoy", "to", "read"],
  mistakeErrorIndex: 1,
};

const passiveIntro: IntroStep = {
  kind: "intro",
  introType: "context",
  introHeading: "Выбери правильную форму пассивного залога",
  eyebrow: "Шаг 1 · Контекст",
  title: "Кто это сделал?",
  lead: "В новости важно само действие, а не исполнитель. Какая фраза подходит?",
  example: "The bridge was built in 1998.",
  options: [
    "The bridge was built in 1998.",
    "The bridge built in 1998.",
    "The bridge is build in 1998.",
  ],
  correctOption: "The bridge was built in 1998.",
  explanation: "Пассив: be + V3. Для прошлого используем was/were + V3.",
};

const relativeIntro: IntroStep = {
  kind: "intro",
  introType: "comparison",
  comparisonTask: true,
  eyebrow: "Шаг 1 · Сравнение",
  title: "Два предложения — одно",
  lead: "Сравни два предложения и выбери объяснение разницы.",
  example: "The man who lives next door.",
  options: [
    "В первом предложении информация ограничивает, о каком мужчине речь, поэтому запятые не нужны. Во втором она дополнительная и выделяется запятыми.",
    "Оба предложения означают одно и то же, а запятые ничего не меняют.",
    "Во втором предложении who использовать нельзя, потому что после запятой нужен which.",
  ],
  correctOption:
    "В первом предложении информация ограничивает, о каком мужчине речь, поэтому запятые не нужны. Во втором она дополнительная и выделяется запятыми.",
  explanation:
    "The man who lives next door — defining: информация необходима. The man, who lives next door, — non-defining: информация дополнительная, поэтому нужны запятые.",
  comparison: {
    first: "The man who lives next door.",
    second: "The man, who lives next door.",
  },
};

const reportedIntro: IntroStep = {
  kind: "intro",
  introType: "scenario",
  eyebrow: "Шаг 1 · Ситуация",
  title: "Передай чужие слова",
  lead: "Друг сказал: «I am tired». Как передать это в косвенной речи?",
  example: "He said that he was tired.",
  options: [
    "He said that he was tired.",
    "He said that he is tired.",
    "He said that he were tired.",
  ],
  correctOption: "He said that he was tired.",
  explanation:
    "После said в прошедшем времени Present Simple обычно сдвигается в Past Simple.",
  scenario: "Ты пересказываешь разговор другу.",
};

export const CONDITIONALS_COURSE: readonly CourseStep[] = [
  conditionalsIntro,
  theory(
    "Теория · First",
    "Реальное условие",
    [
      "First Conditional описывает реальную возможность в настоящем или будущем и её вероятный результат.",
      "Формула: If + Present Simple, ... will + V.",
      "В части с if не ставим will: If it rains, а не If it will rain.",
    ],
    [
      {
        en: "If it rains, I will stay at home.",
        ru: "Если пойдёт дождь, я останусь дома.",
      },
      {
        en: "If she studies, she will pass the exam.",
        ru: "Если она будет заниматься, она сдаст экзамен.",
      },
    ],
    "If + Present Simple → will + V.",
  ),
  {
    kind: "formula",
    eyebrow: "Формула · First",
    title: "If + Present Simple, will + V",
    lines: [
      {
        label: "Условие",
        formula: "If + Present Simple",
        example: "If it rains...",
      },
      {
        label: "Результат",
        formula: "will + V",
        example: "...we will stay at home.",
      },
    ],
    note: "Will стоит только в главной части, не после if.",
  },
  practice(0),
  practice(2),
  practice(6),
  theory(
    "Теория · Second",
    "Воображаемое настоящее",
    [
      "Second Conditional описывает воображаемую или маловероятную ситуацию в настоящем или будущем.",
      "Формула: If + Past Simple, ... would + V.",
      "В Second Conditional для всех лиц часто используется were: If I were you.",
    ],
    [
      {
        en: "If I had a million dollars, I would buy a yacht.",
        ru: "Если бы у меня был миллион долларов, я бы купил яхту.",
      },
      {
        en: "If I were you, I would apologize.",
        ru: "На твоём месте я бы извинился.",
      },
    ],
    "If + Past Simple → would + V. Это не реальный план, а воображение.",
  ),
  {
    kind: "formula",
    eyebrow: "Формула · Second",
    title: "If + Past Simple, would + V",
    lines: [
      {
        label: "Условие",
        formula: "If + Past Simple",
        example: "If I had more time...",
      },
      {
        label: "Результат",
        formula: "would + V",
        example: "...I would learn the piano.",
      },
    ],
    note: "Were часто используется для всех лиц: If I were you.",
  },
  practice(1),
  practice(3),
  practice(5),
  theory(
    "Теория · Zero",
    "Факты и законы природы",
    [
      "Zero Conditional используется для общеизвестных фактов, законов природы и привычных действий, где результат всегда следует из условия.",
      "Формула: If + Present Simple, ... Present Simple.",
      "В обеих частях стоит настоящее время: If you heat ice, it melts.",
    ],
    [
      {
        en: "If you heat ice, it melts.",
        ru: "Если нагреть лёд, он тает.",
      },
      {
        en: "If I drink coffee late, I don't sleep well.",
        ru: "Если я пью кофе поздно, я плохо сплю.",
      },
    ],
    "Это факт, а не план и не воображаемая ситуация — поэтому will не нужен.",
  ),
  practice(4),
  {
    kind: "matching",
    eyebrow: "Соедини",
    title: "Условие и результат",
    instruction: "Подбери продолжение к каждой ситуации.",
    pairs: [
      { left: "If it rains,", right: "I will stay at home." },
      { left: "If I were you,", right: "I would apologize." },
      { left: "If she won the lottery,", right: "she would travel." },
      { left: "If you heat ice,", right: "it melts." },
    ],
    rightOptions: [
      "it melts.",
      "I would apologize.",
      "I will stay at home.",
      "she would travel.",
    ],
  },
  {
    kind: "sorting",
    eyebrow: "Разложи",
    title: "First, Second или Zero?",
    instruction: "Определи тип условного предложения.",
    categories: ["First Conditional", "Second Conditional", "Zero Conditional"],
    items: [
      {
        text: "If it rains, we will cancel the picnic.",
        category: "First Conditional",
        explanation: "Реальная возможность в будущем: Present Simple + will.",
      },
      {
        text: "If I had more time, I would learn the piano.",
        category: "Second Conditional",
        explanation: "Воображаемая ситуация: Past Simple + would.",
      },
      {
        text: "If you heat ice, it melts.",
        category: "Zero Conditional",
        explanation: "Закон природы: Present Simple + Present Simple.",
      },
      {
        text: "If I were rich, I would travel the world.",
        category: "Second Conditional",
        explanation: "Нереальное настоящее: were + would.",
      },
    ],
  },
  theory(
    "Теория · Ошибки",
    "Чего не должно быть в части с if",
    [
      "Нельзя ставить will или would в часть с if. Будущее и воображаемый результат выражаются в главной части.",
      "Сравни: неправильно «If it will rain», правильно «If it rains».",
    ],
    [
      {
        en: "If I had money, I would buy it.",
        ru: "Если бы у меня были деньги, я бы это купил.",
      },
      {
        en: "If it rains, we will stay at home.",
        ru: "Если пойдёт дождь, мы останемся дома.",
      },
    ],
    "If + Present Simple → will; If + Past Simple → would.",
  ),
  {
    kind: "dialogue",
    eyebrow: "Диалог",
    title: "Планы под вопросом",
    instruction: "Выбери естественные ответы.",
    speakerA: "Mia",
    speakerB: "You",
    turns: [
      {
        line: "What will you do if the weather is bad?",
        options: [
          "I will stay at home and read.",
          "I would stayed at home.",
          "I will stayed at home.",
        ],
        correctOption: "I will stay at home and read.",
        explanation: "First Conditional: will + инфинитив без to.",
      },
      {
        line: "And if you had a free week?",
        options: [
          "I would visit my family.",
          "I will visited my family.",
          "I would visited my family.",
        ],
        correctOption: "I would visit my family.",
        explanation: "Воображаемая ситуация: would + инфинитив.",
      },
    ],
  },
  {
    kind: "word-order",
    eyebrow: "Собери фразу",
    title: "Собери условное предложение",
    russian: "Если я увижу её, я скажу ей.",
    words: ["If", "I", "see", "her", "I", "will", "tell", "her"],
    initialWords: ["I", "If", "will", "her", "see", "I", "her", "tell"],
    correct: ["If", "I", "see", "her", "I", "will", "tell", "her"],
  },
  {
    kind: "pre-test",
    eyebrow: "Перед финальным тестом",
    title: "Урок почти пройден",
    lead: "Сначала повтори First, Second и Zero отдельно, затем проверь себя.",
    summary: [
      { label: "First", text: "If + Present Simple, ... will + V." },
      { label: "Second", text: "If + Past Simple, ... would + V." },
      { label: "Zero", text: "If + Present Simple, ... Present Simple." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Финальный тест",
    title: "Проверь себя",
    questionIndices: [6, 7],
    extraQuestions: NEW_TEST_QUESTIONS.get("conditionals_1_2") ?? [],
  },
  {
    kind: "result",
    eyebrow: "Итог",
    title: "Условия под контролем",
    lead: "Ты различаешь реальные, воображаемые и фактические условия и уверенно строишь First, Second и Zero Conditional.",
    formula: [
      "First: If + Present Simple, will + V",
      "Second: If + Past Simple, would + V",
      "Zero: If + Present Simple, Present Simple",
    ],
  },
];
export const CONDITIONALS_MIXED_COURSE: readonly CourseStep[] = [
  conditionalsThreeIntro,
  theory(
    "Теория · Third",
    "Воображаемое прошлое",
    [
      "Third Conditional говорит о нереальной ситуации в прошлом и её воображаемом результате. Часто так выражают сожаление или критику.",
      "Формула: If + Past Perfect, ... would have + V3.",
      "В отличие от Second Conditional, который относится к настоящему или будущему, третий тип смотрит назад.",
    ],
    [
      {
        en: "If I had studied harder, I would have passed.",
        ru: "Если бы я учился усерднее, я бы сдал.",
      },
      {
        en: "If we had left earlier, we wouldn't have missed the film.",
        ru: "Если бы мы вышли раньше, мы бы не опоздали на фильм.",
      },
    ],
    "had + V3 в условии; would have + V3 в результате.",
  ),
  {
    kind: "formula",
    eyebrow: "Формула · Third",
    title: "If + Past Perfect, would have + V3",
    lines: [
      {
        label: "Условие",
        formula: "If + had + V3",
        example: "If I had known...",
      },
      {
        label: "Результат",
        formula: "would have + V3",
        example: "...I would have called.",
      },
    ],
    note: "И условие, и результат относятся к прошлому.",
  },
  practice(0),
  practice(1),
  practice(4),
  theory(
    "Теория · Mixed",
    "Смешанные типы",
    [
      "Mixed Conditional связывает разные времена в условии и результате.",
      "Прошлое условие → настоящее следствие: If + Past Perfect, ... would + V.",
      "Настоящее условие → прошлое следствие: If + Past Simple, ... would have + V3.",
    ],
    [
      {
        en: "If I had saved money, I would be rich now.",
        ru: "Если бы я накопил денег, сейчас я был бы богат.",
      },
      {
        en: "If I were more careful, I wouldn't have made that mistake.",
        ru: "Если бы я был внимательнее, я бы не сделал ту ошибку.",
      },
    ],
    "Смотри, к какому времени относится условие, а к какому — результат.",
  ),
  {
    kind: "formula",
    eyebrow: "Формула · Mixed",
    title: "Third и Mixed рядом",
    lines: [
      {
        label: "Third — всё в прошлом",
        formula: "If + had + V3, ... would have + V3",
        example: "If I had known, I would have called.",
      },
      {
        label: "Mixed — прошлое → настоящее",
        formula: "If + had + V3, ... would + V",
        example: "If I had studied, I would be a doctor now.",
      },
    ],
    note: "Смешанный тип связывает разные времена: условие в прошлом, результат в настоящем.",
  },
  practice(2),
  practice(3),
  practice(5),
  practice(7),
  {
    kind: "sorting",
    eyebrow: "Разложи",
    title: "Third или Mixed?",
    instruction: "Определи, какой тип условия перед тобой.",
    categories: ["Third Conditional", "Mixed Conditional"],
    items: [
      {
        text: "If I had seen him, I would have said hello.",
        category: "Third Conditional",
        explanation: "И условие, и результат относятся к прошлому.",
      },
      {
        text: "If I had gone to bed earlier, I wouldn't be tired now.",
        category: "Mixed Conditional",
        explanation: "Условие в прошлом, результат в настоящем.",
      },
      {
        text: "If they had booked earlier, they would have saved money.",
        category: "Third Conditional",
        explanation: "Оба действия в прошлом.",
      },
      {
        text: "If she had taken the job, she would live in London now.",
        category: "Mixed Conditional",
        explanation: "Прошлое условие + настоящее следствие.",
      },
    ],
  },
  {
    kind: "matching",
    eyebrow: "Соедини",
    title: "Прошлое и его результат",
    instruction: "Соедини условие с подходящим следствием.",
    pairs: [
      { left: "If I had known,", right: "I would have called." },
      { left: "If she had studied,", right: "she would have passed." },
      { left: "If I had slept,", right: "I wouldn't be tired now." },
      { left: "If we had left earlier,", right: "we wouldn't have missed the film." },
    ],
    rightOptions: [
      "I wouldn't be tired now.",
      "I would have called.",
      "we wouldn't have missed the film.",
      "she would have passed.",
    ],
  },
  {
    kind: "dialogue",
    eyebrow: "Диалог",
    title: "Разговор о выборе",
    instruction: "Выбери правильные формы.",
    speakerA: "Leo",
    speakerB: "You",
    turns: [
      {
        line: "Do you regret not studying medicine?",
        options: [
          "Yes, if I had studied, I would be a doctor now.",
          "Yes, if I studied, I would be a doctor now.",
          "Yes, if I had studied, I will be a doctor now.",
        ],
        correctOption: "Yes, if I had studied, I would be a doctor now.",
        explanation: "Mixed: Past Perfect в условии, would + V в настоящем результате.",
      },
      {
        line: "And what about the job you didn't take?",
        options: [
          "If I had taken it, I would have moved abroad.",
          "If I took it, I would have moved abroad.",
          "If I had taken it, I would moved abroad.",
        ],
        correctOption: "If I had taken it, I would have moved abroad.",
        explanation: "Third Conditional: would have + V3.",
      },
    ],
  },
  theory(
    "Теория · Ошибки",
    "Формы, которые ломают условие",
    [
      "В части с if не используется would have: правильно If I had known, а не If I would have known.",
      "В результате после would have нужна третья форма глагола: would have gone, а не would have went.",
    ],
    [
      {
        en: "If I had known, I would have told you.",
        ru: "Если бы я знал, я бы тебе сказал.",
      },
    ],
    "had + V3 в условии; would have + V3 в результате.",
  ),
  {
    kind: "word-order",
    eyebrow: "Собери фразу",
    title: "Собери сожаление",
    russian: "Если бы я знал, я бы пришёл раньше.",
    words: ["If", "I", "had", "known", "I", "would", "have", "come", "earlier"],
    initialWords: ["I", "would", "If", "known", "have", "I", "earlier", "had", "come"],
    correct: ["If", "I", "had", "known", "I", "would", "have", "come", "earlier"],
  },
  {
    kind: "pre-test",
    eyebrow: "Перед финальным тестом",
    title: "Урок почти пройден",
    lead: "Сначала повтори Third и Mixed отдельно, затем проверь себя на финальном тесте.",
    summary: [
      { label: "Third", text: "If + had + V3, ... would have + V3." },
      { label: "Mixed", text: "If + had + V3, ... would + V (прошлое → настоящее)." },
      { label: "Ошибка", text: "Нельзя If I would have known; правильно If I had known." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Финальный тест",
    title: "Проверь себя",
    questionIndices: [6, 7],
    extraQuestions: NEW_TEST_QUESTIONS.get("conditionals_3_mixed") ?? [],
  },
  {
    kind: "result",
    eyebrow: "Итог",
    title: "Прошлое больше не путает",
    lead: "Ты видишь разницу между Third и Mixed Conditional и умеешь говорить о сожалениях.",
    formula: [
      "Third: If + Past Perfect, would have + V3",
      "Mixed: If + Past Perfect, would + V",
      "Результат в прошлом или настоящем?",
    ],
  },
];
export const GERUNDS_INFINITIVES_COURSE: readonly CourseStep[] = [
  gerundsIntro,
  theory(
    "Теория · Только -ing или только to",
    "Две группы глаголов",
    [
      "После enjoy, avoid, finish, mind и suggest используется герундий: V-ing.",
      "После want, decide, hope, plan и promise используется инфинитив: to + V.",
      "Форму лучше запоминать вместе с глаголом: enjoy reading, decide to leave.",
    ],
    [
      { en: "I enjoy reading books.", ru: "Я люблю читать книги." },
      { en: "She decided to buy a new phone.", ru: "Она решила купить новый телефон." },
      { en: "He suggested going to the cinema.", ru: "Он предложил пойти в кино." },
    ],
    "Enjoy / avoid / finish / mind / suggest + V-ing. Want / decide / hope / plan / promise + to + V.",
  ),
  practice(0),
  practice(1),
  {
    kind: "formula",
    eyebrow: "Формулы",
    title: "Герундий или инфинитив",
    lines: [
      {
        label: "V + ing",
        formula: "enjoy / avoid / finish / mind / suggest + V-ing",
        example: "I enjoy reading. She suggested going out.",
      },
      {
        label: "V + to",
        formula: "decide / promise / plan / hope + to + V",
        example: "They decided to leave.",
      },
    ],
    note: "Некоторые глаголы меняют смысл: stop smoking — бросить, stop to smoke — остановиться, чтобы закурить.",
  },
  {
    kind: "matching",
    eyebrow: "Соедини",
    title: "Глагол и форма",
    instruction: "Подбери правильное продолжение.",
    pairs: [
      { left: "I enjoy", right: "listening to music." },
      { left: "She promised", right: "to help me." },
      { left: "You should avoid", right: "eating too much sugar." },
      { left: "They decided", right: "not to go on holiday." },
    ],
    rightOptions: [
      "to help me.",
      "eating too much sugar.",
      "not to go on holiday.",
      "listening to music.",
    ],
  },
  {
    kind: "sorting",
    eyebrow: "Разложи",
    title: "-ing или to + V?",
    instruction: "Распредели глаголы по форме, которую они требуют.",
    categories: ["+ V-ing", "+ to + V"],
    items: [
      {
        text: "enjoy",
        category: "+ V-ing",
        explanation: "I enjoy swimming.",
      },
      {
        text: "decide",
        category: "+ to + V",
        explanation: "We decided to stay.",
      },
      {
        text: "avoid",
        category: "+ V-ing",
        explanation: "Avoid making noise.",
      },
      {
        text: "promise",
        category: "+ to + V",
        explanation: "He promised to call.",
      },
      {
        text: "mind",
        category: "+ V-ing",
        explanation: "Do you mind waiting?",
      },
      {
        text: "hope",
        category: "+ to + V",
        explanation: "I hope to see you.",
      },
    ],
  },
  practice(2),
  practice(3),
  theory(
    "Теория · Смысл",
    "Глаголы, которые меняют значение",
    [
      "stop doing — перестать делать; stop to do — остановиться, чтобы сделать.",
      "remember doing — помнить, что уже сделал; remember to do — не забыть сделать.",
      "try doing — попробовать способ; try to do — пытаться сделать.",
      "forget doing — забыть, что делал; forget to do — забыть сделать что-то.",
    ],
    [
      { en: "He stopped smoking two years ago.", ru: "Он бросил курить." },
      { en: "He stopped to smoke.", ru: "Он остановился, чтобы закурить." },
      { en: "Remember to buy milk.", ru: "Не забудь купить молоко." },
      { en: "I remember locking the door.", ru: "Я помню, что запер дверь." },
    ],
    "Перед ответом определи: действие уже было или его ещё нужно выполнить.",
  ),
  practice(4),
  practice(5),
  {
    kind: "dialogue",
    eyebrow: "Диалог",
    title: "Планы и привычки",
    instruction: "Выбери правильную форму после глагола.",
    speakerA: "Nina",
    speakerB: "You",
    turns: [
      {
        line: "Do you enjoy cooking?",
        options: [
          "Yes, I love trying new recipes.",
          "Yes, I love to trying new recipes.",
          "Yes, I enjoy to cook.",
        ],
        correctOption: "Yes, I love trying new recipes.",
        explanation: "Enjoy/love можно использовать с V-ing; после enjoy — только V-ing.",
      },
      {
        line: "Have you decided what to do next?",
        options: [
          "I decided to take a break.",
          "I decided taking a break.",
          "I decided take a break.",
        ],
        correctOption: "I decided to take a break.",
        explanation: "Decide требует to + инфинитив.",
      },
    ],
  },
  {
    kind: "word-order",
    eyebrow: "Собери фразу",
    title: "Собери предложение",
    russian: "Она предложила пойти в кино.",
    words: ["She", "suggested", "going", "to", "the", "cinema"],
    initialWords: ["going", "She", "the", "suggested", "cinema", "to"],
    correct: ["She", "suggested", "going", "to", "the", "cinema"],
  },
  {
    kind: "pre-test",
    eyebrow: "Перед финальным тестом",
    title: "Урок почти пройден",
    lead: "Сначала повтори две группы глаголов и случаи, где форма меняет смысл.",
    summary: [
      { label: "Только -ing", text: "enjoy, avoid, finish, mind, suggest + V-ing." },
      { label: "Только to", text: "want, decide, hope, plan, promise + to + V." },
      { label: "Смысл", text: "stop / remember / try / forget: V-ing и to + V дают разные значения." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Финальный тест",
    title: "Проверь себя",
    questionIndices: [6, 7],
    extraQuestions: NEW_TEST_QUESTIONS.get("gerunds_infinitives") ?? [],
  },
  {
    kind: "result",
    eyebrow: "Итог",
    title: "Формы после глаголов",
    lead: "Ты знаешь, когда нужен герундий, а когда — инфинитив, и замечаешь разницу в смысле.",
    formula: [
      "enjoy / avoid / finish / mind + V-ing",
      "decide / promise / plan / hope + to + V",
      "stop + V-ing ≠ stop + to + V",
    ],
  },
];

export const PASSIVE_VOICE_COURSE: readonly CourseStep[] = buildCourse({
  topic: "passive_voice",
  intro: passiveIntro,
  theory: [
    theory(
      "Теория · Когда",
      "Зачем нужен пассив",
      [
        "В активном залоге мы говорим, кто совершает действие: Someone stole my car.",
        "В пассивном залоге внимание переносится на объект, а исполнитель часто неизвестен или неважен: My car was stolen.",
        "Пассив выбирают, когда не знают исполнителя, не хотят его называть или хотят подчеркнуть само действие и его результат.",
      ],
      [
        {
          en: "Someone stole my car. → My car was stolen.",
          ru: "Фокус смещается с вора на машину и факт кражи.",
        },
        {
          en: "My bike was stolen.",
          ru: "Мой велосипед украли.",
        },
        {
          en: "The road is being repaired.",
          ru: "Дорогу ремонтируют.",
        },
      ],
    ),
    theory(
      "Теория · Формула",
      "Be + V3",
      [
        "Основная модель пассивного залога: be + глагол в третьей форме (V3).",
        "Форма be зависит от времени: am/is/are, was/were, is being, will be.",
        "В некоторых конструкциях встречается get + V3: He got injured.",
      ],
      [
        {
          en: "English is spoken all over the world.",
          ru: "На английском говорят по всему миру.",
        },
        {
          en: "The house was built in 1990.",
          ru: "Дом был построен в 1990 году.",
        },
        {
          en: "The letters will be sent tomorrow.",
          ru: "Письма отправят завтра.",
        },
      ],
    ),
    theory(
      "Теория · Преобразование",
      "Как сделать пассив",
      [
        "Нужно поменять местами подлежащее и дополнение, а глагол поставить в нужную форму be + V3.",
        "Актив: They built this house in 1990. Пассив: This house was built in 1990.",
        "Нельзя оставлять только причастие: The book written — ошибка, нужна форма be.",
      ],
      [
        {
          en: "The book was written by him.",
          ru: "Книга была написана им.",
        },
      ],
      "Проверяйте, что в предложении есть be в нужном времени.",
    ),
  ],
  formula: {
    kind: "formula",
    eyebrow: "Шаг 2 · Формулы",
    title: "Be + V3",
    lines: [
      {
        label: "Present",
        formula: "am / is / are + V3",
        example: "The letters are sent every day.",
      },
      {
        label: "Past",
        formula: "was / were + V3",
        example: "The house was built in 1990.",
      },
      {
        label: "Future",
        formula: "will be + V3",
        example: "The results will be announced tomorrow.",
      },
    ],
    note: "Present Continuous Passive: is / are being + V3.",
  },
  matching: {
    kind: "matching",
    eyebrow: "Шаг 3 · Соедини",
    title: "Время и пассив",
    instruction: "Подбери пассивную форму к времени.",
    pairs: [
      { left: "Present Simple", right: "is spoken" },
      { left: "Past Simple", right: "was written" },
      { left: "Future Simple", right: "will be sent" },
      { left: "Present Continuous", right: "is being fixed" },
    ],
    rightOptions: ["will be sent", "is being fixed", "is spoken", "was written"],
  },
  sorting: {
    kind: "sorting",
    eyebrow: "Шаг 6 · Разложи",
    title: "Актив или пассив?",
    instruction: "Определи залог предложения.",
    categories: ["Active", "Passive"],
    items: [
      {
        text: "The chef cooked dinner.",
        category: "Active",
        explanation: "Подлежащее само выполняет действие.",
      },
      {
        text: "Dinner was cooked by the chef.",
        category: "Passive",
        explanation: "Be + V3, действие направлено на подлежащее.",
      },
      {
        text: "They will publish the book.",
        category: "Active",
        explanation: "They — исполнитель действия.",
      },
      {
        text: "The book will be published.",
        category: "Passive",
        explanation: "Will be + V3.",
      },
    ],
  },
  dialogue: {
    kind: "dialogue",
    eyebrow: "Шаг 9 · Диалог",
    title: "Новости и объявления",
    instruction: "Выбери естественную пассивную форму.",
    speakerA: "Alex",
    speakerB: "You",
    turns: [
      {
        line: "When will the results be ready?",
        options: [
          "They will be announced tomorrow.",
          "They will announce tomorrow.",
          "They are announced tomorrow.",
        ],
        correctOption: "They will be announced tomorrow.",
        explanation: "Future Passive: will be + V3.",
      },
      {
        line: "Why can't we use the office?",
        options: [
          "It is being repaired at the moment.",
          "It is repairing at the moment.",
          "It repairs at the moment.",
        ],
        correctOption: "It is being repaired at the moment.",
        explanation: "Present Continuous Passive: is being + V3.",
      },
    ],
  },
  wordOrder: {
    kind: "word-order",
    eyebrow: "Шаг 11 · Собери фразу",
    title: "Собери пассив",
    russian: "Письмо было отправлено вчера.",
    words: ["The", "letter", "was", "sent", "yesterday"],
    initialWords: ["sent", "The", "yesterday", "was", "letter"],
    correct: ["The", "letter", "was", "sent", "yesterday"],
  },
  result: {
    kind: "result",
    eyebrow: "Шаг 14 · Итог",
    title: "Пассив больше не пугает",
    lead: "Ты умеешь строить пассив в настоящем, прошлом и будущем и понимать, когда он уместен.",
    formula: [
      "be + V3",
      "was / were + V3 — прошлое",
      "will be + V3 — будущее",
      "is being + V3 — прямо сейчас",
    ],
  },
});

export const RELATIVE_CLAUSES_COURSE: readonly CourseStep[] = buildCourse({
  topic: "relative_clauses",
  intro: relativeIntro,
  theory: [
    theory(
      "Теория · Зачем",
      "Два предложения в одно",
      [
        "Relative Clauses помогают соединить два предложения в одно и добавить информацию о человеке или предмете.",
        "Вместо «I met a man. He lives next door» говорим «I met a man who lives next door».",
        "Относительное слово заменяет повторяющееся существительное или местоимение.",
      ],
      [
        {
          en: "I met a man who lives next door.",
          ru: "Я познакомился с мужчиной, который живёт по соседству.",
        },
      ],
    ),
    theory(
      "Теория · Слова",
      "Who, which, that, whose, where",
      [
        "Who — для людей; which — для предметов и животных.",
        "That может заменять who или which в ограничительных предложениях.",
        "Whose — для принадлежности; where — для места действия.",
        "Вместо where можно использовать which/that с предлогом в конце: the city which I was born in.",
        "В defining relative clauses местоимение-дополнение можно опустить: The book (that) I bought yesterday is excellent.",
      ],
      [
        {
          en: "The girl who is singing is my sister.",
          ru: "Девушка, которая поёт, — моя сестра.",
        },
        {
          en: "The book which is on the table is mine.",
          ru: "Книга, которая лежит на столе, моя.",
        },
        {
          en: "The boy whose father is a doctor.",
          ru: "Мальчик, чей отец врач.",
        },
      ],
    ),
    theory(
      "Теория · Запятые",
      "Defining и non-defining",
      [
        "Defining-предложение содержит информацию, без которой смысл меняется. Запятые не ставятся, that допустим.",
        "Non-defining-предложение добавляет дополнительную информацию и выделяется запятыми; that в нём не используется.",
        "Сравните: The man who called you — ограничительное; My brother, who lives in London, — дополнительное.",
      ],
      [
        {
          en: "My brother, who lives in London, is a doctor.",
          ru: "Мой брат, который живёт в Лондоне, врач.",
        },
      ],
      "Для людей — who, для предметов — which; не путайте их.",
    ),
  ],
  formula: {
    kind: "formula",
    eyebrow: "Шаг 2 · Формулы",
    title: "Who, which, whose, where",
    lines: [
      {
        label: "Люди",
        formula: "who / that",
        example: "The woman who lives here is a doctor.",
      },
      {
        label: "Предметы",
        formula: "which / that",
        example: "The book which I bought is interesting.",
      },
      {
        label: "Принадлежность",
        formula: "whose",
        example: "The girl whose father is a pilot.",
      },
      {
        label: "Место",
        formula: "where",
        example: "The house where we lived.",
      },
    ],
  },
  matching: {
    kind: "matching",
    eyebrow: "Шаг 3 · Соедини",
    title: "Кого или что описываем?",
    instruction: "Подбери относительное слово.",
    pairs: [
      { left: "The woman ___ lives next door", right: "who" },
      { left: "The book ___ I bought", right: "which" },
      { left: "The girl ___ father is a pilot", right: "whose" },
      { left: "The house ___ we lived", right: "where" },
    ],
    rightOptions: ["where", "whose", "who", "which"],
  },
  sorting: {
    kind: "sorting",
    eyebrow: "Шаг 6 · Разложи",
    title: "Who, which, whose или where?",
    instruction: "Распредели слова по смыслу.",
    categories: ["People", "Things", "Possession", "Places"],
    items: [
      {
        text: "the man ___ called you",
        category: "People",
        explanation: "Для человека — who.",
      },
      {
        text: "the car ___ was stolen",
        category: "Things",
        explanation: "Для предмета — which.",
      },
      {
        text: "the girl ___ brother is famous",
        category: "Possession",
        explanation: "Чья-то принадлежность — whose.",
      },
      {
        text: "the house ___ we lived",
        category: "Places",
        explanation: "Для места — where.",
      },
    ],
  },
  dialogue: {
    kind: "dialogue",
    eyebrow: "Шаг 9 · Диалог",
    title: "Опиши подробнее",
    instruction: "Выбери правильное относительное слово.",
    speakerA: "Sam",
    speakerB: "You",
    turns: [
      {
        line: "Who is that woman?",
        options: [
          "She's the artist who painted this mural.",
          "She's the artist which painted this mural.",
          "She's the artist whose painted this mural.",
        ],
        correctOption: "She's the artist who painted this mural.",
        explanation: "Для людей используем who.",
      },
      {
        line: "Is this the book you told me about?",
        options: [
          "Yes, it's the book which won the award.",
          "Yes, it's the book who won the award.",
          "Yes, it's the book where won the award.",
        ],
        correctOption: "Yes, it's the book which won the award.",
        explanation: "Для предметов — which (или that).",
      },
    ],
  },
  wordOrder: {
    kind: "word-order",
    eyebrow: "Шаг 11 · Собери фразу",
    title: "Собери описание",
    russian: "Это дом, где мы жили.",
    words: ["This", "is", "the", "house", "where", "we", "lived"],
    initialWords: ["house", "This", "we", "where", "is", "lived", "the"],
    correct: ["This", "is", "the", "house", "where", "we", "lived"],
  },
  result: {
    kind: "result",
    eyebrow: "Шаг 14 · Итог",
    title: "Связываем мысли",
    lead: "Ты умеешь соединять два предложения в одно и выбирать who, which, whose или where.",
    formula: [
      "People → who",
      "Things → which / that",
      "Possession → whose",
      "Places → where",
    ],
  },
});

export const REPORTED_SPEECH_COURSE: readonly CourseStep[] = buildCourse({
  topic: "reported_speech",
  intro: reportedIntro,
  theory: [
    theory(
      "Теория · Когда",
      "Своими словами, а не дословно",
      [
        "Reported Speech используется, когда мы передаём слова другого человека своими словами.",
        "Прямая речь: He said, «I am tired». Косвенная: He said (that) he was tired.",
        "После said/told часто ставится that, но в разговорной речи его можно опустить.",
      ],
      [
        {
          en: "She said that she was busy.",
          ru: "Она сказала, что была занята.",
        },
      ],
    ),
    theory(
      "Теория · Backshift",
      "Сдвиг времён",
      [
        "Если вводный глагол в прошедшем времени, время обычно сдвигается назад.",
        "Present Simple → Past Simple; Present Continuous → Past Continuous; Past Simple → Past Perfect; will → would; can → could.",
        "Сдвиг можно не делать, если информация остаётся актуальной или речь об общеизвестном факте.",
      ],
      [
        {
          en: "«I am tired.» → He said he was tired.",
          ru: "«Я устал». → Он сказал, что устал.",
        },
        {
          en: "«I bought a car.» → He said he had bought a car.",
          ru: "«Я купил машину». → Он сказал, что купил машину.",
        },
      ],
    ),
    theory(
      "Теория · Детали",
      "Местоимения и указатели времени",
      [
        "При изменении точки отсчёта меняются местоимения: I → he/she, my → his/her, we → they, our → their.",
        "Меняются указатели времени и места: today → that day, tomorrow → the next day, yesterday → the day before, here → there, this → that.",
        "Пример: «I will call you tomorrow,» said Tom. → Tom said he would call me the next day.",
        "Сдвиг времени не обязателен, если информация остаётся актуальной или речь идёт об общеизвестном факте.",
      ],
      [
        {
          en: "«I am busy today.» → She said she was busy that day.",
          ru: "I → she, am → was, today → that day.",
        },
        {
          en: "«I will call you tomorrow.» → He said he would call me the next day.",
          ru: "I → he, will → would, tomorrow → the next day.",
        },
        {
          en: "«We bought this car yesterday.» → They said they had bought that car the day before.",
          ru: "We → they, bought → had bought, this → that, yesterday → the day before.",
        },
      ],
      "Смотрите, изменилась ли точка отсчёта: сегодня, завтра, вчера и здесь могут стать that day, the next day, the day before и there.",
    ),
  ],
  finalTheory: [
    theory(
      "Теория · Say / Tell",
      "Перед practice: say или tell?",
      [
        "Tell требует дополнения — кому сказали: He told me that he was busy.",
        "Say не требует дополнения: He said that he was busy. Можно сказать He said to me that...",
        "Нельзя говорить He told that... — после tell нужно указать человека.",
      ],
      [
        {
          en: "She told me she was tired.",
          ru: "Она сказала мне, что устала.",
        },
        {
          en: "She said that she was tired.",
          ru: "Она сказала, что устала.",
        },
      ],
      "Tell + somebody + that...; say + (that)...",
    ),
  ],
  formula: {
    kind: "formula",
    eyebrow: "Шаг 2 · Формулы",
    title: "Сдвиг времён",
    lines: [
      {
        label: "Present → Past",
        formula: "am / is → was, do → did",
        example: "“I am busy.” → He said he was busy.",
      },
      {
        label: "Past → Past Perfect",
        formula: "bought → had bought",
        example: "“I bought a car.” → He said he had bought a car.",
      },
      {
        label: "Will → Would",
        formula: "will → would, can → could",
        example: "“I will call.” → He said he would call.",
      },
    ],
    note: "Say + that, tell + somebody + that.",
  },
  matching: {
    kind: "matching",
    eyebrow: "Шаг 3 · Соедини",
    title: "Прямая и косвенная речь",
    instruction: "Сопоставь прямую речь с косвенной.",
    pairs: [
      { left: "“I am tired.”", right: "He said he was tired." },
      { left: "“I will call you.”", right: "He said he would call me." },
      { left: "“I bought a car.”", right: "He said he had bought a car." },
      { left: "“I don't like coffee.”", right: "He said he didn't like coffee." },
    ],
    rightOptions: [
      "He said he had bought a car.",
      "He said he was tired.",
      "He said he didn't like coffee.",
      "He said he would call me.",
    ],
  },
  sorting: {
    kind: "sorting",
    eyebrow: "Шаг 6 · Разложи",
    title: "Какое время стало каким?",
    instruction: "Определи направление сдвига.",
    categories: ["Present → Past", "Past → Perfect", "Will → Would"],
    items: [
      {
        text: "am → was",
        category: "Present → Past",
        explanation: "Present Simple сдвигается в Past Simple.",
      },
      {
        text: "bought → had bought",
        category: "Past → Perfect",
        explanation: "Past Simple сдвигается в Past Perfect.",
      },
      {
        text: "will → would",
        category: "Will → Would",
        explanation: "Будущее сдвигается в would.",
      },
      {
        text: "are going → were going",
        category: "Present → Past",
        explanation: "Present Continuous сдвигается в Past Continuous.",
      },
    ],
  },
  dialogue: {
    kind: "dialogue",
    eyebrow: "Шаг 9 · Диалог",
    title: "Пересказ разговора",
    instruction: "Выбери правильную форму в косвенной речи.",
    speakerA: "Kate",
    speakerB: "You",
    turns: [
      {
        line: "What did he say?",
        options: [
          "He said he was going to be late.",
          "He said he is going to be late.",
          "He said he will be late.",
        ],
        correctOption: "He said he was going to be late.",
        explanation: "После said в прошлом — сдвиг времени.",
      },
      {
        line: "Did she say she could help?",
        options: [
          "Yes, she said she could help.",
          "Yes, she said she can help.",
          "Yes, she said she could helped.",
        ],
        correctOption: "Yes, she said she could help.",
        explanation: "Can сдвигается в could, модальный + инфинитив.",
      },
    ],
  },
  wordOrder: {
    kind: "word-order",
    eyebrow: "Шаг 11 · Собери фразу",
    title: "Собери косвенную речь",
    russian: "Он сказал, что купил машину.",
    words: ["He", "said", "that", "he", "had", "bought", "a", "car"],
    initialWords: ["said", "He", "bought", "car", "he", "a", "had", "that"],
    correct: ["He", "said", "that", "he", "had", "bought", "a", "car"],
  },
  additionalPractice: [
    {
      kind: "practice",
      eyebrow: "Практика · Вопрос",
      customQuestion: {
        id: "reported-question-practice",
        prompt:
          'He asked me, "Where do you live?" → He asked me where ___.',
        options: ["I lived", "did I live", "I live", "do I live"],
        correctAnswer: "I lived",
        explanation:
          "В косвенном вопросе прямой порядок слов и сдвиг времени: where I lived. Вспомогательный did больше не нужен.",
      },
    },
    {
      kind: "practice",
      eyebrow: "Практика · Приказ",
      customQuestion: {
        id: "reported-command-practice",
        prompt: 'He told me, "Don\'t touch it." → He told me ___ it.',
        options: ["not to touch", "to not touch", "don't touch", "not touch"],
        correctAnswer: "not to touch",
        explanation:
          "Отрицательный приказ передаётся через tell + somebody + not to + V: He told me not to touch it.",
      },
    },
  ],
  result: {
    kind: "result",
    eyebrow: "Шаг 14 · Итог",
    title: "Пересказываешь уверенно",
    lead: "Ты умеешь передавать чужие слова и правильно сдвигать времена.",
    formula: [
      "Present → Past",
      "Past → Past Perfect",
      "will → would, can → could",
      "say that / tell somebody that",
    ],
  },
});
