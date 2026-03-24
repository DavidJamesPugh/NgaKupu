import { useEffect, useMemo, useState } from 'react';
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
import {
  AudioPromptCard,
  FreeResponseCard,
  MultipleChoiceCard,
  WordMatchCard,
} from '../src/components';
import {
  getSubmissionPlaceholder,
  useQuestionSession,
  type SubmissionResult,
} from '../src/hooks/useQuestionSession';
import {
  isAudioPromptQuestion,
  isFreeResponseQuestion,
  isMultipleChoiceQuestion,
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
  const { difficulty, category } =
    useLocalSearchParams<{ difficulty?: string; category?: string }>();
  const activeDifficulty = typeof difficulty === 'string' ? difficulty : undefined;
  const activeCategory = typeof category === 'string' ? category : undefined;

  const questionPool = useMemo<Question[]>(() => createQuestionSet(), []);

  const filteredQuestions = useMemo(() => {
    let working = questionPool;
    if (activeDifficulty) {
      working = working.filter((question) => question.difficulty === activeDifficulty);
    }
    if (activeCategory) {
      working = working.filter((question) => question.category === activeCategory);
    }
    return working;
  }, [questionPool, activeDifficulty, activeCategory]);

  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    status,
    submitAnswer,
    goToNext,
    restart,
    hasNext,
    score,
  } = useQuestionSession(filteredQuestions, { shuffle: false });

  const noQuestionsAvailable = filteredQuestions.length === 0;
  const isSelectionQuestion =
    currentQuestion != null &&
    (isMultipleChoiceQuestion(currentQuestion) || isWordMatchQuestion(currentQuestion));

  const [selectedOptionId, setSelectedOptionId] = useState<string>();
  const [responseValue, setResponseValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    setSelectedOptionId(undefined);
    setResponseValue('');
    setErrorMessage(undefined);
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
              currentQuestion,
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
            {hasNext && status === 'correct' ? (
              <SecondaryButton label="Next question" onPress={goToNext} />
            ) : null}
            {!hasNext && status === 'correct' ? (
              <SecondaryButton label="Restart practice" onPress={restart} />
            ) : null}
            {status !== 'correct' && hasNext ? (
              <SecondaryButton label="Skip question" onPress={goToNext} />
            ) : null}
            <SecondaryButton label="Back to home" onPress={() => router.push('/')} />
          </View>
          

          <View style={styles.sectionSpacing}>
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
  currentQuestion: ReturnType<typeof useQuestionSession>['currentQuestion'];
  status: SubmissionResult;
  selectedOptionId?: string;
  responseValue: string;
  placeholder: string;
  onSelectOption: (optionId: string) => void;
  onChangeResponse: (value: string) => void;
  onSubmit: () => void;
}

const renderQuestionCard = ({
  currentQuestion,
  status,
  selectedOptionId,
  responseValue,
  placeholder,
  onSelectOption,
  onChangeResponse,
  onSubmit,
}: RenderCardParams) => {
  if (!currentQuestion) {
    return null;
  }

  if (isMultipleChoiceQuestion(currentQuestion)) {
    return (
      <MultipleChoiceCard
        question={currentQuestion}
        selectedOptionId={selectedOptionId}
        status={status}
        onSelectOption={onSelectOption}
        disabled={status === 'correct'}
      />
    );
  }

  if (isWordMatchQuestion(currentQuestion)) {
    return (
      <WordMatchCard
        question={currentQuestion}
        selectedOptionId={selectedOptionId}
        status={status}
        onSelectOption={onSelectOption}
        disabled={status === 'correct'}
      />
    );
  }

  if (isFreeResponseQuestion(currentQuestion)) {
    return (
      <FreeResponseCard
        prompt={currentQuestion.prompt}
        sentence={currentQuestion.sentence}
        exemplar={currentQuestion.exemplar}
        value={responseValue}
        placeholder={placeholder}
        status={status}
        onChangeText={onChangeResponse}
        onSubmit={onSubmit}
        disabled={status === 'correct'}
      />
    );
  }

  if (isAudioPromptQuestion(currentQuestion)) {
    return (
      <View style={styles.audioBlock}>
        <View style={styles.audioPromptCard}>
          <AudioPromptCard question={currentQuestion} status={status} />
        </View>
        <FreeResponseCard
          prompt="Tuhia tō whakamāoritanga"
          sentence={`“${currentQuestion.transcript}”`}
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
    paddingBottom: 0,
    gap: 6,
    backgroundColor: colors.background,
  },
  sectionSpacing: {
    marginBottom: 5,
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
