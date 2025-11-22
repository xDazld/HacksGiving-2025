import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import {
  fetchPlantsCsvText,
  findPlant,
  generatePlantStory,
  parsePlantsCsv,
  PlantRecord,
} from '@/utils/plantData';

type PlantStoryProps = {
  commonName?: string;
  scientificName?: string;
  autoSpeak?: boolean;
  onStoryReady?: (story: string) => void;
};

function speakIfAvailable(text: string) {
  // Web Speech API (web only)
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  }
  return false;
}

export function PlantStory(props: PlantStoryProps) {
  const { commonName, scientificName, autoSpeak, onStoryReady } = props;
  const [records, setRecords] = useState<PlantRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<string>('');
  const [query, setQuery] = useState<string>(commonName || scientificName || '');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const txt = await fetchPlantsCsvText();
      if (cancelled) return;
      if (!txt) {
        setError(
          'Could not load Plants_Formatted.csv on web. Ensure it is served from project root.'
        );
        setRecords([]);
        return;
      }
      try {
        const parsed = parsePlantsCsv(txt);
        if (!cancelled) setRecords(parsed);
      } catch (e) {
        if (!cancelled) {
          setError('Failed to parse CSV data.');
          setRecords([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(() => {
    if (!records) return undefined;
    return findPlant(records, { commonName, scientificName });
  }, [records, commonName, scientificName]);

  useEffect(() => {
    if (!selected) return;
    const s = generatePlantStory(selected);
    setStory(s);
    onStoryReady?.(s);
    if (autoSpeak) {
      const usedSpeech = speakIfAvailable(s);
      if (!usedSpeech) {
        // Fallback: log to console if no speech available (native or unsupported web)
        // eslint-disable-next-line no-console
        console.log(s);
      }
    }
  }, [selected, autoSpeak, onStoryReady]);

  const onTell = useCallback(() => {
    if (!records) return;
    const found = findPlant(records, { commonName: query, scientificName: query });
    if (!found) {
      const msg = `No plant found matching "${query}". Try a different name.`;
      setStory(msg);
      // eslint-disable-next-line no-console
      console.log(msg);
      return;
    }
    const s = generatePlantStory(found);
    setStory(s);
    const usedSpeech = speakIfAvailable(s);
    if (!usedSpeech) {
      // eslint-disable-next-line no-console
      console.log(s);
    }
  }, [records, query]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
        Plant Story
      </ThemedText>
      <ThemedText type="default">
        Type a plant common or scientific name and tap Tell Story.
      </ThemedText>
      <View style={styles.row}>
        <TextInput
          placeholder="e.g., Silver Vase Plant or Aechmea fasciata"
          value={query}
          onChangeText={setQuery}
          style={styles.input}
          placeholderTextColor="#888"
        />
        <Pressable onPress={onTell} style={styles.button}>
          <ThemedText type="defaultSemiBold" style={styles.buttonText}>
            Tell Story
          </ThemedText>
        </Pressable>
      </View>
      {error ? (
        <ThemedText type="default" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
      {story ? (
        <ThemedText type="default" style={styles.story}>
          {story}
        </ThemedText>
      ) : null}
      {Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window ? (
        <ThemedText type="default" style={styles.caption}>
          Audio is available in this browser via Web Speech API.
        </ThemedText>
      ) : (
        <ThemedText type="default" style={styles.caption}>
          Audio not available; story will be printed to the console.
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
  },
  button: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
  },
  story: {
    marginTop: 8,
  },
  caption: {
    opacity: 0.8,
  },
  error: {
    color: '#ff6b6b',
  },
});

export default PlantStory;


