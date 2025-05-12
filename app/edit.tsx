// EditMemoryScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// Design tokens from previous improvements
const COLORS = {
  primary: "#007AFF",
  danger: "#dc3545",
  success: "#34C759",
  background: "#F0F0F0",
  text: "#333",
  muted: "#757575",
  border: "#E0E0E0",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const BORDERS = {
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 20,
  widthSm: 1,
};

const SHADOWS = {
  light: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
};

const EditMemoryScreen = () => {
  const { memory: memoryString } = useLocalSearchParams();
  const router = useRouter();
  const [memory, setMemory] = useState(memoryString ? JSON.parse(memoryString) : {});

  const handleSave = async () => {
    if (!memory.note?.trim()) {
      Alert.alert("Missing Note", "Please add a note before saving.");
      return;
    }

    try {
      const stored = await AsyncStorage.getItem('memories');
      const memories = stored ? JSON.parse(stored) : [];

      const index = memories.findIndex(m =>
        new Date(m.date).getTime() === new Date(memory.date).getTime() &&
        JSON.stringify(m.coordinate) === JSON.stringify(memory.coordinate)
      );

      if (index > -1) {
        memories[index] = memory;
        await AsyncStorage.setItem('memories', JSON.stringify(memories));
        router.back();
        Alert.alert('Success', 'Memory updated successfully');
      } else {
        Alert.alert('Error', 'Memory not found for update');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes');
      console.error('Edit save error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Memory</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo Preview */}
        {memory.photo && (
          <Image source={{ uri: memory.photo }} style={styles.imagePreview} />
        )}

        {/* Editable Fields */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={memory.note}
            onChangeText={text => setMemory({ ...memory, note: text })}
            multiline
            textAlignVertical="top"
            placeholder="What happened that day?"
            placeholderTextColor={COLORS.muted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Mood</Text>
          <TextInput
            style={styles.input}
            value={memory.mood}
            onChangeText={text => setMemory({ ...memory, mood: text })}
            placeholder="How were you feeling?"
            placeholderTextColor={COLORS.muted}
          />
        </View>

        {/* Read-only Fields */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>
              {memory.date ? new Date(memory.date).toLocaleString() : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>
              {memory.location || 
                (memory.coordinate ? 
                  `${memory.coordinate.latitude.toFixed(6)}, ${memory.coordinate.longitude.toFixed(6)}` 
                  : 'N/A')}
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={!memory.note?.trim()}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: BORDERS.widthSm,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: SPACING.sm,
    padding: SPACING.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: BORDERS.radiusSm,
    borderWidth: BORDERS.widthSm,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
    ...SHADOWS.light,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: SPACING.sm,
  },
  readOnlyField: {
    backgroundColor: '#f8f9fa',
    borderRadius: BORDERS.radiusSm,
    padding: SPACING.sm,
    borderWidth: BORDERS.widthSm,
    borderColor: COLORS.border,
  },
  readOnlyText: {
    color: COLORS.muted,
    fontSize: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: BORDERS.radiusMd,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDERS.radiusMd,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.lg,
    ...SHADOWS.light,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditMemoryScreen;