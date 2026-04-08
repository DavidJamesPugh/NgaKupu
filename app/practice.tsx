import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createQuestionSet } from '../src/data/sampleQuestions';
import { buildTranslationChoiceOptions } from '../src/data/translationChoiceLessons';
import { applyStageFilters, findLearningStage } from '../src/data/learningPaths';
import {
  AudioPromptCard,
  FreeResponseCard,
  MultipleChoiceCard,
  TranslationChoiceCard,
  WordMatchCard,
} from '../src/components';
import {
  getSubmissionPlaceholder,
  useQuestionSession,
  type SubmissionResult,
} from '../src/hooks/useQuestionSession';
import { useLearningProgress } from '../src/hooks/useLearningProgress';
import {
  isAudioPromptQuestion,
  isFreeResponseQuestion,
  isMultipleChoiceQuestion,
  isTranslationChoiceQuestion,
  isWordMatchQuestion,
  type Question,
} from '../src/types/Question';
import { colors } from '../src/theme/colors';

const difficultyLabels: Record<string, string> = {
  tamariki: 'Tamariki',
  tauira: 'Tauira',
  matua: 'Matua',
  tohunga: 'Tohunga',
};

const categoryLabels: Record<string, string> = {
  'written-vocabulary': 'Written Vocabulary',
  'listening-vocabulary': 'Listening Vocabulary',
  'written-comprehension': 'Written Comprehension',
  'listening-comprehension': 'Listening Comprehension',
};

export default function PracticeScreen() {
  const router = useRouter();
  const { difficulty, category, path, stage, guide } =
    useLocalSearchParams<{
      difficulty?: string;
      category?: string;
      path?: string;
      stage?: string;
      guide?: string;
    }>();
  const activeDifficulty = typeof difficulty === 'string' ? difficulty : undefined;
  const activeCategory = typeof category === 'string' ? category : undefined;
  const pathId = typeof path === 'string' ? path : undefined;
  const stageId = typeof stage === 'string' ? stage : undefined;
  const guideEnabled = guide === 'true';
  const { markStageComplete } = useLearningProgress();
  const completionKeyRef = useRef<string | undefined>(undefined);
  const autoNextKeyRef = useRef<string | undefined>(undefined);
  const autoReturnRef = useRef(false);
  const returnTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const questionPool = useMemo<Question[]>(() => createQuestionSet(), []);
  const learningStage = useMemo(() => {
    if (!pathId || !stageId) {
      return undefined;
    }
    return findLearningStage({ pathId, stageId });
  }, [pathId, stageId]);

  const filteredQuestions = useMemo(() => {
    if (learningStage) {
      return applyStageFilters(questionPool, learningStage.stage);
    }
    let working = questionPool;
    if (activeDifficulty) {
      working = working.filter((question) => question.difficulty === activeDifficulty);
    }
    if (activeCategory) {
      working = working.filter((question) => question.category === activeCategory);
    }
    return working;
  }, [questionPool, activeDifficulty, activeCategory, learningStage]);

  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    status,
    submitAnswer,
    goToNext,
    hasNext,
    score,
  } = useQuestionSession(filteredQuestions, { shuffle: false });

  /** Fresh distractor subset + order per step (translation-choice only). */
  const questionForDisplay = useMemo(() => {
    if (!currentQuestion || !isTranslationChoiceQuestion(currentQuestion)) {
      return currentQuestion;
    }
    return buildTranslationChoiceOptions(
      currentQuestion,
      `${currentIndex}-${currentQuestion.id}`,
    );
  }, [currentQuestion, currentIndex]);

  const noQuestionsAvailable = filteredQuestions.length === 0;
  const coachHint = useMemo(() => {
    if (learningStage) {
      return learningStage.stage.coachTip;
    }
    if (!currentQuestion) {
      return undefined;
    }
    if (isTranslationChoiceQuestion(currentQuestion)) {
      return 'Look for key differences: singular/plural, location words, and verb meaning.';
    }
    if (isWordMatchQuestion(currentQuestion) || isMultipleChoiceQuestion(currentQuestion)) {
      return 'Read all options first, then eliminate choices that clearly do not match.';
    }
    if (isAudioPromptQuestion(currentQuestion)) {
      return 'Play the audio twice and focus on one key kupu before answering.';
    }
    return 'Check sentence structure and meaning, then submit your best translation.';
  }, [currentQuestion, learningStage]);
  const isSelectionQuestion =
    currentQuestion != null &&
    (isMultipleChoiceQuestion(currentQuestion) ||
      isWordMatchQuestion(currentQuestion) ||
      isTranslationChoiceQuestion(currentQuestion));

  const [selectedOptionId, setSelectedOptionId] = useState<string>();
  const [responseValue, setResponseValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>();
  const [completionMessage, setCompletionMessage] = useState<string>();

  useEffect(() => {
    setSelectedOptionId(undefined);
    setResponseValue('');
    setErrorMessage(undefined);
    setCompletionMessage(undefined);
    autoReturnRef.current = false;
  }, [currentQuestion?.id]);

  const placeholder = useMemo(() => {
    if (!currentQuestion) {
      return 'Answer the prompt';
    }
    return getSubmissionPlaceholder(currentQuestion);
  }, [currentQuestion]);

  const handleSubmit = () => {
    if (!currentQuestion) {
      return;
    }

    const trimmed = responseValue.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your answer before submitting.');
      return;
    }
    const result = submitAnswer(trimmed);
    handlePostSubmit(result);
  };

  const handleOptionSelect = (optionId: string) => {
    setSelectedOptionId(optionId);
    setErrorMessage(undefined);
    const result = submitAnswer(optionId);
    handlePostSubmit(result);
  };

  const handlePostSubmit = (result: SubmissionResult) => {
    setErrorMessage(undefined);
    if (result === 'correct') {
      // No additional action for now; user can continue manually.
    }
  };

  useEffect(() => {
    if (status !== 'correct' || !hasNext || !currentQuestion) {
      return;
    }
    const key = `${currentQuestion.id}:${currentIndex}`;
    if (autoNextKeyRef.current === key) {
      return;
    }
    autoNextKeyRef.current = key;
    const timeout = setTimeout(() => {
      goToNext();
    }, 1500);
    return () => clearTimeout(timeout);
  }, [status, hasNext, currentQuestion, currentIndex, goToNext]);

  useEffect(() => {
    const isSessionComplete = status === 'correct' && !hasNext;
    if (!isSessionComplete || autoReturnRef.current) {
      return;
    }
    autoReturnRef.current = true;
    const message = learningStage
      ? `Stage complete: ${learningStage.stage.title}. Returning home...`
      : 'Session complete. Returning home...';
    setCompletionMessage(message);

    if (pathId && stageId) {
      const completionKey = `${pathId}::${stageId}`;
      if (completionKeyRef.current !== completionKey) {
        completionKeyRef.current = completionKey;
        void markStageComplete(pathId, stageId);
      }
    }

    returnTimeoutRef.current = setTimeout(() => {
      router.push({
        pathname: '/',
        params: { progressUpdatedAt: Date.now().toString() },
      });
    }, 1800);

    return () => {
      if (returnTimeoutRef.current) {
        clearTimeout(returnTimeoutRef.current);
      }
    };
  }, [status, hasNext, learningStage, router, pathId, stageId, markStageComplete]);

  if (noQuestionsAvailable) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
        >
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Āe, e kare!</Text>
              <Text style={styles.emptyBody}>
                Kāore anō kia whakaritea he pātai mō tēnei taumata. Hoki ki te kāinga kia
                tīpako i tētahi atu uauatanga.
              </Text>
              <SecondaryButton label="Back to home" onPress={() => router.push('/')} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const headerCategory = activeCategory ?? currentQuestion.category;
  const headerDifficulty = activeDifficulty ?? currentQuestion.difficulty;
  const sessionLabel = learningStage
    ? `${learningStage.path.title} • ${learningStage.stage.title}`
    : 'Free Practice Session';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >

          <View style={styles.sectionSpacing}>
            {renderQuestionCard({
              question: questionForDisplay,
              status,
              selectedOptionId,
              responseValue,
              placeholder,
              onSelectOption: handleOptionSelect,
              onChangeResponse: setResponseValue,
              onSubmit: handleSubmit,
            })}
          </View>

          {errorMessage ? (
            <View style={styles.sectionSpacing}>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.sectionSpacing}>
            {!isSelectionQuestion ? (
              <PrimaryButton
                label={status === 'idle' ? 'Check answer' : 'Check again'}
                onPress={handleSubmit}
                disabled={status === 'correct'}
              />
            ) : null}
            {status !== 'correct' && hasNext ? (
              <SecondaryButton label="Skip question" onPress={goToNext} />
            ) : null}
          </View>
          

          <View style={styles.sectionSpacing}>
            {completionMessage ? (
              <FeedbackBanner tone="success" text={completionMessage} />
            ) : null}
            {status === 'correct' ? (
              <FeedbackBanner tone="success" text={'Tika! Ka rawe tō whakautu.\nCorrect! Great answer'} />
            ) : null}
            {status === 'incorrect' ? (
              <FeedbackBanner
                tone="error"
                text="Ehara i te mea tika. Whakamātau anō!"
              />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface RenderCardParams {
  question: Question | undefined;
  status: SubmissionResult;
  selectedOptionId?: string;
  responseValue: string;
  placeholder: string;
  onSelectOption: (optionId: string) => void;
  onChangeResponse: (value: string) => void;
  onSubmit: () => void;
}

const renderQuestionCard = ({
  question,
  status,
  selectedOptionId,
  responseValue,
  placeholder,
  onSelectOption,
  onChangeResponse,
  onSubmit,
}: RenderCardParams) => {
  if (!question) {
    return null;
  }

  if (isMultipleChoiceQuestion(question)) {
    return (
      <MultipleChoiceCard
        question={question}
        selectedOptionId={selectedOptionId}
        status={status}
        onSelectOption={onSelectOption}
        disabled={status === 'correct'}
      />
    );
  }

  if (isWordMatchQuestion(question)) {
    return (
      <WordMatchCard
        question={question}
        selectedOptionId={selectedOptionId}
        status={status}
        onSelectOption={onSelectOption}
        disabled={status === 'correct'}
      />
    );
  }

  if (isTranslationChoiceQuestion(question)) {
    return (
      <TranslationChoiceCard
        question={question}
        selectedOptionId={selectedOptionId}
        status={status}
        onSelectOption={onSelectOption}
        disabled={status === 'correct'}
      />
    );
  }

  if (isFreeResponseQuestion(question)) {
    return (
      <FreeResponseCard
        prompt={question.prompt}
        sentence={question.sentence}
        exemplar={question.exemplar}
        value={responseValue}
        placeholder={placeholder}
        status={status}
        onChangeText={onChangeResponse}
        onSubmit={onSubmit}
        disabled={status === 'correct'}
      />
    );
  }

  if (isAudioPromptQuestion(question)) {
    return (
      <View style={styles.audioBlock}>
        <View style={styles.audioPromptCard}>
          <AudioPromptCard question={question} status={status} />
        </View>
        <FreeResponseCard
          prompt="Tuhia tō whakamāoritanga"
          sentence={`“${question.transcript}”`}
          value={responseValue}
          placeholder={placeholder}
          status={status}
          onChangeText={onChangeResponse}
          onSubmit={onSubmit}
          disabled={status === 'correct'}
        />
      </View>
    );
  }

  return null;
};

interface FeedbackBannerProps {
  tone: 'success' | 'error';
  text: string;
}

const FeedbackBanner = ({ tone, text }: FeedbackBannerProps) => (
  <View
    style={[
      styles.feedbackBanner,
      tone === 'success' ? styles.feedbackSuccess : styles.feedbackError,
    ]}
  >
    <Text style={styles.feedbackText}>{text}</Text>
  </View>
);

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

const PrimaryButton = ({ label, onPress, disabled }: ButtonProps) => (
  <Pressable
    style={[
      styles.primaryButton,
      disabled && styles.primaryButtonDisabled,
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.primaryButtonText}>{label}</Text>
  </Pressable>
);

const SecondaryButton = ({ label, onPress, disabled }: ButtonProps) => (
  <Pressable
    style={[
      styles.secondaryButton,
      disabled && styles.secondaryButtonDisabled,
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.secondaryButtonText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 10,
    backgroundColor: colors.background,
  },
  sectionSpacing: {
    marginBottom: 5,
  },
  headerCard: {
    backgroundColor: '#f3f6ff',
    borderColor: '#cfd8ff',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    marginBottom: 2,
  },
  sessionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyPill: {
    backgroundColor: '#ede9fe',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6d28d9',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  categoryPill: {
    backgroundColor: '#fee2e2',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  scorePill: {
    backgroundColor: '#e0f2fe',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  coachCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#f5c2c2',
    backgroundColor: '#fff4f4',
    marginBottom: 4,
  },
  coachTitle: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  coachBody: {
    color: '#7a1b1b',
    fontSize: 14,
    lineHeight: 20,
  },
  audioBlock: {
    marginBottom: 12,
  },
  audioPromptCard: {
    marginBottom: 20,
  },
  errorMessage: {
    color: colors.accent,
    fontSize: 14,
  },
  feedbackBanner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  feedbackSuccess: {
    backgroundColor: '#dce1ff',
  },
  feedbackError: {
    backgroundColor: '#ffe5e5',
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyState: {
    padding: 32,
    backgroundColor: colors.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyBody: {
    fontSize: 16,
    color: colors.mutedText,
    lineHeight: 24,
  },
});
