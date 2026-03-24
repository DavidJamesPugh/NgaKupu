import { memo, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import type { MultipleChoiceQuestion } from '../types/Question';
import type { SubmissionResult } from '../hooks/useQuestionSession';
import { colors } from '../theme/colors';
import { shuffleArray } from '../utils/array';

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
  const options = useMemo(
    () => shuffleArray(question.options),
    [question.id],
  );

  const handlePress = (optionId: string) => (event: GestureResponderEvent) => {
    event.preventDefault();
    if (disabled) {
      return;
    }
    onSelectOption(optionId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sentence}>
        {renderSentence(
          question.sentence,
          status === 'correct' ? getCorrectValue(question) : undefined,
        )}
      </Text>
      <View style={styles.optionsWrapper}>
        {options.map((option, index) => {
          const isLast = index === options.length - 1;
          const isSelected = option.id === selectedOptionId;
          const isCorrect = option.id === question.correctOptionId;

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
    backgroundColor: colors.background,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 16,
  },
  prompt: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sentence: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.primary,
  },
  optionsWrapper: {
    marginBottom: 12,
  },
  option: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
  },
  optionWithSpacing: {
    marginBottom: 12,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#e4e7ff',
  },
  optionCorrect: {
    borderColor: colors.primary,
    backgroundColor: '#dce1ff',
  },
  optionIncorrect: {
    borderColor: '#8b1a1a',
    backgroundColor: '#ffe5e5',
  },
  optionDisabled: {
    opacity: 0.6,
  },
  optionValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  optionHelper: {
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 4,
  },
  translation: {
    fontSize: 16,
    color: colors.mutedText,
    marginTop: 12,
  },
});

export const MultipleChoiceCard = memo(MultipleChoiceCardComponent);
