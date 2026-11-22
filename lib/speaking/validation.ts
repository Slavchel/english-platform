const MIN_WORDS = 3;
const MIN_LETTERS = 5;
const MAX_LENGTH = 1200;
const KEYBOARD_MASH =
  /\b(asdf|asdfgh|qwer|qwerty|zxcv|zxcvbn|1234|12345)\b/i;

export function getSpeakingAnswerError(value: string): string | null {
  const answer = value.trim();
  if (!answer) return "Напишите ответ на английском.";

  if (answer.length > MAX_LENGTH) {
    return `Ответ слишком длинный: максимум ${MAX_LENGTH} символов.`;
  }

  const words = answer.split(/\s+/).filter(Boolean);
  if (words.length < MIN_WORDS) {
    return "Напишите хотя бы 3 слова — так Emma сможет оценить вашу речь.";
  }

  const letters = answer.match(/[A-Za-z]/g)?.join("") ?? "";
  if (letters.length < MIN_LETTERS) {
    return "Ответьте на английском и добавьте немного больше текста.";
  }

  if (!/[aeiouy]/i.test(letters)) {
    return "Похоже, это не связный английский ответ. Напишите фразу или предложение.";
  }

  if (new Set(letters.toLowerCase()).size < 3) {
    return "Похоже, это не связный ответ. Попробуйте ответить полным предложением.";
  }

  if (/(.)\1{3,}/i.test(answer) || KEYBOARD_MASH.test(answer)) {
    return "Похоже, это набор символов. Напишите ответ обычными английскими словами.";
  }

  return null;
}

export function isSpeakingAnswerValid(value: string): boolean {
  return getSpeakingAnswerError(value) === null;
}
