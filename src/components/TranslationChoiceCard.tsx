import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SubmissionResult } from '../hooks/useQuestionSession';
import type { TranslationChoiceQuestion } from '../types/Question';
import { colors } from '../theme/colors';

interface TranslationChoiceCardProps {
  question: TranslationChoiceQuestion;
  selectedOptionId?: string;
  status: SubmissionResult;
  onSelectOption: (optionId: string) => void;
  disabled?: boolean;
}

const sourceLanguageLabel = (language: TranslationChoiceQuestion['sourceLanguage']) =>
  language === 'maori' ? 'Te reo Māori' : 'English';

const TranslationChoiceCardComponent = ({
  question,
  selectedOptionId,
  status,
  onSelectOption,
  disabled = false,
}: TranslationChoiceCardProps) => {
  const { options } = question;

  return (
    <View style={styles.container}>
      <View style={styles.sentencePanel}>
        <Text style={styles.sourceLabel}>{sourceLanguageLabel(question.sourceLanguage)}</Text>
        <Text style={styles.sourceText}>{question.sourceText}</Text>
      </View>
      <View style={styles.optionsWrapper}>
        {options.map((option) => {
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
                isSelected && styles.optionSelected,
                optionStatus === 'correct' && styles.optionCorrect,
                optionStatus === 'incorrect' && styles.optionIncorrect,
                disabled && styles.optionDisabled,
              ]}
              onPress={() => {
                if (!disabled) {
                  onSelectOption(option.id);
                }
              }}
              accessibilityRole="button"
            >
              <Text style={styles.optionValue}>{option.value}</Text>
              {option.helper ? (
                <Text style={styles.optionHelper}>{option.helper}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {status !== 'idle' && question.translationNote ? (
        <Text style={styles.translationNote} accessibilityLiveRegion="polite">
          {question.translationNote}
        </Text>
      ) : null}
    </View>
  );
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
    fontSize: 15,
    color: colors.accent,
    fontWeight: '600',
    lineHeight: 22,
  },
  sentencePanel: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#e4e7ff',
    gap: 8,
  },
  sourceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sourceText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 28,
  },
  optionsWrapper: {
    gap: 12,
  },
  option: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
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
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 24,
  },
  optionHelper: {
    fontSize: 13,
    color: colors.mutedText,
    marginTop: 4,
  },
  translationNote: {
    fontSize: 15,
    color: colors.mutedText,
    lineHeight: 22,
    marginTop: 4,
  },
});

export const TranslationChoiceCard = TranslationChoiceCardComponent;
