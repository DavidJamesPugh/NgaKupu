import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AudioPromptQuestion } from '../types/Question';
import type { SubmissionResult } from '../hooks/useQuestionSession';
import { colors } from '../theme/colors';

interface AudioPromptCardProps {
  question: AudioPromptQuestion;
  status: SubmissionResult;
  /**
   * Callback fired when the learner attempts playback.
   * Currently disabled until audio support is added.
   */
  onRequestPlay?: () => void;
  placeholderText?: string;
  disabled?: boolean;
}

const AudioPromptCardComponent = ({
  question,
  status,
  onRequestPlay,
  placeholderText = 'Audio playback coming soon',
  disabled = true,
}: AudioPromptCardProps) => (
  <View style={styles.container}>
    <Pressable
      style={[styles.audioButton, disabled && styles.audioButtonDisabled]}
      onPress={onRequestPlay}
      accessibilityRole="button"
      disabled={disabled}
    >
      <Ionicons name="play" size={28} color={colors.background} />
    </Pressable>
    {status !== 'idle' ? (
      <Text style={styles.feedback} accessibilityLiveRegion="polite">
        Ka pai! Audio answers will be checked once playback is enabled.
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
    gap: 16,
  },
  prompt: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  audioButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  audioButtonDisabled: {
    backgroundColor: '#9095c3',
  },
  transcriptLabel: {
    fontSize: 14,
    color: colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transcript: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 14,
    color: colors.mutedText,
  },
  feedback: {
    marginTop: 12,
    fontSize: 14,
    color: colors.mutedText,
  },
});

export const AudioPromptCard = memo(AudioPromptCardComponent);
