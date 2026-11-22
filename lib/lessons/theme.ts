export interface CategoryTheme {
  id: string;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  accentText: string;
  glow: string;
}

const THEMES: Record<string, CategoryTheme> = {
  tenses: {
    id: "tenses",
    accent: "#6f9fd8",
    accentSoft: "rgba(111, 159, 216, 0.12)",
    accentBorder: "rgba(111, 159, 216, 0.38)",
    accentText: "#a9c8ea",
    glow: "radial-gradient(60% 50% at 12% 0%, rgba(37, 99, 235, 0.16), transparent 70%)",
  },
  comparisons: {
    id: "comparisons",
    accent: "#d98b93",
    accentSoft: "rgba(217, 139, 147, 0.12)",
    accentBorder: "rgba(217, 139, 147, 0.38)",
    accentText: "#eab6bb",
    glow: "radial-gradient(60% 50% at 12% 0%, rgba(225, 29, 72, 0.14), transparent 70%)",
  },
  conditionals: {
    id: "conditionals",
    accent: "#d8c078",
    accentSoft: "rgba(216, 192, 120, 0.12)",
    accentBorder: "rgba(216, 192, 120, 0.38)",
    accentText: "#ead9a6",
    glow: "radial-gradient(60% 50% at 12% 0%, rgba(202, 138, 4, 0.14), transparent 70%)",
  },
  syntax: {
    id: "syntax",
    accent: "#82c7c2",
    accentSoft: "rgba(130, 199, 194, 0.12)",
    accentBorder: "rgba(130, 199, 194, 0.38)",
    accentText: "#b5e2de",
    glow: "radial-gradient(60% 50% at 12% 0%, rgba(13, 148, 136, 0.14), transparent 70%)",
  },
  modals: {
    id: "modals",
    accent: "#c9a6e0",
    accentSoft: "rgba(201, 166, 224, 0.12)",
    accentBorder: "rgba(201, 166, 224, 0.38)",
    accentText: "#ddc6ec",
    glow: "radial-gradient(60% 50% at 12% 0%, rgba(147, 51, 234, 0.14), transparent 70%)",
  },
  articles: {
    id: "articles",
    accent: "#7fc4a3",
    accentSoft: "rgba(127, 196, 163, 0.12)",
    accentBorder: "rgba(127, 196, 163, 0.38)",
    accentText: "#b6ddc8",
    glow: "radial-gradient(60% 50% at 12% 0%, rgba(16, 185, 129, 0.13), transparent 70%)",
  },
  basics: {
    id: "basics",
    accent: "#d9b978",
    accentSoft: "rgba(217, 185, 120, 0.12)",
    accentBorder: "rgba(217, 185, 120, 0.38)",
    accentText: "#e8d5ad",
    glow: "radial-gradient(60% 50% at 12% 0%, rgba(245, 158, 11, 0.13), transparent 70%)",
  },
  connectors: {
    id: "connectors",
    accent: "#d9a27c",
    accentSoft: "rgba(217, 162, 124, 0.12)",
    accentBorder: "rgba(217, 162, 124, 0.38)",
    accentText: "#e8c4aa",
    glow: "radial-gradient(60% 50% at 12% 0%, rgba(234, 88, 12, 0.13), transparent 70%)",
  },
  nouns: {
    id: "nouns",
    accent: "#8fbf9f",
    accentSoft: "rgba(143, 191, 159, 0.12)",
    accentBorder: "rgba(143, 191, 159, 0.38)",
    accentText: "#bfe0c9",
    glow: "radial-gradient(60% 50% at 12% 0%, rgba(34, 197, 94, 0.12), transparent 70%)",
  },
  determiners: {
    id: "determiners",
    accent: "#b6a7d9",
    accentSoft: "rgba(182, 167, 217, 0.12)",
    accentBorder: "rgba(182, 167, 217, 0.38)",
    accentText: "#d4c9ed",
    glow: "radial-gradient(60% 50% at 12% 0%, rgba(139, 92, 246, 0.12), transparent 70%)",
  },
};

const FALLBACK: CategoryTheme = {
  id: "default",
  accent: "#c2a66d",
  accentSoft: "rgba(194, 166, 109, 0.12)",
  accentBorder: "rgba(194, 166, 109, 0.36)",
  accentText: "#d8c18e",
  glow: "radial-gradient(60% 50% at 12% 0%, rgba(194, 166, 109, 0.12), transparent 70%)",
};

export function categoryTheme(category?: string | null): CategoryTheme {
  if (!category) return FALLBACK;
  return THEMES[category] ?? FALLBACK;
}

export const CATEGORY_THEMES = THEMES;

const TOPIC_CATEGORIES: Record<string, string> = {
  present_simple: "tenses",
  present_continuous: "tenses",
  present_perfect: "tenses",
  present_perfect_continuous: "tenses",
  past_simple: "tenses",
  past_continuous: "tenses",
  past_perfect: "tenses",
  future_will: "tenses",
  future_going_to: "tenses",
  future_continuous: "tenses",
  future_perfect: "tenses",
  future_forms_will_going_to_present_continuous: "comparisons",
  present_simple_vs_present_continuous: "comparisons",
  past_simple_vs_past_continuous: "comparisons",
  past_simple_vs_present_perfect: "comparisons",
  modal_verbs_must_have_to_should: "modals",
  articles_a_an_the: "articles",
  much_many_a_lot_of_little_few: "articles",
  some_any_no_every: "articles",
  there_is_there_are: "articles",
  to_be_am_is_are: "basics",
  prepositions_of_time_in_on_at: "basics",
  conjunctions_basic: "connectors",
  countable_uncountable: "nouns",
  quantifiers_both_either_neither: "nouns",
  demonstratives: "determiners",
  possessives: "determiners",
  modals_of_ability: "modals",
  modals_of_advice: "modals",
  modals_of_probability: "modals",
  conditionals_1_2: "conditionals",
  conditionals_3_mixed: "conditionals",
  gerunds_infinitives: "syntax",
  passive_voice: "syntax",
  relative_clauses: "syntax",
  reported_speech: "syntax",
};

export function categoryForTopic(topic: string): string {
  return TOPIC_CATEGORIES[topic] ?? "basics";
}
