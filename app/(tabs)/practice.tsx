import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SAMPLE_QUESTIONS } from '../../src/data/sampleQuestions';
import {
  AudioPromptCard,
  FreeResponseCard,
  MultipleChoiceCard,
} from '../../src/components';
import {
  getSubmissionPlaceholder,
  useQuestionSession,
  type SubmissionResult,
} from '../../src/hooks/useQuestionSession';
import {
  isAudioPromptQuestion,
  isFreeResponseQuestion,
  isMultipleChoiceQuestion,
} from '../../src/types/Question';

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const contentTop = insets.top + 64;

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
  } = useQuestionSession(SAMPLE_QUESTIONS, { shuffle: false });

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

    if (isMultipleChoiceQuestion(currentQuestion)) {
      if (!selectedOptionId) {
        setErrorMessage('Please choose an option before submitting.');
        return;
      }
      const result = submitAnswer(selectedOptionId);
      handlePostSubmit(result);
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

  const handlePostSubmit = (result: SubmissionResult) => {
    setErrorMessage(undefined);
    if (result === 'correct') {
      // No additional action for now; user can continue manually.
    }
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: contentTop }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.sectionSpacing}>
            <View style={styles.header}>
              <Text style={styles.progressLabel}>
                Question {currentIndex + 1} of {totalQuestions}
              </Text>
              <View style={styles.scorePill}>
                <Text style={styles.scoreText}>Score: {score}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionSpacing}>
            {renderQuestionCard({
              currentQuestion,
              status,
              selectedOptionId,
              responseValue,
              placeholder,
              onSelectOption: setSelectedOptionId,
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

          <View style={styles.sectionSpacing}>
            <PrimaryButton
              label={status === 'idle' ? 'Check answer' : 'Check again'}
              onPress={handleSubmit}
              disabled={status === 'correct'}
            />
            {hasNext && status === 'correct' ? (
              <SecondaryButton label="Next question" onPress={goToNext} />
            ) : null}
            {!hasNext && status === 'correct' ? (
              <SecondaryButton label="Restart practice" onPress={restart} />
            ) : null}
            {status !== 'correct' && hasNext ? (
              <SecondaryButton label="Skip question" onPress={goToNext} />
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
    backgroundColor: '#f1f5f9',
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 24,
  },
  sectionSpacing: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
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
    color: '#0369a1',
  },
  audioBlock: {
    marginBottom: 12,
  },
  audioPromptCard: {
    marginBottom: 20,
  },
  errorMessage: {
    color: '#b91c1c',
    fontSize: 14,
  },
  feedbackBanner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  feedbackSuccess: {
    backgroundColor: '#dcfce7',
  },
  feedbackError: {
    backgroundColor: '#fee2e2',
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  primaryButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#1d4ed8',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d4ed8',
  },
});
