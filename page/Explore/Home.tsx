// GalleryScreen.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    Animated,
} from "react-native";
import MasonryList from "@react-native-seoul/masonry-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Permissions from "expo-modules-core";
import { PanGestureHandler } from "react-native-gesture-handler";
import { SearchBar } from "react-native-elements";
import MapView, { Marker } from "react-native-maps"; // ADD THIS LINE
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { styles } from "./Home.style";
import CustomAlert from "@/components/CustomAlert"; // Adjust the path if necessary
const { width } = Dimensions.get("window");
const formatDate = (dateString) => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "Unknown date";
    }
};

const GalleryItem = React.memo(
    ({ item, onPress, onLongPress, isSelected, selectionMode }) => {
        const [imageExists, setImageExists] = useState(false);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(false);

        useEffect(() => {
            const checkFile = async () => {
                if (item.photo) {
                    try {
                        const { exists } = await FileSystem.getInfoAsync(item.photo);
                        setImageExists(exists);
                    } catch (error) {
                        console.warn("Error checking file:", error);
                        setImageExists(false);
                    } finally {
                        setLoading(false);
                    }
                } else {
                    setLoading(false);
                }
            };
            checkFile();
        }, [item.photo]);

        if (loading) {
            return (
                <View style={styles.itemContainer}>
                    <ActivityIndicator size="small" color="#666" />
                </View>
            );
        }

        const id = `<span class="math-inline">\{item\.date\}\-</span>{item.coordinate?.latitude}-${item.coordinate?.longitude}`;

        return (
            <TouchableOpacity
                accessible={true}
                accessibilityLabel={`Memory from ${formatDate(item.date)}`}
                accessibilityHint={
                    selectionMode
                        ? isSelected
                            ? "Deselect memory"
                            : "Select memory"
                        : "Double tap to view details"
                }
                style={[
                    styles.itemContainer,
                    selectionMode && isSelected && styles.selectedItem,
                ]}
                onPress={() => (selectionMode ? onPress(item) : onPress(item))}
                onLongPress={() => (selectionMode ? undefined : onLongPress(item))}
            >
                {selectionMode && (
                    <View style={styles.checkbox}>
                        <Ionicons
                            name={isSelected ? "checkbox" : "square-outline"}
                            size={24}
                            color="#fff"
                        />
                    </View>
                )}
                {imageExists && !error ? (
                    <Image
                        source={{ uri: item.photo }}
                        style={styles.image}
                        resizeMode="cover"
                        onError={() => setError(true)}
                        fadeDuration={300}
                    />
                ) : (
                    <View style={styles.noPhoto}>
                        <Ionicons name="image-outline" size={32} color="#757575" />
                        <Text style={styles.noPhotoText}>Photo unavailable</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    }
);

const GalleryScreen = () => {
    const { memories: memoriesString } = useLocalSearchParams();
    const [selectedMemory, setSelectedMemory] = useState(null);
    const [memories, setMemories] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const router = useRouter();
    const overlayTranslateX = useRef(new Animated.Value(width * 0.8)).current; // Adjust initial position
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredMemories, setFilteredMemories] = useState([]);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const memoriesRef = useRef(memories); // Add a ref to track memories

    const [isAlertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState("");
    const [alertMessage, setAlertMessage] = useState("");
    const [onAlertConfirm, setOnAlertConfirm] = useState(null);

    const showAlert = useCallback((title, message, onConfirmAction) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setOnAlertConfirm(() => onConfirmAction);
        setAlertVisible(true);
    }, [setAlertTitle, setAlertMessage, setOnAlertConfirm, setAlertVisible]);

    const hideAlert = useCallback(() => {
        setAlertVisible(false);
        setOnAlertConfirm(null);
    }, [setAlertVisible, setOnAlertConfirm]);

    const handleAlertConfirm = useCallback(() => {
        if (onAlertConfirm) {
            onAlertConfirm();
        }
        hideAlert();
    }, [onAlertConfirm, hideAlert]);

    const requestLocationPermission = useCallback(async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            console.warn("Location permission not granted");
            return false;
        }
        return true;
    }, []);

    const reverseGeocode = useCallback(
        async (lat: number, lng: number): Promise<string> => {
            try {
                const result = await Location.reverseGeocodeAsync({
                    latitude: lat,
                    longitude: lng,
                });
                return (
                    [result[0]?.city, result[0]?.street].filter(Boolean).join(", ") ||
                    "Unknown location"
                );
            } catch (error) {
                console.warn("Reverse geocode failed:", error);
                return "Unknown location";
            }
        },
        []
    );

    const loadMemories = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const stored = await AsyncStorage.getItem("memories");
            const initialValue = stored ? JSON.parse(stored) : [];
            const validMemories = Array.isArray(initialValue)
                ? initialValue.filter(
                    (item) =>
                        item && typeof item === "object" && item.coordinate && item.date
                )
                : [];

            const hasPermission = await requestLocationPermission();

            const memoriesWithLocation = await Promise.all(
                validMemories.map(async (memory) => ({
                    ...memory,
                    location:
                        memory.coordinate && hasPermission
                            ? await reverseGeocode(
                                memory.coordinate.latitude,
                                memory.coordinate.longitude
                            )
                            : null,
                }))
            );

            const memoriesWithDates = memoriesWithLocation.map((memory) => ({
                ...memory,
                date: new Date(memory.date),
            }));

            setMemories(memoriesWithDates);
        } catch (error) {
            console.warn("❌ Failed to load memories:", error);
            showAlert("Error", "Failed to load memories.", hideAlert);
        } finally {
            setIsRefreshing(false);
        }
    }, [reverseGeocode, requestLocationPermission, showAlert, hideAlert]);

    useEffect(() => {
        loadMemories();
    }, [loadMemories]);

    // Update the ref whenever memories state changes
    useEffect(() => {
        memoriesRef.current = memories;
    }, [memories]);

    const processMemoriesString = useCallback(async (memoriesString) => {
        try {
            const parsedMemories = JSON.parse(memoriesString);
            const validMemories = Array.isArray(parsedMemories)
                ? parsedMemories.filter(
                    (item) =>
                        item &&
                        typeof item === "object" &&
                        item.coordinate &&
                        item.date
                )
                : [];

            const hasPermission = await requestLocationPermission();
            const memoriesWithLocation = await Promise.all(
                validMemories.map(async (memory) => ({
                    ...memory,
                    location:
                        memory.coordinate && hasPermission
                            ? await reverseGeocode(
                                memory.coordinate.latitude,
                                memory.coordinate.longitude
                            )
                            : null,
                }))
            );
            const memoriesWithDates = memoriesWithLocation.map((memory) => ({
                ...memory,
                date: new Date(memory.date),
            }));

            const areMemoriesEqual = (arr1: any[], arr2: any[]): boolean => {
                if (arr1.length !== arr2.length) return false;
                for (let i = 0; i < arr1.length; i++) {
                    if (JSON.stringify(arr1[i]) !== JSON.stringify(arr2[i]))
                        return false;
                }
                return true;
            };

            if (!areMemoriesEqual(memoriesWithDates, memoriesRef.current)) {
                setMemories(memoriesWithDates);
            }
        } catch (error) {
            console.warn("❌ Failed to load memories from route:", error);
            showAlert("Error", "Failed to load memories from route.", hideAlert);
        }
    }, [requestLocationPermission, reverseGeocode, showAlert, hideAlert]);

    useEffect(() => {
        if (memoriesString) {
            processMemoriesString(memoriesString);
        }
    }, [memoriesString, processMemoriesString]);

    const filterMemories = useCallback(() => {
        const lowerQuery = searchQuery.toLowerCase();
        return memories.filter((memory) => {
            return (
                memory.mood?.toLowerCase().includes(lowerQuery) ||
                memory.note?.toLowerCase().includes(lowerQuery) ||
                memory.location?.toLowerCase().includes(lowerQuery) ||
                formatDate(memory.date).toLowerCase().includes(lowerQuery)
            );
        });
    }, [searchQuery, memories]);

    useEffect(() => {
        setFilteredMemories(filterMemories());
    }, [searchQuery, memories, filterMemories]);

    const onRefresh = useCallback(() => {
        loadMemories();
    }, [loadMemories]);

    const handleMemoryPress = useCallback((memory) => {
        if (!selectionMode) {
            setSelectedMemory(memory);
            Animated.timing(overlayTranslateX, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            toggleSelection(memory);
        }
    }, [selectionMode, overlayTranslateX, setSelectedMemory, toggleSelection]);

    const handleCloseOverlay = useCallback(() => {
        Animated.timing(overlayTranslateX, {
            toValue: width * 0.8,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setSelectedMemory(null));
    }, [overlayTranslateX, setSelectedMemory]);

    const handleDeleteMemory = useCallback(async (memoryToDelete) => {
        showAlert(
            "Delete Memory",
            "Are you sure you want to delete this memory?",
            async () => {
                try {
                    const updatedMemories = memories.filter(
                        (memory) =>
                            memory.date !== memoryToDelete.date ||
                            JSON.stringify(memory.coordinate) !==
                            JSON.stringify(memoryToDelete.coordinate)
                    );

                    await AsyncStorage.setItem("memories", JSON.stringify(updatedMemories));
                    setMemories(updatedMemories);
                    handleCloseOverlay();
                    showAlert("Success", "Memory deleted successfully", hideAlert);
                } catch (error) {
                    showAlert("Error", "Failed to delete memory", hideAlert);
                    console.error("Delete error:", error);
                }
            }
        );
    }, [memories, showAlert, hideAlert, handleCloseOverlay]);

    const toggleSelection = useCallback((memory) => {
        if (
            !memory?.date ||
            !memory?.coordinate?.latitude ||
            !memory?.coordinate?.longitude
        ) {
            return;
        }
        const id = `<span class="math-inline">\{memory\.date\}\-</span>{memory.coordinate.latitude}-${memory.coordinate.longitude}`;
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    }, [setSelectedIds]);

    const handleBatchDelete = useCallback(async () => {
        if (selectedIds.length === 0) {
            showAlert("No Memories Selected", "Please select memories to delete.", hideAlert);
            return;
        }

        showAlert(
            "Delete Memories",
            `Are you sure you want to delete ${selectedIds.length} memories?`,
            async () => {
                try {
                    const updatedMemories = memories.filter((m) => {
                        const id = `<span class="math-inline">\{m\.date\}\-</span>{m.coordinate.latitude}-${m.coordinate.longitude}`;
                        return !selectedIds.includes(id);
                    });
                    await AsyncStorage.setItem(
                        "memories",
                        JSON.stringify(updatedMemories)
                    );
                    setMemories(updatedMemories);
                    setSelectionMode(false);
                    setSelectedIds([]);
                    showAlert("Success", "Memories deleted successfully", hideAlert);
                } catch (error) {
                    showAlert("Error", "Failed to delete memories", hideAlert);
                    console.error("Batch delete error:", error);
                }
            }
        );
    }, [selectedIds, memories, showAlert, hideAlert, setMemories, setSelectionMode, setSelectedIds]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <View style={styles.header}>
                    {selectionMode ? (
                        <TouchableOpacity
                            onPress={() => {
                                setSelectionMode(false);
                                setSelectedIds([]);
                            }}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.memoryCount}>Memories ({memories.length})</Text>
                    )}
                    <TouchableOpacity onPress={() => setSelectionMode(!selectionMode)}>
                        <Ionicons
                            name={selectionMode ? "checkbox" : "checkbox-outline"}
                            size={24}
                            color="#333"
                        />
                    </TouchableOpacity>
                    {selectionMode && selectedIds.length > 0 && (
                        <TouchableOpacity
                            style={styles.batchDeleteButton}
                            onPress={handleBatchDelete}
                        >
                            <Ionicons name="trash-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>

                <SearchBar
                    placeholder="Search memories..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    containerStyle={styles.searchContainer}
                    inputContainerStyle={styles.searchInput}
                    inputStyle={styles.searchText}
                    searchIcon={<Ionicons name="search" size={20} color="#888" />}
                />

                <ScrollView
                    style={styles.galleryContainer}
                    onScroll={() => selectedMemory && handleCloseOverlay()}
                    scrollEventThrottle={400}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                    }
                >
                    {filteredMemories.length === 0 && searchQuery !== "" ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="alert-outline" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>
                                No memories found matching your search
                            </Text>
                        </View>
                    ) : filteredMemories.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="map" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>Your memory book is empty</Text><TouchableOpacity
                                style={styles.emptyButton}
                                onPress={() => router.push("/(tabs)")}
                            >
                                <Text style={styles.emptyButtonText}>
                                    <Ionicons name="camera" size={16} /> Create First Memory
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <MasonryList
                            data={filteredMemories}
                            renderItem={({ item }) => {
                                const id = `<span class="math-inline">\{item\.date\}\-</span>{item.coordinate?.latitude}-${item.coordinate?.longitude}`;
                                return (
                                    <GalleryItem
                                        item={item}
                                        onPress={handleMemoryPress}
                                        onLongPress={handleMemoryPress}
                                        isSelected={selectedIds.includes(id)}
                                        selectionMode={selectionMode}
                                    />
                                );
                            }}
                            keyExtractor={(item, index) => index.toString()}
                            numColumns={2}
                            showsVerticalScroll
                            scrollIndicator={false}
                            contentContainerStyle={styles.listContent}
                            maxToRenderPerBatch={8}
                            windowSize={11}
                            initialNumToRender={10}
                            removeClippedSubviews={true}
                        />
                    )}
                </ScrollView>

                {selectedMemory && (
                    <View style={styles.backdropContainer}>
                        <TouchableOpacity
                            style={styles.backdrop}
                            activeOpacity={1}
                            onPress={handleCloseOverlay}
                        />
                        <PanGestureHandler
                            onGestureEvent={({ nativeEvent }) => {
                                if (nativeEvent.translationX > 50) {
                                    handleCloseOverlay();
                                }
                            }}
                        >
                            <Animated.View
                                style={[
                                    styles.detailOverlay,
                                    { transform: [{ translateX: overlayTranslateX }] },
                                ]}
                            >
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => {
                                        showAlert(
                                            "Delete Memory",
                                            "Are you sure you want to delete this memory?",
                                            () => handleDeleteMemory(selectedMemory)
                                        );
                                    }}
                                >
                                    <Ionicons name="trash" size={20} color="#fff" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() =>
                                        router.push({
                                            pathname: "/edit",
                                            params: { memory: JSON.stringify(selectedMemory) },
                                        })
                                    }
                                >
                                    <Ionicons name="create" size={20} color="#fff" />
                                </TouchableOpacity>

                                <View style={styles.detailContent}>
                                    <View style={styles.detailCard}>
                                        <Text style={styles.detailText}>
                                            <Text style={styles.label}>Mood:</Text>{" "}
                                            {selectedMemory?.mood || "N/A"}
                                        </Text>
                                        <Text style={styles.detailText}>
                                            <Text style={styles.label}>Note:</Text>{" "}
                                            {selectedMemory?.note || "No note"}
                                        </Text>
                                        <Text style={styles.detailText}>
                                            <Text style={styles.label}>Date:</Text>{" "}
                                            {formatDate(selectedMemory?.date)}
                                        </Text>
                                        {selectedMemory?.location && (
                                            <Text style={styles.detailText}>
                                                <Text style={styles.label}>Location:</Text>{" "}
                                                {selectedMemory?.location}
                                            </Text>
                                        )}
                                        {selectedMemory?.coordinate && (
                                            <TouchableOpacity
                                                style={styles.viewOnMapButton}
                                                onPress={() => {
                                                    const params = {
                                                        latitude: selectedMemory.coordinate.latitude,
                                                        longitude: selectedMemory.coordinate.longitude,
                                                        memory: JSON.stringify(selectedMemory),
                                                    };
                                                    console.log("Navigating with params:", params);
                                                    router.push({
                                                        pathname: "/(tabs)",
                                                        params: params,
                                                    });
                                                }}
                                            >
                                                <Text style={styles.viewOnMapButtonText}>
                                                    View on Map
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {selectedMemory?.coordinate && (
                                        <View style={styles.mapContainer}>
                                            <MapView
                                                style={styles.mapPreview}
                                                initialRegion={{
                                                    ...selectedMemory.coordinate,
                                                    latitudeDelta: 0.005,
                                                    longitudeDelta: 0.005,
                                                }}
                                                scrollEnabled={false}
                                                zoomEnabled={false}
                                            >
                                                <Marker coordinate={selectedMemory.coordinate} />
                                            </MapView>
                                        </View>
                                    )}
                                </View>
                            </Animated.View>
                        </PanGestureHandler>
                    </View>
                )}
            </View>
            <CustomAlert
                isVisible={isAlertVisible}
                onClose={hideAlert}
                title={alertTitle}
                message={alertMessage}
                onConfirm={onAlertConfirm ? handleAlertConfirm : null}
            />
        </GestureHandlerRootView>
    );
};

export default GalleryScreen;