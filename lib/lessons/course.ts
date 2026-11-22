import {
  CONDITIONALS_COURSE,
  CONDITIONALS_MIXED_COURSE,
  GERUNDS_INFINITIVES_COURSE,
  PASSIVE_VOICE_COURSE,
  RELATIVE_CLAUSES_COURSE,
  REPORTED_SPEECH_COURSE,
} from "./advanced";
import { PAST_PERFECT_COURSE } from "./past-perfect";

export type IntroType =
  | "question"
  | "scenario"
  | "mistake"
  | "comparison"
  | "context";

export type CourseStep =
  | {
      kind: "intro";
      eyebrow: string;
      title: string;
      lead: string;
      example: string;
      options: readonly string[];
      correctOption: string;
      explanation: string;
      introType?: IntroType;
      introHeading?: string;
      scenario?: string;
      comparison?: { first: string; second: string };
      comparisonTask?: boolean;
      quote?: string;
      mistakeSentence?: string;
      mistakeWords?: readonly string[];
      mistakeErrorIndex?: number;
    }
  | {
      kind: "theory";
      eyebrow: string;
      title: string;
      paragraphs: readonly string[];
      examples?: readonly { en: string; ru: string }[];
      note?: string;
    }
  | {
      kind: "practice";
      eyebrow: string;
      questionIndex?: number;
      customQuestion?: CourseTestQuestion;
      example?: {
        text: string;
        explanation?: string;
      };
    }
  | {
      kind: "spot";
      eyebrow: string;
      title: string;
      instruction: string;
      sentence: string;
      words: readonly string[];
      errorIndex: number;
      explanation: string;
    }
  | {
      kind: "matching";
      eyebrow: string;
      title: string;
      instruction: string;
      pairs: readonly { left: string; right: string }[];
      rightOptions: readonly string[];
      successText?: string;
    }
  | {
      kind: "sorting";
      eyebrow: string;
      title: string;
      instruction: string;
      categories: readonly string[];
      items: readonly {
        text: string;
        category: string;
        explanation: string;
      }[];
    }
  | {
      kind: "dialogue";
      eyebrow: string;
      title: string;
      instruction: string;
      speakerA?: string;
      speakerB?: string;
      turns: readonly {
        line: string;
        options: readonly string[];
        correctOption: string;
        explanation: string;
      }[];
    }
  | {
      kind: "confidence";
      eyebrow: string;
      title: string;
      situation: string;
      prompt: string;
      options: readonly string[];
      bands: readonly {
        min: number;
        max: number;
        answer: string;
        label: string;
        explanation: string;
      }[];
    }
  | {
      kind: "spectrum";
      eyebrow: string;
      title: string;
      instruction: string;
      baseBefore: string;
      baseAfter: string;
      zones: readonly {
        min: number;
        max: number;
        word: string;
        label: string;
        translation: string;
      }[];
    }
  | {
      kind: "word-order";
      eyebrow: string;
      title: string;
      russian: string;
      words: readonly string[];
      initialWords: readonly string[];
      correct: readonly string[];
    }
  | {
      kind: "test";
      eyebrow: string;
      title: string;
      questionIndices: readonly number[];
      extraQuestions?: readonly CourseTestQuestion[];
      extraQuestionsAt?: number;
    }
  | {
      kind: "pre-test";
      eyebrow: string;
      title: string;
      lead: string;
      summary: readonly { label: string; text: string }[];
    }
  | {
      kind: "formula";
      eyebrow: string;
      title: string;
      lines: readonly { label: string; formula: string; example: string }[];
      note?: string;
    }
  | {
      kind: "rules";
      eyebrow: string;
      title: string;
      intro: string;
      rules: readonly { pattern: string; example: string }[];
      note?: string;
    }
  | {
      kind: "result";
      eyebrow: string;
      title: string;
      lead: string;
      formula: readonly string[];
    };

export interface CourseTestQuestion {
  id: string;
  prompt: string;
  options: readonly string[];
  correctAnswer: string;
  explanation: string;
}


export const PRESENT_CONTINUOUS_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    eyebrow: "Шаг 1 · Интуиция",
    title: "Что происходит прямо сейчас?",
    lead: "Какая фраза точнее описывает этот момент?",
    scenario:
      "Ты сидишь в парке с книгой. Действие происходит прямо сейчас, в момент разговора.",
    example: "I ___ a book right now.",
    options: ["I read a book.", "I am reading a book."],
    correctOption: "I am reading a book.",
    explanation:
      "Для действия, которое происходит в момент речи, нужен Present Continuous: am/is/are + глагол с -ing.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Смысл",
    title: "Когда нужен Present Continuous",
    paragraphs: [
      "Present Continuous описывает действие, которое происходит прямо сейчас, в момент речи. Это может быть процесс в эту секунду или временная ситуация текущего периода.",
      "Сравни: I read every evening — это привычка. I am reading now — это процесс прямо сейчас.",
    ],
    examples: [
      {
        en: "I am reading a book.",
        ru: "Я читаю книгу прямо сейчас.",
      },
      {
        en: "She is working from home this week.",
        ru: "Она работает из дома на этой неделе — временная ситуация.",
      },
    ],
    note: "Слова-подсказки: now, right now, at the moment, currently, this week, Look!, Listen!",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 4 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, в котором спряталась грамматическая ошибка. Подсказка: проверь форму глагола to be.",
    sentence: "She are reading a book.",
    words: ["She", "are", "reading", "a", "book."],
    errorIndex: 1,
    explanation:
      "С she используется is, а не are. Правильно: She is reading a book.",
  },
  {
    kind: "formula",
    eyebrow: "Шаг 5 · Формула",
    title: "Как собрать предложение",
    lines: [
      {
        label: "Утверждение",
        formula: "Подлежащее + am / is / are + глагол-ing",
        example: "She is working.",
      },
      {
        label: "Отрицание",
        formula: "Подлежащее + am / is / are + not + глагол-ing",
        example: "They are not sleeping.",
      },
      {
        label: "Вопрос",
        formula: "Am / Is / Are + подлежащее + глагол-ing?",
        example: "Are you listening?",
      },
    ],
    note: "I → am · he / she / it → is · we / you / they → are",
  },
  {
    kind: "matching",
    eyebrow: "Шаг 6 · Сопоставление",
    title: "Подбери правильную форму",
    instruction:
      "Нажми на предложение слева, затем на подходящую форму справа. У тебя получится три пары.",
    pairs: [
      { left: "I ___ reading a book.", right: "am" },
      { left: "She ___ reading a book.", right: "is" },
      { left: "They ___ reading a book.", right: "are" },
    ],
    rightOptions: ["are", "am", "is"],
    successText:
      "Все пары собраны. Форма am / is / are зависит от подлежащего.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 7 · Сборка предложения",
    title: "Собери предложение",
    russian: "Она читает книгу прямо сейчас.",
    words: ["She", "is", "reading", "a", "book."],
    initialWords: ["reading", "She", "book.", "is", "a"],
    correct: ["She", "is", "reading", "a", "book."],
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 8 · Сборка вопроса",
    title: "Собери вопрос",
    russian: "Почему ты сегодня работаешь дома?",
    words: ["Why", "are", "you", "working", "from", "home", "today?"],
    initialWords: ["working", "Why", "today?", "you", "from", "are", "home"],
    correct: ["Why", "are", "you", "working", "from", "home", "today?"],
  },
  {
    kind: "rules",
    eyebrow: "Шаг 9 · Детали",
    title: "Три правила окончания -ing",
    intro:
      "Перед тем как добавить -ing, проверь написание глагола. Большинство форм собираются по трём простым правилам.",
    rules: [
      {
        pattern: "Большинство глаголов: просто добавь -ing",
        example: "play → playing · read → reading",
      },
      {
        pattern: "Глагол на -e: убери -e",
        example: "make → making · write → writing",
      },
      {
        pattern: "Короткий глагол с ударным последним слогом: удвой согласную",
        example:
          "sit → sitting · run → running. В других случаях удвоения нет: open → opening",
      },
    ],
    note: "Удвоение зависит от количества слогов и ударения. Сравни: sit → sitting, но open → opening. Глаголы состояния (know, like, love, want, understand) обычно не используются в Continuous. Некоторые меняют значение: I have a car — у меня есть машина, а I'm having lunch — я обедаю.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 10 · Финальная практика",
    questionIndex: 2,
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 11 · Перед финальным тестом",
    title: "Урок почти пройден",
    lead: "Остался финальный тест для закрепления. Сначала коротко повтори главное — затем проверь себя на пяти вопросах.",
    summary: [
      {
        label: "Смысл",
        text: "Действие происходит прямо сейчас или является временной ситуацией: I am reading now.",
      },
      {
        label: "Формула",
        text: "am / is / are + глагол с -ing. Отрицание: am / is / are + not + V-ing. Вопрос: Am / Is / Are + подлежащее + V-ing?",
      },
      {
        label: "Детали",
        text: "make → making, sit → sitting. Слова now, right now и at the moment подсказывают это время.",
      },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 12 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [3, 4, 5, 6, 7],
  },
  {
    kind: "result",
    eyebrow: "Шаг 13 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал смысл Present Continuous, формулу и правила написания -ing.",
    formula: [
      "Сейчас: am / is / are + V-ing",
      "Отрицание: am / is / are + not + V-ing",
      "Вопрос: Am / Is / Are + подлежащее + V-ing?",
    ],
  },
];

export function getLessonCourse(topic: string): readonly CourseStep[] | null {
  if (topic === "present_continuous") {
    return PRESENT_CONTINUOUS_COURSE;
  }
  if (topic === "present_perfect") {
    return PRESENT_PERFECT_COURSE;
  }
  if (topic === "to_be_am_is_are") {
    return TO_BE_COURSE;
  }
  if (topic === "present_simple") {
    return PRESENT_SIMPLE_COURSE;
  }
  if (topic === "articles_a_an_the") {
    return ARTICLES_COURSE;
  }
  if (topic === "future_forms_will_going_to_present_continuous") {
    return FUTURE_FORMS_COURSE;
  }
  if (topic === "future_will") {
    return FUTURE_WILL_COURSE;
  }
  if (topic === "future_going_to") {
    return FUTURE_GOING_TO_COURSE;
  }
  if (topic === "modal_verbs_must_have_to_should") {
    return MODAL_VERBS_COURSE;
  }
  if (topic === "much_many_a_lot_of_little_few") {
    return QUANTIFIERS_COURSE;
  }
  if (topic === "past_continuous") {
    return PAST_CONTINUOUS_COURSE;
  }
  if (topic === "past_simple") {
    return PAST_SIMPLE_COURSE;
  }
  if (topic === "past_simple_vs_past_continuous") {
    return PAST_SIMPLE_VS_CONTINUOUS_COURSE;
  }
  if (topic === "prepositions_of_time_in_on_at") {
    return PREPOSITIONS_TIME_COURSE;
  }
  if (topic === "present_simple_vs_present_continuous") {
    return PRESENT_SIMPLE_VS_CONTINUOUS_COURSE;
  }
  if (topic === "some_any_no_every") {
    return SOME_ANY_COURSE;
  }
  if (topic === "there_is_there_are") {
    return THERE_IS_THERE_ARE_COURSE;
  }
  if (topic === "past_simple_vs_present_perfect") {
    return PAST_SIMPLE_VS_PERFECT_COURSE;
  }
  if (topic === "future_continuous") {
    return FUTURE_CONTINUOUS_COURSE;
  }
  if (topic === "future_perfect") {
    return FUTURE_PERFECT_COURSE;
  }
  if (topic === "present_perfect_continuous") {
    return PRESENT_PERFECT_CONTINUOUS_COURSE;
  }
  if (topic === "conjunctions_basic") {
    return CONJUNCTIONS_COURSE;
  }
  if (topic === "countable_uncountable") {
    return COUNTABLE_COURSE;
  }
  if (topic === "demonstratives") {
    return DEMONSTRATIVES_COURSE;
  }
  if (topic === "modals_of_ability") {
    return ABILITY_COURSE;
  }
  if (topic === "modals_of_advice") {
    return ADVICE_COURSE;
  }
  if (topic === "modals_of_probability") {
    return PROBABILITY_COURSE;
  }
  if (topic === "possessives") {
    return POSSESSIVES_COURSE;
  }
  if (topic === "quantifiers_both_either_neither") {
    return BOTH_EITHER_NEITHER_COURSE;
  }
  if (topic === "prepositions_of_place") {
    return PREPOSITIONS_PLACE_COURSE;
  }
  if (topic === "conditionals_1_2") {
    return CONDITIONALS_COURSE;
  }
  if (topic === "conditionals_3_mixed") {
    return CONDITIONALS_MIXED_COURSE;
  }
  if (topic === "gerunds_infinitives") {
    return GERUNDS_INFINITIVES_COURSE;
  }
  if (topic === "passive_voice") {
    return PASSIVE_VOICE_COURSE;
  }
  if (topic === "relative_clauses") {
    return RELATIVE_CLAUSES_COURSE;
  }
  if (topic === "reported_speech") {
    return REPORTED_SPEECH_COURSE;
  }
  if (topic === "past_perfect") {
    return PAST_PERFECT_COURSE;
  }
  return null;
}

export const PRESENT_PERFECT_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "comparison",
    eyebrow: "Шаг 1 · Интуиция",
    title: "Что произошло?",
    lead: "Какая карточка лучше показывает, что ключей нет прямо сейчас?",
    scenario:
      "Ты потерял ключи и стоишь перед закрытой дверью. Важен не момент потери, а результат сейчас.",
    example: "I ___ my keys. I can't open the door.",
    options: ["I lost my keys.", "I have lost my keys."],
    correctOption: "I have lost my keys.",
    explanation:
      "Действие было в прошлом, но его результат важен сейчас: ключей нет, дверь не открыть. Present Perfect связывает прошлое с настоящим.",
    comparison: {
      first: "I lost my keys.",
      second: "I have lost my keys.",
    },
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Смысл",
    title: "Когда нужен Present Perfect",
    paragraphs: [
      "Present Perfect связывает прошлое с настоящим. Одна из ситуаций — результат: действие произошло в прошлом, но его результат важен в настоящий момент.",
      "Также это время используется для жизненного опыта — того, что происходило или не происходило до настоящего момента, — и для незаконченного периода времени: today, this week, this year.",
      "Сравни: I finished the report yesterday — точное время в прошлом. I have finished the report — время не указано, но результат актуален сейчас.",
    ],
    examples: [
      {
        en: "I have finished the report.",
        ru: "Я закончил отчёт — результат важен сейчас.",
      },
      {
        en: "She has cleaned the room.",
        ru: "Она убрала комнату — сейчас комната чистая.",
      },
      {
        en: "Have you ever been to London?",
        ru: "Ты когда-нибудь был в Лондоне? Опыт до настоящего момента.",
      },
    ],
    note: "В Present Perfect нас обычно интересует результат, опыт или незаконченный период, а не точное время действия.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг · Сравнение",
    customQuestion: {
      id: "present-perfect-result-contrast",
      prompt: "Какое предложение показывает результат в настоящем?",
      options: [
        "I saw that film yesterday.",
        "I've seen that film, so I know the ending.",
        "I watch that film every year.",
        "I was watching that film.",
      ],
      correctAnswer: "I've seen that film, so I know the ending.",
      explanation:
        "Yesterday — завершённое время Past Simple. I've seen that film показывает результат сейчас: я знаю концовку.",
    },
  },
  {
    kind: "formula",
    eyebrow: "Шаг 3 · Формула",
    title: "Как построить утверждение",
    lines: [
      {
        label: "I / you / we / they",
        formula: "have + V3",
        example: "I have finished. We have worked.",
      },
      {
        label: "he / she / it",
        formula: "has + V3",
        example: "She has cleaned. He has arrived.",
      },
      {
        label: "Сокращения",
        formula: "I've · you've · we've · they've · he's · she's · it's",
        example: "I've finished. She's cleaned.",
      },
    ],
    note: "V3 — третья форма глагола. У правильных глаголов это глагол с -ed; форму неправильных нужно запоминать.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 4 · Практика",
    questionIndex: 0,
  },
  {
    kind: "rules",
    eyebrow: "Шаг 5 · Форма глагола",
    title: "Правильные глаголы и V3",
    intro:
      "Для Present Perfect нужна третья форма глагола. У правильных глаголов она образуется с помощью -ed, но написание меняется.",
    rules: [
      {
        pattern: "Большинство глаголов: добавляем -ed",
        example: "work → worked · play → played",
      },
      {
        pattern: "Глагол на -e: добавляем только -d",
        example: "live → lived · like → liked",
      },
      {
        pattern: "Согласная + y: меняем y на -ied",
        example: "study → studied · try → tried",
      },
      {
        pattern: "Короткий ударный слог: удваиваем согласную",
        example: "stop → stopped · plan → planned",
      },
    ],
    note: "Неправильные глаголы образуют V3 по-своему: go → gone, see → seen, write → written, do → done. Их форму нужно запоминать.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 6 · Отрицания и вопросы",
    title: "Меняется только have / has",
    paragraphs: [
      "В отрицании и вопросе основной глагол остаётся в третьей форме V3. Все изменения происходят с вспомогательным have или has.",
      "Отрицание: have not / has not + V3. В разговорной речи — haven't / hasn't. Вопрос: Have / Has + подлежащее + V3?",
    ],
    examples: [
      {
        en: "I haven't finished.",
        ru: "Я ещё не закончил.",
      },
      {
        en: "She hasn't called.",
        ru: "Она не позвонила.",
      },
      {
        en: "Have you finished? — Yes, I have.",
        ru: "Ты закончил? — Да.",
      },
    ],
    note: "Краткие ответы: Yes, I have. / No, I haven't. / Yes, she has. / No, she hasn't.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 7 · Практика",
    questionIndex: 4,
  },
  {
    kind: "theory",
    eyebrow: "Шаг · Опыт и результат",
    title: "Ever, never, just, already, yet",
    paragraphs: [
      "Ever и never говорят об опыте до настоящего момента: Have you ever been to London? I have never tried sushi.",
      "Just, already и yet показывают недавний результат или ожидание: He has just arrived. She has already finished. They haven't visited us yet.",
    ],
    examples: [
      { en: "Have you ever been to London?", ru: "Ты когда-нибудь был в Лондоне?" },
      { en: "He has just arrived.", ru: "Он только что пришёл." },
      { en: "She has already finished.", ru: "Она уже закончила." },
      { en: "They haven't visited us yet.", ru: "Они ещё не навестили нас." },
    ],
    note: "Ever/never — опыт. Just/already/yet — результат или ожидание. Yet обычно стоит в конце отрицания или вопроса.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг · Практика",
    questionIndex: 5,
  },
  {
    kind: "theory",
    eyebrow: "Шаг · Продолжительность",
    title: "For и since",
    paragraphs: [
      "For указывает на длительность: for five years, for two hours, for a long time.",
      "Since указывает на точку отсчёта: since 2020, since Monday, since I was a child.",
    ],
    examples: [
      { en: "We have lived here for five years.", ru: "Мы живём здесь уже пять лет." },
      { en: "I have known her since 2019.", ru: "Я знаю её с 2019 года." },
      { en: "He has worked here for two months.", ru: "Он работает здесь два месяца." },
    ],
    note: "For + длительность. Since + точка старта.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг · Практика",
    customQuestion: {
      id: "present-perfect-for-since",
      prompt: "We ___ in this city ___ five years.",
      options: [
        "have lived / for",
        "have lived / since",
        "live / for",
        "lived / for",
      ],
      correctAnswer: "have lived / for",
      explanation:
        "Five years — длительность, поэтому нужен for. Действие началось в прошлом и продолжается: have lived.",
    },
  },
  {
    kind: "matching",
    eyebrow: "Шаг 9 · Сопоставление",
    title: "Соедини сигнал и значение",
    instruction:
      "Нажми на слово слева, затем на его значение справа. Это поможет не путать since и for, just и already.",
    pairs: [
      { left: "just", right: "только что" },
      { left: "already", right: "уже" },
      { left: "yet", right: "ещё не / уже?" },
      { left: "since", right: "с какого-то момента" },
      { left: "for", right: "в течение" },
    ],
    rightOptions: ["в течение", "только что", "с какого-то момента", "уже", "ещё не / уже?"],
    successText:
      "Все пары собраны. Каждый маркер помогает узнать Present Perfect и его оттенок.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 11 · Present Perfect vs Past Simple",
    title: "Не смешивай два времени",
    paragraphs: [
      "Если в предложении есть точное время в прошлом — yesterday, last week, in 2010, two days ago — используй Past Simple, а не Present Perfect.",
      "Present Perfect не называет точное время. Он сообщает о результате, опыте или незаконченном периоде: today, this week, this year.",
    ],
    examples: [
      {
        en: "I finished my work yesterday.",
        ru: "Past Simple: точное время — yesterday.",
      },
      {
        en: "I have finished my work.",
        ru: "Present Perfect: время не указано, важен результат.",
      },
      {
        en: "I haven't called him today.",
        ru: "Today ещё не закончился — Present Perfect.",
      },
    ],
    note: "Типичная ошибка: I have finished my work yesterday. С точным временем в прошлом нужен Past Simple: I finished my work yesterday.",
  },
  {
    kind: "spot",
    eyebrow: "Шаг 12 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое нужно убрать, чтобы предложение стало грамматически верным. Подумай, какое время требует точное указание времени.",
    sentence: "She has called me two days ago.",
    words: ["She", "has", "called", "me", "two", "days", "ago."],
    errorIndex: 1,
    explanation:
      "С two days ago нужен Past Simple, поэтому лишний вспомогательный has нужно убрать: She called me two days ago.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 13 · Сборка предложения",
    title: "Собери предложение",
    russian: "Она только что закончила домашнюю работу.",
    words: ["She", "has", "just", "finished", "her", "homework."],
    initialWords: ["finished", "She", "homework.", "just", "has", "her"],
    correct: ["She", "has", "just", "finished", "her", "homework."],
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 14 · Сборка отрицания",
    title: "Собери отрицание",
    russian: "Он еще не ответил на мое сообщение.",
    words: ["He", "hasn't", "answered", "my", "message", "yet."],
    initialWords: ["answered", "He", "yet.", "my", "hasn't", "message"],
    correct: ["He", "hasn't", "answered", "my", "message", "yet."],
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 15 · Перед финальным тестом",
    title: "Урок почти пройден",
    lead: "Остался финальный тест. Сначала коротко повтори главное: смысл, формулу, сигналы и различие с Past Simple.",
    summary: [
      {
        label: "Смысл",
        text: "Прошлое действие с результатом сейчас, опыт или незаконченный период: today, this week.",
      },
      {
        label: "Формула",
        text: "have / has + V3. Отрицание: haven't / hasn't + V3. Вопрос: Have / Has + подлежащее + V3?",
      },
      {
        label: "Контраст",
        text: "yesterday, last week, ago → Past Simple. just, already, yet, ever, never, since, for → Present Perfect.",
      },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 16 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [2, 3, 6, 7, 8],
  },
  {
    kind: "result",
    eyebrow: "Шаг 17 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал смысл Present Perfect, формулу, отрицания и вопросы, сигналы и отличие от Past Simple.",
    formula: [
      "have / has + V3",
      "haven't / hasn't + V3",
      "Have / Has + подлежащее + V3?",
    ],
  },
];

export const TO_BE_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "context",
    eyebrow: "Шаг 1 · Интуиция",
    title: "Что означает фраза?",
    lead: "Выбери точный перевод.",
    quote: "I am a student.",
    example: "I am a student.",
    options: ["Я студент.", "Я был студентом."],
    correctOption: "Я студент.",
    explanation:
      "Am — форма to be для I в настоящем времени. I am a student сообщает, кто я сейчас.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Формы",
    title: "Три формы: am, is, are",
    paragraphs: [
      "В настоящем времени у to be три формы: am, is и are. Форма зависит от того, кто или что стоит перед глаголом.",
      "С I используем am. С he, she, it и одним человеком или предметом — is. С you, we, they и несколькими людьми или предметами — are.",
      "You всегда сочетается с are, даже если ты обращаешься к одному человеку.",
    ],
    examples: [
      { en: "I am a student.", ru: "Я студент." },
      { en: "She is at home.", ru: "Она дома." },
      { en: "They are tired.", ru: "Они устали." },
      { en: "You are my friend.", ru: "Ты мой друг." },
    ],
    note: "I → am · he / she / it → is · you / we / they → are",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 4 · Когда используем",
    title: "Кто ты, какой ты, где ты",
    paragraphs: [
      "To be нужен, чтобы назвать человека или предмет, описать качество, указать местоположение и назвать возраст.",
      "Возраст в английском выражается через am / is / are, а не через have. Сравни: I am 18 years old — Мне 18 лет.",
    ],
    examples: [
      { en: "He is my brother.", ru: "Он мой брат — кто это." },
      { en: "The coffee is hot.", ru: "Кофе горячий — какой он." },
      { en: "My keys are in my bag.", ru: "Мои ключи в сумке — где они." },
      { en: "My sister is 10.", ru: "Моей сестре 10 лет — возраст." },
    ],
    note: "The shops are open. · The cat is under the table. · I am from Spain.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 1,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 6 · Сокращения",
    title: "I'm, he's, they're",
    paragraphs: [
      "В разговорной речи am, is и are часто сокращают. Значение предложения не меняется.",
      "Полные и краткие формы правильные. В нейтральной речи сокращения звучат естественно.",
    ],
    examples: [
      { en: "I am ready. → I'm ready.", ru: "Я готов." },
      { en: "She is my teacher. → She's my teacher.", ru: "Она моя учительница." },
      { en: "They are at school. → They're at school.", ru: "Они в школе." },
    ],
    note: "I'm · you're · he's · she's · it's · we're · they're",
  },
  {
    kind: "practice",
    eyebrow: "Шаг · Мини-практика",
    customQuestion: {
      id: "to-be-contraction-expand",
      prompt: "She's tired. Полная форма: She ___ tired.",
      options: ["is", "are", "am", "be"],
      correctAnswer: "is",
      explanation:
        "She's — это сокращение she is. В полной форме возвращаем is: She is tired.",
    },
  },
  {
    kind: "theory",
    eyebrow: "Шаг 7 · Отрицания",
    title: "Not после am, is или are",
    paragraphs: [
      "Чтобы сказать, что чего-то нет или что человек не является кем-то, поставь not сразу после am, is или are.",
      "В разговорной речи часто используют isn't и aren't. Для I am not обычная краткая форма — I'm not.",
    ],
    examples: [
      { en: "I am not tired.", ru: "Я не устал." },
      { en: "He isn't at work.", ru: "Его нет на работе." },
      { en: "They aren't at home.", ru: "Их нет дома." },
    ],
    note: "Нельзя сказать She not is tired. Правильно: She is not tired.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 8 · Практика",
    questionIndex: 5,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 9 · Вопросы",
    title: "Поставь форму перед подлежащим",
    paragraphs: [
      "В вопросе am, is или are выходит на первое место. Отдельное be добавлять не нужно.",
      "В коротком утвердительном ответе обычно не используют сокращение: Yes, I am — не Yes, I'm.",
    ],
    examples: [
      { en: "Are you ready? — Yes, I am.", ru: "Ты готов? — Да." },
      { en: "Is he at home? — No, he isn't.", ru: "Он дома? — Нет." },
      { en: "Are they students? — Yes, they are.", ru: "Они студенты? — Да." },
      { en: "Am I late?", ru: "Я опоздал?" },
    ],
    note: "Where are you from? · Is this your phone? · Are the children at school?",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 10 · Практика",
    questionIndex: 6,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 11 · To be и глаголы действия",
    title: "Не добавляй to be к обычному глаголу",
    paragraphs: [
      "Если в предложении уже есть обычный глагол действия — work, live, play — не нужно ставить перед ним am, is или are.",
      "Сравни: I am a teacher — кто я. I work at a school — что я делаю. Нельзя сказать I am work.",
    ],
    examples: [
      { en: "I am a teacher.", ru: "Я учитель — называем, кто я." },
      { en: "I work at a school.", ru: "Я работаю в школе — действие work." },
      { en: "She is busy.", ru: "Она занята — состояние." },
    ],
    note: "I am at work — я на работе (местоположение). I work — я работаю (действие).",
  },
  {
    kind: "spot",
    eyebrow: "Шаг 12 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение неверным. Проверь форму to be для she.",
    sentence: "She are my teacher.",
    words: ["She", "are", "my", "teacher."],
    errorIndex: 1,
    explanation:
      "С she нужна форма is: She is my teacher. Форма are используется с you, we и they.",
  },
  {
    kind: "matching",
    eyebrow: "Шаг 13 · Сопоставление",
    title: "Подбери форму to be",
    instruction:
      "Нажми на подлежащее слева, затем на подходящую форму to be справа.",
    pairs: [
      { left: "I", right: "am" },
      { left: "he / she / it", right: "is" },
      { left: "you / we / they", right: "are" },
    ],
    rightOptions: ["is", "are", "am"],
    successText:
      "Все пары собраны. Форма to be зависит от подлежащего.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 14 · Сборка предложения",
    title: "Собери предложение",
    russian: "Они не заняты.",
    words: ["They", "are", "not", "busy."],
    initialWords: ["not", "They", "busy.", "are"],
    correct: ["They", "are", "not", "busy."],
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 15 · Сборка вопроса",
    title: "Собери вопрос",
    russian: "Твои родители сейчас дома?",
    words: ["Are", "your", "parents", "at", "home", "now?"],
    initialWords: ["parents", "Are", "now?", "home", "at", "your"],
    correct: ["Are", "your", "parents", "at", "home", "now?"],
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 16 · Перед финальным тестом",
    title: "Урок почти пройден",
    lead: "Остался финальный тест. Сначала коротко повтори формы, случаи использования и построение отрицаний и вопросов.",
    summary: [
      {
        label: "Формы",
        text: "I → am · he / she / it → is · you / we / they → are. You всегда с are.",
      },
      {
        label: "Случаи",
        text: "Кто ты, какой ты, где находишься и сколько тебе лет. Возраст — через am / is / are.",
      },
      {
        label: "Фразы",
        text: "Отрицание: am / is / are + not. Вопрос: Am / Is / Are + подлежащее? Без to be перед обычным глаголом.",
      },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 17 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [3, 4, 7, 8, 9],
  },
  {
    kind: "result",
    eyebrow: "Шаг 18 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал формы am / is / are, случаи использования, сокращения, отрицания, вопросы и отличие to be от глаголов действия.",
    formula: [
      "I am · he / she / it is · you / we / they are",
      "I am a teacher — кто я · I work at school — что я делаю",
      "am / is / are + not",
      "Am / Is / Are + подлежащее?",
    ],
  },
];

export const PRESENT_SIMPLE_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    eyebrow: "Шаг 1 · Интуиция",
    title: "Что ты скажешь?",
    lead: "Какая фраза описывает привычку сестры?",
    scenario:
      "Ты рассказываешь другу о своей сестре: каждый день она ходит в школу, и это происходит регулярно.",
    example: "She ___ to school every day.",
    options: ["She go to school every day.", "She goes to school every day."],
    correctOption: "She goes to school every day.",
    explanation:
      "She — это he / she / it, поэтому в Present Simple к глаголу go добавляется -es: goes.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Смысл",
    title: "Привычки, распорядок и факты",
    paragraphs: [
      "Present Simple нужен для привычек и регулярных действий: I get up at seven. She works in a bank.",
      "Он также подходит для общеизвестных фактов: Water boils at 100°C. The shops open at nine.",
      "Present Simple используется для состояний, чувств и мыслей: I like coffee. She knows the answer.",
      "Present Simple также используется для расписаний и графиков: The train leaves at 7. The film starts at 8.",
    ],
    examples: [
      { en: "I get up at seven.", ru: "Я встаю в семь — привычка." },
      { en: "We play tennis on Sundays.", ru: "Мы играем в теннис по воскресеньям — регулярно." },
      { en: "Water boils at 100°C.", ru: "Вода кипит при 100 °C — факт." },
      { en: "She knows the answer.", ru: "Она знает ответ — состояние." },
    ],
    note: "Глаголы состояния (know, like, love, want, understand) обычно используются в Present Simple, а не в Continuous. Маркеры: always, usually, often, sometimes, never, every day, on Mondays.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг · Практика смысла",
    customQuestion: {
      id: "present-simple-habit-check",
      prompt: "Какое предложение описывает привычку?",
      options: [
        "I get up at seven every day.",
        "I am getting up now.",
        "I got up at seven yesterday.",
        "I will get up at seven tomorrow.",
      ],
      correctAnswer: "I get up at seven every day.",
      explanation:
        "Every day показывает регулярное действие — это Present Simple. Остальные варианты относят действие к другому времени.",
    },
  },
  {
    kind: "rules",
    eyebrow: "Шаг 3 · Форма",
    title: "Когда появляется -s",
    intro:
      "С I, you, we, they используем обычную форму глагола. С he, she, it добавляем окончание.",
    rules: [
      { pattern: "I / you / we / they + обычный глагол", example: "I work · they live · we play" },
      { pattern: "he / she / it + -s", example: "work → works · read → reads" },
      { pattern: "-s, -sh, -ch, -x, -o → -es", example: "watch → watches · go → goes" },
      { pattern: "согласная + y → -ies", example: "study → studies · try → tries" },
      { pattern: "have → has", example: "He has a bike. · She has a sister." },
    ],
    note: "Окончание -s относится только к he / she / it. С I и they его не добавляем.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 4 · Практика",
    questionIndex: 0,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 5 · Отрицания",
    title: "Don't и doesn't",
    paragraphs: [
      "Для отрицания используем don't с I, you, we, they и doesn't с he, she, it.",
      "После doesn't основной глагол стоит в обычной форме, без -s. Окончание уже есть в does.",
    ],
    examples: [
      { en: "I don't drink coffee.", ru: "Я не пью кофе." },
      { en: "He doesn't like fish.", ru: "Он не любит рыбу." },
      { en: "She doesn't work on Sundays.", ru: "Она не работает по воскресеньям." },
    ],
    note: "Нельзя сказать He doesn't likes. Правильно: He doesn't like.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 6 · Практика",
    questionIndex: 2,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 7 · Вопросы",
    title: "Do или Does?",
    paragraphs: [
      "Выбор зависит от подлежащего: do — для I, you, we, they; does — для he, she, it. Это то же распределение, что и окончание -s в утверждении.",
      "В вопросе Do или Does выходит на первое место. После does основной глагол стоит без -s.",
      "Краткие ответы: Yes, I do. / No, I don't. / Yes, she does. / No, she doesn't.",
    ],
    examples: [
      { en: "Do you speak English?", ru: "Ты говоришь по-английски?" },
      { en: "Does she work here?", ru: "Она здесь работает?" },
      { en: "Do they live in London?", ru: "Они живут в Лондоне?" },
    ],
    note: "Does he play...? — не Does he plays...?",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 8 · Практика",
    questionIndex: 3,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 9 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение неверным. Проверь форму отрицания для he.",
    sentence: "He don't like fish.",
    words: ["He", "don't", "like", "fish."],
    errorIndex: 1,
    explanation:
      "С he нужно doesn't: He doesn't like fish. После doesn't глагол like стоит без -s.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 10 · Наречия частотности",
    title: "Always, usually, sometimes",
    paragraphs: [
      "Наречия частотности обычно стоят перед смысловым глаголом: She often reads before bed.",
      "С глаголом to be они стоят после am / is / are: He is usually late.",
    ],
    examples: [
      { en: "I always drink tea in the morning.", ru: "Я всегда пью чай утром." },
      { en: "She usually works from home.", ru: "Она обычно работает из дома." },
      { en: "They are never late.", ru: "Они никогда не опаздывают." },
    ],
    note: "Порядок: подлежащее + наречие + смысловой глагол. С to be: подлежащее + be + наречие.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 11 · Практика",
    questionIndex: 8,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 12 · Исключение To Be",
    title: "To be не дружит с do / does",
    paragraphs: [
      "Глагол to be сам меняется по лицам: I am, he / she / it is, you / we / they are.",
      "С ним не используются do или does. Вопрос строится перестановкой: Are you a student?",
    ],
    examples: [
      { en: "My brother is a doctor.", ru: "Мой брат врач." },
      { en: "Are you ready?", ru: "Ты готов?" },
      { en: "He isn't at home.", ru: "Его нет дома." },
    ],
    note: "С to be не используем do/does: вопрос строится только перестановкой am / is / are.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 13 · Практика",
    questionIndex: 4,
  },
  {
    kind: "matching",
    eyebrow: "Шаг 14 · Сопоставление",
    title: "Соедини наречие и значение",
    instruction:
      "Нажми на наречие слева, затем на его значение справа.",
    pairs: [
      { left: "always", right: "всегда" },
      { left: "usually", right: "обычно" },
      { left: "sometimes", right: "иногда" },
      { left: "never", right: "никогда" },
    ],
    rightOptions: ["обычно", "никогда", "всегда", "иногда"],
    successText:
      "Все пары собраны. Наречия частотности — маркеры Present Simple: они показывают, как часто происходит действие.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 15 · Сборка предложения",
    title: "Собери предложение",
    russian: "Она обычно работает из дома.",
    words: ["She", "usually", "works", "from", "home."],
    initialWords: ["works", "She", "home.", "usually", "from"],
    correct: ["She", "usually", "works", "from", "home."],
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 16 · Сборка вопроса",
    title: "Собери вопрос",
    russian: "Твой брат играет в теннис по воскресеньям?",
    words: ["Does", "your", "brother", "play", "tennis", "on", "Sundays?"],
    initialWords: ["play", "Does", "Sundays?", "your", "tennis", "brother", "on"],
    correct: ["Does", "your", "brother", "play", "tennis", "on", "Sundays?"],
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 17 · Перед финальным тестом",
    title: "Урок почти пройден",
    lead: "Остался финальный тест. Сначала коротко повтори форму, do/does и место наречий.",
    summary: [
      {
        label: "Форма",
        text: "I / you / we / they + глагол. He / she / it + -s или -es. Have → has. Состояния (know, like) — Present Simple.",
      },
      {
        label: "Do / Does",
        text: "Отрицание: don't / doesn't + обычный глагол. Вопрос: Do / Does + подлежащее + глагол?",
      },
      {
        label: "Детали",
        text: "Usually, often, sometimes стоят перед смысловым глаголом. С to be — после am / is / are.",
      },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 18 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [1, 5, 6, 7, 9],
  },
  {
    kind: "result",
    eyebrow: "Шаг 19 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал Present Simple: привычки и факты, форму с -s/-es, do/does, вопросы, наречия частотности и исключение to be.",
    formula: [
      "he / she / it + глагол-s",
      "don't / doesn't + глагол",
      "Do / Does + подлежащее + глагол?",
    ],
  },
];

export const ARTICLES_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "comparison",
    eyebrow: "Шаг 1 · Интуиция",
    title: "Что делает историю понятной?",
    lead: "Какая карточка говорит о конкретной собаке, которую мы уже упомянули?",
    scenario:
      "Ты рассказываешь историю о прогулке: сначала появилась собака, а потом ты говоришь о ней подробнее.",
    example: "I saw ___ dog in the park.",
    options: ["I saw a dog in the park.", "The dog was black."],
    correctOption: "The dog was black.",
    explanation:
      "A dog вводит новую собаку в историю. The dog указывает на ту самую собаку, о которой уже шла речь.",
    comparison: {
      first: "I saw a dog in the park.",
      second: "The dog was black.",
    },
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · A / AN",
    title: "Какой-то один из возможных",
    paragraphs: [
      "A / an ставим перед одним исчисляемым предметом, когда представляем его как один из возможных, а не как уже определённый. Это не всегда только первое упоминание.",
      "Выбор a или an зависит от первого звука слова. An apple — гласный звук. A book — согласный звук.",
    ],
    examples: [
      { en: "I need a ticket.", ru: "Мне нужен билет — какой-то один." },
      { en: "She is an engineer.", ru: "Она инженер — профессия, один человек." },
      { en: "I bought an apple.", ru: "Я купил яблоко — гласный звук." },
      { en: "I bought a book.", ru: "Я купил книгу — согласный звук." },
    ],
    note: "A / an не используются с множественным числом и неисчисляемыми: books, information. Звук важнее буквы: an hour, a university.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 4 · THE",
    title: "Тот самый предмет",
    paragraphs: [
      "The используем, когда собеседник может понять, о каком именно предмете речь. Это может быть уже знакомый предмет, уникальная вещь или предмет, понятный из ситуации.",
      "The не обязан появляться только после первого упоминания: контекст может сразу сделать предмет конкретным. Сравни: I bought a jacket yesterday. The jacket was expensive.",
    ],
    examples: [
      { en: "The sun is shining.", ru: "Солнце светит — оно уникально." },
      { en: "The window is open.", ru: "Окно открыто — речь о конкретном окне в комнате." },
      { en: "We booked a hotel. The hotel is near the station.", ru: "Сначала новый отель, потом тот самый." },
    ],
    note: "The можно использовать и с единственным, и с множественным числом, и с неисчисляемыми, если речь конкретная.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 1,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 6 · Нулевой артикль",
    title: "Когда артикль не нужен",
    paragraphs: [
      "Перед множественным числом и неисчисляемыми существительными в общем смысле артикль не ставим: books, information, water.",
      "Артикль не нужен, когда мы говорим о категории в целом: I like dogs. I like flowers.",
      "В устойчивых выражениях с go to артикль тоже не нужен: I go to school. I go to bed.",
      "Нельзя сказать a books или an information. A / an возможны только с одним исчисляемым предметом.",
    ],
    examples: [
      { en: "I like books.", ru: "Я люблю книги — книги в целом." },
      { en: "I like dogs.", ru: "Я люблю собак — категория в целом." },
      { en: "I go to school.", ru: "Я хожу в школу — устойчивое выражение." },
      { en: "I go to bed at ten.", ru: "Я ложусь спать в десять." },
    ],
    note: "The с этими словами возможен, если речь о конкретных книгах, информации или воде.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 7 · Практика",
    questionIndex: 4,
  },
  {
    kind: "practice",
    eyebrow: "Шаг · Нулевой артикль",
    questionIndex: 7,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 8 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение неверным. Проверь, исчисляемое ли это существительное.",
    sentence: "I need an information about the course.",
    words: ["I", "need", "an", "information", "about", "the", "course."],
    errorIndex: 2,
    explanation:
      "Information — неисчисляемое существительное, поэтому a / an перед ним не ставим: I need information about the course.",
  },
  {
    kind: "matching",
    eyebrow: "Шаг 9 · Сопоставление",
    title: "Почему этот артикль?",
    instruction:
      "Нажми на пример слева, затем на объяснение справа.",
    pairs: [
      { left: "an apple", right: "гласный звук" },
      { left: "a book", right: "согласный звук" },
      { left: "the sun", right: "уникальный предмет" },
      { left: "books", right: "общее множественное" },
    ],
    rightOptions: ["общее множественное", "гласный звук", "уникальный предмет", "согласный звук"],
    successText:
      "Все пары собраны. Теперь видно, почему в каждом примере нужен именно этот артикль.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 10 · Профессии и конкретика",
    title: "A doctor, the nearest, the window",
    paragraphs: [
      "С названием профессии в единственном числе обычно используем a / an: She is a doctor. He is an engineer.",
      "The нужен с превосходной степенью и конкретным предметом: the nearest supermarket, the window in this room.",
    ],
    examples: [
      { en: "My brother is a doctor.", ru: "Мой брат врач — профессия." },
      { en: "Where is the nearest supermarket?", ru: "Где ближайший супермаркет? — превосходная степень." },
      { en: "Can you close the window?", ru: "Можешь закрыть окно? — конкретное окно." },
    ],
    note: "A doctor — один из врачей. The doctor — тот самый врач, о котором уже понятно.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 11 · Практика",
    questionIndex: 2,
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 12 · Сборка предложения",
    title: "Собери предложение",
    russian: "Она инженер в больнице.",
    words: ["She", "is", "an", "engineer", "at", "a", "hospital."],
    initialWords: ["engineer", "She", "hospital.", "an", "at", "is", "a"],
    correct: ["She", "is", "an", "engineer", "at", "a", "hospital."],
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 13 · Перед финальным тестом",
    title: "Урок почти пройден",
    lead: "Остался финальный тест. Сначала коротко повтори a/an, the и нулевой артикль.",
    summary: [
      {
        label: "A / AN",
        text: "Один исчисляемый предмет как один из возможных. Выбор по звуку: an apple, a book.",
      },
      {
        label: "THE",
        text: "Конкретный, уже знакомый или уникальный предмет: the sun, the nearest, the window.",
      },
      {
        label: "Ноль",
        text: "Множественное число и неисчисляемые в общем смысле: books, information, water. Категория в целом и go to school / go to bed — без артикля.",
      },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 14 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [3, 5, 6],
    extraQuestionsAt: 1,
    extraQuestions: [
      {
        id: "articles-final-elephant",
        prompt: "I saw ___ elephant at the zoo.",
        options: ["a", "an", "the", "ничего"],
        correctAnswer: "an",
        explanation:
          "Elephant начинается с гласного звука, а речь идёт о нём впервые. Поэтому используем an.",
      },
      {
        id: "articles-final-moon",
        prompt: "___ moon is bright tonight.",
        options: ["A", "An", "The", "ничего"],
        correctAnswer: "The",
        explanation:
          "Луна уникальна — она одна. С уникальными предметами используем the.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 15 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал a/an, the и нулевой артикль, различия первого и повторного упоминания, профессии и особые случаи.",
    formula: [
      "a / an + один исчисляемый предмет",
      "the + конкретный или уникальный предмет",
      "— + множественное / неисчисляемое в общем смысле",
    ],
  },
];

export const FUTURE_FORMS_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "context",
    eyebrow: "Шаг 1 · Три формы",
    title: "Три способа говорить о будущем",
    lead: "В этом уроке разбираем только will, going to и Present Continuous. Future Continuous и Future Perfect изучаются отдельно.",
    quote: "I'll be back.",
    example: "I'll be back.",
    options: ["Я вернусь.", "Я вернулся."],
    correctOption: "Я вернусь.",
    explanation:
      "I'll = I will. Will — одна из трёх форм этого урока; две другие — going to и Present Continuous.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · WILL",
    title: "Решение, обещание, предложение",
    paragraphs: [
      "Will — обычный выбор, когда решение появляется прямо сейчас, во время разговора. Ты не планировал его заранее.",
      "Также will часто используют для обещаний, предложений помощи и личных предположений о будущем — особенно с I think, probably, I'm sure.",
      "Will + начальная форма глагола, без to: will work, will come, will be. Сокращение — 'll. Отрицание — won't.",
    ],
    examples: [
      { en: "The phone is ringing! I'll answer it.", ru: "Телефон звонит! Я отвечу — решил сейчас." },
      { en: "I'll carry your bag.", ru: "Я понесу твою сумку — предложение помощи." },
      { en: "I think it will be sunny tomorrow.", ru: "Думаю, завтра будет солнечно — личное предположение." },
      { en: "I won't be late.", ru: "Я не опоздаю — обещание." },
    ],
    note: "Will + глагол · won't + глагол · Will + подлежащее + глагол? Формы будущего могут пересекаться: will — не единственный возможный вариант.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    example: {
      text: "The phone is ringing! I'll answer it.",
    },
    customQuestion: {
      id: "future-practice-will-1",
      prompt: "Your friend is carrying heavy bags. ___ you with them.",
      options: ["I'll help", "I'm going to help", "I'm helping", "I help"],
      correctAnswer: "I'll help",
      explanation:
        "Ты предлагаешь помощь прямо сейчас, в момент разговора. Используем will: I'll help.",
    },
  },
  {
    kind: "theory",
    eyebrow: "Шаг 4 · GOING TO",
    title: "Намерение и прогноз по признакам",
    paragraphs: [
      "Going to — обычный выбор, когда решение уже принято до разговора. Ты собираешься что-то сделать, даже если детали ещё не организованы.",
      "Второй случай — прогноз на основании того, что видно прямо сейчас: тучи, скользкий пол, человек бежит.",
      "Формула: am / is / are + going to + начальная форма глагола. Отрицание — am / is / are + not going to. Вопрос — Are / Is / Am + подлежащее + going to + глагол?",
    ],
    examples: [
      { en: "I'm going to learn Italian.", ru: "Я собираюсь учить итальянский — решил заранее." },
      { en: "Look at those clouds! It's going to rain.", ru: "Прогноз по тому, что видно сейчас." },
      { en: "She isn't going to sell her house.", ru: "Она не собирается продавать дом." },
      { en: "Are you going to study tonight?", ru: "Ты собираешься заниматься сегодня?" },
    ],
    note: "Going to не требует, чтобы всё было организовано. Это намерение или прогноз по признакам; в реальной речи возможны и другие формы.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    example: {
      text: "I've decided to learn Italian. I'm going to learn it next year.",
    },
    customQuestion: {
      id: "future-practice-going-to-1",
      prompt: "We have decided to buy a new car. We ___ a new car next month.",
      options: ["will buy", "are going to buy", "are buying", "buy"],
      correctAnswer: "are going to buy",
      explanation:
        "Решение уже принято до разговора. Это намерение, поэтому используем are going to buy.",
    },
  },
  {
    kind: "theory",
    eyebrow: "Шаг 6 · PRESENT CONTINUOUS",
    title: "Договорённость уже существует",
    paragraphs: [
      "Present Continuous особенно естественен, когда встреча или план уже организованы и у них есть конкретные детали: время, место, билеты, запись.",
      "Это не просто намерение. Вы уже договорились, подтвердили встречу или купили билет.",
      "Формула: am / is / are + глагол-ing. Отрицание и вопрос строятся так же, как в обычном Present Continuous.",
    ],
    examples: [
      { en: "I'm meeting Alex tomorrow at 7.", ru: "Я встречаюсь с Алексом завтра в семь — договорились." },
      { en: "We're flying to Rome next Saturday.", ru: "Мы летим в Рим в субботу — билеты куплены." },
      { en: "She isn't coming to the party.", ru: "Она не придёт на вечеринку." },
      { en: "Are you meeting Sam tonight?", ru: "Ты встречаешься с Сэмом сегодня вечером?" },
    ],
    note: "Present Continuous для будущего — это не любое действие в будущем, а прежде всего организованная договорённость. В реальной речи формы могут пересекаться.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 7 · Практика",
    example: {
      text: "We've booked a table. We're having dinner at seven.",
    },
    customQuestion: {
      id: "future-practice-continuous-1",
      prompt: "We have booked tickets. We ___ to Rome on Friday.",
      options: ["will fly", "are going to fly", "are flying", "fly"],
      correctAnswer: "are flying",
      explanation:
        "Билеты уже куплены, поездка организована. Для договорённости используем are flying.",
    },
  },
  {
    kind: "sorting",
    eyebrow: "Шаг 8 · Сортировка",
    title: "Разложи будущее по ситуациям",
    instruction:
      "Определи, какая форма лучше подходит к каждой ситуации. Нажимай на название формы под предложением.",
    categories: ["Will", "Going to", "Present Continuous"],
    items: [
      {
        text: "The phone is ringing! I ___ it.",
        category: "Will",
        explanation: "Спонтанное решение в момент разговора.",
      },
      {
        text: "I've already decided. I ___ Italian next year.",
        category: "Going to",
        explanation: "Намерение уже принято заранее.",
      },
      {
        text: "We ___ Anna at seven. We've booked a table.",
        category: "Present Continuous",
        explanation: "Встреча уже организована.",
      },
      {
        text: "Look at those clouds! It ___ soon.",
        category: "Going to",
        explanation: "Прогноз по видимым признакам.",
      },
    ],
  },
  {
    kind: "theory",
    eyebrow: "Шаг 9 · Как выбрать",
    title: "Не смотри только на tomorrow",
    paragraphs: [
      "Слова tomorrow, next week, tonight и soon могут встречаться со всеми тремя формами. Они не выбирают форму за тебя.",
      "Задай вопрос: решение появилось сейчас? Это will. Решение уже было, но детали не организованы? Это going to. Всё уже согласовано? Это Present Continuous.",
      "Сравни: I think I'll visit Paris one day — предположение. I'm going to visit Paris next summer — намерение. I'm visiting Paris next Friday — поездка организована.",
    ],
    examples: [
      { en: "I'll meet you after work.", ru: "Решение или обещание, данное сейчас." },
      { en: "I'm going to meet you after work.", ru: "Намерение уже есть." },
      { en: "I'm meeting you after work.", ru: "Вы уже договорились." },
    ],
    note: "Смысл ситуации важнее слов-маркеров. Конструкции могут пересекаться: иногда допустимы несколько форм, но оттенок смысла будет разным.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 10 · Практика",
    example: {
      text: "Look at the clouds! It's going to rain.",
    },
    customQuestion: {
      id: "future-practice-going-to-2",
      prompt: "Look at that car! It ___ into the tree!",
      options: ["will crash", "is going to crash", "is crashing", "crashes"],
      correctAnswer: "is going to crash",
      explanation:
        "Ты видишь, что машина вот-вот врежется. Это прогноз по признакам — is going to crash.",
    },
  },
  {
    kind: "practice",
    eyebrow: "Шаг 11 · Практика",
    example: {
      text: "Those boxes look heavy. I'll help you.",
    },
    customQuestion: {
      id: "future-practice-will-2",
      prompt: "Those boxes look heavy. ___ you with them.",
      options: ["I'm going to help", "I'll help", "I'm helping", "I help"],
      correctAnswer: "I'll help",
      explanation:
        "Ты предлагаешь помощь прямо сейчас, поэтому используем I'll help.",
    },
  },
  {
    kind: "spot",
    eyebrow: "Шаг 12 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение грамматически неверным. Проверь форму после will.",
    sentence: "I will to help you with these heavy bags.",
    words: ["I", "will", "to", "help", "you", "with", "these", "heavy", "bags."],
    errorIndex: 2,
    explanation:
      "После will не ставим to: I will help you with these heavy bags. Will + начальная форма глагола.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 13 · Сборка предложения",
    title: "Собери намерение",
    russian: "Я собираюсь посетить Париж следующим летом.",
    words: ["I'm", "going", "to", "visit", "Paris", "next", "summer."],
    initialWords: ["visit", "I'm", "summer.", "to", "Paris", "going", "next"],
    correct: ["I'm", "going", "to", "visit", "Paris", "next", "summer."],
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 14 · Сборка вопроса",
    title: "Собери вопрос о встрече",
    russian: "Ты встречаешься с Сэмом сегодня вечером?",
    words: ["Are", "you", "meeting", "Sam", "tonight?"],
    initialWords: ["meeting", "Are", "tonight?", "you", "Sam"],
    correct: ["Are", "you", "meeting", "Sam", "tonight?"],
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 15 · Перед финальным тестом",
    title: "Урок почти пройден",
    lead: "Остался финальный тест. Сначала коротко повтори, какая форма подходит к какой ситуации.",
    summary: [
      {
        label: "Will",
        text: "Решение сейчас, обещание, предложение помощи, предположение с I think. Will + глагол.",
      },
      {
        label: "Going to",
        text: "Намерение принято заранее или прогноз по видимым признакам. Be going to + глагол.",
      },
      {
        label: "Continuous",
        text: "Организованная встреча или план: be + глагол-ing. Детали уже согласованы.",
      },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 16 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [1, 2, 3, 4],
    extraQuestionsAt: 0,
    extraQuestions: [
      {
        id: "future-final-prediction",
        prompt: "I think our team ___ the match tomorrow.",
        options: ["will win", "will winning", "will to win", "winning"],
        correctAnswer: "will win",
        explanation:
          "После will нужна начальная форма глагола: will win. Остальные варианты грамматически неверны.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 17 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал will, going to и Present Continuous для будущего, их формулы и разницу между решением, намерением и договорённостью.",
    formula: [
      "Will: will + глагол",
      "Going to: am / is / are + going to + глагол",
      "Continuous: am / is / are + глагол-ing",
    ],
  },
];

export const FUTURE_WILL_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    eyebrow: "Шаг 1 · Сцена",
    title: "Что ты скажешь?",
    lead: "Выбери фразу, которая звучит естественнее в этот момент.",
    scenario:
      "Ты дома. Телефон звонит, хотя ты не ждал звонка. Ты решаешь ответить прямо сейчас.",
    example: "I ___ answer it.",
    options: ["I'll answer it.", "I'm going to answer it."],
    correctOption: "I'll answer it.",
    explanation:
      "Решение появилось прямо сейчас, в момент звонка. Для такого спонтанного решения естественно использовать will: I'll answer it.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Когда нужен will",
    title: "Решение, обещание, прогноз",
    paragraphs: [
      "Will часто используется, когда решение появляется прямо в разговоре: The phone is ringing. I'll answer it.",
      "Will также часто подходит для обещаний и предложений помощи: I'll help you with your bags. I won't tell anyone.",
      "Will может выражать прогнозы и личные мнения: I think it will rain tomorrow. Probably she will come later.",
    ],
    examples: [
      { en: "The phone is ringing. I'll answer it.", ru: "Решение принято сейчас." },
      { en: "I'll help you with your bags.", ru: "Предложение помощи." },
      { en: "I won't tell anyone.", ru: "Обещание не делать чего-то." },
      { en: "I think it will rain tomorrow.", ru: "Личный прогноз." },
    ],
    note: "Will — частый, но не единственный способ говорить о будущем. Выбор зависит от смысла ситуации.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 1,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 4 · Форма",
    title: "Will + начальная форма",
    paragraphs: [
      "После will глагол всегда стоит в начальной форме, без to и без окончаний: will go, will call, will be.",
      "Will не меняется по лицам: I will go, he will go, they will go. Сокращение — 'll.",
      "Отрицание — will not или won't. Вопрос — Will + подлежащее + глагол?",
    ],
    examples: [
      { en: "I will call you tomorrow.", ru: "Я позвоню тебе завтра." },
      { en: "He won't be late.", ru: "Он не опоздает." },
      { en: "Will you help me?", ru: "Ты поможешь мне?" },
    ],
    note: "Типичная ошибка: I will to go / He will goes. Правильно: I will go / He will go.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 8,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 6 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение грамматически неверным. Проверь форму после will.",
    sentence: "I will to call you tomorrow morning.",
    words: ["I", "will", "to", "call", "you", "tomorrow", "morning."],
    errorIndex: 2,
    explanation:
      "После will не ставим to: I will call you tomorrow morning. Will + начальная форма глагола.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 7 · Обещания и прогнозы",
    title: "Как отличить оттенок",
    paragraphs: [
      "Спонтанное решение обычно рождается в ответ на ситуацию: It's cold. I'll close the window.",
      "Обещание часто звучит с I promise, I'll, I won't: I promise I won't be late.",
      "Прогноз — это мнение или предположение: I think, probably, I'm sure. I think our team will win.",
    ],
    examples: [
      { en: "It's cold. I'll close the window.", ru: "Спонтанное решение." },
      { en: "I promise I'll call you.", ru: "Обещание." },
      { en: "I think she will agree.", ru: "Мнение о будущем." },
      { en: "Probably it will snow.", ru: "Вероятностный прогноз." },
    ],
    note: "I think часто сопровождает will, но не делает его единственным вариантом. В реальной речи формы могут пересекаться.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 8 · Практика",
    questionIndex: 3,
  },
  {
    kind: "matching",
    eyebrow: "Шаг 9 · Соедини смыслы",
    title: "Что выражает фраза?",
    instruction:
      "Соедини предложение с его функцией: решение, обещание, предложение помощи или прогноз.",
    pairs: [
      { left: "The phone is ringing. I'll answer it.", right: "Спонтанное решение" },
      { left: "I'll carry your bag.", right: "Предложение помощи" },
      { left: "I won't tell anyone.", right: "Обещание" },
      { left: "I think it will rain.", right: "Прогноз" },
    ],
    rightOptions: [
      "Спонтанное решение",
      "Предложение помощи",
      "Обещание",
      "Прогноз",
    ],
    successText: "Все функции совпали: решение, помощь, обещание и прогноз.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 10 · Сборка",
    title: "Собери обещание",
    russian: "Я позвоню тебе завтра.",
    words: ["I", "will", "call", "you", "tomorrow."],
    initialWords: ["call", "I", "tomorrow.", "will", "you"],
    correct: ["I", "will", "call", "you", "tomorrow."],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 11 · Практика",
    questionIndex: 7,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 12 · Не только will",
    title: "Формы могут пересекаться",
    paragraphs: [
      "Will — не единственный способ говорить о будущем. Если решение уже принято заранее, чаще подойдёт going to: I'm going to study tonight.",
      "Если встреча организована, естественен Present Continuous: I'm meeting Anna at seven.",
      "Иногда несколько форм допустимы, но оттенок меняется. Спонтанность, намерение и договорённость — разные смыслы.",
    ],
    examples: [
      { en: "I'll call him now.", ru: "Решение сейчас." },
      { en: "I'm going to call him tonight.", ru: "Намерение уже есть." },
      { en: "I'm calling him at seven.", ru: "Договорённость." },
    ],
    note: "Выбирай форму по смыслу ситуации, а не только по слову tomorrow.",
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 13 · Перед тестом",
    title: "Коротко о главном",
    lead: "Проверь себя: три функции will, форма и типичная ошибка.",
    summary: [
      { label: "Решение", text: "Решение появилось сейчас: I'll answer it." },
      { label: "Обещание", text: "I'll help you. I won't tell anyone." },
      { label: "Прогноз", text: "I think it will rain. Probably she will come." },
      { label: "Форма", text: "Will + начальная форма. Без to и без -s." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 14 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [0, 2, 4, 5, 6],
    extraQuestions: [
      {
        id: "will-final-offer",
        prompt: "___ you open the window, please? It's hot.",
        options: ["Will", "Do", "Are", "Did"],
        correctAnswer: "Will",
        explanation:
          "Просьба или предложение помощи строится через Will: Will you open the window?",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 15 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал will для решений, обещаний и прогнозов, его форму и отличие от других форм будущего.",
    formula: [
      "Will + начальная форма глагола",
      "Will not / won't + глагол",
      "Will + подлежащее + глагол?",
    ],
  },
];

export const FUTURE_GOING_TO_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "comparison",
    eyebrow: "Шаг 1 · Сравнение",
    title: "Что это за план?",
    lead: "Какая карточка выражает намерение, а не уже согласованную встречу?",
    scenario:
      "Два плана на лето. В одном случае решение уже есть, но детали ещё не согласованы. В другом — встреча уже организована.",
    example: "I'm going to visit Paris next summer.",
    options: [
      "I'm going to visit Paris next summer.",
      "I'm visiting Paris next Friday — the tickets are booked.",
    ],
    correctOption: "I'm going to visit Paris next summer.",
    explanation:
      "Первая фраза выражает намерение: решение есть, но поездка ещё не организована. Вторая — уже согласованная поездка с билетами.",
    comparison: {
      first: "I'm going to visit Paris next summer.",
      second: "I'm visiting Paris next Friday — the tickets are booked.",
    },
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Два случая",
    title: "Намерение и прогноз по признакам",
    paragraphs: [
      "1. Намерение: решение уже принято до разговора. I'm going to learn Italian. She's going to sell her car.",
      "2. Прогноз по видимым признакам: мы видим доказательство прямо сейчас. Look at those clouds! It's going to rain. Watch out! You're going to drop it.",
      "Для уже организованной встречи или поездки часто лучше Present Continuous: We're meeting at seven. Но в реальной речи формы могут пересекаться.",
    ],
    examples: [
      { en: "I'm going to learn Italian.", ru: "Решение принято заранее." },
      { en: "Look at those clouds! It's going to rain.", ru: "Прогноз по признакам." },
      { en: "She's going to sell her car.", ru: "Намерение." },
      { en: "We're going to move next month.", ru: "План на будущее." },
    ],
    note: "Going to — про намерение или прогноз по видимым признакам, а не про любую фразу с tomorrow.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 2,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 4 · Форма",
    title: "Be + going to + глагол",
    paragraphs: [
      "Формула: am / is / are + going to + начальная форма глагола. I am going to work. She is going to study.",
      "Отрицание: am / is / are + not + going to + глагол. Вопрос: Am / Is / Are + подлежащее + going to + глагол?",
      "Не забывай про am / is / are: I going to travel — ошибка. Правильно: I am going to travel.",
    ],
    examples: [
      { en: "I'm going to call her.", ru: "Я собираюсь ей позвонить." },
      { en: "They aren't going to move.", ru: "Они не собираются переезжать." },
      { en: "Are you going to study tonight?", ru: "Ты собираешься заниматься вечером?" },
    ],
    note: "После going to — начальная форма: going to visit, а не going to visited.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 5,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 6 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение грамматически неверным. Проверь форму после going to.",
    sentence: "She is going to studies medicine next year.",
    words: ["She", "is", "going", "to", "studies", "medicine", "next", "year."],
    errorIndex: 4,
    explanation:
      "После going to нужна начальная форма: She is going to study medicine next year.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 7 · Намерение или признак",
    title: "Два разных прогноза",
    paragraphs: [
      "Намерение отвечает на вопрос «что ты собираешься сделать?»: I'm going to start a new course.",
      "Прогноз по признакам опирается на то, что видно сейчас: The glass is falling — it's going to break.",
      "В обоих случаях есть опора: заранее принятое решение или видимое доказательство.",
    ],
    examples: [
      { en: "I'm going to start a new course.", ru: "Намерение." },
      { en: "Look at the sky! It's going to snow.", ru: "Признак." },
      { en: "He's going to buy a flat.", ru: "План." },
      { en: "Watch out! You're going to drop it.", ru: "Прогноз по ситуации." },
    ],
    note: "Смотри на контекст: решение уже было или доказательство появилось сейчас.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 8 · Практика",
    questionIndex: 1,
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 9 · Сборка",
    title: "Собери намерение",
    russian: "Я собираюсь навестить родителей в эти выходные.",
    words: ["I'm", "going", "to", "visit", "my", "parents", "this", "weekend."],
    initialWords: ["visit", "I'm", "weekend.", "to", "parents", "going", "this", "my"],
    correct: ["I'm", "going", "to", "visit", "my", "parents", "this", "weekend."],
  },
  {
    kind: "theory",
    eyebrow: "Шаг 10 · Контекст",
    title: "Going to, will или Continuous?",
    paragraphs: [
      "Will — спонтанное решение или мнение: I'll answer it. Going to — намерение или прогноз по признакам: I'm going to answer it.",
      "Present Continuous — организованная договорённость: I'm meeting Anna at seven.",
      "Формы могут пересекаться. Иногда допустимы несколько вариантов, но оттенок будет разным.",
    ],
    examples: [
      { en: "I forgot my wallet. I'll go back.", ru: "Спонтанное решение." },
      { en: "I'm going to go back home.", ru: "Намерение." },
      { en: "I'm going home at six.", ru: "Договорённость." },
    ],
    note: "Не превращай разницу в жёсткое правило: смысл важнее ярлыка.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 11 · Практика",
    questionIndex: 4,
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 12 · Перед тестом",
    title: "Коротко о главном",
    lead: "Проверь себя: два случая going to, форма и вопросы.",
    summary: [
      { label: "Намерение", text: "Решение уже есть: I'm going to study tonight." },
      { label: "Признак", text: "Видно сейчас: Look! It's going to rain." },
      { label: "Форма", text: "Am / is / are + going to + начальная форма." },
      { label: "Вопрос", text: "Are you going to study? Is she going to come?" },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 13 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [3, 6, 7, 8, 9],
    extraQuestions: [
      {
        id: "going-to-final-evidence",
        prompt: "Look at the glass! It ___ fall.",
        options: ["is going to", "are going to", "going to", "goes to"],
        correctAnswer: "is going to",
        explanation:
          "Мы видим, что стакан вот-вот упадёт. Это прогноз по признакам: it is going to fall.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 14 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал going to для намерений и прогнозов по признакам, форму с am / is / are и отличие от will и Present Continuous.",
    formula: [
      "Am / is / are + going to + глагол",
      "Am / is / are + not + going to + глагол",
      "Are / Is / Am + подлежащее + going to + глагол?",
    ],
  },
];

export const MODAL_VERBS_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "context",
    eyebrow: "Шаг 1 · Контекст",
    title: "Что означает фраза?",
    lead: "Выбери наиболее точный перевод и объяснение.",
    quote: "You should see a doctor.",
    example: "You should see a doctor.",
    options: [
      "Тебе стоит показаться врачу.",
      "Ты обязан показаться врачу.",
    ],
    correctOption: "Тебе стоит показаться врачу.",
    explanation:
      "Should даёт совет или мягкую рекомендацию. Это не строгая обязанность и не запрет.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Три модальных",
    title: "Must, have to, should",
    paragraphs: [
      "Must выражает сильную необходимость, особенно когда говорящий сам подчёркивает важность: I must call my manager today.",
      "Have to чаще описывает внешнюю необходимость — правила, работу, обстоятельства: I have to get up at six.",
      "Should даёт совет: You should take an umbrella. Это не обязанность.",
      "Границы между must и have to могут размываться. В правилах и законах оба варианта иногда возможны, но have to звучит нейтральнее.",
    ],
    examples: [
      { en: "You must wear a seat belt.", ru: "Сильная необходимость." },
      { en: "She has to show her passport.", ru: "Внешнее правило." },
      { en: "You should rest.", ru: "Совет." },
    ],
    note: "Must и should используются с начальной формой глагола, без to.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 5,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 4 · Формы",
    title: "Как построить фразу",
    paragraphs: [
      "Must + глагол: I must go. He must go. Форма must не меняется.",
      "Have to меняется: I / you / we / they have to work; he / she / it has to work.",
      "Should + глагол: You should rest. She should rest.",
      "Вопросы: Must I book a table? Do you have to work on Saturday? Should I call her?",
    ],
    examples: [
      { en: "I have to work late.", ru: "Мне приходится работать допоздна." },
      { en: "Does she have to wear a uniform?", ru: "Ей нужно носить форму?" },
      { en: "You shouldn't buy it.", ru: "Тебе не стоит это покупать." },
    ],
    note: "После must и should не ставим to. После have to — начальная форма: have to go.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 2,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 6 · Совет",
    title: "Should и shouldn't",
    paragraphs: [
      "Should используют, когда предлагают хорошую идею или мягко рекомендуют: You should see this film.",
      "Shouldn't — отрицательный совет: You shouldn't eat so much sugar.",
      "Should не означает «обязан». Если нужно передать строгую обязанность, чаще подойдут must или have to.",
    ],
    examples: [
      { en: "You should take an umbrella.", ru: "Тебе стоит взять зонт." },
      { en: "He should see this film.", ru: "Ему стоит посмотреть этот фильм." },
      { en: "You shouldn't buy it.", ru: "Тебе не стоит это покупать." },
    ],
    note: "Should — совет. Must и have to — необходимость.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 7 · Практика",
    questionIndex: 7,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 8 · Запрет или необязательность",
    title: "Mustn't ≠ don't have to",
    paragraphs: [
      "Mustn't означает «нельзя, запрещено»: You mustn't park here.",
      "Don't have to означает «не обязательно, можно не делать»: You don't have to come early.",
      "Это разные смыслы: запрет и отсутствие необходимости. Не путай их.",
    ],
    examples: [
      { en: "You mustn't touch that button.", ru: "Кнопку трогать нельзя." },
      { en: "You don't have to come early.", ru: "Приходить рано необязательно." },
      { en: "She doesn't have to work today.", ru: "Ей не нужно работать сегодня." },
    ],
    note: "Mustn't = запрещено. Don't have to = необязательно.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 9 · Практика",
    questionIndex: 3,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 10 · Практика",
    questionIndex: 4,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 11 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение грамматически неверным. Проверь форму после must.",
    sentence: "You must to see a doctor.",
    words: ["You", "must", "to", "see", "a", "doctor."],
    errorIndex: 2,
    explanation:
      "После must не ставим to: You must see a doctor. Must + начальная форма глагола.",
  },
  {
    kind: "sorting",
    eyebrow: "Шаг 12 · Сортировка",
    title: "Определи функцию",
    instruction:
      "Разложи фразы по смыслу: обязанность, совет, запрет или отсутствие необходимости.",
    categories: ["Обязанность", "Совет", "Запрет", "Не обязательно"],
    items: [
      {
        text: "You must wear a seat belt.",
        category: "Обязанность",
        explanation: "Сильная необходимость.",
      },
      {
        text: "You should take an umbrella.",
        category: "Совет",
        explanation: "Мягкая рекомендация.",
      },
      {
        text: "You mustn't park here.",
        category: "Запрет",
        explanation: "Здесь нельзя парковаться.",
      },
      {
        text: "You don't have to come early.",
        category: "Не обязательно",
        explanation: "Можно не приходить рано.",
      },
    ],
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 13 · Сборка",
    title: "Собери совет",
    russian: "Тебе стоит показаться врачу.",
    words: ["You", "should", "see", "a", "doctor."],
    initialWords: ["see", "You", "doctor.", "should", "a"],
    correct: ["You", "should", "see", "a", "doctor."],
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 14 · Перед тестом",
    title: "Коротко о главном",
    lead: "Проверь себя: сила необходимости, формы и разница между запретом и необязательностью.",
    summary: [
      { label: "Must", text: "Сильная необходимость: I must call him." },
      { label: "Have to", text: "Внешняя необходимость: I have to work." },
      { label: "Should", text: "Совет: You should rest." },
      { label: "Запрет", text: "Mustn't = нельзя. Don't have to = необязательно." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 15 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [1, 6],
    extraQuestionsAt: 0,
    extraQuestions: [
      {
        id: "modal-final-must",
        prompt:
          "I ___ send this report tonight. It is absolutely mandatory, and I have no choice.",
        options: ["must", "don't have to", "mustn't", "should"],
        correctAnswer: "must",
        explanation:
          "Говорящий подчёркивает обязательность и отсутствие выбора. Must выражает сильную необходимость; should был бы только советом.",
      },
      {
        id: "modal-final-mustnt",
        prompt: "You ___ leave your bags here. It's a security area.",
        options: ["don't have to", "mustn't", "should", "have to"],
        correctAnswer: "mustn't",
        explanation:
          "Это запрет: оставлять сумки здесь нельзя. Mustn't означает «запрещено».",
      },
      {
        id: "modal-final-dont-have-to",
        prompt:
          "It's Saturday. You have no plans and no obligations today, so you ___ get up early.",
        options: ["mustn't", "don't have to", "should", "must"],
        correctAnswer: "don't have to",
        explanation:
          "Планов и обязательств нет, поэтому вставать рано необязательно. Don't have to = нет необходимости.",
      },
      {
        id: "modal-final-have-to",
        prompt: "I ___ wear a uniform at work. It's the rule.",
        options: ["have to", "don't have to", "mustn't", "should"],
        correctAnswer: "have to",
        explanation:
          "Это внешнее правило, поэтому естественно have to: I have to wear a uniform.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 16 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал must, have to и should, их формы, вопросы, отрицания и разницу между запретом и отсутствием необходимости.",
    formula: [
      "Must + глагол",
      "Have to / has to + глагол",
      "Should + глагол",
      "Mustn't = запрещено · Don't have to = необязательно",
    ],
  },
];

export const QUANTIFIERS_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    eyebrow: "Шаг 1 · Сцена",
    title: "Сколько это?",
    lead: "Какой вопрос звучит правильно?",
    scenario:
      "Ты в кафе помогаешь другу с заказом. Ты хочешь узнать, сколько сахара ему нужно.",
    example: "How ___ sugar do you need?",
    options: ["How much sugar do you need?", "How many sugar do you need?"],
    correctOption: "How much sugar do you need?",
    explanation:
      "Sugar — неисчисляемое существительное. Для количества неисчисляемого используем how much.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Сначала существительное",
    title: "Можно посчитать или нет?",
    paragraphs: [
      "Much и little работают с неисчисляемыми существительными: water, time, money, sugar, information.",
      "Many и few работают с исчисляемыми во множественном числе: books, friends, tickets, people.",
      "A lot of подходит к обоим типам. В утверждениях он часто звучит естественнее, чем much или many.",
    ],
    examples: [
      { en: "I don't have much time.", ru: "У меня не так много времени." },
      { en: "There aren't many seats.", ru: "Здесь не так много мест." },
      { en: "We have a lot of work today.", ru: "У нас сегодня много работы." },
      { en: "She has a lot of books.", ru: "У неё много книг." },
    ],
    note: "Сначала реши, исчисляемое существительное или нет. От этого зависит выбор слова.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 4 · Much, many, a lot of",
    title: "Где какой вариант",
    paragraphs: [
      "Much чаще встречается в вопросах и отрицаниях: How much water? I don't have much time.",
      "Many — для исчисляемых во множественном числе: How many tickets? There aren't many seats.",
      "A lot of — универсальное «много» для обоих типов, особенно в утверждениях: a lot of work, a lot of friends.",
    ],
    examples: [
      { en: "How much water do you need?", ru: "Сколько воды тебе нужно?" },
      { en: "How many emails did you get?", ru: "Сколько писем ты получил?" },
      { en: "I have a lot of friends.", ru: "У меня много друзей." },
    ],
    note: "Much books и many water — типичные ошибки. Правильно: many books, much water.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 2,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 6 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение неверным. Проверь, можно ли посчитать существительное.",
    sentence: "I have much books on my shelf.",
    words: ["I", "have", "much", "books", "on", "my", "shelf."],
    errorIndex: 2,
    explanation:
      "Books — исчисляемые во множественном числе. Нужно many: I have many books. В утверждении также можно сказать a lot of books.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 7 · Little и few",
    title: "Мало или немного",
    paragraphs: [
      "Little и a little — для неисчисляемых. Little значит «почти нет, недостаточно». A little — «немного есть».",
      "Few и a few — для исчисляемых во множественном числе. Few значит «почти нет». A few — «несколько, есть немного».",
      "Одна буква a меняет смысл: I have little time — почти нет времени. I have a little time — немного времени есть.",
    ],
    examples: [
      { en: "There is little milk left.", ru: "Молока почти не осталось." },
      { en: "There is a little milk left.", ru: "Немного молока осталось." },
      { en: "Few people came.", ru: "Пришло мало людей." },
      { en: "I have a few questions.", ru: "У меня есть несколько вопросов." },
    ],
    note: "Little / a little + неисчисляемое. Few / a few + исчисляемое множественное.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 8 · Практика",
    questionIndex: 3,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 9 · Практика",
    questionIndex: 4,
  },
  {
    kind: "sorting",
    eyebrow: "Шаг 10 · Сортировка",
    title: "Выбери слово для пропуска",
    instruction:
      "Определи, какое слово подходит к существительному и смыслу предложения.",
    categories: ["Much", "Many", "A lot of", "Little", "Few"],
    items: [
      {
        text: "How ___ time do you need?",
        category: "Much",
        explanation: "Time неисчисляемое, вопрос о количестве — how much.",
      },
      {
        text: "How ___ tickets are left?",
        category: "Many",
        explanation: "Tickets исчисляемые во множественном числе — how many.",
      },
      {
        text: "We have ___ work today.",
        category: "A lot of",
        explanation: "Work неисчисляемое, в утверждении естественно a lot of.",
      },
      {
        text: "Very ___ people came.",
        category: "Few",
        explanation: "People исчисляемые во множественном числе; very few значит «очень мало».",
      },
    ],
  },
  {
    kind: "theory",
    eyebrow: "Шаг 11 · Смысл важнее формы",
    title: "Почти нет или немного есть",
    paragraphs: [
      "Little и few звучат пессимистично: чего-то почти нет. A little и a few — нейтрально: немного есть.",
      "Сравни: There is little milk left — надо купить. There is a little milk left — можно сделать кофе.",
      "Few people came — пришло мало, зал пустой. A few people came — несколько человек пришли.",
    ],
    examples: [
      { en: "I have little time.", ru: "У меня почти нет времени." },
      { en: "I have a little time.", ru: "У меня есть немного времени." },
      { en: "Few people came.", ru: "Пришло мало людей." },
      { en: "A few people came.", ru: "Пришли несколько человек." },
    ],
    note: "Не путай little и a little, few и a few: a меняет смысл на «немного есть».",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 12 · Практика",
    questionIndex: 5,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 13 · Практика",
    questionIndex: 7,
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 14 · Сборка",
    title: "Собери вопрос",
    russian: "Сколько книг ты купил?",
    words: ["How", "many", "books", "did", "you", "buy?"],
    initialWords: ["books", "How", "buy?", "did", "many", "you"],
    correct: ["How", "many", "books", "did", "you", "buy?"],
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 15 · Перед тестом",
    title: "Коротко о главном",
    lead: "Проверь себя: исчисляемое или нет, much/many, a lot of и пары little/few.",
    summary: [
      { label: "Much", text: "Неисчисляемое: much time, much water." },
      { label: "Many", text: "Исчисляемое множественное: many books, many people." },
      { label: "A lot of", text: "Оба типа: a lot of work, a lot of friends." },
      { label: "Little / Few", text: "Little + неисчисляемое, few + исчисляемое. A little / a few = немного есть." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 16 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [1, 6],
    extraQuestions: [
      {
        id: "quant-final-much",
        prompt: "There isn't ___ milk left.",
        options: ["much", "many", "few", "a few"],
        correctAnswer: "much",
        explanation:
          "Milk — неисчисляемое. В отрицании используем much: There isn't much milk left.",
      },
      {
        id: "quant-final-many",
        prompt: "How ___ people came to the party?",
        options: ["much", "many", "little", "a little"],
        correctAnswer: "many",
        explanation:
          "People — исчисляемое во множественном числе. Вопрос о количестве: How many people?",
      },
      {
        id: "quant-final-little",
        prompt: "We have ___ time, so let's hurry.",
        options: ["little", "a little", "few", "a few"],
        correctAnswer: "little",
        explanation:
          "Time — неисчисляемое. Little значит «почти нет, недостаточно», поэтому нужно спешить.",
      },
      {
        id: "quant-final-a-few",
        prompt: "There are ___ chairs, so we can all sit down.",
        options: ["few", "a few", "little", "a little"],
        correctAnswer: "a few",
        explanation:
          "Chairs — исчисляемое множественное. A few значит «несколько, немного есть»: мест хватает.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 17 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал much, many, a lot of, little, a little, few и a few, а также разницу между «почти нет» и «немного есть».",
    formula: [
      "Much + неисчисляемое",
      "Many + исчисляемое множественное",
      "A lot of + оба типа",
      "Little / a little + неисчисляемое · Few / a few + исчисляемое",
    ],
  },
];

export const PAST_CONTINUOUS_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    eyebrow: "Шаг 1 · Сцена",
    title: "Что происходило?",
    lead: "Какая фраза точнее описывает процесс в этот момент?",
    scenario:
      "Ты звонишь другу в 8 вечера. Он не отвечает, потому что в этот момент смотрел телевизор.",
    example: "He ___ TV at 8 PM.",
    options: ["He watched TV.", "He was watching TV."],
    correctOption: "He was watching TV.",
    explanation:
      "Нам важен процесс в конкретный момент прошлого, а не просто факт. Используем Past Continuous: was watching.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Процесс в прошлом",
    title: "Действие в процессе",
    paragraphs: [
      "Past Continuous описывает действие, которое находилось в процессе в конкретный момент прошлого: At 5 PM I was cooking dinner.",
      "Нам важен процесс в этот момент, а не сообщение о том, что действие завершилось. Часто есть точка времени: at 8 PM, at that moment, all day yesterday.",
      "Сравни: I cooked dinner — завершённое событие. I was cooking dinner at 5 — действие было в процессе в 5 часов.",
    ],
    examples: [
      { en: "At 5 PM I was cooking dinner.", ru: "В 5 вечера я готовил ужин." },
      { en: "They were playing football at that moment.", ru: "В тот момент они играли в футбол." },
      { en: "I was working all day yesterday.", ru: "Вчера я работал весь день." },
    ],
    note: "Past Continuous показывает процесс в определённый момент прошлого, а Past Simple — завершённое событие.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 4 · Форма",
    title: "Was / were + V-ing",
    paragraphs: [
      "Утверждение: was / were + глагол-ing. I was working. They were playing.",
      "С I, he, she, it — was. С we, you, they — were.",
      "Отрицание: wasn't / weren't + V-ing. Вопрос: Was / Were + подлежащее + V-ing?",
    ],
    examples: [
      { en: "I wasn't sleeping at 10 PM.", ru: "В 10 вечера я не спал." },
      { en: "They weren't listening.", ru: "Они не слушали." },
      { en: "Was she reading a book?", ru: "Она читала книгу?" },
      { en: "Were you working at 3?", ru: "Ты работал в три?" },
    ],
    note: "Was — для I / he / she / it. Were — для we / you / they.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 3,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 6 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение неверным. Проверь глагол состояния.",
    sentence: "I was knowing the answer.",
    words: ["I", "was", "knowing", "the", "answer."],
    errorIndex: 2,
    explanation:
      "Know — глагол состояния, в этом значении он обычно не используется в Continuous. Правильно: I knew the answer.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 7 · Фон и событие",
    title: "When и while",
    paragraphs: [
      "Past Continuous часто создаёт фон, а Past Simple сообщает о коротком событии: I was walking home when I saw a dog.",
      "While обычно подчёркивает длительное действие: While I was cooking, the phone rang.",
      "Выбор времени зависит от смысла, а не только от слова when или while.",
    ],
    examples: [
      { en: "I was walking home when I saw a dog.", ru: "Я шёл домой, когда увидел собаку." },
      { en: "While I was cooking, the phone rang.", ru: "Пока я готовил, зазвонил телефон." },
      { en: "They were playing when it started to rain.", ru: "Они играли, когда начался дождь." },
    ],
    note: "Past Continuous — действие в процессе; Past Simple — завершённое событие.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 8 · Практика",
    questionIndex: 2,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 9 · Практика",
    questionIndex: 5,
  },
  {
    kind: "matching",
    eyebrow: "Шаг 10 · Соедини смыслы",
    title: "Что делает фраза?",
    instruction:
      "Соедини предложение с его функцией: процесс, фон, отрицание или вопрос.",
    pairs: [
      { left: "At 8 PM I was watching TV.", right: "Процесс в конкретный момент" },
      { left: "They were playing when it rained.", right: "Процесс и завершённое событие" },
      { left: "I wasn't sleeping at 10 PM.", right: "Отрицание" },
      { left: "Were you working at 3?", right: "Вопрос" },
    ],
    rightOptions: [
      "Процесс в конкретный момент",
      "Процесс и завершённое событие",
      "Отрицание",
      "Вопрос",
    ],
    successText: "Все функции совпали: процесс, фон, отрицание и вопрос.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 11 · Сборка",
    title: "Собери предложение",
    russian: "Я шёл домой, когда увидел собаку.",
    words: ["I", "was", "walking", "home", "when", "I", "saw", "a", "dog."],
    initialWords: ["walking", "I", "saw", "home", "when", "was", "dog.", "a", "I"],
    correct: ["I", "was", "walking", "home", "when", "I", "saw", "a", "dog."],
  },
  {
    kind: "theory",
    eyebrow: "Шаг 12 · Глаголы состояния",
    title: "Почему не was knowing",
    paragraphs: [
      "Глаголы состояния (know, like, want, believe) обычно не используются в Continuous, когда описывают состояние.",
      "Правильно: I knew the answer. Неправильно: I was knowing the answer.",
      "Но некоторые глаголы меняют значение и могут появляться в Continuous: I was thinking about you — я размышлял.",
    ],
    examples: [
      { en: "I knew the answer.", ru: "Я знал ответ." },
      { en: "She wanted to leave.", ru: "Она хотела уйти." },
      { en: "I was thinking about you.", ru: "Я думал о тебе — процесс." },
    ],
    note: "Смотри на значение: состояние обычно Simple, процесс может быть Continuous.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 13 · Практика",
    questionIndex: 9,
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 14 · Перед тестом",
    title: "Коротко о главном",
    lead: "Проверь себя: процесс, форма, Past Simple и глаголы состояния.",
    summary: [
      { label: "Смысл", text: "Процесс в конкретный момент прошлого." },
      { label: "Форма", text: "Was / were + V-ing. Was для I / he / she / it, were для we / you / they." },
      { label: "Вместе", text: "Past Continuous — процесс; Past Simple — завершённое событие." },
      { label: "Состояния", text: "Know, like, want обычно не используются в Continuous." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 15 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [1, 4, 6, 7, 8],
    extraQuestions: [
      {
        id: "past-continuous-final-while",
        prompt:
          "At 8 PM, we were in the middle of dinner when the lights went out. We ___ dinner at that moment.",
        options: ["were having", "was having", "had", "have"],
        correctAnswer: "were having",
        explanation:
          "В 8 вечера действие было в процессе, когда произошло другое событие. С we используем were having.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 16 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал Past Continuous для процессов в прошлом, его форму, связь с Past Simple и ограничения с глаголами состояния.",
    formula: [
      "Was / were + V-ing",
      "Wasn't / weren't + V-ing",
      "Was / Were + подлежащее + V-ing?",
      "Past Continuous — процесс · Past Simple — завершённое событие",
    ],
  },
];

export const PAST_SIMPLE_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "context",
    eyebrow: "Шаг 1 · Цитата",
    title: "Что общего у глаголов?",
    lead: "Выбери точное объяснение.",
    quote: "I came, I saw, I conquered.",
    example: "I came, I saw, I conquered.",
    options: [
      "Все три действия завершены в прошлом.",
      "Все три действия происходят сейчас.",
    ],
    correctOption: "Все три действия завершены в прошлом.",
    explanation:
      "Came, saw и conquered — вторая форма глаголов. Они сообщают о завершённых действиях в прошлом.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Завершённое прошлое",
    title: "Факт, который уже случился",
    paragraphs: [
      "Past Simple описывает завершённые действия и состояния в прошлом: I watched a movie yesterday.",
      "Время может быть указано прямо (yesterday, last week, in 2010) или понятно из контекста рассказа.",
      "Правильные глаголы получают -ed, неправильные имеют особую вторую форму: work → worked, go → went.",
    ],
    examples: [
      { en: "I watched a movie yesterday.", ru: "Вчера я посмотрел фильм." },
      { en: "She finished her homework.", ru: "Она закончила домашнюю работу." },
      { en: "We went to the cinema last week.", ru: "Мы ходили в кино на прошлой неделе." },
    ],
    note: "Past Simple — про факт: действие случилось и закончилось.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 4 · -ed и исключения",
    title: "Правильные и неправильные",
    paragraphs: [
      "Правильные глаголы: work → worked, live → lived, study → studied, stop → stopped.",
      "Неправильные нужно запоминать: go → went, see → saw, have → had, buy → bought, leave → left.",
      "Окончание -ed не добавляется к неправильным глаголам: go → went, а не goed.",
    ],
    examples: [
      { en: "work → worked", ru: "правильный глагол." },
      { en: "study → studied", ru: "y меняется на -ied." },
      { en: "stop → stopped", ru: "согласная удваивается." },
      { en: "buy → bought", ru: "неправильный глагол." },
    ],
    note: "Смотри на глагол: если он неправильный, нужна вторая форма, а не -ed.",
  },
  {
    kind: "sorting",
    eyebrow: "Шаг · Мини-практика",
    title: "Правильные или неправильные?",
    instruction:
      "Распредели глаголы по способу образования Past Simple.",
    categories: ["Правильные", "Неправильные"],
    items: [
      {
        text: "played",
        category: "Правильные",
        explanation: "Play + -ed → played.",
      },
      {
        text: "went",
        category: "Неправильные",
        explanation: "Go → went, особая вторая форма.",
      },
      {
        text: "studied",
        category: "Правильные",
        explanation: "Study → studied: y меняется на -ied.",
      },
      {
        text: "bought",
        category: "Неправильные",
        explanation: "Buy → bought, особая вторая форма.",
      },
    ],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 1,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 6 · Did",
    title: "Отрицания и вопросы",
    paragraphs: [
      "Отрицание: didn't + начальная форма глагола. I didn't watch TV.",
      "Вопрос: Did + подлежащее + начальная форма? Did you go to school?",
      "Как только появляется did или didn't, основной глагол теряет окончание -ed и возвращается в начальную форму.",
    ],
    examples: [
      { en: "I didn't watch TV.", ru: "Я не смотрел телевизор." },
      { en: "Did you go to school?", ru: "Ты ходил в школу?" },
      { en: "Where did you go?", ru: "Куда ты ходил?" },
    ],
    note: "Didn't watched и Did you went — типичные ошибки. После did/didn't нужна начальная форма.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 7 · Практика",
    questionIndex: 2,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 8 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение неверным. Проверь форму после didn't.",
    sentence: "I didn't watched TV yesterday.",
    words: ["I", "didn't", "watched", "TV", "yesterday."],
    errorIndex: 2,
    explanation:
      "После didn't нужна начальная форма: I didn't watch TV yesterday.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 9 · Практика",
    questionIndex: 4,
  },
  {
    kind: "matching",
    eyebrow: "Шаг 10 · Формы",
    title: "Соедини глагол и Past Simple",
    instruction: "Найди вторую форму каждого глагола.",
    pairs: [
      { left: "go", right: "went" },
      { left: "see", right: "saw" },
      { left: "study", right: "studied" },
      { left: "stop", right: "stopped" },
    ],
    rightOptions: ["went", "saw", "studied", "stopped"],
    successText: "Все формы совпали: две неправильные и две правильные.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 11 · Сборка",
    title: "Собери вопрос",
    russian: "Куда ты ездил прошлым летом?",
    words: ["Where", "did", "you", "go", "last", "summer?"],
    initialWords: ["you", "Where", "summer?", "go", "did", "last"],
    correct: ["Where", "did", "you", "go", "last", "summer?"],
  },
  {
    kind: "theory",
    eyebrow: "Шаг 12 · Маркеры",
    title: "Слова прошлого",
    paragraphs: [
      "Past Simple часто сопровождают yesterday, last week, two days ago, in 2010, last summer.",
      "Эти слова показывают завершённый период, а не связь с настоящим.",
      "Если точное время в прошлом названо, Present Perfect обычно не подходит: I saw him yesterday.",
    ],
    examples: [
      { en: "I saw him yesterday.", ru: "Я видел его вчера." },
      { en: "We moved here in 2020.", ru: "Мы переехали сюда в 2020." },
      { en: "She called two hours ago.", ru: "Она позвонила два часа назад." },
    ],
    note: "Завершённое время + точное прошлое → Past Simple.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 13 · Практика",
    questionIndex: 6,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 14 · Практика",
    questionIndex: 8,
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 15 · Перед тестом",
    title: "Коротко о главном",
    lead: "Проверь себя: формы, did и слова-маркеры.",
    summary: [
      { label: "Смысл", text: "Завершённое действие или состояние в прошлом." },
      { label: "Форма", text: "V-ed или вторая форма: worked, went." },
      { label: "Did", text: "Didn't + начальная форма. Did + подлежащее + начальная форма?" },
      { label: "Маркеры", text: "Yesterday, last week, two days ago, in 2010." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 16 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [3, 5, 7, 9],
    extraQuestions: [
      {
        id: "past-simple-final-went",
        prompt: "We ___ to the beach last summer.",
        options: ["go", "went", "gone", "going"],
        correctAnswer: "went",
        explanation:
          "Last summer — завершённое прошлое. Go — неправильный глагол, вторая форма went.",
      },
      {
        id: "past-simple-final-watched",
        prompt: "She ___ TV yesterday evening.",
        options: ["watch", "watched", "watching", "watches"],
        correctAnswer: "watched",
        explanation:
          "Yesterday evening — прошлое. Watch — правильный глагол, добавляем -ed: watched.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 17 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал Past Simple для завершённых действий, правильные и неправильные глаголы, did и слова-маркеры.",
    formula: [
      "V-ed / вторая форма",
      "Didn't + начальная форма",
      "Did + подлежащее + начальная форма?",
    ],
  },
];

export const PAST_SIMPLE_VS_CONTINUOUS_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "comparison",
    eyebrow: "Шаг 1 · Сравнение",
    title: "Что важно в каждой фразе?",
    lead: "Какая карточка описывает процесс в конкретный момент?",
    scenario:
      "Ты сравниваешь два рассказа о вчерашнем вечере. В одном важен факт, в другом — процесс в 8 вечера.",
    example: "I watched a movie yesterday.",
    options: [
      "I watched a movie yesterday.",
      "I was watching a movie at 8 PM.",
    ],
    correctOption: "I was watching a movie at 8 PM.",
    explanation:
      "Вторая фраза подчёркивает процесс в конкретный момент. Первая сообщает о завершённом факте.",
    comparison: {
      first: "I watched a movie yesterday.",
      second: "I was watching a movie at 8 PM.",
    },
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Факт или процесс",
    title: "Одно прошлое, разный взгляд",
    paragraphs: [
      "Past Simple сообщает о завершённом действии: I read a book yesterday. Книга прочитана.",
      "Past Continuous показывает процесс в определённый момент: I was reading a book at 5 PM. Я был в процессе.",
      "Оба времени про прошлое. Разница не в «раньше или позже», а в том, что мы хотим подчеркнуть.",
    ],
    examples: [
      { en: "I read a book yesterday.", ru: "Я прочитал книгу — факт." },
      { en: "I was reading a book at 5 PM.", ru: "Я читал книгу в 5 — процесс." },
      { en: "She cooked dinner.", ru: "Она приготовила ужин." },
      { en: "She was cooking at 7.", ru: "Она готовила в семь." },
    ],
    note: "Спроси себя: важен результат/факт или процесс в моменте?",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 4 · Практика",
    questionIndex: 1,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 5 · Вместе",
    title: "Процесс и завершённое событие",
    paragraphs: [
      "В одном предложении Past Continuous показывает действие в процессе, а Past Simple сообщает о завершённом событии: I was walking home when I saw a dog.",
      "Past Continuous не обязательно означает «долгое» действие, а Past Simple — «короткое». Важно, что одно действие было в процессе, а другое завершилось.",
      "While чаще подчёркивает процесс, when — событие. Но выбор зависит от смысла, а не только от слова.",
    ],
    examples: [
      { en: "I was walking home when I saw a dog.", ru: "Процесс и завершённое событие." },
      { en: "While I was cooking, the phone rang.", ru: "Пока я готовил, зазвонил телефон." },
      { en: "They were playing when it started to rain.", ru: "Они играли, когда начался дождь." },
    ],
    note: "Past Continuous — действие в процессе. Past Simple — завершённое событие.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 6 · Практика",
    questionIndex: 2,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 7 · Практика",
    questionIndex: 3,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 8 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение грамматически неверным. Проверь форму после was.",
    sentence: "When I was cooked dinner, the phone rang.",
    words: ["When", "I", "was", "cooked", "dinner,", "the", "phone", "rang."],
    errorIndex: 3,
    explanation:
      "После was нужен глагол с -ing: When I was cooking dinner, the phone rang.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 9 · Где путаются",
    title: "Четыре ловушки",
    paragraphs: [
      "Точное время (at 8 PM) часто подсказывает процесс, но не гарантирует его: I watched the film at 8 PM and finished at 9.",
      "Завершённость важнее слова yesterday: I watched a movie yesterday and finished it — факт. I was watching at 8 — процесс.",
      "When не всегда требует Past Simple: When I was cooking, the phone rang — фон тоже возможен.",
      "Глаголы состояния обычно не ставят в Continuous: I knew, а не I was knowing.",
    ],
    examples: [
      { en: "I watched the film at 8 and finished at 9.", ru: "Факт, несмотря на точное время." },
      { en: "When I was cooking, the phone rang.", ru: "When + процесс." },
      { en: "I knew the answer.", ru: "Состояние." },
    ],
    note: "Не выбирай время только по слову. Смотри, что именно важно в ситуации.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 10 · Практика",
    questionIndex: 4,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 11 · Практика",
    questionIndex: 5,
  },
  {
    kind: "matching",
    eyebrow: "Шаг 12 · Соедини смыслы",
    title: "Что подчёркивает фраза?",
    instruction:
      "Соедини предложение с его функцией: факт, процесс, фон или состояние.",
    pairs: [
      { left: "I watched a movie yesterday.", right: "Завершённый факт" },
      { left: "I was watching at 8 PM.", right: "Процесс в моменте" },
      { left: "I was walking when I saw a dog.", right: "Фон и событие" },
      { left: "I knew the answer.", right: "Состояние" },
    ],
    rightOptions: [
      "Завершённый факт",
      "Процесс в моменте",
      "Фон и событие",
      "Состояние",
    ],
    successText: "Все функции совпали: факт, процесс, фон и состояние.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 13 · Сборка",
    title: "Собери предложение",
    russian: "Я шёл домой, когда увидел собаку.",
    words: ["I", "was", "walking", "home", "when", "I", "saw", "a", "dog."],
    initialWords: ["walking", "I", "saw", "home", "when", "was", "dog.", "a", "I"],
    correct: ["I", "was", "walking", "home", "when", "I", "saw", "a", "dog."],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 14 · Практика",
    questionIndex: 8,
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 15 · Перед тестом",
    title: "Коротко о главном",
    lead: "Проверь себя: факт или процесс, фон и событие, ловушки.",
    summary: [
      { label: "Past Simple", text: "Завершённый факт: watched, cooked, went." },
      { label: "Past Continuous", text: "Процесс в моменте: was watching, were playing." },
      { label: "Вместе", text: "Past Continuous — процесс; Past Simple — завершённое событие." },
      { label: "Ловушка", text: "Слово when или точное время не выбирает время за тебя." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 16 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [6, 7, 9],
    extraQuestions: [
      {
        id: "past-compare-final-while",
        prompt:
          "At 8 PM, I was in the middle of cooking. I ___ dinner while my sister was reading.",
        options: ["was cooking", "cooked", "were cooking", "cook"],
        correctAnswer: "was cooking",
        explanation:
          "В 8 вечера я находился в процессе готовки, пока сестра читала. С I используем was cooking.",
      },
      {
        id: "past-compare-final-driving",
        prompt: "They ___ home when they saw the accident.",
        options: ["drove", "were driving", "was driving", "drive"],
        correctAnswer: "were driving",
        explanation:
          "Они были в процессе поездки, когда увидели аварию. С they используем were driving.",
      },
      {
        id: "past-compare-final-finished",
        prompt: "She ___ the report before lunch.",
        options: ["finished", "was finishing", "were finishing", "finish"],
        correctAnswer: "finished",
        explanation:
          "Before lunch показывает завершённый факт. Используем Past Simple: finished.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 17 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал разницу между завершённым фактом и процессом, сочетание фона и события, а также типичные ловушки.",
    formula: [
      "Past Simple: факт, результат, завершённое действие",
      "Past Continuous: процесс в конкретный момент",
      "Past Continuous — процесс · Past Simple — завершённое событие",
    ],
  },
];

export const PREPOSITIONS_TIME_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    eyebrow: "Шаг 1 · Сцена",
    title: "Какой предлог?",
    lead: "Выбери предлог, который звучит естественно.",
    scenario:
      "Ты покупаешь билет на поезд. На табло написано время отправления — 8:00.",
    example: "The train leaves ___ 8 o'clock.",
    options: ["at 8 o'clock", "on 8 o'clock", "in 8 o'clock"],
    correctOption: "at 8 o'clock",
    explanation:
      "Перед точным временем на часах используем at: at 8 o'clock.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Зачем это нужно",
    title: "Зачем нужны in, on и at?",
    paragraphs: [
      "Представь, что ты хочешь сказать «в августе», «в пятницу» и «в 8 часов». По-русски везде будет «в», а в английском выбор предлога зависит от того, насколько точно указано время.",
      "In — для больших периодов: месяцев, лет, времён года и частей дня. In July, in 2026, in summer, in the morning.",
      "On — для дней недели и конкретных дат. On Friday, on 12 May, on my birthday.",
      "At — для точного времени и устойчивых выражений. At 7:30, at noon, at midnight, at night.",
    ],
    examples: [
      { en: "I was born in 2001.", ru: "Я родился в 2001 году." },
      { en: "The match is on Saturday.", ru: "Матч в субботу." },
      { en: "The film starts at 7:30.", ru: "Фильм начинается в 7:30." },
      { en: "He works at night.", ru: "Он работает ночью." },
    ],
    note: "Сначала реши, что перед тобой: большой период, день/дата или точное время.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 4 · Практика",
    questionIndex: 1,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 2,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 6 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение неверным. Проверь предлог перед временем.",
    sentence: "The train leaves on 8 o'clock.",
    words: ["The", "train", "leaves", "on", "8", "o'clock."],
    errorIndex: 3,
    explanation:
      "Перед точным временем нужен at: The train leaves at 8 o'clock.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 7 · Исключения",
    title: "At night, in the morning",
    paragraphs: [
      "Говорим in the morning, in the afternoon, in the evening, но at night.",
      "Перед last, next, every и this предлог обычно не нужен: next Tuesday, last year, every morning, this weekend.",
      "В британском английском чаще at the weekend, в американском — on the weekend.",
    ],
    examples: [
      { en: "I usually work in the morning.", ru: "Обычно я работаю утром." },
      { en: "He works at night.", ru: "Он работает ночью." },
      { en: "See you next Friday.", ru: "Увидимся в следующую пятницу." },
    ],
    note: "Day vs time: on Monday, but at 8 o'clock.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 8 · Практика",
    questionIndex: 3,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 9 · Практика",
    questionIndex: 4,
  },
  {
    kind: "sorting",
    eyebrow: "Шаг 10 · Сортировка",
    title: "Разложи по предлогам",
    instruction:
      "Определи, какой предлог нужен перед выделенным временем. Если предлог не нужен, выбери «Без предлога».",
    categories: ["In", "On", "At", "Без предлога"],
    items: [
      { text: "___ August", category: "In", explanation: "Месяц — in." },
      { text: "___ Friday", category: "On", explanation: "День недели — on." },
      { text: "___ midnight", category: "At", explanation: "Точный момент — at." },
      { text: "___ next Tuesday", category: "Без предлога", explanation: "Перед next предлог не нужен." },
      { text: "___ the morning", category: "In", explanation: "Часть дня — in the morning." },
    ],
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 11 · Сборка",
    title: "Собери предложение",
    russian: "Фильм начинается в семь часов.",
    words: ["The", "film", "starts", "at", "seven", "o'clock."],
    initialWords: ["starts", "The", "o'clock.", "at", "film", "seven"],
    correct: ["The", "film", "starts", "at", "seven", "o'clock."],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 12 · Практика",
    questionIndex: 7,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 13 · Практика",
    questionIndex: 8,
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 14 · Перед тестом",
    title: "Коротко о главном",
    lead: "Проверь себя: in для периода, on для дня, at для точного времени.",
    summary: [
      { label: "In", text: "Месяц, год, сезон, часть дня: in July, in 2026, in the morning." },
      { label: "On", text: "День или дата: on Friday, on 12 May." },
      { label: "At", text: "Точное время: at 7:30. At night." },
      { label: "Без предлога", text: "Next, last, every, this: next Friday." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 15 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [5, 6],
    extraQuestions: [
      {
        id: "prepositions-final-date",
        prompt: "My birthday is ___ 12 May.",
        options: ["in", "on", "at", "ничего"],
        correctAnswer: "on",
        explanation: "12 May — конкретная дата, поэтому on.",
      },
      {
        id: "prepositions-final-august",
        prompt: "We usually go on holiday ___ August.",
        options: ["in", "on", "at", "ничего"],
        correctAnswer: "in",
        explanation: "August — месяц, поэтому in.",
      },
      {
        id: "prepositions-final-time",
        prompt: "The meeting starts ___ 9:30.",
        options: ["in", "on", "at", "ничего"],
        correctAnswer: "at",
        explanation: "9:30 — точное время, поэтому at.",
      },
      {
        id: "prepositions-final-next",
        prompt: "I'll see you ___ next Monday.",
        options: ["in", "on", "at", "ничего"],
        correctAnswer: "ничего",
        explanation: "Перед next предлог не нужен: next Monday.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 16 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал in, on и at для времени, исключения и случаи без предлога.",
    formula: ["In + месяц / год / сезон / часть дня", "On + день / дата", "At + точное время", "Next / last / every / this — без предлога"],
  },
];

export const PRESENT_SIMPLE_VS_CONTINUOUS_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "comparison",
    eyebrow: "Шаг 1 · Сравнение",
    title: "Привычка или процесс?",
    lead: "Какая карточка описывает действие прямо сейчас?",
    scenario:
      "Ты сравниваешь две фразы: одна про регулярное занятие, другая про то, что происходит в момент разговора.",
    example: "I play tennis every Saturday.",
    options: ["I play tennis every Saturday.", "I am playing tennis now."],
    correctOption: "I am playing tennis now.",
    explanation:
      "Вторая фраза описывает процесс сейчас. Первая — регулярную привычку.",
    comparison: {
      first: "I play tennis every Saturday.",
      second: "I am playing tennis now.",
    },
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Зачем это нужно",
    title: "Зачем различать Simple и Continuous?",
    paragraphs: [
      "Одна и та же идея может звучать по-разному: I work here — я работаю здесь вообще, I am working now — я работаю прямо сейчас. Форма меняет смысл, поэтому важно понимать, о чём именно ты говоришь.",
      "Present Simple — привычки, регулярные действия, факты и состояния: I play tennis every Saturday.",
      "Present Continuous — действие прямо сейчас или временная ситуация: I am playing tennis now. I'm living with friends this month.",
      "Слова-подсказки: always, usually, every day → Simple; now, right now, at the moment, this week → Continuous.",
    ],
    examples: [
      { en: "She works in a bank.", ru: "Обычная работа." },
      { en: "She is working from home this week.", ru: "Временная ситуация." },
      { en: "I don't drink coffee.", ru: "Привычка." },
      { en: "I'm not drinking coffee today.", ru: "Временно." },
    ],
    note: "Спроси себя: это происходит обычно или прямо сейчас / временно?",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 4 · Практика",
    questionIndex: 1,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 2,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 6 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение неверным. Проверь форму Continuous.",
    sentence: "She is work now.",
    words: ["She", "is", "work", "now."],
    errorIndex: 2,
    explanation:
      "После is нужен глагол с -ing: She is working now.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 7 · Временные ситуации",
    title: "This week, today",
    paragraphs: [
      "Continuous может описывать не только секунду речи, но и временный период: I'm staying in a hotel this week.",
      "Simple сообщает о постоянном или обычном: I live in Moscow.",
      "Сравни: I work in an office — вообще. I'm working from home today — временно.",
    ],
    examples: [
      { en: "We're staying in a hotel this week.", ru: "Временно." },
      { en: "We usually stay with friends.", ru: "Обычно." },
      { en: "He is working from home today.", ru: "Сегодня, временно." },
    ],
    note: "Временная ситуация — тоже Present Continuous.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 8 · Практика",
    questionIndex: 5,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 9 · Практика",
    questionIndex: 4,
  },
  {
    kind: "matching",
    eyebrow: "Шаг 10 · Соедини смыслы",
    title: "Что выражает фраза?",
    instruction:
      "Соедини предложение с его функцией: привычка, процесс, временная ситуация или состояние.",
    pairs: [
      { left: "I play tennis every Saturday.", right: "Привычка" },
      { left: "She is working now.", right: "Процесс сейчас" },
      { left: "We're staying in a hotel this week.", right: "Временная ситуация" },
      { left: "I don't understand.", right: "Состояние" },
    ],
    rightOptions: ["Привычка", "Процесс сейчас", "Временная ситуация", "Состояние"],
    successText: "Все функции совпали: привычка, процесс, временная ситуация и состояние.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 11 · Сборка",
    title: "Собери предложение",
    russian: "Она работает из дома на этой неделе.",
    words: ["She", "is", "working", "from", "home", "this", "week."],
    initialWords: ["working", "She", "week.", "from", "is", "this", "home"],
    correct: ["She", "is", "working", "from", "home", "this", "week."],
  },
  {
    kind: "theory",
    eyebrow: "Шаг 12 · Глаголы состояния",
    title: "Know, like, want",
    paragraphs: [
      "Глаголы состояния обычно не ставят в Continuous: I know, I like, I want.",
      "Но некоторые меняют значение: I think you're right — считаю; I'm thinking about it — размышляю.",
      "I have a car — у меня есть машина; I'm having lunch — я обедаю.",
    ],
    examples: [
      { en: "I know the answer.", ru: "Состояние." },
      { en: "I'm thinking about my future.", ru: "Процесс размышления." },
      { en: "She is having lunch.", ru: "Обедает сейчас." },
    ],
    note: "Смотри на значение, а не только на глагол.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 13 · Практика",
    questionIndex: 7,
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 14 · Перед тестом",
    title: "Коротко о главном",
    lead: "Проверь себя: обычно или сейчас, формы и глаголы состояния.",
    summary: [
      { label: "Simple", text: "Привычка, факт, состояние: I work, she knows." },
      { label: "Continuous", text: "Сейчас или временно: I'm working, she's staying." },
      { label: "Форма", text: "Continuous: am / is / are + V-ing." },
      { label: "Состояния", text: "Know, like, want обычно в Simple; have lunch — исключение." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 15 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [3, 6],
    extraQuestions: [
      {
        id: "ps-pc-final-contrast",
        prompt: "He usually ___ to work by car, but today he ___ the bus.",
        options: ["takes / is taking", "is taking / takes", "take / is taking", "takes / takes"],
        correctAnswer: "takes / is taking",
        explanation: "Usually — привычка (takes), today — временное изменение (is taking).",
      },
      {
        id: "ps-pc-final-look",
        prompt: "Look! The children ___ in the garden.",
        options: ["play", "are playing", "is playing", "plays"],
        correctAnswer: "are playing",
        explanation: "Look! указывает на действие сейчас. Children — множественное число: are playing.",
      },
      {
        id: "ps-pc-final-love",
        prompt: "I ___ this film — it's really good.",
        options: ["love", "am loving", "loves", "loving"],
        correctAnswer: "love",
        explanation: "Love — глагол состояния, обычно используется в Present Simple.",
      },
      {
        id: "ps-pc-final-having",
        prompt: "We ___ dinner at the moment.",
        options: ["have", "are having", "has", "having"],
        correctAnswer: "are having",
        explanation: "Have dinner — процесс, а не состояние. At the moment требует Continuous: are having.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 16 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал разницу между привычкой и процессом, временные ситуации и глаголы состояния.",
    formula: ["Simple: обычно / всегда / факт", "Continuous: сейчас / временно", "Continuous = am / is / are + V-ing"],
  },
];

export const SOME_ANY_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    eyebrow: "Шаг 1 · Сцена",
    title: "Что сказать в магазине?",
    lead: "Какой вариант звучит естественно в вопросе?",
    scenario:
      "Ты в магазине и хочешь узнать, есть ли молоко. Ты вежливо задаёшь вопрос продавцу.",
    example: "Do you have ___ milk?",
    options: ["Do you have any milk?", "Do you have some milk?"],
    correctOption: "Do you have any milk?",
    explanation:
      "В обычном вопросе о наличии обычно используем any: Do you have any milk?",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Зачем это нужно",
    title: "Зачем нужны some, any, no и every?",
    paragraphs: [
      "Эти слова помогают говорить о количестве, не называя точное число: немного, сколько-нибудь, ни одного или каждый. Без них сложно задать вопрос о наличии, предложить что-то или сказать, что чего-то нет.",
      "Some означает «немного / несколько» и обычно используется в утверждениях: I bought some apples. There is some milk.",
      "Any означает «сколько-нибудь / какой-либо». Обычно используется в вопросах и отрицаниях: Do you have any questions? I don't have any time. В утверждении any может значить «любой»: Take any seat.",
      "No означает «нисколько / ни одного» и уже содержит отрицание: There is no milk. Не нужно добавлять not.",
      "Every означает «каждый, все без исключения». После every существительное и глагол стоят в единственном числе: Every student has a card.",
      "Some также звучит в предложениях и вежливых просьбах: Would you like some tea? Can I have some water?",
    ],
    examples: [
      { en: "I bought some apples.", ru: "Я купил несколько яблок." },
      { en: "Do you have any questions?", ru: "У тебя есть вопросы?" },
      { en: "Would you like some tea?", ru: "Хочешь чаю?" },
    ],
    note: "Some в вопросе — предложение или просьба: Would you like some tea? / Can I have some water? Any — обычный вопрос: Do you have any tea?",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 4 · Практика",
    questionIndex: 1,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 2,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 6 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение неверным. Проверь двойное отрицание.",
    sentence: "I don't have no money.",
    words: ["I", "don't", "have", "no", "money."],
    errorIndex: 3,
    explanation:
      "В стандартном английском не используем два отрицания: I don't have any money. / I have no money.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 7 · No и every",
    title: "Ни одного и каждый",
    paragraphs: [
      "No уже содержит отрицание: There is no coffee. Не нужно добавлять not.",
      "Every — каждый, все без исключения. После every существительное в единственном числе: Every student has a card.",
      "Any в утверждении может значить «любой»: You can choose any seat.",
    ],
    examples: [
      { en: "There is no coffee left.", ru: "Кофе не осталось." },
      { en: "Every student has an ID card.", ru: "У каждого студента есть пропуск." },
      { en: "Choose any seat.", ru: "Выбери любое место." },
    ],
    note: "No = отрицание внутри слова. Every + единственное число.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 8 · Практика",
    questionIndex: 3,
  },
  {
    kind: "matching",
    eyebrow: "Шаг 9 · Смыслы",
    title: "Что означает каждое слово?",
    instruction:
      "Соедини слово с его основным значением. Это поможет не путать some, any, no и every.",
    pairs: [
      { left: "some", right: "немного / несколько" },
      { left: "any", right: "сколько-нибудь / любой" },
      { left: "no", right: "нисколько / ни одного" },
      { left: "every", right: "каждый" },
    ],
    rightOptions: [
      "немного / несколько",
      "сколько-нибудь / любой",
      "нисколько / ни одного",
      "каждый",
    ],
    successText:
      "Теперь у каждого слова есть понятное значение, а не только правило.",
  },
  {
    kind: "sorting",
    eyebrow: "Шаг 10 · Сортировка",
    title: "Выбери слово",
    instruction:
      "Определи, какое слово подходит по смыслу и типу предложения.",
    categories: ["Some", "Any", "No", "Every"],
    items: [
      { text: "There are ___ apples in the bowl.", category: "Some", explanation: "Утверждение — some." },
      { text: "Do you have ___ questions?", category: "Any", explanation: "Вопрос — any." },
      { text: "There is ___ milk left — the fridge is completely empty.", category: "No", explanation: "Отрицание без not — no." },
      { text: "___ student has a name badge.", category: "Every", explanation: "Каждый без исключения — every." },
    ],
  },
  {
    kind: "theory",
    eyebrow: "Шаг 11 · Производные",
    title: "Something, anything, nothing",
    paragraphs: [
      "Something / someone / somewhere — обычно в утверждениях.",
      "Anything / anyone / anywhere — обычно в вопросах и отрицаниях.",
      "Nothing / no one / nowhere уже содержат отрицание. Everything / everyone / everywhere — всё и все.",
    ],
    examples: [
      { en: "Someone is calling you.", ru: "Кто-то тебе звонит." },
      { en: "Did you buy anything?", ru: "Ты что-нибудь купил?" },
      { en: "There is nothing in my bag.", ru: "В сумке ничего нет." },
      { en: "Everyone is ready.", ru: "Все готовы." },
    ],
    note: "Слова с some / any / no / every подчиняются той же логике.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 12 · Практика",
    questionIndex: 5,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 13 · Тонкости",
    title: "Some или any в вопросах",
    paragraphs: [
      "Any — обычный выбор для вопросов и отрицаний: Do you have any questions? I don't have any time.",
      "Some может появиться в вопросе, если мы ожидаем ответ «да» или предлагаем что-то: Would you like some tea? Can I have some water?",
      "В утверждении any может означать «любой»: You can choose any seat.",
      "No уже содержит отрицание: There is no milk. Не добавляй второе not.",
    ],
    examples: [
      { en: "Do you have any change?", ru: "Обычный вопрос — any." },
      { en: "Would you like some coffee?", ru: "Предложение — some." },
      { en: "Take any seat.", ru: "Любое место — any." },
      { en: "There is no time.", ru: "No без not." },
    ],
    note: "Some — не только утверждение; any — не только вопрос.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 14 · Практика",
    questionIndex: 7,
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 15 · Сборка",
    title: "Собери предложение",
    russian: "Хочешь немного чая?",
    words: ["Would", "you", "like", "some", "tea?"],
    initialWords: ["like", "Would", "tea?", "some", "you"],
    correct: ["Would", "you", "like", "some", "tea?"],
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 16 · Перед тестом",
    title: "Коротко о главном",
    lead: "Проверь себя: some / any, no без not и every с единственным числом.",
    summary: [
      { label: "Some", text: "Утверждение, предложение, просьба." },
      { label: "Any", text: "Вопрос или отрицание; в утверждении — «любой»." },
      { label: "No", text: "Отрицание внутри слова; not не нужен." },
      { label: "Every", text: "Каждый; существительное и глагол в единственном числе." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 17 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [],
    extraQuestions: [
      {
        id: "some-any-final-some",
        prompt: "There is ___ juice in the fridge.",
        options: ["some", "any", "no", "every"],
        correctAnswer: "some",
        explanation: "Утвердительное предложение о наличии — some.",
      },
      {
        id: "some-any-final-any",
        prompt: "Is there ___ bread?",
        options: ["some", "any", "no", "every"],
        correctAnswer: "any",
        explanation: "Обычный вопрос о наличии — any.",
      },
      {
        id: "some-any-final-no",
        prompt: "I have ___ time today because my schedule is completely full.",
        options: ["some", "any", "no", "every"],
        correctAnswer: "no",
        explanation: "No уже содержит отрицание: времени нет.",
      },
      {
        id: "some-any-final-every",
        prompt: "___ child needs a ticket.",
        options: ["Some", "Any", "No", "Every"],
        correctAnswer: "Every",
        explanation: "Каждый ребёнок без исключения — every + единственное число.",
      },
      {
        id: "some-any-final-anyone",
        prompt: "Did you see ___ at the party?",
        options: ["someone", "anyone", "no one", "everyone"],
        correctAnswer: "anyone",
        explanation: "Вопрос — anyone.",
      },
      {
        id: "some-any-final-nothing",
        prompt: "There is ___ in the box.",
        options: ["something", "anything", "nothing", "everything"],
        correctAnswer: "nothing",
        explanation: "Коробка пуста: nothing уже содержит отрицание.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 18 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал some, any, no, every и производные слова, а также типичные ошибки с двойным отрицанием.",
    formula: ["Some — утверждение / предложение", "Any — вопрос / отрицание", "No — отрицание без not", "Every — каждый + единственное число"],
  },
];

export const THERE_IS_THERE_ARE_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "context",
    eyebrow: "Шаг 1 · Контекст",
    title: "Что означает фраза?",
    lead: "Выбери точный смысл.",
    quote: "There's no place like home.",
    example: "There's no place like home.",
    options: ["Дома лучше всего.", "Дома нет места."],
    correctOption: "Дома лучше всего.",
    explanation:
      "There is сообщает о наличии. Фраза значит: нет места лучше дома.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Настоящее",
    title: "There is / There are в настоящем",
    paragraphs: [
      "There is используется с одним предметом или неисчисляемым существительным: There is a table in the room. There is some water in the bottle.",
      "There are используется с двумя и более предметами: There are two chairs in the kitchen. There are many cars in the street.",
      "Сокращения: There's = There is, There're = There are.",
    ],
    examples: [
      { en: "There is a table in the room.", ru: "В комнате есть стол." },
      { en: "There are many cars in the street.", ru: "На улице много машин." },
      { en: "There is some water in the bottle.", ru: "В бутылке есть немного воды." },
      { en: "There are two chairs in the kitchen.", ru: "На кухне два стула." },
    ],
    note: "There is + один/неисчисляемое · There are + множественное.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 4 · Практика",
    questionIndex: 1,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 5 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение неверным. Проверь форму there is/are.",
    sentence: "There is five people at the bus stop.",
    words: ["There", "is", "five", "people", "at", "the", "bus", "stop."],
    errorIndex: 1,
    explanation:
      "Five people — множественное число. Нужно There are five people.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 6 · Практика",
    questionIndex: 2,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 7 · Вопросы и отрицания",
    title: "Is there? Are there?",
    paragraphs: [
      "Отрицание: There isn't / There aren't. There isn't a TV. There aren't any buses.",
      "Вопрос: Is there...? Are there...? Is there a pharmacy? Are there any seats?",
      "С множественным числом в вопросах и отрицаниях часто используем any.",
    ],
    examples: [
      { en: "There isn't a TV in my bedroom.", ru: "В спальне нет телевизора." },
      { en: "Are there any free seats?", ru: "Есть свободные места?" },
      { en: "There aren't any chairs.", ru: "Стульев нет." },
    ],
    note: "Вопрос: Is / Are + there + существительное?",
  },
  {
    kind: "practice",
    eyebrow: "Шаг · Мини-практика",
    customQuestion: {
      id: "there-present-short-check",
      prompt: "There ___ some milk in the fridge.",
      options: ["is", "are", "was", "were"],
      correctAnswer: "is",
      explanation:
        "Milk — неисчисляемое существительное, поэтому в настоящем используем There is.",
    },
  },
  {
    kind: "theory",
    eyebrow: "Шаг · Прошлое",
    title: "There was / There were",
    paragraphs: [
      "В прошлом: There was — для одного предмета или неисчисляемого, There were — для множественного.",
      "Вопрос: Was there...? Were there...? Отрицание: There wasn't / There weren't.",
    ],
    examples: [
      { en: "There was a café here.", ru: "Здесь было кафе." },
      { en: "There were two mistakes.", ru: "Было две ошибки." },
      { en: "Was there a shop near the station?", ru: "Рядом со станцией был магазин?" },
    ],
    note: "Прошлое: was / were; вопрос — Was / Were + there...?",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 9 · Практика",
    questionIndex: 5,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 10 · Практика",
    questionIndex: 6,
  },
  {
    kind: "theory",
    eyebrow: "Шаг · Будущее",
    title: "There will be",
    paragraphs: [
      "В будущем используем There will be для любого количества: There will be a party. There will be many people.",
      "Вопрос: Will there be...? Отрицание: There won't be...",
    ],
    examples: [
      { en: "There will be a party on Saturday.", ru: "В субботу будет вечеринка." },
      { en: "Will there be a test?", ru: "Будет ли тест?" },
      { en: "There won't be any problems.", ru: "Проблем не будет." },
    ],
    note: "Будущее: will be; вопрос — Will + there + be...?",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 11 · Практика",
    questionIndex: 7,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 12 · Практика",
    questionIndex: 8,
  },
  {
    kind: "matching",
    eyebrow: "Шаг 13 · Соедини смыслы",
    title: "Что означает конструкция?",
    instruction:
      "Соедини предложение с его функцией: один предмет, несколько предметов, прошлое или будущее.",
    pairs: [
      { left: "There is a lamp.", right: "Один предмет" },
      { left: "There are two chairs.", right: "Несколько предметов" },
      { left: "There was a café here.", right: "Прошлое" },
      { left: "There will be a party.", right: "Будущее" },
    ],
    rightOptions: ["Один предмет", "Несколько предметов", "Прошлое", "Будущее"],
    successText: "Все функции совпали: один, несколько, прошлое и будущее.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 14 · Сборка",
    title: "Собери предложение",
    russian: "На кухне два стула.",
    words: ["There", "are", "two", "chairs", "in", "the", "kitchen."],
    initialWords: ["chairs", "There", "the", "are", "kitchen.", "two", "in"],
    correct: ["There", "are", "two", "chairs", "in", "the", "kitchen."],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 15 · Практика",
    questionIndex: 9,
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 16 · Перед тестом",
    title: "Коротко о главном",
    lead: "Проверь себя: is/are, was/were, will be и вопросы.",
    summary: [
      { label: "Сейчас", text: "There is + один/неисчисляемое. There are + множественное." },
      { label: "Прошлое", text: "There was / There were." },
      { label: "Будущее", text: "There will be для любого количества." },
      { label: "Вопрос", text: "Is / Are / Was / Were / Will + there...?" },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 17 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [3, 4],
    extraQuestions: [
      {
        id: "there-final-traffic",
        prompt: "There ___ a lot of traffic today.",
        options: ["is", "are", "am", "be"],
        correctAnswer: "is",
        explanation: "Traffic — неисчисляемое, поэтому There is.",
      },
      {
        id: "there-final-seats",
        prompt: "There ___ any seats left.",
        options: ["isn't", "aren't", "don't", "wasn't"],
        correctAnswer: "aren't",
        explanation: "Seats — множественное число, отрицание: There aren't.",
      },
      {
        id: "there-final-concert",
        prompt: "There ___ a concert last night.",
        options: ["is", "are", "was", "were"],
        correctAnswer: "was",
        explanation: "Last night — прошлое, concert — один: There was.",
      },
      {
        id: "there-final-people",
        prompt: "There ___ many people at the meeting tomorrow.",
        options: ["is", "are", "will be", "was"],
        correctAnswer: "will be",
        explanation: "Tomorrow — будущее; There will be для любого количества.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 18 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал there is / there are в настоящем, прошлом и будущем, вопросы и отрицания.",
    formula: ["There is / There are", "There was / There were", "There will be", "Is / Are / Was / Were / Will + there...?"],
  },
];

export const PAST_SIMPLE_VS_PERFECT_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "comparison",
    eyebrow: "Шаг 1 · Сравнение",
    title: "Прошлое или связь с настоящим?",
    lead: "Какая карточка связывает прошлое с незаконченным периодом today?",
    scenario:
      "Ты рассказываешь о встрече с другом. В одной фразе указан завершённый день, в другой — сегодняшний период, который ещё продолжается.",
    example: "I saw him yesterday.",
    options: ["I saw him yesterday.", "I have seen him today."],
    correctOption: "I have seen him today.",
    explanation:
      "Today ещё продолжается, поэтому Present Perfect связывает встречу с настоящим. Yesterday — завершённый период, там Past Simple.",
    comparison: {
      first: "I saw him yesterday.",
      second: "I have seen him today.",
    },
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Зачем это нужно",
    title: "Зачем различать Past Simple и Present Perfect?",
    paragraphs: [
      "Оба времени говорят о прошлом, но по-разному. Past Simple сообщает о завершённом факте: I saw him yesterday. Present Perfect связывает прошлое с настоящим: I have seen him today — сегодняшний день ещё продолжается.",
      "Past Simple — событие в завершённом прошлом. Часто есть точное время: yesterday, last week, in 2022.",
      "Present Perfect — прошлое с точки зрения настоящего: опыт, результат сейчас, незаконченный период или действие, которое продолжается.",
      "Сравни: I saw him yesterday — факт. I have seen him today — сегодняшний период ещё идёт.",
    ],
    examples: [
      { en: "I saw him yesterday.", ru: "Завершённый период." },
      { en: "I have seen him today.", ru: "Today ещё продолжается." },
      { en: "I have broken my glasses.", ru: "Результат сейчас: я не могу читать." },
      { en: "She has worked here for three years.", ru: "Действие продолжается." },
    ],
    note: "Спроси себя: период закончен или всё ещё связан с настоящим?",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 4 · Практика",
    questionIndex: 1,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 2,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 6 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение неверным. Проверь время с yesterday.",
    sentence: "I have seen him yesterday.",
    words: ["I", "have", "seen", "him", "yesterday."],
    errorIndex: 1,
    explanation:
      "Yesterday — завершённое время, поэтому Past Simple: I saw him yesterday.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 7 · Слова-маркеры",
    title: "Yesterday или just",
    paragraphs: [
      "Past Simple: yesterday, last week, in 2022, two days ago, when.",
      "Present Perfect: ever, never, just, already, yet, so far, today / this week, если период не закончился.",
      "For и since часто используются с Present Perfect, когда действие продолжается: for three years, since 2020.",
    ],
    examples: [
      { en: "I saw him two days ago.", ru: "Past Simple." },
      { en: "I have just finished.", ru: "Present Perfect." },
      { en: "She has lived here since 2020.", ru: "Действие продолжается." },
    ],
    note: "Точное завершённое время → Past Simple. Связь с настоящим → Present Perfect.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 8 · Практика",
    questionIndex: 3,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 9 · Практика",
    questionIndex: 4,
  },
  {
    kind: "matching",
    eyebrow: "Шаг 10 · Соедини смыслы",
    title: "Что выражает фраза?",
    instruction:
      "Соедини предложение с его функцией: завершённое прошлое, опыт, результат или незаконченный период.",
    pairs: [
      { left: "I saw him yesterday.", right: "Завершённое прошлое" },
      { left: "I have been to Italy.", right: "Опыт" },
      { left: "I have broken my glasses.", right: "Результат сейчас" },
      { left: "I've had two meetings today.", right: "Незаконченный период" },
    ],
    rightOptions: ["Завершённое прошлое", "Опыт", "Результат сейчас", "Незаконченный период"],
    successText: "Все функции совпали: прошлое, опыт, результат и незаконченный период.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 11 · Сборка",
    title: "Собери вопрос",
    russian: "Ты когда-нибудь пробовал сёрфинг?",
    words: ["Have", "you", "ever", "tried", "surfing?"],
    initialWords: ["ever", "Have", "surfing?", "tried", "you"],
    correct: ["Have", "you", "ever", "tried", "surfing?"],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 12 · Практика",
    questionIndex: 5,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 13 · Практика",
    questionIndex: 6,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 14 · Практика",
    questionIndex: 7,
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 15 · Перед тестом",
    title: "Коротко о главном",
    lead: "Проверь себя: завершённое время, опыт, результат и продолжение.",
    summary: [
      { label: "Past Simple", text: "Завершённое прошлое: yesterday, last week, in 2022." },
      { label: "Present Perfect", text: "Опыт, результат, today / this week, for / since." },
      { label: "Форма", text: "Have / has + V3. Didn't / did + V1." },
      { label: "Ошибка", text: "I have seen him yesterday → I saw him yesterday." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 16 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [],
    extraQuestions: [
      {
        id: "past-perfect-final-watched",
        prompt: "I ___ this film last night.",
        options: ["have watched", "watched", "watch", "was watching"],
        correctAnswer: "watched",
        explanation: "Last night — завершённое время, Past Simple: watched.",
      },
      {
        id: "past-perfect-final-been",
        prompt: "She ___ never ___ to Japan.",
        options: ["has / been", "have / been", "did / be", "was / been"],
        correctAnswer: "has / been",
        explanation: "Опыт с never: Present Perfect, she → has + been.",
      },
      {
        id: "past-perfect-final-lived",
        prompt: "We ___ here since 2020.",
        options: ["live", "lived", "have lived", "has lived"],
        correctAnswer: "have lived",
        explanation: "Since 2020, действие продолжается: we have lived.",
      },
      {
        id: "past-perfect-final-won",
        prompt: "They ___ the match yesterday.",
        options: ["have won", "won", "win", "were winning"],
        correctAnswer: "won",
        explanation: "Yesterday — завершённое прошлое, Past Simple: won.",
      },
      {
        id: "past-perfect-final-lost",
        prompt: "He ___ his keys, so he can't open the door.",
        options: ["lost", "has lost", "loses", "was losing"],
        correctAnswer: "has lost",
        explanation: "Результат важен сейчас: ключей нет. Present Perfect: has lost.",
      },
      {
        id: "past-perfect-final-yet",
        prompt: "___ you ___ your homework yet?",
        options: ["Did / finish", "Have / finished", "Do / finish", "Are / finishing"],
        correctAnswer: "Have / finished",
        explanation: "Yet в вопросе об ожидаемом результате: Have you finished...?",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 17 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал Past Simple и Present Perfect, их маркеры, формы и типичные ошибки.",
    formula: ["Past Simple: V2 / didn't + V1 / Did + V1?", "Present Perfect: have / has + V3", "Завершённое время → Past Simple", "Связь с настоящим → Present Perfect"],
  },
];

export const FUTURE_CONTINUOUS_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    eyebrow: "Шаг 1 · Сцена",
    title: "Что будет происходить?",
    lead: "Какая фраза подчёркивает, что ты будешь в процессе?",
    scenario:
      "Завтра в 8 вечера ты будешь на середине просмотра фильма. Тебе важно показать сам процесс, а не просто факт.",
    example: "At 8 PM tomorrow, I ___ a movie.",
    options: ["I will watch a movie.", "I will be watching a movie."],
    correctOption: "I will be watching a movie.",
    explanation:
      "В конкретный момент будущего ты будешь находиться в процессе. Используем will be + watching.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Зачем это нужно",
    title: "Процесс в будущем",
    paragraphs: [
      "Future Continuous нужен, когда действие будет в процессе в определённый момент будущего: At 8 PM tomorrow, I will be watching a movie.",
      "Он также подходит для ожидаемого хода событий и вежливых вопросов о планах: Will you be using the car tonight?",
      "Сравни: I will call you at 8 — простое действие. I will be having dinner at 8 — я буду в процессе ужина.",
    ],
    examples: [
      { en: "At 8 PM tomorrow, I will be watching a movie.", ru: "Я буду в процессе просмотра." },
      { en: "Will you be using the car tonight?", ru: "Вежливый вопрос о планах." },
      { en: "This time tomorrow, we will be flying to Rome.", ru: "Ожидаемый ход событий." },
    ],
    note: "Главный смысл — «буду находиться в процессе» в конкретный момент будущего.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 4 · Форма",
    title: "Will be + V-ing",
    paragraphs: [
      "Утверждение: will be + глагол с -ing. I will be working. He will be working.",
      "После will глагол be всегда стоит в начальной форме: will be, а не will am / will is / will are.",
      "Отрицание: won't be + V-ing. Вопрос: Will + подлежащее + be + V-ing?",
    ],
    examples: [
      { en: "I will be working at 8.", ru: "Я буду работать в 8." },
      { en: "He won't be sleeping.", ru: "Он не будет спать." },
      { en: "Will you be studying?", ru: "Ты будешь заниматься?" },
    ],
    note: "Типичная ошибка: I will am working / He will be work. Правильно: I will be working / He will be working.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 1,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 6 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение грамматически неверным. Проверь форму после will.",
    sentence: "I will am working at 8 PM tomorrow.",
    words: ["I", "will", "am", "working", "at", "8", "PM", "tomorrow."],
    errorIndex: 2,
    explanation:
      "После will используем be, а не am: I will be working at 8 PM tomorrow.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 7 · Will или will be doing",
    title: "Факт или процесс",
    paragraphs: [
      "Future Simple (will + V1) сообщает о действии или решении: I will call you at 8.",
      "Future Continuous (will be + V-ing) подчёркивает процесс в моменте: I will be having dinner at 8.",
      "Слова this time tomorrow, at 8 PM tomorrow, all day tomorrow часто помогают, но выбор зависит от смысла.",
    ],
    examples: [
      { en: "I will finish the report tomorrow.", ru: "Простое будущее действие." },
      { en: "I will be working on the report at 10.", ru: "Процесс в 10." },
      { en: "They will be playing all afternoon.", ru: "Длительный процесс." },
    ],
    note: "Спроси себя: важен факт или процесс в конкретный момент?",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 8 · Практика",
    questionIndex: 2,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 9 · Практика",
    questionIndex: 4,
  },
  {
    kind: "matching",
    eyebrow: "Шаг 10 · Соедини смыслы",
    title: "Что выражает фраза?",
    instruction:
      "Соедини предложение с его функцией: процесс, вежливый вопрос, отрицание или ожидаемый ход событий.",
    pairs: [
      { left: "At 8 PM I will be watching a movie.", right: "Процесс в моменте" },
      { left: "Will you be using the car tonight?", right: "Вежливый вопрос" },
      { left: "I won't be working tomorrow.", right: "Отрицание" },
      { left: "This time tomorrow we will be flying.", right: "Ожидаемый ход событий" },
    ],
    rightOptions: ["Процесс в моменте", "Вежливый вопрос", "Отрицание", "Ожидаемый ход событий"],
    successText: "Все функции совпали: процесс, вопрос, отрицание и ожидаемый ход.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 11 · Сборка",
    title: "Собери предложение",
    russian: "Завтра в 8 вечера я буду работать.",
    words: ["I", "will", "be", "working", "at", "8", "PM", "tomorrow."],
    initialWords: ["working", "I", "tomorrow.", "be", "at", "will", "8", "PM"],
    correct: ["I", "will", "be", "working", "at", "8", "PM", "tomorrow."],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 12 · Практика",
    questionIndex: 3,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 13 · Ошибки",
    title: "Три частые ловушки",
    paragraphs: [
      "Нельзя will am / will is / will are: после will только be.",
      "Нельзя will be work: смысловой глагол получает -ing.",
      "Нельзя will working: нужен be между will и V-ing.",
    ],
    examples: [
      { en: "I will be working.", ru: "Правильно." },
      { en: "He will be sleeping.", ru: "Правильно." },
      { en: "They will be playing.", ru: "Правильно." },
    ],
    note: "Формула: will + be + V-ing.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 14 · Практика",
    questionIndex: 5,
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 15 · Перед тестом",
    title: "Коротко о главном",
    lead: "Проверь себя: процесс в будущем, форма и вопросы.",
    summary: [
      { label: "Смысл", text: "Действие будет в процессе в конкретный момент будущего." },
      { label: "Форма", text: "Will be + V-ing. После will только be." },
      { label: "Отрицание", text: "Won't be + V-ing." },
      { label: "Вопрос", text: "Will + подлежащее + be + V-ing?" },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 16 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [6, 7, 8, 9],
    extraQuestions: [
      {
        id: "future-continuous-final-flight",
        prompt: "This time tomorrow, they ___ over the Atlantic.",
        options: ["will be flying", "will fly", "will flying", "will be fly"],
        correctAnswer: "will be flying",
        explanation: "This time tomorrow указывает на процесс в конкретный момент: will be flying.",
      },
      {
        id: "future-continuous-final-meeting",
        prompt: "At 9 AM tomorrow, I ___ a meeting.",
        options: ["will be having", "will have", "will having", "will be have"],
        correctAnswer: "will be having",
        explanation: "В 9 утра я буду в процессе встречи: will be having.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 17 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал Future Continuous для процессов в будущем, его форму, вопросы и отличие от Future Simple.",
    formula: ["Will be + V-ing", "Won't be + V-ing", "Will + подлежащее + be + V-ing?"],
  },
];

export const FUTURE_PERFECT_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "comparison",
    eyebrow: "Шаг 1 · Сравнение",
    title: "Факт или завершение к сроку?",
    lead: "Какая карточка подчёркивает, что отчёт будет уже готов к пятнице?",
    scenario:
      "Ты обсуждаешь дедлайн. В одном случае важен просто факт будущего действия, в другом — что к пятнице работа уже будет завершена.",
    example: "I will finish the report on Friday.",
    options: [
      "I will finish the report on Friday.",
      "I will have finished the report by Friday.",
    ],
    correctOption: "I will have finished the report by Friday.",
    explanation:
      "Вторая фраза подчёркивает завершение к сроку by Friday. Это Future Perfect: will have + V3.",
    comparison: {
      first: "I will finish the report on Friday.",
      second: "I will have finished the report by Friday.",
    },
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Зачем это нужно",
    title: "Завершение к моменту в будущем",
    paragraphs: [
      "Future Perfect говорит, что действие будет уже завершено к определённому моменту в будущем: By 8 PM, I will have finished my homework.",
      "Он также может описывать состояние, которое будет продолжаться до момента: By next June, I will have lived here for ten years.",
      "Главное — не просто будущее действие, а результат, который уже будет достигнут к сроку.",
    ],
    examples: [
      { en: "By 8 PM, I will have finished my homework.", ru: "К 8 вечера домашняя работа будет готова." },
      { en: "She will have left before we arrive.", ru: "Она уже уйдёт к нашему приходу." },
      { en: "By next June, I will have lived here for ten years.", ru: "К июню будет десять лет, как я здесь живу." },
    ],
    note: "Спроси себя: к какому моменту действие уже будет завершено?",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 4 · Форма",
    title: "Will have + V3",
    paragraphs: [
      "Утверждение: will have + третья форма глагола. I will have finished. She will have left.",
      "Отрицание: won't have + V3. Вопрос: Will + подлежащее + have + V3?",
      "После will всегда have, а смысловой глагол стоит в V3: written, gone, built, made.",
    ],
    examples: [
      { en: "I will have written the report.", ru: "Я уже напишу отчёт." },
      { en: "They won't have left by then.", ru: "К тому времени они ещё не уйдут." },
      { en: "Will you have finished by Friday?", ru: "Ты закончишь к пятнице?" },
    ],
    note: "Типичная ошибка: will have wrote / will have writing. Правильно: will have written.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 1,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 6 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение грамматически неверным. Проверь форму после have.",
    sentence: "I will have wrote the report by Friday.",
    words: ["I", "will", "have", "wrote", "the", "report", "by", "Friday."],
    errorIndex: 3,
    explanation:
      "После will have нужна третья форма: written, а не wrote. Правильно: I will have written the report by Friday.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 7 · Will или will have done",
    title: "Просто будущее или результат к сроку",
    paragraphs: [
      "Future Simple (will + V1) сообщает о будущем действии: I will finish the report on Friday.",
      "Future Perfect (will have + V3) подчёркивает, что к моменту действие уже завершено: I will have finished the report by Friday.",
      "By, by the time, by tomorrow, by 5 o'clock часто помогают, но смысл важнее предлога.",
    ],
    examples: [
      { en: "I will finish it on Friday.", ru: "Я закончу это в пятницу." },
      { en: "I will have finished it by Friday.", ru: "К пятнице всё будет готово." },
      { en: "By the time you come, I will have cooked dinner.", ru: "К твоему приходу ужин будет готов." },
    ],
    note: "Future Perfect — про завершённый результат к будущему сроку.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 8 · Практика",
    questionIndex: 2,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 9 · Практика",
    questionIndex: 4,
  },
  {
    kind: "matching",
    eyebrow: "Шаг 10 · Соедини смыслы",
    title: "Что выражает фраза?",
    instruction:
      "Соедини предложение с его функцией: завершение к сроку, вопрос, отрицание или длительное состояние к моменту.",
    pairs: [
      { left: "By 8 PM I will have finished.", right: "Завершение к сроку" },
      { left: "Will you have written it by Friday?", right: "Вопрос" },
      { left: "She won't have left by then.", right: "Отрицание" },
      { left: "By June I will have lived here for ten years.", right: "Длительное состояние к моменту" },
    ],
    rightOptions: ["Завершение к сроку", "Вопрос", "Отрицание", "Длительное состояние к моменту"],
    successText: "Все функции совпали: завершение, вопрос, отрицание и состояние к моменту.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 11 · Сборка",
    title: "Собери предложение",
    russian: "Я закончу отчёт к пятнице.",
    words: ["I", "will", "have", "finished", "the", "report", "by", "Friday."],
    initialWords: ["finished", "I", "Friday.", "have", "the", "will", "by", "report"],
    correct: ["I", "will", "have", "finished", "the", "report", "by", "Friday."],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 12 · Практика",
    questionIndex: 3,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 13 · V3",
    title: "Третья форма важна",
    paragraphs: [
      "После will have используется V3: finish → finished, leave → left, go → gone, write → written, build → built.",
      "Не путай V2 и V3: wrote — V2, written — V3.",
      "Проверяй форму глагола перед выбором ответа.",
    ],
    examples: [
      { en: "I will have finished.", ru: "finished — V3." },
      { en: "She will have gone.", ru: "gone — V3." },
      { en: "They will have built.", ru: "built — V3." },
    ],
    note: "Формула: will + have + V3.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 14 · Практика",
    questionIndex: 5,
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 15 · Перед тестом",
    title: "Коротко о главном",
    lead: "Проверь себя: завершение к сроку, форма и V3.",
    summary: [
      { label: "Смысл", text: "Действие будет уже завершено к моменту в будущем." },
      { label: "Форма", text: "Will have + V3." },
      { label: "Отрицание", text: "Won't have + V3." },
      { label: "Вопрос", text: "Will + подлежащее + have + V3?" },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 16 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [6, 7, 8, 9],
    extraQuestions: [
      {
        id: "future-perfect-final-concert",
        prompt: "By the time we get there, the concert ___.",
        options: ["will have started", "will start", "will has started", "will have starting"],
        correctAnswer: "will have started",
        explanation: "К нашему приходу концерт уже начнётся: will have started.",
      },
      {
        id: "future-perfect-final-book",
        prompt: "She ___ the book by Sunday.",
        options: ["will have read", "will read", "will has read", "will have reading"],
        correctAnswer: "will have read",
        explanation: "By Sunday — срок в будущем; действие будет завершено: will have read.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 17 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал Future Perfect для завершения к будущему сроку, форму will have + V3 и отличие от Future Simple.",
    formula: ["Will have + V3", "Won't have + V3", "Will + подлежащее + have + V3?"],
  },
];

export const PRESENT_PERFECT_CONTINUOUS_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    eyebrow: "Шаг 1 · Сцена",
    title: "Как долго ты этим занимаешься?",
    lead: "Какая фраза показывает, что действие началось в прошлом и продолжается?",
    scenario:
      "Ты учишь английский уже три года и продолжаешь заниматься сейчас. Друг спрашивает, как долго это длится.",
    example: "I ___ English for three years.",
    options: [
      "I learn English for three years.",
      "I have been learning English for three years.",
    ],
    correctOption: "I have been learning English for three years.",
    explanation:
      "Действие началось три года назад и продолжается. Для длительности используем have been + V-ing.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Длительность",
    title: "For, since и How long",
    paragraphs: [
      "Present Perfect Continuous показывает действие, которое началось в прошлом и продолжается до настоящего момента: I have been learning English for three years.",
      "For указывает на длительность: for three years, for two hours. Since указывает на точку старта: since 2020, since Monday.",
      "С How long обычно спрашивают о продолжительности: How long have you been waiting?",
    ],
    examples: [
      { en: "I have been learning English for three years.", ru: "Учу английский уже три года." },
      { en: "She has been working here since 2020.", ru: "Она работает здесь с 2020 года." },
      { en: "How long have you been waiting?", ru: "Как долго ты ждёшь?" },
    ],
    note: "For + длительность. Since + точка старта. Действие всё ещё продолжается.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг · Практика",
    questionIndex: 0,
  },
  {
    kind: "practice",
    eyebrow: "Шаг · Практика",
    questionIndex: 2,
  },
  {
    kind: "practice",
    eyebrow: "Шаг · Практика",
    questionIndex: 4,
  },
  {
    kind: "theory",
    eyebrow: "Шаг · Видимый результат",
    title: "Процесс только что закончился",
    paragraphs: [
      "Present Perfect Continuous также используется, когда действие недавно закончилось, но виден его результат: I have been running. That's why I'm tired.",
      "Важен не просто факт, а следы процесса в настоящем: мокрые улицы после дождя, усталость после пробежки, грязные руки после работы.",
    ],
    examples: [
      { en: "I have been running. That's why I'm tired.", ru: "Я бегал. Поэтому я устал." },
      { en: "It has been raining all day. The streets are wet.", ru: "Весь день шёл дождь. Улицы мокрые." },
      { en: "She has been crying. Her eyes are red.", ru: "Она плакала. У неё красные глаза." },
    ],
    note: "Процесс + видимый результат сейчас.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг · Практика",
    questionIndex: 1,
  },
  {
    kind: "practice",
    eyebrow: "Шаг · Практика",
    questionIndex: 3,
  },
  {
    kind: "formula",
    eyebrow: "Шаг · Формула",
    title: "Have / has been + V-ing",
    lines: [
      {
        label: "Утверждение",
        formula: "have / has been + V-ing",
        example: "I have been working. She has been working.",
      },
      {
        label: "Отрицание",
        formula: "haven't / hasn't been + V-ing",
        example: "I haven't been sleeping well.",
      },
      {
        label: "Вопрос",
        formula: "Have / Has + подлежащее + been + V-ing?",
        example: "Have you been waiting long?",
      },
    ],
    note: "С I, you, we, they — have been. С he, she, it — has been.",
  },
  {
    kind: "spot",
    eyebrow: "Шаг · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение неверным. Проверь глагол состояния.",
    sentence: "I have been knowing him for years.",
    words: ["I", "have", "been", "knowing", "him", "for", "years."],
    errorIndex: 3,
    explanation:
      "Know — глагол состояния, он обычно не используется в Continuous. Правильно: I have known him for years.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг · Perfect или Perfect Continuous",
    title: "Процесс и длительное состояние",
    paragraphs: [
      "Present Perfect Continuous подчёркивает процесс или длительность: I have been painting the wall — я красил стену, возможно, ещё не закончил.",
      "Present Perfect тоже может выражать длительное состояние, особенно с for и since: I have lived here for ten years. I have known her since 2019.",
      "Разница не всегда жёсткая: выбирай форму по тому, хочешь ли ты подчеркнуть процесс или результат/состояние.",
    ],
    examples: [
      { en: "I have painted the wall.", ru: "Результат: стена покрашена." },
      { en: "I have been painting the wall.", ru: "Процесс: я красил стену." },
      { en: "I have lived here for ten years.", ru: "Длительное состояние: живу здесь десять лет." },
      { en: "I have known her since 2019.", ru: "Состояние: знаю её с 2019 года." },
    ],
    note: "Perfect Continuous — процесс. Perfect — результат или состояние, в том числе длительное: I've lived here for ten years.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг · Практика",
    questionIndex: 5,
  },
  {
    kind: "practice",
    eyebrow: "Шаг · Практика",
    questionIndex: 6,
  },
  {
    kind: "practice",
    eyebrow: "Шаг · Практика",
    questionIndex: 7,
  },
  {
    kind: "matching",
    eyebrow: "Шаг · Соедини смыслы",
    title: "Что выражает фраза?",
    instruction:
      "Соедини предложение с его функцией: длительность, видимый результат, временная деятельность или состояние.",
    pairs: [
      { left: "I have been learning English for three years.", right: "Длительность" },
      { left: "I have been running — I'm exhausted.", right: "Видимый результат" },
      { left: "She has been working a lot lately.", right: "Временная деятельность" },
      { left: "I have known him for years.", right: "Состояние" },
    ],
    rightOptions: ["Длительность", "Видимый результат", "Временная деятельность", "Состояние"],
    successText: "Все функции совпали: длительность, результат, временная деятельность и состояние.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг · Сборка",
    title: "Собери предложение",
    russian: "Я учу английский уже три года.",
    words: ["I", "have", "been", "learning", "English", "for", "three", "years."],
    initialWords: ["learning", "I", "years.", "been", "for", "have", "English", "three"],
    correct: ["I", "have", "been", "learning", "English", "for", "three", "years."],
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг · Перед тестом",
    title: "Коротко о главном",
    lead: "Проверь себя: длительность, видимый результат, форма и отличие от Present Perfect.",
    summary: [
      { label: "Длительность", text: "For + период, since + точка старта: I have been learning for three years." },
      { label: "Результат", text: "Процесс только что закончился, виден результат: I have been running." },
      { label: "Форма", text: "Have / has been + V-ing." },
      { label: "Perfect", text: "Perfect тоже может выражать длительное состояние: I have lived here for ten years." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг · Финальный тест",
    title: "Проверь себя",
    questionIndices: [8, 9],
    extraQuestions: [
      {
        id: "ppc-final-reading",
        prompt: "How long ___ you ___ this book?",
        options: ["have / been reading", "has / been reading", "do / read", "are / reading"],
        correctAnswer: "have / been reading",
        explanation: "How long + процесс: have you been reading.",
      },
      {
        id: "ppc-final-working",
        prompt: "He ___ here since 2019.",
        options: ["has been working", "have been working", "works", "is working"],
        correctAnswer: "has been working",
        explanation: "Since 2019, действие продолжается: he has been working.",
      },
      {
        id: "ppc-final-studying",
        prompt: "They ___ much lately.",
        options: ["haven't been studying", "hasn't been studying", "don't study", "aren't studying"],
        correctAnswer: "haven't been studying",
        explanation: "Lately + процесс в последнее время: they haven't been studying.",
      },
      {
        id: "ppc-final-staring",
        prompt: "My eyes are red because I ___ at the screen all morning.",
        options: ["have been staring", "has been staring", "stare", "am staring"],
        correctAnswer: "have been staring",
        explanation: "All morning, результат сейчас: I have been staring.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал Present Perfect Continuous для длительности и видимого результата, его форму и связь с Present Perfect.",
    formula: [
      "Have / has been + V-ing",
      "For + длительность · since + точка старта",
      "Perfect Continuous — процесс · Perfect — результат или состояние",
    ],
  },
];
export const CONJUNCTIONS_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    title: "Почему ты остался дома?",
    eyebrow: "Шаг 1 · Сцена",
    lead: "Какой союз точнее связывает две идеи?",
    scenario:
      "Ты не пошёл на прогулку, потому что на улице шёл дождь. Тебе нужно объяснить причину.",
    example: "I stayed home ___ it was raining.",
    options: [
      "I stayed home because it was raining.",
      "I stayed home but it was raining.",
      "I stayed home so it was raining.",
    ],
    correctOption: "I stayed home because it was raining.",
    explanation:
      "Because вводит причину: дождь был причиной, по которой ты остался дома.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Четыре союза",
    title: "And, but, because, so",
    paragraphs: [
      "And добавляет информацию: I like tea and coffee.",
      "But показывает контраст: I wanted to go out, but I was tired.",
      "Because объясняет причину: I stayed home because it was raining.",
      "So показывает результат: It was raining, so I stayed home.",
    ],
    examples: [
      { en: "She is smart and kind.", ru: "Добавление." },
      { en: "He is short, but he is strong.", ru: "Контраст." },
      { en: "We left because it was late.", ru: "Причина." },
      { en: "It was late, so we left.", ru: "Результат." },
    ],
    note: "Because — причина. So — результат. Не меняй их местами.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "dialogue",
    eyebrow: "Шаг 4 · Собери диалог",
    title: "Разговор с Мией",
    instruction:
      "Выбери логичное продолжение реплики. Следи за связью причины, контраста и результата.",
    speakerA: "Mia",
    speakerB: "Ты",
    turns: [
      {
        line: "I didn't see you at the party. What happened?",
        options: [
          "I felt really sick, so I stayed home.",
          "I felt really sick, because I stayed home.",
          "I felt really sick, but I stayed home.",
        ],
        correctOption: "I felt really sick, so I stayed home.",
        explanation:
          "Сначала причина, потом результат: felt sick → stayed home. Поэтому so.",
      },
      {
        line: "That explains it. Did you miss the fireworks?",
        options: [
          "Yes, I missed them because I was asleep.",
          "Yes, I missed them so I was asleep.",
          "Yes, I missed them but I was asleep.",
        ],
        correctOption: "Yes, I missed them because I was asleep.",
        explanation:
          "Сон был причиной, по которой пропустил фейерверк. Нужен because.",
      },
    ],
  },
  {
    kind: "theory",
    eyebrow: "Шаг 5 · Причина или результат",
    title: "Because и so",
    paragraphs: [
      "Because отвечает на вопрос «почему?»: I was late because the bus broke down.",
      "So отвечает на вопрос «что произошло в результате?»: The bus broke down, so I was late.",
      "В одном предложении обычно используется один из этих союзов, а не оба сразу.",
    ],
    examples: [
      { en: "I was tired because I worked all day.", ru: "Причина." },
      { en: "I worked all day, so I was tired.", ru: "Результат." },
    ],
    note: "Проверь, что именно ты хочешь подчеркнуть: причину или следствие.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 6 · Практика",
    questionIndex: 1,
  },
  {
    kind: "sorting",
    eyebrow: "Шаг 7 · Сортировка",
    title: "Разложи союзы по смыслу",
    instruction:
      "Определи, какой союз пропущен: добавление, контраст, причина или результат.",
    categories: ["And", "But", "Because", "So"],
    items: [
      {
        text: "I like tea ___ coffee.",
        category: "And",
        explanation: "And добавляет второй объект.",
      },
      {
        text: "He is short, ___ he is very strong.",
        category: "But",
        explanation: "But показывает противоположность.",
      },
      {
        text: "She stayed home ___ she was ill.",
        category: "Because",
        explanation: "Because объясняет причину.",
      },
      {
        text: "It was late, ___ we left.",
        category: "So",
        explanation: "So показывает результат.",
      },
    ],
  },
  {
    kind: "spot",
    eyebrow: "Шаг 8 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на союз, который перепутан. Подумай, где причина, а где результат.",
    sentence: "I stayed home so it was raining.",
    words: ["I", "stayed", "home", "so", "it", "was", "raining."],
    errorIndex: 3,
    explanation:
      "Дождь был причиной, а не результатом. Правильно: I stayed home because it was raining.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 9 · Практика",
    questionIndex: 2,
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 10 · Сборка",
    title: "Собери предложение",
    russian: "Я остался дома, потому что шёл дождь.",
    words: ["I", "stayed", "home", "because", "it", "was", "raining."],
    initialWords: ["because", "I", "raining.", "home", "was", "stayed", "it"],
    correct: ["I", "stayed", "home", "because", "it", "was", "raining."],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 11 · Практика",
    questionIndex: 3,
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 12 · Перед тестом",
    title: "Коротко о главном",
    lead: "And, but, because и so — четыре разных связи между идеями.",
    summary: [
      { label: "And", text: "Добавляет информацию." },
      { label: "But", text: "Показывает контраст." },
      { label: "Because", text: "Вводит причину." },
      { label: "So", text: "Вводит результат." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 13 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [4, 5, 6],
    extraQuestions: [
      {
        id: "conjunctions-final-tired",
        prompt: "She was tired, ___ she went to bed early.",
        options: ["so", "because", "but", "and"],
        correctAnswer: "so",
        explanation: "Она пошла спать — результат усталости.",
      },
      {
        id: "conjunctions-final-tea",
        prompt: "I like tea, ___ I don't like coffee.",
        options: ["but", "and", "so", "because"],
        correctAnswer: "but",
        explanation: "Здесь противопоставление двух вкусов.",
      },
      {
        id: "conjunctions-final-exam",
        prompt: "He passed the exam ___ he studied hard.",
        options: ["because", "so", "but", "and"],
        correctAnswer: "because",
        explanation: "Учёба — причина успешной сдачи.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 14 · Итог",
    title: "Урок пройден!",
    lead: "Ты научился связывать идеи союзами и выбирать между причиной, результатом и контрастом.",
    formula: ["And — добавление", "But — контраст", "Because — причина", "So — результат"],
  },
];

export const COUNTABLE_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "comparison",
    title: "Что можно посчитать?",
    eyebrow: "Шаг 1 · Сравнение",
    lead: "Какая пара показывает разницу между исчисляемым и неисчисляемым?",
    scenario:
      "Ты объясняешь, что книгу можно посчитать поштучно, а воду — нет.",
    example: "a book / water",
    options: ["a book / two books", "water / a water"],
    correctOption: "a book / two books",
    explanation:
      "Book — исчисляемое: a book, two books. Water — неисчисляемое: без a/an и без обычного множественного.",
    comparison: { first: "a book / two books", second: "water / a water" },
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Две группы",
    title: "Countable и uncountable",
    paragraphs: [
      "Исчисляемые существительные можно посчитать: a book, two books, an apple.",
      "Неисчисляемые обозначают вещества, деньги, информацию или абстракции: water, money, information, advice.",
      "С исчисляемыми используем many, a few, a/an. С неисчисляемыми — much, a little, some.",
    ],
    examples: [
      { en: "I have two books.", ru: "Book — countable." },
      { en: "I need some information.", ru: "Information — uncountable." },
      { en: "There isn't much water.", ru: "Much с неисчисляемым." },
    ],
    note: "Не говори an information, two advices или a furniture.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 4 · Практика",
    questionIndex: 1,
  },
  {
    kind: "sorting",
    eyebrow: "Шаг 5 · Сортировка",
    title: "Разложи существительные",
    instruction:
      "Определи, можно ли посчитать предмет поштучно. Выбери Countable или Uncountable.",
    categories: ["Countable", "Uncountable"],
    items: [
      { text: "book", category: "Countable", explanation: "One book, two books." },
      { text: "water", category: "Uncountable", explanation: "Вещество, не считаем поштучно." },
      { text: "information", category: "Uncountable", explanation: "Не говорим an information." },
      { text: "apple", category: "Countable", explanation: "One apple, three apples." },
      { text: "money", category: "Uncountable", explanation: "Money — неисчисляемое." },
    ],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 6 · Практика",
    questionIndex: 2,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 7 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое нельзя ставить перед неисчисляемым существительным.",
    sentence: "She gave me an information about the course.",
    words: ["She", "gave", "me", "an", "information", "about", "the", "course."],
    errorIndex: 3,
    explanation:
      "Information неисчисляемое: an не используется. Правильно: She gave me some information about the course.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 8 · Much или many",
    title: "Слова количества",
    paragraphs: [
      "Many — с исчисляемыми во множественном числе: many books, many people.",
      "Much — с неисчисляемыми: much water, much time.",
      "A few — с исчисляемыми, a little — с неисчисляемыми. Some подходит к обоим.",
    ],
    examples: [
      { en: "How many books?", ru: "Books — countable." },
      { en: "How much water?", ru: "Water — uncountable." },
      { en: "A little advice.", ru: "Advice — uncountable." },
    ],
    note: "Порции помогают считать неисчисляемое: two pieces of information, a glass of water.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 9 · Практика",
    questionIndex: 3,
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 10 · Сборка",
    title: "Собери предложение",
    russian: "Мне нужно немного информации о курсе.",
    words: ["I", "need", "some", "information", "about", "the", "course."],
    initialWords: ["information", "I", "about", "some", "course.", "need", "the"],
    correct: ["I", "need", "some", "information", "about", "the", "course."],
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 11 · Перед тестом",
    title: "Коротко о главном",
    lead: "Сначала определи, можно ли посчитать предмет, а потом выбирай much/many и артикль.",
    summary: [
      { label: "Countable", text: "Можно посчитать: a book, two books, many books." },
      { label: "Uncountable", text: "Не считаем поштучно: water, money, information." },
      { label: "Слова", text: "Many / a few — countable; much / a little — uncountable." },
      { label: "Порции", text: "A piece of information, a glass of water." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 12 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [4, 5, 6],
    extraQuestions: [
      {
        id: "countable-final-sugar",
        prompt: "How ___ sugar do you want in your tea?",
        options: ["much", "many", "few", "a"],
        correctAnswer: "much",
        explanation: "Sugar — неисчисляемое, поэтому much.",
      },
      {
        id: "countable-final-chairs",
        prompt: "There are ___ chairs in the room.",
        options: ["many", "much", "a little", "any"],
        correctAnswer: "many",
        explanation: "Chairs — исчисляемое множественное число.",
      },
      {
        id: "countable-final-news",
        prompt: "I have ___ good news for you.",
        options: ["some", "many", "a", "few"],
        correctAnswer: "some",
        explanation: "News — неисчисляемое, используем some.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 13 · Итог",
    title: "Урок пройден!",
    lead: "Ты различаешь исчисляемые и неисчисляемые существительные и правильно выбираешь слова количества.",
    formula: ["Countable: many / a few / a(n)", "Uncountable: much / a little / some", "Порция: a piece of information"],
  },
];

export const DEMONSTRATIVES_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    title: "Где находится предмет?",
    eyebrow: "Шаг 1 · Сцена",
    lead: "Что скажешь о чашке, которая стоит рядом с тобой?",
    scenario:
      "Ты показываешь на чашку прямо перед собой. Она находится близко, и предмет один.",
    example: "___ is my cup here on the table.",
    options: ["This", "These", "That"],
    correctOption: "This",
    explanation: "Один близкий предмет — this.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Близко или далеко",
    title: "This, these, that, those",
    paragraphs: [
      "This — один близкий предмет. These — несколько близких предметов.",
      "That — один далёкий предмет. Those — несколько далёких предметов.",
      "Расстояние может быть физическим или временным: this morning — сегодняшнее утро, которое ещё продолжается; that day — тот день в прошлом.",
    ],
    examples: [
      { en: "This is my phone.", ru: "Один, близко." },
      { en: "These are my books.", ru: "Несколько, близко." },
      { en: "That is your car over there.", ru: "Один, далеко." },
      { en: "Those are beautiful mountains.", ru: "Несколько, далеко." },
      { en: "This morning is still going.", ru: "Сегодняшнее утро ещё продолжается." },
      { en: "That day was cold.", ru: "Тот день в прошлом." },
    ],
    note: "Смотри на количество, физическое расстояние и временную дистанцию: this morning / that day.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "sorting",
    eyebrow: "Шаг 4 · Сортировка",
    title: "Разложи указатели",
    instruction:
      "Определи, какой указатель подходит: близко/далеко и один/несколько.",
    categories: ["This", "These", "That", "Those"],
    items: [
      {
        text: "___ is my cup here.",
        category: "This",
        explanation: "Один предмет рядом.",
      },
      {
        text: "___ are my shoes here.",
        category: "These",
        explanation: "Несколько предметов рядом.",
      },
      {
        text: "___ house on the hill is old.",
        category: "That",
        explanation: "Один предмет далеко.",
      },
      {
        text: "Look at ___ birds in the sky.",
        category: "Those",
        explanation: "Несколько предметов далеко.",
      },
    ],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 1,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 6 · Практика",
    questionIndex: 2,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 7 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на указатель, который не согласуется с существительным во множественном числе.",
    sentence: "This are my shoes.",
    words: ["This", "are", "my", "shoes."],
    errorIndex: 0,
    explanation:
      "Shoes — множественное число, нужен These: These are my shoes.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 8 · Один или несколько",
    title: "Согласование с глаголом",
    paragraphs: [
      "This и that используются с is: This is my bag. That is your car.",
      "These и those используются с are: These are my bags. Those are your cars.",
      "Не говори This are или These is.",
    ],
    examples: [
      { en: "This is a pen.", ru: "Один, близко." },
      { en: "These are pens.", ru: "Несколько, близко." },
      { en: "Those are cars.", ru: "Несколько, далеко." },
    ],
    note: "Указатель и глагол должны совпадать по числу.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 9 · Практика",
    questionIndex: 3,
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 10 · Сборка",
    title: "Собери предложение",
    russian: "Эти книги — мои.",
    words: ["These", "are", "my", "books."],
    initialWords: ["books.", "These", "my", "are"],
    correct: ["These", "are", "my", "books."],
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 11 · Перед тестом",
    title: "Коротко о главном",
    lead: "Два вопроса: предмет один или несколько? Он близко или далеко?",
    summary: [
      { label: "This", text: "Один, близко." },
      { label: "These", text: "Несколько, близко." },
      { label: "That", text: "Один, далеко." },
      { label: "Those", text: "Несколько, далеко." },
      { label: "Время", text: "This morning — ещё продолжается; that day — прошлый день." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 12 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [4, 5, 6],
    extraQuestions: [
      {
        id: "demonstratives-final-shirt",
        prompt: "___ shirt here is mine.",
        options: ["This", "These", "Those", "They"],
        correctAnswer: "This",
        explanation: "Один предмет рядом — This.",
      },
      {
        id: "demonstratives-final-mountains",
        prompt: "___ mountains over there are beautiful.",
        options: ["Those", "These", "That", "This"],
        correctAnswer: "Those",
        explanation: "Несколько предметов далеко — Those.",
      },
      {
        id: "demonstratives-final-window",
        prompt: "___ is the window next to me.",
        options: ["This", "These", "Those", "Them"],
        correctAnswer: "This",
        explanation: "Один близкий предмет — This.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 13 · Итог",
    title: "Урок пройден!",
    lead: "Ты выбираешь указатели по двум признакам: количество и расстояние.",
    formula: ["This / These — близко", "That / Those — далеко", "This is / These are"],
  },
];

export const ABILITY_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    title: "Что ты умел в детстве?",
    eyebrow: "Шаг 1 · Сцена",
    lead: "Как сказать о способности в прошлом?",
    scenario:
      "Когда тебе было пять лет, ты умел плавать. Сейчас рассказываешь об этом.",
    example: "When I was five, I ___ swim.",
    options: ["could", "can", "will be able to"],
    correctOption: "could",
    explanation: "Для общей способности в прошлом используем could.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Can и could",
    title: "Способность в настоящем и прошлом",
    paragraphs: [
      "Can — способность в настоящем: I can swim. She can speak English.",
      "Could — общая способность в прошлом: When I was five, I could swim.",
      "Could также используется для вежливых просьб: Could you help me?",
    ],
    examples: [
      { en: "I can drive.", ru: "Сейчас умею." },
      { en: "He could run fast at school.", ru: "Умел в прошлом." },
      { en: "Could you open the window?", ru: "Вежливая просьба." },
    ],
    note: "После can и could — глагол без to: can swim, could swim.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "sorting",
    eyebrow: "Шаг 4 · Сортировка",
    title: "Разложи способности",
    instruction:
      "Определи, какая форма нужна: can, could или be able to.",
    categories: ["Can", "Could", "Be able to"],
    items: [
      { text: "I ___ swim now.", category: "Can", explanation: "Настоящая способность." },
      { text: "When I was five, I ___ swim.", category: "Could", explanation: "Общая способность в прошлом." },
      { text: "Next year I ___ speak Spanish.", category: "Be able to", explanation: "Будущая способность: will be able to." },
      { text: "The fire was big, but we ___ escape.", category: "Be able to", explanation: "Конкретное успешное действие в прошлом: were able to." },
      { text: "___ you help me, please?", category: "Could", explanation: "Вежливая просьба." },
    ],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 1,
  },
  {
    kind: "dialogue",
    eyebrow: "Шаг 6 · Собери диалог",
    title: "Вежливая просьба",
    instruction:
      "Выбери реплику, которая звучит естественно и грамматически верно.",
    speakerA: "Alex",
    speakerB: "Ты",
    turns: [
      {
        line: "I can't reach the top shelf. ___ you help me, please?",
        options: ["Could", "Can to", "Are able"],
        correctOption: "Could",
        explanation: "Could you help me? — вежливая просьба.",
      },
      {
        line: "Of course. Can you hold the box for a moment?",
        options: ["Yes, I can.", "Yes, I could to.", "Yes, I am able."],
        correctOption: "Yes, I can.",
        explanation: "На вопрос с can отвечаем can/can't.",
      },
    ],
  },
  {
    kind: "theory",
    eyebrow: "Шаг 7 · Be able to",
    title: "Когда can не подходит",
    paragraphs: [
      "Be able to нужно после will, have, might и в других конструкциях, где can нельзя поставить.",
      "Будущая способность: I will be able to speak Spanish next year.",
      "Конкретное успешное действие в прошлом: We were able to escape.",
    ],
    examples: [
      { en: "I will be able to help tomorrow.", ru: "Будущая способность." },
      { en: "She has been able to work here.", ru: "После have." },
      { en: "They were able to finish on time.", ru: "Конкретный успех." },
    ],
    note: "После be able to всегда to + глагол.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 8 · Практика",
    questionIndex: 2,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 9 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на лишнее слово после модального глагола.",
    sentence: "I can to swim very well.",
    words: ["I", "can", "to", "swim", "very", "well."],
    errorIndex: 2,
    explanation:
      "После can не нужен to. Правильно: I can swim very well.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 10 · Практика",
    questionIndex: 3,
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 11 · Сборка",
    title: "Собери предложение",
    russian: "В следующем году я смогу говорить по-испански.",
    words: ["I", "will", "be", "able", "to", "speak", "Spanish", "next", "year."],
    initialWords: ["able", "I", "next", "speak", "to", "will", "Spanish", "be", "year."],
    correct: ["I", "will", "be", "able", "to", "speak", "Spanish", "next", "year."],
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 12 · Перед тестом",
    title: "Коротко о главном",
    lead: "Can — сейчас, could — в прошлом или вежливо, be able to — в остальных конструкциях.",
    summary: [
      { label: "Can", text: "Настоящая способность; после can нет to." },
      { label: "Could", text: "Прошлая способность или вежливая просьба." },
      { label: "Be able to", text: "После will, have и для конкретного успеха." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 13 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [4, 5, 6],
    extraQuestions: [
      {
        id: "ability-final-chess",
        prompt: "He ___ play chess when he was six.",
        options: ["could", "can", "will be able to", "is able to"],
        correctAnswer: "could",
        explanation: "Общая способность в прошлом — could.",
      },
      {
        id: "ability-final-tomorrow",
        prompt: "I ___ finish the work tomorrow.",
        options: ["will be able to", "will can", "can to", "could to"],
        correctAnswer: "will be able to",
        explanation: "После will используем be able to.",
      },
      {
        id: "ability-final-drive",
        prompt: "She ___ drive yet. She is still learning.",
        options: ["can't", "couldn't", "isn't able", "doesn't can"],
        correctAnswer: "can't",
        explanation: "Сейчас она ещё не умеет: can't drive.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 14 · Итог",
    title: "Урок пройден!",
    lead: "Ты разобрал can, could и be able to для настоящих, прошлых и будущих способностей.",
    formula: ["Can + V", "Could + V", "Be able to + V"],
  },
];

export const ADVICE_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    title: "Друг выглядит уставшим",
    eyebrow: "Шаг 1 · Сцена",
    lead: "Какой совет звучит мягко и естественно?",
    scenario:
      "Твой друг весь день работал и выглядит уставшим. Ты хочешь посоветовать ему отдохнуть.",
    example: "You ___ get some rest.",
    options: ["should", "must", "can"],
    correctOption: "should",
    explanation: "Should — мягкий совет: тебе стоит отдохнуть.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Should и ought to",
    title: "Мягкий совет",
    paragraphs: [
      "Should + глагол без to: You should take a break.",
      "Ought to + глагол: You ought to apologize. Это чуть более формально.",
      "Отрицание: shouldn't; ought not to. После ought всегда стоит to.",
    ],
    examples: [
      { en: "You should see a doctor.", ru: "Тебе стоит показаться врачу." },
      { en: "You ought to apologize.", ru: "Тебе следует извиниться." },
      { en: "You shouldn't eat so much sugar.", ru: "Не стоит есть столько сахара." },
    ],
    note: "Should — рекомендация. Ought to — тоже совет, но формальнее.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "dialogue",
    eyebrow: "Шаг 4 · Собери диалог",
    title: "Совет для Лизы",
    instruction:
      "Выбери лучший совет для каждой ситуации. Обрати внимание на силу рекомендации.",
    speakerA: "Lisa",
    speakerB: "Ты",
    turns: [
      {
        line: "I have a terrible headache.",
        options: [
          "You should take a break.",
          "You had better ignore it.",
          "You could to rest.",
        ],
        correctOption: "You should take a break.",
        explanation: "Should — естественный мягкий совет.",
      },
      {
        line: "And I have an important exam tomorrow.",
        options: [
          "You had better get some sleep.",
          "You should to study all night.",
          "You ought study.",
        ],
        correctOption: "You had better get some sleep.",
        explanation:
          "Had better звучит как предупреждение: иначе завтра будет плохо.",
      },
    ],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 1,
  },
  {
    kind: "sorting",
    eyebrow: "Шаг 6 · Сортировка",
    title: "Разложи советы",
    instruction:
      "Определи, какая форма пропущена: should, ought to или had better.",
    categories: ["Should", "Ought to", "Had better"],
    items: [
      { text: "You ___ be more careful.", category: "Should", explanation: "Мягкий совет." },
      { text: "You ___ to apologize.", category: "Ought to", explanation: "Формальный совет." },
      { text: "You ___ better hurry, or we'll be late.", category: "Had better", explanation: "Предупреждение." },
      { text: "You had better not eat that mushroom.", category: "Had better", explanation: "Had better not — предупреждение." },
    ],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 7 · Практика",
    questionIndex: 2,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 8 · Had better",
    title: "Совет с последствиями",
    paragraphs: [
      "Had better + глагол без to: You had better hurry.",
      "Это сильный совет: если не сделать, будет плохо.",
      "Отрицание: had better not + глагол.",
    ],
    examples: [
      { en: "You had better take an umbrella.", ru: "Иначе промокнешь." },
      { en: "You had better not tell her.", ru: "Иначе она расстроится." },
    ],
    note: "Had better — не прошедшее время, а сильный совет о настоящем или будущем.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 9 · Практика",
    questionIndex: 3,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 10 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, после которого не хватает частицы to.",
    sentence: "You ought go now.",
    words: ["You", "ought", "go", "now."],
    errorIndex: 1,
    explanation:
      "После ought нужна частица to: You ought to go now.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 11 · Сборка",
    title: "Собери предложение",
    russian: "Тебе лучше поторопиться.",
    words: ["You", "had", "better", "hurry", "up."],
    initialWords: ["hurry", "You", "up.", "better", "had"],
    correct: ["You", "had", "better", "hurry", "up."],
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 12 · Перед тестом",
    title: "Коротко о главном",
    lead: "Should и ought to дают совет, had better предупреждает о последствиях.",
    summary: [
      { label: "Should", text: "Мягкий совет: You should rest." },
      { label: "Ought to", text: "Более формальный совет: You ought to rest." },
      { label: "Had better", text: "Сильный совет с последствиями." },
      { label: "Форма", text: "Should + V; ought to + V; had better + V." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 13 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [4, 5, 6, 7],
    extraQuestions: [
      {
        id: "advice-final-doctor",
        prompt: "You ___ see a doctor if the pain continues.",
        options: ["should", "ought", "had", "can to"],
        correctAnswer: "should",
        explanation: "Should + глагол — обычный совет.",
      },
      {
        id: "advice-final-smoke",
        prompt: "You ___ not to smoke in this area.",
        options: ["ought", "should", "had", "better"],
        correctAnswer: "ought",
        explanation: "Конструкция ought not to + глагол.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 14 · Итог",
    title: "Урок пройден!",
    lead: "Ты умеешь выбирать между мягким советом и предупреждением.",
    formula: ["Should + V", "Ought to + V", "Had better + V"],
  },
];

export const PROBABILITY_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    title: "Насколько ты уверен?",
    eyebrow: "Шаг 1 · Сцена",
    lead: "Ты не уверен, но дождь вполне возможен. Какая фраза подходит?",
    scenario:
      "Небо затянуто тучами. Ты не знаешь точно, пойдёт ли дождь, но считаешь это возможным.",
    example: "It ___ rain later.",
    options: ["might", "must", "will definitely"],
    correctOption: "might",
    explanation: "Might показывает неуверенную возможность.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · От возможности к выводу",
    title: "Границы оттенков размыты",
    paragraphs: [
      "May, might и could показывают возможность, но не дают точного процента уверенности. В живой речи may и might часто почти взаимозаменяемы, а could может звучать как теоретическая возможность.",
      "Must и can't выражают уверенный вывод: must — «почти наверняка да», can't — «почти наверняка нет».",
      "Не воспринимай эти глаголы как жёсткую шкалу. Один и тот же оттенок может звучать сильнее или мягче в зависимости от контекста и интонации.",
    ],
    examples: [
      { en: "He could be tired.", ru: "Теоретически может быть." },
      { en: "He might be tired.", ru: "Возможно, он уставший." },
      { en: "He may be tired.", ru: "Вероятно, он уставший." },
      { en: "He must be tired.", ru: "Должно быть, он устал." },
      { en: "He can't be tired.", ru: "Не может быть, чтобы он устал." },
    ],
    note: "Смысл важнее шкалы: may, might и could могут перетекать друг в друга.",
  },
  {
    kind: "spectrum",
    eyebrow: "Шаг 3 · Слайдер вероятности",
    title: "Почувствуй оттенок уверенности",
    instruction:
      "В реальной речи may, might и could часто взаимозаменяемы, а разница между ними минимальна. Ползунок показывает лишь условный переход от сомнения к уверенности, но это не жесткое правило. Главное: can't — не может быть, must — должно быть.",
    baseBefore: "He",
    baseAfter: "be at home.",
    zones: [
      {
        min: 0,
        max: 19,
        word: "can't",
        label: "Уверен, что НЕ произойдет",
        translation:
          "Не может быть, чтобы он был дома (я знаю, что он в другом месте)",
      },
      {
        min: 20,
        max: 39,
        word: "could",
        label: "Теоретическая возможность",
        translation: "Возможно, он дома",
      },
      {
        min: 40,
        max: 59,
        word: "might",
        label: "Возможно",
        translation: "Возможно, он дома",
      },
      {
        min: 60,
        max: 79,
        word: "may",
        label: "Вероятно",
        translation: "Возможно, он дома",
      },
      {
        min: 80,
        max: 100,
        word: "must",
        label: "Уверенный вывод",
        translation:
          "Должно быть, он дома (я вижу свет в окне)",
      },
    ],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 4 · Практика",
    questionIndex: 0,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 5 · Отрицание и вывод",
    title: "May not, might not, must и can't",
    paragraphs: [
      "May not и might not показывают неуверенность в отрицании: I might not come — возможно, не приду.",
      "Must и can't работают для уверенных выводов: He must be tired — должно быть, устал; He can't be tired — не может быть, чтобы устал.",
      "Сокращение mayn't в современном английском почти не используется, поэтому лучше говорить may not.",
    ],
    examples: [
      { en: "I might not come tomorrow.", ru: "Возможно, не приду." },
      { en: "She may not agree.", ru: "Возможно, она не согласится." },
      { en: "He must be tired.", ru: "Должно быть, он устал." },
      { en: "He can't be tired.", ru: "Не может быть, чтобы он устал." },
    ],
    note: "May not / might not — неуверенное «возможно, нет». Must / can't — уверенный вывод.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 6 · Практика",
    questionIndex: 1,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 7 · Практика",
    questionIndex: 2,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 8 · Практика",
    questionIndex: 3,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 9 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на глагол, который стоит в неверной форме после модального.",
    sentence: "It might rains later.",
    words: ["It", "might", "rains", "later."],
    errorIndex: 2,
    explanation:
      "После might — базовая форма без -s: It might rain later.",
  },
  {
    kind: "matching",
    eyebrow: "Шаг 10 · Соедини смыслы",
    title: "Степень уверенности",
    instruction:
      "Соедини фразу с её оттенком вероятности.",
    pairs: [
      { left: "It could rain, but the forecast is unclear.", right: "Теоретическая возможность" },
      { left: "I might go to the party.", right: "Возможно" },
      { left: "The sky is black; it may rain soon.", right: "Вероятно" },
    ],
    rightOptions: ["Теоретическая возможность", "Возможно", "Вероятно"],
    successText: "Ты почувствовал плавные оттенки возможности.",
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 11 · Сборка",
    title: "Собери предложение",
    russian: "Возможно, позже пойдёт дождь.",
    words: ["It", "might", "rain", "later."],
    initialWords: ["rain", "It", "later.", "might"],
    correct: ["It", "might", "rain", "later."],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 12 · Практика",
    questionIndex: 4,
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 13 · Перед тестом",
    title: "Коротко о главном",
    lead: "May, might и could — плавные оттенки возможности, а must и can't — уверенные выводы.",
    summary: [
      { label: "Could", text: "Теоретическая возможность: в принципе может быть." },
      { label: "Might", text: "Возможно, но без уверенности." },
      { label: "May", text: "Вероятно; звучит чуть увереннее, но границы размыты." },
      { label: "Must / can't", text: "Уверенный вывод: должно быть / не может быть." },
      { label: "Форма", text: "Модальный + глагол без to и без -s." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 14 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [5, 6, 7],
    extraQuestions: [
      {
        id: "probability-final-cant",
        prompt:
          "John is in London right now. He ___ be at home in Amsterdam.",
        options: ["can't", "must", "might", "may"],
        correctAnswer: "can't",
        explanation:
          "Джон точно в Лондоне, поэтому его не может быть дома в Амстердаме: He can't be at home.",
      },
      {
        id: "probability-final-bridge",
        prompt:
          "The bridge looks very old, but we haven't inspected it yet. It ___ be dangerous.",
        options: ["could", "must", "can't", "should"],
        correctAnswer: "could",
        explanation:
          "Мы ещё не проверяли мост, поэтому говорим о теоретической возможности: It could be dangerous.",
      },
      {
        id: "probability-final-may-not",
        prompt:
          "She ___ come to the party. She hasn't decided yet.",
        options: ["may not", "must not", "can't", "shouldn't"],
        correctAnswer: "may not",
        explanation:
          "Решение ещё не принято, поэтому это неуверенное отрицание: She may not come.",
      },
      {
        id: "probability-final-might-not",
        prompt:
          "They ___ arrive on time. The traffic is terrible.",
        options: ["might not", "must not", "can't", "needn't"],
        correctAnswer: "might not",
        explanation:
          "Пробки делают опоздание возможным, но не уверенным: They might not arrive on time.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 15 · Итог",
    title: "Урок пройден!",
    lead: "Ты научился чувствовать плавные оттенки возможности — от теоретического could до уверенных must и can't.",
    formula: [
      "Could — теоретическая возможность",
      "Might — возможно",
      "May — вероятно",
      "Must — уверенный вывод «да»",
      "Can't — уверенный вывод «нет»",
    ],
  },
];

export const POSSESSIVES_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    title: "Чья это сумка?",
    eyebrow: "Шаг 1 · Сцена",
    lead: "Как ответить, что сумка принадлежит тебе?",
    scenario:
      "Друг показывает на сумку и спрашивает, твоя ли она. Ты хочешь сказать, что она твоя.",
    example: "Is this your bag? — Yes, it's ___.",
    options: ["mine", "my", "me"],
    correctOption: "mine",
    explanation: "Mine заменяет my bag и стоит без существительного.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · My и mine",
    title: "Определитель или местоимение?",
    paragraphs: [
      "My, your, his, her, its, our, their стоят перед существительным и отвечают на вопрос «чей?»: my car, their house.",
      "Mine, yours, his, hers, ours, theirs заменяют существительное и стоят без него: This car is mine — эта машина моя.",
      "Сравни: This is my bag — определитель + существительное. This bag is mine — местоимение вместо my bag.",
      "В притяжательных местоимениях нет апострофа: hers, ours, theirs, yours. Формы her's, our's, their's неверны.",
    ],
    examples: [
      { en: "My car is red.", ru: "My стоит перед существительным car." },
      { en: "This car is mine.", ru: "Mine заменяет my car." },
      { en: "This bag is hers.", ru: "Hers заменяет her bag." },
    ],
    note: "Определитель + существительное. Местоимение — вместо существительного.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "practice",
    eyebrow: "Шаг 4 · Практика",
    questionIndex: 1,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 5 · Whose и Who's",
    title: "Чей? Или кто?",
    paragraphs: [
      "Whose — вопрос о принадлежности: Whose pen is this? — Чья это ручка?",
      "Who's — сокращение от who is или who has: Who's at the door? — Кто у двери? Who's got my keys? — У кого мои ключи?",
      "Сравни: Whose bag is this? — чья сумка. Who's this? — кто это.",
    ],
    examples: [
      { en: "Whose phone is this?", ru: "Чей это телефон?" },
      { en: "Who's at the door?", ru: "Кто у двери? = Who is." },
      { en: "Who's got my keys?", ru: "У кого мои ключи? = Who has." },
    ],
    note: "Whose — принадлежность. Who's — who is / who has.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 6 · Практика",
    questionIndex: 2,
  },
  {
    kind: "theory",
    eyebrow: "Шаг 7 · Its и It's",
    title: "Принадлежность или сокращение?",
    paragraphs: [
      "Its показывает принадлежность предмету или животному: The dog is wagging its tail.",
      "It's — сокращение от it is: It's cold today. Реже it has: It's got a long tail.",
      "Сравни: The robot is moving its arm — принадлежность. It's moving its arm — it is moving.",
    ],
    examples: [
      { en: "The dog is wagging its tail.", ru: "Its — принадлежность." },
      { en: "It's cold today.", ru: "It's = it is." },
      { en: "The robot is moving its arm.", ru: "Its arm — его рука." },
    ],
    note: "Its — чей. It's — it is / it has.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 8 · Практика",
    questionIndex: 3,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 9 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на форму, которая означает «it is», но здесь нужна принадлежность.",
    sentence: "The robot is moving it's arm.",
    words: ["The", "robot", "is", "moving", "it's", "arm."],
    errorIndex: 4,
    explanation:
      "It's = it is. Принадлежность — its: The robot is moving its arm.",
  },
  {
    kind: "sorting",
    eyebrow: "Шаг 10 · Сортировка",
    title: "Разложи притяжательные формы",
    instruction:
      "Определи, где форма стоит перед существительным, где заменяет его, а где задаёт вопрос о владельце.",
    categories: [
      "Перед существительным",
      "Вместо существительного",
      "Вопрос о владельце",
    ],
    items: [
      {
        text: "my car",
        category: "Перед существительным",
        explanation: "My стоит перед car.",
      },
      {
        text: "mine",
        category: "Вместо существительного",
        explanation: "Mine заменяет my car.",
      },
      {
        text: "Whose",
        category: "Вопрос о владельце",
        explanation: "Whose спрашивает о принадлежности.",
      },
      {
        text: "their house",
        category: "Перед существительным",
        explanation: "Their стоит перед house.",
      },
      {
        text: "theirs",
        category: "Вместо существительного",
        explanation: "Theirs заменяет their house.",
      },
    ],
  },
  {
    kind: "dialogue",
    eyebrow: "Шаг 11 · Собери диалог",
    title: "В бюро находок",
    instruction:
      "Выбери естественный ответ о принадлежности. Следи за формой после is.",
    speakerA: "Clerk",
    speakerB: "Ты",
    turns: [
      {
        line: "Excuse me, is this your umbrella?",
        options: ["No, it's not mine.", "No, it's not my.", "No, it's not me."],
        correctOption: "No, it's not mine.",
        explanation: "Mine заменяет my umbrella.",
      },
      {
        line: "And this blue one? Is it yours?",
        options: ["No, it's hers.", "No, it's her.", "No, it's she."],
        correctOption: "No, it's hers.",
        explanation: "Hers заменяет her umbrella.",
      },
    ],
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 12 · Сборка",
    title: "Собери предложение",
    russian: "Эта книга — моя.",
    words: ["This", "book", "is", "mine."],
    initialWords: ["mine.", "This", "is", "book"],
    correct: ["This", "book", "is", "mine."],
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 13 · Перед тестом",
    title: "Коротко о главном",
    lead: "Перед существительным — my, без существительного — mine. Whose — чей, who's — кто. Its — принадлежность, it's — it is.",
    summary: [
      {
        label: "Determiners",
        text: "My, your, his, her, its, our, their + существительное.",
      },
      {
        label: "Pronouns",
        text: "Mine, yours, his, hers, ours, theirs — без существительного.",
      },
      { label: "Whose", text: "Вопрос о принадлежности." },
      { label: "Who's", text: "Who is / who has, а не принадлежность." },
      { label: "Its / it's", text: "Its — принадлежность; it's — it is / it has." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 14 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [4, 5, 6],
    extraQuestions: [
      {
        id: "possessives-final-car",
        prompt: "That is ___ car.",
        options: ["my", "mine", "me", "whose"],
        correctAnswer: "my",
        explanation: "Перед существительным car — my.",
      },
      {
        id: "possessives-final-choice",
        prompt: "The choice is ___.",
        options: ["yours", "your", "you", "whose"],
        correctAnswer: "yours",
        explanation: "Без существительного используем yours.",
      },
      {
        id: "possessives-final-jacket",
        prompt: "___ jacket is this?",
        options: ["Whose", "Who", "Which", "Whom"],
        correctAnswer: "Whose",
        explanation: "Вопрос о владельце — Whose.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 15 · Итог",
    title: "Урок пройден!",
    lead: "Ты различаешь my/mine, whose/who's, its/it's и притяжательные местоимения.",
    formula: [
      "my + noun",
      "mine without noun",
      "Whose + noun?",
      "Who's = who is / who has",
      "Its — принадлежность · It's = it is",
    ],
  },
];

export const BOTH_EITHER_NEITHER_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    title: "Любой из двух вариантов",
    eyebrow: "Шаг 1 · Сцена",
    lead: "Тебе не важно, какой из двух вариантов выбрать. Как сказать?",
    scenario:
      "Представь, что тебе предложили два фильма на выбор. Тебе не важно, какой из них смотреть.",
    example: "You can watch ___ film.",
    options: ["either", "both", "neither"],
    correctOption: "either",
    explanation: "Either — любой из двух, когда выбор не важен.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Both, either, neither",
    title: "Два предмета",
    paragraphs: [
      "Both — оба вместе: Both options are good.",
      "Either — любой из двух: You can choose either colour.",
      "Neither — ни один из двух: Neither answer is correct.",
    ],
    examples: [
      { en: "Both of my sisters are doctors.", ru: "Обе." },
      { en: "You can use either door.", ru: "Любая из двух." },
      { en: "Neither of them came.", ru: "Ни один." },
    ],
    note: "Neither уже отрицательное; не добавляй not: Neither of them came.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "sorting",
    eyebrow: "Шаг 4 · Сортировка",
    title: "Разложи quantifiers",
    instruction:
      "Определи, что означает фраза: оба, любой из двух или ни один.",
    categories: ["Both", "Either", "Neither"],
    items: [
      { text: "___ of my parents are teachers.", category: "Both", explanation: "Оба родителя." },
      { text: "You can take ___ bus.", category: "Either", explanation: "Любой из двух." },
      { text: "___ of the answers is correct.", category: "Neither", explanation: "Ни один не правильный." },
      { text: "___ options are available.", category: "Both", explanation: "Оба варианта." },
      { text: "The film was boring. ___ of them appealed to me.", category: "Neither", explanation: "Ни один из двух не понравился." },
    ],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 1,
  },
  {
    kind: "dialogue",
    eyebrow: "Шаг 6 · Собери диалог",
    title: "Чай или кофе?",
    instruction:
      "Выбери ответ, который логично продолжает разговор о двух вариантах.",
    speakerA: "Host",
    speakerB: "Ты",
    turns: [
      {
        line: "Would you like tea or coffee?",
        options: [
          "Either is fine, thanks.",
          "Both is fine.",
          "Neither are fine.",
        ],
        correctOption: "Either is fine, thanks.",
        explanation: "Either = любой из двух вариантов.",
      },
      {
        line: "Do you want sugar or milk?",
        options: ["Neither, thanks.", "Both of them is.", "Either are."],
        correctOption: "Neither, thanks.",
        explanation: "Neither = ни один из двух.",
      },
    ],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 7 · Практика",
    questionIndex: 2,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 8 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на глагол, который не согласуется с neither answer.",
    sentence: "Neither answer are correct.",
    words: ["Neither", "answer", "are", "correct."],
    errorIndex: 2,
    explanation:
      "Neither answer — единственное число, поэтому нужен is: Neither answer is correct.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 9 · Практика",
    questionIndex: 3,
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 10 · Сборка",
    title: "Собери предложение",
    russian: "Ни один из них не пришёл на вечеринку.",
    words: ["Neither", "of", "them", "came", "to", "the", "party."],
    initialWords: ["them", "Neither", "party.", "to", "came", "the", "of"],
    correct: ["Neither", "of", "them", "came", "to", "the", "party."],
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 11 · Перед тестом",
    title: "Коротко о главном",
    lead: "Both — оба, either — любой из двух, neither — ни один.",
    summary: [
      { label: "Both", text: "Оба вместе; both of the options." },
      { label: "Either", text: "Любой из двух; either door." },
      { label: "Neither", text: "Ни один из двух; neither answer is correct." },
      { label: "Глагол", text: "Neither answer is; neither of + plural + singular verb." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 12 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [4, 5, 6],
    extraQuestions: [
      {
        id: "quantifiers-final-parents",
        prompt: "___ of my parents speak English.",
        options: ["Neither", "Both", "Either", "Every"],
        correctAnswer: "Neither",
        explanation: "Ни один из двух родителей — Neither.",
      },
      {
        id: "quantifiers-final-bus",
        prompt: "You can take ___ bus; they both go downtown.",
        options: ["either", "neither", "both", "no"],
        correctAnswer: "either",
        explanation: "Любой из двух автобусов — either.",
      },
      {
        id: "quantifiers-final-options",
        prompt: "___ options are good.",
        options: ["Both", "Either", "Neither", "Much"],
        correctAnswer: "Both",
        explanation: "Оба варианта — Both options.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 13 · Итог",
    title: "Урок пройден!",
    lead: "Ты уверенно выбираешь both, either и neither для двух предметов.",
    formula: ["Both = оба", "Either = любой из двух", "Neither = ни один из двух"],
  },
];

export const PREPOSITIONS_PLACE_COURSE: readonly CourseStep[] = [
  {
    kind: "intro",
    introType: "scenario",
    title: "Где лежат ключи?",
    eyebrow: "Шаг 1 · Сцена",
    lead: "Ключи находятся внутри сумки. Какой предлог нужен?",
    scenario:
      "Ты ищешь ключи. Они лежат внутри твоей сумки, а не на столе и не рядом с ней.",
    example: "The keys are ___ my bag.",
    options: ["in", "on", "at"],
    correctOption: "in",
    explanation:
      "In используется, когда предмет находится внутри чего-то: in my bag.",
  },
  {
    kind: "theory",
    eyebrow: "Шаг 2 · Четыре предлога",
    title: "In, on, at, under",
    paragraphs: [
      "In — внутри: The keys are in my bag. She lives in London.",
      "On — на поверхности: The book is on the table. There is a picture on the wall.",
      "At — в конкретной точке или у объекта: I am at the bus stop. We are at a concert.",
      "Under — под чем-то: The dog is sleeping under the table.",
    ],
    examples: [
      { en: "The keys are in my bag.", ru: "Внутри сумки." },
      { en: "Your phone is on the table.", ru: "На поверхности стола." },
      { en: "I am waiting at the bus stop.", ru: "В конкретной точке." },
      { en: "The cat is under the chair.", ru: "Под стулом." },
    ],
    note: "Смотри на положение предмета: внутри, на поверхности, в точке или под чем-то.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 3 · Практика",
    questionIndex: 0,
  },
  {
    kind: "sorting",
    eyebrow: "Шаг 4 · Сортировка",
    title: "Разложи по предлогам",
    instruction:
      "Определи, где находится предмет: внутри, на поверхности, в конкретной точке или под чем-то.",
    categories: ["In", "On", "At", "Under"],
    items: [
      {
        text: "The keys are ___ my bag.",
        category: "In",
        explanation: "Ключи внутри сумки.",
      },
      {
        text: "The phone is ___ the table.",
        category: "On",
        explanation: "Телефон на поверхности стола.",
      },
      {
        text: "I am waiting ___ the bus stop.",
        category: "At",
        explanation: "Автобусная остановка — конкретная точка.",
      },
      {
        text: "The dog is sleeping ___ the table.",
        category: "Under",
        explanation: "Собака под столом.",
      },
      {
        text: "There is a picture ___ the wall.",
        category: "On",
        explanation: "Картина на поверхности стены.",
      },
    ],
  },
  {
    kind: "practice",
    eyebrow: "Шаг 5 · Практика",
    questionIndex: 1,
  },
  {
    kind: "dialogue",
    eyebrow: "Шаг 6 · Собери диалог",
    title: "Как пройти?",
    instruction:
      "Выбери естественный ответ о местоположении. Обрати внимание на предлог.",
    speakerA: "Tourist",
    speakerB: "Ты",
    turns: [
      {
        line: "Excuse me, where is the nearest bank?",
        options: [
          "It's on the corner, next to the café.",
          "It's in the corner, next to the café.",
          "It's under the corner, next to the café.",
        ],
        correctOption: "It's on the corner, next to the café.",
        explanation: "On the corner — на углу, на поверхности/пересечении.",
      },
      {
        line: "And where is the museum?",
        options: [
          "It's at the end of the street.",
          "It's on the end of the street.",
          "It's under the end of the street.",
        ],
        correctOption: "It's at the end of the street.",
        explanation: "At the end of the street — в конечной точке улицы.",
      },
    ],
  },
  {
    kind: "theory",
    eyebrow: "Шаг 7 · Точка или поверхность",
    title: "At и on",
    paragraphs: [
      "At используется для точки на карте, места встречи или мероприятия: at the station, at the cinema, at a concert.",
      "On — для поверхности: on the table, on the wall, on the floor.",
      "In — для закрытого пространства, города или страны: in the box, in London, in Spain.",
    ],
    examples: [
      { en: "Meet me at the cinema.", ru: "Встретимся у кинотеатра." },
      { en: "The poster is on the wall.", ru: "Плакат на стене." },
      { en: "She lives in Paris.", ru: "Она живёт в Париже." },
    ],
    note: "At — точка, on — поверхность, in — внутри.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 8 · Практика",
    questionIndex: 2,
  },
  {
    kind: "spot",
    eyebrow: "Шаг 9 · Найди ошибку",
    title: "Что здесь не так?",
    instruction:
      "Нажми на слово, которое делает предложение неверным.",
    sentence: "The book is in the table.",
    words: ["The", "book", "is", "in", "the", "table."],
    errorIndex: 3,
    explanation:
      "Книга лежит на поверхности стола, поэтому нужен on: The book is on the table.",
  },
  {
    kind: "practice",
    eyebrow: "Шаг 10 · Практика",
    questionIndex: 3,
  },
  {
    kind: "word-order",
    eyebrow: "Шаг 11 · Сборка",
    title: "Собери предложение",
    russian: "Ключи лежат в моей сумке.",
    words: ["The", "keys", "are", "in", "my", "bag."],
    initialWords: ["bag.", "The", "in", "are", "keys", "my"],
    correct: ["The", "keys", "are", "in", "my", "bag."],
  },
  {
    kind: "pre-test",
    eyebrow: "Шаг 12 · Перед тестом",
    title: "Коротко о главном",
    lead: "In — внутри, on — на поверхности, at — в точке, under — под чем-то.",
    summary: [
      { label: "In", text: "Внутри: in the bag, in London." },
      { label: "On", text: "На поверхности: on the table, on the wall." },
      { label: "At", text: "В конкретной точке: at the bus stop, at the cinema." },
      { label: "Under", text: "Под чем-то: under the table." },
    ],
  },
  {
    kind: "test",
    eyebrow: "Шаг 13 · Финальный тест",
    title: "Проверь себя",
    questionIndices: [4, 5, 6],
    extraQuestions: [
      {
        id: "place-final-bed",
        prompt: "The cat is hiding ___ the bed.",
        options: ["under", "on", "at", "in"],
        correctAnswer: "under",
        explanation: "Кот спрятался под кроватью — under.",
      },
      {
        id: "place-final-station",
        prompt: "I'll meet you ___ the station.",
        options: ["at", "in", "on", "under"],
        correctAnswer: "at",
        explanation: "Станция — конкретная точка встречи, поэтому at.",
      },
      {
        id: "place-final-ceiling",
        prompt: "There is a lamp ___ the ceiling.",
        options: ["on", "in", "at", "under"],
        correctAnswer: "on",
        explanation: "Лампа на поверхности потолка — on the ceiling.",
      },
    ],
  },
  {
    kind: "result",
    eyebrow: "Шаг 14 · Итог",
    title: "Урок пройден!",
    lead: "Ты уверенно выбираешь in, on, at и under, когда говоришь о месте.",
    formula: ["In — внутри", "On — на поверхности", "At — в точке", "Under — под"],
  },
];
