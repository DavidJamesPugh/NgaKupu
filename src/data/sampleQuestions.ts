import type { ImageSourcePropType } from 'react-native';
import type { Question, QuestionCategory, WordMatchQuestion } from '../types/Question';
import { buildTranslationChoiceQuestions } from './translationChoiceLessons';
import { shuffleArray } from '../utils/array';

type Language = 'maori' | 'english';
type Difficulty = 'tamariki' | 'tauira' | 'tohunga';

interface VocabularyEntry {
  id: string;
  concept: string;
  language: Language;
  text: string;
  image?: ImageSourcePropType;
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

const VOCABULARY: VocabularyEntry[] = [
  {
    id: 'octopus-en',
    concept: 'octopus',
    language: 'english',
    text: 'Octopus',
    image: require('../../assets/images/octopus.png'),
  },
  {
    id: 'octopus-mi',
    concept: 'octopus',
    language: 'maori',
    text: 'Wheke',
    image: require('../../assets/images/octopus.png'),
  },
  {
    id: 'star-en',
    concept: 'star',
    language: 'english',
    text: 'Star',
    image: require('../../assets/images/star.png'),
  },
  {
    id: 'star-mi',
    concept: 'star',
    language: 'maori',
    text: 'Whetū',
    image: require('../../assets/images/star.png'),
  },
  {
    id: 'cat-en',
    concept: 'cat',
    language: 'english',
    text: 'Cat',
    image: require('../../assets/images/cat.png'),
  },
  {
    id: 'cat-mi',
    concept: 'cat',
    language: 'maori',
    text: 'Ngeru',
    image: require('../../assets/images/cat.png'),
  },
  {
    id: 'bird-en',
    concept: 'bird',
    language: 'english',
    text: 'Bird',
    image: { uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=60' },
  },
  {
    id: 'bird-mi',
    concept: 'bird',
    language: 'maori',
    text: 'Manu',
    image: { uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=60' },
  },
  {
    id: 'farewell-en',
    concept: 'farewell',
    language: 'english',
    text: 'Goodbye (To someone staying)',
    image: { uri: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81d?auto=format&fit=crop&w=300&q=60' },
  },
  {
    id: 'farewell-mi',
    concept: 'farewell',
    language: 'maori',
    text: 'E noho rā',
    image: { uri: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81d?auto=format&fit=crop&w=300&q=60' },
  },
  {
    id: 'greeting-en',
    concept: 'greeting',
    language: 'english',
    text: 'Hello',
    image: { uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=60' },
  },
  {
    id: 'greeting-mi',
    concept: 'greeting',
    language: 'maori',
    text: 'Kia ora',
    image: { uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=60' },
  },
];

const LESSONS: LessonConfig[] = [
  {
    id: 'lesson-octopus',
    prompt: 'He aha tēnei kararehe?',
    difficulty: 'tamariki',
    answerId: 'octopus-mi',
    optionsLanguage: 'maori',
    sourceLanguage: 'english',
    sourceText: 'Octopus',
    useAnswerImage: true,
    optionCount: 3,
    lessonGuide: ['He aha... ? = What is...?', 'Choose the kupu that matches the image.'],
  },
  {
    id: 'lesson-whetu-audio',
    prompt: 'Whakarongo ki te kupu ka kōwhiri i te whakamāoritanga tika.',
    difficulty: 'tamariki',
    answerId: 'star-en',
    optionsLanguage: 'english',
    sourceLanguage: 'maori',
    audio: require('../../assets/audio/whetu.mp3'),
    transcript: 'Whetū',
    optionCount: 3,
    lessonGuide: ['Whakarongo = Listen.', 'Whetū = Star.'],
  },
  {
    id: 'lesson-farewell-audio',
    prompt: 'Whakarongo ki te rerenga kōrero ka tīpako i te tikanga Ingarihi.',
    difficulty: 'tauira',
    answerId: 'farewell-en',
    optionsLanguage: 'english',
    sourceLanguage: 'maori',
    audio: require('../../assets/audio/e-noho-ra.mp3'),
    transcript: 'E noho rā',
    optionCount: 3,
    lessonGuide: ['E noho rā = Goodbye (to someone staying).'],
  },
  {
    id: 'lesson-cat',
    prompt: 'Choose the Māori kupu that matches the picture.',
    difficulty: 'tamariki',
    answerId: 'cat-mi',
    optionsLanguage: 'maori',
    sourceLanguage: 'english',
    useAnswerImage: true,
    sourceText: 'Cat',
    optionCount: 3,
    lessonGuide: ['Choose the matching Māori word.', 'Ngeru = Cat.'],
  },
  {
    id: 'lesson-greeting',
    prompt: 'Match the Māori greeting to the English meaning.',
    difficulty: 'tauira',
    answerId: 'greeting-en',
    optionsLanguage: 'english',
    sourceLanguage: 'maori',
    sourceText: 'Kia ora',
    optionCount: 4,
    lessonGuide: ['Kia ora = Hello / thanks / well-being greeting.'],
  },
];

const vocabById = new Map<string, VocabularyEntry>(
  VOCABULARY.map((entry) => [entry.id, entry]),
);

const getHelperForEntry = (entry: VocabularyEntry) => {
  const translation = VOCABULARY.find(
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

const buildLessonQuestion = (lesson: LessonConfig): WordMatchQuestion => {
  const answerEntry = vocabById.get(lesson.answerId);
  if (!answerEntry) {
    throw new Error(`Unknown answer vocabulary id: ${lesson.answerId}`);
  }

  const pool = VOCABULARY.filter(
    (entry) =>
      entry.language === lesson.optionsLanguage && entry.id !== lesson.answerId,
  );

  const optionCount = Math.min(lesson.optionCount ?? 3, pool.length);
  const distractors = shuffleArray(pool).slice(0, optionCount);

  const options = shuffleArray([
    ...distractors,
    answerEntry,
  ]).map((entry) => ({
    id: entry.id,
    value: entry.text,
    helper: entry.helper ?? getHelperForEntry(entry),
  }));

  const image = lesson.image ?? (lesson.useAnswerImage ? answerEntry.image : undefined);
  const sourceText =
    lesson.sourceText ??
    lesson.transcript ??
    (lesson.sourceLanguage === answerEntry.language ? answerEntry.text : '');

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
    audio: lesson.audio,
    category,
    lessonGuide: lesson.lessonGuide,
  };
};

export const createQuestionSet = (): Question[] => {
  const lessonQuestions = LESSONS.map((lesson) => buildLessonQuestion(lesson));
  const translationQuestions = buildTranslationChoiceQuestions();
  return shuffleArray([...lessonQuestions, ...translationQuestions]);
};
