import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createQuestionSet, createQuestionSetAsync } from '../src/data/sampleQuestions';
import { LEARNING_PATHS, getStageQuestionCount } from '../src/data/learningPaths';
import { useLearningProgress } from '../src/hooks/useLearningProgress';
import type { Question } from '../src/types/Question';
import { colors } from '../src/theme/colors';

const difficultyDescriptions: Record<string, string> = {
  tamariki: 'Friendly introductions for tamariki with simple kupu pairs.',
  tauira: 'Extend your reo with everyday sentences and translations.',
  tohunga: 'Challenge yourself with advanced rerenga kōrero (coming soon).',
};

const titleMap: Record<string, string> = {
  tamariki: 'Tamariki',
  tauira: 'Tauira',
  tohunga: 'Tohunga',
};

const getDifficultyTitle = (key: Difficulty) =>
  titleMap[key as keyof typeof titleMap] ?? key;

const getDifficultyDescription = (key: Difficulty) =>
  difficultyDescriptions[key as keyof typeof difficultyDescriptions] ??
  'Practise the kupu and rerenga kōrero for this level.';

type Difficulty = NonNullable<Question['difficulty']>;
const difficultyOrder: Difficulty[] = ['tamariki', 'tauira', 'tohunga'];

type Category = Question['category'];
const categoryOrder: Category[] = [
  'written-vocabulary',
  'listening-vocabulary',
  'written-comprehension',
  'listening-comprehension',
];

const categoryLabels: Record<Category, string> = {
  'written-vocabulary': 'Written Vocabulary',
  'listening-vocabulary': 'Listening Vocabulary',
  'written-comprehension': 'Written Comprehension',
  'listening-comprehension': 'Listening Comprehension',
};

const categoryDescriptions: Record<Category, string> = {
  'written-vocabulary': 'Quick word recall with text prompts.',
  'listening-vocabulary': 'Hear kupu Māori and match the meaning.',
  'written-comprehension': 'Translate full sentences to reinforce structure.',
  'listening-comprehension': 'Understand spoken phrases and select the response.',
};

const Index = () => {
  const { progressUpdatedAt } = useLocalSearchParams<{ progressUpdatedAt?: string }>();
  const [questionSet, setQuestionSet] = useState<Question[]>(() => createQuestionSet());
  const [activeJourneyGuide, setActiveJourneyGuide] = useState<{
    pathTitle: string;
    stageTitle: string;
    lines: string[];
  } | null>(null);
  const { isLoaded, refreshProgress, clearProgress, getPathProgress, isStageComplete } =
    useLearningProgress();

  useEffect(() => {
    refreshProgress();
  }, [progressUpdatedAt, refreshProgress]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await createQuestionSetAsync();
      if (!cancelled) {
        setQuestionSet(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableDifficulties = useMemo<Difficulty[]>(() => {
    const present = new Set<Difficulty>();
    questionSet.forEach((question) => {
      if (question.difficulty) {
        present.add(question.difficulty);
      }
    });

    const ordered = difficultyOrder.filter((item) => present.has(item));
    const extras = Array.from(present).filter(
      (item) => !difficultyOrder.includes(item),
    );

    return [...ordered, ...extras];
  }, [questionSet]);

  const availableCategories = useMemo<Category[]>(() => {
    const present = new Set<Category>();
    questionSet.forEach((question) => {
      present.add(question.category);
    });

    const ordered = categoryOrder.filter((item) => present.has(item));
    const extras = Array.from(present).filter(
      (item) => !categoryOrder.includes(item),
    );

    return [...ordered, ...extras];
  }, [questionSet]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Learn Te Reo Step by Step</Text>
          <Text style={styles.heroBody}>
            Follow guided stages with clear goals, short sessions, and gradual difficulty ramps.
          </Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Journeys</Text>
          <Pressable
            style={styles.resetButton}
            onPress={() => {
              void clearProgress();
            }}
          >
            <Text style={styles.resetButtonText}>Reset progress</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
        >
          {LEARNING_PATHS.map((path) => {
            const progress = getPathProgress(path);
            return (
              <View key={path.id} style={styles.carouselCard}>
                <View style={styles.pathHeaderRow}>
                  <View style={styles.pathHeaderTextWrap}>
                    <Text style={styles.pathTitle}>{path.title}</Text>
                  </View>
                  <View
                    style={{
                      ...styles.pathStatusPill,
                      ...(progress.isComplete ? styles.pathStatusDone : styles.pathStatusActive),
                    }}
                  >
                    <Text style={styles.pathStatusText}>
                      {progress.isComplete ? 'Complete' : `${progress.completeStages}/${progress.totalStages}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.stageList}>
                  {path.stages.map((stage, index) => {
                    const isInfoStage = stage.isInfoStage === true;
                    const done = isInfoStage ? false : isStageComplete(path.id, stage.id);
                    const stageCount = getStageQuestionCount(questionSet, stage);
                    return (
                      <View key={stage.id} style={styles.stageRow}>
                        <View style={styles.stageTopRow}>
                          <View
                            style={{
                              ...styles.stageBadge,
                              ...(done ? styles.stageBadgeDone : {}),
                            }}
                          >
                            <Text style={styles.stageBadgeText}>{done ? '✓' : index }</Text>
                          </View>
                          <View style={styles.stageTextWrap}>
                            <Text style={styles.stageTitle}>{stage.title}</Text>
                            
                          </View>
                        </View>
                        {isInfoStage ? (
                          <Pressable
                            style={styles.stageInfoButton}
                            onPress={() =>
                              setActiveJourneyGuide({
                                pathTitle: path.title,
                                stageTitle: stage.title,
                                lines:
                                  stage.journeyGuide && stage.journeyGuide.length > 0
                                    ? stage.journeyGuide
                                    : ['This journey introduction will be added soon.'],
                              })
                            }
                          >
                            <Text style={styles.stageInfoButtonText}>About Journey</Text>
                          </Pressable>
                        ) : (
                          <Link
                            href={{
                              pathname: '/practice',
                              params: {
                                path: path.id,
                                stage: stage.id,
                                guide: 'true',
                              },
                            }}
                            asChild
                          >
                            <Pressable
                              style={{
                                ...styles.stageButton,
                                ...(done ? styles.stageButtonDone : {}),
                              }}
                            >
                              <Text style={styles.stageButtonText}>{done ? 'Review' : 'Start'}</Text>
                            </Pressable>
                          </Link>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
        {!isLoaded ? <Text style={styles.progressLoading}>Loading journey progress…</Text> : null}
        <Modal
          visible={Boolean(activeJourneyGuide)}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveJourneyGuide(null)}
        >
          <View style={styles.guideOverlay}>
            <View style={styles.guideCard}>
              <Text style={styles.guideTitle}>
                {activeJourneyGuide?.pathTitle}: {activeJourneyGuide?.stageTitle}
              </Text>
              <View style={styles.guideList}>
                {activeJourneyGuide?.lines.map((line, idx) => (
                  <Text key={`${line}-${idx}`} style={styles.guideItem}>
                    {idx + 1}. {line}
                  </Text>
                ))}
              </View>
              <Pressable style={styles.guideCloseButton} onPress={() => setActiveJourneyGuide(null)}>
                <Text style={styles.guideCloseText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* <View style={styles.cardGrid}>
          <Link href="/practice" asChild>
            <Pressable style={styles.cardAll}>
              <Text style={styles.cardTitleAlt}>Free Practice</Text>
              <Text style={styles.cardBodyAlt}>
                Mix all questions and train freely across all levels and categories.
              </Text>
            </Pressable>
          </Link>
        </View>

        <Text style={styles.sectionTitle}>Difficulties</Text>
        <View style={styles.cardGrid}>
          {availableDifficulties.map((difficulty) => (
            <Link
              key={difficulty}
              href={{
                pathname: '/practice',
                params: { difficulty },
              }}
              asChild
            >
              <Pressable style={styles.card}>
                <Text style={styles.cardTitle}>{getDifficultyTitle(difficulty)}</Text>
                <Text style={styles.cardBody}>{getDifficultyDescription(difficulty)}</Text>
              </Pressable>
            </Link>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.cardGrid}>
          {availableCategories.map((category) => (
            <Link
              key={category}
              href={{
                pathname: '/practice',
                params: { category },
              }}
              asChild
            >
              <Pressable style={styles.card}>
                <Text style={styles.cardTitle}>{categoryLabels[category]}</Text>
                <Text style={styles.cardBody}>{categoryDescriptions[category]}</Text>
              </Pressable>
            </Link>
          ))}
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
    backgroundColor: colors.background,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.background,
  },
  heroBody: {
    fontSize: 16,
    color: '#dbeafe',
    lineHeight: 24,
  },
  pathCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 18,
    gap: 10,
  },
  carouselContent: {
    paddingRight: 8,
    gap: 12,
  },
  carouselCard: {
    width: 336,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 18,
    gap: 10,
  },
  pathHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pathHeaderTextWrap: {
    flex: 1,
  },
  pathStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pathStatusDone: {
    backgroundColor: '#dcfce7',
  },
  pathStatusActive: {
    backgroundColor: '#e0e7ff',
  },
  pathStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  pathTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  pathDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.mutedText,
  },
  stageList: {
    gap: 10,
    marginTop: 4,
  },
  stageRow: {
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: '#d6dcff',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#f8f9ff',
    gap: 10,
  },
  stageTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stageBadge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageBadgeText: {
    color: colors.background,
    fontWeight: '700',
  },
  stageBadgeDone: {
    backgroundColor: '#16a34a',
  },
  stageTextWrap: {
    flex: 1,
    gap: 2,
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  stageMeta: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  stageDescription: {
    fontSize: 13,
    color: colors.mutedText,
    lineHeight: 19,
  },
  stageButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'stretch',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stageButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 13,
  },
  stageButtonDone: {
    backgroundColor: '#15803d',
  },
  stageInfoButton: {
    borderRadius: 10,
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'stretch',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stageInfoButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  progressLoading: {
    marginTop: -4,
    marginBottom: 8,
    fontSize: 13,
    color: colors.mutedText,
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#c7d2fe',
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resetButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  subheading: {
    fontSize: 18,
    color: colors.mutedText,
    lineHeight: 26,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  guideCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#d6dcff',
    padding: 18,
    gap: 12,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  guideList: {
    gap: 8,
  },
  guideItem: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  guideCloseButton: {
    alignSelf: 'flex-end',
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  guideCloseText: {
    color: colors.background,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    width: '46%',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  cardAll: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    width: '100%',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.primary,
  },
  cardBody: {
    fontSize: 16,
    color: colors.mutedText,
    lineHeight: 24,
  },
  cardTitleAlt: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.background,
  },
  cardBodyAlt: {
    fontSize: 16,
    color: '#eef2ff',
    lineHeight: 24,
  },
  cardAction: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  cardActionAlt: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
});
