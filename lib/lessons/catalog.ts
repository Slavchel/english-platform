export interface LessonSummary {
  topic: string;
  title: string;
  level: string;
}

export const LESSON_CATALOG: readonly LessonSummary[] = [
  {
    topic: "articles_a_an_the",
    title: "Articles: A, An, The",
    level: "A2",
  },
  {
    topic: "future_continuous",
    title: "Future Continuous",
    level: "B1",
  },
  {
    topic: "future_perfect",
    title: "Future Perfect",
    level: "B1",
  },
  {
    topic: "future_forms_will_going_to_present_continuous",
    title: "Future Forms: Will / Going to / Present Continuous",
    level: "A2",
  },
  {
    topic: "future_going_to",
    title: "Future: Going to",
    level: "A2",
  },
  {
    topic: "future_will",
    title: "Future Simple: Will",
    level: "A2",
  },
  {
    topic: "modal_verbs_must_have_to_should",
    title: "Modal Verbs: Must, Have to, Should",
    level: "A2",
  },
  {
    topic: "much_many_a_lot_of_little_few",
    title: "Much / Many / A Lot of / Little / Few",
    level: "A2",
  },
  {
    topic: "past_continuous",
    title: "Past Continuous",
    level: "A2",
  },
  {
    topic: "past_perfect",
    title: "Past Perfect",
    level: "B1-B2",
  },
  {
    topic: "past_simple",
    title: "Past Simple",
    level: "A2",
  },
  {
    topic: "past_simple_vs_past_continuous",
    title: "Past Simple vs Past Continuous",
    level: "A2",
  },
  {
    topic: "past_simple_vs_present_perfect",
    title: "Past Simple vs Present Perfect",
    level: "B1",
  },
  {
    topic: "prepositions_of_time_in_on_at",
    title: "Prepositions of Time: In, On, At",
    level: "A2",
  },
  {
    topic: "prepositions_of_place",
    title: "Prepositions of Place: In, On, At, Under",
    level: "A1",
  },
  {
    topic: "present_continuous",
    title: "Present Continuous",
    level: "A1",
  },
  {
    topic: "present_perfect",
    title: "Present Perfect",
    level: "A2",
  },
  {
    topic: "present_perfect_continuous",
    title: "Present Perfect Continuous",
    level: "B1",
  },
  {
    topic: "conjunctions_basic",
    title: "Conjunctions: And, But, Because, So",
    level: "A2",
  },
  {
    topic: "countable_uncountable",
    title: "Countable / Uncountable Nouns",
    level: "A2",
  },
  {
    topic: "demonstratives",
    title: "Demonstratives: This, That, These, Those",
    level: "A1",
  },
  {
    topic: "modals_of_ability",
    title: "Modals of Ability: Can, Could, Be able to",
    level: "A2",
  },
  {
    topic: "modals_of_advice",
    title: "Modals of Advice: Should, Ought to, Had better",
    level: "A2",
  },
  {
    topic: "modals_of_probability",
    title: "Modals of Probability: May, Might, Could",
    level: "B1",
  },
  {
    topic: "possessives",
    title: "Possessives: My, Mine, Whose",
    level: "A2",
  },
  {
    topic: "quantifiers_both_either_neither",
    title: "Both, Either, Neither",
    level: "B1",
  },
  {
    topic: "present_simple",
    title: "Present Simple",
    level: "A1",
  },
  {
    topic: "present_simple_vs_present_continuous",
    title: "Present Simple vs Present Continuous",
    level: "A2",
  },
  {
    topic: "some_any_no_every",
    title: "Some / Any / No / Every",
    level: "A2",
  },
  {
    topic: "there_is_there_are",
    title: "There is / There are",
    level: "A2",
  },
  {
    topic: "to_be_am_is_are",
    title: "To be: am / is / are",
    level: "A1",
  },
];

const byTopic = new Map(
  LESSON_CATALOG.map((lesson) => [lesson.topic, lesson]),
);

export function lessonTopicForTestTopic(topic: string): string | null {
  const value = topic.toLowerCase().replace(/_/g, "-");

  if (value.includes("passive")) {
    return "passive_voice";
  }

  if (value.includes("relative")) {
    return "relative_clauses";
  }

  if (value.includes("gerund") || value.includes("infinitive")) {
    return "gerunds_infinitives";
  }

  if (value.includes("reported")) {
    return "reported_speech";
  }

  if (value.includes("third-conditional") || value.includes("mixed-conditional")) {
    return "conditionals_3_mixed";
  }

  if (value.includes("conditional")) {
    return "conditionals_1_2";
  }

  if (value.includes("past-perfect")) {
    return "past_perfect";
  }

  if (
    value === "articles" ||
    value.startsWith("articles-") ||
    value === "basic-articles" ||
    value === "determiners" ||
    value === "advanced-determiners"
  ) {
    return "articles_a_an_the";
  }

  if (value.startsWith("modal")) {
    return "modal_verbs_must_have_to_should";
  }

  if (
    value === "quantifiers" ||
    value === "countable-uncountable" ||
    value.includes("much") ||
    value.includes("many")
  ) {
    return "much_many_a_lot_of_little_few";
  }

  // Present Perfect has its own focused lesson. This must be checked before
  // the broader past/present-perfect mapping.
  if (value.includes("present-perfect")) {
    return "present_perfect";
  }

  if (
    value === "past-simple-vs-continuous" ||
    value === "past-simple-vs-past-continuous"
  ) {
    return "past_simple_vs_past_continuous";
  }

  if (value === "past-simple" || value.startsWith("past-simple-")) {
    return "past_simple";
  }

  if (value === "past-continuous") {
    return "past_continuous";
  }

  if (value === "prepositions-time") {
    return "prepositions_of_time_in_on_at";
  }

  if (value === "present-simple-vs-continuous") {
    return "present_simple_vs_present_continuous";
  }

  if (value === "present-simple" || value.startsWith("present-simple-")) {
    return "present_simple";
  }

  if (
    value === "present-continuous" ||
    value.startsWith("present-continuous-")
  ) {
    return "present_continuous";
  }

  if (
    value === "be-verb" ||
    value.startsWith("be-verb-") ||
    value === "to-be"
  ) {
    return "to_be_am_is_are";
  }

  if (
    value.includes("future") ||
    value.includes("will-vs-going-to") ||
    value === "will"
  ) {
    return "future_forms_will_going_to_present_continuous";
  }

  if (value === "some-any" || value === "some-any-no-every") {
    return "some_any_no_every";
  }

  if (value === "there-is-are") {
    return "there_is_there_are";
  }

  return null;
}

export function recommendedLessons(
  testTopics: readonly string[],
): LessonSummary[] {
  const seen = new Set<string>();
  const result: LessonSummary[] = [];

  for (const testTopic of testTopics) {
    const lessonTopic = lessonTopicForTestTopic(testTopic);
    if (!lessonTopic || seen.has(lessonTopic)) continue;

    const lesson = byTopic.get(lessonTopic);
    if (!lesson) continue;

    seen.add(lessonTopic);
    result.push(lesson);
  }

  return result;
}
