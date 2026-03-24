import { useCallback, useMemo, useState } from 'react';
import {
  isAudioPromptQuestion,
  isFreeResponseQuestion,
  isMultipleChoiceQuestion,
  type Question,
} from '../types/Question';

export type SubmissionResult = 'idle' | 'correct' | 'incorrect';

export interface QuestionSessionOptions {
  /**
   * Whether answers should be matched case-sensitively.
   * Defaults to false (answers are lowercased).
   */
  matchCase?: boolean;
  /**
   * Shuffle questions on mount. Defaults to true.
   */
  shuffle?: boolean;
}

export interface QuestionSession {
  currentQuestion: Question | undefined;
  currentIndex: number;
  totalQuestions: number;
  score: number;
  status: SubmissionResult;
  lastSubmittedAnswer?: string;
  submitAnswer: (input: string) => SubmissionResult;
  goToNext: () => void;
  restart: () => void;
  hasNext: boolean;
}

const normalise = (value: string, matchCase: boolean) =>
  matchCase ? value.trim() : value.trim().toLocaleLowerCase();

const shuffleArray = <T,>(source: readonly T[]) => {
  const copy = [...source];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const useQuestionSession = (
  questions: Question[],
  options: QuestionSessionOptions = {},
): QuestionSession => {
  const { matchCase = false, shuffle = true } = options;
  const questionSet = useMemo(
    () => (shuffle ? shuffleArray(questions) : [...questions]),
    [questions, shuffle],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<SubmissionResult>('idle');
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState<string>();

  const currentQuestion = questionSet[currentIndex];

  const evaluateAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion) {
        return false;
      }

      if (isMultipleChoiceQuestion(currentQuestion)) {
        return currentQuestion.correctOptionId === answer;
      }

      const candidate = normalise(answer, matchCase);
      const acceptable = currentQuestion.acceptableAnswers.map((value) =>
        normalise(value, matchCase),
      );
      return acceptable.includes(candidate);
    },
    [currentQuestion, matchCase],
  );

  const submitAnswer = useCallback(
    (input: string): SubmissionResult => {
      if (!currentQuestion) {
        return 'idle';
      }

      const isCorrect = evaluateAnswer(input);
      setLastSubmittedAnswer(input);
      setStatus(isCorrect ? 'correct' : 'incorrect');
      if (isCorrect) {
        setScore((prev) => prev + 1);
      }
      return isCorrect ? 'correct' : 'incorrect';
    },
    [currentQuestion, evaluateAnswer],
  );

  const goToNext = useCallback(() => {
    setStatus('idle');
    setLastSubmittedAnswer(undefined);
    setCurrentIndex((prev) => (prev + 1 < questionSet.length ? prev + 1 : prev));
  }, [questionSet.length]);

  const restart = useCallback(() => {
    setStatus('idle');
    setLastSubmittedAnswer(undefined);
    setScore(0);
    setCurrentIndex(0);
  }, []);

  const hasNext = currentIndex + 1 < questionSet.length;

  return useMemo(
    () => ({
      currentQuestion,
      currentIndex,
      totalQuestions: questionSet.length,
      score,
      status,
      lastSubmittedAnswer,
      submitAnswer,
      goToNext,
      restart,
      hasNext,
    }),
    [
      currentQuestion,
      currentIndex,
      questionSet.length,
      score,
      status,
      lastSubmittedAnswer,
      submitAnswer,
      goToNext,
      restart,
      hasNext,
    ],
  );
};

export const getSubmissionPlaceholder = (question: Question): string => {
  if (isMultipleChoiceQuestion(question)) {
    return 'Select the answer';
  }
  if (isAudioPromptQuestion(question)) {
    return 'Type the translation you heard';
  }
  if (isFreeResponseQuestion(question)) {
    return 'Type your translation';
  }
  return 'Answer the prompt';
};
