import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { SubmissionResult } from '../hooks/useQuestionSession';
import type { WordMatchQuestion } from '../types/Question';
import { colors } from '../theme/colors';

interface WordMatchCardProps {
  question: WordMatchQuestion;
  selectedOptionId?: string;
  status: SubmissionResult;
  onSelectOption: (optionId: string) => void;
  disabled?: boolean;
}

const WordMatchCardComponent = ({
  question,
  selectedOptionId,
  status,
  onSelectOption,
  disabled = false,
}: WordMatchCardProps) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        // noop
      }
      soundRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      unloadSound();
    };
  }, [unloadSound]);

  useEffect(() => {
    unloadSound();
    setIsPlayingAudio(false);
    setHasPlayed(false);
  }, [question.id, unloadSound]);

  const handlePlayAudio = useCallback(async () => {
    if (!question.audio || disabled) {
      return;
    }
    try {
      if (soundRef.current) {
        setIsPlayingAudio(true);
        setHasPlayed(true);
        await soundRef.current.replayAsync();
        return;
      }
      setIsLoadingAudio(true);
      const { sound } = await Audio.Sound.createAsync(question.audio, { shouldPlay: true });
      soundRef.current = sound;
      setIsPlayingAudio(true);
      setHasPlayed(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          return;
        }
        if ('isPlaying' in status && typeof status.isPlaying === 'boolean') {
          setIsPlayingAudio(status.isPlaying);
        }
        if ('didJustFinish' in status && status.didJustFinish) {
          setIsPlayingAudio(false);
        }
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to play audio prompt', error);
      setIsPlayingAudio(false);
    } finally {
      setIsLoadingAudio(false);
    }
  }, [question.audio, disabled]);

  return (
    <View style={styles.container}>
      <View style={styles.wordPanel}>
        {question.audio ? (
          <Pressable
            style={[
              styles.audioButton,
              (disabled || isLoadingAudio) && styles.audioButtonDisabled,
            ]}
            onPress={handlePlayAudio}
            accessibilityRole="button"
            disabled={disabled || isLoadingAudio}
          >
            {isLoadingAudio ? (
              <ActivityIndicator color={colors.background} />
            ) : isPlayingAudio ? (
              <Ionicons name="pause" size={28} color={colors.background} />
            ) : hasPlayed ? (
              <Ionicons name="refresh" size={26} color={colors.background} />
            ) : (
              <Ionicons name="play" size={28} color={colors.background} />
            )}
          </Pressable>
        ) : null}
        {question.image  ? (
          <Image source={question.image} style={styles.wordImage} resizeMode="cover" />
        ) : null}
        {question.sourceText && !question.audio ? (
          <>
            <Text style={styles.word}>{question.sourceText}</Text>
          </>
        ) : null}
      </View>

      <View style={styles.optionsWrapper}>
        {question.options.map((option) => {
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
            </Pressable>
          );
        })}
      </View>
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
    gap: 24,
  },
  prompt: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  wordPanel: {
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#e4e7ff',
    gap: 8,
  },
  audioButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  audioButtonDisabled: {
    backgroundColor: '#9aa2d9',
  },
  wordImage: {
    width: 96,
    height: 96,
    borderRadius: 16,
  },
  wordLabel: {
    fontSize: 14,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  word: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  optionsWrapper: {
    gap: 12,
  },
  option: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 16,
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  optionHelper: {
    fontSize: 13,
    color: colors.mutedText,
    marginTop: 4,
  },
});

export const WordMatchCard = memo(WordMatchCardComponent);
