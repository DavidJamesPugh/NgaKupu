/**
 * Sentence-level translation multiple choice.
 *
 * **Adding lessons:** Append objects to `TRANSLATION_CHOICE_LESSONS`. Each row is one
 * question. Use `direction` to set whether the prompt is te reo (pick English) or English
 * (pick te reo). Put the **correct** answer in `correctAnswer` and **wrong** lines in
 * `distractors` — keep the same grammar pattern so learners must notice number, place,
 * subject, or tense (not random unrelated sentences). You can list **more** wrong answers
 * than are shown at once; each attempt randomly picks `wrongOptionCount` of them so the
 * item is not memorised by “always these two foils.”
 *
 * **Hundreds of items:** This array can grow or be split into `translationChoice/birds.ts`
 * etc. and re-exported from an `index` barrel; the shape stays the same. Optional: generate
 * TypeScript from a CSV/JSON build step if editors prefer spreadsheets.
 */
import type { Question, TranslationChoiceQuestion } from '../types/Question';
import { shuffleArray } from '../utils/array';

export type TranslationChoiceDirection = 'mi-to-en' | 'en-to-mi';

export interface TranslationChoiceLessonDef {
  id: string;
  difficulty: NonNullable<Question['difficulty']>;
  direction: TranslationChoiceDirection;
  prompt: string;
  questionText: string;
  correctAnswer: string;
  distractors: string[];
  /**
   * Wrong options to show each attempt (default 2). Must be ≤ `distractors.length`.
   */
  wrongOptionCount?: number;
  /** Shown after the learner answers (optional reinforcement) */
  translationNote?: string;
}

export const TRANSLATION_CHOICE_LESSONS: TranslationChoiceLessonDef[] = [
  {
    id: 'rakiraki-ngahere',
    difficulty: 'tamariki',
    direction: 'mi-to-en',
    prompt: 'Whakamāoritanga tika — tīpako i te whakamaoritanga Ingarihi.',
    questionText: 'Ngā rakiraki i haere ki te ngahere.',
    correctAnswer: 'The ducks went to the forest.',
    distractors: [
      'The duck went to the forest.',
      'The duck went to the house.',
      'The ducks went to the house.',
      'The ducks went to the river.',
    ],
    translationNote: 'Ngā rakiraki: the ducks (plural); ki te whare: to the house.',
  },
  {
    id: 'kurī-kura',
    difficulty: 'tamariki',
    direction: 'mi-to-en',
    prompt: 'Whakamāoritanga tika — tīpako i te whakamaoritanga Ingarihi.',
    questionText: 'I haere te kurī ki te kura.',
    correctAnswer: 'The dog went to the school.',
    distractors: [
      'The dogs went to the school.',
      'The dog went to the shop.',
    ],
    translationNote: 'Te kurī: the dog (singular); te kura: the school.',
  },
  {
    id: 'manu-rākau',
    difficulty: 'tauira',
    direction: 'mi-to-en',
    prompt: 'Whakamāoritanga tika — tīpako i te whakamaoritanga Ingarihi.',
    questionText: 'Ka rere te manu ki te rākau.',
    correctAnswer: 'The bird flew to the tree.',
    distractors: [
      'The birds flew to the tree.',
      'The bird flew to the river.',
    ],
  },
  {
    id: 'duck-forest-en-to-mi',
    difficulty: 'tamariki',
    direction: 'en-to-mi',
    prompt: 'Tīpako te rerenga Māori tika.',
    questionText: 'The duck went to the forest.',
    correctAnswer: 'I haere te rakiraki ki te ngahere.',
    distractors: [
      'I haere ngā rakiraki ki te whare.',
      'I haere te rakiraki ki te roto.',
    ],
    translationNote:
      'Te rakiraki (one duck) vs ngā rakiraki (ducks); te whare vs te ngahere (forest).',
  },
  {
    id: 'children-park-en-to-mi',
    difficulty: 'tauira',
    direction: 'en-to-mi',
    prompt: 'Tīpako te rerenga Māori tika.',
    questionText: 'The children are playing in the park.',
    correctAnswer: 'Kei te tākaro ngā tamariki i te pāka.',
    distractors: [
      'Kei te tākaro te tamaiti i te pāka.',
      'Kei te tākaro ngā tamariki i te toa.',
    ],
  },
  {
    id: 'teacher-reading-en-to-mi',
    difficulty: 'tauira',
    direction: 'en-to-mi',
    prompt: 'Tīpako te rerenga Māori tika.',
    questionText: 'The teacher is reading a book.',
    correctAnswer: 'Kei te pānui te kaiako i te pukapuka.',
    distractors: [
      'Kei te pānui ngā kaiako i te pukapuka.',
      'Kei te tuhi te kaiako i te pukapuka.',
    ],
  },
];

const buildOptionId = (lessonId: string, key: string) => `${lessonId}__${key}`;

/**
 * Builds shuffled options: one correct + `wrongOptionCount` distractors sampled from the pool.
 * `shuffleKey` should change when you want a new random subset and order (e.g. each question step).
 */
export const buildTranslationChoiceOptions = (
  q: TranslationChoiceQuestion,
  shuffleKey: string | number,
): TranslationChoiceQuestion => {
  const wrongCount = q.wrongOptionCount ?? 2;
  if (q.distractorPool.length < wrongCount) {
    throw new Error(
      `Translation question "${q.id}" needs at least ${wrongCount} distractors in the pool.`,
    );
  }

  const wrongPicked = shuffleArray([...q.distractorPool]).slice(0, wrongCount);
  const options = shuffleArray([
    { id: q.correctOptionId, value: q.correctAnswerText },
    ...wrongPicked.map((value, index) => ({
      id: `${q.id}__wrong${index}__${String(shuffleKey)}`,
      value,
    })),
  ]);

  return { ...q, options };
};

export const translationDefToQuestion = (
  def: TranslationChoiceLessonDef,
): TranslationChoiceQuestion => {
  const wrongOptionCount = def.wrongOptionCount ?? 2;
  if (def.distractors.length < wrongOptionCount) {
    throw new Error(
      `Translation lesson "${def.id}" needs at least ${wrongOptionCount} distractors (or lower wrongOptionCount).`,
    );
  }

  const correctOptionId = buildOptionId(def.id, 'correct');

  const base: TranslationChoiceQuestion = {
    id: `translation-choice-${def.id}`,
    kind: 'translation-choice',
    prompt: def.prompt,
    sourceText: def.questionText,
    sourceLanguage: def.direction === 'mi-to-en' ? 'maori' : 'english',
    options: [],
    correctOptionId,
    correctAnswerText: def.correctAnswer,
    distractorPool: def.distractors,
    wrongOptionCount,
    difficulty: def.difficulty,
    category: 'written-comprehension',
    translationNote: def.translationNote,
  };

  return buildTranslationChoiceOptions(base, 'init');
};

export const buildTranslationChoiceQuestions = (): TranslationChoiceQuestion[] =>
  TRANSLATION_CHOICE_LESSONS.map(translationDefToQuestion);
