import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const contentTop = insets.top + 64;

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: contentTop }]}>
      <Text style={styles.heading}>Ngā Kupu</Text>
      <Text style={styles.paragraph}>
        Ngā Kupu is a learning companion for practising Te Reo Māori sentences
        through short, focused exercises. As the project grows we will add
        richer pathways, audio prompts, and spaced repetition to support everyday
        reo Māori use.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Whāinga | Mission</Text>
        <Text style={styles.paragraph}>
          Empower learners with quick practice sessions that combine kupu,
          sentence patterns, and listening comprehension. Designed for mobile
          learning on-the-go.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#f7fafc',
  },
  heading: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: '#1f2933',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
});
