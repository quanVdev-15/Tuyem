// MapScreen.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps"; // Import Callout
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomPopup from "@/components/CustomPopUp";
import CustomAlert from "@/components/CustomAlert";
import { reverseGeocode } from "@/components/geocoding"; // Assuming geocode.js is in your utils directory
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const POPUP_WIDTH = 300; // Set your desired popup width
const POPUP_MARGIN = 20;

// Calculate vertical position
const calculateVerticalPosition = (popupPos, popupHeight) => {
  const estimatedPopupHeight = 400; // Default estimate, replaced after first render
  const actualPopupHeight = popupHeight || estimatedPopupHeight;

  // Available space above and below the marker
  const spaceAbove = popupPos.y - POPUP_MARGIN;
  const spaceBelow = SCREEN_HEIGHT - popupPos.y - POPUP_MARGIN;

  // Position above if there's more space or if it doesn't fit below
  if (spaceBelow < actualPopupHeight && spaceAbove >= actualPopupHeight) {
    return Math.max(POPUP_MARGIN, popupPos.y - actualPopupHeight - 30);
  }

  // Position below otherwise
  return Math.min(
    popupPos.y + 30,
    SCREEN_HEIGHT - actualPopupHeight - POPUP_MARGIN
  );
};

// Calculate horizontal position
const calculateHorizontalPosition = (popupPos) => {
  // Center popup relative to marker
  const idealLeft = popupPos.x - POPUP_WIDTH / 2;

  // Keep within screen bounds
  return Math.max(
    POPUP_MARGIN,
    Math.min(idealLeft, SCREEN_WIDTH - POPUP_WIDTH - POPUP_MARGIN)
  );
};

const MapScreen = () => {
  const router = useRouter();
  const mapRef = useRef(null);
  const isPoiPress = useRef(false);
  const isMarkerPress = useRef(false);

  const [marker, setMarker] = useState(null);
  const [popupPos, setPopupPos] = useState(null);
  const [memories, setMemories] = useState([]);
  const [editingMemory, setEditingMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAlertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [onAlertConfirm, setOnAlertConfirm] = useState(null);
  const [popupHeight, setPopupHeight] = useState(null);
  const [selectedMemoryFromGallery, setSelectedMemoryFromGallery] =
    useState(null); // New state

  const [initialMapRegion, setInitialMapRegion] = useState({
    latitude: 21.0285,
    longitude: 105.8542,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const {
    latitude: initialLatitude,
    longitude: initialLongitude,
    memory: memoryString,
  } = useLocalSearchParams();

  useEffect(() => {
    if (memoryString) {
      try {
        setSelectedMemoryFromGallery(JSON.parse(memoryString));
      } catch (error) {
        console.error("Error parsing memory from gallery:", error);
      }
    }
    if (initialLatitude && initialLongitude) {
      const lat = parseFloat(initialLatitude);
      const lng = parseFloat(initialLongitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setInitialMapRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }
    }
  }, [initialLatitude, initialLongitude, memoryString]);

  const loadMemories = useCallback(async () => {
    try {
      const storedMemories = await AsyncStorage.getItem("memories");
      if (storedMemories) {
        setMemories(JSON.parse(storedMemories));
      } else {
        setMemories([]);
      }
    } catch (error) {
      console.error("Failed to load memories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemories(); // Load initially
  }, [loadMemories]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true); // Optionally show loading indicator
      loadMemories(); // Reload when the screen gains focus
    }, [loadMemories])
  );

  useEffect(() => {
    if (mapRef.current && selectedMemoryFromGallery?.coordinate) {
      const { latitude, longitude } = selectedMemoryFromGallery.coordinate;
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        1000
      );
      // Optionally, you can also trigger a callout or highlight the marker here
      // For example, you could set a state to control which marker shows a callout.
    }
  }, [mapRef, selectedMemoryFromGallery]);

  const handlePoiPress = async (event) => {
    isPoiPress.current = true;
    const { coordinate, name } = event.nativeEvent;
    const locationInfo = { street: name, fullAddress: name }; // You might want to improve this with a more detailed geocode if needed

    setEditingMemory(null);
    setMarker({
      coordinate,
      photo: null,
      date: new Date(),
      note: "",
      locationName: locationInfo.street || locationInfo.fullAddress,
      fullAddress: locationInfo.fullAddress,
    });

    if (mapRef.current) {
      const point = await mapRef.current.pointForCoordinate(coordinate);
      setPopupPos(point);
    }
  };

  const handleMapPress = async (event) => {
    // Check if we're handling a POI press
    if (isMarkerPress.current || isPoiPress.current) {
      isMarkerPress.current = false;
      isPoiPress.current = false;
      return;
    }

    const { coordinate } = event.nativeEvent;
    const locationInfo = await reverseGeocode(
      coordinate.latitude,
      coordinate.longitude
    );

    setEditingMemory(null);
    setMarker({
      coordinate,
      photo: null,
      date: new Date(),
      note: "",
      locationName:
        locationInfo.street || locationInfo.quarter || locationInfo.city,
      fullAddress: locationInfo.fullAddress,
    });

    if (mapRef.current) {
      const point = await mapRef.current.pointForCoordinate(coordinate);
      setPopupPos(point);
    }
  };

  const handleMarkerPress = async (memory) => {
    isMarkerPress.current = true;

    let updatedMemory = { ...memory };
    if (!memory.locationName) {
      const locationInfo = await reverseGeocode(
        memory.coordinate.latitude,
        memory.coordinate.longitude
      );

      updatedMemory = {
        ...memory,
        locationName:
          locationInfo.street || locationInfo.quarter || locationInfo.city,
        fullAddress: locationInfo.fullAddress,
      };
    }

    setEditingMemory(updatedMemory);
    setMarker({
      ...updatedMemory,
      date: new Date(updatedMemory.date),
    });

    if (mapRef.current && updatedMemory.coordinate) {
      const point = await mapRef.current.pointForCoordinate(
        updatedMemory.coordinate
      );
      setPopupPos(point);
    }
  };

  const saveMemoryToStorage = async (updatedMemories) => {
    await AsyncStorage.setItem("memories", JSON.stringify(updatedMemories));
  };

  const handleSaveMemory = async () => {
    if (!marker) return;

    const memoryToSave = {
      ...marker,
      date: new Date(),
      locationName: marker.locationName,
      fullAddress: marker.fullAddress,
    };

    let updatedMemories;
    if (editingMemory) {
      const index = memories.findIndex(
        (m) =>
          m.coordinate.latitude === editingMemory.coordinate.latitude &&
          m.coordinate.longitude === editingMemory.coordinate.longitude
      );
      if (index !== -1) {
        const newMemories = [...memories];
        newMemories[index] = memoryToSave;
        updatedMemories = newMemories;
      } else {
        updatedMemories = [...memories, memoryToSave];
      }
    } else {
      updatedMemories = [...memories, memoryToSave];
    }

    setMemories(updatedMemories);
    await saveMemoryToStorage(updatedMemories);

    setMarker(null);
    setPopupPos(null);
    setEditingMemory(null);
    Alert.alert("Success", "Memory saved with location!");
  };

  const showAlert = (title, message, onConfirmAction) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setOnAlertConfirm(() => onConfirmAction);
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
    setOnAlertConfirm(null);
  };

  const handleAlertConfirm = () => {
    if (onAlertConfirm) {
      onAlertConfirm();
    }
    hideAlert();
  };

  const showDeleteConfirmation = (memory) => {
    showAlert(
      "Delete Memory?",
      "Are you sure you want to delete this memory?",
      () => handleDeleteMemory(memory)
    );
  };

  const handleDeleteMemory = async (memoryToDelete) => {
    if (!memoryToDelete) return;

    const filteredMemories = memories.filter(
      (m) =>
        !(
          m.coordinate.latitude === memoryToDelete.coordinate.latitude &&
          m.coordinate.longitude === memoryToDelete.coordinate.longitude
        )
    );

    setMemories(filteredMemories);
    await saveMemoryToStorage(filteredMemories);

    setMarker(null);
    setPopupPos(null);
    setEditingMemory(null);
  };

  const savePhoto = async (uri) => {
    try {
      const permanentDir = `${FileSystem.documentDirectory}memories/`;
      await FileSystem.makeDirectoryAsync(permanentDir, {
        intermediates: true,
      });

      const filename = uri.split("/").pop();
      const newPath = `<span class="math-inline">\{permanentDir\}</span>{filename}`;

      await FileSystem.moveAsync({ from: uri, to: newPath });
      return newPath;
    } catch (error) {
      console.error("Saving photo failed:", error);
      return null;
    }
  };

  const addPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Allow camera permission to add photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const savedUri = await savePhoto(result.assets[0].uri);
      setMarker((prev) => ({ ...prev, photo: savedUri }));
    }
  };

  const updateNote = (text) => setMarker((prev) => ({ ...prev, note: text }));

  const handleRegionChangeComplete = () => {
    if (!isMarkerPress.current && marker) {
      setMarker(null);
      setPopupPos(null);
      setEditingMemory(null);
    }
    isMarkerPress.current = false;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={initialMapRegion}
        onPress={handleMapPress}
        onPoiClick={handlePoiPress}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {memories.map((memory, index) => (
          <Marker
            key={index}
            coordinate={memory.coordinate}
            onPress={() => handleMarkerPress(memory)}
          >
            {selectedMemoryFromGallery?.coordinate?.latitude ===
              memory.coordinate.latitude &&
              selectedMemoryFromGallery?.coordinate?.longitude ===
                memory.coordinate.longitude && (
                <Callout>
                  <Text>Viewed from Gallery</Text>
                  {memory.note && <Text>{memory.note}</Text>}
                </Callout>
              )}
          </Marker>
        ))}

        {marker && marker.coordinate && (
          <Marker coordinate={marker.coordinate}>
            <View />
          </Marker>
        )}
      </MapView>

      {marker && popupPos && (
        <View
          style={[
            styles.popupWrapper,
            {
              top: calculateVerticalPosition(popupPos, popupHeight),
              left: calculateHorizontalPosition(popupPos),
            },
          ]}
          onLayout={({ nativeEvent }) =>
            setPopupHeight(nativeEvent.layout.height)
          }
        >
          <CustomPopup
            data={marker}
            onAddPhoto={addPhoto}
            onChangeNote={updateNote}
            onSave={handleSaveMemory}
            onDelete={showDeleteConfirmation}
            isExisting={Boolean(editingMemory)}
          />
        </View>
      )}

      <CustomAlert
        isVisible={isAlertVisible}
        onClose={hideAlert}
        title={alertTitle}
        message={alertMessage}
        onConfirm={onAlertConfirm ? handleAlertConfirm : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,

    justifyContent: "center",

    alignItems: "center",

    backgroundColor: "#F8F9FA",
  },

  popupWrapper: {
    position: "absolute",

    zIndex: 5,

    shadowColor: "#2D3748",

    shadowOpacity: 0.16,

    shadowRadius: 24,

    shadowOffset: { width: 0, height: 8 },
  },
});

export default MapScreen;
