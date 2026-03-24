import { memo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { SubmissionResult } from '../hooks/useQuestionSession';
import { colors } from '../theme/colors';

interface FreeResponseCardProps {
  prompt: string;
  sentence: string;
  exemplar?: string;
  value: string;
  status: SubmissionResult;
  placeholder?: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

const FreeResponseCardComponent = ({
  prompt,
  sentence,
  exemplar,
  value,
  status,
  placeholder = 'Type your answer',
  onChangeText,
  onSubmit,
  disabled = false,
}: FreeResponseCardProps) => (
  <View style={styles.container}>
    <Text style={styles.prompt}>{prompt}</Text>
    <Text style={styles.sentence}>{sentence}</Text>
    <TextInput
      style={[
        styles.input,
        status === 'correct' && styles.inputCorrect,
        status === 'incorrect' && styles.inputIncorrect,
        disabled && styles.inputDisabled,
      ]}
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmit}
      editable={!disabled}
      multiline
      accessibilityLabel="Free response answer"
    />
    {status !== 'idle' && exemplar ? (
      <Text style={styles.exemplar} accessibilityLiveRegion="polite">
        Suggested answer: {exemplar}
      </Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 12,
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
    marginBottom: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 18,
    minHeight: 110,
    fontSize: 18,
    lineHeight: 26,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  inputCorrect: {
    borderColor: colors.primary,
    backgroundColor: '#dce1ff',
  },
  inputIncorrect: {
    borderColor: '#8b1a1a',
    backgroundColor: '#ffe5e5',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  exemplar: {
    marginTop: 12,
    fontSize: 16,
    color: colors.mutedText,
  },
});

export const FreeResponseCard = memo(FreeResponseCardComponent);
