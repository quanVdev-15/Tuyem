// CustomPopup.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CustomPopup = ({
  data,
  onAddPhoto,
  onChangeNote,
  onSetMood,
  onLayout,
  onSave,
  onDelete,
  isExisting,
}) => {
  const emojis = ["😍", "🤭", "😌", "🥹"];

  return (
    <View style={styles.popupContainer} onLayout={onLayout}>
      <Text style={styles.popupTitle}>
        💕 Memory at {data.locationName || "Hanoi"}
      </Text>
      {data.fullAddress && (
        <Text style={styles.addressText}>📍 {data.fullAddress}</Text>
      )}

      {data.photo ? (
        <Image source={{ uri: data.photo }} style={styles.photo} />
      ) : (
        <TouchableOpacity onPress={onAddPhoto} style={styles.addPhotoButton}>
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={24} color="#1F2937" />
          </View>
          <Text style={styles.addPhotoText}>Capture Memory</Text>
        </TouchableOpacity>
      )}

      <TextInput
        placeholder="Write something special..."
        value={data.note}
        onChangeText={onChangeNote}
        style={styles.input}
        multiline
      />

      <View style={styles.popupButtons}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(data)}
        >
          <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={onSave}>
          <Text style={styles.saveButtonText}>
            {isExisting ? "💾 Save Changes" : "💾 Save Memory"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  popupContainer: {
    backgroundColor: "#F8FAFC",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E0F2FE",
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 320,
    elevation: 6,
  },
  popupTitle: {
    fontSize: 20,
    fontFamily: "System",
    fontWeight: "700",
    color: "#0C4A6E",
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  popupDate: {
    fontSize: 13,
    color: "#38BDF8",
    marginBottom: 16,
    fontWeight: "500",
  },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#E0F2FE",
  },
  addPhotoButton: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#BAE6FD",
    borderStyle: "dashed",
    marginBottom: 16,
  },
  addPhotoText: {
    color: "#0EA5E9",
    marginTop: 8,
    fontWeight: "600",
    fontSize: 15,
  },
  input: {
    borderWidth: 2,
    borderColor: "#BAE6FD",
    borderRadius: 12,
    padding: 12,
    width: "100%",
    marginBottom: 16,
    fontSize: 15,
    minHeight: 60,
    textAlignVertical: "top",
    backgroundColor: "#FFFFFF",
    fontWeight: "500",
    color: "#0C4A6E",
    lineHeight: 22,
  },
 
  cameraIcon: {
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 12,
    borderRadius: 50,
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: "#0EA5E9",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1, // grow
    marginLeft: 8, // small gap from delete button
    alignItems: "center", // center the text
    elevation: 3,
  },
  saveButtonText: {
    color: "#FFFFFF", // White text color
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#F8FAFC", // Example red color
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "flex-start", // Position to the left
    elevation: 3, // Add a subtle shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginLeft: 0, // Ensure it's aligned to the start
  },
  deleteButtonText: {
    color: "#0EA5E9", // White text color
    fontSize: 16,
    fontWeight: "600",
  },
  popupButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  addressText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
});

export default CustomPopup;
