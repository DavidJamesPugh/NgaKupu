import { memo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import type { MultipleChoiceQuestion } from '../types/Question';
import type { SubmissionResult } from '../hooks/useQuestionSession';

interface MultipleChoiceCardProps {
  question: MultipleChoiceQuestion;
  selectedOptionId?: string;
  status: SubmissionResult;
  onSelectOption: (optionId: string) => void;
  disabled?: boolean;
}

const renderSentence = (sentence: string, answer?: string) => {
  if (!sentence.includes('___')) {
    return sentence;
  }
  return sentence.replace('___', answer ?? '___');
};

const MultipleChoiceCardComponent = ({
  question,
  selectedOptionId,
  status,
  onSelectOption,
  disabled = false,
}: MultipleChoiceCardProps) => {
  const handlePress = (optionId: string) => (event: GestureResponderEvent) => {
    event.preventDefault();
    if (disabled) {
      return;
    }
    onSelectOption(optionId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>{question.prompt}</Text>
      <Text style={styles.sentence}>
        {renderSentence(
          question.sentence,
          status === 'correct' ? getCorrectValue(question) : undefined,
        )}
      </Text>
      <View style={styles.optionsWrapper}>
        {question.options.map((option, index) => {
          const isSelected = option.id === selectedOptionId;
          const isCorrect = option.id === question.correctOptionId;
          const isLast = index === question.options.length - 1;

          const optionStatus =
            status === 'correct' && isCorrect
              ? 'correct'
              : status === 'incorrect' && isSelected
              ? 'incorrect'
              : 'idle';

          return (
            <Pressable
              key={option.id}
              style={[
                styles.option,
                !isLast && styles.optionWithSpacing,
                isSelected && styles.optionSelected,
                optionStatus === 'correct' && styles.optionCorrect,
                optionStatus === 'incorrect' && styles.optionIncorrect,
                disabled && styles.optionDisabled,
              ]}
              accessibilityRole="button"
              onPress={handlePress(option.id)}
            >
              <Text style={styles.optionValue}>{option.value}</Text>
              {option.helper ? (
                <Text style={styles.optionHelper}>{option.helper}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {status !== 'idle' && question.translation ? (
        <Text style={styles.translation} accessibilityLiveRegion="polite">
          {question.translation}
        </Text>
      ) : null}
    </View>
  );
};

const getCorrectValue = (question: MultipleChoiceQuestion) => {
  const match = question.options.find(
    (option) => option.id === question.correctOptionId,
  );
  return match?.value ?? '___';
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  prompt: {
    fontSize: 16,
    color: '#3a3a3a',
    fontWeight: '500',
    marginBottom: 8,
  },
  sentence: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1f2933',
    marginBottom: 16,
  },
  optionsWrapper: {
    marginBottom: 12,
  },
  option: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f7fafc',
  },
  optionWithSpacing: {
    marginBottom: 12,
  },
  optionSelected: {
    borderColor: '#2563eb',
  },
  optionCorrect: {
    borderColor: '#15803d',
    backgroundColor: '#dcfce7',
  },
  optionIncorrect: {
    borderColor: '#b91c1c',
    backgroundColor: '#fee2e2',
  },
  optionDisabled: {
    opacity: 0.6,
  },
  optionValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  optionHelper: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  translation: {
    fontSize: 16,
    color: '#475569',
    marginTop: 12,
  },
});

export const MultipleChoiceCard = memo(MultipleChoiceCardComponent);
