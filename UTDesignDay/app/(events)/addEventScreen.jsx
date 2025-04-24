import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Platform
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import FormFields from "@/components/FormFields";
import { useAuth } from "@/context/authContext";
import Toast from "react-native-toast-message";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";


const AddEventScreen = () => {
  const router = useRouter();
  const { authToken } = useAuth();
  const { eventId } = useLocalSearchParams();
  const isEditing = !!eventId;

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("Activity");
  const [duration, setDuration] = useState("");
  const [image, setImage] = useState(null);
  const navigation = useNavigation();

  // becasue iOS is dumb I have to create a custom back arrow ;(
  useEffect(() => {
    if (Platform.OS === "ios") {
      navigation.setOptions({
        // Disable default back arrow
        headerBackVisible: false,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation]);

  useEffect(() => {
    if (isEditing) {
      fetch(`${API_URL}/events/${eventId}`)
        .then((res) => res.json())
        .then((event) => {
          setName(event.name);
          setLocation(event.location);
          setStartTime(event.startTime);
          setEndTime(event.endTime || "");
          setDuration(event.duration?.toString() || "");
          setDescription(event.description);
          setEventType(event.eventType);
          setImage(event.image);
        })
        .catch(console.error);
    }
  }, [eventId]);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name || !location || !startTime || (!duration && !endTime) || !description || !image) {
      Toast.show({
        type: "error",
        text1: "Creating Event Failed ❌",
        text2: "Please fill out all fields.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("location", location.trim());
    formData.append("startTime", startTime.trim());
    if (eventType !== "Show") formData.append("endTime", endTime.trim());
    if (eventType === "Show") formData.append("duration", duration.trim());
    formData.append("description", description.trim());
    formData.append("eventType", eventType.trim());

    if (image && !image.startsWith("http")) {
      const filename = image.split("/").pop();
      const fileType = filename.split(".").pop();
      formData.append("image", {
        uri: image,
        name: filename,
        type: `image/${fileType}`,
      });
    } else {
      formData.append("image", image);
    }

    try {
      const res = await fetch(
        isEditing ? `${API_URL}/events/${eventId}` : `${API_URL}/events`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        }
      );

      if (res.ok) {
        Toast.show({
          type: "success",
          text1: "Success 🎉",
          text2: isEditing ? "Event updated successfully!" : "Event created successfully!",
        });
        router.replace("/(tabs)/events");
      } else {
        const data = await res.json();
        Toast.show({
          type: "error",
          text1: "Failed to submit event.",
          text2: data?.error || "Something went wrong.",
        });
      }
    } catch (err) {
      console.error("Error:", err);
      Toast.show({
        type: "error",
        text1: "Failed to submit event.",
        text2: "Please try again later.",
      });
    }
  };

  return (
    <SafeAreaView  style={{ flex: 1, backgroundColor: "#fff" }} edges={['bottom']}>
    
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.uploadBox} onPress={handleImagePick}>
          {image ? (
            <Image source={{ uri: image }} style={styles.uploadedImage} />
          ) : (
            <>
              <MaterialIcons name="upload" size={28} color="#003058" />
              <Text style={{ color: "#003058", marginTop: 5 }}>Click to upload image</Text>
              <Text style={styles.imageNote}>JPG, PNG, HEIC, HEIF (10 MB max)</Text>
            </>
          )}
        </TouchableOpacity>

        {!isEditing && (
          <>
            <Text style={styles.subtitle}>Select Event Type</Text>
            <View style={styles.eventTypeContainer}>
              {["Activity", "Show", "Exhibit"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.eventTypeButton, eventType === type && styles.activeType]}
                  onPress={() => setEventType(type)}
                >
                  <Text style={[styles.eventTypeText, eventType === type && { color: "white" }]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <FormFields label="Event Name" placeholder="Enter event name" value={name} onChangeText={setName} />
        <FormFields label="Location" placeholder="SET 1st Floor" value={location} onChangeText={setLocation} />
        <FormFields label="Start Time" placeholder="e.g. 10 AM or 5:45 PM if minutes" value={startTime} onChangeText={setStartTime} />

        {eventType === "Show" ? (
          <FormFields
          label="Duration in minutes"
          placeholder="Enter a number e.g. 30"
          value={duration}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9]/g, '');
            setDuration(cleaned);
          }}
          keyboardType="numeric"
        />
        ) : (
          <FormFields label="End Time" placeholder="e.g. 8pm" value={endTime} onChangeText={setEndTime} />
        )}

        <FormFields
          label="Description"
          placeholder="Enter description"
          value={description}
          onChangeText={setDescription}
          multiline
        />



        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>{isEditing ? "Update Event" : "Add Event"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "white",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#003058",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#003058",
    marginBottom: 10,
    marginTop: 10,
  },
  uploadBox: {
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ccc",
    borderStyle: "dashed",
    padding: 25,
    borderRadius: 10,
    marginBottom: 20,
  },
  uploadedImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    borderRadius: 10,
  },
  imageNote: {
    fontSize: 12,
    color: "gray",
    marginTop: 5,
  },
  eventTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  eventTypeButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    width: "30%",
    alignItems: "center",
  },
  activeType: {
    backgroundColor: "#003058",
  },
  eventTypeText: {
    fontWeight: "bold",
    color: "#003058",
  },
  submitButton: {
    backgroundColor: "#BA1C21",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default AddEventScreen;
