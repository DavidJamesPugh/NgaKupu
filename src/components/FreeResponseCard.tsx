import { memo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { SubmissionResult } from '../hooks/useQuestionSession';

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
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    minHeight: 90,
    fontSize: 18,
    lineHeight: 24,
    backgroundColor: '#f7fafc',
    color: '#111827',
  },
  inputCorrect: {
    borderColor: '#15803d',
    backgroundColor: '#dcfce7',
  },
  inputIncorrect: {
    borderColor: '#b91c1c',
    backgroundColor: '#fee2e2',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  exemplar: {
    marginTop: 12,
    fontSize: 16,
    color: '#475569',
  },
});

export const FreeResponseCard = memo(FreeResponseCardComponent);
