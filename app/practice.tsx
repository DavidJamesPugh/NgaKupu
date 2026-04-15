import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createQuestionSet, createQuestionSetAsync } from '../src/data/sampleQuestions';
import { buildTranslationChoiceOptions } from '../src/data/translationChoiceLessons';
import { applyStageFilters, findLearningStage } from '../src/data/learningPaths';
import {
  AudioPromptCard,
  FreeResponseCard,
  MultipleChoiceCard,
  TranslationChoiceCard,
  WordMatchCard,
  WordOrderCard,
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
  isWordOrderQuestion,
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
  const autoReturnRef = useRef(false);
  const autoWordOrderCheckRef = useRef<string | undefined>(undefined);

  const [questionPool, setQuestionPool] = useState<Question[]>(() => createQuestionSet());
  const learningStage = useMemo(() => {
    if (!pathId || !stageId) {
      return undefined;
    }
    return findLearningStage({ pathId, stageId });
  }, [pathId, stageId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await createQuestionSetAsync();
      if (!cancelled) {
        setQuestionPool(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
  const isWordOrderBuildQuestion =
    currentQuestion != null && isWordOrderQuestion(currentQuestion);

  const [selectedOptionId, setSelectedOptionId] = useState<string>();
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);
  const [responseValue, setResponseValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>();
  const [completionMessage, setCompletionMessage] = useState<string>();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    setSelectedOptionId(undefined);
    setSelectedTileIds([]);
    setResponseValue('');
    setErrorMessage(undefined);
    setCompletionMessage(undefined);
    autoReturnRef.current = false;
    autoWordOrderCheckRef.current = undefined;
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

  const handleWordTileSelect = (tileId: string) => {
    setSelectedTileIds((prev) => {
      if (prev.includes(tileId)) {
        return prev;
      }
      const next = [...prev, tileId];
      setResponseValue(next.join(' '));
      return next;
    });
    setErrorMessage(undefined);
  };

  const handleWordTileRemoveAt = (index: number) => {
    setSelectedTileIds((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      setResponseValue(next.join(' '));
      return next;
    });
  };

  const handleWordTileClear = () => {
    setSelectedTileIds([]);
    setResponseValue('');
  };

  useEffect(() => {
    if (!currentQuestion || !isWordOrderQuestion(currentQuestion)) {
      return;
    }
    if (selectedTileIds.length !== currentQuestion.correctSequenceIds.length) {
      return;
    }
    const signature = `${currentQuestion.id}:${selectedTileIds.join('|')}`;
    if (autoWordOrderCheckRef.current === signature) {
      return;
    }
    autoWordOrderCheckRef.current = signature;
    const result = submitAnswer(selectedTileIds.join(' '));
    handlePostSubmit(result);
  }, [currentQuestion, selectedTileIds, submitAnswer]);

  const handlePostSubmit = (result: SubmissionResult) => {
    setErrorMessage(undefined);
    if (result === 'correct') {
      // No additional action for now; user can continue manually.
    }
  };

  useEffect(() => {
    const isSessionComplete = status === 'correct' && !hasNext;
    if (!isSessionComplete || autoReturnRef.current) {
      return;
    }
    autoReturnRef.current = true;
    const message = learningStage
      ? `Lesson complete: ${learningStage.stage.title}. `
      : 'Session complete. ';
    setCompletionMessage(message);

    if (pathId && stageId) {
      const completionKey = `${pathId}::${stageId}`;
      if (completionKeyRef.current !== completionKey) {
        completionKeyRef.current = completionKey;
        void markStageComplete(pathId, stageId);
      }
    }
  }, [status, hasNext, learningStage, router, pathId, stageId, markStageComplete]);

  if (noQuestionsAvailable) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
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
  const completedCount = status === 'correct' ? currentIndex + 1 : currentIndex;
  const progressRatio = totalQuestions > 0 ? completedCount / totalQuestions : 0;
  const progressPercent = Math.max(0, Math.min(100, Math.round(progressRatio * 100)));
  const guideItems =
    (questionForDisplay?.lessonGuide && questionForDisplay.lessonGuide.length > 0
      ? questionForDisplay.lessonGuide
      : undefined) ?? [coachHint ?? 'Read carefully and focus on key sentence parts.'];

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerCard}>
            <View style={styles.header}>
              <Text style={styles.progressLabel}>{sessionLabel}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
      <Pressable style={styles.guideButton} onPress={() => setIsGuideOpen(true)}>
        <Text style={styles.guideButtonText}>Lesson guide</Text>
      </Pressable>
          </View>

          <View style={styles.sectionSpacing}>
            {renderQuestionCard({
              question: questionForDisplay,
              status,
              selectedOptionId,
              responseValue,
              placeholder,
              onSelectOption: handleOptionSelect,
              selectedTileIds,
              onSelectWordTile: handleWordTileSelect,
              onRemoveWordTileAt: handleWordTileRemoveAt,
              onClearWordTiles: handleWordTileClear,
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
            {!isSelectionQuestion && !isWordOrderBuildQuestion ? (
              <PrimaryButton
                label={status === 'idle' ? 'Check answer' : 'Check again'}
                onPress={handleSubmit}
                disabled={status === 'correct'}
              />
            ) : null}
            {hasNext && status === 'correct' ? (
              <SecondaryButton label="Next question" onPress={goToNext} />
            ) : null}
            {!hasNext && status === 'correct' ? (
              <SecondaryButton
                label="Finish Lesson"
                onPress={() =>
                  router.push({
                    pathname: '/',
                    params: { progressUpdatedAt: Date.now().toString() },
                  })
                }
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
      <Modal
        visible={isGuideOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsGuideOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Lesson Guide</Text>
            {guideItems.map((item, index) => (
              <Text key={`${item}-${index}`} style={styles.modalBody}>
                {`\u2022 ${item}`}
              </Text>
            ))}
            <Pressable style={styles.modalCloseButton} onPress={() => setIsGuideOpen(false)}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

interface RenderCardParams {
  question: Question | undefined;
  status: SubmissionResult;
  selectedOptionId?: string;
  selectedTileIds: string[];
  responseValue: string;
  placeholder: string;
  onSelectOption: (optionId: string) => void;
  onSelectWordTile: (tileId: string) => void;
  onRemoveWordTileAt: (index: number) => void;
  onClearWordTiles: () => void;
  onChangeResponse: (value: string) => void;
  onSubmit: () => void;
}

const renderQuestionCard = ({
  question,
  status,
  selectedOptionId,
  selectedTileIds,
  responseValue,
  placeholder,
  onSelectOption,
  onSelectWordTile,
  onRemoveWordTileAt,
  onClearWordTiles,
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

  if (isWordOrderQuestion(question)) {
    return (
      <WordOrderCard
        question={question}
        status={status}
        selectedTileIds={selectedTileIds}
        onSelectTile={onSelectWordTile}
        onRemoveTileAt={onRemoveWordTileAt}
        onClear={onClearWordTiles}
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
    paddingTop: 0,
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
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#4f46e5',
  },
  progressHint: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  guideButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  guideButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#6366f1',
    padding: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  modalBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  modalCloseButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  modalCloseButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 14,
  },
});
