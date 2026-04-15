import type { Question } from '../types/Question';

export interface LearningStage {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  questionCount: number;
  /**
   * Optional curated question IDs in teaching order.
   * If provided, these are used first before fallback filtering.
   */
  questionIds?: string[];
  difficulty?: NonNullable<Question['difficulty']>;
  categories?: Question['category'][];
  coachTip: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  stages: LearningStage[];
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'foundation-journey',
    title: 'Foundation Journey',
    description: 'Build confidence from single kupu to full sentence translation.',
    stages: [
      {
        id: 'kupu-kickoff',
        title: 'Kupu Kickoff',
        subtitle: 'Stage 1',
        description: 'Start with easy vocabulary matching in written prompts.',
        questionIds: [
          'lesson-lesson-octopus',
          'lesson-lesson-cat',
          'lesson-lesson-greeting',
        ],
        difficulty: 'tamariki',
        categories: ['written-vocabulary'],
        questionCount: 6,
        coachTip:
          'Scan all options first. Eliminate obvious mismatches, then choose the closest meaning.',
      },
      {
        id: 'listen-and-match',
        title: 'Listen and Match',
        subtitle: 'Stage 2',
        description: 'Add listening prompts while keeping vocabulary manageable.',
        questionIds: [
          'lesson-lesson-whetu-audio',
          'lesson-lesson-farewell-audio',
          'db-wordmatch-whetu-audio',
        ],
        difficulty: 'tamariki',
        categories: ['listening-vocabulary'],
        questionCount: 6,
        coachTip:
          'Play the audio twice. Focus on one key word before choosing your answer.',
      },
      {
        id: 'sentence-builder',
        title: 'Sentence Builder',
        subtitle: 'Stage 3',
        description: 'Move into short sentence comprehension and translation choices.',
        questionIds: [
          'db-translation-ducks-forest',
          'db-translation-children-park',
          'db-translation-cat-sleeping-house',
          'word-order-word-order-ducks-forest',
          'word-order-word-order-children-park',
        ],
        difficulty: 'tauira',
        categories: ['written-comprehension'],
        questionCount: 8,
        coachTip:
          'Look for tiny differences like singular/plural and place words before selecting.',
      },
    ],
  },
  {
    id: 'conversation-journey',
    title: 'Conversation Journey',
    description: 'Strengthen sentence meaning and translation choices in context.',
    stages: [
      {
        id: 'everyday-phrases',
        title: 'Everyday Phrases',
        subtitle: 'Stage 1',
        description: 'Translate short everyday sentence prompts.',
        difficulty: 'tauira',
        categories: ['written-comprehension'],
        questionCount: 6,
        coachTip:
          'Read each option to the end before deciding. Small changes can flip meaning.',
      },
      {
        id: 'mixed-comprehension',
        title: 'Mixed Comprehension',
        subtitle: 'Stage 2',
        description: 'Blend listening and reading comprehension tasks.',
        difficulty: 'tauira',
        categories: ['written-comprehension', 'listening-comprehension'],
        questionCount: 8,
        coachTip:
          'Use context words first, then confirm the subject and number are correct.',
      },
      {
        id: 'fluency-check',
        title: 'Fluency Check',
        subtitle: 'Stage 3',
        description: 'Longer mixed review before moving to advanced work.',
        categories: ['written-vocabulary', 'written-comprehension', 'listening-vocabulary'],
        questionCount: 10,
        coachTip: 'Aim for accuracy first, then speed. Correct understanding comes before pace.',
      },
    ],
  },
];

export interface LearningStageRoute {
  pathId: string;
  stageId: string;
}

export const findLearningStage = (
  route: LearningStageRoute,
): { path: LearningPath; stage: LearningStage } | undefined => {
  const path = LEARNING_PATHS.find((candidate) => candidate.id === route.pathId);
  if (!path) {
    return undefined;
  }
  const stage = path.stages.find((candidate) => candidate.id === route.stageId);
  if (!stage) {
    return undefined;
  }
  return { path, stage };
};

export const applyStageFilters = (
  questions: Question[],
  stage: LearningStage,
): Question[] => {
  return getStageQuestionPool(questions, stage).slice(0, stage.questionCount);
};

export const getStageQuestionPool = (
  questions: Question[],
  stage: LearningStage,
): Question[] => {
  const fallbackFiltered = questions.filter((question) => {
    if (stage.difficulty && question.difficulty !== stage.difficulty) {
      return false;
    }
    if (stage.categories && stage.categories.length > 0) {
      return stage.categories.includes(question.category);
    }
    return true;
  });

  if (!stage.questionIds || stage.questionIds.length === 0) {
    return fallbackFiltered;
  }

  const byId = new Map(questions.map((question) => [question.id, question]));
  const curated = stage.questionIds
    .map((questionId) => byId.get(questionId))
    .filter((question): question is Question => Boolean(question));

  const curatedIds = new Set(curated.map((question) => question.id));
  const fallbackRemaining = fallbackFiltered.filter((question) => !curatedIds.has(question.id));
  return [...curated, ...fallbackRemaining];
};

export const getStageQuestionCount = (
  questions: Question[],
  stage: LearningStage,
): number => {
  return Math.min(stage.questionCount, getStageQuestionPool(questions, stage).length);
};
