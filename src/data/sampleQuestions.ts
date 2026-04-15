import type { ImageSourcePropType } from 'react-native';
import type {
  Question,
  TranslationChoiceQuestion,
  QuestionCategory,
  WordMatchQuestion,
  WordOrderQuestion,
} from '../types/Question';
import {
  getComplexSentenceRecords,
  getVocabularyConceptRecords,
  getVocabularyLessonRecords,
  getWordOrderLessonRecords,
} from './db/lessonDatabase';
import { resolveAudioFromKey, resolveImageFromKey } from './db/assetRegistry';
import { shuffleArray } from '../utils/array';

type Language = 'maori' | 'english';
type Difficulty = 'tamariki' | 'tauira' | 'matua' | 'tohunga';

interface VocabularyEntry {
  id: string;
  concept: string;
  language: Language;
  text: string;
  image?: ImageSourcePropType;
  audio?: number | { uri: string };
  helper?: string;
}

interface LessonConfig {
  id: string;
  prompt: string;
  difficulty: Difficulty;
  answerId: string;
  optionsLanguage: Language;
  sourceLanguage: Language;
  sourceText?: string;
  useAnswerImage?: boolean;
  image?: ImageSourcePropType;
  audio?: number | { uri: string };
  optionCount?: number;
  categoryOverride?: QuestionCategory;
  transcript?: string;
  lessonGuide?: string[];
}

interface WordOrderLessonConfig {
  id: string;
  prompt: string;
  sourceText: string;
  sourceLanguage: 'maori' | 'english';
  tiles: { id: string; value: string }[];
  correctSequenceIds: string[];
  phraseMatches?: {
    source: string;
    target: string;
  }[];
  difficulty: Difficulty;
  category?: QuestionCategory;
  lessonGuide?: string[];
}

const WORD_ORDER_MATCH_COLORS = [
  '#ef4444',
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#7c3aed',
  '#db2777',
  '#0891b2',
  '#ea580c',
  '#65a30d',
  '#4f46e5',
  '#dc2626',
  '#0d9488',
] as const;
const DB_MATCH_COLORS = [
  '#ef4444',
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#7c3aed',
  '#db2777',
  '#0891b2',
  '#ea580c',
] as const;

const countWordsInText = (text: string) =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const isSingleWordText = (text: string) => countWordsInText(text) <= 1;

const getHelperForEntryFromPool = (entry: VocabularyEntry, pool: VocabularyEntry[]) => {
  const translation = pool.find(
    (candidate) =>
      candidate.concept === entry.concept && candidate.language !== entry.language,
  );
  return translation?.text;
};

const countWords = (text?: string) => {
  if (!text) {
    return 0;
  }
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
};

const determineCategory = (
  lesson: LessonConfig,
  answerEntry: VocabularyEntry,
): QuestionCategory => {
  const mode: 'written' | 'listening' = lesson.audio ? 'listening' : 'written';
  const candidateTexts = [
    lesson.sourceText,
    lesson.transcript,
    answerEntry.text,
  ];
  const longest = Math.max(...candidateTexts.map(countWords));
  const isComprehension = longest > 2;
  if (mode === 'listening') {
    return isComprehension ? 'listening-comprehension' : 'listening-vocabulary';
  }
  return isComprehension ? 'written-comprehension' : 'written-vocabulary';
};

const buildLessonQuestionWithPool = (
  lesson: LessonConfig,
  pool: VocabularyEntry[],
  byId: Map<string, VocabularyEntry>,
): WordMatchQuestion => {
  const answerEntry = byId.get(lesson.answerId);
  if (!answerEntry) {
    throw new Error(`Unknown answer vocabulary id: ${lesson.answerId}`);
  }

  const distractorPool = pool.filter(
    (entry) =>
      entry.language === lesson.optionsLanguage && entry.id !== lesson.answerId,
  );

  const optionCount = Math.min(lesson.optionCount ?? 3, distractorPool.length);
  const distractors = shuffleArray(distractorPool).slice(0, optionCount);

  const options = shuffleArray([
    ...distractors,
    answerEntry,
  ]).map((entry) => ({
    id: entry.id,
    value: entry.text,
    helper: entry.helper ?? getHelperForEntryFromPool(entry, pool),
  }));

  const image = lesson.image ?? (lesson.useAnswerImage ? answerEntry.image : undefined);
  const sourceText =
    lesson.sourceText ??
    lesson.transcript ??
    (lesson.sourceLanguage === answerEntry.language ? answerEntry.text : '');
  const audio = lesson.audio ?? answerEntry.audio;

  const category =
    lesson.categoryOverride ?? determineCategory(lesson, answerEntry);

  return {
    id: `lesson-${lesson.id}`,
    kind: 'word-match',
    prompt: lesson.prompt,
    sourceText,
    sourceLanguage: lesson.sourceLanguage,
    options,
    correctOptionId: answerEntry.id,
    difficulty: lesson.difficulty,
    image,
    audio,
    category,
    lessonGuide: lesson.lessonGuide,
  };
};

const buildWordOrderQuestion = (lesson: WordOrderLessonConfig): WordOrderQuestion => ({
  id: `word-order-${lesson.id}`,
  kind: 'word-order',
  prompt: lesson.prompt,
  sourceText: lesson.sourceText,
  sourceLanguage: lesson.sourceLanguage,
  tiles: lesson.tiles.map((tile) => ({ id: tile.id, value: tile.value })),
  correctSequenceIds: lesson.correctSequenceIds,
  phraseMatches: lesson.phraseMatches?.map((match, index) => ({
    ...match,
    color: WORD_ORDER_MATCH_COLORS[index % WORD_ORDER_MATCH_COLORS.length],
  })),
  difficulty: lesson.difficulty,
  category: lesson.category ?? 'written-comprehension',
  lessonGuide: lesson.lessonGuide,
});

export const createQuestionSet = (): Question[] => {
  return [];
};

const buildDbTranslationQuestions = async (): Promise<Question[]> => {
  const records = await getComplexSentenceRecords();
  if (records.length === 0) {
    return [];
  }

  const englishPool = records.map((item) => item.englishText);

  const mapped: Question[] = records.map((record) => {
    const wantsSingleWord = isSingleWordText(record.englishText);
    const matchedShapePool = englishPool.filter(
      (candidate) =>
        candidate !== record.englishText &&
        (wantsSingleWord ? isSingleWordText(candidate) : !isSingleWordText(candidate)),
    );
    const distractors = shuffleArray(matchedShapePool).slice(0, 2);
    const correctOptionId = `db-${record.slug}-correct`;

    if (
      record.category.startsWith('listening') &&
      record.audioAssetKey &&
      resolveAudioFromKey(record.audioAssetKey)
    ) {
      const options = shuffleArray([
        { id: correctOptionId, value: record.englishText },
        ...distractors.map((value, index) => ({
          id: `db-${record.slug}-d${index}`,
          value,
        })),
      ]);
      const question: WordMatchQuestion = {
        id: `db-wordmatch-${record.slug}`,
        kind: 'word-match',
        prompt: 'Whakarongo ka tīpako i te whakamāoritanga tika.',
        sourceText: '',
        sourceLanguage: 'maori',
        options,
        correctOptionId,
        audio: resolveAudioFromKey(record.audioAssetKey),
        difficulty: record.difficulty,
        category: record.category,
        lessonGuide: record.lessonGuide,
      };
      return question;
    }

    const options = shuffleArray([
      { id: correctOptionId, value: record.englishText },
      ...distractors.map((value, index) => ({
        id: `db-${record.slug}-d${index}`,
        value,
      })),
    ]);
    const question: TranslationChoiceQuestion = {
      id: `db-translation-${record.slug}`,
      kind: 'translation-choice',
      prompt: 'Whakamāori i te rerenga kōrero.',
      sourceText: record.maoriText,
      sourceLanguage: 'maori',
      options,
      correctOptionId,
      correctAnswerText: record.englishText,
      distractorPool: distractors,
      phraseMatches: record.phraseMatches.map((pair, index) => ({
        source: pair.source,
        target: pair.target,
        color: DB_MATCH_COLORS[index % DB_MATCH_COLORS.length],
      })),
      difficulty: record.difficulty,
      category: record.category,
      lessonGuide: record.lessonGuide,
    };
    return question;
  });

  return mapped;
};

const buildDbWordMatchQuestions = async (): Promise<WordMatchQuestion[]> => {
  const [vocabularyRecords, lessonRecords] = await Promise.all([
    getVocabularyConceptRecords(),
    getVocabularyLessonRecords(),
  ]);
  if (vocabularyRecords.length === 0 || lessonRecords.length === 0) {
    return [];
  }

  const dbVocabulary: VocabularyEntry[] = vocabularyRecords.flatMap((record) => [
    {
      id: `${record.conceptKey}-en`,
      concept: record.conceptKey,
      language: 'english' as const,
      text: record.englishText,
      image: resolveImageFromKey(record.imageAssetKey),
      helper: record.englishHelper,
    },
    {
      id: `${record.conceptKey}-mi`,
      concept: record.conceptKey,
      language: 'maori' as const,
      text: record.maoriText,
      image: resolveImageFromKey(record.imageAssetKey),
      // Māori side can carry pronunciation audio.
      audio: resolveAudioFromKey(record.audioAssetKey),
      helper: record.maoriHelper,
    },
  ]);
  const dbById = new Map(dbVocabulary.map((entry) => [entry.id, entry]));
  const dbLessons: LessonConfig[] = lessonRecords.map((lesson) => ({
    id: lesson.lessonId,
    prompt: lesson.prompt,
    difficulty: lesson.difficulty,
    answerId: `${lesson.answerConceptKey}-${lesson.optionsLanguage === 'maori' ? 'mi' : 'en'}`,
    optionsLanguage: lesson.optionsLanguage,
    sourceLanguage: lesson.sourceLanguage,
    sourceText: lesson.sourceText,
    transcript: lesson.transcript,
    optionCount: lesson.optionCount,
    categoryOverride: lesson.categoryOverride,
    useAnswerImage: lesson.useAnswerImage,
    image: resolveImageFromKey(lesson.imageAssetKey),
    audio: resolveAudioFromKey(lesson.audioAssetKey),
    lessonGuide: lesson.lessonGuide,
  }));

  return dbLessons.map((lesson) => buildLessonQuestionWithPool(lesson, dbVocabulary, dbById));
};

const buildDbWordOrderQuestions = async (): Promise<WordOrderQuestion[]> => {
  const lessonRecords = await getWordOrderLessonRecords();
  if (lessonRecords.length === 0) {
    return [];
  }
  const lessons: WordOrderLessonConfig[] = lessonRecords.map((lesson) => ({
    id: lesson.lessonId,
    prompt: lesson.prompt,
    sourceText: lesson.sourceText,
    sourceLanguage: lesson.sourceLanguage,
    tiles: lesson.tiles,
    correctSequenceIds: lesson.correctSequenceIds,
    phraseMatches: lesson.phraseMatches,
    difficulty: lesson.difficulty,
    category: lesson.category,
    lessonGuide: lesson.lessonGuide,
  }));
  return lessons.map((lesson) => buildWordOrderQuestion(lesson));
};

export const createQuestionSetAsync = async (): Promise<Question[]> => {
  try {
    const [dbQuestions, dbWordMatchQuestions, dbWordOrderQuestions] = await Promise.all([
      buildDbTranslationQuestions(),
      buildDbWordMatchQuestions(),
      buildDbWordOrderQuestions(),
    ]);

    const allDbQuestions = [...dbWordMatchQuestions, ...dbQuestions, ...dbWordOrderQuestions];
    if (allDbQuestions.length === 0) {
      return createQuestionSet();
    }

    return shuffleArray(allDbQuestions);
  } catch {
    return createQuestionSet();
  }
};
