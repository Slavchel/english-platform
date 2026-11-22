import type { CourseStep } from "./course";

type IntroStep = Extract<CourseStep, { kind: "intro" }>;
type TheoryStep = Extract<CourseStep, { kind: "theory" }>;

const pastPerfectIntro: IntroStep = {
  kind: "intro",
  introType: "scenario",
  eyebrow: "Шаг 1 · Ситуация",
  title: "Что случилось раньше?",
  lead: "Ты пришёл в кино, но фильм уже начался. Какая фраза передаёт последовательность?",
  example: "When I arrived, the film had started.",
  options: [
    "When I arrived, the film had started.",
    "When I arrived, the film has started.",
    "When I arrived, the film was start.",
  ],
  correctOption: "When I arrived, the film had started.",
  explanation:
    "Фильм начался раньше прихода — для более раннего прошлого используем Past Perfect: had + V3.",
  scenario: "Ты опаздываешь на сеанс и видишь, что фильм уже идёт.",
};

function theory(
  eyebrow: string,
  title: string,
  paragraphs: readonly string[],
  examples?: readonly { en: string; ru: string }[],
  note?: string,
): TheoryStep {
  return { kind: "theory", eyebrow, title, paragraphs, examples, note };
}

const pastPerfectTheory: readonly TheoryStep[] = [
  theory(
    "Теория · Смысл",
    "Прошлое до прошлого",
    [
      "Past Perfect нужен, когда одно действие в прошлом произошло раньше другого действия в прошлом.",
      "Это не просто «давно»: важно, что действие завершилось до определённого момента или события в прошлом.",
      "Сравните: I watched the film — просто факт; I had watched the film before we discussed it — просмотр был раньше обсуждения.",
    ],
    [
      {
        en: "When I arrived, the film had started.",
        ru: "Когда я пришёл, фильм уже начался.",
      },
      {
        en: "She had finished the report before the meeting began.",
        ru: "Она закончила отчёт до начала встречи.",
      },
    ],
  ),
  theory(
    "Теория · Формула",
    "Had + V3 для всех лиц",
    [
      "Утверждение: had + третья форма глагола (V3) для всех лиц.",
      "Отрицание: hadn't + V3.",
      "Вопрос: Had + подлежащее + V3?",
    ],
    [
      {
        en: "They had left before we arrived.",
        ru: "Они ушли до нашего прихода.",
      },
      {
        en: "Had you seen him before that day?",
        ru: "Ты видел его до того дня?",
      },
    ],
    "V3 — это третья форма: see → seen, eat → eaten, build → built.",
  ),
  theory(
    "Теория · Маркеры",
    "Когда выбирать Past Perfect",
    [
      "Маркеры before, after, by the time, already, never, just помогают показать более раннее действие.",
      "После before и after возможен и Past Simple, но Past Perfect точнее подчёркивает завершённость к моменту в прошлом.",
      "Не используйте Present Perfect для прошлого: When I arrived, the film has started — ошибка.",
    ],
    [
      {
        en: "By the time we got there, the shop had closed.",
        ru: "К тому времени, как мы пришли, магазин уже закрылся.",
      },
    ],
    "Past Perfect = earlier past; Past Simple = later past.",
  ),
];

const pastPerfectCourse: readonly CourseStep[] = [
  pastPerfectIntro,
  ...pastPerfectTheory.slice(0, 1),
  {
    kind: "formula",
    eyebrow: "Формула",
    title: "Had + V3",
    lines: [
      {
        label: "Утверждение",
        formula: "had + V3",
        example: "She had left before I called.",
      },
      {
        label: "Отрицание",
        formula: "hadn't + V3",
        example: "They hadn't finished the work.",
      },
      {
        label: "Вопрос",
        formula: "Had + subject + V3?",
        example: "Had he seen the film before?",
      },
    ],
  },
  {
    kind: "matching",
    eyebrow: "Соедини",
    title: "Раньше или позже?",
    instruction: "Соедини действие с его результатом в прошлом.",
    pairs: [
      { left: "The train had left", right: "when we reached the station." },
      { left: "She had finished", right: "before the guests arrived." },
      { left: "I had forgotten", right: "my keys before I left." },
      { left: "They had built", right: "three schools by 2010." },
    ],
    rightOptions: [
      "three schools by 2010.",
      "my keys before I left.",
      "when we reached the station.",
      "before the guests arrived.",
    ],
  },
  ...pastPerfectTheory.slice(1, 2),
  {
    kind: "practice",
    eyebrow: "Практика · 1",
    questionIndex: 0,
  },
  {
    kind: "practice",
    eyebrow: "Практика · 2",
    questionIndex: 1,
  },
  ...pastPerfectTheory.slice(2, 3),
  {
    kind: "sorting",
    eyebrow: "Разложи",
    title: "Past Perfect или Past Simple?",
    instruction: "Определи, какое время уместно в предложении.",
    categories: ["Past Perfect", "Past Simple"],
    items: [
      {
        text: "By the time we arrived, the film ___ (start).",
        category: "Past Perfect",
        explanation: "Начало фильма раньше прихода — had started.",
      },
      {
        text: "We ___ (watch) the film yesterday.",
        category: "Past Simple",
        explanation: "Просто факт в прошлом — watched.",
      },
      {
        text: "She ___ (finish) the report before the meeting.",
        category: "Past Perfect",
        explanation: "Отчёт был закончен раньше встречи — had finished.",
      },
      {
        text: "They ___ (build) the house in 1990.",
        category: "Past Simple",
        explanation: "Конкретный факт в прошлом — built.",
      },
    ],
  },
  {
    kind: "practice",
    eyebrow: "Практика · 3",
    questionIndex: 2,
  },
  {
    kind: "practice",
    eyebrow: "Практика · 4",
    questionIndex: 3,
  },
  {
    kind: "dialogue",
    eyebrow: "Диалог",
    title: "Почему ты опоздал?",
    instruction: "Выбери естественные ответы с Past Perfect.",
    speakerA: "Mia",
    speakerB: "You",
    turns: [
      {
        line: "Why were you late for the meeting?",
        options: [
          "The bus had already left when I got to the stop.",
          "The bus has already left when I got to the stop.",
          "The bus was already leave when I got to the stop.",
        ],
        correctOption: "The bus had already left when I got to the stop.",
        explanation: "Автобус ушёл раньше — Past Perfect had left.",
      },
      {
        line: "Had you finished the report before the call?",
        options: [
          "Yes, I had finished it.",
          "Yes, I have finished it.",
          "Yes, I had finish it.",
        ],
        correctOption: "Yes, I had finished it.",
        explanation: "После had нужна третья форма: finished.",
      },
    ],
  },
  {
    kind: "practice",
    eyebrow: "Практика · 5",
    questionIndex: 4,
  },
  {
    kind: "word-order",
    eyebrow: "Собери фразу",
    title: "Собери предложение",
    russian: "Поезд уже ушёл, когда мы пришли.",
    words: ["The", "train", "had", "already", "left", "when", "we", "arrived"],
    initialWords: ["train", "already", "The", "when", "left", "we", "had", "arrived"],
    correct: ["The", "train", "had", "already", "left", "when", "we", "arrived"],
  },
  {
    kind: "practice",
    eyebrow: "Практика · 6",
    questionIndex: 5,
  },
  {
    kind: "pre-test",
    eyebrow: "Перед финальным тестом",
    title: "Урок почти пройден",
    lead: "Остался финальный тест для закрепления. Сначала коротко повтори главное — затем проверь себя на шести вопросах.",
    summary: [
      {
        label: "Смысл",
        text: "Past Perfect показывает действие, которое завершилось раньше другого прошлого действия.",
      },
      {
        label: "Формула",
        text: "had + V3 для всех лиц; отрицание hadn't + V3; вопрос Had + subject + V3?",
      },
      {
        label: "Маркеры",
        text: "before, after, by the time, already, never, just.",
      },
    ],
  },
  {
    kind: "test",
    eyebrow: "Финальный тест",
    title: "Финальный тест",
    questionIndices: [6, 7, 8, 9, 10, 11],
  },
  {
    kind: "result",
    eyebrow: "Итог",
    title: "Прошлое стало понятнее",
    lead: "Ты умеешь отличать Past Perfect от Past Simple и показывать, какое действие случилось раньше.",
    formula: [
      "Past Perfect: had + V3",
      "Отрицание: hadn't + V3",
      "Вопрос: Had + subject + V3?",
      "Past Perfect — раньше другого прошлого",
    ],
  },
];

export const PAST_PERFECT_COURSE = pastPerfectCourse;
