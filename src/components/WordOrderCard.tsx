import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SubmissionResult } from '../hooks/useQuestionSession';
import type { WordOrderQuestion } from '../types/Question';
import { colors } from '../theme/colors';
import { shuffleArray } from '../utils/array';

interface WordOrderCardProps {
  question: WordOrderQuestion;
  status: SubmissionResult;
  selectedTileIds: string[];
  onSelectTile: (tileId: string) => void;
  onRemoveTileAt: (index: number) => void;
  onClear: () => void;
  disabled?: boolean;
}

const sourceLanguageLabel = (language: WordOrderQuestion['sourceLanguage']) =>
  language === 'english' ? 'English Prompt' : 'Te Reo Prompt';

export const WordOrderCard = ({
  question,
  status,
  selectedTileIds,
  onSelectTile,
  onRemoveTileAt,
  onClear,
  disabled = false,
}: WordOrderCardProps) => {
  const tileMap = new Map(question.tiles.map((tile) => [tile.id, tile.value]));
  const shuffledTiles = useMemo(() => shuffleArray(question.tiles), [question.id]);
  const expectedSlots = question.correctSequenceIds.map(
    (id) => tileMap.get(id)?.replace(/\s/g, '').length ?? 4,
  );
  const correctSentence = question.correctSequenceIds
    .map((id) => tileMap.get(id) ?? id)
    .join(' ');
  const sourceMatches =
    question.phraseMatches?.map((item) => ({ phrase: item.source, color: item.color })) ?? [];
  const targetMatches =
    question.phraseMatches?.map((item) => ({ phrase: item.target, color: item.color })) ?? [];

  const buildHighlightedSegments = (text: string, matches: { phrase: string; color: string }[]) => {
    if (matches.length === 0) {
      return [{ text }];
    }
    const ranges = matches
      .map(({ phrase, color }) => {
        const start = text.toLowerCase().indexOf(phrase.toLowerCase());
        if (start < 0) {
          return undefined;
        }
        return { start, end: start + phrase.length, color };
      })
      .filter((item): item is { start: number; end: number; color: string } => Boolean(item))
      .sort((a, b) => a.start - b.start);
    if (ranges.length === 0) {
      return [{ text }];
    }
    const segments: { text: string; color?: string }[] = [];
    let cursor = 0;
    ranges.forEach((range) => {
      if (range.start < cursor) {
        return;
      }
      if (range.start > cursor) {
        segments.push({ text: text.slice(cursor, range.start) });
      }
      segments.push({ text: text.slice(range.start, range.end), color: range.color });
      cursor = range.end;
    });
    if (cursor < text.length) {
      segments.push({ text: text.slice(cursor) });
    }
    return segments;
  };

  const HighlightedSentence = ({
    text,
    matches,
    textStyle,
  }: {
    text: string;
    matches: { phrase: string; color: string }[];
    textStyle: object;
  }) => {
    const segments = buildHighlightedSegments(text, matches);
    return (
      <Text style={textStyle}>
        {segments.map((segment, index) => (
          <Text
            key={`${segment.text}-${index}`}
            style={segment.color ? { textDecorationLine: 'underline', color: segment.color } : undefined}
          >
            {segment.text}
          </Text>
        ))}
      </Text>
    );
  };
  return (
    <View style={styles.container}>
      <View style={styles.promptPanel}>
        <Text style={styles.promptLabel}>{sourceLanguageLabel(question.sourceLanguage)}</Text>
        <Text style={styles.promptText}>{question.sourceText}</Text>
      </View>

      <View style={styles.slotHeader}>
        <Text style={styles.answerLabel}>Build the sentence</Text>
        <Pressable onPress={onClear} disabled={disabled || selectedTileIds.length === 0}>
          <Text
            style={[
              styles.clearText,
              (disabled || selectedTileIds.length === 0) && styles.clearTextDisabled,
            ]}
          >
            Clear
          </Text>
        </Pressable>
      </View>
      <View style={styles.answerTiles}>
        {expectedSlots.map((slotLength, index) => {
          const selectedId = selectedTileIds[index];
          const selectedValue = selectedId ? tileMap.get(selectedId) ?? '' : '';
          const underline = '_'.repeat(Math.max(slotLength + 2, 4));
          return (
            <Pressable
              key={`slot-${index}`}
              style={styles.slotItem}
              onPress={() => {
                if (selectedId) {
                  onRemoveTileAt(index);
                }
              }}
              disabled={!selectedId || disabled}
            >
              {selectedValue ? (
                <View style={styles.selectedTileBubble}>
                  <Text style={styles.selectedTileBubbleText}>{selectedValue}</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.slotWordPlaceholder}>{'\u00a0'}</Text>
                  <Text style={styles.slotUnderline}>{underline}</Text>
                </>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.tilesPanel}>
        {shuffledTiles.map((tile) => {
          const isUsed = selectedTileIds.includes(tile.id);
          return (
            <Pressable
              key={tile.id}
              style={[styles.tile, isUsed && styles.tileUsed, disabled && styles.tileDisabled]}
              onPress={() => onSelectTile(tile.id)}
              disabled={disabled || isUsed}
            >
              <Text style={[styles.tileText, isUsed && styles.tileTextUsed]}>{tile.value}</Text>
            </Pressable>
          );
        })}
      </View>

      {status === 'correct' && targetMatches.length > 0 ? (
        <View style={styles.matchPanel}>
          <Text style={styles.matchLabel}>Translation Match</Text>
          <HighlightedSentence text={question.sourceText} matches={sourceMatches} textStyle={styles.matchSource} />
          <HighlightedSentence text={correctSentence} matches={targetMatches} textStyle={styles.matchTarget} />
        </View>
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
    gap: 14,
  },
  promptPanel: {
    backgroundColor: '#e4e7ff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  promptLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  promptText: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 28,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  clearTextDisabled: {
    opacity: 0.4,
  },
  answerTiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    minHeight: 36,
  },
  slotItem: {
    minWidth: 56,
    alignItems: 'center',
  },
  selectedTileBubble: {
    borderRadius: 999,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectedTileBubbleText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 18,
  },
  slotWordPlaceholder: {
    minHeight: 18,
  },
  slotUnderline: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 12,
    marginTop: -5,
  },
  tilesPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  tileUsed: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  tileDisabled: {
    opacity: 0.7,
  },
  tileText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  tileTextUsed: {
    color: '#94a3b8',
  },
  matchPanel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cfd8ff',
    backgroundColor: '#f8faff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  matchLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  matchSource: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  matchTarget: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
});
