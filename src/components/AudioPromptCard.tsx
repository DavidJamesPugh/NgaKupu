import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AudioPromptQuestion } from '../types/Question';
import type { SubmissionResult } from '../hooks/useQuestionSession';

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
    <Text style={styles.prompt}>{question.prompt}</Text>
    <Pressable
      style={[styles.audioButton, disabled && styles.audioButtonDisabled]}
      onPress={onRequestPlay}
      accessibilityRole="button"
      disabled={disabled}
    >
      <Ionicons name="play" size={28} color="#ffffff" />
    </Pressable>
    <Text style={styles.transcriptLabel}>Transcript</Text>
    <Text style={styles.transcript}>{question.transcript}</Text>
    <Text style={styles.placeholder}>{placeholderText}</Text>
    {status !== 'idle' ? (
      <Text style={styles.feedback} accessibilityLiveRegion="polite">
        Ka pai! Audio answers will be checked once playback is enabled.
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
    marginBottom: 16,
  },
  audioButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  audioButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  transcriptLabel: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transcript: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2933',
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 14,
    color: '#6b7280',
  },
  feedback: {
    marginTop: 12,
    fontSize: 14,
    color: '#475569',
  },
});

export const AudioPromptCard = memo(AudioPromptCardComponent);
